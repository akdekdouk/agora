import { getServerSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Link } from "@/i18n/navigation";
import { getTranslations } from "next-intl/server";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const session = await getServerSession();
  if (!session?.user?.id) redirect("/login");

  const t = await getTranslations("dashboard");
  const tScan = await getTranslations("dashboardScan");

  const merchant = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: { _count: { select: { offers: true, products: true } } },
  });

  if (!merchant) redirect("/login");

  const activeOffers = await prisma.offer.count({
    where: { merchantId: merchant.id, validTo: { gte: new Date() } },
  });

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      <h1 className="text-3xl font-bold text-gray-900 mb-1">{t("welcome", { name: merchant.businessName })}</h1>
      <p className="text-gray-500 mb-8">{merchant.city} · {
        ({
          shop: t("category_shop"), artisan: t("category_artisan"), restaurant: t("category_restaurant"),
          beauty: t("category_beauty"), hotel: t("category_hotel"), education: t("category_education"),
          health: t("category_health"), sport: t("category_sport"), services: t("category_services"),
          other: t("category_other"),
        } as Record<string, string>)[merchant.category] ?? merchant.category
      }</p>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 text-center">
          <p className="text-3xl font-bold text-orange-500">{merchant._count.offers}</p>
          <p className="text-gray-500 mt-1">{t("totalOffers")}</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 text-center">
          <p className="text-3xl font-bold text-green-500">{activeOffers}</p>
          <p className="text-gray-500 mt-1">{t("activeOffers")}</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 text-center">
          <p className="text-3xl font-bold text-blue-500">{merchant._count.products}</p>
          <p className="text-gray-500 mt-1">{t("products")}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-3">{t("offersSection")}</h2>
          <div className="flex gap-3">
            <Link href="/dashboard/offers" className="bg-orange-50 text-orange-700 px-4 py-2 rounded-lg font-medium hover:bg-orange-100 transition">
              {t("viewAll")}
            </Link>
            <Link href="/dashboard/offers/new" className="bg-orange-500 text-white px-4 py-2 rounded-lg font-medium hover:bg-orange-600 transition">
              {t("newOffer")}
            </Link>
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-3">{t("productsSection")}</h2>
          <div className="flex gap-3">
            <Link href="/dashboard/products" className="bg-orange-50 text-orange-700 px-4 py-2 rounded-lg font-medium hover:bg-orange-100 transition">
              {t("viewAll")}
            </Link>
            <Link href="/dashboard/products/new" className="bg-orange-500 text-white px-4 py-2 rounded-lg font-medium hover:bg-orange-600 transition">
              {t("newProduct")}
            </Link>
          </div>
        </div>
      </div>

      {/* Scan link */}
      <div className="mt-6 bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">📊 Statistiques</h2>
          <p className="text-sm text-gray-500 mt-1">Réclamations, sauvegardes, top offres et produits</p>
        </div>
        <Link href="/dashboard/stats" className="bg-orange-50 text-orange-700 px-4 py-2 rounded-lg font-medium hover:bg-orange-100 transition">
          Voir les stats →
        </Link>
      </div>

      {/* Scan link */}
      <div className="mt-6 bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">{tScan("title")}</h2>
          <p className="text-sm text-gray-500 mt-1">{tScan("subtitle")}</p>
        </div>
        <Link href="/scan" className="bg-green-500 text-white px-4 py-2 rounded-lg font-medium hover:bg-green-600 transition">
          {tScan("scanButton")}
        </Link>
      </div>

      <div className="mt-4">
        <Link href={`/merchants/${merchant.id}`} className="text-sm text-orange-500 hover:underline">
          {t("viewPublicProfile")}
        </Link>
      </div>
    </div>
  );
}
