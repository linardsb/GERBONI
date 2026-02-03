"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
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

export function Header() {
  const { user, logout } = useAuthStore();
  const { cart } = useCartStore();
  const { wishlist } = useWishlistStore();
  const pathname = usePathname();

  const mainNavItems = [
    { href: "/products", label: "Shop" },
    { href: "/about", label: "Our Story" },
  ];

  const infoNavItems = [
    { href: "/shipping", label: "Shipping", icon: IconTruck },
    { href: "/returns", label: "Returns", icon: IconRefresh },
    { href: "/faq", label: "FAQ", icon: IconQuestionMark },
    { href: "/contact", label: "Contact", icon: IconPhone },
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
                Help
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
          {/* Wishlist */}
          <Button variant="ghost" size="icon" asChild className="relative" aria-label="Wishlist">
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
          <Button variant="ghost" size="icon" asChild className="relative" aria-label="Shopping cart">
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
                <Button variant="ghost" size="icon" aria-label="Account menu">
                  <IconUser className="size-5" aria-hidden="true" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem asChild>
                  <Link href="/account">Account Settings</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/orders">My Orders</Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={logout}>
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button variant="minimal" asChild size="sm" className="hidden sm:inline-flex text-label text-xs">
              <Link href="/login">Login</Link>
            </Button>
          )}

          {/* Mobile Menu */}
          <Sheet>
            <SheetTrigger asChild className="md:hidden">
              <Button variant="ghost" size="icon" aria-label="Open menu">
                <IconMenu2 className="size-5" aria-hidden="true" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-80 p-6">
              <nav aria-label="Mobile navigation">
                <Stack gap="section" className="mt-4">
                  {/* Main Nav */}
                  <Stack gap="group">
                    <Text variant="muted-sm" className="uppercase tracking-wider">Shop</Text>
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
                    <Text variant="muted-sm" className="uppercase tracking-wider">Help & Info</Text>
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
                      <Text variant="muted-sm" className="uppercase tracking-wider">Account</Text>
                      <Link href="/login" className="nav-link-mobile">
                        Login / Register
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
