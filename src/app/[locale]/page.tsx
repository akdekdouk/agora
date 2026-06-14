import { Link } from "@/i18n/navigation";
import { prisma } from "@/lib/prisma";
import MerchantsByCategory from "@/components/MerchantsByCategory";
import HomeSearch from "@/components/HomeSearch";
import ProductCard from "@/components/ProductCard";
import BubbleOffers from "@/components/BubbleOffers";
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
      bannerKey: true,
      discount: true,
      maxClaims: true,
      validFrom: true,
      validTo: true,
      category: true,
      merchant: {
        select: { id: true, businessName: true, category: true, city: true },
      },
      _count: { select: { claims: true } },
    },
  });
}

async function getLatestProducts() {
  return prisma.product.findMany({
    orderBy: { createdAt: "desc" },
    take: 8,
    select: {
      id: true,
      name: true,
      description: true,
      images: true,
      originalPrice: true,
      discountedPrice: true,
      category: true,
      merchant: { select: { businessName: true, city: true } },
    },
  });
}

async function getFeaturedMerchants() {
  return prisma.user.findMany({
    take: 40,
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

async function getPlatformConfig() {
  return prisma.platformConfig.upsert({
    where: { id: "default" },
    create: { id: "default" },
    update: {},
  });
}

export default async function HomePage() {
  const [offers, products, merchants, t, consumerSession, platformConfig] = await Promise.all([
    getLatestOffers(),
    getLatestProducts(),
    getFeaturedMerchants(),
    getTranslations("home"),
    getConsumerSession(),
    getPlatformConfig(),
  ]);

  const activeCategories = JSON.parse(platformConfig.activeCategories) as string[];

  const isConsumerLoggedIn = !!consumerSession?.user?.consumerId;

  let savedOfferIds: string[] = [];
  let savedProductIds: string[] = [];
  let claimedProductIds: string[] = [];
  let consumerInterests: string[] = [];
  if (isConsumerLoggedIn && consumerSession?.user?.consumerId) {
    const [saved, savedProds, claimedProds, consumer] = await Promise.all([
      prisma.savedOffer.findMany({
        where: { consumerId: consumerSession.user.consumerId },
        select: { offerId: true },
      }),
      prisma.savedProduct.findMany({
        where: { consumerId: consumerSession.user.consumerId },
        select: { productId: true },
      }),
      prisma.productClaim.findMany({
        where: { consumerId: consumerSession.user.consumerId },
        select: { productId: true },
      }),
      prisma.consumer.findUnique({
        where: { id: consumerSession.user.consumerId },
        select: { interests: true },
      }),
    ]);
    savedOfferIds = saved.map((s) => s.offerId);
    savedProductIds = savedProds.map((s) => s.productId);
    claimedProductIds = claimedProds.map((s) => s.productId);
    consumerInterests = JSON.parse(consumer?.interests ?? "[]") as string[];
  }

  const serializedOffers = offers.map((o) => ({
    ...o,
    validFrom: o.validFrom.toISOString(),
    validTo: o.validTo.toISOString(),
    claimsCount: o._count.claims,
  }));

  return (
    <div>
      <HomeSearch
        offers={serializedOffers}
        isConsumerLoggedIn={isConsumerLoggedIn}
        savedOfferIds={savedOfferIds}
        activeCategories={activeCategories}
        consumerInterests={consumerInterests}
        heroTitle={t("heroTitle")}
        heroSubtitle={t("heroSubtitle")}
        exploreMapLabel={t("exploreMap")}
        latestDealsLabel={t("latestDeals")}
      />

      {/* Bubble offers */}
      {serializedOffers.length > 0 && (
        <section className="max-w-6xl mx-auto px-4 py-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">🧺 Les offres du moment</h2>
          <p className="text-sm text-gray-400 mb-4">Survolez une bulle pour voir les détails</p>
          <BubbleOffers offers={serializedOffers} />
        </section>
      )}

      {/* Latest Products */}
      {products.length > 0 && (
        <section className="max-w-6xl mx-auto px-4 py-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">{t("latestProducts")}</h2>
            <Link href="/merchants" className="font-medium hover:opacity-80" style={{ color: "var(--color-primary)" }}>
              {t("viewAllProducts")}
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {products.map((p) => (
              <ProductCard
                key={p.id}
                id={p.id}
                name={p.name}
                description={p.description}
                images={p.images}
                originalPrice={p.originalPrice}
                discountedPrice={p.discountedPrice}
                category={p.category}
                merchantName={p.merchant.businessName}
                merchantCity={p.merchant.city}
                isLoggedIn={isConsumerLoggedIn}
                isSaved={savedProductIds.includes(p.id)}
                showClaim={isConsumerLoggedIn}
                alreadyClaimed={claimedProductIds.includes(p.id)}
              />
            ))}
          </div>
        </section>
      )}

      {/* Merchants by category */}
      <section className="bg-gray-50 py-12 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-bold text-gray-900">{t("featuredMerchants")}</h2>
            <Link href="/merchants" className="font-medium hover:opacity-80" style={{ color: "var(--color-primary)" }}>
              {t("viewAll")}
            </Link>
          </div>

          {merchants.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <p className="text-lg">{t("noMerchantsYet")}</p>
              <Link href="/register" className="hover:underline mt-2 inline-block" style={{ color: "var(--color-primary)" }}>
                {t("registerBusiness")}
              </Link>
            </div>
          ) : (
            <MerchantsByCategory merchants={merchants} />
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
