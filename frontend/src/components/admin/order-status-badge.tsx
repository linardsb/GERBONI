import { Badge } from "@/components/elements/badge";

const statusConfig: Record<string, { variant: "default" | "secondary" | "destructive" | "outline"; label: string }> = {
  pending: { variant: "secondary", label: "Pending" },
  paid: { variant: "default", label: "Paid" },
  processing: { variant: "default", label: "Processing" },
  shipped: { variant: "default", label: "Shipped" },
  delivered: { variant: "default", label: "Delivered" },
  cancelled: { variant: "destructive", label: "Cancelled" },
  refunded: { variant: "outline", label: "Refunded" },
};

interface OrderStatusBadgeProps {
  status: string;
}

export function OrderStatusBadge({ status }: OrderStatusBadgeProps) {
  const config = statusConfig[status] || { variant: "secondary" as const, label: status };

  return (
    <Badge variant={config.variant} data-slot="order-status-badge">
      {config.label}
    </Badge>
  );
}
