"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Link, useRouter } from "@/i18n/routing";
import { IconLock, IconCheck, IconX, IconEye, IconEyeOff } from "@/components/icons";
import { Container } from "@/components/elements/container";
import { Section } from "@/components/elements/section";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/elements/card";
import { Row } from "@/components/elements/row";
import { Stack } from "@/components/elements/stack";
import { Text } from "@/components/elements/text";
import { Input } from "@/components/elements/input";
import { Label } from "@/components/elements/label";
import { Button } from "@/components/elements/button";
import { Skeleton } from "@/components/elements/skeleton";
import { toast } from "sonner";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

function ResetPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(true);
  const [tokenValid, setTokenValid] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!token) {
      setVerifying(false);
      return;
    }

    // Verify the token
    fetch(`${API_URL}/auth/verify-reset-token?token=${encodeURIComponent(token)}`)
      .then((res) => res.json())
      .then((data) => {
        setTokenValid(data.valid);
      })
      .catch(() => {
        setTokenValid(false);
      })
      .finally(() => {
        setVerifying(false);
      });
  }, [token]);

  const passwordRequirements = [
    { label: "At least 8 characters", valid: password.length >= 8 },
    { label: "One uppercase letter", valid: /[A-Z]/.test(password) },
    { label: "One lowercase letter", valid: /[a-z]/.test(password) },
    { label: "One number", valid: /\d/.test(password) },
  ];

  const allRequirementsMet = passwordRequirements.every((r) => r.valid);
  const passwordsMatch = password === confirmPassword && password.length > 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!allRequirementsMet) {
      toast.error("Password requirements not met");
      return;
    }

    if (!passwordsMatch) {
      toast.error("Passwords do not match");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || "Failed to reset password");
      }

      setSuccess(true);
      setTimeout(() => {
        router.push("/login");
      }, 3000);
    } catch (err) {
      toast.error("Error", {
        description: err instanceof Error ? err.message : "Something went wrong",
      });
    } finally {
      setLoading(false);
    }
  };

  if (verifying) {
    return (
      <Section spacing="default">
        <Container size="sm">
          <Card className="max-w-md mx-auto">
            <CardContent className="pt-6">
              <Stack gap="md" className="items-center">
                <Skeleton className="h-16 w-16 rounded-full" />
                <Skeleton className="h-8 w-48" />
                <Skeleton className="h-4 w-64" />
              </Stack>
            </CardContent>
          </Card>
        </Container>
      </Section>
    );
  }

  if (!token || !tokenValid) {
    return (
      <Section spacing="default">
        <Container size="sm">
          <Card className="max-w-md mx-auto">
            <CardContent className="pt-6">
              <Stack gap="group" align="center">
                <div className="flex size-16 items-center justify-center rounded-full bg-destructive/10">
                  <IconX className="size-8 text-destructive" aria-hidden="true" />
                </div>
                <Text as="h1" variant="heading-lg" align="center">Invalid or Expired Link</Text>
                <Text variant="muted" align="center">
                  This password reset link is invalid or has expired. Please request a new one.
                </Text>
                <Button asChild>
                  <Link href="/forgot-password">Request New Link</Link>
                </Button>
              </Stack>
            </CardContent>
          </Card>
        </Container>
      </Section>
    );
  }

  if (success) {
    return (
      <Section spacing="default">
        <Container size="sm">
          <Card className="max-w-md mx-auto">
            <CardContent className="pt-6">
              <Stack gap="group" align="center">
                <div className="flex size-16 items-center justify-center rounded-full bg-success/10">
                  <IconCheck className="size-8 text-success" aria-hidden="true" />
                </div>
                <Text as="h1" variant="heading-lg" align="center">Password Reset!</Text>
                <Text variant="muted" align="center">
                  Your password has been successfully reset. Redirecting you to login...
                </Text>
                <Button asChild>
                  <Link href="/login">Go to Login</Link>
                </Button>
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
        <Card className="max-w-md mx-auto">
          <CardHeader className="text-center">
            <Stack gap="group" align="center">
              <div className="flex size-12 items-center justify-center rounded-full bg-primary/10">
                <IconLock className="size-6 text-primary" aria-hidden="true" />
              </div>
              <CardTitle>Reset Your Password</CardTitle>
              <Text variant="muted">
                Enter your new password below.
              </Text>
            </Stack>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit}>
              <Stack gap="group">
                <Stack gap="element">
                  <Label htmlFor="password">New Password</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter new password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      autoComplete="new-password"
                      autoFocus
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      aria-label={showPassword ? "Hide password" : "Show password"}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showPassword ? (
                        <IconEyeOff className="size-4" aria-hidden="true" />
                      ) : (
                        <IconEye className="size-4" aria-hidden="true" />
                      )}
                    </button>
                  </div>
                </Stack>

                {/* Password requirements */}
                <Stack gap="xs">
                  {passwordRequirements.map((req) => (
                    <Row key={req.label} gap="element" className="text-sm">
                      {req.valid ? (
                        <IconCheck className="size-4 text-success" aria-hidden="true" />
                      ) : (
                        <div className="size-4 rounded-full border border-muted-foreground" aria-hidden="true" />
                      )}
                      <span className={req.valid ? "text-success" : "text-muted-foreground"}>
                        {req.label}
                      </span>
                    </Row>
                  ))}
                </Stack>

                <Stack gap="element">
                  <Label htmlFor="confirmPassword">Confirm Password</Label>
                  <Input
                    id="confirmPassword"
                    type={showPassword ? "text" : "password"}
                    placeholder="Confirm new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    autoComplete="new-password"
                    aria-invalid={confirmPassword && !passwordsMatch ? true : undefined}
                  />
                  {confirmPassword && !passwordsMatch && (
                    <Text variant="error">Passwords do not match</Text>
                  )}
                </Stack>

                <Button
                  type="submit"
                  size="lg"
                  className="w-full"
                  disabled={loading || !allRequirementsMet || !passwordsMatch}
                >
                  {loading ? "Resetting..." : "Reset Password"}
                </Button>
              </Stack>
            </form>
          </CardContent>
        </Card>
      </Container>
    </Section>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <Section spacing="default">
        <Container size="sm">
          <Card className="max-w-md mx-auto">
            <CardContent className="pt-6">
              <Stack gap="md" className="items-center">
                <Skeleton className="h-16 w-16 rounded-full" />
                <Skeleton className="h-8 w-48" />
                <Skeleton className="h-4 w-64" />
              </Stack>
            </CardContent>
          </Card>
        </Container>
      </Section>
    }>
      <ResetPasswordContent />
    </Suspense>
  );
}
