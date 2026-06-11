"use client";

import { useEffect, useRef, useState } from "react";

interface Props {
  initialLat?: number | null;
  initialLng?: number | null;
  initialAddress?: string | null;
  onSave?: (lat: number, lng: number, address: string) => void;
}

interface NominatimResult {
  lat: string;
  lon: string;
  display_name: string;
}

declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    L: any;
  }
}

export default function LocationPicker({ initialLat, initialLng, initialAddress, onSave }: Props) {
  const mapRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mapInstanceRef = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const markerRef = useRef<any>(null);
  const [address, setAddress] = useState(initialAddress ?? "");
  const [searching, setSearching] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(
    initialLat && initialLng ? { lat: initialLat, lng: initialLng } : null
  );

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    // Load leaflet CSS
    if (!document.querySelector('link[href*="leaflet"]')) {
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
      document.head.appendChild(link);
    }

    import("leaflet").then((L) => {
      // Fix default icon
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
        shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
      });

      const defaultCenter: [number, number] = coords ? [coords.lat, coords.lng] : [48.8566, 2.3522];
      const map = L.map(mapRef.current!).setView(defaultCenter, coords ? 15 : 5);

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      }).addTo(map);

      const marker = L.marker(defaultCenter, { draggable: true });
      if (coords) {
        marker.addTo(map);
        marker.bindPopup("Votre emplacement").openPopup();
      }

      marker.on("dragend", () => {
        const pos = marker.getLatLng();
        setCoords({ lat: pos.lat, lng: pos.lng });
        // Reverse geocode
        fetch(`https://nominatim.openstreetmap.org/reverse?lat=${pos.lat}&lon=${pos.lng}&format=json`)
          .then((r) => r.json())
          .then((data: { display_name?: string }) => {
            if (data.display_name) setAddress(data.display_name);
          })
          .catch(() => {});
      });

      map.on("click", (e: { latlng: { lat: number; lng: number } }) => {
        const { lat, lng } = e.latlng;
        marker.setLatLng([lat, lng]);
        if (!map.hasLayer(marker)) marker.addTo(map);
        setCoords({ lat, lng });
        // Reverse geocode
        fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`)
          .then((r) => r.json())
          .then((data: { display_name?: string }) => {
            if (data.display_name) setAddress(data.display_name);
          })
          .catch(() => {});
      });

      mapInstanceRef.current = map;
      markerRef.current = marker;
    });

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function searchAddress() {
    if (!address.trim()) return;
    setSearching(true);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(address)}&format=json&limit=1`
      );
      const results = await res.json() as NominatimResult[];
      if (results.length > 0) {
        const { lat, lon, display_name } = results[0];
        const latNum = parseFloat(lat);
        const lngNum = parseFloat(lon);
        setCoords({ lat: latNum, lng: lngNum });
        setAddress(display_name);

        if (mapInstanceRef.current && markerRef.current) {
          const L = await import("leaflet");
          mapInstanceRef.current.setView([latNum, lngNum], 16);
          markerRef.current.setLatLng([latNum, lngNum]);
          if (!mapInstanceRef.current.hasLayer(markerRef.current)) {
            markerRef.current.addTo(mapInstanceRef.current);
          }
          markerRef.current.bindPopup(display_name).openPopup();
          // Fix icon again after dynamic import
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          delete (L.Icon.Default.prototype as any)._getIconUrl;
        }
      }
    } catch { /* ignore */ }
    setSearching(false);
  }

  async function saveLocation() {
    if (!coords) return;
    setSaving(true);
    const res = await fetch("/api/merchant/location", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ lat: coords.lat, lng: coords.lng, exactAddress: address }),
    });
    setSaving(false);
    if (res.ok) {
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
      onSave?.(coords.lat, coords.lng, address);
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <input
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && searchAddress()}
          placeholder="Rechercher une adresse ou cliquer sur la carte…"
          className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
        />
        <button
          type="button"
          onClick={searchAddress}
          disabled={searching}
          className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-2 rounded-lg text-sm font-medium transition disabled:opacity-50"
        >
          {searching ? "…" : "Chercher"}
        </button>
      </div>

      <div ref={mapRef} className="w-full h-64 rounded-xl border border-gray-200 z-0" />

      <p className="text-xs text-gray-400">
        💡 Cliquez sur la carte ou déplacez le marqueur pour définir votre emplacement exact.
        Utile pour les marchés temporaires ou adresses non référencées.
      </p>

      {coords && (
        <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded-lg px-3 py-2">
          <span className="text-xs text-green-700">
            📍 {coords.lat.toFixed(5)}, {coords.lng.toFixed(5)}
          </span>
          <button
            type="button"
            onClick={saveLocation}
            disabled={saving}
            className="bg-green-500 hover:bg-green-600 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition disabled:opacity-60"
          >
            {saving ? "Enregistrement…" : saved ? "✓ Sauvegardé !" : "Enregistrer l'emplacement"}
          </button>
        </div>
      )}
    </div>
  );
}
