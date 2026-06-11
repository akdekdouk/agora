"use client";

import { useState } from "react";
import { Link, useRouter } from "@/i18n/navigation";
import { useTranslations } from "next-intl";

interface Props {
  id?: string;
  name: string;
  description: string;
  images: string;
  originalPrice: number;
  discountedPrice: number;
  category?: string | null;
  merchantName?: string;
  merchantCity?: string;
  onSave?: () => void;
  isSaved?: boolean;
  isLoggedIn?: boolean;
  alreadyClaimed?: boolean;
  showClaim?: boolean;
}

export default function ProductCard({ id, name, description, images, originalPrice, discountedPrice, category, merchantName, merchantCity, onSave, isSaved: initialSaved, isLoggedIn, alreadyClaimed: initialClaimed, showClaim }: Props) {
  let imageList: string[] = [];
  try { imageList = JSON.parse(images); } catch { /* empty */ }
  const firstImage = imageList[0];
  const savings = Math.round((1 - discountedPrice / originalPrice) * 100);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isSaved, setIsSaved] = useState(initialSaved ?? false);
  const [claimed, setClaimed] = useState(initialClaimed ?? false);
  const [claiming, setClaiming] = useState(false);
  const t = useTranslations("productCard");
  const router = useRouter();

  async function handleSaveClick(e: React.MouseEvent) {
    e.stopPropagation();
    if (!isLoggedIn) {
      setShowPrompt(true);
      setTimeout(() => setShowPrompt(false), 3000);
      return;
    }
    if (onSave) { onSave(); return; }
    if (!id) return;
    try {
      const res = await fetch("/api/consumer/save-product", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId: id }),
      });
      if (res.ok) {
        const data = await res.json() as { saved: boolean };
        setIsSaved(data.saved);
      }
    } catch { /* ignore */ }
  }

  async function handleClaim(e: React.MouseEvent) {
    e.stopPropagation();
    if (!isLoggedIn || !id) {
      setShowPrompt(true);
      setTimeout(() => setShowPrompt(false), 3000);
      return;
    }
    setClaiming(true);
    const res = await fetch("/api/consumer/claim-product", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productId: id }),
    });
    const data = await res.json() as { id?: string; error?: string };
    setClaiming(false);
    if (res.status === 409) {
      setClaimed(true);
    } else if (res.ok && data.id) {
      setClaimed(true);
      router.push(`/claim-product/${data.id}`);
    }
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-visible relative">
      {firstImage ? (
        <div className="group relative h-40 w-full overflow-visible bg-gray-100">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={firstImage} alt={name} className="absolute inset-0 w-full h-full object-cover object-top" />
          {/* Full-image preview on hover */}
          <div className="pointer-events-none absolute left-0 top-0 z-50 hidden group-hover:flex w-full justify-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={firstImage} alt={name} className="max-h-72 w-full object-contain bg-white shadow-xl rounded-b-xl border border-gray-200" />
          </div>
        </div>
      ) : (
        <div className="h-40 bg-gray-100 flex items-center justify-center text-gray-400 text-4xl">🛍️</div>
      )}
      <div className="p-4">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-semibold text-gray-900">{name}</h3>
          <button onClick={handleSaveClick}
            className={`p-1 rounded-full transition flex-shrink-0 ${isSaved ? "text-orange-500" : "text-gray-300 hover:text-orange-400"}`}
            title={isSaved ? t("unsave") : t("saveProduct")}>
            🔖
          </button>
        </div>
        {merchantName && (
          <p className="text-xs text-orange-500 font-medium">{merchantName}{merchantCity && `, ${merchantCity}`}</p>
        )}
        <p className="text-sm text-gray-600 mt-1 line-clamp-2">{description}</p>
        {category && <p className="text-xs text-gray-400 mt-1">{category}</p>}
        <div className="flex items-center gap-2 mt-2">
          <span className="text-orange-600 font-bold">€{discountedPrice.toFixed(2)}</span>
          <span className="text-gray-400 line-through text-sm">€{originalPrice.toFixed(2)}</span>
          <span className="bg-orange-100 text-orange-700 text-xs font-bold px-1.5 py-0.5 rounded">-{savings}%</span>
        </div>

        {showClaim && (
          claimed ? (
            <div className="mt-3 w-full text-sm font-semibold py-2 rounded-lg bg-gray-100 text-gray-400 text-center">
              ✓ {t("alreadyClaimed")}
            </div>
          ) : (
            <button
              onClick={handleClaim}
              disabled={claiming}
              className="mt-3 w-full text-sm font-semibold py-2 rounded-lg bg-orange-500 hover:bg-orange-600 text-white transition disabled:opacity-60"
            >
              {claiming ? "…" : t("claimProduct")}
            </button>
          )
        )}
      </div>

      {showPrompt && (
        <div className="absolute inset-0 bg-white/95 flex flex-col items-center justify-center text-center p-4 rounded-xl">
          <p className="text-gray-800 font-medium mb-3">{t("createAccountToSave")}</p>
          <div className="flex gap-2">
            <Link href="/consumer/register" className="bg-orange-500 text-white text-sm px-4 py-2 rounded-lg hover:bg-orange-600">
              {t("signUpFree")}
            </Link>
            <Link href="/consumer/login" className="border border-gray-200 text-gray-600 text-sm px-4 py-2 rounded-lg hover:bg-gray-50">
              {t("signIn")}
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
