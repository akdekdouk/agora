"use client";

import Image from "next/image";
import { useState } from "react";
import { Link, useRouter } from "@/i18n/navigation";
import { useTranslations } from "next-intl";

interface Props {
  id?: string;
  title: string;
  description: string;
  photo?: string | null;
  discount: number;
  maxClaims?: number | null;
  claimsCount?: number;
  validFrom: string | Date;
  validTo: string | Date;
  merchantName?: string;
  onSave?: () => void;
  isSaved?: boolean;
  isLoggedIn?: boolean;
  showClaim?: boolean;
  alreadyClaimed?: boolean;
}

export default function OfferCard({
  id, title, description, photo, discount, maxClaims, claimsCount = 0,
  validFrom, validTo, merchantName, onSave, isSaved: initialSaved, isLoggedIn, showClaim, alreadyClaimed,
}: Props) {
  const from = new Date(validFrom).toLocaleDateString();
  const to = new Date(validTo).toLocaleDateString();
  const [showPrompt, setShowPrompt] = useState(false);
  const [claiming, setClaiming] = useState(false);
  const [claimed, setClaimed] = useState(false);
  const [isSaved, setIsSaved] = useState(initialSaved ?? false);
  const [soldOut, setSoldOut] = useState(
    maxClaims !== null && maxClaims !== undefined && claimsCount >= maxClaims
  );
  const t = useTranslations("offerCard");
  const router = useRouter();
  const spotsLeft = maxClaims != null ? maxClaims - claimsCount : null;

  async function handleSaveClick(e: React.MouseEvent) {
    e.stopPropagation();
    if (!isLoggedIn) { setShowPrompt(true); setTimeout(() => setShowPrompt(false), 3000); return; }
    if (onSave) { onSave(); return; }
    if (!id) return;
    try {
      const res = await fetch("/api/consumer/save-offer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ offerId: id }),
      });
      if (res.ok) {
        const data = await res.json() as { saved: boolean };
        setIsSaved(data.saved);
      }
    } catch { /* ignore */ }
  }

  async function handleClaim(e: React.MouseEvent) {
    e.stopPropagation();
    if (!isLoggedIn || !id) { setShowPrompt(true); setTimeout(() => setShowPrompt(false), 3000); return; }
    setClaiming(true);
    const res = await fetch("/api/consumer/claim", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ offerId: id }),
    });
    const data = await res.json() as { id?: string; error?: string };
    setClaiming(false);
    if (res.status === 409 || data.error === "soldOut") {
      setSoldOut(true);
    } else if (res.ok && data.id) {
      setClaimed(true);
      router.push(`/claim/${data.id}`);
    }
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden relative">
      {photo && (
        <div className="relative h-40 w-full">
          <Image src={photo} alt={title} fill className="object-cover" />
        </div>
      )}
      <div className="p-4">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-semibold text-gray-900">{title}</h3>
          <div className="flex items-center gap-1 flex-shrink-0">
            <span className="bg-orange-500 text-white text-sm font-bold px-2 py-0.5 rounded-full">
              -{discount}%
            </span>
            <button onClick={handleSaveClick}
              className={`p-1 rounded-full transition ${isSaved ? "text-orange-500" : "text-gray-300 hover:text-orange-400"}`}
              title={isSaved ? t("unsave") : t("saveOffer")}>
              🔖
            </button>
          </div>
        </div>
        {merchantName && <p className="text-xs text-orange-500 font-medium mt-0.5">{merchantName}</p>}
        <p className="text-sm text-gray-600 mt-1 line-clamp-2">{description}</p>
        <p className="text-xs text-gray-400 mt-2">{from} → {to}</p>

        {spotsLeft !== null && (
          <p className={`text-xs font-medium mt-1 ${spotsLeft <= 5 ? "text-red-500" : "text-gray-400"}`}>
            {soldOut ? t("soldOut") : t("spotsLeft", { count: spotsLeft })}
          </p>
        )}

        {showClaim && id && (
          alreadyClaimed ? (
            <div className="mt-3 w-full text-sm font-semibold py-2 rounded-lg bg-gray-100 text-gray-400 text-center cursor-default">
              ✓ {t("alreadyClaimed")}
            </div>
          ) : (
            <button
              onClick={handleClaim}
              disabled={claiming || claimed || soldOut}
              className={`mt-3 w-full text-sm font-semibold py-2 rounded-lg transition ${
                soldOut
                  ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                  : "bg-orange-500 hover:bg-orange-600 text-white disabled:opacity-60"
              }`}
            >
              {soldOut ? t("soldOut") : claimed ? "✓ " + t("alreadyClaimed") : claiming ? "…" : t("claimOffer")}
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
