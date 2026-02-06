"use client";

import { useEffect, useState } from "react";
import { useRouter } from "@/i18n/routing";
import { IconLock } from "@/components/icons";
import { Skeleton } from "@/components/elements/skeleton";
import { Container } from "@/components/elements/container";
import { Stack } from "@/components/elements/stack";
import { EmptyState } from "@/components/compositions/empty-state";
import { AdminSidebar } from "@/components/admin/sidebar";
import { getMe } from "@/lib/api";
import { useAuthStore } from "@/lib/store";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { token, setAuth } = useAuthStore();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const checkAdmin = async () => {
      if (!token) {
        router.push("/login?redirect=/admin");
        return;
      }

      try {
        const userData = await getMe(token);
        setAuth(token, userData);

        // Check if user has admin role
        if (userData.role === "admin" || userData.role === "super_admin") {
          setIsAdmin(true);
        } else {
          setIsAdmin(false);
        }
      } catch {
        router.push("/login?redirect=/admin");
      } finally {
        setLoading(false);
      }
    };

    checkAdmin();
  }, [token, router, setAuth]);

  if (loading) {
    return (
      <div className="flex min-h-screen">
        <div className="w-64 border-r border-border bg-surface-muted p-6">
          <Stack gap="section">
            <Skeleton className="h-8 w-32" />
            <Stack gap="element">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </Stack>
          </Stack>
        </div>
        <div className="flex-1 p-8">
          <Stack gap="section">
            <Skeleton className="h-8 w-48" />
            <div className="grid grid-cols-4 gap-group">
              <Skeleton className="h-32 w-full" />
              <Skeleton className="h-32 w-full" />
              <Skeleton className="h-32 w-full" />
              <Skeleton className="h-32 w-full" />
            </div>
          </Stack>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <Container padding="md" size="md" className="min-h-screen flex items-center justify-center">
        <EmptyState
          icon={IconLock}
          title="Access Denied"
          description="You don't have permission to access the admin panel."
        />
      </Container>
    );
  }

  return (
    <div className="flex min-h-screen">
      <AdminSidebar />
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  );
}
