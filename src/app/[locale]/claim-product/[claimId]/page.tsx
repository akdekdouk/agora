"use client";

import { useEffect, useState, useRef } from "react";
import { useParams } from "next/navigation";
import QRCode from "qrcode";
import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";

interface ClaimData {
  id: string;
  code: string;
  status: string;
  claimedAt: string;
  product: {
    name: string;
    discountedPrice: number;
    originalPrice: number;
    images: string;
    merchant: { businessName: string; city: string };
  };
}

export default function ProductClaimPage() {
  const { claimId } = useParams<{ claimId: string }>();
  const [claim, setClaim] = useState<ClaimData | null>(null);
  const [error, setError] = useState("");
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const t = useTranslations("claim");

  useEffect(() => {
    fetch(`/api/consumer/claim-product-detail?claimId=${claimId}`)
      .then((r) => r.json())
      .then((data: ClaimData) => {
        if (data && !("error" in data)) setClaim(data);
        else setError(t("notFound"));
      })
      .catch(() => setError(t("loadFailed")));
  }, [claimId, t]);

  useEffect(() => {
    if (!claim || !canvasRef.current) return;
    const scanUrl = `${window.location.origin}/scan?code=${claim.code}&type=product`;
    QRCode.toCanvas(canvasRef.current, scanUrl, {
      width: 240,
      margin: 2,
      color: { dark: "#1a1a1a", light: "#ffffff" },
    });
  }, [claim]);

  if (error) return <div className="min-h-screen flex items-center justify-center"><p className="text-red-500">{error}</p></div>;
  if (!claim) return <div className="min-h-screen flex items-center justify-center"><p className="text-gray-400">{t("loading")}</p></div>;

  let firstImage = "";
  try { firstImage = (JSON.parse(claim.product.images) as string[])[0] ?? ""; } catch { /* empty */ }
  const savings = Math.round((1 - claim.product.discountedPrice / claim.product.originalPrice) * 100);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 w-full max-w-md text-center">
        <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="text-green-600 text-2xl">✓</span>
        </div>
        <h1 className="text-xl font-bold text-gray-900 mb-1">{claim.product.name}</h1>
        <p className="text-orange-500 font-medium text-sm mb-1">{claim.product.merchant.businessName}</p>
        <p className="text-gray-400 text-xs mb-4">{claim.product.merchant.city}</p>

        <div className="flex items-center justify-center gap-2 mb-6">
          <span className="text-orange-600 font-bold text-lg">€{claim.product.discountedPrice.toFixed(2)}</span>
          <span className="text-gray-400 line-through text-sm">€{claim.product.originalPrice.toFixed(2)}</span>
          <span className="bg-orange-100 text-orange-700 text-xs font-bold px-2 py-0.5 rounded">-{savings}%</span>
        </div>

        {firstImage && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={firstImage} alt={claim.product.name} className="w-32 h-32 object-cover object-top rounded-xl mx-auto mb-6" />
        )}

        <p className="text-sm text-gray-500 mb-4">{t("showQrToMerchant")}</p>
        <canvas ref={canvasRef} className="mx-auto rounded-xl" />

        <p className="text-xs text-gray-300 mt-4 font-mono">{claim.code}</p>
        <p className="text-xs text-gray-400 mt-2">
          {t("claimedOn", { date: new Date(claim.claimedAt).toLocaleDateString() })}
        </p>

        <Link href="/consumer/dashboard" className="mt-6 inline-block text-orange-500 text-sm hover:underline">
          ← {t("backToDashboard")}
        </Link>
      </div>
    </div>
  );
}
