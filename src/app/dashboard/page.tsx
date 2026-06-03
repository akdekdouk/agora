import { getServerSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Link from "next/link";

export default async function DashboardPage() {
  const session = await getServerSession();
  if (!session?.user?.id) redirect("/login");

  const merchant = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: {
      _count: { select: { offers: true, products: true } },
    },
  });

  if (!merchant) redirect("/login");

  const activeOffers = await prisma.offer.count({
    where: {
      merchantId: merchant.id,
      validTo: { gte: new Date() },
    },
  });

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      <h1 className="text-3xl font-bold text-gray-900 mb-1">
        Welcome, {merchant.businessName}
      </h1>
      <p className="text-gray-500 mb-8">{merchant.city} · {merchant.category}</p>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 text-center">
          <p className="text-3xl font-bold text-orange-500">{merchant._count.offers}</p>
          <p className="text-gray-500 mt-1">Total Offers</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 text-center">
          <p className="text-3xl font-bold text-green-500">{activeOffers}</p>
          <p className="text-gray-500 mt-1">Active Offers</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 text-center">
          <p className="text-3xl font-bold text-blue-500">{merchant._count.products}</p>
          <p className="text-gray-500 mt-1">Products</p>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-3">Offers</h2>
          <div className="flex gap-3">
            <Link href="/dashboard/offers" className="bg-orange-50 text-orange-700 px-4 py-2 rounded-lg font-medium hover:bg-orange-100 transition">
              View all
            </Link>
            <Link href="/dashboard/offers/new" className="bg-orange-500 text-white px-4 py-2 rounded-lg font-medium hover:bg-orange-600 transition">
              + New offer
            </Link>
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-3">Products</h2>
          <div className="flex gap-3">
            <Link href="/dashboard/products" className="bg-orange-50 text-orange-700 px-4 py-2 rounded-lg font-medium hover:bg-orange-100 transition">
              View all
            </Link>
            <Link href="/dashboard/products/new" className="bg-orange-500 text-white px-4 py-2 rounded-lg font-medium hover:bg-orange-600 transition">
              + New product
            </Link>
          </div>
        </div>
      </div>

      <div className="mt-6">
        <Link
          href={`/merchants/${merchant.id}`}
          className="text-sm text-orange-500 hover:underline"
        >
          View your public profile →
        </Link>
      </div>
    </div>
  );
}
