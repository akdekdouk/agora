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
];

const FONTS = [
  { value: "modern", label: "Modern", className: "font-sans", preview: "Aa Bb Cc" },
  { value: "classic", label: "Classique", className: "font-serif", preview: "Aa Bb Cc" },
  { value: "bold", label: "Bold", className: "font-mono", preview: "Aa Bb Cc" },
];

interface Config {
  activeCategories: string;
  theme: string;
  fontStyle: string;
}

export default function ConfigPage() {
  const [config, setConfig] = useState<Config | null>(null);
  const [activeCategories, setActiveCategories] = useState<string[]>([]);
  const [theme, setTheme] = useState("orange");
  const [fontStyle, setFontStyle] = useState("modern");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch("/api/config")
      .then((r) => r.json())
      .then((data: Config) => {
        setConfig(data);
        setActiveCategories(JSON.parse(data.activeCategories) as string[]);
        setTheme(data.theme);
        setFontStyle(data.fontStyle);
      })
      .catch(() => {});
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
      body: JSON.stringify({ activeCategories, theme, fontStyle }),
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

      <button
        onClick={save}
        disabled={saving}
        className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold py-3 rounded-xl transition disabled:opacity-60"
      >
        {saving ? "Enregistrement…" : saved ? "✓ Enregistré !" : "Enregistrer la configuration"}
      </button>
    </div>
  );
}
