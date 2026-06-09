"use client";

import { useState, useRef, useEffect } from "react";
import { useTranslations, useLocale } from "next-intl";

interface Message {
  role: "user" | "assistant";
  content: string;
}

export default function AiChat() {
  const t = useTranslations("aiChat");
  const locale = useLocale();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    const text = input.trim();
    if (!text || loading) return;

    const newMessages: Message[] = [...messages, { role: "user", content: text }];
    setMessages(newMessages);
    setInput("");
    setLoading(true);

    const assistantMsg: Message = { role: "assistant", content: "" };
    setMessages([...newMessages, assistantMsg]);

    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: newMessages, locale }),
      });

      if (!res.body) throw new Error("No stream");
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let accumulated = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        accumulated += decoder.decode(value, { stream: true });
        setMessages([...newMessages, { role: "assistant", content: accumulated }]);
      }
    } catch {
      setMessages([...newMessages, { role: "assistant", content: t("error") }]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 bg-orange-500 hover:bg-orange-600 text-white rounded-full shadow-lg flex items-center justify-center text-2xl transition"
        aria-label="AI Assistant"
      >
        {open ? "✕" : "✨"}
      </button>

      {/* Chat panel */}
      {open && (
        <div className="fixed bottom-24 right-6 z-50 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-gray-100 flex flex-col overflow-hidden"
          style={{ maxHeight: "70vh" }}>
          {/* Header */}
          <div className="bg-gradient-to-r from-orange-500 to-orange-600 px-4 py-3 flex items-center gap-2">
            <span className="text-xl">✨</span>
            <div>
              <p className="text-white font-semibold text-sm">{t("title")}</p>
              <p className="text-orange-100 text-xs">{t("subtitle")}</p>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.length === 0 && (
              <div className="text-center py-6">
                <p className="text-gray-400 text-sm mb-3">{t("welcome")}</p>
                <div className="space-y-2">
                  {(t.raw("suggestions") as string[]).map((s, i) => (
                    <button
                      key={i}
                      onClick={() => { setInput(s); }}
                      className="block w-full text-left text-xs bg-orange-50 hover:bg-orange-100 text-orange-700 px-3 py-2 rounded-lg transition"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[80%] px-3 py-2 rounded-xl text-sm whitespace-pre-wrap ${
                  msg.role === "user"
                    ? "bg-orange-500 text-white"
                    : "bg-gray-100 text-gray-800"
                }`}>
                  {msg.content || (loading && i === messages.length - 1 ? "…" : "")}
                </div>
              </div>
            ))}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <form onSubmit={handleSend} className="border-t border-gray-100 p-3 flex gap-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={t("placeholder")}
              disabled={loading}
              className="flex-1 text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-400 disabled:opacity-60"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="bg-orange-500 hover:bg-orange-600 text-white px-3 py-2 rounded-lg text-sm font-medium transition disabled:opacity-50"
            >
              →
            </button>
          </form>
        </div>
      )}
    </>
  );
}
