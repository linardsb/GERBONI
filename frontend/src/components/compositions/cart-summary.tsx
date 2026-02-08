"use client";

import { useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { IconTruck, IconX } from "@/components/icons";
import { Button } from "@/components/elements/button";
import { Button3D } from "@/components/elements/button-3d";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/elements/card";
import { Input } from "@/components/elements/input";
import { Separator } from "@/components/elements/separator";
import { Text } from "@/components/elements/text";
import { Stack } from "@/components/elements/stack";
import { Row } from "@/components/elements/row";
import { TrustBadges, PaymentMethodBadges } from "@/components/elements/trust-badges";
import { validateDiscount } from "@/lib/api";

interface CartSummaryProps {
  total: number;
  onCheckout: (discountCode?: string) => void;
}

const FREE_SHIPPING_THRESHOLD = 50;

export function CartSummary({ total, onCheckout }: CartSummaryProps) {
  const t = useTranslations("cart");
  const locale = useLocale() as "en" | "lv";
  const [promoCode, setPromoCode] = useState("");
  const [appliedCode, setAppliedCode] = useState<string | null>(null);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [promoError, setPromoError] = useState<string | null>(null);
  const [validating, setValidating] = useState(false);

  const subtotal = total;
  const finalTotal = subtotal - discountAmount;
  const isFreeShipping = finalTotal >= FREE_SHIPPING_THRESHOLD;
  const remainingForFreeShipping = FREE_SHIPPING_THRESHOLD - finalTotal;
  const shippingProgress = Math.min((finalTotal / FREE_SHIPPING_THRESHOLD) * 100, 100);

  const handleApplyPromo = async () => {
    if (!promoCode.trim()) return;
    setValidating(true);
    setPromoError(null);
    try {
      const result = await validateDiscount(promoCode.trim(), subtotal);
      if (result.valid && result.discount_amount) {
        setAppliedCode(result.code);
        setDiscountAmount(result.discount_amount);
        setPromoCode("");
      } else {
        setPromoError(result.message || t("invalidCode"));
      }
    } catch {
      setPromoError(t("invalidCode"));
    } finally {
      setValidating(false);
    }
  };

  const handleRemoveDiscount = () => {
    setAppliedCode(null);
    setDiscountAmount(0);
    setPromoError(null);
  };

  return (
    <Card data-slot="cart-summary">
      <CardHeader>
        <CardTitle>{t("orderSummary")}</CardTitle>
      </CardHeader>
      <CardContent>
        <Stack gap="group">
          {/* Subtotal */}
          <Row justify="between">
            <Text as="span" variant="body-md">{t("subtotal")}</Text>
            <Text as="span" variant="body-md" className="tabular-nums">€{subtotal.toFixed(2)}</Text>
          </Row>

          {/* Discount line */}
          {appliedCode && discountAmount > 0 && (
            <Row justify="between">
              <Row gap="element" align="center">
                <Text as="span" variant="success">
                  {t("discountLine", { code: appliedCode })}
                </Text>
                <button
                  onClick={handleRemoveDiscount}
                  className="text-muted-foreground hover:text-foreground"
                  aria-label={t("removeDiscount")}
                >
                  <IconX className="size-3.5" />
                </button>
              </Row>
              <Text as="span" variant="success" className="tabular-nums">
                -€{discountAmount.toFixed(2)}
              </Text>
            </Row>
          )}

          {/* Shipping */}
          <Row justify="between">
            <Text as="span" variant="muted">{t("shipping")}</Text>
            <Text as="span" variant={isFreeShipping ? "success" : "muted"}>
              {isFreeShipping ? t("free") : t("calculatedAtCheckout")}
            </Text>
          </Row>

          {/* Free shipping progress bar */}
          {finalTotal > 0 && (
            <div className="mt-2">
              <div className="relative h-2 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full bg-primary transition-all duration-slow w-progress"
                  style={{ "--progress": `${shippingProgress}%` } as React.CSSProperties}
                  role="progressbar"
                  aria-valuenow={shippingProgress}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-label={t("freeShippingProgress")}
                />
              </div>
              <Row gap="element" className="mt-2 justify-center">
                <IconTruck className="size-4 text-muted-foreground" aria-hidden="true" />
                <Text variant="muted-sm" align="center">
                  {isFreeShipping ? t("freeShippingUnlocked") : t("addMoreForFreeShipping", { amount: remainingForFreeShipping.toFixed(2) })}
                </Text>
              </Row>
            </div>
          )}

          {/* Promo code input */}
          {!appliedCode && (
            <div className="mt-2">
              <Row gap="element">
                <Input
                  type="text"
                  placeholder={t("promoCode")}
                  value={promoCode}
                  onChange={(e) => {
                    setPromoCode(e.target.value);
                    setPromoError(null);
                  }}
                  className="flex-1"
                  aria-label={t("promoCode")}
                />
                <Button
                  variant="outline"
                  size="sm"
                  disabled={!promoCode.trim() || validating}
                  onClick={handleApplyPromo}
                >
                  {t("apply")}
                </Button>
              </Row>
              {promoError && (
                <Text variant="error" className="mt-1 text-sm">
                  {promoError}
                </Text>
              )}
            </div>
          )}
        </Stack>
      </CardContent>
      <Separator />
      <CardFooter className="flex-col gap-4 pt-6">
        {/* Total */}
        <Row justify="between" className="w-full">
          <Text as="span" variant="heading-sm">{t("total")}</Text>
          <Text as="span" variant="heading-sm" className="tabular-nums">€{finalTotal.toFixed(2)}</Text>
        </Row>

        {/* Checkout button */}
        <Button3D size="lg" className="w-full" onClick={() => onCheckout(appliedCode || undefined)}>
          {t("proceedToCheckout")}
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
