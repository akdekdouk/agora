"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import OfferCard from "./OfferCard";

interface Offer {
  id: string;
  title: string;
  description: string;
  photo?: string | null;
  bannerKey?: string | null;
  discount: number;
  maxClaims?: number | null;
  claimsCount?: number;
  validFrom: string;
  validTo: string;
  category?: string | null;
  merchant: {
    id: string;
    businessName: string;
    category: string;
    city: string;
  };
}

interface Props {
  offers: Offer[];
  isConsumerLoggedIn: boolean;
  savedOfferIds: string[];
  defaultCategory?: string;
  activeCategories?: string[];
}

export default function LatestDeals({ offers, isConsumerLoggedIn, savedOfferIds, defaultCategory = "all", activeCategories }: Props) {
  const CATEGORIES = ["all", ...(activeCategories ?? ["restaurant", "shop", "artisan", "beauty", "hotel"])];
  const t = useTranslations("home");
  const [activeTab, setActiveTab] = useState<string>(defaultCategory);
  const [saved, setSaved] = useState<Set<string>>(new Set(savedOfferIds));

  const filtered = activeTab === "all"
    ? offers
    : offers.filter((o) => o.merchant.category === activeTab);

  async function handleSave(offerId: string, isSaved: boolean) {
    if (!isConsumerLoggedIn) return;
    const res = await fetch("/api/consumer/save-offer", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ offerId }),
    });
    if (res.ok) {
      setSaved((prev) => {
        const next = new Set(prev);
        if (isSaved) next.delete(offerId);
        else next.add(offerId);
        return next;
      });
    }
  }

  return (
    <div>
      {/* Category tabs */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveTab(cat)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition ${
              activeTab === cat
                ? "bg-orange-500 text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            {t(`cat${cat.charAt(0).toUpperCase() + cat.slice(1)}` as Parameters<typeof t>[0])}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <p className="text-gray-500 py-8 text-center">{t("noDealsYet")}</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((offer) => (
            <OfferCard
              key={offer.id}
              id={offer.id}
              title={offer.title}
              description={offer.description}
              photo={offer.photo}
              bannerKey={offer.bannerKey}
              discount={offer.discount}
              maxClaims={offer.maxClaims}
              claimsCount={offer.claimsCount}
              validFrom={offer.validFrom}
              validTo={offer.validTo}
              merchantName={offer.merchant.businessName}
              isLoggedIn={isConsumerLoggedIn}
              isSaved={saved.has(offer.id)}
              onSave={() => handleSave(offer.id, saved.has(offer.id))}
              showClaim={isConsumerLoggedIn}
            />
          ))}
        </div>
      )}
    </div>
  );
}
