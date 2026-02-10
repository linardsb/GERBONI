"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/routing";
import { IconShoppingCart, IconUser, IconMenu2, IconChevronDown, IconHeart, IconSun, IconMoon } from "@/components/icons";
import { Button } from "@/components/elements/button";
import { Badge } from "@/components/elements/badge";
import { Text } from "@/components/elements/text";
import { Stack } from "@/components/elements/stack";
import { Row } from "@/components/elements/row";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/elements/sheet";
import { Container } from "@/components/elements/container";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/elements/dropdown-menu";
import { useAuthStore, useCartStore, useWishlistStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import { LanguageSwitcher } from "@/components/elements/language-switcher";
import { useTheme } from "next-themes";

export function Header() {
  const t = useTranslations("nav");
  const [mounted, setMounted] = useState(false);

  // Wait for client hydration before rendering Radix components to avoid ID mismatch
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- standard hydration pattern
    setMounted(true);
  }, []);
  const { user, logout } = useAuthStore();
  const { cart } = useCartStore();
  const { wishlist } = useWishlistStore();
  const pathname = usePathname();
  const { resolvedTheme, setTheme: setColorMode } = useTheme();

  const mainNavItems = [
    { href: "/products" as const, label: t("shop") },
    { href: "/about" as const, label: t("ourStory") },
  ];

  const infoNavItems = [
    { href: "/shipping" as const, label: t("shipping") },
    { href: "/returns" as const, label: t("returns") },
    { href: "/faq" as const, label: t("faq") },
    { href: "/contact" as const, label: t("contact") },
  ];

  const isActive = (href: string) => pathname === href;
  const isInfoActive = infoNavItems.some((item) => pathname === item.href);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border-subtle bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <Container size="full" className="flex h-16 items-center justify-between">
        {/* Logo + Nav */}
        <Row gap="section" align="center">
          <Link href="/" className="flex items-center">
            <span className="font-[family-name:var(--font-liva)] text-2xl tracking-wide text-foreground">
              ĢĒRBOŅI
            </span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-6" aria-label="Main navigation">
          {mainNavItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn("nav-link", isActive(item.href) && "text-primary")}
              aria-current={isActive(item.href) ? "page" : undefined}
            >
              {item.label}
            </Link>
          ))}

          {/* Info Dropdown - CSS hover */}
          <div className="group/help relative">
            <button
              className={cn(
                "nav-link inline-flex items-center gap-1",
                isInfoActive && "text-primary"
              )}
            >
              {t("help")}
              <IconChevronDown className="size-4" aria-hidden="true" />
            </button>
            <div className="invisible opacity-0 group-hover/help:visible group-hover/help:opacity-100 transition-opacity duration-fast absolute left-1/2 -translate-x-1/2 top-full pt-2">
              <div className="w-48 rounded-md border border-border bg-popover p-1 shadow-md">
                {infoNavItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="flex items-center gap-group uppercase rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground transition-colors duration-fast"
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </nav>
        </Row>

        {/* Actions */}
        <Row gap="element">
          {/* Language Switcher */}
          <LanguageSwitcher />

          {/* Dark Mode Toggle */}
          {mounted && (
            <Button
              variant="ghost"
              size="icon"
              aria-label={resolvedTheme === "dark" ? t("lightMode") : t("darkMode")}
              onClick={() => setColorMode(resolvedTheme === "dark" ? "light" : "dark")}
            >
              {resolvedTheme === "dark" ? (
                <IconSun className="size-5" aria-hidden="true" />
              ) : (
                <IconMoon className="size-5" aria-hidden="true" />
              )}
            </Button>
          )}

          {/* Wishlist */}
          <Button variant="ghost" size="icon" asChild className="relative" aria-label={t("wishlist")}>
            <Link href="/wishlist">
              <IconHeart className="size-5" aria-hidden="true" />
              {wishlist && wishlist.count > 0 && (
                <Badge
                  variant="secondary"
                  className="absolute -right-1 -top-1 size-5 p-0 flex items-center justify-center text-xs"
                >
                  {wishlist.count}
                </Badge>
              )}
            </Link>
          </Button>

          {/* Cart */}
          <Button variant="ghost" size="icon" asChild className="relative" aria-label={t("cart")}>
            <Link href="/cart">
              <IconShoppingCart className="size-5" aria-hidden="true" />
              {cart && cart.item_count > 0 && (
                <Badge
                  className="absolute -right-1 -top-1 size-5 p-0 flex items-center justify-center text-xs"
                >
                  {cart.item_count}
                </Badge>
              )}
            </Link>
          </Button>

          {/* User Menu */}
          {user && mounted ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" aria-label={t("account")}>
                  <IconUser className="size-5" aria-hidden="true" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem asChild>
                  <Link href="/account" className="uppercase">{t("account")}</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/orders" className="uppercase">{t("orders")}</Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={logout} className="uppercase">
                  {t("logout")}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : user ? (
            <Button variant="ghost" size="icon" aria-label={t("account")}>
              <IconUser className="size-5" aria-hidden="true" />
            </Button>
          ) : (
            <Button variant="minimal" asChild size="sm" className="hidden sm:inline-flex text-label text-xs font-bold">
              <Link href="/login">{t("login")}</Link>
            </Button>
          )}

          {/* Mobile Menu - only render Sheet after mount to avoid hydration mismatch */}
          {mounted ? (
            <Sheet>
              <SheetTrigger asChild className="md:hidden">
                <Button variant="ghost" size="icon" aria-label={t("menu")}>
                  <IconMenu2 className="size-5" aria-hidden="true" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-80 p-6">
                <nav aria-label="Mobile navigation">
                  <Stack gap="section" className="mt-4">
                    {/* Main Nav */}
                    <Stack gap="group">
                      <Text variant="muted-sm" className="uppercase tracking-wider">{t("shop")}</Text>
                      {mainNavItems.map((item) => (
                        <Link
                          key={item.href}
                          href={item.href}
                          className={cn("nav-link-mobile", isActive(item.href) && "text-primary")}
                          aria-current={isActive(item.href) ? "page" : undefined}
                        >
                          {item.label}
                        </Link>
                      ))}
                    </Stack>

                    {/* Info Nav */}
                    <Stack gap="group">
                      <Text variant="muted-sm" className="uppercase tracking-wider">{t("help")}</Text>
                      {infoNavItems.map((item) => (
                        <Link
                          key={item.href}
                          href={item.href}
                          className={cn("nav-link-mobile", isActive(item.href) && "text-primary")}
                          aria-current={isActive(item.href) ? "page" : undefined}
                        >
                          {item.label}
                        </Link>
                      ))}
                    </Stack>

                    {/* Auth on mobile */}
                    {!user && (
                      <Stack gap="group">
                        <Text variant="muted-sm" className="uppercase tracking-wider">{t("account")}</Text>
                        <Link href="/login" className="nav-link-mobile">
                          {t("login")} / {t("register")}
                        </Link>
                      </Stack>
                    )}
                  </Stack>
                </nav>
              </SheetContent>
            </Sheet>
          ) : (
            <Button variant="ghost" size="icon" aria-label={t("menu")} className="md:hidden">
              <IconMenu2 className="size-5" aria-hidden="true" />
            </Button>
          )}
        </Row>
      </Container>
    </header>
  );
}
