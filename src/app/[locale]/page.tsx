import { Link } from "@/i18n/navigation";
import { prisma } from "@/lib/prisma";
import MerchantCard from "@/components/MerchantCard";
import SearchBar from "@/components/SearchBar";
import LatestDeals from "@/components/LatestDeals";
import { getTranslations } from "next-intl/server";
import { getConsumerSession } from "@/lib/auth-consumer";

export const dynamic = "force-dynamic";

async function getLatestOffers() {
  const now = new Date();
  return prisma.offer.findMany({
    where: { validTo: { gte: now } },
    orderBy: { createdAt: "desc" },
    take: 12,
    select: {
      id: true,
      title: true,
      description: true,
      photo: true,
      discount: true,
      validFrom: true,
      validTo: true,
      category: true,
      merchant: {
        select: { id: true, businessName: true, category: true, city: true },
      },
    },
  });
}

async function getFeaturedMerchants() {
  return prisma.user.findMany({
    take: 6,
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      businessName: true,
      description: true,
      category: true,
      city: true,
      logo: true,
      _count: { select: { offers: true, products: true } },
    },
  });
}

export default async function HomePage() {
  const [offers, merchants, t, consumerSession] = await Promise.all([
    getLatestOffers(),
    getFeaturedMerchants(),
    getTranslations("home"),
    getConsumerSession(),
  ]);

  const isConsumerLoggedIn = !!consumerSession?.user?.consumerId;

  let savedOfferIds: string[] = [];
  let consumerInterests: string[] = [];
  if (isConsumerLoggedIn && consumerSession?.user?.consumerId) {
    const [saved, consumer] = await Promise.all([
      prisma.savedOffer.findMany({
        where: { consumerId: consumerSession.user.consumerId },
        select: { offerId: true },
      }),
      prisma.consumer.findUnique({
        where: { id: consumerSession.user.consumerId },
        select: { interests: true },
      }),
    ]);
    savedOfferIds = saved.map((s) => s.offerId);
    consumerInterests = JSON.parse(consumer?.interests ?? "[]") as string[];
  }

  const serializedOffers = offers.map((o) => ({
    ...o,
    validFrom: o.validFrom.toISOString(),
    validTo: o.validTo.toISOString(),
  }));

  return (
    <div>
      <section className="bg-gradient-to-br from-orange-500 to-orange-600 text-white py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">{t("heroTitle")}</h1>
          <p className="text-orange-100 text-lg mb-8">{t("heroSubtitle")}</p>
          <SearchBar />
        </div>
      </section>

      {/* Latest Deals by category */}
      <section className="max-w-6xl mx-auto px-4 py-12">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">{t("latestDeals")}</h2>
          <Link href="/search" className="text-orange-500 hover:text-orange-600 font-medium">
            {t("viewAllOffers")}
          </Link>
        </div>
        <LatestDeals
          offers={serializedOffers}
          isConsumerLoggedIn={isConsumerLoggedIn}
          savedOfferIds={savedOfferIds}
          defaultCategory={consumerInterests.length === 1 ? consumerInterests[0] : "all"}
        />
      </section>

      {/* Featured Merchants */}
      <section className="bg-gray-50 py-12 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">{t("featuredMerchants")}</h2>
            <Link href="/merchants" className="text-orange-500 hover:text-orange-600 font-medium">
              {t("viewAll")}
            </Link>
          </div>

          {merchants.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <p className="text-lg">{t("noMerchantsYet")}</p>
              <Link href="/register" className="text-orange-500 hover:underline mt-2 inline-block">
                {t("registerBusiness")}
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {merchants.map((m) => (
                <MerchantCard key={m.id} merchant={m} />
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="bg-orange-50 py-12 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-3">{t("ctaTitle")}</h2>
          <p className="text-gray-600 mb-6">{t("ctaSubtitle")}</p>
          <Link
            href="/register"
            className="bg-orange-500 text-white px-6 py-3 rounded-xl font-semibold hover:bg-orange-600 transition"
          >
            {t("ctaButton")}
          </Link>
        </div>
      </section>
    </div>
  );
}
