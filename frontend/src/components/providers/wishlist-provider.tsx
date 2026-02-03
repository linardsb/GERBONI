"use client";

import { useEffect } from "react";
import { getWishlist } from "@/lib/api";
import { useAuthStore, useWishlistStore } from "@/lib/store";

export function WishlistProvider({ children }: { children: React.ReactNode }) {
  const { token, guestSession } = useAuthStore();
  const { setWishlist, setLoading } = useWishlistStore();

  useEffect(() => {
    const loadWishlist = async () => {
      // Only load if user is authenticated or has a guest session
      if (!token && !guestSession) {
        return;
      }

      setLoading(true);
      try {
        const data = await getWishlist(token, guestSession?.session_token);
        setWishlist(data);
      } catch (err) {
        // Silently fail - wishlist will be empty
        console.error("Failed to load wishlist:", err);
      } finally {
        setLoading(false);
      }
    };

    loadWishlist();
  }, [token, guestSession, setWishlist, setLoading]);

  return <>{children}</>;
}
