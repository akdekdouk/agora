import dynamic from "next/dynamic";
import { getTranslations } from "next-intl/server";

const MerchantsMap = dynamic(() => import("@/components/MerchantsMap"), { ssr: false });

export default async function MapPage() {
  const t = await getTranslations("map");
  return (
    <div className="flex flex-col h-[calc(100vh-4rem)]">
      <div className="px-4 py-3 bg-white border-b border-gray-200 flex items-center gap-3">
        <h1 className="text-lg font-bold text-gray-900">{t("title")}</h1>
        <span className="text-xs text-gray-400">{t("subtitle")}</span>
      </div>
      <div className="flex-1">
        <MerchantsMap />
      </div>
    </div>
  );
}
