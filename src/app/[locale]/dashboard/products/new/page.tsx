"use client";

import { useState, useRef, useEffect, FormEvent } from "react";
import { useRouter } from "@/i18n/navigation";
import { Link } from "@/i18n/navigation";
import { useTranslations, useLocale } from "next-intl";
import { useSession } from "next-auth/react";
import ProductCard from "@/components/ProductCard";

interface Message {
  role: "user" | "assistant" | "system_notice";
  content: string;
}

interface ProductFields {
  name?: string;
  description?: string;
  category?: string;
  originalPrice?: number;
  discountedPrice?: number;
  imageUrl?: string;
}

// Matches FIELDS_JSON:{...} anywhere in the text (with or without leading newline)
function extractFields(text: string): ProductFields {
  const match = text.match(/FIELDS_JSON:(\{[^}]*\})/);
  if (!match) return {};
  try {
    return JSON.parse(match[1]) as ProductFields;
  } catch {
    return {};
  }
}

function stripFieldsJson(text: string): string {
  return text.replace(/\n?FIELDS_JSON:\{[^}]*\}/g, "").trim();
}

function isComplete(f: ProductFields): boolean {
  return !!(f.name && f.description && f.originalPrice && f.discountedPrice && f.imageUrl);
}

export default function NewProductPage() {
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations("productAssistant");
  const { data: session } = useSession();
  const merchantName = session?.user?.name ?? "";

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [fields, setFields] = useState<ProductFields>({});
  const [publishing, setPublishing] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  // Mobile tab: "chat" | "preview"
  const [mobileTab, setMobileTab] = useState<"chat" | "preview">("chat");
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    void startConversation();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function startConversation() {
    const greeting = { role: "user" as const, content: t("initialPrompt") };
    await sendMessages([greeting]);
  }

  async function sendMessages(msgs: { role: "user" | "assistant"; content: string }[]) {
    setStreaming(true);
    setMessages((prev) => [...prev, ...msgs]);

    let assistantText = "";
    setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

    try {
      const res = await fetch("/api/ai/product-assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [...messages, ...msgs].filter((m) => m.role !== "system_notice"),
          locale,
          merchantName,
        }),
      });

      if (!res.ok || !res.body) throw new Error("Request failed");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        assistantText += chunk;

        const extracted = extractFields(assistantText);
        if (Object.keys(extracted).length > 0) {
          setFields((prev) => ({ ...prev, ...extracted }));
        }

        setMessages((prev) => {
          const updated = [...prev];
          updated[updated.length - 1] = { role: "assistant", content: assistantText };
          return updated;
        });
      }
    } catch {
      setError(t("error"));
    } finally {
      setStreaming(false);
      inputRef.current?.focus();
    }
  }

  async function handleSend(e: FormEvent) {
    e.preventDefault();
    const text = input.trim();
    if (!text || streaming) return;
    setInput("");
    setMobileTab("chat");
    await sendMessages([{ role: "user", content: text }]);
  }

  async function handleFileUpload(file: File) {
    setUploading(true);
    setError("");
    const form = new FormData();
    form.append("file", file);
    try {
      const res = await fetch("/api/upload", { method: "POST", body: form });
      const data = await res.json() as { path?: string; error?: string };
      if (!res.ok) throw new Error(data.error ?? t("uploadError"));
      if (data.path) {
        const url = data.path;
        setFields((prev) => ({ ...prev, imageUrl: url }));
        // Show a neutral status chip in the chat (not a user bubble)
        setMessages((prev) => [...prev, { role: "system_notice", content: t("photoUploaded") }]);
        // Send the URL to Claude as a system message so it stops asking
        await sendMessages([{ role: "user", content: `[SYSTÈME] Photo uploadée par le marchand : ${url}` }]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : t("uploadError"));
    } finally {
      setUploading(false);
    }
  }

  async function handlePublish() {
    if (!isComplete(fields)) return;
    setPublishing(true);
    setError("");
    try {
      const res = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: fields.name,
          description: fields.description,
          category: fields.category ?? null,
          originalPrice: fields.originalPrice,
          discountedPrice: fields.discountedPrice,
          images: fields.imageUrl ? JSON.stringify([fields.imageUrl]) : "[]",
        }),
      });
      if (!res.ok) {
        const data = await res.json() as { error?: string };
        setError(data.error ?? t("publishError"));
        setPublishing(false);
        return;
      }
      router.push("/dashboard/products");
    } catch {
      setError(t("publishError"));
      setPublishing(false);
    }
  }

  const ready = isComplete(fields);

  // ── Checklist used in both panels ──────────────────────────────────────────
  const checklistItems = [
    { key: "name", label: t("fieldName"), value: fields.name },
    { key: "description", label: t("fieldDescription"), value: fields.description },
    { key: "originalPrice", label: t("fieldOriginalPrice"), value: fields.originalPrice != null ? `€${fields.originalPrice}` : undefined },
    { key: "discountedPrice", label: t("fieldDiscountedPrice"), value: fields.discountedPrice != null ? `€${fields.discountedPrice}` : undefined },
    { key: "category", label: t("fieldCategory"), value: fields.category, optional: true },
    { key: "imageUrl", label: t("fieldImage"), value: fields.imageUrl ? "✓" : undefined },
  ];

  // ── Chat panel content ──────────────────────────────────────────────────────
  const chatPanel = (
    <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {messages.map((msg, i) => {
          if (msg.role === "system_notice") {
            return (
              <div key={i} className="flex justify-center">
                <span className="bg-green-50 text-green-600 border border-green-200 text-xs px-3 py-1 rounded-full">
                  📎 {msg.content}
                </span>
              </div>
            );
          }
          if (msg.role === "user") {
            // Hide [SYSTÈME] messages from the UI (sent internally to Claude)
            if (msg.content.startsWith("[SYSTÈME]")) return null;
            return (
              <div key={i} className="flex justify-end">
                <div className="bg-orange-500 text-white text-sm px-4 py-2 rounded-2xl rounded-tr-sm max-w-[80%]">
                  {msg.content}
                </div>
              </div>
            );
          }
          const display = stripFieldsJson(msg.content);
          return (
            <div key={i} className="flex justify-start">
              <div className="bg-white border border-gray-100 shadow-sm text-sm px-4 py-2 rounded-2xl rounded-tl-sm max-w-[80%] whitespace-pre-wrap">
                {display || (streaming && i === messages.length - 1
                  ? <span className="inline-block w-2 h-4 bg-orange-400 animate-pulse rounded" />
                  : "")}
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      <div className="shrink-0 px-4 py-3 bg-white border-t border-gray-100">
        {error && <p className="text-red-500 text-xs mb-2">{error}</p>}
        <form onSubmit={handleSend} className="flex gap-2 items-center">
          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])}
          />
          {/* Upload button */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={streaming || uploading}
            title={t("uploadPhoto")}
            className="text-gray-400 hover:text-orange-500 transition disabled:opacity-40 text-xl shrink-0"
          >
            {uploading ? "⏳" : "📎"}
          </button>
          <input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={t("inputPlaceholder")}
            disabled={streaming || uploading}
            className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={streaming || uploading || !input.trim()}
            className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-xl text-sm font-semibold transition disabled:opacity-50"
          >
            {t("send")}
          </button>
        </form>
      </div>
    </div>
  );

  // ── Preview panel content ───────────────────────────────────────────────────
  const previewPanel = (
    <div className="flex flex-col gap-4 p-4 overflow-y-auto">
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">{t("preview")}</p>

      {ready ? (
        <ProductCard
          name={fields.name!}
          description={fields.description!}
          images={fields.imageUrl ? JSON.stringify([fields.imageUrl]) : "[]"}
          originalPrice={fields.originalPrice!}
          discountedPrice={fields.discountedPrice!}
          category={fields.category}
        />
      ) : (
        <div className="bg-white rounded-xl border border-dashed border-gray-200 h-48 flex items-center justify-center text-gray-400 text-sm text-center px-4">
          {t("previewEmpty")}
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-100 p-4 space-y-2">
        <p className="text-xs font-semibold text-gray-500 mb-3">{t("fieldsCollected")}</p>
        {checklistItems.map(({ key, label, value, optional }) => (
          <div key={key} className="flex items-center gap-2 text-sm">
            <span className={`w-4 h-4 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${value ? "bg-green-100 text-green-600" : optional ? "bg-gray-100 text-gray-400" : "bg-orange-100 text-orange-400"}`}>
              {value ? "✓" : optional ? "–" : "·"}
            </span>
            <span className={`truncate ${value ? "text-gray-700" : "text-gray-400"}`}>
              {label}{value && value !== "✓" ? `: ${String(value).slice(0, 30)}` : ""}
            </span>
          </div>
        ))}
      </div>

      {ready && (
        <button
          onClick={handlePublish}
          disabled={publishing}
          className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold py-3 rounded-xl transition disabled:opacity-60"
        >
          {publishing ? t("publishing") : t("publish")}
        </button>
      )}
    </div>
  );

  return (
    <div className="flex flex-col h-screen max-h-screen bg-gray-50">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 bg-white border-b border-gray-100 shrink-0">
        <Link href="/dashboard/products" className="text-gray-400 hover:text-gray-600 text-lg">←</Link>
        <h1 className="text-lg font-bold text-gray-900">{t("title")}</h1>
        <span className="ml-auto text-xs text-orange-500 font-medium bg-orange-50 px-2 py-0.5 rounded-full">
          ✨ {t("aiPowered")}
        </span>
      </div>

      {/* Mobile tab bar */}
      <div className="md:hidden flex border-b border-gray-100 bg-white shrink-0">
        <button
          onClick={() => setMobileTab("chat")}
          className={`flex-1 py-2 text-sm font-medium transition ${mobileTab === "chat" ? "text-orange-500 border-b-2 border-orange-500" : "text-gray-400"}`}
        >
          💬 {t("tabChat")}
        </button>
        <button
          onClick={() => setMobileTab("preview")}
          className={`flex-1 py-2 text-sm font-medium transition ${mobileTab === "preview" ? "text-orange-500 border-b-2 border-orange-500" : "text-gray-400"}`}
        >
          👁 {t("tabPreview")}
          {ready && <span className="ml-1 w-2 h-2 bg-green-400 rounded-full inline-block" />}
        </button>
      </div>

      {/* Body */}
      <div className="flex flex-1 overflow-hidden">
        {/* Desktop: both panels side by side */}
        <div className={`flex-col flex-1 min-w-0 border-r border-gray-100 md:flex ${mobileTab === "chat" ? "flex" : "hidden"}`}>
          {chatPanel}
        </div>

        <div className={`flex-col w-full md:w-80 xl:w-96 shrink-0 overflow-hidden md:flex ${mobileTab === "preview" ? "flex" : "hidden"}`}>
          {previewPanel}
        </div>
      </div>
    </div>
  );
}
