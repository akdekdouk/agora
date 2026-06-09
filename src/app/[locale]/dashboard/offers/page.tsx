import { getServerSession } from "@/lib/auth";
import { redirect } from "@/i18n/navigation";
import { prisma } from "@/lib/prisma";
import { Link } from "@/i18n/navigation";
import OfferCard from "@/components/OfferCard";
import { getTranslations } from "next-intl/server";

export const dynamic = "force-dynamic";

export default async function DashboardOffersPage() {
  const session = await getServerSession();
  if (!session?.user?.id) redirect("/login");

  const t = await getTranslations();
  const tDash = await getTranslations("dashboard");
  const tCommon = await getTranslations("common");

  const offers = await prisma.offer.findMany({
    where: { merchantId: session.user.id },
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { claims: true } } },
  });

  const now = new Date();

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">{tDash("offersSection")}</h1>
        <Link href="/dashboard/offers/new"
          className="bg-orange-500 text-white px-4 py-2 rounded-lg font-semibold hover:bg-orange-600 transition">
          {tDash("newOffer")}
        </Link>
      </div>

      {offers.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <p className="text-4xl mb-3">📢</p>
          <p>{t("dashboard.newOffer")}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {offers.map((offer) => {
            const expired = new Date(offer.validTo) < now;
            return (
              <div key={offer.id} className={expired ? "opacity-50" : ""}>
                <OfferCard {...offer} claimsCount={offer._count.claims} />
                <p className="text-xs text-center text-gray-500 mt-1">
                  {offer._count.claims} claim{offer._count.claims !== 1 ? "s" : ""}
                  {offer.maxClaims != null ? ` / ${offer.maxClaims}` : ""}
                  {expired && <span className="text-gray-400"> — {tCommon("expired")}</span>}
                </p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
