import { prisma } from "@/lib/prisma";
import MerchantCard from "@/components/MerchantCard";
import { getTranslations } from "next-intl/server";

export const dynamic = "force-dynamic";

export default async function MerchantsPage() {
  const t = await getTranslations("merchants");
  const merchants = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true, businessName: true, description: true,
      category: true, city: true, logo: true,
      _count: { select: { offers: true, products: true } },
    },
  });

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      <h1 className="text-3xl font-bold text-gray-900 mb-2">{t("title")}</h1>
      <p className="text-gray-500 mb-8">{t("subtitle", { count: merchants.length })}</p>

      {merchants.length === 0 ? (
        <p className="text-center text-gray-500 py-16">{t("noMerchantsYet")}</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {merchants.map((m) => <MerchantCard key={m.id} merchant={m} />)}
        </div>
      )}
    </div>
  );
}
