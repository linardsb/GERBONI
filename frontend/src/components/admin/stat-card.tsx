import type { Icon } from "@tabler/icons-react";
import { Card, CardContent } from "@/components/elements/card";
import { Stack } from "@/components/elements/stack";
import { Row } from "@/components/elements/row";
import { Text } from "@/components/elements/text";

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: Icon;
  trend?: {
    value: number;
    direction: "up" | "down";
  };
}

export function StatCard({ title, value, subtitle, icon: IconComponent, trend }: StatCardProps) {
  return (
    <Card data-slot="stat-card">
      <CardContent padding="md" className="py-6">
        <Row justify="between" align="start">
          <Stack gap="element">
            <Text variant="muted-sm">{title}</Text>
            <Text as="span" variant="heading-lg" className="text-2xl">
              {value}
            </Text>
            {subtitle && (
              <Text variant="muted-sm">{subtitle}</Text>
            )}
            {trend && (
              <Text
                variant="body-sm"
                className={trend.direction === "up" ? "text-success" : "text-destructive"}
              >
                {trend.direction === "up" ? "+" : "-"}{Math.abs(trend.value)}%
              </Text>
            )}
          </Stack>
          <div className="size-12 rounded-lg bg-primary/10 flex items-center justify-center">
            <IconComponent className="size-6 text-primary" aria-hidden="true" />
          </div>
        </Row>
      </CardContent>
    </Card>
  );
}
