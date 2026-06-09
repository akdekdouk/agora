"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

export default function HelpPage() {
  const t = useTranslations("help");
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [form, setForm] = useState({ name: "", email: "", message: "" });
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");

  const faqs = t.raw("faqs") as { q: string; a: string }[];

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("sending");
    try {
      const res = await fetch("/api/help/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error();
      setStatus("sent");
      setForm({ name: "", email: "", message: "" });
    } catch {
      setStatus("error");
    }
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      {/* Header */}
      <h1 className="text-3xl font-bold text-gray-900 mb-2">{t("title")}</h1>
      <p className="text-gray-500 mb-10">{t("subtitle")}</p>

      {/* FAQ */}
      <section className="mb-12">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">{t("faqTitle")}</h2>
        <div className="space-y-3">
          {faqs.map((faq, i) => (
            <div key={i} className="border border-gray-200 rounded-xl overflow-hidden">
              <button
                onClick={() => setOpenFaq(openFaq === i ? null : i)}
                className="w-full text-left px-5 py-4 flex justify-between items-center hover:bg-gray-50 transition"
              >
                <span className="font-medium text-gray-800 text-sm">{faq.q}</span>
                <span className="text-gray-400 text-lg">{openFaq === i ? "−" : "+"}</span>
              </button>
              {openFaq === i && (
                <div className="px-5 pb-4 text-gray-600 text-sm leading-relaxed">{faq.a}</div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Contact form */}
      <section className="bg-orange-50 border border-orange-100 rounded-2xl p-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-1">{t("contactTitle")}</h2>
        <p className="text-gray-500 text-sm mb-6">{t("contactSubtitle")}</p>

        {status === "sent" ? (
          <p className="text-green-600 font-medium">{t("contactSent")}</p>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">{t("contactName")}</label>
                <input
                  required
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">{t("contactEmail")}</label>
                <input
                  required
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">{t("contactMessage")}</label>
              <textarea
                required
                rows={4}
                value={form.message}
                onChange={(e) => setForm({ ...form, message: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 resize-none"
              />
            </div>
            {status === "error" && <p className="text-red-500 text-sm">{t("contactError")}</p>}
            <button
              type="submit"
              disabled={status === "sending"}
              className="bg-orange-500 text-white px-6 py-2.5 rounded-lg font-medium text-sm hover:bg-orange-600 disabled:opacity-60 transition"
            >
              {status === "sending" ? t("contactSending") : t("contactSend")}
            </button>
          </form>
        )}
      </section>

      {/* Footer info */}
      <div className="mt-10 text-center text-xs text-gray-400 space-y-1">
        <p>{t("builtBy")} <span className="font-medium text-gray-500">Lumeria</span></p>
        <p>
          <a href="mailto:akdekdouk@gmail.com" className="hover:text-orange-500 transition">akdekdouk@gmail.com</a>
          {" · "}
          <a href="tel:+393511549779" className="hover:text-orange-500 transition">+39 351 154 9779</a>
        </p>
      </div>
    </div>
  );
}
