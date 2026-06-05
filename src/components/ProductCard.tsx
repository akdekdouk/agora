import Image from "next/image";

interface Props {
  name: string;
  description: string;
  images: string;
  originalPrice: number;
  discountedPrice: number;
  category?: string | null;
  merchantName?: string;
  merchantCity?: string;
  onSave?: () => void;
  isSaved?: boolean;
}

export default function ProductCard({ name, description, images, originalPrice, discountedPrice, category, merchantName, merchantCity, onSave, isSaved }: Props) {
  let imageList: string[] = [];
  try { imageList = JSON.parse(images); } catch { /* empty */ }
  const firstImage = imageList[0];
  const savings = Math.round((1 - discountedPrice / originalPrice) * 100);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      {firstImage ? (
        <div className="relative h-40 w-full">
          <Image src={firstImage} alt={name} fill className="object-cover" />
        </div>
      ) : (
        <div className="h-40 bg-gray-100 flex items-center justify-center text-gray-400 text-4xl">🛍️</div>
      )}
      <div className="p-4">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-semibold text-gray-900">{name}</h3>
          {onSave && (
            <button
              onClick={(e) => { e.stopPropagation(); onSave(); }}
              className={`p-1 rounded-full transition flex-shrink-0 ${isSaved ? "text-orange-500" : "text-gray-300 hover:text-orange-400"}`}
              title={isSaved ? "Unsave" : "Save"}
            >
              🔖
            </button>
          )}
        </div>
        {merchantName && (
          <p className="text-xs text-orange-500 font-medium">{merchantName}{merchantCity && `, ${merchantCity}`}</p>
        )}
        <p className="text-sm text-gray-600 mt-1 line-clamp-2">{description}</p>
        {category && <p className="text-xs text-gray-400 mt-1">{category}</p>}
        <div className="flex items-center gap-2 mt-2">
          <span className="text-orange-600 font-bold">€{discountedPrice.toFixed(2)}</span>
          <span className="text-gray-400 line-through text-sm">€{originalPrice.toFixed(2)}</span>
          <span className="bg-orange-100 text-orange-700 text-xs font-bold px-1.5 py-0.5 rounded">-{savings}%</span>
        </div>
      </div>
    </div>
  );
}
