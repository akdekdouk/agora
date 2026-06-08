"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const registered = params.get("registered");
  const [form, setForm] = useState({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const t = useTranslations("consumer");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const csrfRes = await fetch("/api/consumer/auth/csrf");
      const { csrfToken } = await csrfRes.json() as { csrfToken: string };

      const body = new URLSearchParams({
        csrfToken,
        email: form.email,
        password: form.password,
        callbackUrl: "/consumer/dashboard",
        json: "true",
      });

      const result = await fetch("/api/consumer/auth/callback/consumer-credentials", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: body.toString(),
      });

      const data = await result.json() as { url?: string };
      if (data.url && !data.url.includes("error=")) {
        router.push("/consumer/dashboard");
      } else {
        setError(t("invalidCredentials"));
      }
    } catch {
      setError(t("invalidCredentials"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 w-full max-w-md">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">{t("loginTitle")}</h1>

        {registered && (
          <div className="bg-green-50 border border-green-200 text-green-700 rounded-lg px-4 py-3 text-sm mb-4">
            {t("createAccount")}
          </div>
        )}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm mb-4">{error}</div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t("email")}</label>
            <input type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t("password")}</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                required
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                tabIndex={-1}
              >
                {showPassword ? "🙈" : "👁️"}
              </button>
            </div>
          </div>
          <button type="submit" disabled={loading}
            className="w-full bg-orange-500 hover:bg-orange-600 text-white font-medium py-2.5 rounded-lg transition disabled:opacity-60">
            {loading ? t("signingIn") : t("signIn")}
          </button>
        </form>

        <p className="text-sm text-gray-500 mt-4 text-center">
          <Link href="/consumer/forgot-password" className="text-orange-500 hover:underline">{t("forgotPassword")}</Link>
        </p>

        <p className="text-sm text-gray-500 mt-2 text-center">
          {t("noAccount")}{" "}
          <Link href="/consumer/register" className="text-orange-500 hover:underline font-medium">{t("signUpFree")}</Link>
        </p>
      </div>
    </div>
  );
}

export default function ConsumerLoginPage() {
  return <Suspense><LoginForm /></Suspense>;
}
