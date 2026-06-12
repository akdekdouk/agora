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
  beauty: "Beauté", hotel: "Hôtellerie", education: "Éducation",
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

function MerchantDrawer({ merchant }: { merchant: Merchant }) {
  const [hovered, setHovered] = useState(false);
  const { id, businessName, city, description, logo, _count } = merchant;

  return (
    <Link href={`/merchants/${id}`}>
      <div
        className="flex items-center gap-3 px-4 py-3 bg-white border border-gray-100 rounded-xl cursor-pointer transition-all"
        style={{
          boxShadow: hovered ? "0 4px 16px rgba(0,0,0,0.10)" : "0 1px 4px rgba(0,0,0,0.05)",
          transform: hovered ? "translateX(4px)" : "none",
          transition: "all 0.15s ease",
          borderLeftWidth: hovered ? "3px" : "1px",
          borderLeftColor: hovered ? "var(--color-primary)" : undefined,
        }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        {/* Logo */}
        <div className="flex-shrink-0">
          {logo ? (
            <Image src={logo} alt={businessName} width={40} height={40} className="rounded-full object-cover" />
          ) : (
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold"
              style={{ backgroundColor: "var(--color-primary)" }}
            >
              {businessName[0]}
            </div>
          )}
        </div>

        {/* Name + city */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-gray-900 truncate leading-tight">{businessName}</p>
          <p className="text-xs text-gray-500 truncate">{city}</p>
        </div>

        {/* Hover: description snippet */}
        {hovered && description && (
          <p className="hidden md:block text-xs text-gray-500 max-w-[200px] line-clamp-1 flex-shrink-0">
            {description}
          </p>
        )}

        {/* Badges */}
        <div className="flex-shrink-0 flex items-center gap-1.5">
          {_count && _count.offers > 0 && (
            <span
              className="text-[10px] font-bold text-white px-2 py-0.5 rounded-full"
              style={{ backgroundColor: "var(--color-primary)" }}
            >
              {_count.offers} offre{_count.offers > 1 ? "s" : ""}
            </span>
          )}
          {_count && _count.products > 0 && (
            <span className="text-[10px] font-medium bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">
              {_count.products} produit{_count.products > 1 ? "s" : ""}
            </span>
          )}
          <svg className="w-3.5 h-3.5 text-gray-300 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </div>
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

  const [activeTab, setActiveTab] = useState(categories[0]);

  return (
    <div>
      {/* Horizontal category tabs */}
      <div className="flex gap-2 overflow-x-auto pb-3 mb-6" style={{ scrollbarWidth: "none" }}>
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveTab(cat)}
            className="flex-shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-all border"
            style={
              activeTab === cat
                ? { backgroundColor: "var(--color-primary)", color: "white", borderColor: "var(--color-primary)" }
                : { backgroundColor: "white", color: "#4b5563", borderColor: "#e5e7eb" }
            }
          >
            <span>{CATEGORY_EMOJI[cat] ?? "🏪"}</span>
            <span>{CATEGORY_LABEL[cat] ?? cat}</span>
            <span
              className="text-[11px] px-1.5 py-0.5 rounded-full font-bold"
              style={
                activeTab === cat
                  ? { backgroundColor: "rgba(255,255,255,0.25)", color: "white" }
                  : { backgroundColor: "#f3f4f6", color: "#6b7280" }
              }
            >
              {groups[cat].length}
            </span>
          </button>
        ))}
      </div>

      {/* Vertical list of merchant drawers */}
      <div className="space-y-2">
        {(groups[activeTab] ?? []).map((m) => (
          <MerchantDrawer key={m.id} merchant={m} />
        ))}
      </div>
    </div>
  );
}
