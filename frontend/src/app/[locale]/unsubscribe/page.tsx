"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { Container } from "@/components/elements/container";
import { Stack } from "@/components/elements/stack";
import { Text } from "@/components/elements/text";
import { Input } from "@/components/elements/input";
import { Button } from "@/components/elements/button";
import { IconMailOff, IconCheck } from "@tabler/icons-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

export default function UnsubscribePage() {
  const t = useTranslations("newsletter");
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");

  const handleUnsubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setStatus("loading");
    try {
      const res = await fetch(`${API_URL}/newsletter/unsubscribe`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (res.ok) {
        setStatus("success");
      } else {
        setStatus("error");
      }
    } catch {
      setStatus("error");
    }
  };

  if (status === "success") {
    return (
      <Container padding="md" size="sm" className="min-h-[60vh] flex items-center justify-center">
        <Stack data-slot="unsubscribe-success" gap="section" align="center">
          <div className="rounded-full bg-success/10 p-6">
            <IconCheck className="size-12 text-success" aria-hidden="true" />
          </div>
          <Stack gap="element" align="center">
            <Text variant="heading-sm">{t("unsubscribeSuccess")}</Text>
          </Stack>
          <Link href="/">
            <Button variant="outline">{t("backToHome")}</Button>
          </Link>
        </Stack>
      </Container>
    );
  }

  return (
    <Container padding="md" size="sm" className="min-h-[60vh] flex items-center justify-center">
      <Stack data-slot="unsubscribe-form" gap="section" align="center" className="w-full max-w-md">
        <div className="rounded-full bg-muted p-6">
          <IconMailOff className="size-12 text-muted-foreground" aria-hidden="true" />
        </div>
        <Stack gap="element" align="center">
          <Text variant="heading-sm">{t("unsubscribeTitle")}</Text>
          <Text variant="muted" align="center">
            {t("unsubscribeDescription")}
          </Text>
        </Stack>
        <form onSubmit={handleUnsubscribe} className="w-full">
          <Stack gap="group">
            <Input
              type="email"
              placeholder={t("emailPlaceholder")}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              aria-label="Email"
            />
            {status === "error" && (
              <Text variant="error">{t("unsubscribeError")}</Text>
            )}
            <Button type="submit" disabled={status === "loading"} className="w-full">
              {status === "loading" ? "..." : t("unsubscribeButton")}
            </Button>
          </Stack>
        </form>
      </Stack>
    </Container>
  );
}
