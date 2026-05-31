"use client";

import { useEffect, useRef, useState } from "react";
import { Skeleton } from "@/components/elements/skeleton";
import { Stack } from "@/components/elements/stack";
import { AdminSidebar } from "@/components/admin/sidebar";
import { getMe, login } from "@/lib/api";
import { useAuthStore } from "@/lib/store";

const DEMO_ADMIN_EMAIL = "linardsberzins@gmail.com";
const DEMO_ADMIN_PASSWORD = "admin123";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const setAuth = useAuthStore((s) => s.setAuth);
  const tokenRef = useRef<string | null>(useAuthStore.getState().token);
  const [ready, setReady] = useState(false);
  const ranRef = useRef(false);

  useEffect(() => {
    const meta = document.createElement("meta");
    meta.name = "robots";
    meta.content = "noindex, nofollow";
    document.head.appendChild(meta);
    return () => {
      document.head.removeChild(meta);
    };
  }, []);

  useEffect(() => {
    if (ranRef.current) return;
    ranRef.current = true;

    const trySetup = async () => {
      console.log("[admin-layout] mount, token from store:", tokenRef.current ? "present" : "none");
      const existing = tokenRef.current;
      if (existing) {
        try {
          const user = await getMe(existing);
          console.log("[admin-layout] existing token verified, role=", user.role);
          if (user.role === "admin" || user.role === "super_admin") {
            setAuth(existing, user);
            setReady(true);
            return;
          }
        } catch (e) {
          console.log("[admin-layout] existing token failed verify, falling back to auto-login", e);
        }
      }
      try {
        console.log("[admin-layout] auto-login as", DEMO_ADMIN_EMAIL);
        const res = await login(DEMO_ADMIN_EMAIL, DEMO_ADMIN_PASSWORD);
        const user = await getMe(res.access_token);
        console.log("[admin-layout] auto-login succeeded, role=", user.role);
        setAuth(res.access_token, user);
        setReady(true);
      } catch (err) {
        console.error("[admin-layout] auto-login failed:", err);
      }
    };

    trySetup();
  }, [setAuth]);

  if (!ready) {
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

  return (
    <div className="flex min-h-screen">
      <AdminSidebar />
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  );
}
