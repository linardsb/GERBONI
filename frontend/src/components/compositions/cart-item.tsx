"use client";

import Image from "next/image";
import { IconTrash, IconMinus, IconPlus } from "@tabler/icons-react";
import { Button } from "@/components/elements/button";
import { Card, CardContent } from "@/components/elements/card";
import { Text } from "@/components/elements/text";
import type { CartItem as CartItemType } from "@/lib/api";

interface CartItemProps {
  item: CartItemType;
  onUpdateQuantity: (itemId: number, quantity: number) => void;
  onRemove: (itemId: number) => void;
}

export function CartItem({ item, onUpdateQuantity, onRemove }: CartItemProps) {
  return (
    <Card>
      <CardContent className="flex items-center gap-4 p-4">
        {/* Product image */}
        <div className="h-20 w-20 flex-shrink-0 bg-muted flex items-center justify-center p-2">
          <Image
            src={`/coats/${item.variant.product_image}`}
            alt={item.variant.product_city}
            width={64}
            height={64}
            className="h-full w-full object-contain"
          />
        </div>

        {/* Product info */}
        <div className="flex-1 min-w-0">
          <Text as="h3" variant="heading-xs" className="truncate">
            {item.variant.product_city}
          </Text>
          <Text variant="muted-sm">
            {item.variant.color} / {item.variant.size}
          </Text>
          <Text variant="price" className="mt-1">
            €{Number(item.variant.price).toFixed(2)}
          </Text>
        </div>

        {/* Quantity controls */}
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon-xs"
            onClick={() => onUpdateQuantity(item.id, item.quantity - 1)}
          >
            <IconMinus className="h-3 w-3" />
          </Button>
          <Text as="span" variant="body-md" className="w-8 text-center">
            {item.quantity}
          </Text>
          <Button
            variant="outline"
            size="icon-xs"
            onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
          >
            <IconPlus className="h-3 w-3" />
          </Button>
        </div>

        {/* Remove button */}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onRemove(item.id)}
          className="text-muted-foreground hover:text-destructive"
        >
          <IconTrash className="h-4 w-4" />
        </Button>
      </CardContent>
    </Card>
  );
}
