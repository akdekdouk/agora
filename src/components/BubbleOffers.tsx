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

const WINDOW_HEIGHT = 380;
const FRICTION = 0.998;
const MAX_SPEED = 0.55;

export default function BubbleOffers({ offers }: { offers: Offer[] }) {
  const t = useTranslations("bubbleOffers");
  const windowRef = useRef<HTMLDivElement>(null);
  const physicsRef = useRef<BubblePhysics[]>([]);
  const rafRef = useRef<number>(0);
  const [positions, setPositions] = useState<Record<string, { x: number; y: number }>>({});
  const [hovered, setHovered] = useState<string | null>(null);
  const [sizeScale, setSizeScale] = useState(1);
  const [windowWidth, setWindowWidth] = useState(800);

  // Init physics
  useEffect(() => {
    const W = windowRef.current?.offsetWidth ?? 800;
    setWindowWidth(W);
    const cols = Math.ceil(Math.sqrt(offers.length));
    physicsRef.current = offers.map((o, i) => {
      const baseSize = 75 + (o.discount / 100) * 55;
      const r = (baseSize * sizeScale) / 2;
      const col = i % cols;
      const row = Math.floor(i / cols);
      return {
        id: o.id,
        x: r + 30 + col * ((W - r * 2 - 60) / Math.max(cols - 1, 1)),
        y: r + 20 + row * 95,
        vx: (Math.random() - 0.5) * 0.4,
        vy: (Math.random() - 0.5) * 0.4,
        baseSize,
      };
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [offers]);

  const tick = useCallback(() => {
    const W = windowRef.current?.offsetWidth ?? 800;
    const H = WINDOW_HEIGHT;
    const physics = physicsRef.current;

    for (let i = 0; i < physics.length; i++) {
      const b = physics[i];
      const r = (b.baseSize * sizeScale) / 2;

      b.vx += (Math.random() - 0.5) * 0.035;
      b.vy += (Math.random() - 0.5) * 0.035;

      const speed = Math.sqrt(b.vx * b.vx + b.vy * b.vy);
      if (speed > MAX_SPEED) { b.vx = (b.vx / speed) * MAX_SPEED; b.vy = (b.vy / speed) * MAX_SPEED; }

      b.vx *= FRICTION;
      b.vy *= FRICTION;
      b.x += b.vx;
      b.y += b.vy;

      if (b.x - r < 0)   { b.x = r;     b.vx =  Math.abs(b.vx); }
      if (b.x + r > W)   { b.x = W - r; b.vx = -Math.abs(b.vx); }
      if (b.y - r < 0)   { b.y = r;     b.vy =  Math.abs(b.vy); }
      if (b.y + r > H)   { b.y = H - r; b.vy = -Math.abs(b.vy); }

      for (let j = i + 1; j < physics.length; j++) {
        const b2 = physics[j];
        const r2 = (b2.baseSize * sizeScale) / 2;
        const dx = b2.x - b.x;
        const dy = b2.y - b.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const minDist = r + r2;
        if (dist < minDist && dist > 0.01) {
          const nx = dx / dist;
          const ny = dy / dist;
          const overlap = (minDist - dist) * 0.5;
          b.x  -= nx * overlap * 0.5; b.y  -= ny * overlap * 0.5;
          b2.x += nx * overlap * 0.5; b2.y += ny * overlap * 0.5;
          const rv = (b.vx - b2.vx) * nx + (b.vy - b2.vy) * ny;
          if (rv > 0) {
            b.vx  -= rv * nx * 0.25; b.vy  -= rv * ny * 0.25;
            b2.vx += rv * nx * 0.25; b2.vy += rv * ny * 0.25;
          }
        }
      }
    }

    setWindowWidth(W);
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
      <p className="text-sm text-gray-400 mb-5">{t("subtitle")}</p>

      <div className="flex gap-4 items-start">
        {/* ── SHOP FACADE ── */}
        <div className="flex-1 relative" style={{ userSelect: "none" }}>

          {/* Sky / building top */}
          <div style={{ background: "linear-gradient(180deg, #dbeafe 0%, #bfdbfe 100%)", borderRadius: "16px 16px 0 0", height: 28 }} />

          {/* Facade wall */}
          <div style={{ background: "#f5f0e8", position: "relative" }}>

            {/* Awning / marquee */}
            <div
              style={{
                background: "repeating-linear-gradient(90deg, var(--color-primary) 0px, var(--color-primary) 28px, #fff 28px, #fff 56px)",
                height: 38,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                position: "relative",
                zIndex: 5,
              }}
            >
              {/* Awning fringe */}
              <div style={{ position: "absolute", bottom: -10, left: 0, right: 0, display: "flex" }}>
                {Array.from({ length: 32 }).map((_, i) => (
                  <div key={i} style={{ flex: 1, height: 10, background: i % 2 === 0 ? "var(--color-primary)" : "white", borderRadius: "0 0 6px 6px" }} />
                ))}
              </div>
              <span className="font-black text-white text-base tracking-widest drop-shadow" style={{ zIndex: 6 }}>
                🏪 AGORA MARKET
              </span>
            </div>

            {/* Window frame row */}
            <div style={{ padding: "18px 16px 0 16px", display: "flex", gap: 12, alignItems: "flex-end" }}>

              {/* Left pillar */}
              <div style={{ width: 18, background: "#d4c5a9", borderRadius: 4, alignSelf: "stretch", flexShrink: 0 }} />

              {/* The shop window (vitrine) */}
              <div style={{ flex: 1, position: "relative" }}>
                {/* Window top arch */}
                <div style={{
                  height: 20,
                  background: "#c8b89a",
                  borderRadius: "12px 12px 0 0",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                }}>
                  {Array.from(new Set(offers.map((o) => o.category ?? o.merchant.category))).slice(0, 5).map((cat) => (
                    <span key={cat} style={{ fontSize: 10 }}>{CATEGORY_COLORS[cat]?.emoji ?? "📦"}</span>
                  ))}
                </div>

                {/* Glass window — bubble arena */}
                <div
                  ref={windowRef}
                  style={{
                    height: WINDOW_HEIGHT,
                    background: "linear-gradient(160deg, rgba(219,234,254,0.55) 0%, rgba(186,230,253,0.4) 40%, rgba(224,242,254,0.55) 100%)",
                    border: "3px solid #c8b89a",
                    borderTop: "none",
                    position: "relative",
                    overflow: "hidden",
                  }}
                >
                  {/* Glass reflections */}
                  <div style={{ position: "absolute", top: 0, left: "8%", width: "18%", bottom: 0, background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.18), transparent)", pointerEvents: "none", zIndex: 30 }} />
                  <div style={{ position: "absolute", top: 0, left: "55%", width: "10%", bottom: 0, background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.12), transparent)", pointerEvents: "none", zIndex: 30 }} />

                  {/* Window cross frame */}
                  <div style={{ position: "absolute", top: "50%", left: 0, right: 0, height: 6, background: "#c8b89a", transform: "translateY(-50%)", zIndex: 20, pointerEvents: "none" }} />
                  <div style={{ position: "absolute", top: 0, bottom: 0, left: "50%", width: 6, background: "#c8b89a", transform: "translateX(-50%)", zIndex: 20, pointerEvents: "none" }} />

                  {/* Bubbles */}
                  {offers.map((offer) => {
                    const pos = positions[offer.id];
                    if (!pos) return null;
                    const phys = physicsRef.current.find((b) => b.id === offer.id);
                    const size = (phys?.baseSize ?? 100) * sizeScale;
                    const color = getColor(offer);
                    const isHovered = hovered === offer.id;
                    const days = daysLeft(offer.validTo);

                    return (
                      <div
                        key={offer.id}
                        style={{
                          position: "absolute",
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
                          style={{
                            width: "100%",
                            height: "100%",
                            borderRadius: "50%",
                            background: `radial-gradient(circle at 33% 26%, rgba(255,255,255,0.92) 0%, ${color.bg}cc 26%, ${color.bg} 62%, ${color.bg}77 100%)`,
                            boxShadow: isHovered
                              ? `0 0 0 3px white, 0 0 28px 8px ${color.glow}, inset 0 -6px 14px rgba(0,0,0,0.2)`
                              : `0 6px 18px ${color.glow}, inset 0 -4px 12px rgba(0,0,0,0.14)`,
                            transform: isHovered ? "scale(1.1)" : "scale(1)",
                            transition: "transform 0.2s, box-shadow 0.2s",
                          }}
                        >
                          {/* Shine */}
                          <div style={{ position: "absolute", top: "10%", left: "17%", width: "37%", height: "23%", background: "rgba(255,255,255,0.65)", filter: "blur(5px)", borderRadius: "50%", transform: "rotate(-15deg)" }} />
                          {/* Label */}
                          <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 1 }}>
                            <span style={{ fontSize: size * 0.27, lineHeight: 1 }}>{color.emoji}</span>
                            <span style={{ fontWeight: 900, color: "white", fontSize: size * 0.21, lineHeight: 1, textShadow: "0 1px 4px rgba(0,0,0,0.38)" }}>
                              -{offer.discount}%
                            </span>
                          </div>
                        </div>

                        {/* Hover card */}
                        {isHovered && (
                          <div
                            style={{
                              position: "absolute",
                              width: 210,
                              left: pos.x > windowWidth / 2 ? "auto" : "calc(100% + 12px)",
                              right: pos.x > windowWidth / 2 ? "calc(100% + 12px)" : "auto",
                              top: "50%",
                              transform: "translateY(-50%)",
                              background: "white",
                              borderRadius: 16,
                              boxShadow: "0 20px 60px rgba(0,0,0,0.18)",
                              border: "1px solid #f0f0f0",
                              padding: 14,
                              pointerEvents: "none",
                              zIndex: 100,
                            }}
                          >
                            <span style={{ fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 20, display: "inline-block", marginBottom: 8, background: color.bg + "22", color: color.bg }}>
                              {color.emoji} {offer.category ?? offer.merchant.category}
                            </span>
                            <p style={{ fontWeight: 700, fontSize: 13, color: "#111", marginBottom: 4, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{offer.title}</p>
                            <p style={{ fontSize: 11, color: "#888", marginBottom: 8, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{offer.description}</p>
                            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
                              <span style={{ fontWeight: 900, fontSize: 22, color: color.bg }}>-{offer.discount}%</span>
                              <span style={{ fontSize: 11, fontWeight: 600, color: days <= 3 ? "#ef4444" : "#9ca3af" }}>
                                {days === 0 ? t("expiresToday") : t("daysLeft", { days })}
                              </span>
                            </div>
                            <p style={{ fontSize: 11, color: "#aaa", marginBottom: 8 }}>🏪 {offer.merchant.businessName} · {offer.merchant.city}</p>
                            <Link
                              href={`/merchants/${offer.merchant.id}`}
                              style={{ display: "block", textAlign: "center", fontSize: 12, fontWeight: 700, color: "white", padding: "7px 0", borderRadius: 10, background: color.bg, pointerEvents: "auto" }}
                            >
                              {t("viewOffer")}
                            </Link>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Window sill */}
                <div style={{ height: 14, background: "#b8a888", borderRadius: "0 0 4px 4px" }} />
              </div>

              {/* Right pillar */}
              <div style={{ width: 18, background: "#d4c5a9", borderRadius: 4, alignSelf: "stretch", flexShrink: 0 }} />
            </div>

            {/* Shop floor / entrance */}
            <div style={{ padding: "12px 16px 0 16px", display: "flex", gap: 12, alignItems: "flex-end" }}>
              {/* Left sidewalk block */}
              <div style={{ width: 18 }} />
              <div style={{ flex: 1, display: "flex", gap: 10, alignItems: "flex-end" }}>
                {/* Left decorative pot */}
                <div style={{ textAlign: "center", fontSize: 22 }}>🪴</div>
                {/* Door */}
                <div style={{
                  width: 72, height: 88, background: "linear-gradient(180deg, #8b6914 0%, #a07820 100%)",
                  borderRadius: "8px 8px 0 0", border: "3px solid #6b5010",
                  position: "relative", flexShrink: 0, margin: "0 auto",
                }}>
                  <div style={{ position: "absolute", top: 10, left: 6, right: 6, bottom: 14, background: "rgba(219,234,254,0.55)", border: "1.5px solid #6b5010", borderRadius: 4 }} />
                  <div style={{ position: "absolute", right: 9, top: "50%", width: 7, height: 7, background: "#f5c518", borderRadius: "50%", transform: "translateY(-50%)" }} />
                  <div style={{ position: "absolute", bottom: 0, left: "50%", transform: "translateX(-50%)", fontSize: 10, color: "rgba(255,255,255,0.6)", fontWeight: 700 }}>OPEN</div>
                </div>
                {/* Right decorative pot */}
                <div style={{ textAlign: "center", fontSize: 22 }}>🪴</div>
              </div>
              <div style={{ width: 18 }} />
            </div>

            {/* Sidewalk */}
            <div style={{
              height: 22,
              background: "repeating-linear-gradient(90deg, #d4cdc0 0px, #d4cdc0 38px, #c8c1b4 38px, #c8c1b4 40px)",
              borderRadius: "0 0 12px 12px",
              marginTop: 8,
            }} />
          </div>
        </div>

        {/* Vertical slider */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 8, paddingTop: 60, width: 40 }}>
          <span style={{ fontSize: 11, color: "#9ca3af", textAlign: "center", lineHeight: 1.2 }}>{t("zoomIn")}</span>
          <input
            type="range"
            min={40}
            max={150}
            value={Math.round(sizeScale * 100)}
            onChange={(e) => setSizeScale(parseInt(e.target.value) / 100)}
            style={{
              writingMode: "vertical-lr" as const,
              direction: "rtl",
              height: 240,
              width: 6,
              cursor: "pointer",
              accentColor: "var(--color-primary)",
            }}
          />
          <span style={{ fontSize: 11, color: "#9ca3af", textAlign: "center", lineHeight: 1.2 }}>{t("zoomOut")}</span>
        </div>
      </div>
    </div>
  );
}
