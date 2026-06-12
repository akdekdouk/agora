"use client";

import { useEffect, useState } from "react";
import { useRouter } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

interface Profile {
  id: string;
  email: string;
  name: string | null;
  phone: string | null;
  city: string | null;
  avatar: string | null;
  interests: string;
  emailNotifications: boolean;
  googleId: string | null;
  facebookId: string | null;
}

const CATEGORIES = [
  { value: "restaurant", labelKey: "catRestaurant" as const },
  { value: "shop", labelKey: "catShop" as const },
  { value: "artisan", labelKey: "catArtisan" as const },
];

export default function ConsumerSettingsPage() {
  const router = useRouter();
  const t = useTranslations("consumer");

  const [profile, setProfile] = useState<Profile | null>(null);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState("");
  const [avatar, setAvatar] = useState<string | null>(null);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [interests, setInterests] = useState<string[]>([]);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileSaved, setProfileSaved] = useState(false);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [pwLoading, setPwLoading] = useState(false);
  const [pwError, setPwError] = useState("");
  const [pwSuccess, setPwSuccess] = useState(false);

  useEffect(() => {
    fetch("/api/consumer/profile")
      .then((r) => {
        if (r.status === 401) { router.push("/consumer/login"); return null; }
        return r.json();
      })
      .then((data: Profile | null) => {
        if (!data) return;
        setProfile(data);
        setName(data.name ?? "");
        setPhone(data.phone ?? "");
        setCity(data.city ?? "");
        setAvatar(data.avatar ?? null);
        setInterests(JSON.parse(data.interests ?? "[]") as string[]);
        setEmailNotifications(data.emailNotifications);
      });
  }, [router]);

  async function uploadAvatar(file: File) {
    setAvatarUploading(true);
    const form = new FormData();
    form.append("file", file);
    try {
      const res = await fetch("/api/consumer/upload", { method: "POST", body: form });
      const data = await res.json() as { path?: string; error?: string };
      if (data.path) {
        setAvatar(data.path);
        // Save immediately
        await fetch("/api/consumer/profile", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ avatar: data.path }),
        });
      }
    } finally {
      setAvatarUploading(false);
    }
  }

  function toggleInterest(cat: string) {
    setInterests((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
    );
    setProfileSaved(false);
  }

  async function saveProfile(e: React.FormEvent) {
    e.preventDefault();
    setProfileSaving(true);
    setProfileSaved(false);
    await fetch("/api/consumer/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, phone, city, avatar, interests, emailNotifications }),
    });
    setProfileSaving(false);
    setProfileSaved(true);
    setTimeout(() => setProfileSaved(false), 3000);
  }

  async function changePassword(e: React.FormEvent) {
    e.preventDefault();
    setPwError("");
    setPwSuccess(false);
    if (newPassword !== confirmPassword) { setPwError(t("passwordMismatch")); return; }
    if (newPassword.length < 6) { setPwError("Min. 6 characters"); return; }
    setPwLoading(true);
    const res = await fetch("/api/consumer/change-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currentPassword, newPassword }),
    });
    setPwLoading(false);
    if (res.ok) {
      setPwSuccess(true);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } else {
      const data = await res.json() as { error?: string };
      setPwError(data.error === "wrongPassword" ? t("wrongPassword") : t("passwordMismatch"));
    }
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-400">Loading…</p>
      </div>
    );
  }

  const isOAuth = !!(profile.googleId || profile.facebookId);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-4 py-10">
        <div className="flex items-center gap-3 mb-8">
          <Link href="/consumer/dashboard" className="text-gray-400 hover:text-gray-600 text-lg">←</Link>
          <h1 className="text-2xl font-bold text-gray-900">{t("settingsTitle")}</h1>
        </div>

        <form onSubmit={saveProfile} className="space-y-6">
          {/* Profile section */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">{t("profileSection")}</h2>

            {/* Avatar */}
            <div className="flex items-center gap-5 mb-6">
              <div className="relative shrink-0">
                <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-gray-200 bg-gray-100 flex items-center justify-center">
                  {avatar
                    ? <img src={avatar} alt="avatar" className="w-full h-full object-cover" />
                    : <span className="text-3xl font-bold text-gray-400">{(name || profile.email).charAt(0).toUpperCase()}</span>
                  }
                </div>
                <label className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-orange-500 border-2 border-white flex items-center justify-center cursor-pointer hover:bg-orange-600 transition">
                  {avatarUploading
                    ? <svg className="w-3 h-3 text-white animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/></svg>
                    : <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"/><path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
                  }
                  <input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && uploadAvatar(e.target.files[0])} />
                </label>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-700">Photo de profil</p>
                <p className="text-xs text-gray-400 mt-0.5">JPG, PNG ou WebP · max 5 Mo</p>
                {avatar && (
                  <button type="button" onClick={() => { setAvatar(null); }} className="text-xs text-red-400 hover:text-red-600 mt-1">Supprimer</button>
                )}
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t("nameLabel")}</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => { setName(e.target.value); setProfileSaved(false); }}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  value={profile.email}
                  disabled
                  className="w-full border border-gray-100 rounded-lg px-3 py-2 text-sm bg-gray-50 text-gray-400 cursor-not-allowed"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t("phoneLabel")}</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => { setPhone(e.target.value); setProfileSaved(false); }}
                  placeholder="+33 6 00 00 00 00"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t("cityLabel")}</label>
                <input
                  type="text"
                  value={city}
                  onChange={(e) => { setCity(e.target.value); setProfileSaved(false); }}
                  placeholder="Paris, Lyon, Marseille…"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                />
              </div>
            </div>
          </div>

          {/* Preferences section */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-1">{t("preferencesSection")}</h2>

            <div className="mb-5">
              <p className="text-sm font-medium text-gray-700 mb-1">{t("interestsLabel")}</p>
              <p className="text-xs text-gray-400 mb-3">{t("interestsHint")}</p>
              <div className="flex gap-3 flex-wrap">
                {CATEGORIES.map(({ value, labelKey }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => toggleInterest(value)}
                    className={`px-4 py-2 rounded-full text-sm font-medium border transition ${
                      interests.includes(value)
                        ? "bg-orange-500 text-white border-orange-500"
                        : "bg-white text-gray-600 border-gray-200 hover:border-orange-300"
                    }`}
                  >
                    {t(labelKey)}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-start gap-3 pt-4 border-t border-gray-100">
              <input
                id="emailNotif"
                type="checkbox"
                checked={emailNotifications}
                onChange={(e) => { setEmailNotifications(e.target.checked); setProfileSaved(false); }}
                className="mt-0.5 h-4 w-4 accent-orange-500 cursor-pointer"
              />
              <div>
                <label htmlFor="emailNotif" className="text-sm font-medium text-gray-700 cursor-pointer">
                  {t("emailNotificationsLabel")}
                </label>
                <p className="text-xs text-gray-400 mt-0.5">{t("emailNotificationsHint")}</p>
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={profileSaving}
            className="w-full bg-orange-500 hover:bg-orange-600 text-white font-medium py-2.5 rounded-lg transition disabled:opacity-60"
          >
            {profileSaved ? `✓ ${t("saved")}` : profileSaving ? t("saving") : t("saveChanges")}
          </button>
        </form>

        {/* Password section */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mt-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">{t("securitySection")}</h2>
          {isOAuth && (
            <p className="text-xs text-gray-500 bg-blue-50 border border-blue-100 rounded-lg px-3 py-2 mb-4">
              {t("oauthAccount")}
            </p>
          )}
          <form onSubmit={changePassword} className="space-y-4">
            {!isOAuth && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t("currentPassword")}</label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  required={!isOAuth}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                />
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t("newPassword")}</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                minLength={6}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t("confirmNewPassword")}</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
              />
            </div>
            {pwError && <p className="text-red-500 text-sm">{pwError}</p>}
            {pwSuccess && <p className="text-green-600 text-sm">✓ {t("passwordChanged")}</p>}
            <button
              type="submit"
              disabled={pwLoading}
              className="w-full bg-gray-800 hover:bg-gray-900 text-white font-medium py-2.5 rounded-lg transition disabled:opacity-60"
            >
              {pwLoading ? t("changingPassword") : t("changePassword")}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
