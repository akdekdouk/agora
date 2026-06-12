"use client";

import { useEffect, useState } from "react";
import { Link } from "@/i18n/navigation";

const ALL_CATEGORIES = [
  { value: "restaurant", label: "🍽️ Restaurant & Café" },
  { value: "shop", label: "🛍️ Boutique & Commerce" },
  { value: "artisan", label: "🔨 Artisan & Créateur" },
  { value: "beauty", label: "💅 Beauté & Bien-être" },
  { value: "hotel", label: "🏨 Hôtellerie & Tourisme" },
  { value: "education", label: "📚 Éducation & Formation" },
  { value: "health", label: "🏥 Santé & Médical" },
  { value: "sport", label: "🏋️ Sport & Loisirs" },
  { value: "services", label: "🔧 Services & Auto" },
  { value: "other", label: "📦 Autre" },
];

const THEMES = [
  { value: "orange", label: "Orange", primary: "#f97316", light: "#fff7ed" },
  { value: "blue", label: "Bleu", primary: "#3b82f6", light: "#eff6ff" },
  { value: "green", label: "Vert", primary: "#22c55e", light: "#f0fdf4" },
  { value: "purple", label: "Violet", primary: "#a855f7", light: "#faf5ff" },
  { value: "rose", label: "Rose", primary: "#f43f5e", light: "#fff1f2" },
  { value: "teal", label: "Teal", primary: "#14b8a6", light: "#f0fdfa" },
  { value: "amber", label: "Ambre", primary: "#f59e0b", light: "#fffbeb" },
  { value: "indigo", label: "Indigo", primary: "#6366f1", light: "#eef2ff" },
  { value: "slate", label: "Ardoise", primary: "#475569", light: "#f8fafc" },
  { value: "terracotta", label: "Terracotta", primary: "#c2410c", light: "#fff7ed" },
];

const FONTS = [
  { value: "modern", label: "Modern", className: "font-sans", preview: "Aa Bb Cc" },
  { value: "classic", label: "Classique", className: "font-serif", preview: "Aa Bb Cc" },
  { value: "bold", label: "Bold", className: "font-mono", preview: "Aa Bb Cc" },
];

const BACKGROUNDS = [
  {
    value: "none",
    label: "Neutre",
    emoji: "◻️",
    description: "Fond gris uni",
    style: { backgroundColor: "#f9fafb" },
  },
  {
    value: "vannerie",
    label: "Vannerie",
    emoji: "🧺",
    description: "Motif tressé osier",
    style: {
      backgroundColor: "#f5f0e8",
      backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24'%3E%3Crect width='24' height='24' fill='%23f5f0e8'/%3E%3Cpath d='M0 6 C4 2 8 2 12 6 C16 10 20 10 24 6' stroke='%23c9a97c' stroke-width='1.8' fill='none' opacity='0.6'/%3E%3Cpath d='M0 18 C4 14 8 14 12 18 C16 22 20 22 24 18' stroke='%23c9a97c' stroke-width='1.8' fill='none' opacity='0.6'/%3E%3Cpath d='M6 0 C2 4 2 8 6 12 C10 16 10 20 6 24' stroke='%23b8924a' stroke-width='1.2' fill='none' opacity='0.45'/%3E%3Cpath d='M18 0 C14 4 14 8 18 12 C22 16 22 20 18 24' stroke='%23b8924a' stroke-width='1.2' fill='none' opacity='0.45'/%3E%3C/svg%3E\")",
    },
  },
  {
    value: "marche",
    label: "Marché",
    emoji: "🏪",
    description: "Rayures auvent",
    style: {
      backgroundColor: "#fafaf8",
      backgroundImage: "repeating-linear-gradient(-45deg, transparent, transparent 6px, rgba(0,0,0,0.04) 6px, rgba(0,0,0,0.04) 12px)",
    },
  },
  {
    value: "losanges",
    label: "Losanges",
    emoji: "♦️",
    description: "Treillis géométrique",
    style: {
      backgroundColor: "#f8f7f5",
      backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='32' height='32'%3E%3Cpath d='M16 2 L30 16 L16 30 L2 16 Z' stroke='%23c0b89a' stroke-width='1' fill='none' opacity='0.5'/%3E%3C/svg%3E\")",
    },
  },
  {
    value: "lin",
    label: "Lin",
    emoji: "🪢",
    description: "Texture toile de jute",
    style: {
      backgroundColor: "#f7f4ef",
      backgroundImage: "repeating-linear-gradient(0deg, rgba(160,140,110,0.12) 0px, rgba(160,140,110,0.12) 1px, transparent 1px, transparent 18px), repeating-linear-gradient(90deg, rgba(160,140,110,0.12) 0px, rgba(160,140,110,0.12) 1px, transparent 1px, transparent 18px)",
    },
  },
  {
    value: "carrelage",
    label: "Carrelage",
    emoji: "🟫",
    description: "Carreaux méditerranéens",
    style: {
      backgroundColor: "#f6f6f4",
      backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='40' height='40'%3E%3Crect width='40' height='40' fill='%23f6f6f4'/%3E%3Crect x='1' y='1' width='17' height='17' rx='1' fill='none' stroke='%23c8c2b4' stroke-width='0.7' opacity='0.6'/%3E%3Crect x='22' y='1' width='17' height='17' rx='1' fill='none' stroke='%23c8c2b4' stroke-width='0.7' opacity='0.6'/%3E%3Crect x='1' y='22' width='17' height='17' rx='1' fill='none' stroke='%23c8c2b4' stroke-width='0.7' opacity='0.6'/%3E%3Crect x='22' y='22' width='17' height='17' rx='1' fill='none' stroke='%23c8c2b4' stroke-width='0.7' opacity='0.6'/%3E%3C/svg%3E\")",
    },
  },
];

interface Config {
  activeCategories: string;
  theme: string;
  fontStyle: string;
  backgroundPattern?: string;
}

export default function ConfigPage() {
  const [config, setConfig] = useState<Config | null>(null);
  const [activeCategories, setActiveCategories] = useState<string[]>([]);
  const [theme, setTheme] = useState("orange");
  const [fontStyle, setFontStyle] = useState("modern");
  const [backgroundPattern, setBackgroundPattern] = useState("none");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch("/api/config")
      .then((r) => r.json())
      .then((data: Config) => {
        if (!data || data.activeCategories === undefined) return;
        setConfig(data);
        try { setActiveCategories(JSON.parse(data.activeCategories) as string[]); } catch { setActiveCategories([]); }
        setTheme(data.theme ?? "orange");
        setFontStyle(data.fontStyle ?? "modern");
        setBackgroundPattern(data.backgroundPattern ?? "none");
      })
      .catch(() => {
        // Fallback: show config form with defaults even if fetch failed
        setConfig({ activeCategories: '["restaurant","shop","artisan","beauty","hotel"]', theme: "orange", fontStyle: "modern", backgroundPattern: "none" });
        setActiveCategories(["restaurant", "shop", "artisan", "beauty", "hotel"]);
      });
  }, []);

  function toggleCategory(value: string) {
    setActiveCategories((prev) => {
      if (prev.includes(value)) return prev.filter((c) => c !== value);
      if (prev.length >= 5) return prev;
      return [...prev, value];
    });
  }

  async function save() {
    setSaving(true);
    setSaved(false);
    await fetch("/api/config", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ activeCategories, theme, fontStyle, backgroundPattern }),
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }

  if (!config) return (
    <div className="max-w-3xl mx-auto px-4 py-10 text-gray-400 text-center">Chargement…</div>
  );

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <div className="flex items-center gap-3 mb-8">
        <Link href="/dashboard" className="text-gray-400 hover:text-gray-600">←</Link>
        <h1 className="text-2xl font-bold text-gray-900">Configuration générale</h1>
      </div>

      {/* Active categories */}
      <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-6">
        <h2 className="text-base font-semibold text-gray-800 mb-1">Catégories actives</h2>
        <p className="text-sm text-gray-400 mb-4">Sélectionnez jusqu'à 5 catégories affichées sur la page d'accueil.</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {ALL_CATEGORIES.map((cat) => {
            const active = activeCategories.includes(cat.value);
            const disabled = !active && activeCategories.length >= 5;
            return (
              <button
                key={cat.value}
                onClick={() => toggleCategory(cat.value)}
                disabled={disabled}
                className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-sm font-medium transition ${
                  active
                    ? "bg-orange-50 border-orange-400 text-orange-700"
                    : disabled
                    ? "border-gray-100 text-gray-300 cursor-not-allowed"
                    : "border-gray-200 text-gray-600 hover:border-gray-300"
                }`}
              >
                <span className={`w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 ${active ? "bg-orange-500 border-orange-500" : "border-gray-300"}`}>
                  {active && <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>}
                </span>
                {cat.label}
              </button>
            );
          })}
        </div>
        <p className="text-xs text-gray-400 mt-3">{activeCategories.length}/5 sélectionnées</p>
      </section>

      {/* Theme */}
      <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-6">
        <h2 className="text-base font-semibold text-gray-800 mb-1">Thème de couleur</h2>
        <p className="text-sm text-gray-400 mb-4">Couleur principale de l'application.</p>
        <div className="flex gap-3 flex-wrap">
          {THEMES.map((t) => (
            <button
              key={t.value}
              onClick={() => setTheme(t.value)}
              className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border transition ${
                theme === t.value ? "border-gray-400 shadow-sm" : "border-gray-200 hover:border-gray-300"
              }`}
            >
              <span className="w-8 h-8 rounded-full shadow-sm" style={{ backgroundColor: t.primary }} />
              <span className="text-xs text-gray-600 font-medium">{t.label}</span>
              {theme === t.value && <span className="text-[10px] text-orange-500 font-semibold">Actif</span>}
            </button>
          ))}
        </div>
      </section>

      {/* Background pattern */}
      <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-6">
        <h2 className="text-base font-semibold text-gray-800 mb-1">Fond d&apos;écran</h2>
        <p className="text-sm text-gray-400 mb-4">Motif de fond inspiré du commerce local et de l&apos;artisanat.</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {BACKGROUNDS.map((bg) => (
            <button
              key={bg.value}
              onClick={() => setBackgroundPattern(bg.value)}
              className={`relative flex flex-col rounded-xl border-2 overflow-hidden transition ${
                backgroundPattern === bg.value ? "border-gray-500 shadow-md" : "border-gray-200 hover:border-gray-300"
              }`}
            >
              {/* Pattern preview */}
              <div className="h-14 w-full" style={bg.style as React.CSSProperties} />
              {/* Label */}
              <div className="px-2.5 py-2 text-left">
                <p className="text-xs font-semibold text-gray-700">{bg.emoji} {bg.label}</p>
                <p className="text-[10px] text-gray-400">{bg.description}</p>
              </div>
              {backgroundPattern === bg.value && (
                <span className="absolute top-1.5 right-1.5 bg-gray-800 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full">Actif</span>
              )}
            </button>
          ))}
        </div>
      </section>

      {/* Font style */}
      <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-8">
        <h2 className="text-base font-semibold text-gray-800 mb-1">Style de police</h2>
        <p className="text-sm text-gray-400 mb-4">Apparence typographique générale.</p>
        <div className="flex gap-3 flex-wrap">
          {FONTS.map((f) => (
            <button
              key={f.value}
              onClick={() => setFontStyle(f.value)}
              className={`flex flex-col items-center gap-1 px-6 py-3 rounded-xl border transition ${
                fontStyle === f.value ? "border-gray-400 bg-gray-50 shadow-sm" : "border-gray-200 hover:border-gray-300"
              }`}
            >
              <span className={`text-xl text-gray-800 ${f.className}`}>{f.preview}</span>
              <span className="text-xs text-gray-500 font-medium">{f.label}</span>
              {fontStyle === f.value && <span className="text-[10px] text-orange-500 font-semibold">Actif</span>}
            </button>
          ))}
        </div>
      </section>

      <p className="text-xs text-gray-400 text-center mb-4">
        Le thème et la police s'appliquent instantanément sur toute l'application après enregistrement.
      </p>
      <button
        onClick={save}
        disabled={saving}
        className="w-full text-white font-semibold py-3 rounded-xl transition disabled:opacity-60"
        style={{ backgroundColor: "var(--color-primary)" }}
      >
        {saving ? "Enregistrement…" : saved ? "✓ Enregistré !" : "Enregistrer la configuration"}
      </button>
    </div>
  );
}
