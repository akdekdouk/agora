import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  locales: ["en", "fr", "it", "ar", "tr", "es"],
  defaultLocale: "en",
});
