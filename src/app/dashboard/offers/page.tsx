import { getServerSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import OfferCard from "@/components/OfferCard";

export const dynamic = "force-dynamic";

export default async function DashboardOffersPage() {
  const session = await getServerSession();
  if (!session?.user?.id) redirect("/login");

  const offers = await prisma.offer.findMany({
    where: { merchantId: session.user.id },
    orderBy: { createdAt: "desc" },
  });

  const now = new Date();

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">My Offers</h1>
        <Link
          href="/dashboard/offers/new"
          className="bg-orange-500 text-white px-4 py-2 rounded-lg font-semibold hover:bg-orange-600 transition"
        >
          + New offer
        </Link>
      </div>

      {offers.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <p className="text-4xl mb-3">📢</p>
          <p>No offers yet. Create your first one!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {offers.map((offer) => {
            const expired = new Date(offer.validTo) < now;
            return (
              <div key={offer.id} className={expired ? "opacity-50" : ""}>
                <OfferCard {...offer} />
                {expired && (
                  <p className="text-xs text-center text-gray-400 mt-1">Expired</p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
