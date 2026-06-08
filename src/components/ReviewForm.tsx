"use client";

import { useState } from "react";

interface Props {
  merchantId: string;
  onSubmitted?: () => void;
}

export default function ReviewForm({ merchantId, onSubmitted }: Props) {
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (rating === 0) { setError("Please select a rating"); return; }
    setLoading(true);
    const res = await fetch("/api/reviews", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ merchantId, rating, comment }),
    });
    setLoading(false);
    if (res.ok) { setDone(true); onSubmitted?.(); }
    else { const d = await res.json() as { error?: string }; setError(d.error ?? "Failed"); }
  }

  if (done) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-center text-green-700 text-sm">
        ✓ Thank you for your review!
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
      <h3 className="font-semibold text-gray-900 mb-3">Leave a review</h3>

      <div className="flex gap-1 mb-3">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => setRating(star)}
            onMouseEnter={() => setHover(star)}
            onMouseLeave={() => setHover(0)}
            className="text-2xl transition"
          >
            <span className={(hover || rating) >= star ? "text-orange-400" : "text-gray-200"}>★</span>
          </button>
        ))}
      </div>

      <textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        placeholder="Share your experience (optional)…"
        rows={3}
        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 mb-3"
      />

      {error && <p className="text-red-500 text-sm mb-2">{error}</p>}

      <button type="submit" disabled={loading}
        className="w-full bg-orange-500 hover:bg-orange-600 text-white font-medium py-2 rounded-lg transition disabled:opacity-60 text-sm">
        {loading ? "Submitting…" : "Submit review"}
      </button>
    </form>
  );
}
