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
  id: string; x: number; y: number; vx: number; vy: number; baseSize: number;
}

const WINDOW_H = 320;
const MAX_SPEED = 0.5;

export default function BubbleOffers({ offers }: { offers: Offer[] }) {
  const t = useTranslations("bubbleOffers");
  const arenaRef = useRef<HTMLDivElement>(null);
  const physicsRef = useRef<BubblePhysics[]>([]);
  const rafRef = useRef<number>(0);
  const [positions, setPositions] = useState<Record<string, { x: number; y: number }>>({});
  const [hovered, setHovered] = useState<string | null>(null);
  const [sizeScale, setSizeScale] = useState(1);
  const [arenaW, setArenaW] = useState(700);

  useEffect(() => {
    const W = arenaRef.current?.offsetWidth ?? 700;
    setArenaW(W);
    const cols = Math.ceil(Math.sqrt(offers.length));
    physicsRef.current = offers.map((o, i) => {
      const baseSize = 72 + (o.discount / 100) * 52;
      const r = (baseSize * sizeScale) / 2;
      return {
        id: o.id,
        x: r + 20 + (i % cols) * ((W - r * 2 - 40) / Math.max(cols - 1, 1)),
        y: r + 16 + Math.floor(i / cols) * 100,
        vx: (Math.random() - 0.5) * 0.35,
        vy: (Math.random() - 0.5) * 0.35,
        baseSize,
      };
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [offers]);

  const tick = useCallback(() => {
    const W = arenaRef.current?.offsetWidth ?? 700;
    const physics = physicsRef.current;
    for (let i = 0; i < physics.length; i++) {
      const b = physics[i];
      const r = (b.baseSize * sizeScale) / 2;
      b.vx += (Math.random() - 0.5) * 0.03;
      b.vy += (Math.random() - 0.5) * 0.03;
      const spd = Math.hypot(b.vx, b.vy);
      if (spd > MAX_SPEED) { b.vx = b.vx / spd * MAX_SPEED; b.vy = b.vy / spd * MAX_SPEED; }
      b.vx *= 0.999; b.vy *= 0.999;
      b.x += b.vx; b.y += b.vy;
      if (b.x - r < 0)      { b.x = r;      b.vx =  Math.abs(b.vx); }
      if (b.x + r > W)      { b.x = W - r;  b.vx = -Math.abs(b.vx); }
      if (b.y - r < 0)      { b.y = r;      b.vy =  Math.abs(b.vy); }
      if (b.y + r > WINDOW_H) { b.y = WINDOW_H - r; b.vy = -Math.abs(b.vy); }
      for (let j = i + 1; j < physics.length; j++) {
        const b2 = physics[j];
        const r2 = (b2.baseSize * sizeScale) / 2;
        const dx = b2.x - b.x, dy = b2.y - b.y;
        const dist = Math.hypot(dx, dy);
        const min = r + r2;
        if (dist < min && dist > 0.01) {
          const nx = dx / dist, ny = dy / dist;
          const ov = (min - dist) * 0.45;
          b.x -= nx * ov; b.y -= ny * ov; b2.x += nx * ov; b2.y += ny * ov;
          const rv = (b.vx - b2.vx) * nx + (b.vy - b2.vy) * ny;
          if (rv > 0) { b.vx -= rv * nx * 0.22; b.vy -= rv * ny * 0.22; b2.vx += rv * nx * 0.22; b2.vy += rv * ny * 0.22; }
        }
      }
    }
    setArenaW(W);
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
      <p className="text-sm text-gray-400 mb-6">{t("subtitle")}</p>

      <div className="flex gap-4 items-start">
        {/* ═══════════════════════════════════════════════════
            BOUTIQUE FAÇADE
        ════════════════════════════════════════════════════ */}
        <div className="flex-1" style={{ fontFamily: "inherit" }}>

          {/* ── Sky ── */}
          <div style={{
            height: 48,
            background: "linear-gradient(180deg,#93c5fd 0%,#bfdbfe 60%,#dbeafe 100%)",
            borderRadius: "20px 20px 0 0",
            position: "relative",
            overflow: "hidden",
          }}>
            {/* Clouds */}
            {[
              { left: "8%",  top: 10, w: 60, opacity: 0.7 },
              { left: "35%", top: 6,  w: 90, opacity: 0.6 },
              { left: "70%", top: 14, w: 55, opacity: 0.65 },
            ].map((c, i) => (
              <div key={i} style={{ position: "absolute", left: c.left, top: c.top, opacity: c.opacity }}>
                <div style={{ width: c.w, height: 18, background: "white", borderRadius: 20, boxShadow: `${c.w * 0.15}px -${c.w * 0.12}px 0 ${c.w * 0.08}px white, ${-c.w * 0.1}px -${c.w * 0.06}px 0 ${c.w * 0.04}px white` }} />
              </div>
            ))}
          </div>

          {/* ── Rooftop / Cornice ── */}
          <div style={{
            height: 24,
            background: "linear-gradient(180deg,#e8d5b0 0%,#d4b98a 100%)",
            borderLeft: "6px solid #c9a96e",
            borderRight: "6px solid #c9a96e",
            position: "relative",
          }}>
            {/* Cornice details */}
            <div style={{ position: "absolute", inset: 0, backgroundImage: "repeating-linear-gradient(90deg, rgba(180,130,60,0.3) 0, rgba(180,130,60,0.3) 1px, transparent 1px, transparent 24px)", backgroundSize: "24px 100%" }} />
          </div>

          {/* ── Main facade ── */}
          <div style={{
            background: "linear-gradient(180deg,#f5ede0 0%,#ede0cc 100%)",
            borderLeft: "6px solid #c9a96e",
            borderRight: "6px solid #c9a96e",
            padding: "0 24px",
            position: "relative",
          }}>

            {/* Store name plaque */}
            <div style={{
              margin: "0 auto 12px",
              maxWidth: 320,
              background: "linear-gradient(135deg,#1a1a2e 0%,#16213e 100%)",
              borderRadius: 8,
              padding: "8px 24px",
              textAlign: "center",
              border: "2px solid #c9a96e",
              boxShadow: "0 4px 16px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.1)",
              position: "relative",
            }}>
              <div style={{ position: "absolute", top: 3, left: 6, right: 6, height: 1, background: "linear-gradient(90deg,transparent,#c9a96e,transparent)" }} />
              <span style={{ color: "#f5d98a", fontWeight: 800, fontSize: 18, letterSpacing: "0.18em", textTransform: "uppercase" }}>
                ✦ Agora Market ✦
              </span>
              <div style={{ position: "absolute", bottom: 3, left: 6, right: 6, height: 1, background: "linear-gradient(90deg,transparent,#c9a96e,transparent)" }} />
            </div>

            {/* Awning */}
            <div style={{ margin: "0 -24px 0", position: "relative" }}>
              {/* Awning body */}
              <div style={{
                height: 44,
                background: `repeating-linear-gradient(90deg, var(--color-primary) 0, var(--color-primary) 32px, white 32px, white 64px)`,
                position: "relative",
                boxShadow: "0 4px 12px rgba(0,0,0,0.2)",
              }}>
                <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg,rgba(255,255,255,0.15) 0%,rgba(0,0,0,0.08) 100%)" }} />
              </div>
              {/* Awning scallop fringe */}
              <svg viewBox="0 0 800 18" preserveAspectRatio="none" style={{ display: "block", width: "100%", height: 18, marginTop: -1 }}>
                {Array.from({ length: 26 }).map((_, i) => (
                  <ellipse key={i} cx={15.4 + i * 30.8} cy={0} rx={15.4} ry={18}
                    fill={i % 2 === 0 ? "var(--color-primary)" : "white"} />
                ))}
              </svg>
            </div>

            {/* Window + door row */}
            <div style={{ display: "flex", gap: 14, alignItems: "flex-end", marginTop: 14 }}>

              {/* Left column: small window + lamp */}
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8, flexShrink: 0 }}>
                {/* Street lamp */}
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                  <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#fde68a", boxShadow: "0 0 12px 6px rgba(253,230,138,0.6)" }} />
                  <div style={{ width: 2, height: 30, background: "#6b7280" }} />
                  <div style={{ width: 16, height: 5, background: "#4b5563", borderRadius: 2 }} />
                </div>
                {/* Small side window */}
                <div style={{
                  width: 52, height: 70, borderRadius: "8px 8px 0 0",
                  border: "4px solid #1e3a5f", background: "linear-gradient(135deg,rgba(186,230,253,0.7) 0%,rgba(147,197,253,0.5) 100%)",
                  position: "relative", overflow: "hidden",
                }}>
                  <div style={{ position: "absolute", top: 0, bottom: 0, left: "50%", width: 2, background: "#1e3a5f", transform: "translateX(-50%)" }} />
                  <div style={{ position: "absolute", left: 0, right: 0, top: "50%", height: 2, background: "#1e3a5f", transform: "translateY(-50%)" }} />
                  <div style={{ position: "absolute", top: 5, left: 6, width: "30%", bottom: 5, background: "rgba(255,255,255,0.25)", borderRadius: 2 }} />
                  {/* Flower box */}
                  <div style={{ position: "absolute", bottom: -12, left: -4, right: -4, height: 12, background: "#92400e", borderRadius: "0 0 4px 4px", display: "flex", alignItems: "center", justifyContent: "center", gap: 2, fontSize: 8 }}>
                    🌸🌺🌸
                  </div>
                </div>
              </div>

              {/* Centre: VITRINE (main window) */}
              <div style={{ flex: 1, minWidth: 0 }}>
                {/* Window arch top */}
                <div style={{
                  height: 20, background: "#1e3a5f",
                  borderRadius: "10px 10px 0 0",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  gap: 6, fontSize: 11,
                }}>
                  {Array.from(new Set(offers.map((o) => o.category ?? o.merchant.category))).slice(0, 6).map((cat) => (
                    <span key={cat}>{CATEGORY_COLORS[cat]?.emoji ?? "📦"}</span>
                  ))}
                </div>

                {/* Glass bubble arena */}
                <div
                  ref={arenaRef}
                  style={{
                    height: WINDOW_H,
                    background: "linear-gradient(135deg,rgba(219,234,254,0.65) 0%,rgba(186,230,253,0.45) 35%,rgba(224,242,254,0.65) 70%,rgba(207,250,254,0.5) 100%)",
                    border: "4px solid #1e3a5f",
                    borderTop: "none",
                    position: "relative",
                    overflow: "hidden",
                  }}
                >
                  {/* Glass shine streaks */}
                  <div style={{ position:"absolute",top:0,left:"6%",width:"12%",bottom:0,background:"linear-gradient(90deg,transparent,rgba(255,255,255,0.22),transparent)",pointerEvents:"none",zIndex:25 }} />
                  <div style={{ position:"absolute",top:0,left:"52%",width:"7%",bottom:0,background:"linear-gradient(90deg,transparent,rgba(255,255,255,0.14),transparent)",pointerEvents:"none",zIndex:25 }} />
                  {/* Subtle grid reflection */}
                  <div style={{ position:"absolute",inset:0,backgroundImage:"linear-gradient(rgba(255,255,255,0.04) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.04) 1px,transparent 1px)",backgroundSize:"40px 40px",pointerEvents:"none",zIndex:24 }} />
                  {/* Cross frame */}
                  <div style={{ position:"absolute",top:"50%",left:0,right:0,height:6,background:"#1e3a5f",transform:"translateY(-50%)",zIndex:22,pointerEvents:"none" }} />
                  <div style={{ position:"absolute",top:0,bottom:0,left:"50%",width:6,background:"#1e3a5f",transform:"translateX(-50%)",zIndex:22,pointerEvents:"none" }} />

                  {/* Bubbles */}
                  {offers.map((offer) => {
                    const pos = positions[offer.id];
                    if (!pos) return null;
                    const phys = physicsRef.current.find((b) => b.id === offer.id);
                    const size = (phys?.baseSize ?? 90) * sizeScale;
                    const color = getColor(offer);
                    const isHov = hovered === offer.id;
                    const days = daysLeft(offer.validTo);
                    return (
                      <div
                        key={offer.id}
                        style={{ position:"absolute",left:pos.x,top:pos.y,width:size,height:size,transform:"translate(-50%,-50%)",zIndex:isHov?60:10,cursor:"pointer",willChange:"transform" }}
                        onMouseEnter={() => setHovered(offer.id)}
                        onMouseLeave={() => setHovered(null)}
                      >
                        {/* Sphere */}
                        <div style={{
                          width:"100%",height:"100%",borderRadius:"50%",
                          background:`radial-gradient(circle at 32% 26%, rgba(255,255,255,0.95) 0%, ${color.bg}cc 24%, ${color.bg} 60%, ${color.bg}66 100%)`,
                          boxShadow: isHov
                            ? `0 0 0 3px white, 0 0 32px 10px ${color.glow}, inset 0 -8px 18px rgba(0,0,0,0.2)`
                            : `0 8px 24px ${color.glow}, inset 0 -6px 14px rgba(0,0,0,0.14)`,
                          transform: isHov ? "scale(1.11)" : "scale(1)",
                          transition: "transform 0.18s, box-shadow 0.18s",
                        }}>
                          {/* Main shine */}
                          <div style={{ position:"absolute",top:"9%",left:"16%",width:"40%",height:"26%",background:"rgba(255,255,255,0.7)",filter:"blur(6px)",borderRadius:"50%",transform:"rotate(-18deg)" }} />
                          {/* Small secondary shine */}
                          <div style={{ position:"absolute",top:"18%",left:"55%",width:"14%",height:"10%",background:"rgba(255,255,255,0.45)",filter:"blur(3px)",borderRadius:"50%" }} />
                          {/* Content */}
                          <div style={{ position:"absolute",inset:0,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:1 }}>
                            <span style={{ fontSize:size*0.27,lineHeight:1 }}>{color.emoji}</span>
                            <span style={{ fontWeight:900,color:"white",fontSize:size*0.22,lineHeight:1,textShadow:"0 1px 5px rgba(0,0,0,0.4)" }}>
                              -{offer.discount}%
                            </span>
                          </div>
                        </div>

                        {/* Hover card */}
                        {isHov && (
                          <div style={{
                            position:"absolute",
                            width:220,
                            left: pos.x > arenaW / 2 ? "auto" : "calc(100% + 14px)",
                            right: pos.x > arenaW / 2 ? "calc(100% + 14px)" : "auto",
                            top:"50%",transform:"translateY(-50%)",
                            background:"white",borderRadius:18,
                            boxShadow:"0 24px 64px rgba(0,0,0,0.18), 0 4px 16px rgba(0,0,0,0.08)",
                            border:"1px solid #f0f0f0",padding:16,
                            pointerEvents:"none",zIndex:100,
                          }}>
                            <span style={{ fontSize:11,fontWeight:700,padding:"3px 10px",borderRadius:20,display:"inline-block",marginBottom:8,background:color.bg+"22",color:color.bg }}>
                              {color.emoji} {offer.category ?? offer.merchant.category}
                            </span>
                            <p style={{ fontWeight:800,fontSize:14,color:"#111",marginBottom:4,lineHeight:1.3,display:"-webkit-box",WebkitLineClamp:2,WebkitBoxOrient:"vertical" as const,overflow:"hidden" }}>{offer.title}</p>
                            <p style={{ fontSize:11,color:"#888",marginBottom:10,display:"-webkit-box",WebkitLineClamp:2,WebkitBoxOrient:"vertical" as const,overflow:"hidden" }}>{offer.description}</p>
                            <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:6 }}>
                              <span style={{ fontWeight:900,fontSize:26,color:color.bg }}>-{offer.discount}%</span>
                              <span style={{ fontSize:11,fontWeight:600,color:days<=3?"#ef4444":"#9ca3af" }}>
                                {days===0 ? t("expiresToday") : t("daysLeft",{days})}
                              </span>
                            </div>
                            <p style={{ fontSize:11,color:"#bbb",marginBottom:10 }}>🏪 {offer.merchant.businessName} · {offer.merchant.city}</p>
                            <Link href={`/merchants/${offer.merchant.id}`} style={{ display:"block",textAlign:"center",fontSize:12,fontWeight:700,color:"white",padding:"8px 0",borderRadius:12,background:color.bg,pointerEvents:"auto" }}>
                              {t("viewOffer")}
                            </Link>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Window sill */}
                <div style={{ height:12,background:"linear-gradient(180deg,#1e3a5f 0%,#162d4e 100%)",borderRadius:"0 0 4px 4px" }}>
                  {/* Flower box */}
                  <div style={{ position:"absolute",left:"10%",right:"10%",top:-2,height:20,background:"linear-gradient(180deg,#92400e 0%,#78350f 100%)",borderRadius:"0 0 6px 6px",display:"flex",alignItems:"center",justifyContent:"center",gap:3,fontSize:13 }}>
                    🌺 🌸 🌼 🌸 🌺
                  </div>
                </div>
              </div>

              {/* Right column: small window + lamp */}
              <div style={{ display:"flex",flexDirection:"column",alignItems:"center",gap:8,flexShrink:0 }}>
                <div style={{ display:"flex",flexDirection:"column",alignItems:"center" }}>
                  <div style={{ width:8,height:8,borderRadius:"50%",background:"#fde68a",boxShadow:"0 0 12px 6px rgba(253,230,138,0.6)" }} />
                  <div style={{ width:2,height:30,background:"#6b7280" }} />
                  <div style={{ width:16,height:5,background:"#4b5563",borderRadius:2 }} />
                </div>
                <div style={{ width:52,height:70,borderRadius:"8px 8px 0 0",border:"4px solid #1e3a5f",background:"linear-gradient(135deg,rgba(186,230,253,0.7) 0%,rgba(147,197,253,0.5) 100%)",position:"relative",overflow:"hidden" }}>
                  <div style={{ position:"absolute",top:0,bottom:0,left:"50%",width:2,background:"#1e3a5f",transform:"translateX(-50%)" }} />
                  <div style={{ position:"absolute",left:0,right:0,top:"50%",height:2,background:"#1e3a5f",transform:"translateY(-50%)" }} />
                  <div style={{ position:"absolute",top:5,left:6,width:"30%",bottom:5,background:"rgba(255,255,255,0.25)",borderRadius:2 }} />
                  <div style={{ position:"absolute",bottom:-12,left:-4,right:-4,height:12,background:"#92400e",borderRadius:"0 0 4px 4px",display:"flex",alignItems:"center",justifyContent:"center",gap:2,fontSize:8 }}>
                    🌼🌸🌼
                  </div>
                </div>
              </div>
            </div>

            {/* Door + entrance */}
            <div style={{ display:"flex",justifyContent:"center",alignItems:"flex-end",marginTop:14,gap:10 }}>
              {/* Left step plant */}
              <div style={{ fontSize:24, marginBottom:4 }}>🪴</div>
              {/* Door */}
              <div style={{
                width:78,height:96,flexShrink:0,
                background:"linear-gradient(180deg,#1e3a5f 0%,#162d4e 100%)",
                borderRadius:"40px 40px 0 0",
                border:"3px solid #c9a96e",
                position:"relative",overflow:"hidden",
                boxShadow:"inset 0 2px 8px rgba(0,0,0,0.3), 4px 0 12px rgba(0,0,0,0.2)",
              }}>
                {/* Door arch glass */}
                <div style={{ position:"absolute",top:6,left:6,right:6,height:48,background:"linear-gradient(135deg,rgba(219,234,254,0.6),rgba(186,230,253,0.4))",borderRadius:"30px 30px 0 0",border:"1.5px solid rgba(201,169,110,0.5)" }} />
                {/* Door panel */}
                <div style={{ position:"absolute",top:60,left:8,right:8,bottom:6,border:"1.5px solid rgba(201,169,110,0.4)",borderRadius:3 }} />
                {/* Handle */}
                <div style={{ position:"absolute",right:12,top:"62%",width:6,height:16,background:"linear-gradient(180deg,#f5d98a,#c9a96e)",borderRadius:3,boxShadow:"0 2px 4px rgba(0,0,0,0.3)" }} />
                {/* OPEN sign */}
                <div style={{ position:"absolute",top:56,left:"50%",transform:"translateX(-50%)",background:"rgba(245,217,138,0.9)",borderRadius:4,padding:"1px 5px",fontSize:9,fontWeight:800,color:"#92400e",whiteSpace:"nowrap" }}>OPEN</div>
              </div>
              {/* Right step plant */}
              <div style={{ fontSize:24, marginBottom:4 }}>🪴</div>
            </div>

            {/* Steps */}
            <div style={{ margin:"0 -24px",marginTop:4 }}>
              <div style={{ height:10,background:"#d1c4a8",borderLeft:"6px solid #c9a96e",borderRight:"6px solid #c9a96e" }} />
              <div style={{ height:10,background:"#c4b49a",margin:"0 -8px",borderLeft:"6px solid #b89860",borderRight:"6px solid #b89860" }} />
            </div>
          </div>

          {/* Sidewalk */}
          <div style={{
            height:28,borderRadius:"0 0 16px 16px",
            background:"repeating-linear-gradient(90deg,#c8bfb0 0,#c8bfb0 48px,#b8af9e 48px,#b8af9e 50px)",
            borderLeft:"6px solid #b8a888",borderRight:"6px solid #b8a888",borderBottom:"4px solid #a89878",
            boxShadow:"0 4px 12px rgba(0,0,0,0.12)",
          }} />
        </div>

        {/* Vertical size slider */}
        <div style={{ display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:8,paddingTop:80,width:38 }}>
          <span style={{ fontSize:10,color:"#9ca3af",textAlign:"center",lineHeight:1.3 }}>{t("zoomIn")}</span>
          <input
            type="range" min={40} max={150}
            value={Math.round(sizeScale * 100)}
            onChange={(e) => setSizeScale(parseInt(e.target.value) / 100)}
            style={{ writingMode:"vertical-lr" as const,direction:"rtl",height:220,width:6,cursor:"pointer",accentColor:"var(--color-primary)" }}
          />
          <span style={{ fontSize:10,color:"#9ca3af",textAlign:"center",lineHeight:1.3 }}>{t("zoomOut")}</span>
        </div>
      </div>
    </div>
  );
}
