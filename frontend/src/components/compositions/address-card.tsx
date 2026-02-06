"use client";

import { IconMapPin, IconEdit, IconTrash, IconStar, IconStarFilled } from "@/components/icons";
import { Button } from "@/components/elements/button";
import { Badge } from "@/components/elements/badge";
import { Card, CardContent } from "@/components/elements/card";
import { Row } from "@/components/elements/row";
import { Stack } from "@/components/elements/stack";
import { Text } from "@/components/elements/text";
import type { Address } from "@/lib/api";

interface AddressCardProps {
  address: Address;
  onEdit: (address: Address) => void;
  onDelete: (address: Address) => void;
  onSetDefault: (address: Address) => void;
}

export function AddressCard({
  address,
  onEdit,
  onDelete,
  onSetDefault,
}: AddressCardProps) {
  return (
    <Card data-slot="address-card">
      <CardContent padding="md" className="py-6">
        <Row justify="between" align="start">
          <Row gap="group" align="start">
            <div className="size-10 rounded-full bg-muted flex items-center justify-center shrink-0">
              <IconMapPin className="size-5 text-muted-foreground" aria-hidden="true" />
            </div>
            <Stack gap="element">
              <Row gap="element">
                <Text as="span" variant="body-md" className="font-medium">
                  {address.name}
                </Text>
                {address.label && (
                  <Badge variant="secondary">{address.label}</Badge>
                )}
                {address.is_default && (
                  <Badge variant="default">Default</Badge>
                )}
              </Row>
              <Stack gap="none">
                <Text variant="body-sm">{address.address_line1}</Text>
                {address.address_line2 && (
                  <Text variant="body-sm">{address.address_line2}</Text>
                )}
                <Text variant="body-sm">
                  {address.city}, {address.postal_code}
                </Text>
                <Text variant="body-sm">{address.country}</Text>
                {address.phone && (
                  <Text variant="muted-sm" className="mt-1">
                    {address.phone}
                  </Text>
                )}
              </Stack>
            </Stack>
          </Row>
          <Row gap="element">
            {!address.is_default && (
              <Button
                size="icon-sm"
                variant="ghost"
                onClick={() => onSetDefault(address)}
                aria-label="Set as default address"
              >
                <IconStar className="size-4" aria-hidden="true" />
              </Button>
            )}
            {address.is_default && (
              <Button
                size="icon-sm"
                variant="ghost"
                disabled
                aria-label="Default address"
              >
                <IconStarFilled className="size-4 text-primary" aria-hidden="true" />
              </Button>
            )}
            <Button
              size="icon-sm"
              variant="ghost"
              onClick={() => onEdit(address)}
              aria-label="Edit address"
            >
              <IconEdit className="size-4" aria-hidden="true" />
            </Button>
            <Button
              size="icon-sm"
              variant="ghost"
              onClick={() => onDelete(address)}
              aria-label="Delete address"
            >
              <IconTrash className="size-4" aria-hidden="true" />
            </Button>
          </Row>
        </Row>
      </CardContent>
    </Card>
  );
}
