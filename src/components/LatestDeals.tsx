"use client";

import { useState, useRef, useEffect } from "react";
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

const ALL_CATEGORIES = [
  { value: "restaurant", icon: "🍽️" },
  { value: "shop", icon: "🛍️" },
  { value: "artisan", icon: "🔨" },
  { value: "beauty", icon: "💅" },
  { value: "hotel", icon: "🏨" },
  { value: "education", icon: "📚" },
  { value: "health", icon: "🏥" },
  { value: "sport", icon: "🏋️" },
  { value: "services", icon: "🔧" },
  { value: "other", icon: "📦" },
];

interface Props {
  offers: Offer[];
  isConsumerLoggedIn: boolean;
  savedOfferIds: string[];
  defaultCategory?: string;
  activeCategories?: string[];
  consumerInterests?: string[];
}

export default function LatestDeals({
  offers,
  isConsumerLoggedIn,
  savedOfferIds,
  defaultCategory = "all",
  activeCategories,
  consumerInterests,
}: Props) {
  const t = useTranslations("home");
  const defaultCats = activeCategories ?? ["restaurant", "shop", "artisan", "beauty", "hotel"];

  // Visible categories: consumer's interests if set, else platform defaults
  const [visibleCats, setVisibleCats] = useState<string[]>(
    consumerInterests && consumerInterests.length > 0 ? consumerInterests : defaultCats
  );
  const [activeTab, setActiveTab] = useState<string>(defaultCategory);
  const [saved, setSaved] = useState<Set<string>>(new Set(savedOfferIds));
  const [customizing, setCustomizing] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) setCustomizing(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const CATEGORIES = ["all", ...visibleCats];

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

  function toggleCat(cat: string) {
    setVisibleCats((prev) => {
      const next = prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat];
      if (next.length === 0) return prev; // keep at least 1
      // Persist if logged in
      if (isConsumerLoggedIn) {
        void fetch("/api/consumer/interests", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ interests: next }),
        });
      }
      return next;
    });
    // Reset tab to "all" if the active one was removed
    setActiveTab((prev) => (prev !== "all" && !visibleCats.filter((c) => c !== cat).includes(prev) ? "all" : prev));
  }

  return (
    <div>
      {/* Category tabs + customize button */}
      <div className="flex gap-2 mb-6 flex-wrap items-center">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveTab(cat)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition ${
              activeTab === cat
                ? "text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
            style={activeTab === cat ? { backgroundColor: "var(--color-primary)" } : undefined}
          >
            {t(`cat${cat.charAt(0).toUpperCase() + cat.slice(1)}` as Parameters<typeof t>[0])}
          </button>
        ))}

        {/* Personalize button */}
        <div className="relative ml-auto" ref={panelRef}>
          <button
            onClick={() => setCustomizing((o) => !o)}
            className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600 px-2 py-1.5 rounded-lg hover:bg-gray-100 transition"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
            </svg>
            {t("customize")}
          </button>

          {customizing && (
            <div className="absolute right-0 top-9 w-72 bg-white rounded-2xl shadow-xl border border-gray-100 z-40 p-4">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">{t("visibleCategories")}</p>
              <div className="grid grid-cols-2 gap-1.5">
                {ALL_CATEGORIES.map((cat) => {
                  const active = visibleCats.includes(cat.value);
                  return (
                    <button
                      key={cat.value}
                      onClick={() => toggleCat(cat.value)}
                      className={`flex items-center gap-2 px-2.5 py-2 rounded-xl border text-xs font-medium transition text-left ${
                        active ? "border-orange-400 bg-orange-50 text-orange-700" : "border-gray-200 text-gray-500 hover:border-gray-300"
                      }`}
                      style={active ? { borderColor: "var(--color-primary)", backgroundColor: "var(--color-primary-light)", color: "var(--color-primary-text)" } : undefined}
                    >
                      <span>{cat.icon}</span>
                      {t(`cat${cat.value.charAt(0).toUpperCase() + cat.value.slice(1)}` as Parameters<typeof t>[0])}
                    </button>
                  );
                })}
              </div>
              {!isConsumerLoggedIn && (
                <p className="text-[10px] text-gray-400 mt-3 text-center">{t("loginToSavePrefs")}</p>
              )}
            </div>
          )}
        </div>
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
