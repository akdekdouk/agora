import { getServerSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Link } from "@/i18n/navigation";
import ProductCard from "@/components/ProductCard";
import { getTranslations } from "next-intl/server";

export const dynamic = "force-dynamic";

export default async function DashboardProductsPage() {
  const session = await getServerSession();
  if (!session?.user?.id) redirect("/login");

  const t = await getTranslations("dashboard");

  const products = await prisma.product.findMany({
    where: { merchantId: session.user.id },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">{t("productsSection")}</h1>
        <Link href="/dashboard/products/new"
          className="bg-orange-500 text-white px-4 py-2 rounded-lg font-semibold hover:bg-orange-600 transition">
          {t("newProduct")}
        </Link>
      </div>

      {products.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <p className="text-4xl mb-3">🛍️</p>
          <p>{t("newProduct")}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {products.map((product) => <ProductCard key={product.id} {...product} />)}
        </div>
      )}
    </div>
  );
}
