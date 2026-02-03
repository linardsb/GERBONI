"use client";

import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/routing";
import { IconShoppingCart, IconUser, IconMenu2, IconChevronDown, IconTruck, IconPhone, IconQuestionMark, IconRefresh, IconHeart } from "@tabler/icons-react";
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

export function Header() {
  const t = useTranslations("nav");
  const { user, logout } = useAuthStore();
  const { cart } = useCartStore();
  const { wishlist } = useWishlistStore();
  const pathname = usePathname();

  const mainNavItems = [
    { href: "/products" as const, label: t("shop") },
    { href: "/about" as const, label: t("ourStory") },
  ];

  const infoNavItems = [
    { href: "/shipping" as const, label: t("shipping"), icon: IconTruck },
    { href: "/returns" as const, label: t("returns"), icon: IconRefresh },
    { href: "/faq" as const, label: t("faq"), icon: IconQuestionMark },
    { href: "/contact" as const, label: t("contact"), icon: IconPhone },
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

          {/* Info Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className={cn(
                  "nav-link inline-flex items-center gap-1",
                  isInfoActive && "text-primary"
                )}
              >
                {t("help")}
                <IconChevronDown className="size-4" aria-hidden="true" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="center" className="w-48">
              {infoNavItems.map((item) => (
                <DropdownMenuItem key={item.href} asChild>
                  <Link href={item.href} className="flex items-center gap-group">
                    <item.icon className="size-4 text-muted-foreground" aria-hidden="true" />
                    {item.label}
                  </Link>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </nav>
        </Row>

        {/* Actions */}
        <Row gap="element">
          {/* Language Switcher */}
          <LanguageSwitcher />

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
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" aria-label={t("account")}>
                  <IconUser className="size-5" aria-hidden="true" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem asChild>
                  <Link href="/account">{t("account")}</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/orders">{t("orders")}</Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={logout}>
                  {t("logout")}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button variant="minimal" asChild size="sm" className="hidden sm:inline-flex text-label text-xs">
              <Link href="/login">{t("login")}</Link>
            </Button>
          )}

          {/* Mobile Menu */}
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
                        className={cn("nav-link-mobile flex items-center gap-group", isActive(item.href) && "text-primary")}
                        aria-current={isActive(item.href) ? "page" : undefined}
                      >
                        <item.icon className="size-4 text-muted-foreground" aria-hidden="true" />
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
        </Row>
      </Container>
    </header>
  );
}
