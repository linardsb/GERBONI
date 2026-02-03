"use client";

import { IconCheck, IconClock, IconPackage, IconTruck, IconHome, IconX, IconRefresh } from "@tabler/icons-react";
import { Text } from "@/components/elements/text";
import { cn } from "@/lib/utils";

type OrderStatus = "pending" | "paid" | "processing" | "shipped" | "delivered" | "cancelled" | "refunded";

interface TimelineStep {
  status: OrderStatus;
  label: string;
  icon: React.ElementType;
  description: string;
}

const timelineSteps: TimelineStep[] = [
  {
    status: "pending",
    label: "Order Placed",
    icon: IconClock,
    description: "Awaiting payment confirmation",
  },
  {
    status: "paid",
    label: "Payment Confirmed",
    icon: IconCheck,
    description: "Payment received successfully",
  },
  {
    status: "processing",
    label: "Processing",
    icon: IconPackage,
    description: "Order is being prepared",
  },
  {
    status: "shipped",
    label: "Shipped",
    icon: IconTruck,
    description: "Order is on its way",
  },
  {
    status: "delivered",
    label: "Delivered",
    icon: IconHome,
    description: "Order has been delivered",
  },
];

const statusOrder: OrderStatus[] = ["pending", "paid", "processing", "shipped", "delivered"];

interface OrderTimelineProps {
  currentStatus: string;
  trackingNumber?: string | null;
  createdAt: string;
  className?: string;
}

export function OrderTimeline({ currentStatus, trackingNumber, createdAt, className }: OrderTimelineProps) {
  const status = currentStatus.toLowerCase() as OrderStatus;

  // Handle cancelled/refunded orders separately
  if (status === "cancelled" || status === "refunded") {
    return (
      <div className={cn("space-y-4", className)}>
        <div className="flex items-center gap-3 p-4 rounded-lg bg-destructive/10 border border-destructive/20">
          {status === "cancelled" ? (
            <IconX className="h-6 w-6 text-destructive" />
          ) : (
            <IconRefresh className="h-6 w-6 text-destructive" />
          )}
          <div>
            <Text variant="heading-xs">
              {status === "cancelled" ? "Order Cancelled" : "Order Refunded"}
            </Text>
            <Text variant="muted-sm">
              {status === "cancelled"
                ? "This order has been cancelled"
                : "This order has been refunded"}
            </Text>
          </div>
        </div>
      </div>
    );
  }

  const currentIndex = statusOrder.indexOf(status);

  return (
    <div className={cn("space-y-0", className)}>
      {timelineSteps.map((step, index) => {
        const stepIndex = statusOrder.indexOf(step.status);
        const isCompleted = stepIndex < currentIndex || (stepIndex === currentIndex && status !== "pending");
        const isCurrent = stepIndex === currentIndex;
        const isPending = stepIndex > currentIndex;

        return (
          <div key={step.status} className="relative">
            {/* Connector line */}
            {index < timelineSteps.length - 1 && (
              <div
                className={cn(
                  "absolute left-4 top-8 h-full w-0.5",
                  isCompleted ? "bg-primary" : "bg-border"
                )}
              />
            )}

            <div className="flex gap-4 pb-8 last:pb-0">
              {/* Icon */}
              <div
                className={cn(
                  "relative z-10 flex h-8 w-8 items-center justify-center rounded-full border-2 flex-shrink-0",
                  isCompleted && "bg-primary border-primary text-primary-foreground",
                  isCurrent && !isCompleted && "bg-primary/10 border-primary text-primary",
                  isPending && "bg-muted border-border text-muted-foreground"
                )}
              >
                <step.icon className="h-4 w-4" />
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0 pt-0.5">
                <div className="flex items-center gap-2">
                  <Text
                    variant={isCurrent ? "heading-xs" : "body-sm"}
                    className={cn(
                      isPending && "text-muted-foreground"
                    )}
                  >
                    {step.label}
                  </Text>
                  {isCurrent && (
                    <span className="inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                      Current
                    </span>
                  )}
                </div>
                <Text variant="muted-sm">
                  {step.description}
                </Text>

                {/* Show tracking number on shipped step */}
                {step.status === "shipped" && trackingNumber && (isCompleted || isCurrent) && (
                  <div className="mt-2 p-2 bg-muted/50 rounded text-sm">
                    <Text variant="muted-sm">
                      Tracking: <span className="font-mono">{trackingNumber}</span>
                    </Text>
                  </div>
                )}

                {/* Show date for first step */}
                {step.status === "pending" && (
                  <Text variant="muted-sm" className="mt-1">
                    {new Date(createdAt).toLocaleString()}
                  </Text>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
