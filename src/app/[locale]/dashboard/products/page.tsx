"use client";

import { useState, useEffect } from "react";
import { useRouter } from "@/i18n/navigation";
import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import ProductCard from "@/components/ProductCard";

interface Product {
  id: string;
  name: string;
  description: string;
  images: string;
  originalPrice: number;
  discountedPrice: number;
  category?: string | null;
}

export default function DashboardProductsPage() {
  const t = useTranslations("dashboard");
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    void fetchProducts();
  }, []);

  async function fetchProducts() {
    setLoading(true);
    try {
      const res = await fetch("/api/products/mine");
      if (res.ok) {
        const data = await res.json() as Product[];
        setProducts(data);
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm(t("confirmDeleteProduct"))) return;
    setDeleting(id);
    try {
      const res = await fetch(`/api/products?id=${id}`, { method: "DELETE" });
      if (res.ok) setProducts((prev) => prev.filter((p) => p.id !== id));
    } finally {
      setDeleting(null);
    }
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">{t("productsSection")}</h1>
        <Link href="/dashboard/products/new"
          className="bg-orange-500 text-white px-4 py-2 rounded-lg font-semibold hover:bg-orange-600 transition">
          {t("newProduct")}
        </Link>
      </div>

      {loading ? (
        <div className="text-center py-16 text-gray-400">{t("loading")}</div>
      ) : products.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <p className="text-4xl mb-3">🛍️</p>
          <p>{t("noProducts")}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {products.map((product) => (
            <div key={product.id} className="relative group">
              <ProductCard {...product} />
              <button
                onClick={() => handleDelete(product.id)}
                disabled={deleting === product.id}
                className="absolute top-2 right-2 bg-white/90 hover:bg-red-50 text-red-500 border border-red-200 rounded-full w-7 h-7 flex items-center justify-center text-xs font-bold shadow transition opacity-0 group-hover:opacity-100 disabled:opacity-50"
                title={t("deleteProduct")}
              >
                {deleting === product.id ? "…" : "✕"}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
