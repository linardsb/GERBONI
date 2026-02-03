"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { IconPackage } from "@tabler/icons-react";
import { Button } from "@/components/elements/button";
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

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

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
        <Skeleton className="mx-auto h-20 w-20" />
        <Skeleton className="mx-auto mt-6 h-10 w-64" />
      </Container>
    );
  }

  return (
    <Container padding="md" size="sm">
      <Stack gap="section" align="center">
        <Stack gap="group" align="center">
          <StatusIcon variant="success" size="lg" />
          <Text as="h1" variant="heading-lg">
            Order Confirmed!
          </Text>
          <Text variant="muted" align="center">
            Thank you for your order. We&apos;ll send you a confirmation email shortly.
          </Text>
        </Stack>

        {order && (
          <Card className="w-full text-left">
            <CardHeader>
              <CardTitle>
                <Row gap="element">
                  <IconPackage className="size-5" aria-hidden="true" />
                  Order #{order.id}
                </Row>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Stack gap="md">
                <Text variant="muted-sm">
                  Status: <Text as="span" variant="body-sm" className="font-medium">{order.status}</Text>
                </Text>

                <Separator />

                <Stack gap="sm">
                  {order.items.map((item) => (
                    <Row key={item.id} justify="between">
                      <Text variant="body-sm">
                        {item.variant.product_city} ({item.variant.color}, {item.variant.size}) ×{item.quantity}
                      </Text>
                      <Text variant="body-sm">€{(Number(item.price) * item.quantity).toFixed(2)}</Text>
                    </Row>
                  ))}
                </Stack>

                <Separator />

                <Row justify="between">
                  <Text as="span" variant="body-md" className="font-semibold">Total</Text>
                  <Text as="span" variant="body-md" className="font-semibold">€{Number(order.total).toFixed(2)}</Text>
                </Row>

                {order.shipping_name && (
                  <>
                    <Separator />
                    <Stack gap="xs">
                      <Text as="p" variant="body-sm" className="font-medium">Shipping to:</Text>
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

        <Row gap="group" wrap="wrap" justify="center">
          <Button asChild>
            <Link href="/products">Continue Shopping</Link>
          </Button>
          {token && (
            <Button variant="outline" asChild>
              <Link href="/orders">View Orders</Link>
            </Button>
          )}
        </Row>
      </Stack>
    </Container>
  );
}

function LoadingFallback() {
  return (
    <Container padding="md" size="sm" className="text-center">
      <Skeleton className="mx-auto h-20 w-20" />
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
