"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

export default function Footer() {
  const t = useTranslations("footer");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", message: "" });
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");

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
    <footer className="border-t border-gray-200 bg-white mt-16">
      <div className="max-w-6xl mx-auto px-4 py-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-gray-400">
        <p>
          © {new Date().getFullYear()} <span className="font-medium text-gray-500">Lumeria</span>
          {" · "}
          <a href="mailto:admin@lumeria-consulting.com" className="hover:text-orange-500 transition">admin@lumeria-consulting.com</a>
          {" · "}
          <a href="tel:+33774874751" className="hover:text-orange-500 transition">+33 7 74 87 47 51</a>
          {" · "}
          <a href="tel:+393511549779" className="hover:text-orange-500 transition">+39 351 154 97 79</a>
          {" · "}
          <a href="https://www.lumeria-consulting.com" target="_blank" rel="noopener noreferrer" className="hover:text-orange-500 transition">lumeria-consulting.com</a>
        </p>

        <button
          onClick={() => { setOpen(!open); setStatus("idle"); }}
          className="text-xs text-gray-400 hover:text-orange-500 transition underline underline-offset-2"
        >
          {t("contactLink")}
        </button>
      </div>

      {open && (
        <div className="max-w-lg mx-auto px-4 pb-6">
          {status === "sent" ? (
            <p className="text-green-600 text-sm text-center py-4">{t("sent")}</p>
          ) : (
            <form onSubmit={handleSubmit} className="bg-gray-50 border border-gray-200 rounded-xl p-4 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">{t("name")}</label>
                  <input required type="text" value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">{t("email")}</label>
                  <input required type="email" value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">{t("message")}</label>
                <textarea required rows={3} value={form.message}
                  onChange={(e) => setForm({ ...form, message: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 resize-none" />
              </div>
              {status === "error" && <p className="text-red-500 text-xs">{t("error")}</p>}
              <button type="submit" disabled={status === "sending"}
                className="w-full bg-orange-500 text-white py-2 rounded-lg text-sm font-medium hover:bg-orange-600 disabled:opacity-60 transition">
                {status === "sending" ? t("sending") : t("send")}
              </button>
            </form>
          )}
        </div>
      )}
    </footer>
  );
}
