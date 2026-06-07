"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import OfferCard from "@/components/OfferCard";
import ProductCard from "@/components/ProductCard";
import MerchantCard from "@/components/MerchantCard";

interface Offer {
  id: string;
  title: string;
  description: string;
  photo?: string | null;
  discount: number;
  validFrom: string;
  validTo: string;
  merchant: { businessName: string; city: string };
}

interface Product {
  id: string;
  name: string;
  description: string;
  images: string;
  originalPrice: number;
  discountedPrice: number;
  category?: string | null;
  merchant: { businessName: string; city: string };
}

interface Merchant {
  id: string;
  businessName: string;
  city: string;
  category: string;
  logo?: string | null;
}

export default function ConsumerDashboardPage() {
  const router = useRouter();
  const [data, setData] = useState<{ offers: Offer[]; products: Product[]; merchants: Merchant[] } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/consumer/saved")
      .then((r) => {
        if (r.status === 401) {
          router.push("/consumer/login");
          return null;
        }
        return r.json();
      })
      .then((d) => {
        if (d) setData(d);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-400">Loading…</p>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-10">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">My Saved Items</h1>

        <section className="mb-10">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            Saved offers ({data.offers.length})
          </h2>
          {data.offers.length === 0 ? (
            <p className="text-gray-400 text-sm">No saved offers yet. <Link href="/" className="text-orange-500 hover:underline">Browse offers</Link></p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {data.offers.map((offer) => (
                <OfferCard
                  key={offer.id}
                  title={offer.title}
                  description={offer.description}
                  photo={offer.photo}
                  discount={offer.discount}
                  validFrom={offer.validFrom}
                  validTo={offer.validTo}
                  merchantName={offer.merchant.businessName}
                />
              ))}
            </div>
          )}
        </section>

        <section className="mb-10">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            Saved products ({data.products.length})
          </h2>
          {data.products.length === 0 ? (
            <p className="text-gray-400 text-sm">No saved products yet. <Link href="/" className="text-orange-500 hover:underline">Browse products</Link></p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {data.products.map((product) => (
                <ProductCard
                  key={product.id}
                  name={product.name}
                  description={product.description}
                  images={product.images}
                  originalPrice={product.originalPrice}
                  discountedPrice={product.discountedPrice}
                  category={product.category}
                  merchantName={product.merchant.businessName}
                  merchantCity={product.merchant.city}
                />
              ))}
            </div>
          )}
        </section>

        <section className="mb-10">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            Followed merchants ({data.merchants.length})
          </h2>
          {data.merchants.length === 0 ? (
            <p className="text-gray-400 text-sm">Not following any merchants yet. <Link href="/merchants" className="text-orange-500 hover:underline">Browse merchants</Link></p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {data.merchants.map((m) => (
                <MerchantCard key={m.id} merchant={m} />
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
