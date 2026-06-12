"use client";

import { useEffect, useState } from "react";
import { Link } from "@/i18n/navigation";
import { useRouter } from "@/i18n/navigation";

const CATEGORIES = [
  { value: "shop", label: "Commerce / Boutique" },
  { value: "artisan", label: "Artisan" },
  { value: "restaurant", label: "Restaurant / Café" },
  { value: "beauty", label: "Beauté / Bien-être" },
  { value: "hotel", label: "Hôtel / Hébergement" },
  { value: "education", label: "Éducation / Formation" },
  { value: "health", label: "Santé / Médical" },
  { value: "sport", label: "Sport / Fitness" },
  { value: "services", label: "Services" },
  { value: "garage_sale", label: "Vide-Grenier & Brocante" },
  { value: "other", label: "Autre" },
];

interface Profile {
  businessName: string;
  description: string;
  category: string;
  city: string;
  address: string;
  phone: string;
  email: string;
  logo: string | null;
}

export default function MerchantProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const [logoUploading, setLogoUploading] = useState(false);

  useEffect(() => {
    fetch("/api/merchant/me")
      .then((r) => r.json())
      .then((data) => setProfile({
        businessName: data.businessName ?? "",
        description: data.description ?? "",
        category: data.category ?? "shop",
        city: data.city ?? "",
        address: data.address ?? "",
        phone: data.phone ?? "",
        email: data.email ?? "",
        logo: data.logo ?? null,
      }))
      .catch(() => router.push("/login"));
  }, [router]);

  async function uploadLogo(file: File) {
    setLogoUploading(true);
    const form = new FormData();
    form.append("file", file);
    try {
      const res = await fetch("/api/upload", { method: "POST", body: form });
      const data = await res.json() as { path?: string; error?: string };
      if (data.path && profile) setProfile({ ...profile, logo: data.path });
    } finally {
      setLogoUploading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!profile) return;
    setSaving(true);
    setError("");
    const res = await fetch("/api/merchant/profile", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(profile),
    });
    setSaving(false);
    if (res.ok) {
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } else {
      const d = await res.json();
      setError(d.error ?? "Erreur lors de la sauvegarde");
    }
  }

  if (!profile) {
    return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-4 border-gray-200 rounded-full animate-spin" style={{ borderTopColor: "var(--color-primary)" }} /></div>;
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/dashboard" className="text-gray-400 hover:text-gray-600">←</Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">👤 Informations personnelles</h1>
          <p className="text-sm text-gray-500">{profile.email}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-5">

        {/* Logo upload */}
        <div className="flex items-center gap-5 pb-4 border-b border-gray-100">
          <div className="relative shrink-0">
            <div className="w-20 h-20 rounded-2xl overflow-hidden border-2 border-gray-200 bg-gray-100 flex items-center justify-center">
              {profile.logo
                ? <img src={profile.logo} alt="logo" className="w-full h-full object-cover" />
                : <span className="text-3xl font-bold text-gray-400">{profile.businessName.charAt(0).toUpperCase()}</span>
              }
            </div>
            <label className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full border-2 border-white flex items-center justify-center cursor-pointer hover:opacity-80 transition" style={{ backgroundColor: "var(--color-primary)" }}>
              {logoUploading
                ? <svg className="w-3 h-3 text-white animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/></svg>
                : <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"/><path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
              }
              <input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && uploadLogo(e.target.files[0])} />
            </label>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-700">Logo du commerce</p>
            <p className="text-xs text-gray-400 mt-0.5">JPG, PNG ou WebP · max 5 Mo</p>
            {profile.logo && (
              <button type="button" onClick={() => setProfile({ ...profile, logo: null })} className="text-xs text-red-400 hover:text-red-600 mt-1">Supprimer</button>
            )}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Nom du commerce *</label>
          <input
            type="text"
            value={profile.businessName}
            onChange={(e) => setProfile({ ...profile, businessName: e.target.value })}
            required
            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2"
            style={{ "--tw-ring-color": "var(--color-primary)" } as React.CSSProperties}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
          <textarea
            value={profile.description}
            onChange={(e) => setProfile({ ...profile, description: e.target.value })}
            rows={3}
            placeholder="Décrivez votre commerce en quelques mots…"
            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 resize-none"
            style={{ "--tw-ring-color": "var(--color-primary)" } as React.CSSProperties}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Activité *</label>
          <select
            value={profile.category}
            onChange={(e) => setProfile({ ...profile, category: e.target.value })}
            required
            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2"
            style={{ "--tw-ring-color": "var(--color-primary)" } as React.CSSProperties}
          >
            {CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>{c.label}</option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Ville *</label>
            <input
              type="text"
              value={profile.city}
              onChange={(e) => setProfile({ ...profile, city: e.target.value })}
              required
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2"
              style={{ "--tw-ring-color": "var(--color-primary)" } as React.CSSProperties}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Téléphone</label>
            <input
              type="tel"
              value={profile.phone}
              onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
              placeholder="+33 6 00 00 00 00"
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2"
              style={{ "--tw-ring-color": "var(--color-primary)" } as React.CSSProperties}
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Adresse</label>
          <input
            type="text"
            value={profile.address}
            onChange={(e) => setProfile({ ...profile, address: e.target.value })}
            placeholder="10 rue de la Paix"
            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2"
            style={{ "--tw-ring-color": "var(--color-primary)" } as React.CSSProperties}
          />
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <div className="flex items-center gap-3 pt-2">
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2 rounded-xl text-white text-sm font-medium transition hover:opacity-90 disabled:opacity-60"
            style={{ backgroundColor: "var(--color-primary)" }}
          >
            {saving ? "Enregistrement…" : "Enregistrer"}
          </button>
          {saved && <span className="text-sm text-green-600 font-medium">✓ Sauvegardé</span>}
        </div>
      </form>
    </div>
  );
}
