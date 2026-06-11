"use client";

import { useEffect, useRef, useState } from "react";

interface ActiveOffer {
  id: string;
  title: string;
  discount: number;
  photo?: string | null;
  bannerKey?: string | null;
  validTo: string;
}

interface MerchantPin {
  id: string;
  businessName: string;
  category: string;
  city: string;
  exactAddress?: string | null;
  lat: number;
  lng: number;
  logo?: string | null;
  offers: ActiveOffer[];
}

const CATEGORY_COLORS: Record<string, string> = {
  restaurant: "#22c55e",
  shop: "#3b82f6",
  artisan: "#a855f7",
  beauty: "#ec4899",
  hotel: "#f59e0b",
  education: "#6366f1",
  health: "#14b8a6",
  sport: "#f97316",
  services: "#64748b",
  other: "#9ca3af",
};

const RADIUS_OPTIONS = [5, 10, 25, 50];

declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    L: any;
  }
}

export default function MerchantsMap() {
  const mapRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mapInstanceRef = useRef<any>(null);
  const [merchants, setMerchants] = useState<MerchantPin[]>([]);
  const [radius, setRadius] = useState(10);
  const [userPos, setUserPos] = useState<{ lat: number; lng: number } | null>(null);
  const [locating, setLocating] = useState(false);
  const [selectedMerchant, setSelectedMerchant] = useState<MerchantPin | null>(null);

  useEffect(() => {
    fetch("/api/map")
      .then((r) => r.json())
      .then((data: MerchantPin[]) => setMerchants(data))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    if (!document.querySelector('link[href*="leaflet"]')) {
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
      document.head.appendChild(link);
    }

    import("leaflet").then((L) => {
      const map = L.map(mapRef.current!).setView([46.6, 2.3], 6);

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      }).addTo(map);

      mapInstanceRef.current = map;

      // Add markers for merchants
      merchants.forEach((m) => addMarker(L, map, m));
    });

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Add markers when merchants load
  useEffect(() => {
    if (!mapInstanceRef.current || merchants.length === 0) return;
    import("leaflet").then((L) => {
      merchants.forEach((m) => addMarker(L, mapInstanceRef.current, m));
      // Fit bounds
      const bounds = merchants.map((m): [number, number] => [m.lat, m.lng]);
      if (bounds.length > 0) mapInstanceRef.current.fitBounds(bounds, { padding: [40, 40] });
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [merchants]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function addMarker(L: any, map: any, m: MerchantPin) {
    const color = CATEGORY_COLORS[m.category] ?? "#f97316";
    const primary = getComputedStyle(document.documentElement).getPropertyValue("--color-primary").trim() || "#f97316";

    const icon = L.divIcon({
      className: "",
      html: `<div style="
        width:36px;height:36px;border-radius:50% 50% 50% 0;
        background:${primary};border:3px solid white;
        box-shadow:0 2px 8px rgba(0,0,0,0.3);
        transform:rotate(-45deg);
        display:flex;align-items:center;justify-content:center;
      "><div style="transform:rotate(45deg);color:white;font-size:14px;">🏪</div></div>`,
      iconSize: [36, 36],
      iconAnchor: [18, 36],
      popupAnchor: [0, -38],
    });

    const offersList = m.offers.slice(0, 3).map(o =>
      `<div style="display:flex;align-items:center;gap:6px;padding:4px 0;border-bottom:1px solid #f3f4f6;">
        <span style="background:${color};color:white;border-radius:9999px;padding:1px 7px;font-size:11px;font-weight:700;">-${o.discount}%</span>
        <span style="font-size:12px;color:#374151;flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${o.title}</span>
      </div>`
    ).join("");

    const popup = L.popup({ maxWidth: 260 }).setContent(`
      <div style="font-family:system-ui,sans-serif;min-width:220px;">
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;">
          <div style="width:32px;height:32px;border-radius:50%;background:${color}22;display:flex;align-items:center;justify-content:center;font-size:16px;">🏪</div>
          <div>
            <div style="font-weight:700;font-size:14px;color:#111827;">${m.businessName}</div>
            <div style="font-size:11px;color:#6b7280;">${m.exactAddress ?? m.city}</div>
          </div>
        </div>
        <div style="margin-bottom:8px;">
          <div style="font-size:11px;font-weight:600;color:#6b7280;text-transform:uppercase;letter-spacing:0.05em;margin-bottom:4px;">
            ${m.offers.length} offre${m.offers.length > 1 ? "s" : ""} active${m.offers.length > 1 ? "s" : ""}
          </div>
          ${offersList}
        </div>
        <a href="/merchants/${m.id}" style="display:block;text-align:center;background:${primary};color:white;border-radius:8px;padding:6px;font-size:12px;font-weight:600;text-decoration:none;">
          Voir le profil →
        </a>
      </div>
    `);

    const marker = L.marker([m.lat, m.lng], { icon }).addTo(map).bindPopup(popup);
    marker.on("click", () => setSelectedMerchant(m));
  }

  function locateMe() {
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        setUserPos({ lat: latitude, lng: longitude });
        setLocating(false);
        if (mapInstanceRef.current) {
          import("leaflet").then((L) => {
            mapInstanceRef.current.setView([latitude, longitude], 13);
            // User marker
            const userIcon = L.divIcon({
              className: "",
              html: `<div style="width:14px;height:14px;border-radius:50%;background:#3b82f6;border:3px solid white;box-shadow:0 0 0 4px rgba(59,130,246,0.3);"></div>`,
              iconSize: [14, 14],
              iconAnchor: [7, 7],
            });
            L.marker([latitude, longitude], { icon: userIcon }).addTo(mapInstanceRef.current)
              .bindPopup("Votre position").openPopup();

            // Draw radius circle
            L.circle([latitude, longitude], {
              radius: radius * 1000,
              color: "#3b82f6",
              fillColor: "#3b82f6",
              fillOpacity: 0.08,
              weight: 1.5,
              dashArray: "6,4",
            }).addTo(mapInstanceRef.current);
          });
        }
      },
      () => setLocating(false)
    );
  }

  const nearbyMerchants = userPos
    ? merchants.filter((m) => {
        const R = 6371;
        const dLat = ((m.lat - userPos.lat) * Math.PI) / 180;
        const dLng = ((m.lng - userPos.lng) * Math.PI) / 180;
        const a = Math.sin(dLat / 2) ** 2 + Math.cos((userPos.lat * Math.PI) / 180) * Math.cos((m.lat * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
        const dist = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return dist <= radius;
      })
    : merchants;

  return (
    <div className="relative w-full h-full">
      {/* Controls */}
      <div className="absolute top-3 left-3 z-[1000] flex flex-col gap-2">
        <button
          onClick={locateMe}
          disabled={locating}
          className="bg-white shadow-md border border-gray-200 rounded-xl px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition flex items-center gap-2 disabled:opacity-60"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
          </svg>
          {locating ? "Localisation…" : "Près de moi"}
        </button>

        {userPos && (
          <div className="bg-white shadow-md border border-gray-200 rounded-xl px-3 py-2">
            <p className="text-xs text-gray-500 mb-1.5">Rayon</p>
            <div className="flex gap-1">
              {RADIUS_OPTIONS.map((r) => (
                <button
                  key={r}
                  onClick={() => setRadius(r)}
                  className={`px-2 py-1 rounded-lg text-xs font-medium transition ${radius === r ? "text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}
                  style={radius === r ? { backgroundColor: "var(--color-primary)" } : undefined}
                >
                  {r}km
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Merchant count */}
      <div className="absolute top-3 right-3 z-[1000] bg-white shadow-md border border-gray-200 rounded-xl px-3 py-2">
        <p className="text-xs font-semibold" style={{ color: "var(--color-primary)" }}>
          {nearbyMerchants.length} commerce{nearbyMerchants.length !== 1 ? "s" : ""}
        </p>
        <p className="text-[10px] text-gray-400">avec offres actives</p>
      </div>

      {/* Map */}
      <div ref={mapRef} className="w-full h-full" />

      {/* No merchants */}
      {merchants.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 text-center max-w-xs">
            <p className="text-2xl mb-2">🗺️</p>
            <p className="text-gray-600 text-sm font-medium">Aucun commerce n'a encore défini son emplacement.</p>
            <p className="text-gray-400 text-xs mt-1">Les commerçants peuvent le faire depuis leur tableau de bord.</p>
          </div>
        </div>
      )}
    </div>
  );
}
