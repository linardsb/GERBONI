"use client";

import Link from "next/link";
import Image from "next/image";
import { useRecentlyViewedStore } from "@/lib/store";
import { Card, CardContent } from "@/components/elements/card";
import { Text } from "@/components/elements/text";
import { Stack } from "@/components/elements/stack";
import { Row } from "@/components/elements/row";

interface RecentlyViewedProps {
  /** Current product ID to exclude from the list */
  excludeProductId?: number;
  /** Maximum number of items to display */
  maxItems?: number;
}

export function RecentlyViewed({
  excludeProductId,
  maxItems = 6,
}: RecentlyViewedProps) {
  const { items } = useRecentlyViewedStore();

  // Filter out current product and limit items
  const displayItems = items
    .filter((item) => item.productId !== excludeProductId)
    .slice(0, maxItems);

  // Don't render if no items to show
  if (displayItems.length === 0) {
    return null;
  }

  return (
    <Stack gap="group" data-slot="recently-viewed">
      <Text as="h3" variant="heading-sm">
        Recently Viewed
      </Text>
      <Row
        gap="group"
        className="overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0 scrollbar-thin scrollbar-thumb-muted scrollbar-track-transparent"
      >
        {displayItems.map((item) => (
          <Link
            key={item.productId}
            href={`/products/${item.productId}`}
            className="group flex-shrink-0"
          >
            <Card className="w-32 overflow-hidden transition-all hover:border-primary hover:shadow-md">
              <CardContent className="p-0">
                <div className="relative aspect-square bg-muted flex items-center justify-center p-4">
                  <div className="relative h-full w-full">
                    <svg
                      viewBox="0 0 100 100"
                      className="h-full w-full text-overlay-foreground drop-shadow-sm transition-transform duration-300 group-hover:scale-105"
                    >
                      <path
                        d="M20 25 L35 20 L40 30 L60 30 L65 20 L80 25 L85 40 L75 45 L75 85 L25 85 L25 45 L15 40 Z"
                        fill="currentColor"
                        className="stroke-tshirt-stroke"
                        strokeWidth="1"
                      />
                    </svg>
                    <div className="absolute left-1/2 top-1/2 h-8 w-8 -translate-x-1/2 -translate-y-1/4">
                      <Image
                        src={`/coats/${item.product.coat_of_arms_image}`}
                        alt={`${item.product.city_name} coat of arms`}
                        width={32}
                        height={32}
                        className="h-full w-full object-contain"
                        onError={(e) => {
                          e.currentTarget.src = "/coats/placeholder.svg";
                        }}
                      />
                    </div>
                  </div>
                </div>
                <div className="p-2">
                  <Text
                    variant="body-sm"
                    className="truncate font-medium transition-colors group-hover:text-primary"
                  >
                    {item.product.city_name}
                  </Text>
                  {item.product.min_price && (
                    <Text variant="muted-sm">
                      €{Number(item.product.min_price).toFixed(2)}
                    </Text>
                  )}
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </Row>
    </Stack>
  );
}
