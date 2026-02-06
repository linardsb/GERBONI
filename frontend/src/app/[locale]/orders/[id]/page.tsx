"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { IconArrowLeft, IconPackage, IconMapPin, IconReceipt } from "@/components/icons";
import { Button } from "@/components/elements/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/elements/card";
import { Badge } from "@/components/elements/badge";
import { Skeleton } from "@/components/elements/skeleton";
import { Separator } from "@/components/elements/separator";
import { Container } from "@/components/elements/container";
import { Grid } from "@/components/elements/grid";
import { Row } from "@/components/elements/row";
import { Stack } from "@/components/elements/stack";
import { Text } from "@/components/elements/text";
import { OrderTimeline } from "@/components/compositions/order-timeline";
import { EmptyState } from "@/components/compositions/empty-state";
import { getOrder, type Order } from "@/lib/api";
import { useAuthStore } from "@/lib/store";

const statusVariants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  pending: "secondary",
  paid: "default",
  processing: "default",
  shipped: "default",
  delivered: "default",
  cancelled: "destructive",
  refunded: "outline",
};

export default function OrderDetailPage() {
  const t = useTranslations("order");
  const tStatus = useTranslations("orderStatus");
  const tAuth = useTranslations("auth");
  const params = useParams();
  const { token } = useAuthStore();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const orderId = Number(params.id);

  // Get locale for date formatting
  const locale = typeof window !== "undefined" ? window.location.pathname.split("/")[1] : "en";
  const dateLocale = locale === "lv" ? "lv-LV" : "en-US";

  useEffect(() => {
    if (!token || isNaN(orderId)) {
      setLoading(false);
      return;
    }

    getOrder(orderId, token)
      .then(setOrder)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [token, orderId]);

  if (!token) {
    return (
      <Container padding="md" size="md">
        <EmptyState
          icon={IconPackage}
          title={t("signInRequiredDetail")}
        >
          <Button asChild>
            <Link href="/login">{tAuth("signIn")}</Link>
          </Button>
        </EmptyState>
      </Container>
    );
  }

  if (loading) {
    return (
      <Container padding="md">
        <Stack gap="section">
          <Stack gap="group">
            <Skeleton className="h-8 w-32" />
            <Skeleton className="h-10 w-64" />
          </Stack>
          <Grid cols={2} gap="xl">
            <Stack gap="md">
              <Skeleton className="h-64 w-full" />
              <Skeleton className="h-32 w-full" />
            </Stack>
            <Skeleton className="h-96 w-full" />
          </Grid>
        </Stack>
      </Container>
    );
  }

  if (error || !order) {
    return (
      <Container padding="md" size="md">
        <EmptyState
          icon={IconPackage}
          title={t("orderNotFound")}
          description={error || t("orderNotFoundDescription")}
        >
          <Button asChild>
            <Link href="/orders">{t("viewAllOrders")}</Link>
          </Button>
        </EmptyState>
      </Container>
    );
  }

  const subtotal = order.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const shipping = order.total - subtotal;

  const formattedDate = new Date(order.created_at).toLocaleDateString(dateLocale, {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <Container padding="md">
      <Stack gap="section">
        {/* Back link */}
        <Link
          href="/orders"
          className="inline-flex items-center gap-element text-muted-foreground hover:text-foreground transition-colors"
        >
          <IconArrowLeft className="size-4" aria-hidden="true" />
          <Text variant="muted-sm">{t("backToOrders")}</Text>
        </Link>

        <Row justify="between" wrap="wrap" gap="group">
          <Stack gap="element">
            <Text as="h1" variant="heading-xl">#{order.id}</Text>
            <Text variant="muted">
              {t("placedOn", { date: formattedDate })}
            </Text>
          </Stack>
          <Badge variant={statusVariants[order.status] || "secondary"} className="text-sm px-3 py-1">
            {tStatus(order.status)}
          </Badge>
        </Row>

        <Grid cols={2} gap="xl">
          {/* Left column - Order details */}
          <Stack gap="lg">
            {/* Order Timeline */}
            <Card>
              <CardHeader>
                <CardTitle>
                  <Row gap="element">
                    <IconPackage className="size-5" aria-hidden="true" />
                    {t("orderStatus")}
                  </Row>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <OrderTimeline
                  currentStatus={order.status}
                  trackingNumber={order.tracking_number}
                  createdAt={order.created_at}
                />
              </CardContent>
            </Card>

            {/* Shipping Address */}
            {order.shipping_name && (
              <Card>
                <CardHeader>
                  <CardTitle>
                    <Row gap="element">
                      <IconMapPin className="size-5" aria-hidden="true" />
                      {t("shippingAddress")}
                    </Row>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Stack gap="xs">
                    <Text variant="body-md" className="font-medium">{order.shipping_name}</Text>
                    <Text variant="muted">{order.shipping_address}</Text>
                    <Text variant="muted">
                      {order.shipping_city}, {order.shipping_postal_code}
                    </Text>
                    <Text variant="muted">{order.shipping_country}</Text>
                  </Stack>
                </CardContent>
              </Card>
            )}
          </Stack>

          {/* Right column - Order items & summary */}
          <Stack gap="lg">
            {/* Order Items */}
            <Card>
              <CardHeader>
                <CardTitle>
                  <Row gap="element">
                    <IconReceipt className="size-5" aria-hidden="true" />
                    {t("orderItems", { count: order.items.length })}
                  </Row>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Stack gap="md">
                  {order.items.map((item) => (
                    <Row key={item.id} gap="group">
                      <div className="size-16 bg-muted rounded flex items-center justify-center p-2 flex-shrink-0">
                        <Image
                          src={`/coats/${item.variant.product_image}`}
                          alt={item.variant.product_city}
                          width={48}
                          height={48}
                          className="h-full w-full object-contain"
                        />
                      </div>
                      <Stack gap="none" className="flex-1 min-w-0">
                        <Text variant="body-md" className="font-medium">
                          {item.variant.product_city}
                        </Text>
                        <Text variant="muted-sm">
                          {item.variant.color} / {item.variant.size}
                        </Text>
                        <Text variant="muted-sm">
                          {t("quantity")}: {item.quantity}
                        </Text>
                      </Stack>
                      <Text variant="body-md" className="font-medium">
                        €{(Number(item.price) * item.quantity).toFixed(2)}
                      </Text>
                    </Row>
                  ))}

                  <Separator />

                  {/* Order Summary */}
                  <Stack gap="element">
                    <Row justify="between">
                      <Text variant="muted">{t("subtotal")}</Text>
                      <Text variant="body-md">€{subtotal.toFixed(2)}</Text>
                    </Row>
                    <Row justify="between">
                      <Text variant="muted">{t("shipping")}</Text>
                      <Text variant="body-md">
                        {shipping > 0 ? `€${shipping.toFixed(2)}` : t("free")}
                      </Text>
                    </Row>
                    <Separator />
                    <Row justify="between">
                      <Text variant="heading-sm">{t("total")}</Text>
                      <Text variant="heading-sm">€{Number(order.total).toFixed(2)}</Text>
                    </Row>
                  </Stack>
                </Stack>
              </CardContent>
            </Card>

            {/* Help Card */}
            <Card className="bg-muted/50">
              <CardContent className="pt-6">
                <Stack gap="group" align="center">
                  <Text variant="heading-xs">{t("needHelpTitle")}</Text>
                  <Text variant="muted-sm" align="center">
                    {t("needHelpDescription")}
                  </Text>
                  <Button variant="outline" asChild>
                    <Link href="/contact">{t("contactSupport")}</Link>
                  </Button>
                </Stack>
              </CardContent>
            </Card>
          </Stack>
        </Grid>
      </Stack>
    </Container>
  );
}
