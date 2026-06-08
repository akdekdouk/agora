import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Image from "next/image";
import OfferCard from "@/components/OfferCard";
import ProductCard from "@/components/ProductCard";
import { getTranslations } from "next-intl/server";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function MerchantProfilePage({ params }: Props) {
  const { id } = await params;
  const t = await getTranslations("merchantDetail");

  const merchant = await prisma.user.findUnique({
    where: { id },
    include: {
      offers: { orderBy: { createdAt: "desc" } },
      products: { orderBy: { createdAt: "desc" } },
    },
  });

  if (!merchant) notFound();

  const activeOffers = merchant.offers.filter((o) => new Date(o.validTo) >= new Date());

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-8 flex items-start gap-5">
        {merchant.logo ? (
          <div className="relative w-20 h-20 shrink-0">
            <Image src={merchant.logo} alt={merchant.businessName} fill className="rounded-full object-cover" />
          </div>
        ) : (
          <div className="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center text-orange-500 text-3xl font-bold shrink-0">
            {merchant.businessName[0]}
          </div>
        )}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{merchant.businessName}</h1>
          <p className="text-gray-500">📍 {merchant.city}{merchant.address ? ` — ${merchant.address}` : ""}</p>
          {merchant.phone && <p className="text-gray-500 text-sm">📞 {merchant.phone}</p>}
          <span className="inline-block mt-2 bg-orange-100 text-orange-700 text-xs font-medium px-2 py-0.5 rounded-full capitalize">
            {merchant.category}
          </span>
          {merchant.description && <p className="text-gray-600 mt-2">{merchant.description}</p>}
        </div>
      </div>

      <section className="mb-10">
        <h2 className="text-xl font-bold text-gray-900 mb-4">
          {t("activeOffers")} <span className="text-gray-400 font-normal text-base">({activeOffers.length})</span>
        </h2>
        {activeOffers.length === 0 ? (
          <p className="text-gray-400">{t("noActiveOffers")}</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {activeOffers.map((offer) => (
              <OfferCard key={offer.id} title={offer.title} description={offer.description}
                photo={offer.photo} discount={offer.discount}
                validFrom={offer.validFrom} validTo={offer.validTo} />
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="text-xl font-bold text-gray-900 mb-4">
          {t("products")} <span className="text-gray-400 font-normal text-base">({merchant.products.length})</span>
        </h2>
        {merchant.products.length === 0 ? (
          <p className="text-gray-400">{t("noProducts")}</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {merchant.products.map((product) => (
              <ProductCard key={product.id} name={product.name} description={product.description}
                images={product.images} originalPrice={product.originalPrice}
                discountedPrice={product.discountedPrice} category={product.category} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
