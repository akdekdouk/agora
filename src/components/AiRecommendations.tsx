"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import OfferCard from "./OfferCard";

interface Offer {
  id: string;
  title: string;
  description: string;
  photo?: string | null;
  discount: number;
  maxClaims?: number | null;
  claimsCount?: number;
  validFrom: string;
  validTo: string;
  merchantId: string;
  merchantName: string;
  merchantCategory: string;
  merchantCity: string;
}

interface Props {
  savedOfferIds: string[];
}

export default function AiRecommendations({ savedOfferIds }: Props) {
  const t = useTranslations("home");
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState<Set<string>>(new Set(savedOfferIds));

  useEffect(() => {
    fetch("/api/ai/recommendations")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (Array.isArray(data)) setOffers(data as Offer[]);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  async function handleSave(offerId: string, isSaved: boolean) {
    await fetch("/api/consumer/saved-offers", {
      method: isSaved ? "DELETE" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ offerId }),
    });
    setSaved((prev) => {
      const next = new Set(prev);
      if (isSaved) next.delete(offerId);
      else next.add(offerId);
      return next;
    });
  }

  if (loading) {
    return (
      <div className="flex gap-4 overflow-hidden">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-gray-100 rounded-xl h-48 flex-1 animate-pulse" />
        ))}
      </div>
    );
  }

  if (offers.length === 0) return null;

  return (
    <section className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex items-center gap-2 mb-5">
        <span className="text-xl">✨</span>
        <h2 className="text-2xl font-bold text-gray-900">{t("forYou")}</h2>
        <span className="text-xs bg-orange-100 text-orange-600 font-medium px-2 py-0.5 rounded-full">{t("aiPowered")}</span>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {offers.map((offer) => (
          <OfferCard
            key={offer.id}
            id={offer.id}
            title={offer.title}
            description={offer.description}
            photo={offer.photo}
            discount={offer.discount}
            maxClaims={offer.maxClaims}
            claimsCount={offer.claimsCount}
            validFrom={offer.validFrom}
            validTo={offer.validTo}
            merchantName={offer.merchantName}
            isLoggedIn
            isSaved={saved.has(offer.id)}
            onSave={() => handleSave(offer.id, saved.has(offer.id))}
            showClaim
          />
        ))}
      </div>
    </section>
  );
}
