"use client";

import { useState } from "react";
import LatestDeals from "@/components/LatestDeals";
import { Link } from "@/i18n/navigation";

interface Offer {
  id: string;
  title: string;
  description: string;
  photo: string | null;
  bannerKey: string | null;
  discount: number;
  maxClaims: number | null;
  validFrom: string;
  validTo: string;
  category: string | null;
  claimsCount: number;
  merchant: { id: string; businessName: string; category: string; city: string };
}

interface Props {
  offers: Offer[];
  isConsumerLoggedIn: boolean;
  savedOfferIds: string[];
  activeCategories: string[];
  consumerInterests: string[];
  heroTitle: string;
  heroSubtitle: string;
  exploreMapLabel: string;
  latestDealsLabel: string;
}

// Stop words to ignore when extracting keywords from a natural language query
const STOP_WORDS = new Set([
  "je", "tu", "il", "elle", "on", "nous", "vous", "ils", "elles",
  "cherche", "chercher", "veux", "voudrais", "aimerais", "souhaite",
  "les", "des", "une", "un", "de", "du", "la", "le", "en", "au", "aux",
  "offre", "offres", "promo", "promos", "promotion", "promotions",
  "deal", "deals", "réduction", "reduction", "remise", "remises",
  "avoir", "voir", "trouver", "montrer", "afficher",
  "dans", "sur", "pour", "avec", "sans", "par", "et", "ou", "mais",
  "que", "qui", "quoi", "dont", "où", "quel", "quelle", "quels", "quelles",
  "me", "mon", "ma", "mes", "ton", "ta", "tes", "son", "sa", "ses",
  "ce", "cet", "cette", "ces", "y", "a", "est", "sont", "pas",
]);

// Category aliases so "beaute" matches category "beauty"
const CATEGORY_ALIASES: Record<string, string[]> = {
  beauty: ["beaute", "beauté", "bien-être", "bienetre", "soin", "soins", "spa", "esthetique", "esthétique", "coiffure", "coiffeur"],
  restaurant: ["resto", "restau", "manger", "cuisine", "nourriture", "repas", "table"],
  shop: ["boutique", "magasin", "commerce", "achat"],
  artisan: ["artisan", "artisanat", "fait-main", "createur", "créateur"],
  hotel: ["hotel", "hôtel", "hebergement", "hébergement", "logement"],
  sport: ["sport", "fitness", "gym", "salle", "musculation"],
  health: ["sante", "santé", "médecin", "medecin", "pharmacie", "clinique"],
  education: ["cours", "formation", "ecole", "école", "apprentissage"],
  services: ["service", "services", "reparation", "réparation", "entretien"],
};

function normalize(str: string): string {
  return str.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[''`]/g, "");
}

function extractKeywords(query: string): string[] {
  return normalize(query)
    .split(/[\s,;.!?()]+/)
    .map(w => w.trim())
    .filter(w => w.length >= 2 && !STOP_WORDS.has(w));
}

function offerMatchesKeyword(o: Offer, keyword: string): boolean {
  const fields = [
    normalize(o.title),
    normalize(o.description),
    normalize(o.merchant.businessName),
    normalize(o.merchant.city),
    normalize(o.merchant.category),
    o.category ? normalize(o.category) : "",
  ];

  // Direct match in any field
  if (fields.some(f => f.includes(keyword))) return true;

  // Category alias match
  for (const [cat, aliases] of Object.entries(CATEGORY_ALIASES)) {
    if (aliases.includes(keyword) || keyword === cat) {
      if (fields.some(f => f.includes(cat) || aliases.some(a => f.includes(a)))) return true;
    }
  }

  return false;
}


  offers, isConsumerLoggedIn, savedOfferIds, activeCategories, consumerInterests,
  heroTitle, heroSubtitle, exploreMapLabel, latestDealsLabel,
}: Props) {
  const [search, setSearch] = useState("");

  const filteredOffers = search.trim()
    ? (() => {
        const keywords = extractKeywords(search);
        if (keywords.length === 0) return offers;
        // An offer matches if ANY keyword matches
        return offers.filter(o => keywords.some(kw => offerMatchesKeyword(o, kw)));
      })()
    : offers;

  return (
    <>
      <section className="text-white py-16 px-4" style={{ background: "linear-gradient(135deg, var(--color-primary), var(--color-primary-hover, #ea580c))" }}>
        <div className="max-w-2xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">{heroTitle}</h1>
          <p className="text-white/80 text-lg mb-8">{heroSubtitle}</p>

          {/* Search bar */}
          <div className="relative mb-6">
            <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
            </svg>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Restaurant, artisan, beauté, ville…"
              className="w-full pl-12 pr-12 py-4 rounded-2xl text-gray-800 text-base shadow-lg focus:outline-none focus:ring-4 focus:ring-white/40"
            />
            {search && (
              <button onClick={() => setSearch("")} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-lg">✕</button>
            )}
          </div>

          <Link
            href="/map"
            className="inline-flex items-center gap-2 bg-white/20 hover:bg-white/30 border border-white/40 text-white font-medium px-6 py-3 rounded-xl transition backdrop-blur-sm"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
            </svg>
            {exploreMapLabel}
          </Link>
        </div>
      </section>

      {/* Latest Deals */}
      <section className="max-w-6xl mx-auto px-4 py-12">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">{latestDealsLabel}</h2>
          {search && (
            <span className="text-sm text-gray-500">{filteredOffers.length} résultat{filteredOffers.length !== 1 ? "s" : ""} pour « {search} »</span>
          )}
        </div>
        <LatestDeals
          offers={filteredOffers}
          isConsumerLoggedIn={isConsumerLoggedIn}
          savedOfferIds={savedOfferIds}
          defaultCategory="all"
          activeCategories={activeCategories}
          consumerInterests={consumerInterests}
        />
      </section>
    </>
  );
}
