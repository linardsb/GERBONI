"use client";

import { useState, useEffect, useCallback } from "react";
import { Link, usePathname } from "@/i18n/routing";
import { useTranslations } from "next-intl";
import { IconX, IconShoppingCart, IconPercentage } from "@/components/icons";
import { Button3D } from "@/components/elements/button-3d";
import { Text } from "@/components/elements/text";
import { Stack } from "@/components/elements/stack";
import { useExitIntent } from "@/hooks/use-exit-intent";

const STORAGE_KEY = "gerboni_exit_intent_dismissed";
const NEWSLETTER_STORAGE_KEY = "gerboni_newsletter_dismissed";
const COOLDOWN_HOURS = 24;
const DISCOUNT_CODE = "DONTGO10";

export function ExitIntentOffer() {
  const pathname = usePathname();
  const t = useTranslations("exitIntent");
  const [isOpen, setIsOpen] = useState(false);
  const [canShow, setCanShow] = useState(false);

  // Check if we should show the modal
  useEffect(() => {
    // Don't show on checkout pages
    if (pathname?.includes("/checkout") || pathname?.includes("/cart")) {
      setCanShow(false);
      return;
    }

    // Check if newsletter was shown this session
    const newsletterShownThisSession = sessionStorage.getItem("newsletter_shown_this_session");
    if (newsletterShownThisSession) {
      setCanShow(false);
      return;
    }

    // Check cooldown
    const dismissed = localStorage.getItem(STORAGE_KEY);
    if (dismissed) {
      const dismissedDate = new Date(dismissed);
      const hoursSinceDismissed = (Date.now() - dismissedDate.getTime()) / (1000 * 60 * 60);
      if (hoursSinceDismissed < COOLDOWN_HOURS) {
        setCanShow(false);
        return;
      }
    }

    setCanShow(true);
  }, [pathname]);

  const handleExitIntent = useCallback(() => {
    if (canShow) {
      setIsOpen(true);
    }
  }, [canShow]);

  useExitIntent({
    threshold: 10,
    delay: 2000, // Wait 2 seconds before enabling
    onExitIntent: handleExitIntent,
  });

  const handleClose = () => {
    setIsOpen(false);
    localStorage.setItem(STORAGE_KEY, new Date().toISOString());
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(DISCOUNT_CODE);
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) handleClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="exit-intent-title"
    >
      <div className="relative w-full max-w-md bg-background rounded-lg shadow-xl animate-in zoom-in-95 duration-200">
        {/* Close button */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors"
          aria-label={t("close")}
        >
          <IconX className="h-5 w-5" />
        </button>

        <div className="p-6 sm:p-8">
          <Stack gap="section" className="items-center text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
              <IconPercentage className="h-8 w-8 text-primary" />
            </div>

            <Stack gap="group" align="center">
              <Text as="h2" id="exit-intent-title" variant="heading-lg">
                {t("title")}
              </Text>
              <Text variant="muted">
                {t("description")}
              </Text>
            </Stack>

            {/* Discount Code */}
            <div className="w-full">
              <button
                onClick={handleCopyCode}
                className="w-full p-4 bg-muted rounded-lg border-2 border-dashed border-primary/50 hover:border-primary transition-colors group"
              >
                <Text variant="heading-md" className="font-mono tracking-wider">
                  {DISCOUNT_CODE}
                </Text>
                <Text variant="muted-sm" className="mt-1 group-hover:text-foreground transition-colors">
                  {t("clickToCopy")}
                </Text>
              </button>
            </div>

            {/* CTA Buttons */}
            <Stack gap="group" className="w-full">
              <Button3D size="lg" className="w-full" href="/products" onClick={handleClose}>
                {t("continueShopping")}
              </Button3D>
              <button
                onClick={handleClose}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                {t("noThanks")}
              </button>
            </Stack>
          </Stack>
        </div>
      </div>
    </div>
  );
}
