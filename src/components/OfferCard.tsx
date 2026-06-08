"use client";

import Image from "next/image";
import { useState } from "react";
import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";

interface Props {
  title: string;
  description: string;
  photo?: string | null;
  discount: number;
  validFrom: string | Date;
  validTo: string | Date;
  merchantName?: string;
  onSave?: () => void;
  isSaved?: boolean;
  isLoggedIn?: boolean;
}

export default function OfferCard({ title, description, photo, discount, validFrom, validTo, merchantName, onSave, isSaved, isLoggedIn }: Props) {
  const from = new Date(validFrom).toLocaleDateString();
  const to = new Date(validTo).toLocaleDateString();
  const [showPrompt, setShowPrompt] = useState(false);
  const t = useTranslations("offerCard");

  function handleSaveClick(e: React.MouseEvent) {
    e.stopPropagation();
    if (!isLoggedIn) {
      setShowPrompt(true);
      setTimeout(() => setShowPrompt(false), 3000);
      return;
    }
    onSave?.();
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
