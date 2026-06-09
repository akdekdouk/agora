"use client";

import { useEffect, useState } from "react";
import { useRouter } from "@/i18n/navigation";
import { Link } from "@/i18n/navigation";
import OfferCard from "@/components/OfferCard";
import ProductCard from "@/components/ProductCard";
import MerchantCard from "@/components/MerchantCard";
import { useTranslations } from "next-intl";

interface Offer {
  id: string; title: string; description: string; photo?: string | null;
  discount: number; validFrom: string; validTo: string;
  merchant: { businessName: string; city: string };
}
interface Product {
  id: string; name: string; description: string; images: string;
  originalPrice: number; discountedPrice: number; category?: string | null;
  merchant: { businessName: string; city: string };
}
interface Merchant {
  id: string; businessName: string; city: string; category: string; logo?: string | null;
}
interface Claim {
  id: string; status: string; claimedAt: string; usedAt?: string;
  offer: { id: string; title: string; discount: number; validTo: string; merchant: { businessName: string } };
}

export default function ConsumerDashboardPage() {
  const router = useRouter();
  const t = useTranslations("consumer");
  const tCommon = useTranslations("common");
  const tClaim = useTranslations("claim");
  const [data, setData] = useState<{ offers: Offer[]; products: Product[]; merchants: Merchant[] } | null>(null);
  const [claims, setClaims] = useState<Claim[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/consumer/saved").then((r) => {
        if (r.status === 401) { router.push("/consumer/login"); return null; }
        return r.json();
      }),
      fetch("/api/consumer/claims-list").then((r) => r.status === 401 ? [] : r.json()),
    ]).then(([savedData, claimsData]) => {
      if (savedData) setData(savedData);
      if (Array.isArray(claimsData)) setClaims(claimsData);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-400">{tCommon("loading")}</p>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-10">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-gray-900">{t("mySpace")}</h1>
          <Link href="/consumer/settings" className="text-sm text-gray-500 hover:text-orange-500 flex items-center gap-1">
            ⚙️ {t("settings")}
          </Link>
        </div>

        {/* Claims */}
        {claims.length > 0 && (
          <section className="mb-10">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">{t("myClaims")} ({claims.length})</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {claims.map((claim) => {
                const expired = new Date(claim.offer.validTo) < new Date();
                return (
                  <Link key={claim.id} href={`/claim/${claim.id}`}>
                    <div className={`bg-white rounded-xl border shadow-sm p-4 hover:shadow-md transition cursor-pointer ${
                      claim.status === "used" ? "opacity-60 border-gray-100" :
                      expired ? "border-red-100 bg-red-50" :
                      "border-orange-100"
                    }`}>
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="font-semibold text-gray-900 text-sm">{claim.offer.title}</h3>
                        <span className="bg-orange-500 text-white text-xs font-bold px-2 py-0.5 rounded-full shrink-0">
                          -{claim.offer.discount}%
                        </span>
                      </div>
                      <p className="text-xs text-orange-500 mt-1">{claim.offer.merchant.businessName}</p>
                      <div className="flex items-center justify-between mt-3">
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                          claim.status === "used" ? "bg-gray-100 text-gray-500" :
                          expired ? "bg-red-100 text-red-600" :
                          "bg-green-100 text-green-700"
                        }`}>
                          {claim.status === "used" ? tClaim("used") : expired ? tClaim("expired") : tClaim("valid")}
                        </span>
                        <span className="text-xs text-gray-400">{tClaim("showQR")} →</span>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>
        )}

        <section className="mb-10">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">{t("savedOffers")} ({data.offers.length})</h2>
          {data.offers.length === 0 ? (
            <p className="text-gray-400 text-sm">{t("noSavedOffers")} <Link href="/" className="text-orange-500 hover:underline">{t("browse")}</Link></p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {(() => {
                const claimedOfferIds = new Set(claims.map((c) => c.offer.id));
                return data.offers.map((offer) => (
                  <OfferCard key={offer.id} id={offer.id} title={offer.title} description={offer.description}
                    photo={offer.photo} discount={offer.discount} validFrom={offer.validFrom}
                    validTo={offer.validTo} merchantName={offer.merchant.businessName}
                    isLoggedIn isSaved showClaim alreadyClaimed={claimedOfferIds.has(offer.id)} />
                ));
              })()}
            </div>
          )}
        </section>

        <section className="mb-10">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">{t("savedProducts")} ({data.products.length})</h2>
          {data.products.length === 0 ? (
            <p className="text-gray-400 text-sm">{t("noSavedProducts")} <Link href="/" className="text-orange-500 hover:underline">{t("browse")}</Link></p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {data.products.map((product) => (
                <ProductCard key={product.id} id={product.id} name={product.name} description={product.description}
                  images={product.images} originalPrice={product.originalPrice}
                  discountedPrice={product.discountedPrice} category={product.category}
                  merchantName={product.merchant.businessName} merchantCity={product.merchant.city}
                  isLoggedIn isSaved />
              ))}
            </div>
          )}
        </section>

        <section className="mb-10">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">{t("followedMerchants")} ({data.merchants.length})</h2>
          {data.merchants.length === 0 ? (
            <p className="text-gray-400 text-sm">{t("noFollowedMerchants")} <Link href="/merchants" className="text-orange-500 hover:underline">{t("browse")}</Link></p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {data.merchants.map((m) => <MerchantCard key={m.id} merchant={m} />)}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
