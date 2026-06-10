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
  usedAt?: string;
  offer: {
    title: string;
    discount: number;
    validTo: string;
    merchant: { businessName: string; city: string };
  };
}

export default function ClaimPage() {
  const { claimId } = useParams<{ claimId: string }>();
  const [claim, setClaim] = useState<ClaimData | null>(null);
  const [error, setError] = useState("");
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const t = useTranslations("claim");

  useEffect(() => {
    fetch(`/api/consumer/claims-list?claimId=${claimId}`)
      .then((r) => r.json())
      .then((data: ClaimData) => {
        if (data && !("error" in data)) {
          setClaim(data);
        } else {
          setError(t("notFound"));
        }
      })
      .catch(() => setError(t("loadFailed")));
  }, [claimId]);

  useEffect(() => {
    if (!claim || !canvasRef.current) return;
    const scanUrl = `${window.location.origin}/scan?code=${claim.code}`;
    QRCode.toCanvas(canvasRef.current, scanUrl, {
      width: 240,
      margin: 2,
      color: { dark: "#1a1a1a", light: "#ffffff" },
    });
  }, [claim]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-red-500">{error}</p>
      </div>
    );
  }

  if (!claim) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const expired = new Date(claim.offer.validTo) < new Date();
  const isUsed = claim.status === "used";

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 w-full max-w-sm text-center">

        {/* Status badge */}
        {isUsed ? (
          <div className="bg-gray-100 text-gray-500 rounded-full px-4 py-1 text-sm font-medium mb-4 inline-block">
            {t("used")}
          </div>
        ) : expired ? (
          <div className="bg-red-50 text-red-500 rounded-full px-4 py-1 text-sm font-medium mb-4 inline-block">
            {t("expired")}
          </div>
        ) : (
          <div className="bg-green-50 text-green-600 rounded-full px-4 py-1 text-sm font-medium mb-4 inline-block">
            {t("valid")}
          </div>
        )}

        <h1 className="text-xl font-bold text-gray-900 mb-1">{claim.offer.title}</h1>
        <p className="text-orange-500 font-semibold text-2xl mb-1">-{claim.offer.discount}%</p>
        <p className="text-gray-500 text-sm mb-6">
          {claim.offer.merchant.businessName} · {claim.offer.merchant.city}
        </p>

        {!isUsed && !expired ? (
          <>
            <p className="text-xs text-gray-400 mb-3">{t("showQR")}</p>
            <div className="flex justify-center mb-4">
              <canvas ref={canvasRef} className="rounded-xl" />
            </div>
            <p className="text-xs text-gray-300 font-mono break-all">{claim.code}</p>
          </>
        ) : (
          <div className="py-8 text-gray-300 text-5xl">
            {isUsed ? "✓" : "✗"}
          </div>
        )}

        <p className="text-xs text-gray-400 mt-4">
          {t("validUntil", { date: new Date(claim.offer.validTo).toLocaleDateString() })}
        </p>
        <p className="text-xs text-gray-300 mt-1">
          {t("claimedOn", { date: new Date(claim.claimedAt).toLocaleDateString() })}
        </p>

        <Link href="/consumer/dashboard" className="block mt-6 text-sm text-orange-500 hover:underline">
          {t("backToSaved")}
        </Link>
      </div>
    </div>
  );
}
