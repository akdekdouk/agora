"use client";

import { useEffect, useRef, useState } from "react";
import { Link } from "@/i18n/navigation";

interface Offer {
  id: string;
  title: string;
  description: string;
  discount: number;
  validTo: string;
  category: string | null;
  merchant: { id: string; businessName: string; category: string; city: string };
  claimsCount: number;
  maxClaims: number | null;
}

const CATEGORY_COLORS: Record<string, { bg: string; glow: string; label: string }> = {
  restaurant: { bg: "#ef4444", glow: "rgba(239,68,68,0.5)", label: "🍽️" },
  shop:        { bg: "#3b82f6", glow: "rgba(59,130,246,0.5)", label: "🛍️" },
  artisan:     { bg: "#f59e0b", glow: "rgba(245,158,11,0.5)", label: "🔨" },
  beauty:      { bg: "#ec4899", glow: "rgba(236,72,153,0.5)", label: "💅" },
  hotel:       { bg: "#8b5cf6", glow: "rgba(139,92,246,0.5)", label: "🏨" },
  education:   { bg: "#06b6d4", glow: "rgba(6,182,212,0.5)", label: "📚" },
  health:      { bg: "#10b981", glow: "rgba(16,185,129,0.5)", label: "🏥" },
  sport:       { bg: "#f97316", glow: "rgba(249,115,22,0.5)", label: "🏋️" },
  services:    { bg: "#6b7280", glow: "rgba(107,114,128,0.5)", label: "🔧" },
  garage_sale: { bg: "#84cc16", glow: "rgba(132,204,22,0.5)", label: "🏷️" },
  other:       { bg: "#14b8a6", glow: "rgba(20,184,166,0.5)", label: "📦" },
};

function getColor(offer: Offer) {
  const cat = offer.category ?? offer.merchant.category ?? "other";
  return CATEGORY_COLORS[cat] ?? CATEGORY_COLORS.other;
}

function daysLeft(validTo: string) {
  const diff = new Date(validTo).getTime() - Date.now();
  return Math.max(0, Math.ceil(diff / 86400000));
}

interface BubbleState {
  offer: Offer;
  x: number; // % from left
  y: number; // % from top
  size: number; // px
  delay: number; // animation delay s
  duration: number; // animation duration s
  driftX: number; // drift amount px
  driftY: number;
}

function initBubbles(offers: Offer[], width: number, height: number): BubbleState[] {
  return offers.map((offer, i) => {
    const size = 80 + (offer.discount / 100) * 60 + Math.random() * 30; // 80-170px
    // spread across the container avoiding edges
    const margin = size / 2 + 10;
    const x = margin + Math.random() * (width - margin * 2);
    const y = margin + Math.random() * (height - margin * 2);
    return {
      offer,
      x,
      y,
      size,
      delay: (i * 0.3) % 3,
      duration: 3 + Math.random() * 2,
      driftX: (Math.random() - 0.5) * 16,
      driftY: (Math.random() - 0.5) * 16,
    };
  });
}

export default function BubbleOffers({ offers }: { offers: Offer[] }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [bubbles, setBubbles] = useState<BubbleState[]>([]);
  const [hovered, setHovered] = useState<string | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    const { offsetWidth: w, offsetHeight: h } = containerRef.current;
    setBubbles(initBubbles(offers, w, h));
  }, [offers]);

  if (offers.length === 0) return null;

  return (
    <div className="relative w-full" style={{ height: 520 }}>
      {/* Basket / bowl shape */}
      <div
        className="absolute inset-x-0 bottom-0"
        style={{
          height: "80%",
          background: "linear-gradient(180deg, transparent 0%, rgba(245,240,230,0.6) 30%, rgba(210,185,150,0.35) 100%)",
          borderRadius: "0 0 50% 50% / 0 0 30px 30px",
          border: "2px solid rgba(180,140,90,0.25)",
          borderTop: "none",
        }}
      />

      {/* Wicker rim */}
      <div
        className="absolute inset-x-4"
        style={{
          top: "20%",
          height: 28,
          background: "repeating-linear-gradient(90deg, rgba(160,110,60,0.4) 0px, rgba(160,110,60,0.4) 8px, rgba(200,160,100,0.2) 8px, rgba(200,160,100,0.2) 16px)",
          borderRadius: 14,
          border: "1.5px solid rgba(160,110,60,0.3)",
        }}
      />

      {/* Bubbles layer */}
      <div ref={containerRef} className="absolute inset-0">
        {bubbles.map((b) => {
          const color = getColor(b.offer);
          const isHovered = hovered === b.offer.id;
          const days = daysLeft(b.offer.validTo);

          return (
            <div
              key={b.offer.id}
              className="absolute"
              style={{
                left: b.x,
                top: b.y,
                width: b.size,
                height: b.size,
                transform: "translate(-50%, -50%)",
                zIndex: isHovered ? 50 : 10,
                cursor: "pointer",
              }}
              onMouseEnter={() => setHovered(b.offer.id)}
              onMouseLeave={() => setHovered(null)}
            >
              {/* Sphere */}
              <div
                className="w-full h-full rounded-full transition-transform duration-300 select-none"
                style={{
                  background: `radial-gradient(circle at 35% 30%, white 0%, ${color.bg}cc 30%, ${color.bg} 70%, ${color.bg}99 100%)`,
                  boxShadow: isHovered
                    ? `0 0 0 3px white, 0 0 20px 6px ${color.glow}, inset 0 -4px 12px rgba(0,0,0,0.2)`
                    : `0 4px 16px ${color.glow}, inset 0 -4px 12px rgba(0,0,0,0.15)`,
                  animation: `bubble-float-${b.offer.id.slice(-4)} ${b.duration}s ease-in-out ${b.delay}s infinite`,
                  transform: isHovered ? "scale(1.12)" : "scale(1)",
                }}
              >
                {/* Shine highlight */}
                <div
                  className="absolute rounded-full"
                  style={{
                    top: "12%", left: "20%",
                    width: "35%", height: "22%",
                    background: "rgba(255,255,255,0.55)",
                    filter: "blur(3px)",
                    transform: "rotate(-20deg)",
                  }}
                />
                {/* Emoji + discount */}
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span style={{ fontSize: b.size * 0.28 }}>{color.label}</span>
                  <span
                    className="font-black text-white leading-none"
                    style={{
                      fontSize: b.size * 0.22,
                      textShadow: "0 1px 3px rgba(0,0,0,0.4)",
                    }}
                  >
                    -{b.offer.discount}%
                  </span>
                </div>
              </div>

              {/* Overlay card */}
              {isHovered && (
                <div
                  className="absolute z-50 bg-white rounded-2xl shadow-2xl border border-gray-100 p-3 text-left"
                  style={{
                    width: 220,
                    left: b.x > 300 ? "auto" : "110%",
                    right: b.x > 300 ? "110%" : "auto",
                    top: "50%",
                    transform: "translateY(-50%)",
                    pointerEvents: "none",
                  }}
                >
                  <div
                    className="text-xs font-bold px-2 py-0.5 rounded-full inline-block mb-2"
                    style={{ backgroundColor: color.bg + "22", color: color.bg }}
                  >
                    {color.label} {b.offer.category ?? b.offer.merchant.category}
                  </div>
                  <p className="font-bold text-gray-900 text-sm leading-snug mb-1 line-clamp-2">{b.offer.title}</p>
                  <p className="text-gray-500 text-xs line-clamp-2 mb-2">{b.offer.description}</p>
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-black text-lg" style={{ color: color.bg }}>-{b.offer.discount}%</span>
                    <span className={`font-medium ${days <= 3 ? "text-red-500" : "text-gray-400"}`}>
                      {days === 0 ? "Expire aujourd'hui" : `${days}j restants`}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 mt-1">🏪 {b.offer.merchant.businessName} · {b.offer.merchant.city}</p>
                  <div
                    className="mt-2 text-center text-xs font-semibold text-white py-1.5 rounded-lg"
                    style={{ backgroundColor: color.bg }}
                  >
                    Voir l&apos;offre →
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Keyframe animations injected per bubble */}
      <style>{
        bubbles.map((b) => `
          @keyframes bubble-float-${b.offer.id.slice(-4)} {
            0%, 100% { transform: translate(-50%, -50%) translateY(0px) translateX(0px); }
            33%       { transform: translate(-50%, -50%) translateY(${b.driftY}px) translateX(${b.driftX * 0.5}px); }
            66%       { transform: translate(-50%, -50%) translateY(${b.driftY * 0.3}px) translateX(${b.driftX}px); }
          }
        `).join("\n")
      }</style>
    </div>
  );
}
