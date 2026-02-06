"use client";

import { Link, usePathname } from "@/i18n/routing";
import {
  IconLayoutDashboard,
  IconPackage,
  IconShirt,
  IconUsers,
  IconChevronLeft,
} from "@/components/icons";
import { Button } from "@/components/elements/button";
import { Stack } from "@/components/elements/stack";
import { Text } from "@/components/elements/text";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/admin/dashboard", label: "Dashboard", icon: IconLayoutDashboard },
  { href: "/admin/orders", label: "Orders", icon: IconPackage },
  { href: "/admin/products", label: "Products", icon: IconShirt },
  { href: "/admin/users", label: "Users", icon: IconUsers },
];

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside
      className="w-64 shrink-0 border-r border-border bg-surface-muted h-screen sticky top-0"
      data-slot="admin-sidebar"
    >
      <Stack gap="section" className="p-6">
        {/* Header */}
        <div>
          <Link href="/" className="flex items-center gap-element text-muted-foreground hover:text-foreground transition-colors">
            <IconChevronLeft className="size-4" aria-hidden="true" />
            <Text as="span" variant="body-sm">Back to Store</Text>
          </Link>
          <Text as="h1" variant="heading-md" className="mt-4">
            Admin Panel
          </Text>
        </div>

        {/* Navigation */}
        <nav aria-label="Admin navigation">
          <Stack gap="element">
            {navItems.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-group px-4 py-3 rounded-lg transition-colors",
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                  aria-current={isActive ? "page" : undefined}
                >
                  <item.icon className="size-5" aria-hidden="true" />
                  <Text as="span" variant="body-sm" className="font-medium">
                    {item.label}
                  </Text>
                </Link>
              );
            })}
          </Stack>
        </nav>
      </Stack>
    </aside>
  );
}
