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
  en: "EN", fr: "FR", it: "IT", ar: "ع",
};

export default function Navbar() {
  const { data: session } = useSession();
  const [consumerSession, setConsumerSession] = useState<ConsumerSession | null>(null);
  const t = useTranslations("nav");
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    fetch("/api/consumer/auth/session")
      .then((r) => r.json())
      .then((data) => { if (data?.user?.consumerId) setConsumerSession(data); })
      .catch(() => {});
  }, []);

  async function signOutConsumer() {
    await fetch("/api/consumer/auth/signout", { method: "POST" });
    setConsumerSession(null);
    window.location.reload();
  }

  function switchLocale(newLocale: string) {
    router.replace(pathname, { locale: newLocale });
  }

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="text-2xl font-bold text-orange-500">Agora</Link>

        <div className="flex items-center gap-4">
          <Link href="/merchants" className="text-gray-600 hover:text-orange-500 font-medium hidden sm:block">
            {t("merchants")}
          </Link>
          <Link href="/search" className="text-gray-600 hover:text-orange-500 font-medium hidden sm:block">
            {t("search")}
          </Link>

          {consumerSession?.user?.consumerId && (
            <div className="flex items-center gap-3 border-l border-gray-200 pl-3">
              <Link href="/consumer/dashboard" className="text-gray-600 hover:text-orange-500 font-medium text-sm">
                {t("mySaves")}
              </Link>
              <button onClick={signOutConsumer} className="text-sm text-gray-400 hover:text-gray-600">
                {t("signOut")}
              </button>
            </div>
          )}

          {session ? (
            <>
              <Link href="/dashboard" className="text-gray-600 hover:text-orange-500 font-medium">
                {t("dashboard")}
              </Link>
              <button onClick={() => signOut()}
                className="bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 font-medium">
                {t("signOut")}
              </button>
            </>
          ) : (
            <Link href="/login" className="bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 font-medium">
              {t("signIn")}
            </Link>
          )}

          {/* Language switcher */}
          <div className="flex items-center gap-1 border-l border-gray-200 pl-3">
            {routing.locales.map((loc) => (
              <button
                key={loc}
                onClick={() => switchLocale(loc)}
                className={`text-xs px-2 py-1 rounded font-medium transition ${
                  locale === loc
                    ? "bg-orange-500 text-white"
                    : "text-gray-400 hover:text-gray-700"
                }`}
              >
                {localeLabels[loc]}
              </button>
            ))}
          </div>
        </div>
      </div>
    </nav>
  );
}
