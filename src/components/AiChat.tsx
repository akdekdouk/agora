"use client";

import { useState, useRef, useEffect } from "react";
import { useTranslations, useLocale } from "next-intl";
import { Link } from "@/i18n/navigation";

interface OfferCard {
  id: string;
  title: string;
  discount: number;
  merchantId: string;
  merchantName: string;
  merchantCategory: string;
  merchantCity: string;
  photo?: string | null;
}

interface Message {
  role: "user" | "assistant";
  content: string;
  offers?: OfferCard[];
}

const OFFERS_SENTINEL = "__OFFERS__";
const OFFERS_END = "__END__";

function parseMessage(raw: string): { text: string; offers: OfferCard[] } {
  const idx = raw.indexOf(OFFERS_SENTINEL);
  if (idx === -1) return { text: raw, offers: [] };
  const text = raw.slice(0, idx).trim();
  const jsonStr = raw.slice(idx + OFFERS_SENTINEL.length, raw.indexOf(OFFERS_END, idx));
  try {
    return { text, offers: JSON.parse(jsonStr) as OfferCard[] };
  } catch {
    return { text, offers: [] };
  }
}

const CATEGORY_EMOJI: Record<string, string> = {
  restaurant: "🍽️", shop: "🛍️", artisan: "🛠️", beauty: "💆", hotel: "🏨",
  education: "📚", health: "🏥", sport: "⚽", services: "🔧", other: "🏪",
};

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
  const [greeted, setGreeted] = useState(false);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [listening, setListening] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);
  const [micError, setMicError] = useState("");
  const [showTooltip, setShowTooltip] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);
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

  // Show a local greeting instantly on first open — no API call
  useEffect(() => {
    if (open && !greeted) {
      setGreeted(true);
      setMessages([{ role: "assistant", content: t("greeting") }]);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => {
    setSpeechSupported(
      typeof window !== "undefined" &&
      ("SpeechRecognition" in window || "webkitSpeechRecognition" in window)
    );
  }, []);

  useEffect(() => {
    const interacted = localStorage.getItem("agora_chat_interacted");
    if (interacted) { setHasInteracted(true); return; }
    const timer = setTimeout(() => setShowTooltip(true), 3000);
    return () => clearTimeout(timer);
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
      // Build clean API messages:
      // 1. Skip local greeting (index 0 if assistant)
      // 2. Remove empty assistant placeholders from previous failed requests
      // 3. Strip the 'offers' field — only role+content go to the API
      const raw = newMessages[0]?.role === "assistant" ? newMessages.slice(1) : newMessages;
      const apiMessages = raw
        .filter(m => m.role === "user" || (m.content ?? "").trim() !== "")
        .map(m => ({ role: m.role, content: m.content ?? "" }));
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: apiMessages, locale }),
      });
      if (!res.body) throw new Error("No stream");
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let accumulated = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        accumulated += decoder.decode(value, { stream: true });
        const { text, offers } = parseMessage(accumulated);
        setMessages([...newMessages, { role: "assistant", content: text, offers }]);
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
    if (!hasDragged.current) {
      setOpen((v) => !v);
      setShowTooltip(false);
      if (!hasInteracted) {
        setHasInteracted(true);
        localStorage.setItem("agora_chat_interacted", "1");
      }
    }
  }

  return (
    <>
      {/* Floating button — draggable */}
      <div className="fixed z-50 select-none touch-none" style={{ bottom: pos.bottom, right: pos.right }}>
        {/* Tooltip — shown after 3s on first visit */}
        {showTooltip && !open && (
          <div className="absolute bottom-16 right-0 w-52 bg-gray-900 text-white text-xs rounded-2xl px-3 py-2.5 shadow-xl pointer-events-none"
            style={{ animation: "fadeInUp 0.3s ease" }}>
            <p className="font-semibold mb-0.5">✨ Votre assistant Agora</p>
            <p className="text-white/70">Demandez-moi une offre, un commerce, une idée…</p>
            <div className="absolute bottom-[-6px] right-5 w-3 h-3 bg-gray-900 rotate-45" />
          </div>
        )}

        {/* Permanent slow pulse — always visible when closed */}
        {!open && (
          <span className="absolute inset-0 rounded-full opacity-30"
            style={{ backgroundColor: "var(--color-primary)", animation: "ping 2.5s cubic-bezier(0,0,0.2,1) infinite" }} />
        )}

        {/* Fast pulse ring — only before first interaction */}
        {!hasInteracted && !open && (
          <span className="absolute inset-0 rounded-full animate-ping opacity-50"
            style={{ backgroundColor: "var(--color-primary)" }} />
        )}

        <button
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          className="relative w-16 h-16 text-white rounded-full flex items-center justify-center hover:scale-110 transition-transform"
          style={{
            background: open
              ? "var(--color-primary)"
              : "linear-gradient(135deg, #ff9a3c, var(--color-primary), #d4460f)",
            boxShadow: open ? "0 4px 12px rgba(0,0,0,0.2)" : "0 8px 32px rgba(249,115,22,0.5)",
            cursor: dragging.current ? "grabbing" : "grab",
          }}
          aria-label="AI Assistant"
        >
          <span style={{ fontSize: open ? "18px" : "28px", transition: "font-size 0.2s", filter: open ? "none" : "drop-shadow(0 2px 4px rgba(0,0,0,0.3))" }}>
            {open ? "✕" : "✨"}
          </span>
          {/* "IA" label */}
          {!open && (
            <span className="absolute -top-1 -right-1 text-[9px] font-bold bg-white rounded-full w-5 h-5 flex items-center justify-center shadow"
              style={{ color: "var(--color-primary)" }}>
              IA
            </span>
          )}
        </button>
      </div>

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
            {messages.map((msg, i) => (
              <div key={i} className={`flex flex-col ${msg.role === "user" ? "items-end" : "items-start"}`}>
                {/* Text bubble */}
                {(msg.content || (loading && i === messages.length - 1)) && (
                  <div
                    className={`max-w-[85%] px-4 py-3 rounded-xl text-base leading-relaxed whitespace-pre-wrap ${
                      msg.role === "user" ? "text-white" : "bg-gray-100 text-gray-800"
                    }`}
                    style={msg.role === "user" ? { backgroundColor: "var(--color-primary)" } : undefined}
                  >
                    {msg.content || (loading && i === messages.length - 1 ? "…" : "")}
                  </div>
                )}

                {/* Suggestion chips below the first greeting message */}
                {msg.role === "assistant" && i === 0 && messages.length === 1 && !loading && (
                  <div className="mt-2 w-full space-y-1.5">
                    {(t.raw("suggestions") as string[]).map((s, si) => (
                      <button
                        key={si}
                        onClick={() => sendMessage(s)}
                        className="block w-full text-left text-sm px-3 py-2.5 rounded-xl border font-medium transition hover:opacity-80"
                        style={{ borderColor: "var(--color-primary)", color: "var(--color-primary)", background: "white" }}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                )}

                {/* Offer cards */}
                {msg.offers && msg.offers.length > 0 && (
                  <div className="mt-2 w-full space-y-2">
                    {msg.offers.map((offer) => (
                      <div key={offer.id} className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                        {offer.photo && (
                          <img src={offer.photo} alt={offer.title} className="w-full h-20 object-cover" />
                        )}
                        <div className="p-2.5">
                          <div className="flex items-start justify-between gap-2">
                            <p className="text-xs font-semibold text-gray-800 leading-tight flex-1">{offer.title}</p>
                            <span className="text-xs font-bold text-white px-2 py-0.5 rounded-full shrink-0"
                              style={{ backgroundColor: "var(--color-primary)" }}>
                              -{offer.discount}%
                            </span>
                          </div>
                          <p className="text-[11px] text-gray-500 mt-1">
                            {CATEGORY_EMOJI[offer.merchantCategory] ?? "🏪"} {offer.merchantName} · {offer.merchantCity}
                          </p>
                          <div className="flex gap-1.5 mt-2">
                            <Link
                              href={`/merchants/${offer.merchantId}`}
                              className="flex-1 text-center text-[11px] font-medium py-1 rounded-lg text-white"
                              style={{ backgroundColor: "var(--color-primary)" }}
                              onClick={() => setOpen(false)}
                            >
                              Voir l'offre →
                            </Link>
                            <a
                              href={`/map?highlight=${offer.merchantId}`}
                              className="flex-1 text-center text-[11px] font-medium py-1 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200"
                              onClick={() => setOpen(false)}
                            >
                              📍 Sur la carte
                            </a>
                          </div>
                        </div>
                      </div>
                    ))}
                    {msg.offers.length === 3 && (
                      <button
                        onClick={() => sendMessage("Ces offres ne me conviennent pas, peux-tu affiner avec d'autres critères ?")}
                        className="w-full text-xs text-center py-1.5 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50"
                      >
                        Pas satisfait ? Affiner la recherche →
                      </button>
                    )}
                  </div>
                )}
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
              className="flex-1 text-base border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 disabled:opacity-60"
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
