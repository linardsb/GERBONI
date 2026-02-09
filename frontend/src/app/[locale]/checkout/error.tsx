"use client";

import { useEffect } from "react";
import { useTranslations } from "next-intl";
import { Stack } from "@/components/elements/stack";
import { Text } from "@/components/elements/text";
import { Button } from "@/components/elements/button";
import { IconAlertTriangle } from "@tabler/icons-react";

export default function CheckoutError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const t = useTranslations("checkout");
  const tc = useTranslations("common");

  useEffect(() => {
    console.error("[CheckoutError]", error);
  }, [error]);

  return (
    <Stack data-slot="error-boundary" gap="section" align="center" className="py-page">
      <div className="rounded-full bg-destructive/10 p-6">
        <IconAlertTriangle className="size-12 text-destructive" aria-hidden="true" />
      </div>
      <Stack gap="element" align="center">
        <Text variant="heading-sm">{t("error")}</Text>
        <Text variant="muted" align="center">
          {t("errorDescription")}
        </Text>
      </Stack>
      <Button onClick={reset}>{tc("tryAgain")}</Button>
    </Stack>
  );
}
