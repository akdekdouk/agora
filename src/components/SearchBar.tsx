"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface SearchBarProps {
  initialQuery?: string;
}

export default function SearchBar({ initialQuery = "" }: SearchBarProps) {
  const [query, setQuery] = useState(initialQuery);
  const router = useRouter();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/search?q=${encodeURIComponent(query.trim())}`);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex gap-2 max-w-2xl mx-auto">
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="e.g. restaurants in Rome with discounts this week..."
        className="flex-1 px-4 py-3 rounded-xl text-gray-900 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-400 shadow-sm"
      />
      <button
        type="submit"
        className="bg-orange-600 hover:bg-orange-700 text-white px-6 py-3 rounded-xl font-semibold transition"
      >
        Search
      </button>
    </form>
  );
}
