"use client";

import { useState, useRef } from "react";
import { Link } from "@/i18n/navigation";

interface ClaimInfo {
  code: string;
  status: string;
  claimedAt: string;
  usedAt?: string;
  offer: { title: string; discount: number; validTo: string };
  consumer: { name?: string | null; email: string };
}

export default function ScanPage() {
  const [code, setCode] = useState("");
  const [claim, setClaim] = useState<ClaimInfo | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [validated, setValidated] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  async function lookup() {
    if (!code.trim()) return;
    setLoading(true);
    setError("");
    setClaim(null);
    setValidated(false);

    const res = await fetch(`/api/scan?code=${encodeURIComponent(code.trim())}`);
    const data = await res.json() as ClaimInfo & { error?: string };
    setLoading(false);

    if (!res.ok) { setError(data.error ?? "Invalid code"); return; }
    setClaim(data);
  }

  async function validate() {
    if (!claim) return;
    setLoading(true);
    const res = await fetch("/api/scan", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code: claim.code }),
    });
    const data = await res.json() as { error?: string };
    setLoading(false);
    if (!res.ok) { setError(data.error ?? "Failed to validate"); return; }
    setValidated(true);
    setClaim((c) => c ? { ...c, status: "used" } : c);
  }

  const expired = claim ? new Date(claim.offer.validTo) < new Date() : false;
  const alreadyUsed = claim?.status === "used";

  return (
    <div className="max-w-md mx-auto px-4 py-10">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/dashboard" className="text-gray-400 hover:text-gray-600">←</Link>
        <h1 className="text-2xl font-bold text-gray-900">Scan & Validate Offer</h1>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Enter or scan the customer&apos;s code
        </label>
        <div className="flex gap-2">
          <input
            ref={inputRef}
            value={code}
            onChange={(e) => setCode(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && lookup()}
            placeholder="Paste code or scan QR…"
            className="flex-1 border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-400 font-mono text-sm"
          />
          <button onClick={lookup} disabled={loading}
            className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg font-medium transition disabled:opacity-60">
            Check
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-4 mb-4">
          ✗ {error}
        </div>
      )}

      {claim && (
        <div className={`rounded-2xl border p-6 ${
          validated || alreadyUsed ? "bg-gray-50 border-gray-200" :
          expired ? "bg-red-50 border-red-200" :
          "bg-green-50 border-green-200"
        }`}>
          <div className="mb-4">
            <p className="text-lg font-bold text-gray-900">{claim.offer.title}</p>
            <p className="text-orange-500 font-semibold text-xl">-{claim.offer.discount}%</p>
            <p className="text-sm text-gray-500 mt-1">
              Customer: {claim.consumer.name ?? claim.consumer.email}
            </p>
            <p className="text-xs text-gray-400 mt-1">
              Valid until {new Date(claim.offer.validTo).toLocaleDateString()}
            </p>
          </div>

          {validated ? (
            <div className="text-center py-4">
              <p className="text-4xl mb-2">✅</p>
              <p className="text-green-700 font-semibold">Validated! Discount applied.</p>
            </div>
          ) : alreadyUsed ? (
            <div className="bg-gray-100 rounded-xl p-4 text-center text-gray-500">
              ✗ Already used on {new Date(claim.usedAt!).toLocaleDateString()}
            </div>
          ) : expired ? (
            <div className="bg-red-100 rounded-xl p-4 text-center text-red-600">
              ✗ This offer has expired
            </div>
          ) : (
            <button onClick={validate} disabled={loading}
              className="w-full bg-green-500 hover:bg-green-600 text-white font-semibold py-3 rounded-xl transition disabled:opacity-60">
              {loading ? "Validating…" : "✓ Validate & Apply Discount"}
            </button>
          )}
        </div>
      )}

      <p className="text-xs text-gray-400 text-center mt-6">
        Only offers from your business can be validated here.
      </p>
    </div>
  );
}
