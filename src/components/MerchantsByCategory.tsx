"use client";

import { Link } from "@/i18n/navigation";
import Image from "next/image";
import { useState } from "react";

const CATEGORY_EMOJI: Record<string, string> = {
  restaurant: "🍽️", shop: "🛍️", artisan: "🛠️", beauty: "💆", hotel: "🏨",
  education: "📚", health: "🏥", sport: "⚽", services: "🔧", other: "🏪",
};

const CATEGORY_LABEL: Record<string, string> = {
  restaurant: "Restaurants", shop: "Boutiques", artisan: "Artisans",
  beauty: "Beauté & Bien-être", hotel: "Hôtellerie", education: "Éducation",
  health: "Santé", sport: "Sport", services: "Services", other: "Autres",
};

interface Merchant {
  id: string;
  businessName: string;
  category: string;
  city: string;
  description?: string | null;
  logo?: string | null;
  _count?: { offers: number; products: number };
}

function MerchantItem({ merchant }: { merchant: Merchant }) {
  const [hovered, setHovered] = useState(false);
  const { id, businessName, city, description, logo, _count } = merchant;

  return (
    <Link href={`/merchants/${id}`}>
      <div
        className="relative flex-shrink-0 w-44 bg-white border border-gray-100 rounded-2xl p-4 cursor-pointer select-none"
        style={{
          transition: "box-shadow 0.2s, transform 0.2s",
          boxShadow: hovered ? "0 8px 24px rgba(0,0,0,0.14)" : "0 2px 8px rgba(0,0,0,0.07)",
          transform: hovered ? "translateY(-4px)" : "none",
        }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        <div className="flex justify-center mb-3">
          {logo ? (
            <Image src={logo} alt={businessName} width={56} height={56} className="rounded-full object-cover" />
          ) : (
            <div
              className="w-14 h-14 rounded-full flex items-center justify-center text-white text-xl font-bold"
              style={{ backgroundColor: "var(--color-primary)" }}
            >
              {businessName[0]}
            </div>
          )}
        </div>

        <p className="text-sm font-semibold text-gray-900 text-center leading-tight truncate">{businessName}</p>
        <p className="text-xs text-gray-500 text-center mt-0.5">{city}</p>

        {hovered && (
          <div className="mt-3 space-y-1.5" style={{ animation: "fadeInUp 0.15s ease" }}>
            {description && (
              <p className="text-xs text-gray-600 line-clamp-2 text-center">{description}</p>
            )}
            {_count && (_count.offers > 0 || _count.products > 0) && (
              <div className="flex justify-center gap-2 flex-wrap">
                {_count.offers > 0 && (
                  <span className="text-[10px] font-medium text-white px-2 py-0.5 rounded-full"
                    style={{ backgroundColor: "var(--color-primary)" }}>
                    {_count.offers} offre{_count.offers > 1 ? "s" : ""}
                  </span>
                )}
                {_count.products > 0 && (
                  <span className="text-[10px] font-medium bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                    {_count.products} produit{_count.products > 1 ? "s" : ""}
                  </span>
                )}
              </div>
            )}
            <p className="text-[11px] text-center font-semibold" style={{ color: "var(--color-primary)" }}>
              Voir le profil →
            </p>
          </div>
        )}
      </div>
    </Link>
  );
}

export default function MerchantsByCategory({ merchants }: { merchants: Merchant[] }) {
  const groups: Record<string, Merchant[]> = {};
  for (const m of merchants) {
    const cat = m.category || "other";
    if (!groups[cat]) groups[cat] = [];
    groups[cat].push(m);
  }

  const categories = Object.keys(groups).sort((a, b) => groups[b].length - groups[a].length);
  if (categories.length === 0) return null;

  return (
    <div className="space-y-10">
      {categories.map((cat) => (
        <div key={cat}>
          <div className="flex items-center gap-2 mb-4">
            <span className="text-2xl">{CATEGORY_EMOJI[cat] ?? "🏪"}</span>
            <h3 className="text-lg font-bold text-gray-900">{CATEGORY_LABEL[cat] ?? cat}</h3>
            <span className="text-sm text-gray-400 font-normal">· {groups[cat].length} commerce{groups[cat].length > 1 ? "s" : ""}</span>
          </div>
          <div
            className="flex gap-4 overflow-x-auto pb-3"
            style={{ scrollbarWidth: "thin", scrollbarColor: "var(--color-primary) transparent" }}
          >
            {groups[cat].map((m) => (
              <MerchantItem key={m.id} merchant={m} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
