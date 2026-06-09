"use client";

import { useSession, signOut } from "next-auth/react";
import { useEffect, useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { Link, useRouter, usePathname } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";

interface ConsumerSession {
  user?: { name?: string | null; email?: string | null; consumerId?: string };
}

const localeLabels: Record<string, string> = {
  en: "🇬🇧 English",
  fr: "🇫🇷 Français",
  it: "🇮🇹 Italiano",
  ar: "🇸🇦 العربية",
  tr: "🇹🇷 Türkçe",
  es: "🇪🇸 Español",
};

export default function Navbar() {
  const { data: session } = useSession();
  const [consumerSession, setConsumerSession] = useState<ConsumerSession | null>(null);
  const t = useTranslations("nav");
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    fetch("/api/consumer/session")
      .then((r) => r.json())
      .then((data: ConsumerSession | null) => { if (data?.user?.consumerId) setConsumerSession(data); })
      .catch(() => {});
  }, []);

  async function signOutConsumer() {
    await fetch("/api/consumer/logout", { method: "POST" });
    setConsumerSession(null);
    window.location.href = "/";
  }

  function switchLocale(newLocale: string) {
    router.replace(pathname, { locale: newLocale });
  }

  const isMerchantPage = pathname.startsWith("/dashboard") || pathname.startsWith("/login") || pathname.startsWith("/register") || pathname.startsWith("/scan");

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="text-2xl font-bold text-orange-500">Agora</Link>

        <div className="flex items-center gap-3">
          <Link href="/merchants" className="text-gray-600 hover:text-orange-500 font-medium hidden sm:block text-sm">
            {t("merchants")}
          </Link>
          <Link href="/search" className="text-gray-600 hover:text-orange-500 font-medium hidden sm:block text-sm">
            {t("search")}
          </Link>
          <Link href="/help" className="text-gray-600 hover:text-orange-500 font-medium hidden sm:block text-sm">
            {t("help")}
          </Link>

          {/* Consumer session — hidden when logged in as merchant */}
          {consumerSession?.user?.consumerId && !session ? (
            <div className="flex items-center gap-2 border-l border-gray-200 pl-3">
              <Link href="/consumer/dashboard" className="text-gray-600 hover:text-orange-500 font-medium text-sm">
                {t("mySaves")}
              </Link>
              <button
                onClick={signOutConsumer}
                className="text-sm bg-gray-100 hover:bg-gray-200 text-gray-600 px-3 py-1.5 rounded-lg transition"
              >
                {t("signOut")}
              </button>
            </div>
          ) : !session && (
            <Link
              href="/consumer/login"
              className="bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 font-medium text-sm"
            >
              {t("signIn")}
            </Link>
          )}

          {/* Merchant session */}
          {session && (
            <div className="flex items-center gap-2 border-l border-gray-200 pl-3">
              <Link href="/dashboard" className="text-gray-600 hover:text-orange-500 font-medium text-sm">
                {t("dashboard")}
              </Link>
              <button
                onClick={() => signOut()}
                className="text-sm bg-gray-100 hover:bg-gray-200 text-gray-600 px-3 py-1.5 rounded-lg transition"
              >
                {t("signOut")}
              </button>
            </div>
          )}

          {/* Language switcher — dropdown */}
          <div className="border-l border-gray-200 pl-3">
            <select
              value={locale}
              onChange={(e) => switchLocale(e.target.value)}
              className="text-sm text-gray-600 bg-transparent border border-gray-200 rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-orange-400 cursor-pointer"
            >
              {routing.locales.map((loc) => (
                <option key={loc} value={loc}>{localeLabels[loc]}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Merchant access link - subtle, only when not logged in as merchant */}
      {!session && !isMerchantPage && (
        <div className="bg-gray-50 border-t border-gray-100 text-center py-1">
          <Link href="/login" className="text-xs text-gray-400 hover:text-gray-600">
            {t("merchantAccess")}
          </Link>
        </div>
      )}
    </nav>
  );
}
