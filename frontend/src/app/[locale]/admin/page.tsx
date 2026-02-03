"use client";

import { useEffect } from "react";
import { useRouter } from "@/i18n/routing";

export default function AdminPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/admin/dashboard");
  }, [router]);

  return null;
}
