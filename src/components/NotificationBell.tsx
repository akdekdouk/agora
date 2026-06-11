"use client";

import { useEffect, useRef, useState } from "react";
import { Link } from "@/i18n/navigation";

interface Notification {
  id: string;
  type: string;
  title: string;
  body: string;
  link?: string | null;
  read: boolean;
  createdAt: string;
}

const TYPE_ICON: Record<string, string> = {
  NEW_OFFER: "🏷️",
  EXPIRING_SOON: "⏰",
  STOCK_LOW: "⚠️",
};

export default function NotificationBell() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchNotifs();
    const interval = setInterval(fetchNotifs, 60_000); // refresh every minute
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  async function fetchNotifs() {
    try {
      const res = await fetch("/api/consumer/notifications");
      if (!res.ok) return;
      const data = await res.json() as { notifications: Notification[]; unreadCount: number };
      setNotifications(data.notifications);
      setUnreadCount(data.unreadCount);
    } catch { /* ignore */ }
  }

  async function markAllRead() {
    await fetch("/api/consumer/notifications", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({}) });
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    setUnreadCount(0);
  }

  async function markRead(id: string) {
    await fetch("/api/consumer/notifications", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
    setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, read: true } : n));
    setUnreadCount((c) => Math.max(0, c - 1));
  }

  function timeAgo(dateStr: string) {
    const diff = Date.now() - new Date(dateStr).getTime();
    const min = Math.floor(diff / 60000);
    if (min < 60) return `il y a ${min}m`;
    const h = Math.floor(min / 60);
    if (h < 24) return `il y a ${h}h`;
    return `il y a ${Math.floor(h / 24)}j`;
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="relative p-1.5 rounded-full text-gray-500 hover:text-orange-500 hover:bg-orange-50 transition"
        title="Notifications"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-10 w-80 bg-white rounded-2xl shadow-xl border border-gray-100 z-50 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
            <span className="font-semibold text-gray-800 text-sm">Notifications</span>
            {unreadCount > 0 && (
              <button onClick={markAllRead} className="text-xs text-orange-500 hover:underline">
                Tout marquer lu
              </button>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto divide-y divide-gray-50">
            {notifications.length === 0 ? (
              <p className="text-center text-gray-400 text-sm py-8">Aucune notification</p>
            ) : notifications.map((n) => (
              <div
                key={n.id}
                onClick={() => markRead(n.id)}
                className={`px-4 py-3 hover:bg-gray-50 cursor-pointer transition ${n.read ? "opacity-60" : "bg-orange-50/40"}`}
              >
                {n.link ? (
                  <Link href={n.link} className="block">
                    <NotifContent n={n} timeAgo={timeAgo} />
                  </Link>
                ) : (
                  <NotifContent n={n} timeAgo={timeAgo} />
                )}
              </div>
            ))}
          </div>

          <div className="border-t border-gray-100 px-4 py-2 text-center">
            <Link href="/consumer/dashboard" className="text-xs text-orange-500 hover:underline" onClick={() => setOpen(false)}>
              Voir mon espace →
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

function NotifContent({ n, timeAgo }: { n: Notification; timeAgo: (d: string) => string }) {
  return (
    <div className="flex items-start gap-2">
      <span className="text-lg shrink-0">{TYPE_ICON[n.type] ?? "🔔"}</span>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold text-gray-800 truncate">{n.title}</p>
        <p className="text-xs text-gray-500 truncate">{n.body}</p>
        <p className="text-[10px] text-gray-300 mt-0.5">{timeAgo(n.createdAt)}</p>
      </div>
      {!n.read && <span className="w-2 h-2 bg-orange-400 rounded-full shrink-0 mt-1" />}
    </div>
  );
}
