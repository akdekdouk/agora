"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";

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

const CATEGORY_COLORS: Record<string, { bg: string; glow: string; emoji: string }> = {
  restaurant:  { bg: "#ef4444", glow: "rgba(239,68,68,0.45)",  emoji: "🍽️" },
  shop:        { bg: "#3b82f6", glow: "rgba(59,130,246,0.45)", emoji: "🛍️" },
  artisan:     { bg: "#f59e0b", glow: "rgba(245,158,11,0.45)", emoji: "🔨" },
  beauty:      { bg: "#ec4899", glow: "rgba(236,72,153,0.45)", emoji: "💅" },
  hotel:       { bg: "#8b5cf6", glow: "rgba(139,92,246,0.45)", emoji: "🏨" },
  education:   { bg: "#06b6d4", glow: "rgba(6,182,212,0.45)",  emoji: "📚" },
  health:      { bg: "#10b981", glow: "rgba(16,185,129,0.45)", emoji: "🏥" },
  sport:       { bg: "#f97316", glow: "rgba(249,115,22,0.45)", emoji: "🏋️" },
  services:    { bg: "#6b7280", glow: "rgba(107,114,128,0.45)",emoji: "🔧" },
  garage_sale: { bg: "#84cc16", glow: "rgba(132,204,22,0.45)", emoji: "🏷️" },
  other:       { bg: "#14b8a6", glow: "rgba(20,184,166,0.45)", emoji: "📦" },
};

function getColor(offer: Offer) {
  const cat = offer.category ?? offer.merchant.category ?? "other";
  return CATEGORY_COLORS[cat] ?? CATEGORY_COLORS.other;
}

function daysLeft(validTo: string) {
  return Math.max(0, Math.ceil((new Date(validTo).getTime() - Date.now()) / 86400000));
}

interface BubblePhysics {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  baseSize: number;
}

const HEIGHT = 500;
const FRICTION = 0.998;
const MAX_SPEED = 0.6;

export default function BubbleOffers({ offers }: { offers: Offer[] }) {
  const t = useTranslations("bubbleOffers");
  const containerRef = useRef<HTMLDivElement>(null);
  const physicsRef = useRef<BubblePhysics[]>([]);
  const rafRef = useRef<number>(0);
  const [positions, setPositions] = useState<Record<string, { x: number; y: number }>>({});
  const [hovered, setHovered] = useState<string | null>(null);
  const [sizeScale, setSizeScale] = useState(1); // 0.5 → 1.5

  // Init physics when offers change
  useEffect(() => {
    if (!containerRef.current) return;
    const W = containerRef.current.offsetWidth;
    physicsRef.current = offers.map((o, i) => {
      const baseSize = 80 + (o.discount / 100) * 55;
      const r = (baseSize * sizeScale) / 2;
      const cols = Math.ceil(Math.sqrt(offers.length));
      const col = i % cols;
      const row = Math.floor(i / cols);
      return {
        id: o.id,
        x: r + 20 + col * ((W - r * 2 - 40) / Math.max(cols - 1, 1)),
        y: r + 20 + row * 90,
        vx: (Math.random() - 0.5) * 0.4,
        vy: (Math.random() - 0.5) * 0.4,
        baseSize,
      };
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [offers]);

  // Animation loop
  const tick = useCallback(() => {
    if (!containerRef.current) return;
    const W = containerRef.current.offsetWidth;
    const H = HEIGHT;
    const physics = physicsRef.current;

    for (let i = 0; i < physics.length; i++) {
      const b = physics[i];
      const r = (b.baseSize * sizeScale) / 2;

      // Random nudge
      b.vx += (Math.random() - 0.5) * 0.04;
      b.vy += (Math.random() - 0.5) * 0.04;

      // Clamp speed
      const speed = Math.sqrt(b.vx * b.vx + b.vy * b.vy);
      if (speed > MAX_SPEED) { b.vx = (b.vx / speed) * MAX_SPEED; b.vy = (b.vy / speed) * MAX_SPEED; }

      b.vx *= FRICTION;
      b.vy *= FRICTION;

      b.x += b.vx;
      b.y += b.vy;

      // Bounce off walls
      if (b.x - r < 0)   { b.x = r;     b.vx = Math.abs(b.vx); }
      if (b.x + r > W)   { b.x = W - r; b.vx = -Math.abs(b.vx); }
      if (b.y - r < 0)   { b.y = r;     b.vy = Math.abs(b.vy); }
      if (b.y + r > H)   { b.y = H - r; b.vy = -Math.abs(b.vy); }

      // Simple bubble-bubble separation
      for (let j = i + 1; j < physics.length; j++) {
        const b2 = physics[j];
        const r2 = (b2.baseSize * sizeScale) / 2;
        const dx = b2.x - b.x;
        const dy = b2.y - b.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const minDist = r + r2;
        if (dist < minDist && dist > 0) {
          const nx = dx / dist;
          const ny = dy / dist;
          const overlap = (minDist - dist) * 0.5;
          b.x  -= nx * overlap; b.y  -= ny * overlap;
          b2.x += nx * overlap; b2.y += ny * overlap;
          const rv = (b.vx - b2.vx) * nx + (b.vy - b2.vy) * ny;
          if (rv > 0) {
            b.vx  -= rv * nx * 0.3; b.vy  -= rv * ny * 0.3;
            b2.vx += rv * nx * 0.3; b2.vy += rv * ny * 0.3;
          }
        }
      }
    }

    setPositions(Object.fromEntries(physics.map((b) => [b.id, { x: b.x, y: b.y }])));
    rafRef.current = requestAnimationFrame(tick);
  }, [sizeScale]);

  useEffect(() => {
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [tick]);

  if (offers.length === 0) return null;

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-1">{t("title")}</h2>
      <p className="text-sm text-gray-400 mb-4">{t("subtitle")}</p>

      <div className="flex gap-3">
        {/* Main bubble arena */}
        <div
          ref={containerRef}
          className="relative flex-1 overflow-hidden rounded-3xl"
          style={{
            height: HEIGHT,
            background: "linear-gradient(180deg, #fdf8f0 0%, #f5ede0 60%, #e8d8c0 100%)",
            border: "2px solid rgba(180,140,90,0.2)",
          }}
        >
          {/* Wicker rim */}
          <div
            className="absolute inset-x-0 top-0 z-10"
            style={{
              height: 18,
              background: "repeating-linear-gradient(90deg, rgba(150,100,50,0.35) 0px, rgba(150,100,50,0.35) 10px, rgba(210,170,110,0.2) 10px, rgba(210,170,110,0.2) 20px)",
              borderRadius: "12px 12px 0 0",
            }}
          />

          {/* Bubbles */}
          {offers.map((offer) => {
            const pos = positions[offer.id];
            if (!pos) return null;
            const color = getColor(offer);
            const size = offer.id in physicsRef.current.reduce((acc, b) => ({ ...acc, [b.id]: b }), {} as Record<string, BubblePhysics>)
              ? (physicsRef.current.find((b) => b.id === offer.id)?.baseSize ?? 100) * sizeScale
              : 100 * sizeScale;
            const isHovered = hovered === offer.id;
            const days = daysLeft(offer.validTo);

            return (
              <div
                key={offer.id}
                className="absolute"
                style={{
                  left: pos.x,
                  top: pos.y,
                  width: size,
                  height: size,
                  transform: "translate(-50%, -50%)",
                  zIndex: isHovered ? 50 : 10,
                  cursor: "pointer",
                  willChange: "transform",
                }}
                onMouseEnter={() => setHovered(offer.id)}
                onMouseLeave={() => setHovered(null)}
              >
                {/* Sphere */}
                <div
                  className="w-full h-full rounded-full transition-transform duration-200 select-none"
                  style={{
                    background: `radial-gradient(circle at 35% 28%, rgba(255,255,255,0.9) 0%, ${color.bg}bb 28%, ${color.bg} 65%, ${color.bg}88 100%)`,
                    boxShadow: isHovered
                      ? `0 0 0 3px white, 0 0 28px 8px ${color.glow}, inset 0 -6px 14px rgba(0,0,0,0.18)`
                      : `0 6px 20px ${color.glow}, inset 0 -4px 12px rgba(0,0,0,0.12)`,
                    transform: isHovered ? "scale(1.1)" : "scale(1)",
                  }}
                >
                  {/* Shine */}
                  <div className="absolute rounded-full" style={{ top: "10%", left: "18%", width: "38%", height: "24%", background: "rgba(255,255,255,0.6)", filter: "blur(4px)", transform: "rotate(-15deg)" }} />
                  {/* Content */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-0.5">
                    <span style={{ fontSize: size * 0.27, lineHeight: 1 }}>{color.emoji}</span>
                    <span className="font-black text-white" style={{ fontSize: size * 0.21, lineHeight: 1, textShadow: "0 1px 4px rgba(0,0,0,0.35)" }}>
                      -{offer.discount}%
                    </span>
                  </div>
                </div>

                {/* Hover overlay */}
                {isHovered && (
                  <div
                    className="absolute z-50 bg-white rounded-2xl shadow-2xl border border-gray-100 p-3"
                    style={{
                      width: 210,
                      left: pos.x > (containerRef.current?.offsetWidth ?? 400) / 2 ? "auto" : "calc(100% + 10px)",
                      right: pos.x > (containerRef.current?.offsetWidth ?? 400) / 2 ? "calc(100% + 10px)" : "auto",
                      top: "50%",
                      transform: "translateY(-50%)",
                      pointerEvents: "none",
                    }}
                  >
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full inline-block mb-2" style={{ background: color.bg + "22", color: color.bg }}>
                      {color.emoji} {offer.category ?? offer.merchant.category}
                    </span>
                    <p className="font-bold text-gray-900 text-sm leading-snug mb-1 line-clamp-2">{offer.title}</p>
                    <p className="text-gray-500 text-xs line-clamp-2 mb-2">{offer.description}</p>
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="font-black text-xl" style={{ color: color.bg }}>-{offer.discount}%</span>
                      <span className={`font-medium ${days <= 3 ? "text-red-500" : "text-gray-400"}`}>
                        {days === 0 ? t("expiresToday") : t("daysLeft", { days })}
                      </span>
                    </div>
                    <p className="text-xs text-gray-400 mb-2">🏪 {offer.merchant.businessName} · {offer.merchant.city}</p>
                    <Link href={`/merchants/${offer.merchant.id}`} className="block text-center text-xs font-semibold text-white py-1.5 rounded-lg pointer-events-auto" style={{ background: color.bg }}>
                      {t("viewOffer")}
                    </Link>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Vertical size slider */}
        <div className="flex flex-col items-center justify-center gap-2 py-4" style={{ width: 40 }}>
          <span className="text-xs text-gray-400 text-center leading-tight">{t("zoomIn")}</span>
          <input
            type="range"
            min={40}
            max={150}
            value={Math.round(sizeScale * 100)}
            onChange={(e) => setSizeScale(parseInt(e.target.value) / 100)}
            className="cursor-pointer"
            style={{
              writingMode: "vertical-lr" as const,
              direction: "rtl",
              height: 260,
              width: 6,
              accentColor: "var(--color-primary)",
            }}
          />
          <span className="text-xs text-gray-400 text-center leading-tight">{t("zoomOut")}</span>
        </div>
      </div>
    </div>
  );
}
