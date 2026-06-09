"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

interface Props {
  merchantId: string;
  initialFollowed: boolean;
  isLoggedIn: boolean;
}

export default function FollowButton({ merchantId, initialFollowed, isLoggedIn }: Props) {
  const [followed, setFollowed] = useState(initialFollowed);
  const [loading, setLoading] = useState(false);
  const t = useTranslations("merchantDetail");
  const router = useRouter();

  async function handleClick() {
    if (!isLoggedIn) {
      router.push("/consumer/login");
      return;
    }
    setLoading(true);
    const res = await fetch("/api/consumer/follow-merchant", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ merchantId }),
    });
    if (res.ok) {
      const data = await res.json() as { followed: boolean };
      setFollowed(data.followed);
    }
    setLoading(false);
  }

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className={`mt-3 px-4 py-2 rounded-lg text-sm font-medium transition disabled:opacity-60 ${
        followed
          ? "bg-gray-100 text-gray-600 hover:bg-gray-200"
          : "bg-orange-500 text-white hover:bg-orange-600"
      }`}
    >
      {loading ? "…" : followed ? t("unfollow") : t("follow")}
    </button>
  );
}
