"use client";

import { Button } from "@/components/elements/button";
import { Input } from "@/components/elements/input";
import { Label } from "@/components/elements/label";
import { Separator } from "@/components/elements/separator";
import { Stack } from "@/components/elements/stack";
import { Grid } from "@/components/elements/grid";
import { Text } from "@/components/elements/text";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/elements/select";
import type { ShippingInfo } from "@/lib/api";

interface CheckoutFormProps {
  shipping: ShippingInfo;
  onShippingChange: (shipping: ShippingInfo) => void;
  guestEmail?: string;
  onGuestEmailChange?: (email: string) => void;
  showGuestEmail?: boolean;
  total: number;
  processing: boolean;
  onSubmit: (e: React.FormEvent) => void;
  onBack: () => void;
}

export function CheckoutForm({
  shipping,
  onShippingChange,
  guestEmail = "",
  onGuestEmailChange,
  showGuestEmail = false,
  total,
  processing,
  onSubmit,
  onBack,
}: CheckoutFormProps) {
  return (
    <Stack gap="section">
      <Button variant="ghost" onClick={onBack}>
        ← Back to cart
      </Button>

      <Text as="h1" variant="heading-lg">Checkout</Text>

      <form onSubmit={onSubmit}>
        <Stack gap="lg">
          {showGuestEmail && onGuestEmailChange && (
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                required
                value={guestEmail}
                onChange={(e) => onGuestEmailChange(e.target.value)}
                placeholder="your@email.com"
                className="mt-1"
              />
            </div>
          )}

          <div>
            <Label htmlFor="name">Full Name</Label>
            <Input
              id="name"
              required
              value={shipping.name}
              onChange={(e) => onShippingChange({ ...shipping, name: e.target.value })}
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="address">Address</Label>
            <Input
              id="address"
              required
              value={shipping.address}
              onChange={(e) => onShippingChange({ ...shipping, address: e.target.value })}
              className="mt-1"
            />
          </div>

          <Grid cols={2} gap="default">
            <div>
              <Label htmlFor="city">City</Label>
              <Input
                id="city"
                required
                value={shipping.city}
                onChange={(e) => onShippingChange({ ...shipping, city: e.target.value })}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="postal">Postal Code</Label>
              <Input
                id="postal"
                required
                value={shipping.postal_code}
                onChange={(e) => onShippingChange({ ...shipping, postal_code: e.target.value })}
                className="mt-1"
              />
            </div>
          </Grid>

          <div>
            <Label htmlFor="country">Country</Label>
            <Select
              value={shipping.country}
              onValueChange={(value) => onShippingChange({ ...shipping, country: value })}
            >
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Latvia">Latvia</SelectItem>
                <SelectItem value="Lithuania">Lithuania</SelectItem>
                <SelectItem value="Estonia">Estonia</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Separator />

          <div className="flex justify-between">
            <Text as="span" variant="body-lg" className="font-semibold">Total</Text>
            <Text as="span" variant="body-lg" className="font-semibold">€{total.toFixed(2)}</Text>
          </div>

          <Button type="submit" size="lg" className="w-full" disabled={processing}>
            {processing ? "Processing..." : `Pay €${total.toFixed(2)}`}
          </Button>
        </Stack>
      </form>
    </Stack>
  );
}
