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
}

export default function MerchantProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

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
      }))
      .catch(() => router.push("/login"));
  }, [router]);

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
