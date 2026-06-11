"use client";

import { useSession, signOut } from "next-auth/react";
import { useEffect, useRef, useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { Link, useRouter, usePathname } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import NotificationBell from "@/components/NotificationBell";

interface ConsumerSession {
  user?: { name?: string | null; email?: string | null; consumerId?: string };
}

function firstWord(str?: string | null) {
  return str?.split(" ")[0] ?? "";
}

const localeLabels: Record<string, string> = {
  en: "🇬🇧 English",
  fr: "🇫🇷 Français",
  it: "🇮🇹 Italiano",
  ar: "🇸🇦 العربية",
  tr: "🇹🇷 Türkçe",
  es: "🇪🇸 Español",
};

const THEMES = [
  { value: "orange", color: "#f97316" },
  { value: "blue", color: "#3b82f6" },
  { value: "green", color: "#22c55e" },
  { value: "purple", color: "#a855f7" },
  { value: "rose", color: "#f43f5e" },
];

const FONTS = [
  { value: "modern", label: "Modern" },
  { value: "classic", label: "Classique" },
  { value: "bold", label: "Bold" },
];

export default function Navbar() {
  const { data: session, status: sessionStatus } = useSession();
  const [consumerSession, setConsumerSession] = useState<ConsumerSession | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [currentTheme, setCurrentTheme] = useState("orange");
  const [currentFont, setCurrentFont] = useState("modern");
  const settingsRef = useRef<HTMLDivElement>(null);
  const t = useTranslations("nav");
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    fetch("/api/consumer/session")
      .then((r) => r.json())
      .then((data: ConsumerSession | null) => { if (data?.user?.consumerId) setConsumerSession(data); })
      .catch(() => {});
    // Read current theme/font from html attributes
    const html = document.documentElement;
    setCurrentTheme(html.getAttribute("data-theme") ?? "orange");
    setCurrentFont(html.getAttribute("data-font") ?? "modern");
  }, []);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (settingsRef.current && !settingsRef.current.contains(e.target as Node)) setSettingsOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  async function signOutConsumer() {
    await fetch("/api/consumer/logout", { method: "POST" });
    setConsumerSession(null);
    window.location.href = "/";
  }

  function switchLocale(newLocale: string) {
    router.replace(pathname, { locale: newLocale });
  }

  async function applyTheme(theme: string) {
    setCurrentTheme(theme);
    document.documentElement.setAttribute("data-theme", theme);
    await fetch("/api/config", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ theme }),
    }).catch(() => {});
  }

  async function applyFont(font: string) {
    setCurrentFont(font);
    document.documentElement.setAttribute("data-font", font);
    await fetch("/api/config", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fontStyle: font }),
    }).catch(() => {});
  }

  const isMerchantPage = pathname.startsWith("/dashboard") || pathname.startsWith("/login") || pathname.startsWith("/register") || pathname.startsWith("/scan");

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="text-2xl font-bold" style={{ color: "var(--color-primary)" }}>Agora</Link>

        <div className="flex items-center gap-3">
          <Link href="/merchants" className="text-gray-600 font-medium hidden sm:block text-sm hover:opacity-80 transition">
            {t("merchants")}
          </Link>

          {/* Consumer session */}
          {consumerSession?.user?.consumerId ? (
            <div className="flex items-center gap-2 border-l border-gray-200 pl-3">
              <NotificationBell />
              <Link href="/consumer/dashboard" className="flex items-center gap-1.5 hover:opacity-80 transition">
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ backgroundColor: "var(--color-primary-light)", color: "var(--color-primary-text)" }}>
                  👤 {firstWord(consumerSession.user.name) || consumerSession.user.email?.split("@")[0]}
                </span>
              </Link>
              <button
                onClick={signOutConsumer}
                className="text-sm bg-gray-100 hover:bg-gray-200 text-gray-600 px-3 py-1.5 rounded-lg transition"
              >
                {t("signOut")}
              </button>
            </div>
          ) : (
            <Link
              href="/consumer/login"
              className="text-white px-4 py-2 rounded-lg font-medium text-sm transition hover:opacity-90"
              style={{ backgroundColor: "var(--color-primary)" }}
            >
              {t("signIn")}
            </Link>
          )}

          {/* Merchant session */}
          {session && (
            <div className="flex items-center gap-2 border-l border-gray-200 pl-3">
              <Link href="/dashboard" className="flex items-center gap-1.5 hover:opacity-80 transition">
                <span className="text-xs bg-blue-100 text-blue-700 font-semibold px-2 py-0.5 rounded-full">
                  🏪 {firstWord(session.user?.name)}
                </span>
              </Link>
              <button
                onClick={() => signOut()}
                className="text-sm bg-gray-100 hover:bg-gray-200 text-gray-600 px-3 py-1.5 rounded-lg transition"
              >
                {t("signOut")}
              </button>
            </div>
          )}

          {/* Settings dropdown */}
          <div className="border-l border-gray-200 pl-3 relative" ref={settingsRef}>
            <button
              onClick={() => setSettingsOpen((o) => !o)}
              className="p-1.5 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition"
              title="Paramètres"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </button>

            {settingsOpen && (
              <div className="absolute right-0 top-10 w-72 bg-white rounded-2xl shadow-xl border border-gray-100 z-50 p-4">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Paramètres</p>

                {/* Language */}
                <div className="mb-4">
                  <p className="text-xs text-gray-500 mb-1.5">🌐 Langue</p>
                  <select
                    value={locale}
                    onChange={(e) => { switchLocale(e.target.value); setSettingsOpen(false); }}
                    className="w-full text-sm text-gray-700 border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 cursor-pointer"
                    style={{ "--tw-ring-color": "var(--color-primary)" } as React.CSSProperties}
                  >
                    {routing.locales.map((loc) => (
                      <option key={loc} value={loc}>{localeLabels[loc]}</option>
                    ))}
                  </select>
                </div>

                {/* Theme */}
                <div className="mb-4">
                  <p className="text-xs text-gray-500 mb-1.5">🎨 Thème</p>
                  <div className="flex gap-2">
                    {THEMES.map((th) => (
                      <button
                        key={th.value}
                        onClick={() => applyTheme(th.value)}
                        className={`w-8 h-8 rounded-full border-2 transition ${currentTheme === th.value ? "border-gray-800 scale-110" : "border-transparent hover:scale-105"}`}
                        style={{ backgroundColor: th.color }}
                        title={th.value}
                      />
                    ))}
                  </div>
                </div>

                {/* Font */}
                <div>
                  <p className="text-xs text-gray-500 mb-1.5">✏️ Police</p>
                  <div className="flex gap-2">
                    {FONTS.map((f) => (
                      <button
                        key={f.value}
                        onClick={() => applyFont(f.value)}
                        className={`flex-1 py-1.5 rounded-lg border text-xs font-medium transition ${
                          currentFont === f.value ? "border-gray-800 bg-gray-50" : "border-gray-200 hover:border-gray-300"
                        }`}
                      >
                        {f.label}
                      </button>
                    ))}
                  </div>
                </div>

                {session && (
                  <div className="border-t border-gray-100 mt-4 pt-3">
                    <Link href="/dashboard/config" onClick={() => setSettingsOpen(false)}
                      className="text-xs text-gray-500 hover:text-gray-700 flex items-center gap-1">
                      ⚙️ Configuration avancée →
                    </Link>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Merchant access link */}
      {sessionStatus !== "loading" && !session && !isMerchantPage && (
        <div className="bg-gray-50 border-t border-gray-100 text-center py-1">
          <Link href="/login" className="text-xs text-gray-400 hover:text-gray-600">
            {t("merchantAccess")}
          </Link>
        </div>
      )}
    </nav>
  );
}
