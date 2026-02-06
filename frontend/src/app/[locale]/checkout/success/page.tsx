"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useLocale } from "next-intl";
import {
  IconPackage,
  IconMail,
  IconTruck,
  IconShoppingBag,
  IconFileText,
} from "@/components/icons";
import { Button } from "@/components/elements/button";
import { Button3D } from "@/components/elements/button-3d";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/elements/card";
import { Separator } from "@/components/elements/separator";
import { Skeleton } from "@/components/elements/skeleton";
import { Container } from "@/components/elements/container";
import { Row } from "@/components/elements/row";
import { Stack } from "@/components/elements/stack";
import { Text } from "@/components/elements/text";
import { StatusIcon } from "@/components/elements/status-icon";
import { getOrder, type Order } from "@/lib/api";
import { useAuthStore, useCartStore } from "@/lib/store";

function SuccessContent() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get("order_id");
  const { token } = useAuthStore();
  const { clearCart } = useCartStore();
  const locale = useLocale() as "en" | "lv";

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  const t = {
    orderConfirmed: locale === "lv" ? "Pasūtījums apstiprināts!" : "Order Confirmed!",
    thankYou: locale === "lv"
      ? "Paldies par pasūtījumu. Mēs drīzumā nosūtīsim apstiprinājuma e-pastu."
      : "Thank you for your order. We'll send you a confirmation email shortly.",
    order: locale === "lv" ? "Pasūtījums" : "Order",
    status: locale === "lv" ? "Statuss" : "Status",
    total: locale === "lv" ? "Kopā" : "Total",
    shippingTo: locale === "lv" ? "Piegāde uz" : "Shipping to",
    whatsNext: locale === "lv" ? "Kas notiks tālāk?" : "What's Next?",
    step1Title: locale === "lv" ? "E-pasta apstiprinājums" : "Email Confirmation",
    step1Desc: locale === "lv"
      ? "Saņemsi pasūtījuma apstiprinājumu savā e-pastā"
      : "You'll receive an order confirmation in your inbox",
    step2Title: locale === "lv" ? "Sagatavošana nosūtīšanai" : "Preparing for Shipment",
    step2Desc: locale === "lv"
      ? "Mēs rūpīgi iepakosim tavus kreklus"
      : "We'll carefully package your t-shirts",
    step3Title: locale === "lv" ? "Piegāde" : "Delivery",
    step3Desc: locale === "lv"
      ? "Tavs pasūtījums tiks piegādāts 3-5 darba dienu laikā"
      : "Your order will arrive within 3-5 business days",
    continueShopping: locale === "lv" ? "Turpināt iepirkšanos" : "Continue Shopping",
    viewOrders: locale === "lv" ? "Skatīt pasūtījumus" : "View Orders",
  };

  useEffect(() => {
    clearCart();

    if (orderId) {
      getOrder(Number(orderId), token || undefined)
        .then(setOrder)
        .catch(console.error)
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [orderId, token, clearCart]);

  if (loading) {
    return (
      <Container padding="md" size="sm" className="text-center">
        <Skeleton className="mx-auto size-20" />
        <Skeleton className="mx-auto mt-6 h-10 w-64" />
      </Container>
    );
  }

  return (
    <Container padding="md" size="sm">
      <Stack gap="section" align="center">
        {/* Success header with animation */}
        <Stack gap="group" align="center" className="animate-in zoom-in-50 duration-slow">
          <StatusIcon variant="success" size="lg" />
          <Text as="h1" variant="heading-lg" align="center">
            {t.orderConfirmed}
          </Text>
          <Text variant="muted" align="center">
            {t.thankYou}
          </Text>
        </Stack>

        {/* Order details */}
        {order && (
          <Card className="w-full text-left animate-in fade-in slide-in-from-bottom-4 duration-normal animation-delay-200 animation-fill-backwards">
            <CardHeader>
              <CardTitle>
                <Row gap="element">
                  <IconPackage className="size-5" aria-hidden="true" />
                  {t.order} #{order.id}
                </Row>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Stack gap="group">
                <Row justify="between">
                  <Text variant="muted-sm">{t.status}</Text>
                  <Text variant="body-sm" className="font-medium capitalize">
                    {order.status}
                  </Text>
                </Row>

                <Separator />

                <Stack gap="sm">
                  {order.items.map((item) => (
                    <Row key={item.id} justify="between">
                      <Text variant="body-sm">
                        {item.variant.product_city} ({item.variant.color}, {item.variant.size}) ×{item.quantity}
                      </Text>
                      <Text variant="body-sm" className="tabular-nums">
                        €{(Number(item.price) * item.quantity).toFixed(2)}
                      </Text>
                    </Row>
                  ))}
                </Stack>

                <Separator />

                <Row justify="between">
                  <Text as="span" variant="body-md" className="font-semibold">{t.total}</Text>
                  <Text as="span" variant="body-md" className="font-semibold tabular-nums">
                    €{Number(order.total).toFixed(2)}
                  </Text>
                </Row>

                {order.shipping_name && (
                  <>
                    <Separator />
                    <Stack gap="xs">
                      <Text as="p" variant="body-sm" className="font-medium">{t.shippingTo}:</Text>
                      <Text variant="muted-sm">{order.shipping_name}</Text>
                      <Text variant="muted-sm">{order.shipping_address}</Text>
                      <Text variant="muted-sm">
                        {order.shipping_city}, {order.shipping_postal_code}
                      </Text>
                      <Text variant="muted-sm">{order.shipping_country}</Text>
                    </Stack>
                  </>
                )}
              </Stack>
            </CardContent>
          </Card>
        )}

        {/* What's Next card */}
        <Card className="w-full animate-in fade-in slide-in-from-bottom-4 duration-normal animation-delay-400 animation-fill-backwards">
          <CardHeader>
            <CardTitle>{t.whatsNext}</CardTitle>
          </CardHeader>
          <CardContent>
            <Stack gap="group">
              {/* Step 1 */}
              <Row gap="group" className="items-start">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <IconMail className="size-5" aria-hidden="true" />
                </div>
                <Stack gap="none">
                  <Text variant="body-md" className="font-medium">{t.step1Title}</Text>
                  <Text variant="muted-sm">{t.step1Desc}</Text>
                </Stack>
              </Row>

              {/* Step 2 */}
              <Row gap="group" className="items-start">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <IconPackage className="size-5" aria-hidden="true" />
                </div>
                <Stack gap="none">
                  <Text variant="body-md" className="font-medium">{t.step2Title}</Text>
                  <Text variant="muted-sm">{t.step2Desc}</Text>
                </Stack>
              </Row>

              {/* Step 3 */}
              <Row gap="group" className="items-start">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <IconTruck className="size-5" aria-hidden="true" />
                </div>
                <Stack gap="none">
                  <Text variant="body-md" className="font-medium">{t.step3Title}</Text>
                  <Text variant="muted-sm">{t.step3Desc}</Text>
                </Stack>
              </Row>
            </Stack>
          </CardContent>
        </Card>

        {/* Action buttons */}
        <Row gap="group" wrap="wrap" justify="center" className="animate-in fade-in duration-normal animation-delay-600 animation-fill-backwards">
          <Button3D href="/products">
            {t.continueShopping}
          </Button3D>
          {token && (
            <Button3D variant="outline" href="/orders">
              {t.viewOrders}
            </Button3D>
          )}
        </Row>
      </Stack>
    </Container>
  );
}

function LoadingFallback() {
  return (
    <Container padding="md" size="sm" className="text-center">
      <Skeleton className="mx-auto size-20" />
      <Skeleton className="mx-auto mt-6 h-10 w-64" />
    </Container>
  );
}

export default function CheckoutSuccessPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <SuccessContent />
    </Suspense>
  );
}
