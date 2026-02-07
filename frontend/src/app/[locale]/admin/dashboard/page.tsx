"use client";

import { useEffect, useState } from "react";
import { Link } from "@/i18n/routing";
import {
  IconPackage,
  IconCurrencyEuro,
  IconUsers,
  IconAlertTriangle,
  IconClock,
  IconTrendingUp,
} from "@/components/icons";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { Button } from "@/components/elements/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/elements/card";
import { Skeleton } from "@/components/elements/skeleton";
import { Container } from "@/components/elements/container";
import { Grid } from "@/components/elements/grid";
import { Row } from "@/components/elements/row";
import { Stack } from "@/components/elements/stack";
import { Text } from "@/components/elements/text";
import { StatCard } from "@/components/admin/stat-card";
import { OrderStatusBadge } from "@/components/admin/order-status-badge";
import {
  getAdminDashboardStats,
  getAdminOrders,
  getLowStockVariants,
  type DashboardStats,
  type AdminOrder,
  type AdminVariant,
} from "@/lib/api";
import { useAuthStore } from "@/lib/store";

export default function AdminDashboardPage() {
  const t = useTranslations("admin");
  const { token } = useAuthStore();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentOrders, setRecentOrders] = useState<AdminOrder[]>([]);
  const [lowStockItems, setLowStockItems] = useState<(AdminVariant & { product_name: string })[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) return;

    const fetchData = async () => {
      try {
        const [statsData, ordersData, lowStockData] = await Promise.all([
          getAdminDashboardStats(token),
          getAdminOrders(token, { limit: 5 }),
          getLowStockVariants(token),
        ]);

        setStats(statsData);
        setRecentOrders(ordersData.orders);
        setLowStockItems(lowStockData);
      } catch {
        toast.error(t("failedLoadDashboard"));
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [token]);

  if (loading) {
    return (
      <Container padding="md">
        <Stack gap="section">
          <Skeleton className="h-10 w-48" />
          <Grid cols={4} gap="group">
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
          </Grid>
          <Grid cols={2} gap="group">
            <Skeleton className="h-64" />
            <Skeleton className="h-64" />
          </Grid>
        </Stack>
      </Container>
    );
  }

  return (
    <Container padding="md">
      <Stack gap="section">
        <Text as="h1" variant="heading-xl">
          Dashboard
        </Text>

        {/* Stats Grid */}
        <Grid cols={4} gap="group">
          <StatCard
            title="Total Orders"
            value={stats?.total_orders ?? 0}
            icon={IconPackage}
          />
          <StatCard
            title="Total Revenue"
            value={`€${(stats?.total_revenue ?? 0).toFixed(2)}`}
            icon={IconCurrencyEuro}
          />
          <StatCard
            title="Total Customers"
            value={stats?.total_customers ?? 0}
            icon={IconUsers}
          />
          <StatCard
            title="Pending Orders"
            value={stats?.pending_orders ?? 0}
            icon={IconClock}
          />
        </Grid>

        {/* Today's Stats */}
        <Grid cols={2} gap="group">
          <StatCard
            title="Orders Today"
            value={stats?.orders_today ?? 0}
            subtitle="New orders placed today"
            icon={IconTrendingUp}
          />
          <StatCard
            title="Revenue Today"
            value={`€${(stats?.revenue_today ?? 0).toFixed(2)}`}
            subtitle="From paid orders"
            icon={IconCurrencyEuro}
          />
        </Grid>

        {/* Recent Orders & Low Stock Alerts */}
        <Grid cols={2} gap="group">
          {/* Recent Orders */}
          <Card>
            <CardHeader>
              <Row justify="between" align="center">
                <CardTitle>Recent Orders</CardTitle>
                <Button variant="outline" size="sm" asChild>
                  <Link href="/admin/orders">View All</Link>
                </Button>
              </Row>
            </CardHeader>
            <CardContent padding="md">
              {recentOrders.length === 0 ? (
                <Text variant="muted" className="py-4 text-center">
                  No recent orders
                </Text>
              ) : (
                <Stack gap="element">
                  {recentOrders.map((order) => (
                    <Link
                      key={order.id}
                      href={`/admin/orders/${order.id}`}
                      className="block p-3 rounded-lg hover:bg-muted transition-colors"
                    >
                      <Row justify="between" align="center">
                        <Stack gap="none">
                          <Text as="span" variant="body-sm" className="font-medium">
                            Order #{order.id}
                          </Text>
                          <Text variant="muted-sm">
                            {order.shipping_name || order.guest_email || "Guest"}
                          </Text>
                        </Stack>
                        <Stack gap="element" align="end">
                          <OrderStatusBadge status={order.status} />
                          <Text as="span" variant="body-sm" className="font-medium">
                            €{Number(order.total).toFixed(2)}
                          </Text>
                        </Stack>
                      </Row>
                    </Link>
                  ))}
                </Stack>
              )}
            </CardContent>
          </Card>

          {/* Low Stock Alerts */}
          <Card>
            <CardHeader>
              <Row justify="between" align="center">
                <Row gap="element">
                  <CardTitle>Low Stock Alerts</CardTitle>
                  {(stats?.low_stock_variants ?? 0) > 0 && (
                    <span className="size-6 rounded-full bg-destructive text-destructive-foreground text-xs flex items-center justify-center">
                      {stats?.low_stock_variants}
                    </span>
                  )}
                </Row>
                <Button variant="outline" size="sm" asChild>
                  <Link href="/admin/products">Manage Stock</Link>
                </Button>
              </Row>
            </CardHeader>
            <CardContent padding="md">
              {lowStockItems.length === 0 ? (
                <Text variant="muted" className="py-4 text-center">
                  All products are well stocked
                </Text>
              ) : (
                <Stack gap="element">
                  {lowStockItems.slice(0, 5).map((item) => (
                    <Row
                      key={item.id}
                      justify="between"
                      align="center"
                      className="p-3 rounded-lg bg-destructive/5 border border-destructive/20"
                    >
                      <Stack gap="none">
                        <Text as="span" variant="body-sm" className="font-medium">
                          {item.product_name}
                        </Text>
                        <Text variant="muted-sm">
                          {item.color} / {item.size}
                        </Text>
                      </Stack>
                      <Row gap="element" align="center">
                        <IconAlertTriangle className="size-4 text-destructive" aria-hidden="true" />
                        <Text as="span" variant="body-sm" className="font-medium text-destructive">
                          {item.stock} left
                        </Text>
                      </Row>
                    </Row>
                  ))}
                  {lowStockItems.length > 5 && (
                    <Text variant="muted-sm" className="text-center">
                      +{lowStockItems.length - 5} more items
                    </Text>
                  )}
                </Stack>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Stack>
    </Container>
  );
}
