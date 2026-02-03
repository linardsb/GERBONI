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
import { login, register, getMe } from "@/lib/api";
import { useAuthStore } from "@/lib/store";
import { toast } from "sonner";

export default function LoginPage() {
  const t = useTranslations("auth");
  const tCommon = useTranslations("common");
  const tCheckout = useTranslations("checkout");
  const router = useRouter();
  const { setAuth } = useAuthStore();

  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isLogin) {
        const { access_token } = await login(email, password);
        const user = await getMe(access_token);
        setAuth(access_token, user);
        toast.success(t("loginSuccess"));
        router.push("/");
      } else {
        await register(email, password);
        const { access_token } = await login(email, password);
        const user = await getMe(access_token);
        setAuth(access_token, user);
        toast.success(t("registerSuccess"));
        router.push("/");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : tCommon("error"));
    } finally {
      setLoading(false);
    }
  };

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
