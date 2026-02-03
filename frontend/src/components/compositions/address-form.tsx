"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/elements/button";
import { Input } from "@/components/elements/input";
import { Label } from "@/components/elements/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/elements/dialog";
import { Stack } from "@/components/elements/stack";
import { Row } from "@/components/elements/row";
import { Text } from "@/components/elements/text";
import type { Address, AddressCreate, AddressUpdate } from "@/lib/api";

interface AddressFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  address?: Address | null;
  onSubmit: (data: AddressCreate | AddressUpdate) => Promise<void>;
  isLoading?: boolean;
}

export function AddressForm({
  open,
  onOpenChange,
  address,
  onSubmit,
  isLoading = false,
}: AddressFormProps) {
  const [formData, setFormData] = useState<AddressCreate>({
    name: "",
    address_line1: "",
    address_line2: "",
    city: "",
    postal_code: "",
    country: "Latvia",
    phone: "",
    label: "",
    is_default: false,
  });
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (address) {
      setFormData({
        name: address.name,
        address_line1: address.address_line1,
        address_line2: address.address_line2 || "",
        city: address.city,
        postal_code: address.postal_code,
        country: address.country,
        phone: address.phone || "",
        label: address.label || "",
        is_default: address.is_default,
      });
    } else {
      setFormData({
        name: "",
        address_line1: "",
        address_line2: "",
        city: "",
        postal_code: "",
        country: "Latvia",
        phone: "",
        label: "",
        is_default: false,
      });
    }
    setError(null);
  }, [address, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.name.trim()) {
      setError("Name is required");
      return;
    }
    if (!formData.address_line1.trim()) {
      setError("Address is required");
      return;
    }
    if (!formData.city.trim()) {
      setError("City is required");
      return;
    }
    if (!formData.postal_code.trim()) {
      setError("Postal code is required");
      return;
    }

    try {
      await onSubmit(formData);
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save address");
    }
  };

  const updateField = (field: keyof AddressCreate, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{address ? "Edit Address" : "Add New Address"}</DialogTitle>
          <DialogDescription>
            {address
              ? "Update your delivery address details."
              : "Add a new delivery address to your account."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <Stack gap="group">
            {error && (
              <div className="rounded-md bg-destructive/10 p-3 border border-destructive/20">
                <Text variant="error">{error}</Text>
              </div>
            )}

            <Stack gap="element">
              <Label htmlFor="name">Recipient Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => updateField("name", e.target.value)}
                placeholder="Full name"
                required
              />
            </Stack>

            <Stack gap="element">
              <Label htmlFor="label">Label (optional)</Label>
              <Input
                id="label"
                value={formData.label}
                onChange={(e) => updateField("label", e.target.value)}
                placeholder="e.g., Home, Work"
              />
            </Stack>

            <Stack gap="element">
              <Label htmlFor="address_line1">Address Line 1</Label>
              <Input
                id="address_line1"
                value={formData.address_line1}
                onChange={(e) => updateField("address_line1", e.target.value)}
                placeholder="Street address"
                required
              />
            </Stack>

            <Stack gap="element">
              <Label htmlFor="address_line2">Address Line 2 (optional)</Label>
              <Input
                id="address_line2"
                value={formData.address_line2 || ""}
                onChange={(e) => updateField("address_line2", e.target.value)}
                placeholder="Apartment, suite, etc."
              />
            </Stack>

            <Row gap="group">
              <Stack gap="element" className="flex-1">
                <Label htmlFor="city">City</Label>
                <Input
                  id="city"
                  value={formData.city}
                  onChange={(e) => updateField("city", e.target.value)}
                  placeholder="City"
                  required
                />
              </Stack>
              <Stack gap="element" className="w-32">
                <Label htmlFor="postal_code">Postal Code</Label>
                <Input
                  id="postal_code"
                  value={formData.postal_code}
                  onChange={(e) => updateField("postal_code", e.target.value)}
                  placeholder="LV-1234"
                  required
                />
              </Stack>
            </Row>

            <Stack gap="element">
              <Label htmlFor="country">Country</Label>
              <Input
                id="country"
                value={formData.country}
                onChange={(e) => updateField("country", e.target.value)}
                placeholder="Country"
                required
              />
            </Stack>

            <Stack gap="element">
              <Label htmlFor="phone">Phone (optional)</Label>
              <Input
                id="phone"
                type="tel"
                value={formData.phone || ""}
                onChange={(e) => updateField("phone", e.target.value)}
                placeholder="+371 12345678"
              />
            </Stack>

            <Row gap="element" className="mt-2">
              <input
                type="checkbox"
                id="is_default"
                checked={formData.is_default}
                onChange={(e) => updateField("is_default", e.target.checked)}
                className="size-4 rounded border-border"
              />
              <Label htmlFor="is_default" className="cursor-pointer">
                Set as default address
              </Label>
            </Row>
          </Stack>

          <DialogFooter className="mt-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Saving..." : address ? "Update Address" : "Add Address"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
