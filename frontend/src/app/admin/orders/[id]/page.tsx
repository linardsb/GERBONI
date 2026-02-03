"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { IconChevronLeft, IconTruck } from "@tabler/icons-react";
import { toast } from "sonner";
import { Button } from "@/components/elements/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/elements/card";
import { Input } from "@/components/elements/input";
import { Label } from "@/components/elements/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/elements/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/elements/dialog";
import { Skeleton } from "@/components/elements/skeleton";
import { Separator } from "@/components/elements/separator";
import { Container } from "@/components/elements/container";
import { Grid } from "@/components/elements/grid";
import { Row } from "@/components/elements/row";
import { Stack } from "@/components/elements/stack";
import { Text } from "@/components/elements/text";
import { OrderStatusBadge } from "@/components/admin/order-status-badge";
import { getAdminOrder, updateOrderStatus, shipOrder, type Order } from "@/lib/api";
import { useAuthStore } from "@/lib/store";

const ORDER_STATUSES = [
  "pending",
  "paid",
  "processing",
  "shipped",
  "delivered",
  "cancelled",
  "refunded",
];

export default function AdminOrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { token } = useAuthStore();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [shipDialogOpen, setShipDialogOpen] = useState(false);
  const [trackingNumber, setTrackingNumber] = useState("");

  const orderId = Number(params.id);

  useEffect(() => {
    if (!token) return;

    const fetchOrder = async () => {
      setLoading(true);
      try {
        const data = await getAdminOrder(orderId, token);
        setOrder(data);
      } catch {
        toast.error("Failed to load order");
        router.push("/admin/orders");
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [token, orderId, router]);

  const handleStatusChange = async (newStatus: string) => {
    if (!token || !order) return;

    setUpdating(true);
    try {
      const result = await updateOrderStatus(order.id, newStatus, token);
      setOrder((prev) => prev ? { ...prev, status: result.status } : null);
      toast.success("Order status updated");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update status");
    } finally {
      setUpdating(false);
    }
  };

  const handleShipOrder = async () => {
    if (!token || !order || !trackingNumber.trim()) return;

    setUpdating(true);
    try {
      const result = await shipOrder(order.id, trackingNumber, token);
      setOrder((prev) => prev ? {
        ...prev,
        status: result.status,
        tracking_number: result.tracking_number,
      } : null);
      setShipDialogOpen(false);
      setTrackingNumber("");
      toast.success("Order marked as shipped");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to ship order");
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <Container padding="md">
        <Stack gap="section">
          <Skeleton className="h-8 w-48" />
          <Grid cols={2} gap="group">
            <Skeleton className="h-64" />
            <Skeleton className="h-64" />
          </Grid>
        </Stack>
      </Container>
    );
  }

  if (!order) {
    return null;
  }

  return (
    <Container padding="md">
      <Stack gap="section">
        {/* Header */}
        <Stack gap="group">
          <Link
            href="/admin/orders"
            className="inline-flex items-center gap-element text-muted-foreground hover:text-foreground transition-colors"
          >
            <IconChevronLeft className="size-4" aria-hidden="true" />
            <Text as="span" variant="body-sm">Back to Orders</Text>
          </Link>

          <Row justify="between" align="center">
            <Row gap="group" align="center">
              <Text as="h1" variant="heading-xl">
                Order #{order.id}
              </Text>
              <OrderStatusBadge status={order.status} />
            </Row>
            <Row gap="element">
              {order.status === "processing" && (
                <Button onClick={() => setShipDialogOpen(true)}>
                  <IconTruck className="size-4" aria-hidden="true" />
                  Ship Order
                </Button>
              )}
            </Row>
          </Row>
        </Stack>

        {/* Order Details */}
        <Grid cols={2} gap="group">
          {/* Order Info */}
          <Card>
            <CardHeader>
              <CardTitle>Order Information</CardTitle>
            </CardHeader>
            <CardContent padding="md">
              <Stack gap="group">
                <Row justify="between">
                  <Text variant="muted">Order Date</Text>
                  <Text as="span" variant="body-sm" className="font-medium">
                    {new Date(order.created_at).toLocaleString()}
                  </Text>
                </Row>
                <Row justify="between">
                  <Text variant="muted">Status</Text>
                  <Select
                    value={order.status}
                    onValueChange={handleStatusChange}
                    disabled={updating}
                  >
                    <SelectTrigger className="w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ORDER_STATUSES.map((status) => (
                        <SelectItem key={status} value={status}>
                          {status.charAt(0).toUpperCase() + status.slice(1)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Row>
                <Row justify="between">
                  <Text variant="muted">Total</Text>
                  <Text as="span" variant="body-md" className="font-semibold">
                    €{Number(order.total).toFixed(2)}
                  </Text>
                </Row>
                {order.tracking_number && (
                  <Row justify="between">
                    <Text variant="muted">Tracking</Text>
                    <Text as="span" variant="body-sm" className="font-mono">
                      {order.tracking_number}
                    </Text>
                  </Row>
                )}
              </Stack>
            </CardContent>
          </Card>

          {/* Shipping Info */}
          <Card>
            <CardHeader>
              <CardTitle>Shipping Details</CardTitle>
            </CardHeader>
            <CardContent padding="md">
              <Stack gap="element">
                <Text as="span" variant="body-sm" className="font-medium">
                  {order.shipping_name || "N/A"}
                </Text>
                {order.shipping_address && (
                  <Text variant="body-sm">{order.shipping_address}</Text>
                )}
                <Text variant="body-sm">
                  {order.shipping_city}, {order.shipping_postal_code}
                </Text>
                <Text variant="body-sm">{order.shipping_country}</Text>
                {order.guest_email && (
                  <Text variant="muted-sm" className="mt-2">
                    Guest: {order.guest_email}
                  </Text>
                )}
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        {/* Order Items */}
        <Card>
          <CardHeader>
            <CardTitle>Order Items</CardTitle>
          </CardHeader>
          <CardContent padding="md">
            <Stack gap="group">
              {order.items.map((item) => (
                <Row key={item.id} justify="between" align="center" className="py-3 border-b border-border-subtle last:border-0">
                  <Stack gap="none">
                    <Text as="span" variant="body-sm" className="font-medium">
                      {item.variant.product_city}
                    </Text>
                    <Text variant="muted-sm">
                      {item.variant.color} / {item.variant.size}
                    </Text>
                  </Stack>
                  <Row gap="section" align="center">
                    <Text variant="muted">×{item.quantity}</Text>
                    <Text as="span" variant="body-sm" className="font-medium w-20 text-right">
                      €{(Number(item.price) * item.quantity).toFixed(2)}
                    </Text>
                  </Row>
                </Row>
              ))}
              <Separator />
              <Row justify="between" align="center">
                <Text as="span" variant="body-md" className="font-semibold">
                  Total
                </Text>
                <Text as="span" variant="body-lg" className="font-semibold">
                  €{Number(order.total).toFixed(2)}
                </Text>
              </Row>
            </Stack>
          </CardContent>
        </Card>
      </Stack>

      {/* Ship Dialog */}
      <Dialog open={shipDialogOpen} onOpenChange={setShipDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ship Order</DialogTitle>
          </DialogHeader>
          <Stack gap="group">
            <Stack gap="element">
              <Label htmlFor="tracking">Tracking Number</Label>
              <Input
                id="tracking"
                value={trackingNumber}
                onChange={(e) => setTrackingNumber(e.target.value)}
                placeholder="Enter tracking number"
              />
            </Stack>
          </Stack>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShipDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleShipOrder}
              disabled={updating || !trackingNumber.trim()}
            >
              {updating ? "Shipping..." : "Mark as Shipped"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Container>
  );
}
