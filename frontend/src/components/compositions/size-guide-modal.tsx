"use client";

import { useTranslations } from "next-intl";
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
import { IconRuler } from "@/components/icons";

const sizeData = [
  { size: "XS", chest: 86, length: 66, fitKey: "slim" },
  { size: "S", chest: 91, length: 69, fitKey: "standard" },
  { size: "M", chest: 97, length: 72, fitKey: "standard" },
  { size: "L", chest: 102, length: 74, fitKey: "relaxed" },
  { size: "XL", chest: 107, length: 76, fitKey: "relaxed" },
  { size: "XXL", chest: 112, length: 78, fitKey: "relaxed" },
];

interface SizeGuideModalProps {
  trigger?: React.ReactNode;
}

export function SizeGuideModal({ trigger }: SizeGuideModalProps) {
  const t = useTranslations("sizeGuide");

  return (
    <Dialog>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
            <IconRuler className="mr-2 h-4 w-4" />
            {t("title")}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{t("title")}</DialogTitle>
          <DialogDescription>{t("description")}</DialogDescription>
        </DialogHeader>

        <div className="mt-4">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b">
                  <th className="py-3 px-2 text-left text-sm font-semibold">{t("table.size")}</th>
                  <th className="py-3 px-2 text-center text-sm font-semibold">{t("table.chest")}</th>
                  <th className="py-3 px-2 text-center text-sm font-semibold">{t("table.length")}</th>
                  <th className="py-3 px-2 text-right text-sm font-semibold">{t("table.fit")}</th>
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
                      <Text variant="muted-sm">{t(`fits.${row.fitKey}`)}</Text>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <Stack gap="sm" className="mt-6 p-4 bg-muted/50 rounded-lg">
            <Text variant="heading-xs">{t("howToMeasure")}</Text>
            <div className="grid gap-2">
              <div className="flex items-start gap-2">
                <span className="text-primary font-bold">{t("chest")}:</span>
                <Text variant="muted-sm">{t("chestTip")}</Text>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-primary font-bold">{t("length")}:</span>
                <Text variant="muted-sm">{t("lengthTip")}</Text>
              </div>
            </div>
          </Stack>

          <Stack gap="xs" className="mt-4">
            <Text variant="muted-sm">
              <strong>{t("tip")}:</strong> {t("tipText")}
            </Text>
            <Text variant="muted-sm">
              <strong>{t("betweenSizes")}:</strong> {t("betweenSizesText")}
            </Text>
          </Stack>
        </div>
      </DialogContent>
    </Dialog>
  );
}
