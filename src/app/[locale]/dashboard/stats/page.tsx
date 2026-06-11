"use client";

import { useEffect, useState } from "react";
import { Link } from "@/i18n/navigation";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

interface Stats {
  kpis: {
    totalClaims: number;
    usedClaims: number;
    totalSavedOffers: number;
    totalSavedProducts: number;
    totalProductClaims: number;
    avgRating: number | null;
    followers: number;
  };
  claimsByMonth: { label: string; claims: number; productClaims: number }[];
  topOffers: { id: string; title: string; discount: number; category: string | null; active: boolean; claims: number; saves: number }[];
  topProducts: { id: string; name: string; category: string | null; claims: number; saves: number }[];
}

export default function StatsPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/merchant/stats")
      .then((r) => r.json())
      .then((d: Stats) => { setStats(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-16 flex items-center justify-center">
        <p className="text-gray-400">Chargement des statistiques…</p>
      </div>
    );
  }

  if (!stats) return null;
  const { kpis, claimsByMonth, topOffers, topProducts } = stats;

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      <div className="flex items-center gap-3 mb-8">
        <Link href="/dashboard" className="text-gray-400 hover:text-gray-600">←</Link>
        <h1 className="text-2xl font-bold text-gray-900">Statistiques</h1>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-10">
        <KpiCard label="Réclamations offres" value={kpis.totalClaims} sub={`${kpis.usedClaims} utilisées`} color="orange" />
        <KpiCard label="Réservations produits" value={kpis.totalProductClaims} color="orange" />
        <KpiCard label="Offres sauvegardées" value={kpis.totalSavedOffers} color="blue" />
        <KpiCard label="Produits sauvegardés" value={kpis.totalSavedProducts} color="blue" />
        <KpiCard label="Abonnés" value={kpis.followers} color="green" />
        <KpiCard
          label="Note moyenne"
          value={kpis.avgRating !== null ? kpis.avgRating.toFixed(1) : "—"}
          sub="/ 5"
          color="yellow"
        />
      </div>

      {/* Monthly chart */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-8">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Activité mensuelle (12 mois)</h2>
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={claimsByMonth} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
            <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#9ca3af" }} />
            <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: "#9ca3af" }} />
            <Tooltip contentStyle={{ borderRadius: "8px", border: "1px solid #f3f4f6", fontSize: 12 }} />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Bar dataKey="claims" name="Réclamations offres" fill="#f97316" radius={[4, 4, 0, 0]} />
            <Bar dataKey="productClaims" name="Réservations produits" fill="#fb923c" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Top offers */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Top offres</h2>
          {topOffers.length === 0 ? (
            <p className="text-gray-400 text-sm">Aucune offre pour l'instant.</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs text-gray-400 border-b border-gray-100">
                  <th className="text-left pb-2 font-medium">Offre</th>
                  <th className="text-right pb-2 font-medium">Récl.</th>
                  <th className="text-right pb-2 font-medium">Sauv.</th>
                </tr>
              </thead>
              <tbody>
                {topOffers.map((o) => (
                  <tr key={o.id} className="border-b border-gray-50 last:border-0">
                    <td className="py-2 pr-2">
                      <span className="font-medium text-gray-800 truncate block max-w-[160px]">{o.title}</span>
                      <span className="text-xs text-gray-400">-{o.discount}% {o.active ? <span className="text-green-500">● actif</span> : <span className="text-gray-300">● expiré</span>}</span>
                    </td>
                    <td className="py-2 text-right font-bold text-orange-500">{o.claims}</td>
                    <td className="py-2 text-right text-gray-400">{o.saves}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Top products */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Top produits</h2>
          {topProducts.length === 0 ? (
            <p className="text-gray-400 text-sm">Aucun produit pour l'instant.</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs text-gray-400 border-b border-gray-100">
                  <th className="text-left pb-2 font-medium">Produit</th>
                  <th className="text-right pb-2 font-medium">Résv.</th>
                  <th className="text-right pb-2 font-medium">Sauv.</th>
                </tr>
              </thead>
              <tbody>
                {topProducts.map((p) => (
                  <tr key={p.id} className="border-b border-gray-50 last:border-0">
                    <td className="py-2 pr-2">
                      <span className="font-medium text-gray-800 truncate block max-w-[160px]">{p.name}</span>
                      {p.category && <span className="text-xs text-gray-400">{p.category}</span>}
                    </td>
                    <td className="py-2 text-right font-bold text-orange-500">{p.claims}</td>
                    <td className="py-2 text-right text-gray-400">{p.saves}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}

function KpiCard({ label, value, sub, color }: { label: string; value: string | number; sub?: string; color: "orange" | "blue" | "green" | "yellow" }) {
  const colors = {
    orange: "text-orange-500",
    blue: "text-blue-500",
    green: "text-green-500",
    yellow: "text-yellow-500",
  };
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 text-center">
      <p className={`text-3xl font-bold ${colors[color]}`}>{value}</p>
      {sub && <p className="text-xs text-gray-400">{sub}</p>}
      <p className="text-gray-500 text-sm mt-1">{label}</p>
    </div>
  );
}
