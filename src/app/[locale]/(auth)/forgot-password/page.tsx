"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const t = useTranslations("forgotPassword");
  const [step, setStep] = useState<"email" | "reset">("email");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleEmailSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const res = await fetch("/api/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, action: "check" }),
    });
    setLoading(false);
    if (res.ok) {
      setStep("reset");
    } else {
      const data = await res.json() as { error?: string };
      setError(data.error ?? t("noAccountFound"));
    }
  }

  async function handleResetSubmit(e: FormEvent) {
    e.preventDefault();
    if (password !== confirm) { setError(t("passwordsNoMatch")); return; }
    setLoading(true);
    setError("");
    const res = await fetch("/api/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, action: "reset" }),
    });
    setLoading(false);
    if (res.ok) {
      router.push("/login?reset=1");
    } else {
      const data = await res.json() as { error?: string };
      setError(data.error ?? t("resetFailed"));
    }
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 w-full max-w-md">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">{t("title")}</h1>

        {step === "email" && (
          <>
            <p className="text-gray-500 text-sm mb-6">{t("enterEmail")}</p>
            <form onSubmit={handleEmailSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t("email")}</label>
                <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-400" />
              </div>
              {error && <p className="text-red-500 text-sm">{error}</p>}
              <button type="submit" disabled={loading}
                className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold py-2.5 rounded-lg transition disabled:opacity-60">
                {loading ? t("checking") : t("continue")}
              </button>
            </form>
          </>
        )}

        {step === "reset" && (
          <>
            <p className="text-gray-500 text-sm mb-6">{t("accountFound", { email })}</p>
            <form onSubmit={handleResetSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t("newPassword")}</label>
                <input type="password" required minLength={8} value={password} onChange={(e) => setPassword(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-400" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t("confirmPassword")}</label>
                <input type="password" required minLength={8} value={confirm} onChange={(e) => setConfirm(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-400" />
              </div>
              {error && <p className="text-red-500 text-sm">{error}</p>}
              <button type="submit" disabled={loading}
                className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold py-2.5 rounded-lg transition disabled:opacity-60">
                {loading ? t("saving") : t("savePassword")}
              </button>
            </form>
          </>
        )}

        <p className="text-center text-sm text-gray-500 mt-4">
          <Link href="/login" className="text-orange-500 hover:underline">{t("backToSignIn")}</Link>
        </p>
      </div>
    </div>
  );
}
