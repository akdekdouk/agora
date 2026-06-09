"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";

export default function NewOfferPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [generatingDesc, setGeneratingDesc] = useState(false);
  const [title, setTitle] = useState("");
  const [discount, setDiscount] = useState("");
  const [description, setDescription] = useState("");
  const t = useTranslations("dashboard");

  async function generateDescription() {
    if (!title || !discount) return;
    setGeneratingDesc(true);
    const res = await fetch("/api/ai/generate-description", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, discount: Number(discount) }),
    });
    if (res.ok) {
      const data = await res.json() as { description: string };
      setDescription(data.description);
    }
    setGeneratingDesc(false);
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const form = new FormData(e.currentTarget);
    const maxClaimsRaw = form.get("maxClaims");
    const body = {
      title,
      description,
      discount: Number(discount),
      maxClaims: maxClaimsRaw ? Number(maxClaimsRaw) : null,
      validFrom: form.get("validFrom"),
      validTo: form.get("validTo"),
    };
    const res = await fetch("/api/offers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const data = await res.json() as { error?: string };
      setError(data.error ?? "Failed to create offer.");
      setLoading(false);
      return;
    }
    router.push("/dashboard/offers");
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/dashboard/offers" className="text-gray-400 hover:text-gray-600">←</Link>
        <h1 className="text-2xl font-bold text-gray-900">{t("newOffer")}</h1>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
            <input
              name="title" required
              value={title} onChange={(e) => setTitle(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-400"
              placeholder="e.g. Summer Sale — 30% off everything"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Discount % *</label>
            <input
              name="discount" type="number" required min={1} max={100}
              value={discount} onChange={(e) => setDiscount(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-400"
              placeholder="e.g. 20"
            />
          </div>
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-sm font-medium text-gray-700">Description *</label>
              <button
                type="button"
                onClick={generateDescription}
                disabled={!title || !discount || generatingDesc}
                className="text-xs text-orange-500 hover:text-orange-600 font-medium disabled:opacity-40 flex items-center gap-1"
              >
                {generatingDesc ? "Generating…" : "✨ Generate with AI"}
              </button>
            </div>
            <textarea
              name="description" required rows={3}
              value={description} onChange={(e) => setDescription(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-400"
              placeholder="Describe your offer…"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Stock (places disponibles)</label>
            <input name="maxClaims" type="number" min={1}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-400"
              placeholder="Laisser vide = illimité" />
            <p className="text-xs text-gray-400 mt-1">L&apos;offre se ferme automatiquement quand le stock est épuisé</p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Valid from *</label>
              <input name="validFrom" type="date" required className="w-full border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-400" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Valid until *</label>
              <input name="validTo" type="date" required className="w-full border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-400" />
            </div>
          </div>
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <button type="submit" disabled={loading}
            className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold py-2.5 rounded-lg transition disabled:opacity-60">
            {loading ? "Creating…" : "Create offer"}
          </button>
        </form>
      </div>
    </div>
  );
}
