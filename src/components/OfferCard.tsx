import Image from "next/image";

interface Props {
  title: string;
  description: string;
  photo?: string | null;
  discount: number;
  validFrom: string | Date;
  validTo: string | Date;
  merchantName?: string;
  onSave?: () => void;
  isSaved?: boolean;
}

export default function OfferCard({ title, description, photo, discount, validFrom, validTo, merchantName, onSave, isSaved }: Props) {
  const from = new Date(validFrom).toLocaleDateString();
  const to = new Date(validTo).toLocaleDateString();

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      {photo && (
        <div className="relative h-40 w-full">
          <Image src={photo} alt={title} fill className="object-cover" />
        </div>
      )}
      <div className="p-4">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-semibold text-gray-900">{title}</h3>
          <div className="flex items-center gap-1 flex-shrink-0">
            <span className="bg-orange-500 text-white text-sm font-bold px-2 py-0.5 rounded-full">
              -{discount}%
            </span>
            {onSave && (
              <button
                onClick={(e) => { e.stopPropagation(); onSave(); }}
                className={`p-1 rounded-full transition ${isSaved ? "text-orange-500" : "text-gray-300 hover:text-orange-400"}`}
                title={isSaved ? "Unsave" : "Save"}
              >
                🔖
              </button>
            )}
          </div>
        </div>
        {merchantName && <p className="text-xs text-orange-500 font-medium mt-0.5">{merchantName}</p>}
        <p className="text-sm text-gray-600 mt-1 line-clamp-2">{description}</p>
        <p className="text-xs text-gray-400 mt-2">{from} → {to}</p>
      </div>
    </div>
  );
}
