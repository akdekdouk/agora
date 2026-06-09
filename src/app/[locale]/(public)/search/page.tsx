"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import SearchBar from "@/components/SearchBar";
import MerchantCard from "@/components/MerchantCard";
import OfferCard from "@/components/OfferCard";
import ProductCard from "@/components/ProductCard";
import { SearchResult } from "@/lib/claude";
import { useTranslations } from "next-intl";

function SearchResults() {
  const searchParams = useSearchParams();
  const query = searchParams.get("q") ?? "";
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
      body: JSON.stringify({ query }),
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
              <ProductCard key={p.id} name={p.name} description={p.description}
                images={"[]"} originalPrice={p.originalPrice} discountedPrice={p.discountedPrice}
                category={p.category} merchantName={p.merchantName} merchantCity={p.merchantCity} />
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
  const t = useTranslations("search");

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">{t("title")}</h1>
      <div className="mb-8"><SearchBar initialQuery={query} /></div>
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
