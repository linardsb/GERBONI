import { IconShieldCheck, IconLock, IconTruck, IconRefresh } from "@tabler/icons-react";
import { Text } from "@/components/elements/text";
import { cn } from "@/lib/utils";

interface TrustBadge {
  icon: React.ElementType;
  label: string;
  description?: string;
}

const badges: TrustBadge[] = [
  {
    icon: IconLock,
    label: "Secure Checkout",
    description: "256-bit SSL encryption",
  },
  {
    icon: IconShieldCheck,
    label: "Stripe Payments",
    description: "Bank-level security",
  },
  {
    icon: IconTruck,
    label: "Fast Shipping",
    description: "2-4 days in Latvia",
  },
  {
    icon: IconRefresh,
    label: "Easy Returns",
    description: "14-day return policy",
  },
];

interface TrustBadgesProps {
  variant?: "compact" | "expanded";
  className?: string;
}

export function TrustBadges({ variant = "compact", className }: TrustBadgesProps) {
  if (variant === "compact") {
    return (
      <div className={cn("flex flex-wrap items-center justify-center gap-4", className)}>
        {badges.map((badge) => (
          <div key={badge.label} className="flex items-center gap-1.5 text-muted-foreground">
            <badge.icon className="h-4 w-4" />
            <Text variant="muted-sm">{badge.label}</Text>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className={cn("grid grid-cols-2 gap-4", className)}>
      {badges.map((badge) => (
        <div key={badge.label} className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 flex-shrink-0">
            <badge.icon className="h-4 w-4 text-primary" />
          </div>
          <div>
            <Text variant="body-sm" className="font-medium">{badge.label}</Text>
            {badge.description && (
              <Text variant="muted-sm">{badge.description}</Text>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

export function PaymentMethodBadges({ className }: { className?: string }) {
  return (
    <div className={cn("flex flex-wrap items-center justify-center gap-2", className)}>
      <div className="flex items-center gap-1 px-2 py-1 bg-muted/50 rounded text-xs text-muted-foreground">
        <span className="font-semibold text-[#1434CB]">VISA</span>
      </div>
      <div className="flex items-center gap-1 px-2 py-1 bg-muted/50 rounded text-xs text-muted-foreground">
        <span className="font-semibold text-[#EB001B]">Master</span>
        <span className="font-semibold text-[#F79E1B]">card</span>
      </div>
      <div className="flex items-center gap-1 px-2 py-1 bg-muted/50 rounded text-xs text-muted-foreground">
        <span className="font-semibold">Apple Pay</span>
      </div>
      <div className="flex items-center gap-1 px-2 py-1 bg-muted/50 rounded text-xs text-muted-foreground">
        <span className="font-semibold">Google Pay</span>
      </div>
      <div className="flex items-center gap-1 px-2 py-1 bg-muted/50 rounded text-xs text-muted-foreground">
        <span className="font-semibold text-[#FFB3C7]">Klarna</span>
      </div>
    </div>
  );
}
