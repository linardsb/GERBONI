import { defineRouting } from "next-intl/routing";
import { createNavigation } from "next-intl/navigation";

export const routing = defineRouting({
  // List of supported locales
  locales: ["en", "lv"],

  // Default locale when no locale prefix is present
  defaultLocale: "en",

  // Locale prefix strategy - always show locale in URL
  localePrefix: "always",
});

// Lightweight wrappers around Next.js navigation APIs
// that handle locale automatically
export const { Link, redirect, usePathname, useRouter, getPathname } =
  createNavigation(routing);
