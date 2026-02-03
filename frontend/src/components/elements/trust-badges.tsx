import { IconShieldCheck, IconLock, IconTruck, IconRefresh } from "@tabler/icons-react";
import { Text } from "@/components/elements/text";
import { cn } from "@/lib/utils";

interface TrustBadge {
  icon: React.ElementType;
  label: { en: string; lv: string };
  description?: { en: string; lv: string };
}

const badges: TrustBadge[] = [
  {
    icon: IconLock,
    label: { en: "Secure Checkout", lv: "Droša apmaksa" },
    description: { en: "256-bit SSL encryption", lv: "256-bitu SSL šifrēšana" },
  },
  {
    icon: IconShieldCheck,
    label: { en: "Stripe Payments", lv: "Stripe maksājumi" },
    description: { en: "Bank-level security", lv: "Bankas līmeņa drošība" },
  },
  {
    icon: IconTruck,
    label: { en: "Fast Shipping", lv: "Ātra piegāde" },
    description: { en: "2-4 days in Latvia", lv: "2-4 dienas Latvijā" },
  },
  {
    icon: IconRefresh,
    label: { en: "Easy Returns", lv: "Vienkārša atgriešana" },
    description: { en: "14-day return policy", lv: "14 dienu atgriešanas politika" },
  },
];

interface TrustBadgesProps {
  variant?: "compact" | "expanded";
  className?: string;
  locale?: "en" | "lv";
}

export function TrustBadges({ variant = "compact", className, locale = "en" }: TrustBadgesProps) {
  if (variant === "compact") {
    return (
      <div className={cn("flex flex-wrap items-center justify-center gap-4", className)}>
        {badges.map((badge) => (
          <div key={badge.label.en} className="flex items-center gap-1.5 text-muted-foreground">
            <badge.icon className="h-4 w-4" />
            <Text variant="muted-sm">{badge.label[locale]}</Text>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className={cn("grid grid-cols-2 gap-4", className)}>
      {badges.map((badge) => (
        <div key={badge.label.en} className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 flex-shrink-0">
            <badge.icon className="h-4 w-4 text-primary" />
          </div>
          <div>
            <Text variant="body-sm" className="font-medium">{badge.label[locale]}</Text>
            {badge.description && (
              <Text variant="muted-sm">{badge.description[locale]}</Text>
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
        <span className="font-semibold text-brand-visa">VISA</span>
      </div>
      <div className="flex items-center gap-1 px-2 py-1 bg-muted/50 rounded text-xs text-muted-foreground">
        <span className="font-semibold text-brand-mastercard-red">Master</span>
        <span className="font-semibold text-brand-mastercard-orange">card</span>
      </div>
      <div className="flex items-center gap-1 px-2 py-1 bg-muted/50 rounded text-xs text-muted-foreground">
        <span className="font-semibold">Apple Pay</span>
      </div>
      <div className="flex items-center gap-1 px-2 py-1 bg-muted/50 rounded text-xs text-muted-foreground">
        <span className="font-semibold">Google Pay</span>
      </div>
      <div className="flex items-center gap-1 px-2 py-1 bg-muted/50 rounded text-xs text-muted-foreground">
        <span className="font-semibold text-brand-klarna">Klarna</span>
      </div>
    </div>
  );
}
