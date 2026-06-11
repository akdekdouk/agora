"use client";

import { useState, useRef, useEffect } from "react";
import { useTranslations, useLocale } from "next-intl";

interface Message {
  role: "user" | "assistant";
  content: string;
}

declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    SpeechRecognition: any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    webkitSpeechRecognition: any;
  }
}

const LOCALE_LANG: Record<string, string> = {
  fr: "fr-FR", en: "en-US", es: "es-ES", it: "it-IT", ar: "ar-SA", tr: "tr-TR",
};

export default function AiChat() {
  const t = useTranslations("aiChat");
  const locale = useLocale();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [listening, setListening] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);
  const [micError, setMicError] = useState("");
  const [pos, setPos] = useState({ bottom: 24, right: 24 });
  const dragging = useRef(false);
  const dragStart = useRef({ x: 0, y: 0, bottom: 24, right: 24 });
  const hasDragged = useRef(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    setSpeechSupported(
      typeof window !== "undefined" &&
      ("SpeechRecognition" in window || "webkitSpeechRecognition" in window)
    );
  }, []);

  function toggleVoice() {
    setMicError("");
    if (listening) {
      recognitionRef.current?.stop();
      setListening(false);
      return;
    }
    const SR = window.SpeechRecognition ?? window.webkitSpeechRecognition;
    if (!SR) {
      setMicError("Microphone non supporté sur ce navigateur.");
      return;
    }
    const recognition = new SR();
    recognition.lang = LOCALE_LANG[locale] ?? "fr-FR";
    recognition.continuous = false;
    recognition.interimResults = false;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    recognition.onresult = (e: any) => {
      const transcript = e.results[0][0].transcript;
      setInput(transcript);
      setListening(false);
      setTimeout(() => sendMessage(transcript), 300);
    };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    recognition.onerror = (e: any) => {
      setListening(false);
      if (e.error === "not-allowed") {
        setMicError("Permission microphone refusée. Autorisez l'accès dans les réglages du navigateur.");
      } else if (e.error === "no-speech") {
        setMicError("Aucune voix détectée. Réessayez.");
      } else {
        setMicError("Erreur microphone : " + e.error);
      }
    };
    recognition.onend = () => setListening(false);
    recognitionRef.current = recognition;
    try {
      recognition.start();
      setListening(true);
    } catch {
      setMicError("Impossible de démarrer le microphone.");
    }
  }

  async function sendMessage(text: string) {
    if (!text.trim() || loading) return;
    const newMessages: Message[] = [...messages, { role: "user", content: text.trim() }];
    setMessages(newMessages);
    setInput("");
    setLoading(true);
    setMessages([...newMessages, { role: "assistant", content: "" }]);
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

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    await sendMessage(input);
  }

  function onPointerDown(e: React.PointerEvent) {
    dragging.current = true;
    hasDragged.current = false;
    dragStart.current = { x: e.clientX, y: e.clientY, bottom: pos.bottom, right: pos.right };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  }

  function onPointerMove(e: React.PointerEvent) {
    if (!dragging.current) return;
    const dx = e.clientX - dragStart.current.x;
    const dy = e.clientY - dragStart.current.y;
    if (Math.abs(dx) > 4 || Math.abs(dy) > 4) hasDragged.current = true;
    const newRight = Math.max(8, Math.min(window.innerWidth - 64, dragStart.current.right - dx));
    const newBottom = Math.max(8, Math.min(window.innerHeight - 64, dragStart.current.bottom - dy));
    setPos({ right: newRight, bottom: newBottom });
  }

  function onPointerUp(e: React.PointerEvent) {
    dragging.current = false;
    (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
    if (!hasDragged.current) setOpen((v) => !v);
  }

  return (
    <>
      {/* Floating button — draggable */}
      <button
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        className="fixed z-50 w-14 h-14 text-white rounded-full shadow-lg flex items-center justify-center text-2xl hover:opacity-90 select-none touch-none"
        style={{ backgroundColor: "var(--color-primary)", bottom: pos.bottom, right: pos.right, cursor: dragging.current ? "grabbing" : "grab" }}
        aria-label="AI Assistant"
      >
        {open ? "✕" : "✨"}
      </button>

      {/* Chat panel */}
      {open && (
        <div
          className="fixed z-50 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-gray-100 flex flex-col overflow-hidden"
          style={{ maxHeight: "70vh", bottom: pos.bottom + 64, right: pos.right }}
        >
          {/* Header */}
          <div
            className="px-4 py-3 flex items-center gap-2"
            style={{ background: "linear-gradient(to right, var(--color-primary), var(--color-primary-hover, #ea580c))" }}
          >
            <span className="text-xl">✨</span>
            <div>
              <p className="text-white font-semibold text-sm">{t("title")}</p>
              <p className="text-white/70 text-xs">{t("subtitle")}</p>
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
                      onClick={() => sendMessage(s)}
                      className="block w-full text-left text-xs px-3 py-2 rounded-lg transition"
                      style={{ backgroundColor: "var(--color-primary-light)", color: "var(--color-primary-text)" }}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[80%] px-3 py-2 rounded-xl text-sm whitespace-pre-wrap ${
                    msg.role === "user" ? "text-white" : "bg-gray-100 text-gray-800"
                  }`}
                  style={msg.role === "user" ? { backgroundColor: "var(--color-primary)" } : undefined}
                >
                  {msg.content || (loading && i === messages.length - 1 ? "…" : "")}
                </div>
              </div>
            ))}
            <div ref={bottomRef} />
          </div>

          {/* Mic error */}
          {micError && (
            <div className="px-3 py-2 bg-red-50 border-t border-red-100 text-xs text-red-600 flex items-center justify-between">
              <span>{micError}</span>
              <button onClick={() => setMicError("")} className="ml-2 text-red-400 hover:text-red-600">✕</button>
            </div>
          )}

          {/* Input */}
          <form onSubmit={handleSend} className="border-t border-gray-100 p-3 flex gap-2 items-center">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={listening ? "🎤 Parlez…" : t("placeholder")}
              disabled={loading}
              className="flex-1 text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 disabled:opacity-60"
              style={{ "--tw-ring-color": "var(--color-primary)" } as React.CSSProperties}
            />
            {speechSupported && (
              <button
                type="button"
                onClick={toggleVoice}
                disabled={loading}
                title={listening ? "Arrêter" : "Dicter"}
                className={`p-2 rounded-lg transition ${
                  listening
                    ? "text-red-500 bg-red-50 animate-pulse"
                    : "text-gray-400 hover:text-gray-600 hover:bg-gray-100"
                }`}
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm-1-9c0-.55.45-1 1-1s1 .45 1 1v6c0 .55-.45 1-1 1s-1-.45-1-1V5zm6 6c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/>
                </svg>
              </button>
            )}
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="text-white px-3 py-2 rounded-lg text-sm font-medium transition disabled:opacity-50"
              style={{ backgroundColor: "var(--color-primary)" }}
            >
              →
            </button>
          </form>
        </div>
      )}
    </>
  );
}
