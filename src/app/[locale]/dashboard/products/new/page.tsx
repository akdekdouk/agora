"use client";

import { useState, useRef, useEffect, FormEvent } from "react";
import { useRouter } from "@/i18n/navigation";
import { Link } from "@/i18n/navigation";
import { useTranslations, useLocale } from "next-intl";
import { useSession } from "next-auth/react";
import ProductCard from "@/components/ProductCard";

interface Message {
  role: "user" | "assistant";
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

function extractFields(text: string): ProductFields {
  const match = text.match(/FIELDS_JSON:(\{[^\n]+\})/);
  if (!match) return {};
  try {
    return JSON.parse(match[1]) as ProductFields;
  } catch {
    return {};
  }
}

function stripFieldsJson(text: string): string {
  return text.replace(/\nFIELDS_JSON:\{[^\n]+\}/g, "").trim();
}

function isComplete(f: ProductFields): boolean {
  return !!(f.name && f.description && f.originalPrice && f.discountedPrice);
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
  const [error, setError] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const accumulatedRef = useRef("");

  // Kick off conversation on mount
  useEffect(() => {
    void startConversation();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function startConversation() {
    const greeting: Message = { role: "user", content: t("initialPrompt") };
    await sendMessages([greeting]);
  }

  async function sendMessages(msgs: Message[]) {
    setStreaming(true);
    setMessages((prev) => [...prev, ...msgs]);

    let assistantText = "";
    const assistantMsg: Message = { role: "assistant", content: "" };
    setMessages((prev) => [...prev, assistantMsg]);

    try {
      const res = await fetch("/api/ai/product-assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [...messages, ...msgs],
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
        accumulatedRef.current = assistantText;

        // Extract fields from partial text
        const extracted = extractFields(assistantText);
        if (Object.keys(extracted).length > 0) {
          setFields((prev) => ({ ...prev, ...extracted }));
        }

        // Update assistant message (strip JSON marker for display)
        setMessages((prev) => {
          const updated = [...prev];
          updated[updated.length - 1] = {
            role: "assistant",
            content: assistantText,
          };
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
    await sendMessages([{ role: "user", content: text }]);
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

  const previewFields = fields;
  const ready = isComplete(previewFields);

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

      {/* Body — two columns on md+ */}
      <div className="flex flex-1 overflow-hidden">
        {/* Chat panel */}
        <div className="flex flex-col flex-1 min-w-0 border-r border-gray-100">
          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
            {messages.map((msg, i) => {
              if (msg.role === "user") {
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
                    {display || (streaming && i === messages.length - 1 ? (
                      <span className="inline-block w-2 h-4 bg-orange-400 animate-pulse rounded" />
                    ) : "")}
                  </div>
                </div>
              );
            })}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className="shrink-0 px-4 py-3 bg-white border-t border-gray-100">
            {error && <p className="text-red-500 text-xs mb-2">{error}</p>}
            <form onSubmit={handleSend} className="flex gap-2">
              <input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={t("inputPlaceholder")}
                disabled={streaming}
                className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 disabled:opacity-50"
              />
              <button
                type="submit"
                disabled={streaming || !input.trim()}
                className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-xl text-sm font-semibold transition disabled:opacity-50"
              >
                {t("send")}
              </button>
            </form>
          </div>
        </div>

        {/* Preview panel */}
        <div className="hidden md:flex flex-col w-80 xl:w-96 shrink-0 overflow-y-auto p-4 gap-4">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">{t("preview")}</p>

          {ready ? (
            <ProductCard
              name={previewFields.name!}
              description={previewFields.description!}
              images={previewFields.imageUrl ? JSON.stringify([previewFields.imageUrl]) : "[]"}
              originalPrice={previewFields.originalPrice!}
              discountedPrice={previewFields.discountedPrice!}
              category={previewFields.category}
            />
          ) : (
            <div className="bg-white rounded-xl border border-dashed border-gray-200 h-64 flex items-center justify-center text-gray-400 text-sm text-center px-4">
              {t("previewEmpty")}
            </div>
          )}

          {/* Fields checklist */}
          <div className="bg-white rounded-xl border border-gray-100 p-4 space-y-2">
            <p className="text-xs font-semibold text-gray-500 mb-3">{t("fieldsCollected")}</p>
            {[
              { key: "name", label: t("fieldName"), value: previewFields.name },
              { key: "description", label: t("fieldDescription"), value: previewFields.description },
              { key: "originalPrice", label: t("fieldOriginalPrice"), value: previewFields.originalPrice != null ? `€${previewFields.originalPrice}` : undefined },
              { key: "discountedPrice", label: t("fieldDiscountedPrice"), value: previewFields.discountedPrice != null ? `€${previewFields.discountedPrice}` : undefined },
              { key: "category", label: t("fieldCategory"), value: previewFields.category, optional: true },
              { key: "imageUrl", label: t("fieldImage"), value: previewFields.imageUrl ? "✓" : undefined, optional: true },
            ].map(({ key, label, value, optional }) => (
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
      </div>

      {/* Mobile publish button */}
      {ready && (
        <div className="md:hidden shrink-0 px-4 py-3 bg-white border-t border-gray-100">
          <button
            onClick={handlePublish}
            disabled={publishing}
            className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold py-3 rounded-xl transition disabled:opacity-60"
          >
            {publishing ? t("publishing") : t("publish")}
          </button>
        </div>
      )}
    </div>
  );
}
