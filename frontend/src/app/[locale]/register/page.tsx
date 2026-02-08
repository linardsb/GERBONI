"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Link, useRouter } from "@/i18n/routing";
import { Button } from "@/components/elements/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/elements/card";
import { Input } from "@/components/elements/input";
import { Label } from "@/components/elements/label";
import { Container } from "@/components/elements/container";
import { Row } from "@/components/elements/row";
import { Stack } from "@/components/elements/stack";
import { Text } from "@/components/elements/text";
import { login, register, getMe, verify2FA } from "@/lib/api";
import { useAuthStore } from "@/lib/store";
import { toast } from "sonner";

export default function RegisterPage() {
  const t = useTranslations("auth");
  const tCommon = useTranslations("common");
  const tCheckout = useTranslations("checkout");
  const router = useRouter();
  const { setAuth } = useAuthStore();

  const [isLogin, setIsLogin] = useState(false); // Default to register mode
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  // 2FA state
  const [needs2FA, setNeeds2FA] = useState(false);
  const [tempToken, setTempToken] = useState<string | null>(null);
  const [twoFACode, setTwoFACode] = useState("");
  const [useBackup, setUseBackup] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isLogin) {
        const result = await login(email, password);

        if (result.requires_2fa && result.temp_token) {
          setTempToken(result.temp_token);
          setNeeds2FA(true);
          setLoading(false);
          return;
        }

        if (result.access_token) {
          const user = await getMe(result.access_token);
          setAuth(result.access_token, user);
          toast.success(t("loginSuccess"));
          router.push("/");
        }
      } else {
        await register(email, password);
        const result = await login(email, password);
        if (result.access_token) {
          const user = await getMe(result.access_token);
          setAuth(result.access_token, user);
          toast.success(t("registerSuccess"));
          router.push("/");
        }
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : tCommon("error"));
    } finally {
      setLoading(false);
    }
  };

  const handle2FAVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tempToken) return;
    setLoading(true);

    try {
      const result = await verify2FA(tempToken, twoFACode);
      if (result.access_token) {
        const user = await getMe(result.access_token);
        setAuth(result.access_token, user);
        toast.success(t("loginSuccess"));
        router.push("/");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("invalidCode"));
    } finally {
      setLoading(false);
    }
  };

  // 2FA verification step
  if (needs2FA) {
    return (
      <Container padding="md" className="flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle>
              <Text as="span" variant="heading-md">
                {t("twoFactorTitle")}
              </Text>
            </CardTitle>
            <CardDescription>
              {useBackup ? t("enterBackupCode") : t("enterAuthCode")}
            </CardDescription>
          </CardHeader>
          <form onSubmit={handle2FAVerify}>
            <CardContent>
              <Stack gap="group">
                <Stack gap="element">
                  <Label htmlFor="2fa-code">
                    {useBackup ? t("backupCode") : t("verificationCode")}
                  </Label>
                  <Input
                    id="2fa-code"
                    type="text"
                    required
                    value={twoFACode}
                    onChange={(e) => setTwoFACode(e.target.value)}
                    placeholder={useBackup ? "ABCD1234" : "123456"}
                    maxLength={useBackup ? 8 : 6}
                    autoComplete="one-time-code"
                    autoFocus
                    className="text-center text-lg tracking-widest"
                  />
                </Stack>
              </Stack>
            </CardContent>
            <CardFooter>
              <Stack gap="group" className="w-full" align="center">
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? tCommon("loading") : t("verify")}
                </Button>
                <Text
                  as="span"
                  variant="link-primary"
                  onClick={() => {
                    setUseBackup(!useBackup);
                    setTwoFACode("");
                  }}
                  className="cursor-pointer"
                >
                  {useBackup ? t("useAuthenticator") : t("useBackupCode")}
                </Text>
                <Text
                  as="span"
                  variant="link-primary"
                  onClick={() => {
                    setNeeds2FA(false);
                    setTempToken(null);
                    setTwoFACode("");
                  }}
                  className="cursor-pointer"
                >
                  {t("backToLogin")}
                </Text>
              </Stack>
            </CardFooter>
          </form>
        </Card>
      </Container>
    );
  }

  return (
    <Container padding="md" className="flex items-center justify-center">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle>
            <Text as="span" variant="heading-md">
              {isLogin ? t("loginTitle") : t("registerTitle")}
            </Text>
          </CardTitle>
          <CardDescription>
            {isLogin ? t("loginDescription") : t("registerDescription")}
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent>
            <Stack gap="group">
              <Stack gap="element">
                <Label htmlFor="email">{t("email")}</Label>
                <Input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                />
              </Stack>
              <Stack gap="element">
                <Row justify="between">
                  <Label htmlFor="password">{t("password")}</Label>
                  {isLogin && (
                    <Link href="/forgot-password" className="text-sm text-primary hover:underline">
                      {t("forgotPassword")}
                    </Link>
                  )}
                </Row>
                <Input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  minLength={6}
                />
              </Stack>
            </Stack>
          </CardContent>
          <CardFooter>
            <Stack gap="group" className="w-full" align="center">
              <Button type="submit" className="w-full" disabled={loading}>
                {loading
                  ? tCommon("loading")
                  : isLogin
                  ? t("signIn")
                  : t("register")}
              </Button>
              <Text variant="muted-sm">
                {isLogin ? t("noAccount") : t("hasAccount")}{" "}
                <Text
                  as="span"
                  variant="link-primary"
                  onClick={() => setIsLogin(!isLogin)}
                  className="cursor-pointer"
                >
                  {isLogin ? t("signUp") : t("signIn")}
                </Text>
              </Text>
              <Link href="/products" className="footer-link">
                {tCheckout("guestCheckout")}
              </Link>
            </Stack>
          </CardFooter>
        </form>
      </Card>
    </Container>
  );
}
