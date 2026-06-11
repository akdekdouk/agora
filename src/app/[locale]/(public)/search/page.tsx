"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useRouter } from "@/i18n/navigation";
import SearchBar from "@/components/SearchBar";
import MerchantCard from "@/components/MerchantCard";
import OfferCard from "@/components/OfferCard";
import ProductCard from "@/components/ProductCard";
import { SearchResult } from "@/lib/claude";
import { useTranslations } from "next-intl";

function SearchResults() {
  const searchParams = useSearchParams();
  const query = searchParams.get("q") ?? "";
  const city = searchParams.get("city") ?? "";
  const [results, setResults] = useState<SearchResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [isConsumerLoggedIn, setIsConsumerLoggedIn] = useState(false);
  const t = useTranslations("search");

  useEffect(() => {
    fetch("/api/consumer/session").then(r => r.json()).then((s: { user?: { consumerId?: string } } | null) => {
      if (s?.user?.consumerId) setIsConsumerLoggedIn(true);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (!query.trim()) return;
    setLoading(true);
    setError("");
    setResults(null);
    fetch("/api/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query, city: city.trim() || undefined }),
    })
      .then((r) => r.json())
      .then((data: SearchResult) => setResults(data))
      .catch(() => setError(t("searchFailed")))
      .finally(() => setLoading(false));
  }, [query, t]);

  if (!query) return <p className="text-center text-gray-400 py-16">{t("enterQuery")}</p>;

  if (loading) {
    return (
      <div className="text-center py-16">
        <div className="inline-block w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-gray-500">{t("searching")}</p>
      </div>
    );
  }

  if (error) return <p className="text-center text-red-500 py-16">{error}</p>;
  if (!results) return null;

  const total = results.merchants.length + results.offers.length + results.products.length;

  return (
    <div>
      <p className="text-gray-500 mb-8">
        {total === 1 ? t("results", { count: total, query }) : t("resultsPlural", { count: total, query })}
      </p>

      {results.merchants.length > 0 && (
        <section className="mb-10">
          <h2 className="text-xl font-bold text-gray-900 mb-4">{t("merchants")} ({results.merchants.length})</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {results.merchants.map((m) => <MerchantCard key={m.id} merchant={m} />)}
          </div>
        </section>
      )}

      {results.offers.length > 0 && (
        <section className="mb-10">
          <h2 className="text-xl font-bold text-gray-900 mb-4">{t("offers")} ({results.offers.length})</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {results.offers.map((o) => (
              <OfferCard key={o.id} id={o.id} title={o.title} description={o.description}
                photo={(o as { photo?: string | null }).photo} bannerKey={(o as { bannerKey?: string | null }).bannerKey}
                discount={o.discount} validFrom={o.validFrom} validTo={o.validTo} merchantName={o.merchantName}
                isLoggedIn={isConsumerLoggedIn} showClaim={isConsumerLoggedIn} />
            ))}
          </div>
        </section>
      )}

      {results.products.length > 0 && (
        <section className="mb-10">
          <h2 className="text-xl font-bold text-gray-900 mb-4">{t("products")} ({results.products.length})</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {results.products.map((p) => (
              <ProductCard key={p.id} id={p.id} name={p.name} description={p.description}
                images={(p as { images?: string }).images ?? "[]"} originalPrice={p.originalPrice} discountedPrice={p.discountedPrice}
                category={p.category} merchantName={p.merchantName} merchantCity={p.merchantCity}
                isLoggedIn={isConsumerLoggedIn} />
            ))}
          </div>
        </section>
      )}

      {total === 0 && <p className="text-center text-gray-400 py-8">{t("noResults")}</p>}
    </div>
  );
}

function SearchPageInner() {
  const searchParams = useSearchParams();
  const query = searchParams.get("q") ?? "";
  const city = searchParams.get("city") ?? "";
  const t = useTranslations("search");
  const router = useRouter();
  const [cityInput, setCityInput] = useState(city);

  function applyCity(e: React.FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams();
    if (query) params.set("q", query);
    if (cityInput.trim()) params.set("city", cityInput.trim());
    router.push(`/search?${params.toString()}`);
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">{t("title")}</h1>
      <div className="mb-4"><SearchBar initialQuery={query} /></div>
      <form onSubmit={applyCity} className="flex gap-2 mb-8">
        <div className="relative flex-1 max-w-xs">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <input
            value={cityInput}
            onChange={(e) => setCityInput(e.target.value)}
            placeholder={t("cityPlaceholder")}
            className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
          />
        </div>
        <button type="submit" className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium transition">
          {t("applyFilter")}
        </button>
        {city && (
          <button type="button" onClick={() => { setCityInput(""); router.push(`/search?q=${encodeURIComponent(query)}`); }}
            className="text-xs text-gray-400 hover:text-red-500 transition px-2">✕</button>
        )}
      </form>
      <SearchResults />
    </div>
  );
}

export default function SearchPage() {
  const t = useTranslations("common");
  return (
    <Suspense fallback={<div className="max-w-6xl mx-auto px-4 py-10 text-gray-400">{t("loading")}</div>}>
      <SearchPageInner />
    </Suspense>
  );
}
