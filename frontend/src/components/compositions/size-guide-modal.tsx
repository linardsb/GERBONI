"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/elements/dialog";
import { Button } from "@/components/elements/button";
import { Text } from "@/components/elements/text";
import { Stack } from "@/components/elements/stack";
import { Badge } from "@/components/elements/badge";
import { IconRuler } from "@tabler/icons-react";

const sizeData = [
  { size: "XS", chest: 86, length: 66, fit: "Slim" },
  { size: "S", chest: 91, length: 69, fit: "Standard" },
  { size: "M", chest: 97, length: 72, fit: "Standard" },
  { size: "L", chest: 102, length: 74, fit: "Relaxed" },
  { size: "XL", chest: 107, length: 76, fit: "Relaxed" },
  { size: "XXL", chest: 112, length: 78, fit: "Relaxed" },
];

interface SizeGuideModalProps {
  trigger?: React.ReactNode;
}

export function SizeGuideModal({ trigger }: SizeGuideModalProps) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
            <IconRuler className="mr-2 h-4 w-4" />
            Size Guide
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Size Guide</DialogTitle>
          <DialogDescription>
            All measurements are in centimeters. For a relaxed fit, we recommend sizing up.
          </DialogDescription>
        </DialogHeader>

        <div className="mt-4">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b">
                  <th className="py-3 px-2 text-left text-sm font-semibold">Size</th>
                  <th className="py-3 px-2 text-center text-sm font-semibold">Chest (cm)</th>
                  <th className="py-3 px-2 text-center text-sm font-semibold">Length (cm)</th>
                  <th className="py-3 px-2 text-right text-sm font-semibold">Fit</th>
                </tr>
              </thead>
              <tbody>
                {sizeData.map((row, index) => (
                  <tr
                    key={row.size}
                    className={index !== sizeData.length - 1 ? "border-b" : ""}
                  >
                    <td className="py-3 px-2">
                      <Badge variant="outline">{row.size}</Badge>
                    </td>
                    <td className="py-3 px-2 text-center text-muted-foreground">{row.chest}</td>
                    <td className="py-3 px-2 text-center text-muted-foreground">{row.length}</td>
                    <td className="py-3 px-2 text-right">
                      <Text variant="muted-sm">{row.fit}</Text>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <Stack gap="sm" className="mt-6 p-4 bg-muted/50 rounded-lg">
            <Text variant="heading-xs">How to Measure</Text>
            <div className="grid gap-2">
              <div className="flex items-start gap-2">
                <span className="text-primary font-bold">Chest:</span>
                <Text variant="muted-sm">
                  Measure around the fullest part of your chest, keeping the tape level.
                </Text>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-primary font-bold">Length:</span>
                <Text variant="muted-sm">
                  Measure from the highest point of the shoulder to the bottom hem.
                </Text>
              </div>
            </div>
          </Stack>

          <Stack gap="xs" className="mt-4">
            <Text variant="muted-sm">
              <strong>Tip:</strong> Our shirts are pre-shrunk, so what you see is what you get.
            </Text>
            <Text variant="muted-sm">
              <strong>Between sizes?</strong> We recommend going with the larger size for a more comfortable fit.
            </Text>
          </Stack>
        </div>
      </DialogContent>
    </Dialog>
  );
}
