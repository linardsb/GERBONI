"use client";

import { Button } from "@/components/elements/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/elements/card";
import { Separator } from "@/components/elements/separator";
import { Text } from "@/components/elements/text";
import { Stack } from "@/components/elements/stack";
import { TrustBadges, PaymentMethodBadges } from "@/components/elements/trust-badges";

interface CartSummaryProps {
  total: number;
  onCheckout: () => void;
}

export function CartSummary({ total, onCheckout }: CartSummaryProps) {
  const isFreeShipping = total >= 50;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Order Summary</CardTitle>
      </CardHeader>
      <CardContent>
        <Stack gap="sm">
          <div className="flex justify-between">
            <Text as="span" variant="body-md">Subtotal</Text>
            <Text as="span" variant="body-md">€{total.toFixed(2)}</Text>
          </div>
          <div className="flex justify-between">
            <Text as="span" variant="muted">Shipping</Text>
            <Text as="span" variant={isFreeShipping ? "success" : "muted"}>
              {isFreeShipping ? "FREE" : "Calculated at checkout"}
            </Text>
          </div>
          {!isFreeShipping && total > 0 && (
            <Text variant="muted-sm" className="text-center bg-muted/50 py-2 rounded">
              Add €{(50 - total).toFixed(2)} more for free shipping
            </Text>
          )}
        </Stack>
      </CardContent>
      <Separator />
      <CardFooter className="flex-col gap-4 pt-6">
        <div className="flex w-full justify-between">
          <Text as="span" variant="heading-sm">Total</Text>
          <Text as="span" variant="heading-sm">€{total.toFixed(2)}</Text>
        </div>
        <Button size="lg" className="w-full" onClick={onCheckout}>
          Proceed to Checkout
        </Button>
        <PaymentMethodBadges className="mt-2" />
        <Separator className="my-2" />
        <TrustBadges variant="compact" />
      </CardFooter>
    </Card>
  );
}
