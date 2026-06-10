export interface Banner {
  key: string;
  season: "default" | "summer" | "autumn" | "spring" | "winter" | "blackfriday" | "easter";
  locale: string; // "en" | "fr" | "it" | "ar" | "es" | "tr" | "all"
  label: string;
}

export const BANNERS: Banner[] = [
  // Default / Generic
  { key: "banner-default-en", season: "default", locale: "en", label: "Announcement (EN)" },
  { key: "banner-default-fr", season: "default", locale: "fr", label: "Annonce (FR)" },
  { key: "banner-default-it", season: "default", locale: "it", label: "Annuncio (IT)" },
  { key: "banner-default-ar", season: "default", locale: "ar", label: "إعلان (AR)" },
  { key: "banner-default-es", season: "default", locale: "es", label: "Anuncio (ES)" },
  { key: "banner-default-tr", season: "default", locale: "tr", label: "Duyuru (TR)" },

  // Summer
  { key: "banner-summer-en", season: "summer", locale: "en", label: "Summer (EN)" },
  { key: "banner-summer-fr", season: "summer", locale: "fr", label: "Été (FR)" },
  { key: "banner-summer-it", season: "summer", locale: "it", label: "Estate (IT)" },
  { key: "banner-summer-ar", season: "summer", locale: "ar", label: "الصيف (AR)" },
  { key: "banner-summer-es", season: "summer", locale: "es", label: "Verano (ES)" },
  { key: "banner-summer-tr", season: "summer", locale: "tr", label: "Yaz (TR)" },

  // Autumn
  { key: "banner-autumn-en", season: "autumn", locale: "en", label: "Autumn (EN)" },
  { key: "banner-autumn-fr", season: "autumn", locale: "fr", label: "Automne (FR)" },
  { key: "banner-autumn-it", season: "autumn", locale: "it", label: "Autunno (IT)" },
  { key: "banner-autumn-ar", season: "autumn", locale: "ar", label: "الخريف (AR)" },
  { key: "banner-autumn-es", season: "autumn", locale: "es", label: "Otoño (ES)" },
  { key: "banner-autumn-tr", season: "autumn", locale: "tr", label: "Sonbahar (TR)" },

  // Spring
  { key: "banner-spring-en", season: "spring", locale: "en", label: "Spring (EN)" },
  { key: "banner-spring-fr", season: "spring", locale: "fr", label: "Printemps (FR)" },
  { key: "banner-spring-it", season: "spring", locale: "it", label: "Primavera (IT)" },
  { key: "banner-spring-ar", season: "spring", locale: "ar", label: "الربيع (AR)" },
  { key: "banner-spring-es", season: "spring", locale: "es", label: "Primavera (ES)" },
  { key: "banner-spring-tr", season: "spring", locale: "tr", label: "Bahar (TR)" },

  // Christmas
  { key: "banner-christmas-en", season: "winter", locale: "en", label: "Christmas (EN)" },
  { key: "banner-christmas-it", season: "winter", locale: "it", label: "Natale (IT)" },
  { key: "banner-christmas-ar", season: "winter", locale: "ar", label: "عيد الميلاد (AR)" },
  { key: "banner-christmas-es", season: "winter", locale: "es", label: "Navidad (ES)" },
  { key: "banner-christmas-tr", season: "winter", locale: "tr", label: "Noel (TR)" },

  // Easter
  { key: "banner-easter-en", season: "easter", locale: "en", label: "Easter (EN)" },
  { key: "banner-easter-fr", season: "easter", locale: "fr", label: "Pâques (FR)" },
  { key: "banner-easter-it", season: "easter", locale: "it", label: "Pasqua (IT)" },
  { key: "banner-easter-ar", season: "easter", locale: "ar", label: "عيد الفصح (AR)" },
  { key: "banner-easter-es", season: "easter", locale: "es", label: "Pascua (ES)" },
  { key: "banner-easter-tr", season: "easter", locale: "tr", label: "Paskalya (TR)" },

  // Black Friday
  { key: "banner-blackfriday-en", season: "blackfriday", locale: "en", label: "Black Friday (EN)" },
  { key: "banner-blackfriday-fr", season: "blackfriday", locale: "fr", label: "Black Friday (FR)" },
  { key: "banner-blackfriday-it", season: "blackfriday", locale: "it", label: "Black Friday (IT)" },
  { key: "banner-blackfriday-es", season: "blackfriday", locale: "es", label: "Black Friday (ES)" },
  { key: "banner-blackfriday-tr", season: "blackfriday", locale: "tr", label: "Black Friday (TR)" },
];

export const SEASON_LABELS: Record<Banner["season"], string> = {
  default: "🔔 Général",
  summer: "☀️ Été",
  autumn: "🍂 Automne",
  spring: "🌸 Printemps",
  winter: "🎄 Noël",
  blackfriday: "🖤 Black Friday",
  easter: "🐣 Pâques",
};

export function getBannerUrl(bannerKey: string): string {
  return `/banners/${bannerKey}.png`;
}
