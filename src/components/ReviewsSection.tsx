"use client";

import { useEffect, useState } from "react";
import ReviewForm from "./ReviewForm";

interface Review {
  id: string;
  rating: number;
  comment?: string | null;
  createdAt: string;
  consumer: { name?: string | null; email: string };
}

interface Props {
  merchantId: string;
  isConsumerLoggedIn?: boolean;
}

function Stars({ rating }: { rating: number }) {
  return (
    <span>
      {[1, 2, 3, 4, 5].map((s) => (
        <span key={s} className={s <= rating ? "text-orange-400" : "text-gray-200"}>★</span>
      ))}
    </span>
  );
}

export default function ReviewsSection({ merchantId, isConsumerLoggedIn }: Props) {
  const [data, setData] = useState<{ reviews: Review[]; average: number | null; count: number } | null>(null);

  function load() {
    fetch(`/api/reviews?merchantId=${merchantId}`)
      .then((r) => r.json())
      .then(setData);
  }

  useEffect(() => { load(); }, [merchantId]);

  if (!data) return null;

  return (
    <section className="mt-10">
      <div className="flex items-center gap-3 mb-4">
        <h2 className="text-xl font-bold text-gray-900">Reviews</h2>
        {data.average && (
          <span className="flex items-center gap-1 text-sm text-gray-500">
            <Stars rating={Math.round(data.average)} />
            <span className="font-medium text-gray-700">{data.average.toFixed(1)}</span>
            <span>({data.count})</span>
          </span>
        )}
      </div>

      {isConsumerLoggedIn && (
        <div className="mb-6">
          <ReviewForm merchantId={merchantId} onSubmitted={load} />
        </div>
      )}

      {data.reviews.length === 0 ? (
        <p className="text-gray-400 text-sm">No reviews yet. Be the first!</p>
      ) : (
        <div className="space-y-3">
          {data.reviews.map((r) => (
            <div key={r.id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
              <div className="flex items-center justify-between mb-1">
                <span className="font-medium text-gray-700 text-sm">
                  {r.consumer.name ?? r.consumer.email.split("@")[0]}
                </span>
                <Stars rating={r.rating} />
              </div>
              {r.comment && <p className="text-sm text-gray-600">{r.comment}</p>}
              <p className="text-xs text-gray-400 mt-1">{new Date(r.createdAt).toLocaleDateString()}</p>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
