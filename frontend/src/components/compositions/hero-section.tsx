import Link from "next/link";
import { IconArrowRight } from "@/components/icons";
import { Button } from "@/components/elements/button";
import { Section } from "@/components/elements/section";
import { Container } from "@/components/elements/container";
import { Stack } from "@/components/elements/stack";
import { Text } from "@/components/elements/text";

interface HeroSectionProps {
  title: string;
  subtitle: string;
  primaryAction?: {
    label: string;
    href: string;
  };
  secondaryAction?: {
    label: string;
    href: string;
  };
}

export function HeroSection({
  title,
  subtitle,
  primaryAction,
  secondaryAction,
}: HeroSectionProps) {
  return (
    <Section spacing="large" background="muted">
      <Container>
        <Stack gap="section" align="center" className="mx-auto max-w-3xl text-center">
          <Text as="h1" variant="display-xl">
            {title}
          </Text>
          <Text variant="muted-lg" className="mx-auto max-w-2xl">
            {subtitle}
          </Text>
          {(primaryAction || secondaryAction) && (
            <div className="flex flex-wrap justify-center gap-group pt-section">
              {primaryAction && (
                <Button variant="minimal" asChild size="lg" className="text-label">
                  <Link href={primaryAction.href}>
                    {primaryAction.label}
                    <IconArrowRight className="size-4" />
                  </Link>
                </Button>
              )}
              {secondaryAction && (
                <Button variant="text-underline" asChild size="lg">
                  <Link href={secondaryAction.href}>{secondaryAction.label}</Link>
                </Button>
              )}
            </div>
          )}
        </Stack>
      </Container>
    </Section>
  );
}
