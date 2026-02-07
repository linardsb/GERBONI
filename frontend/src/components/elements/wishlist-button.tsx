"use client";

import { useState, useEffect } from "react";
import { IconHeart, IconHeartFilled } from "@/components/icons";
import { Button } from "@/components/elements/button";
import { cn } from "@/lib/utils";
import {
  addToWishlist,
  removeFromWishlist,
  createGuestSession,
} from "@/lib/api";
import { useAuthStore, useWishlistStore } from "@/lib/store";
import { toast } from "sonner";
import { useTranslations } from "next-intl";

interface WishlistButtonProps {
  productId: number;
  productName?: string;
  size?: "icon" | "icon-sm" | "icon-xs";
  variant?: "ghost" | "outline" | "default";
  className?: string;
}

export function WishlistButton({
  productId,
  productName,
  size = "icon",
  variant = "ghost",
  className,
}: WishlistButtonProps) {
  const t = useTranslations("wishlist");
  const { token, guestSession, setGuestSession } = useAuthStore();
  const { isInWishlist, setWishlist, productIds } = useWishlistStore();
  const [isLoading, setIsLoading] = useState(false);
  const [inWishlist, setInWishlist] = useState(false);

  // Sync with store - depend on productIds to re-run when wishlist changes
  useEffect(() => {
    setInWishlist(isInWishlist(productId));
  }, [isInWishlist, productId, productIds]);

  const handleToggle = async (e: React.MouseEvent) => {
    e.preventDefault(); // Prevent link navigation if inside a card
    e.stopPropagation();

    setIsLoading(true);

    try {
      let session = guestSession;
      if (!token && !session) {
        session = await createGuestSession();
        setGuestSession(session);
      }

      if (inWishlist) {
        const wishlist = await removeFromWishlist(
          productId,
          token,
          session?.session_token
        );
        setWishlist(wishlist);
        toast.success(t("removedFromWishlist"), {
          description: productName,
        });
      } else {
        const wishlist = await addToWishlist(
          productId,
          token,
          session?.session_token
        );
        setWishlist(wishlist);
        toast.success(t("addedToWishlist"), {
          description: productName,
        });
      }
    } catch (err) {
      toast.error(t("failedToUpdate"), {
        description: err instanceof Error ? err.message : undefined,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      size={size}
      variant={variant}
      onClick={handleToggle}
      disabled={isLoading}
      aria-label={inWishlist ? "Remove from wishlist" : "Add to wishlist"}
      aria-pressed={inWishlist}
      className={cn(
        "transition-colors bg-transparent hover:bg-transparent p-0 h-auto w-auto",
        inWishlist && "text-red-brand hover:text-red-brand/80",
        className
      )}
    >
      {inWishlist ? (
        <IconHeartFilled
          className={cn(
            size === "icon-xs" ? "size-3" : size === "icon-sm" ? "size-4" : "size-5",
            "text-red-brand"
          )}
          aria-hidden="true"
        />
      ) : (
        <IconHeart
          className={cn(
            size === "icon-xs" ? "size-3" : size === "icon-sm" ? "size-4" : "size-5"
          )}
          aria-hidden="true"
        />
      )}
    </Button>
  );
}
