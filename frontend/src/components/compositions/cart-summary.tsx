"use client";

import { useState } from "react";
import { IconLock, IconTruck } from "@/components/icons";
import { Button } from "@/components/elements/button";
import { Button3D } from "@/components/elements/button-3d";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/elements/card";
import { Input } from "@/components/elements/input";
import { Separator } from "@/components/elements/separator";
import { Text } from "@/components/elements/text";
import { Stack } from "@/components/elements/stack";
import { Row } from "@/components/elements/row";
import { TrustBadges, PaymentMethodBadges } from "@/components/elements/trust-badges";

interface CartSummaryProps {
  total: number;
  onCheckout: () => void;
  locale?: "en" | "lv";
}

const FREE_SHIPPING_THRESHOLD = 50;

export function CartSummary({ total, onCheckout, locale = "en" }: CartSummaryProps) {
  const [promoCode, setPromoCode] = useState("");
  const isFreeShipping = total >= FREE_SHIPPING_THRESHOLD;
  const remainingForFreeShipping = FREE_SHIPPING_THRESHOLD - total;
  const shippingProgress = Math.min((total / FREE_SHIPPING_THRESHOLD) * 100, 100);

  const t = {
    orderSummary: locale === "lv" ? "Pasūtījuma kopsavilkums" : "Order Summary",
    subtotal: locale === "lv" ? "Starpsumma" : "Subtotal",
    shipping: locale === "lv" ? "Piegāde" : "Shipping",
    free: locale === "lv" ? "BEZMAKSAS" : "FREE",
    calculatedAtCheckout: locale === "lv" ? "Aprēķināta pie kases" : "Calculated at checkout",
    addMoreForFreeShipping: locale === "lv"
      ? `Pievieno vēl €${remainingForFreeShipping.toFixed(2)} bezmaksas piegādei`
      : `Add €${remainingForFreeShipping.toFixed(2)} more for free shipping`,
    freeShippingUnlocked: locale === "lv"
      ? "Bezmaksas piegāde atbloķēta!"
      : "Free shipping unlocked!",
    promoCode: locale === "lv" ? "Promo kods" : "Promo code",
    apply: locale === "lv" ? "Pielietot" : "Apply",
    total: locale === "lv" ? "Kopā" : "Total",
    proceedToCheckout: locale === "lv" ? "Turpināt uz kasi" : "Proceed to Checkout",
  };

  return (
    <Card data-slot="cart-summary">
      <CardHeader>
        <CardTitle>{t.orderSummary}</CardTitle>
      </CardHeader>
      <CardContent>
        <Stack gap="group">
          {/* Subtotal */}
          <Row justify="between">
            <Text as="span" variant="body-md">{t.subtotal}</Text>
            <Text as="span" variant="body-md" className="tabular-nums">€{total.toFixed(2)}</Text>
          </Row>

          {/* Shipping */}
          <Row justify="between">
            <Text as="span" variant="muted">{t.shipping}</Text>
            <Text as="span" variant={isFreeShipping ? "success" : "muted"}>
              {isFreeShipping ? t.free : t.calculatedAtCheckout}
            </Text>
          </Row>

          {/* Free shipping progress bar */}
          {total > 0 && (
            <div className="mt-2">
              <div className="relative h-2 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full bg-primary transition-all duration-slow w-progress"
                  style={{ "--progress": `${shippingProgress}%` } as React.CSSProperties}
                  role="progressbar"
                  aria-valuenow={shippingProgress}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-label={locale === "lv" ? "Progress līdz bezmaksas piegādei" : "Progress to free shipping"}
                />
              </div>
              <Row gap="element" className="mt-2 justify-center">
                <IconTruck className="size-4 text-muted-foreground" aria-hidden="true" />
                <Text variant="muted-sm" align="center">
                  {isFreeShipping ? t.freeShippingUnlocked : t.addMoreForFreeShipping}
                </Text>
              </Row>
            </div>
          )}

          {/* Promo code input */}
          <div className="mt-2">
            <Row gap="element">
              <Input
                type="text"
                placeholder={t.promoCode}
                value={promoCode}
                onChange={(e) => setPromoCode(e.target.value)}
                className="flex-1"
                aria-label={t.promoCode}
              />
              <Button
                variant="outline"
                size="sm"
                disabled={!promoCode.trim()}
                onClick={() => {
                  // TODO: Implement promo code validation
                }}
              >
                {t.apply}
              </Button>
            </Row>
          </div>
        </Stack>
      </CardContent>
      <Separator />
      <CardFooter className="flex-col gap-4 pt-6">
        {/* Total */}
        <Row justify="between" className="w-full">
          <Text as="span" variant="heading-sm">{t.total}</Text>
          <Text as="span" variant="heading-sm" className="tabular-nums">€{total.toFixed(2)}</Text>
        </Row>

        {/* Checkout button */}
        <Button3D size="lg" className="w-full" onClick={onCheckout}>
          {t.proceedToCheckout}
        </Button3D>

        {/* Payment methods */}
        <PaymentMethodBadges className="mt-2" />

        <Separator className="my-2" />

        {/* Trust badges */}
        <TrustBadges variant="compact" locale={locale} />
      </CardFooter>
    </Card>
  );
}
