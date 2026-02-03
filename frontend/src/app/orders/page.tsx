"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { IconPackage, IconTruck } from "@tabler/icons-react";
import { Button } from "@/components/elements/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/elements/card";
import { Badge } from "@/components/elements/badge";
import { Skeleton } from "@/components/elements/skeleton";
import { Separator } from "@/components/elements/separator";
import { Container } from "@/components/elements/container";
import { Row } from "@/components/elements/row";
import { Stack } from "@/components/elements/stack";
import { Text } from "@/components/elements/text";
import { PageHeader } from "@/components/compositions/page-header";
import { EmptyState } from "@/components/compositions/empty-state";
import { getOrders, type Order } from "@/lib/api";
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

export default function OrdersPage() {
  const { token } = useAuthStore();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      setLoading(false);
      return;
    }

    getOrders(token)
      .then(setOrders)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [token]);

  if (!token) {
    return (
      <Container padding="md" size="md">
        <EmptyState
          icon={IconPackage}
          title="Please sign in to view orders"
        >
          <Button asChild>
            <Link href="/login">Sign In</Link>
          </Button>
        </EmptyState>
      </Container>
    );
  }

  if (loading) {
    return (
      <Container padding="md" size="md">
        <Stack gap="section">
          <Skeleton className="h-10 w-48" />
          <Stack gap="md">
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-32 w-full" />
          </Stack>
        </Stack>
      </Container>
    );
  }

  if (error) {
    return (
      <Container padding="md" size="md">
        <Text variant="error" align="center">{error}</Text>
      </Container>
    );
  }

  if (orders.length === 0) {
    return (
      <Container padding="md" size="md">
        <EmptyState
          icon={IconPackage}
          title="No orders yet"
          description="Start shopping to see your orders here."
        >
          <Button asChild>
            <Link href="/products">Browse Products</Link>
          </Button>
        </EmptyState>
      </Container>
    );
  }

  return (
    <Container padding="md" size="md">
      <PageHeader
        title="Your Orders"
        description="Track and manage your orders"
      />

      <Stack gap="md">
        {orders.map((order) => (
          <Card key={order.id}>
            <CardHeader>
              <Row justify="between" align="start">
                <Stack gap="xs">
                  <CardTitle className="text-base">Order #{order.id}</CardTitle>
                  <Text variant="muted-sm">
                    {new Date(order.created_at).toLocaleDateString()}
                  </Text>
                </Stack>
                <Badge variant={statusVariants[order.status] || "secondary"}>
                  {order.status}
                </Badge>
              </Row>
            </CardHeader>
            <CardContent>
              <Stack gap="md">
                {/* Items */}
                <Stack gap="sm">
                  {order.items.map((item) => (
                    <Row key={item.id} gap="group">
                      <div className="size-12 bg-muted flex items-center justify-center p-1">
                        <Image
                          src={`/coats/${item.variant.product_image}`}
                          alt={item.variant.product_city}
                          width={40}
                          height={40}
                          className="h-full w-full object-contain"
                        />
                      </div>
                      <Stack gap="none" className="flex-1 min-w-0">
                        <Text as="span" variant="body-sm" className="font-medium truncate block">
                          {item.variant.product_city}
                        </Text>
                        <Text variant="muted-sm">
                          {item.variant.color} / {item.variant.size} × {item.quantity}
                        </Text>
                      </Stack>
                      <Text as="span" variant="body-sm" className="font-medium">
                        €{(Number(item.price) * item.quantity).toFixed(2)}
                      </Text>
                    </Row>
                  ))}
                </Stack>

                {/* Total & Tracking */}
                <Separator />
                <Row justify="between">
                  <Row gap="element">
                    {order.tracking_number && (
                      <>
                        <IconTruck className="size-4 text-muted-foreground" aria-hidden="true" />
                        <Text variant="muted-sm">Tracking: {order.tracking_number}</Text>
                      </>
                    )}
                  </Row>
                  <Row gap="group">
                    <Text as="span" variant="body-md" className="font-semibold">
                      Total: €{Number(order.total).toFixed(2)}
                    </Text>
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/orders/${order.id}`}>View Details</Link>
                    </Button>
                  </Row>
                </Row>
              </Stack>
            </CardContent>
          </Card>
        ))}
      </Stack>
    </Container>
  );
}
