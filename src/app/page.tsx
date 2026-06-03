import Link from "next/link";
import { prisma } from "@/lib/prisma";
import MerchantCard from "@/components/MerchantCard";
import SearchBar from "@/components/SearchBar";

export const revalidate = 60;

async function getFeaturedMerchants() {
  return prisma.user.findMany({
    take: 6,
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      businessName: true,
      description: true,
      category: true,
      city: true,
      logo: true,
      _count: { select: { offers: true, products: true } },
    },
  });
}

export default async function HomePage() {
  const merchants = await getFeaturedMerchants();

  return (
    <div>
      {/* Hero */}
      <section className="bg-gradient-to-br from-orange-500 to-orange-600 text-white py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Discover Local Discounts
          </h1>
          <p className="text-orange-100 text-lg mb-8">
            Find the best deals from shops, artisans and restaurants near you
          </p>
          <SearchBar />
        </div>
      </section>

      {/* Featured Merchants */}
      <section className="max-w-6xl mx-auto px-4 py-12">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Featured Merchants</h2>
          <Link href="/merchants" className="text-orange-500 hover:text-orange-600 font-medium">
            View all →
          </Link>
        </div>

        {merchants.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <p className="text-lg">No merchants yet.</p>
            <Link href="/register" className="text-orange-500 hover:underline mt-2 inline-block">
              Register your business
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {merchants.map((m) => (
              <MerchantCard key={m.id} merchant={m} />
            ))}
          </div>
        )}
      </section>

      {/* CTA */}
      <section className="bg-orange-50 py-12 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-3">Are you a local business?</h2>
          <p className="text-gray-600 mb-6">Join Agora and start publishing your offers and products for free.</p>
          <Link
            href="/register"
            className="bg-orange-500 text-white px-6 py-3 rounded-xl font-semibold hover:bg-orange-600 transition"
          >
            Register your business
          </Link>
        </div>
      </section>
    </div>
  );
}
