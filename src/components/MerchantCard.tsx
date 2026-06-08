import { Link } from "@/i18n/navigation";
import Image from "next/image";
import { useTranslations } from "next-intl";

interface MerchantData {
  id: string;
  businessName: string;
  category: string;
  city: string;
  description?: string | null;
  logo?: string | null;
  _count?: { offers: number; products: number };
}

const categoryColor: Record<string, string> = {
  shop: "bg-blue-100 text-blue-700",
  artisan: "bg-purple-100 text-purple-700",
  restaurant: "bg-green-100 text-green-700",
};

export default function MerchantCard({ merchant }: { merchant: MerchantData }) {
  const { id, businessName, category, city, description, logo, _count } = merchant;
  const t = useTranslations("merchantCard");

  const categoryLabel: Record<string, string> = {
    shop: t("shop"),
    artisan: t("artisan"),
    restaurant: t("restaurant"),
  };

  return (
    <Link href={`/merchants/${id}`}>
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition-shadow cursor-pointer">
        <div className="flex items-start gap-4">
          {logo ? (
            <Image src={logo} alt={businessName} width={56} height={56} className="rounded-full object-cover" />
          ) : (
            <div className="w-14 h-14 bg-orange-100 rounded-full flex items-center justify-center text-orange-500 text-xl font-bold flex-shrink-0">
              {businessName[0]}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-gray-900 truncate">{businessName}</h3>
            <p className="text-sm text-gray-500">{city}</p>
            {description && <p className="text-sm text-gray-600 mt-1 line-clamp-2">{description}</p>}
            <div className="flex items-center gap-2 mt-2">
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${categoryColor[category] ?? "bg-gray-100 text-gray-600"}`}>
                {categoryLabel[category] ?? category}
              </span>
              {_count && (
                <span className="text-xs text-gray-400">
                  {_count.offers} {t("offers")} · {_count.products} {t("products")}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
