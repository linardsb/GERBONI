"use client";

import { useRecentlyViewedStore } from "@/lib/store";
import { Section } from "@/components/elements/section";
import { Container } from "@/components/elements/container";
import { RecentlyViewed } from "./recently-viewed";

export function RecentlyViewedSection() {
  const { items } = useRecentlyViewedStore();

  // Don't render the section if no items
  if (items.length === 0) {
    return null;
  }

  return (
    <Section spacing="compact">
      <Container>
        <RecentlyViewed maxItems={6} />
      </Container>
    </Section>
  );
}
