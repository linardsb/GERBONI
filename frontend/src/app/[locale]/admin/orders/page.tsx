"use client";

import { useEffect, useState } from "react";
import { Link } from "@/i18n/routing";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { Button } from "@/components/elements/button";
import { Card, CardContent } from "@/components/elements/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/elements/select";
import { Skeleton } from "@/components/elements/skeleton";
import { Container } from "@/components/elements/container";
import { Row } from "@/components/elements/row";
import { Stack } from "@/components/elements/stack";
import { Text } from "@/components/elements/text";
import { DataTable } from "@/components/admin/data-table";
import { OrderStatusBadge } from "@/components/admin/order-status-badge";
import { getAdminOrders, downloadCsv, type AdminOrder, type AdminOrderList } from "@/lib/api";
import { useAuthStore } from "@/lib/store";

const ORDER_STATUSES = [
  { value: "all", label: "All Statuses" },
  { value: "pending", label: "Pending" },
  { value: "paid", label: "Paid" },
  { value: "processing", label: "Processing" },
  { value: "shipped", label: "Shipped" },
  { value: "delivered", label: "Delivered" },
  { value: "cancelled", label: "Cancelled" },
  { value: "refunded", label: "Refunded" },
];

export default function AdminOrdersPage() {
  const t = useTranslations("admin");
  const { token } = useAuthStore();
  const [orderData, setOrderData] = useState<AdminOrderList | null>(null);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(0);
  const limit = 20;

  useEffect(() => {
    if (!token) return;

    const fetchOrders = async () => {
      setLoading(true);
      try {
        const data = await getAdminOrders(token, {
          status: statusFilter === "all" ? undefined : statusFilter,
          limit,
          offset: page * limit,
        });
        setOrderData(data);
      } catch {
        toast.error(t("failedLoadOrders"));
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [token, statusFilter, page]);

  const columns = [
    {
      key: "id",
      header: "Order #",
      sortable: true,
      render: (order: AdminOrder) => (
        <Link
          href={`/admin/orders/${order.id}`}
          className="font-medium text-primary hover:underline"
        >
          #{order.id}
        </Link>
      ),
    },
    {
      key: "customer",
      header: "Customer",
      render: (order: AdminOrder) => (
        <Text as="span" variant="body-sm">
          {order.shipping_name || order.guest_email || "Guest"}
        </Text>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (order: AdminOrder) => <OrderStatusBadge status={order.status} />,
    },
    {
      key: "total",
      header: "Total",
      sortable: true,
      render: (order: AdminOrder) => (
        <Text as="span" variant="body-sm" className="font-medium">
          €{Number(order.total).toFixed(2)}
        </Text>
      ),
    },
    {
      key: "item_count",
      header: "Items",
      sortable: true,
      render: (order: AdminOrder) => (
        <Text as="span" variant="body-sm">{order.item_count}</Text>
      ),
    },
    {
      key: "created_at",
      header: "Date",
      sortable: true,
      render: (order: AdminOrder) => (
        <Text variant="muted-sm">
          {new Date(order.created_at).toLocaleDateString()}
        </Text>
      ),
    },
  ];

  const totalPages = orderData ? Math.ceil(orderData.total / limit) : 0;

  return (
    <Container padding="md">
      <Stack gap="section">
        <Row justify="between" align="center">
          <Text as="h1" variant="heading-xl">
            Orders
          </Text>
          <Row gap="group">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                {ORDER_STATUSES.map((status) => (
                  <SelectItem key={status.value} value={status.value}>
                    {status.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              size="sm"
              onClick={async () => {
                if (!token) return;
                try {
                  const params: Record<string, string> = {};
                  if (statusFilter !== "all") params.status = statusFilter;
                  await downloadCsv("/admin/orders/export", "orders.csv", token, params);
                } catch {
                  toast.error(t("exportFailed"));
                }
              }}
            >
              {t("exportCsv")}
            </Button>
          </Row>
        </Row>

        <Card>
          <CardContent padding="none">
            {loading ? (
              <Stack gap="element" className="p-6">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </Stack>
            ) : (
              <>
                <DataTable
                  data={orderData?.orders ?? []}
                  columns={columns}
                  keyExtractor={(order) => order.id}
                />
                {totalPages > 1 && (
                  <Row justify="between" align="center" className="p-4 border-t border-border-subtle">
                    <Text variant="muted-sm">
                      Showing {page * limit + 1} to{" "}
                      {Math.min((page + 1) * limit, orderData?.total ?? 0)} of{" "}
                      {orderData?.total} orders
                    </Text>
                    <Row gap="element">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPage((p) => Math.max(0, p - 1))}
                        disabled={page === 0}
                      >
                        Previous
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPage((p) => p + 1)}
                        disabled={page >= totalPages - 1}
                      >
                        Next
                      </Button>
                    </Row>
                  </Row>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </Stack>
    </Container>
  );
}
