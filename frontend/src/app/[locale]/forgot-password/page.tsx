"use client";

import { useState } from "react";
import { Link } from "@/i18n/routing";
import { IconArrowLeft, IconMail, IconCheck } from "@/components/icons";
import { Container } from "@/components/elements/container";
import { Section } from "@/components/elements/section";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/elements/card";
import { Stack } from "@/components/elements/stack";
import { Text } from "@/components/elements/text";
import { Input } from "@/components/elements/input";
import { Label } from "@/components/elements/label";
import { Button } from "@/components/elements/button";
import { toast } from "sonner";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || "Failed to send reset email");
      }

      setSubmitted(true);
    } catch (err) {
      toast.error("Error", {
        description: err instanceof Error ? err.message : "Something went wrong",
      });
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <Section spacing="default">
        <Container size="sm">
          <Card className="max-w-md mx-auto">
            <CardContent className="pt-6">
              <Stack gap="group" align="center">
                <div className="flex size-16 items-center justify-center rounded-full bg-success/10">
                  <IconCheck className="size-8 text-success" aria-hidden="true" />
                </div>
                <Text as="h1" variant="heading-lg" align="center">Check Your Email</Text>
                <Text variant="muted" align="center">
                  If an account exists for <strong>{email}</strong>, we&apos;ve sent instructions to reset your password.
                </Text>
                <Text variant="muted-sm" align="center">
                  The link will expire in 1 hour. If you don&apos;t see the email, check your spam folder.
                </Text>
                <Stack gap="group" className="w-full">
                  <Button variant="outline" asChild className="w-full">
                    <Link href="/login">Back to Login</Link>
                  </Button>
                  <Button
                    variant="ghost"
                    className="w-full"
                    onClick={() => {
                      setSubmitted(false);
                      setEmail("");
                    }}
                  >
                    Try a different email
                  </Button>
                </Stack>
              </Stack>
            </CardContent>
          </Card>
        </Container>
      </Section>
    );
  }

  return (
    <Section spacing="default">
      <Container size="sm">
        <Stack gap="group">
          <Link
            href="/login"
            className="inline-flex items-center gap-element text-muted-foreground hover:text-foreground transition-colors"
          >
            <IconArrowLeft className="size-4" aria-hidden="true" />
            <Text variant="muted-sm">Back to Login</Text>
          </Link>

          <Card className="max-w-md mx-auto">
            <CardHeader className="text-center">
              <Stack gap="group" align="center">
                <div className="flex size-12 items-center justify-center rounded-full bg-primary/10">
                  <IconMail className="size-6 text-primary" aria-hidden="true" />
                </div>
                <CardTitle>Forgot Password?</CardTitle>
                <Text variant="muted">
                  Enter your email address and we&apos;ll send you a link to reset your password.
                </Text>
              </Stack>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit}>
                <Stack gap="group">
                  <Stack gap="element">
                    <Label htmlFor="email">Email Address</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="your@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      autoComplete="email"
                      autoFocus
                    />
                  </Stack>

                  <Button type="submit" size="lg" className="w-full" disabled={loading}>
                    {loading ? "Sending..." : "Send Reset Link"}
                  </Button>

                  <Text variant="muted-sm" align="center">
                    Remember your password?{" "}
                    <Link href="/login" className="text-primary hover:underline">
                      Sign in
                    </Link>
                  </Text>
                </Stack>
              </form>
            </CardContent>
          </Card>
        </Stack>
      </Container>
    </Section>
  );
}
