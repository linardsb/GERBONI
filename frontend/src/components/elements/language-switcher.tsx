"use client";

import { useLocale } from "next-intl";
import { usePathname, useRouter } from "@/i18n/routing";
import { useTransition } from "react";
import { Button } from "@/components/elements/button";
import { cn } from "@/lib/utils";

export function LanguageSwitcher() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();

  const nextLocale = locale === "en" ? "lv" : "en";
  const label = nextLocale.toUpperCase();

  const switchLocale = () => {
    startTransition(() => {
      router.replace(pathname, { locale: nextLocale });
    });
  };

  return (
    <Button
      data-slot="language-switcher"
      variant="ghost"
      size="sm"
      onClick={switchLocale}
      className={cn(
        "font-medium text-sm px-2",
        isPending && "opacity-50"
      )}
      aria-label={`Switch to ${nextLocale === "en" ? "English" : "Latvian"}`}
    >
      {label}
    </Button>
  );
}
