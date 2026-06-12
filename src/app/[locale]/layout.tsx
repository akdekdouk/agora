import type { Metadata } from "next";
import "../globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Providers from "@/components/Providers";
import AiChat from "@/components/AiChat";
import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = {
  title: "Agora — Local Business Discounts",
  description: "Discover discount offers from local shops, artisans and restaurants near you.",
};

async function getPlatformTheme() {
  try {
    const config = await prisma.platformConfig.findUnique({ where: { id: "default" } });
    return { theme: config?.theme ?? "orange", fontStyle: config?.fontStyle ?? "modern" };
  } catch {
    return { theme: "orange", fontStyle: "modern" };
  }
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!routing.locales.includes(locale as (typeof routing.locales)[number])) notFound();

  const [messages, { theme, fontStyle }] = await Promise.all([
    getMessages(),
    getPlatformTheme(),
  ]);

  return (
    <html lang={locale} dir={locale === "ar" ? "rtl" : "ltr"} data-theme={theme} data-font={fontStyle}>
      <body className="bg-gray-50 min-h-screen">
        <NextIntlClientProvider messages={messages}>
          <Providers>
            <Navbar />
            <main>{children}</main>
            <Footer />
            <AiChat />
          </Providers>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
