"use client";

import Image from "next/image";
import { useState } from "react";
import Link from "next/link";

interface Props {
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
}

export default function ProductCard({ name, description, images, originalPrice, discountedPrice, category, merchantName, merchantCity, onSave, isSaved, isLoggedIn }: Props) {
  let imageList: string[] = [];
  try { imageList = JSON.parse(images); } catch { /* empty */ }
  const firstImage = imageList[0];
  const savings = Math.round((1 - discountedPrice / originalPrice) * 100);
  const [showPrompt, setShowPrompt] = useState(false);

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
      {firstImage ? (
        <div className="relative h-40 w-full">
          <Image src={firstImage} alt={name} fill className="object-cover" />
        </div>
      ) : (
        <div className="h-40 bg-gray-100 flex items-center justify-center text-gray-400 text-4xl">🛍️</div>
      )}
      <div className="p-4">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-semibold text-gray-900">{name}</h3>
          <button
            onClick={handleSaveClick}
            className={`p-1 rounded-full transition flex-shrink-0 ${isSaved ? "text-orange-500" : "text-gray-300 hover:text-orange-400"}`}
            title={isSaved ? "Unsave" : "Save this product"}
          >
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
      </div>

      {showPrompt && (
        <div className="absolute inset-0 bg-white/95 flex flex-col items-center justify-center text-center p-4 rounded-xl">
          <p className="text-gray-800 font-medium mb-3">Create a free account to save products</p>
          <div className="flex gap-2">
            <Link
              href="/consumer/register"
              className="bg-orange-500 text-white text-sm px-4 py-2 rounded-lg hover:bg-orange-600"
            >
              Sign up free
            </Link>
            <Link
              href="/consumer/login"
              className="border border-gray-200 text-gray-600 text-sm px-4 py-2 rounded-lg hover:bg-gray-50"
            >
              Sign in
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
