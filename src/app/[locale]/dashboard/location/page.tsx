import { getServerSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Link } from "@/i18n/navigation";
import nextDynamic from "next/dynamic";

const LocationPicker = nextDynamic(() => import("@/components/LocationPicker"), { ssr: false });

export const dynamic = "force-dynamic";

export default async function LocationPage() {
  const session = await getServerSession();
  if (!session?.user?.id) redirect("/login");

  const merchant = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { businessName: true, city: true, lat: true, lng: true, exactAddress: true },
  });

  if (!merchant) redirect("/login");

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/dashboard" className="text-gray-400 hover:text-gray-600">←</Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">📍 Mon emplacement</h1>
          <p className="text-sm text-gray-500">{merchant.businessName} · {merchant.city}</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <p className="text-sm text-gray-600 mb-4">
          Définissez l'emplacement exact de votre commerce sur la carte.
          Cet emplacement sera visible par les clients et utilisé pour les recherches géographiques.
          Idéal pour les marchés temporaires ou emplacements non répertoriés.
        </p>

        <LocationPicker
          initialLat={merchant.lat}
          initialLng={merchant.lng}
          initialAddress={merchant.exactAddress ?? merchant.city}
        />

        {merchant.lat && merchant.lng && (
          <div className="mt-4 p-3 bg-blue-50 rounded-xl border border-blue-200">
            <p className="text-xs text-blue-700 font-medium">✓ Emplacement défini</p>
            <p className="text-xs text-blue-600 mt-0.5">{merchant.exactAddress ?? `${merchant.lat.toFixed(4)}, ${merchant.lng.toFixed(4)}`}</p>
            <p className="text-xs text-blue-500 mt-1">Votre commerce apparaît sur la carte publique avec vos offres actives.</p>
          </div>
        )}

        {!merchant.lat && (
          <div className="mt-4 p-3 bg-amber-50 rounded-xl border border-amber-200">
            <p className="text-xs text-amber-700">⚠️ Aucun emplacement défini — votre commerce n'apparaît pas encore sur la carte.</p>
          </div>
        )}
      </div>
    </div>
  );
}
