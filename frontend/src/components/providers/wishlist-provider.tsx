"use client";

import { useEffect, useState } from "react";
import { getWishlist } from "@/lib/api";
import { useAuthStore, useWishlistStore } from "@/lib/store";

export function WishlistProvider({ children }: { children: React.ReactNode }) {
  const { token, guestSession } = useAuthStore();
  const { setWishlist, setLoading, clearWishlist } = useWishlistStore();
  const [hasMounted, setHasMounted] = useState(false);

  // Wait for client-side hydration before doing anything
  useEffect(() => {
    setHasMounted(true);
  }, []);

  useEffect(() => {
    // Don't run until after hydration
    if (!hasMounted) {
      return;
    }

    const loadWishlist = async () => {
      // Only load if user is authenticated or has a guest session
      if (!token && !guestSession?.session_token) {
        clearWishlist();
        return;
      }

      setLoading(true);
      try {
        const data = await getWishlist(token, guestSession?.session_token);
        setWishlist(data);
      } catch {
        // Silently fail - wishlist will be empty
        // This handles expired tokens or invalid sessions gracefully
        clearWishlist();
      } finally {
        setLoading(false);
      }
    };

    loadWishlist();
  }, [hasMounted, token, guestSession, setWishlist, setLoading, clearWishlist]);

  return <>{children}</>;
}
