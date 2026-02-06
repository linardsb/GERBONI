"use client";

import { IconTrash, IconMinus, IconPlus } from "@/components/icons";
import { Button } from "@/components/elements/button";
import { Card, CardContent } from "@/components/elements/card";
import { Text } from "@/components/elements/text";
import { Badge } from "@/components/elements/badge";
import { Row } from "@/components/elements/row";
import { Stack } from "@/components/elements/stack";
import { TShirtMockup } from "@/components/components/tshirt-mockup";
import { isValidColorKey, type ProductColorKey } from "@/lib/product-colors";
import type { CartItem as CartItemType } from "@/lib/api";

interface CartItemProps {
  item: CartItemType;
  onUpdateQuantity: (itemId: number, quantity: number) => void;
  onRemove: (itemId: number) => void;
  locale?: "en" | "lv";
}

export function CartItem({ item, onUpdateQuantity, onRemove, locale = "en" }: CartItemProps) {
  // Get color as ProductColorKey if valid, otherwise default to Black
  const colorKey: ProductColorKey = isValidColorKey(item.variant.color)
    ? item.variant.color
    : "Black";

  return (
    <Card data-slot="cart-item">
      <CardContent className="p-4">
        <Row gap="group" className="items-center">
          {/* Product thumbnail with TShirtMockup */}
          <div className="relative flex-shrink-0">
            <div className="size-20 bg-muted flex items-center justify-center p-2">
              <TShirtMockup
                color={colorKey}
                coatOfArmsImage={item.variant.product_image}
                coatOfArmsAlt={item.variant.product_city}
                size="sm"
              />
            </div>
          </div>

          {/* Product info */}
          <Stack gap="element" className="flex-1 min-w-0">
            <Text as="h3" variant="heading-xs" className="truncate">
              {locale === "lv" ? item.variant.product_city_lv : item.variant.product_city}
            </Text>

            {/* Variant badges */}
            <Row gap="element" wrap="wrap">
              <Badge variant="secondary" className="text-xs">
                {item.variant.color}
              </Badge>
              <Badge variant="outline" className="text-xs">
                {item.variant.size}
              </Badge>
            </Row>

            {/* Price - visible on mobile */}
            <Text variant="price" className="sm:hidden">
              €{Number(item.variant.price).toFixed(2)}
            </Text>
          </Stack>

          {/* Quantity controls */}
          <Row gap="element" className="items-center">
            <Button
              variant="outline"
              size="icon-xs"
              onClick={() => onUpdateQuantity(item.id, item.quantity - 1)}
              aria-label={locale === "lv" ? "Samazināt daudzumu" : "Decrease quantity"}
            >
              <IconMinus className="size-3" aria-hidden="true" />
            </Button>
            <Text
              as="span"
              variant="body-md"
              className="w-8 text-center tabular-nums"
              aria-live="polite"
              aria-atomic="true"
            >
              {item.quantity}
            </Text>
            <Button
              variant="outline"
              size="icon-xs"
              onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
              aria-label={locale === "lv" ? "Palielināt daudzumu" : "Increase quantity"}
            >
              <IconPlus className="size-3" aria-hidden="true" />
            </Button>
          </Row>

          {/* Price - visible on desktop */}
          <Text variant="price" className="hidden sm:block min-w-16 text-right">
            €{Number(item.variant.price).toFixed(2)}
          </Text>

          {/* Remove button */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onRemove(item.id)}
            className="text-muted-foreground hover:text-destructive transition-colors duration-fast"
            aria-label={locale === "lv" ? "Noņemt no groza" : "Remove from cart"}
          >
            <IconTrash className="size-4" aria-hidden="true" />
          </Button>
        </Row>
      </CardContent>
    </Card>
  );
}
