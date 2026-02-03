"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { IconHeart, IconShoppingCart, IconArrowRight } from "@tabler/icons-react";
import { Container } from "@/components/elements/container";
import { Stack } from "@/components/elements/stack";
import { Row } from "@/components/elements/row";
import { Text } from "@/components/elements/text";
import { Button } from "@/components/elements/button";
import { Card, CardContent } from "@/components/elements/card";
import { Skeleton } from "@/components/elements/skeleton";
import { WishlistButton } from "@/components/elements/wishlist-button";
import { Grid } from "@/components/elements/grid";
import { getWishlist, type WishlistItem } from "@/lib/api";
import { useAuthStore, useWishlistStore } from "@/lib/store";

export default function WishlistPage() {
  const { token, guestSession } = useAuthStore();
  const { wishlist, setWishlist, setLoading, isLoading } = useWishlistStore();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadWishlist = async () => {
      // If no auth, show empty wishlist (session created when adding first item)
      if (!token && !guestSession?.session_token) {
        setWishlist({ items: [], count: 0 });
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const data = await getWishlist(token, guestSession?.session_token);
        setWishlist(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load wishlist");
      } finally {
        setLoading(false);
      }
    };

    loadWishlist();
  }, [token, guestSession, setWishlist, setLoading]);

  if (isLoading) {
    return (
      <Container padding="md">
        <Stack gap="section">
          <Text as="h1" variant="heading-xl">My Wishlist</Text>
          <Grid cols={4} gap="group">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i}>
                <Skeleton className="aspect-square w-full" />
                <CardContent className="p-4">
                  <Skeleton className="h-5 w-3/4" />
                  <Skeleton className="h-4 w-1/2 mt-2" />
                </CardContent>
              </Card>
            ))}
          </Grid>
        </Stack>
      </Container>
    );
  }

  if (error) {
    return (
      <Container padding="md">
        <Stack gap="section" align="center" className="py-page">
          <Text variant="error">{error}</Text>
          <Button onClick={() => window.location.reload()}>Try Again</Button>
        </Stack>
      </Container>
    );
  }

  if (!wishlist || wishlist.items.length === 0) {
    return (
      <Container padding="md">
        <Stack gap="section" align="center" className="py-page">
          <div className="rounded-full bg-muted p-6">
            <IconHeart className="size-12 text-muted-foreground" />
          </div>
          <Stack gap="element" align="center">
            <Text as="h1" variant="heading-lg">Your Wishlist is Empty</Text>
            <Text variant="muted" align="center">
              Save your favorite products to your wishlist to find them easily later.
            </Text>
          </Stack>
          <Button asChild>
            <Link href="/products">
              Browse Products
              <IconArrowRight className="ml-2 size-4" aria-hidden="true" />
            </Link>
          </Button>
        </Stack>
      </Container>
    );
  }

  return (
    <Container padding="md">
      <Stack gap="section">
        <Row justify="between" align="center">
          <Text as="h1" variant="heading-xl">
            My Wishlist ({wishlist.count})
          </Text>
        </Row>

        <Grid cols={4} gap="group">
          {wishlist.items.map((item) => (
            <WishlistItemCard key={item.id} item={item} />
          ))}
        </Grid>
      </Stack>
    </Container>
  );
}

function WishlistItemCard({ item }: { item: WishlistItem }) {
  return (
    <Card className="overflow-hidden group">
      <CardContent className="p-0">
        <Link href={`/products/${item.product.id}`}>
          <div className="relative aspect-square bg-muted flex items-center justify-center p-8">
            {/* Wishlist button */}
            <div className="absolute top-3 left-3 z-10">
              <WishlistButton
                productId={item.product.id}
                productName={item.product.city_name}
                size="icon-sm"
              />
            </div>

            {/* T-shirt mockup */}
            <div className="relative h-full w-full">
              <svg
                viewBox="0 0 100 100"
                className="h-full w-full text-white drop-shadow-md transition-transform duration-300 group-hover:scale-105"
              >
                <path
                  d="M20 25 L35 20 L40 30 L60 30 L65 20 L80 25 L85 40 L75 45 L75 85 L25 85 L25 45 L15 40 Z"
                  fill="currentColor"
                  stroke="#e5e5e5"
                  strokeWidth="1"
                />
              </svg>
              <div className="absolute left-1/2 top-1/2 h-16 w-16 -translate-x-1/2 -translate-y-1/4">
                <Image
                  src={`/coats/${item.product.coat_of_arms_image}`}
                  alt={`${item.product.city_name} coat of arms`}
                  width={64}
                  height={64}
                  className="h-full w-full object-contain drop-shadow-sm"
                  onError={(e) => {
                    e.currentTarget.src = "/coats/placeholder.svg";
                  }}
                />
              </div>
            </div>
          </div>
        </Link>

        <div className="p-4">
          <Link href={`/products/${item.product.id}`}>
            <Text
              as="h3"
              variant="heading-xs"
              className="transition-colors group-hover:text-primary"
            >
              {item.product.city_name}
            </Text>
            <Text variant="muted-sm">{item.product.city_name_lv}</Text>
          </Link>

          <Row justify="between" align="center" className="mt-3">
            {item.product.min_price && (
              <Text variant="price">
                From €{Number(item.product.min_price).toFixed(2)}
              </Text>
            )}
            <Button size="sm" asChild>
              <Link href={`/products/${item.product.id}`}>
                <IconShoppingCart className="mr-1 size-4" aria-hidden="true" />
                View
              </Link>
            </Button>
          </Row>
        </div>
      </CardContent>
    </Card>
  );
}
