"use client";

import { useTranslations } from "next-intl";
import { IconMail, IconTruck, IconCreditCard, IconArrowLeft } from "@/components/icons";
import { Button } from "@/components/elements/button";
import { Button3D } from "@/components/elements/button-3d";
import { Input } from "@/components/elements/input";
import { Label } from "@/components/elements/label";
import { Separator } from "@/components/elements/separator";
import { Stack } from "@/components/elements/stack";
import { Grid } from "@/components/elements/grid";
import { Row } from "@/components/elements/row";
import { Text } from "@/components/elements/text";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/elements/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/elements/select";
import type { ShippingInfo } from "@/lib/api";

interface CheckoutFormProps {
  shipping: ShippingInfo;
  onShippingChange: (shipping: ShippingInfo) => void;
  guestEmail?: string;
  onGuestEmailChange?: (email: string) => void;
  showGuestEmail?: boolean;
  total: number;
  processing: boolean;
  onSubmit: (e: React.FormEvent) => void;
  onBack: () => void;
}

export function CheckoutForm({
  shipping,
  onShippingChange,
  guestEmail = "",
  onGuestEmailChange,
  showGuestEmail = false,
  total,
  processing,
  onSubmit,
  onBack,
}: CheckoutFormProps) {
  const t = useTranslations("checkout");
  const tCart = useTranslations("cart");

  return (
    <Stack gap="section" data-slot="checkout-form">
      {/* Back button */}
      <Button variant="ghost" onClick={onBack} className="self-start">
        <IconArrowLeft className="size-4 mr-2" aria-hidden="true" />
        {t("backToCart")}
      </Button>

      <Text as="h1" variant="heading-lg">{t("title")}</Text>

      <form onSubmit={onSubmit}>
        <Grid cols={1} gap="section" className="lg:grid-cols-[1fr_400px]">
          {/* Main form content */}
          <Stack gap="section">
            {/* Contact Information */}
            {showGuestEmail && onGuestEmailChange && (
              <Card variant="muted">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-element">
                    <IconMail className="size-5" aria-hidden="true" />
                    {t("contactInfo")}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Stack gap="element">
                    <Label htmlFor="email">{t("email")}</Label>
                    <Input
                      id="email"
                      type="email"
                      required
                      value={guestEmail}
                      onChange={(e) => onGuestEmailChange(e.target.value)}
                      placeholder="your@email.com"
                    />
                  </Stack>
                </CardContent>
              </Card>
            )}

            {/* Shipping Address */}
            <Card variant="muted">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-element">
                  <IconTruck className="size-5" aria-hidden="true" />
                  {t("shippingAddress")}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Stack gap="group">
                  <Stack gap="element">
                    <Label htmlFor="name">{t("fullName")}</Label>
                    <Input
                      id="name"
                      required
                      value={shipping.name}
                      onChange={(e) => onShippingChange({ ...shipping, name: e.target.value })}
                    />
                  </Stack>

                  <Stack gap="element">
                    <Label htmlFor="address">{t("address")}</Label>
                    <Input
                      id="address"
                      required
                      value={shipping.address}
                      onChange={(e) => onShippingChange({ ...shipping, address: e.target.value })}
                    />
                  </Stack>

                  <Grid cols={2} gap="group">
                    <Stack gap="element">
                      <Label htmlFor="city">{t("city")}</Label>
                      <Input
                        id="city"
                        required
                        value={shipping.city}
                        onChange={(e) => onShippingChange({ ...shipping, city: e.target.value })}
                      />
                    </Stack>
                    <Stack gap="element">
                      <Label htmlFor="postal">{t("postalCode")}</Label>
                      <Input
                        id="postal"
                        required
                        value={shipping.postal_code}
                        onChange={(e) => onShippingChange({ ...shipping, postal_code: e.target.value })}
                      />
                    </Stack>
                  </Grid>

                  <Stack gap="element">
                    <Label htmlFor="country">{t("country")}</Label>
                    <Select
                      value={shipping.country}
                      onValueChange={(value) => onShippingChange({ ...shipping, country: value })}
                    >
                      <SelectTrigger id="country">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Latvia">
                          {t("countryLatvia")}
                        </SelectItem>
                        <SelectItem value="Lithuania">
                          {t("countryLithuania")}
                        </SelectItem>
                        <SelectItem value="Estonia">
                          {t("countryEstonia")}
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </Stack>
                </Stack>
              </CardContent>
            </Card>
          </Stack>

          {/* Order summary sidebar - sticky on desktop */}
          <div className="lg:sticky lg:top-24 lg:h-fit">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-element">
                  <IconCreditCard className="size-5" aria-hidden="true" />
                  {tCart("total")}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Stack gap="group">
                  <Separator />

                  <Row justify="between" className="pt-2">
                    <Text as="span" variant="heading-sm">{tCart("total")}</Text>
                    <Text as="span" variant="heading-sm" className="tabular-nums">
                      €{total.toFixed(2)}
                    </Text>
                  </Row>

                  <Button3D
                    type="submit"
                    size="2xl"
                    className="w-full"
                    disabled={processing}
                  >
                    {processing ? t("processing") : `${t("pay")} €${total.toFixed(2)}`}
                  </Button3D>

                  <Text variant="muted-sm" align="center" className="flex items-center justify-center gap-element">
                    <span className="size-4">🔒</span>
                    {t("securePaymentStripe")}
                  </Text>
                </Stack>
              </CardContent>
            </Card>
          </div>
        </Grid>
      </form>
    </Stack>
  );
}
