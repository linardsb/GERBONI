"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Card, CardContent } from "@/components/elements/card";
import { Text } from "@/components/elements/text";
import { Stack } from "@/components/elements/stack";
import { Grid } from "@/components/elements/grid";
import { Skeleton } from "@/components/elements/skeleton";
import { WishlistButton } from "@/components/elements/wishlist-button";
import {
  getRelatedProducts,
  getPopularProducts,
  getFrequentlyBoughtTogether,
  type RecommendedProduct,
} from "@/lib/api";

type RecommendationType = "related" | "popular" | "frequently-bought";

interface ProductRecommendationsProps {
  /** Type of recommendations to show */
  type: RecommendationType;
  /** Product ID for related/frequently-bought recommendations */
  productId?: number;
  /** Title to display above recommendations */
  title?: string;
  /** Number of products to show */
  limit?: number;
  /** Number of grid columns */
  cols?: 2 | 3 | 4;
}

const defaultTitles: Record<RecommendationType, string> = {
  related: "You May Also Like",
  popular: "Popular Products",
  "frequently-bought": "Frequently Bought Together",
};

export function ProductRecommendations({
  type,
  productId,
  title,
  limit = 4,
  cols = 4,
}: ProductRecommendationsProps) {
  const [products, setProducts] = useState<RecommendedProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchRecommendations = async () => {
      setLoading(true);
      setError(null);

      try {
        let data: RecommendedProduct[];

        switch (type) {
          case "related":
            if (!productId) throw new Error("productId required for related recommendations");
            data = await getRelatedProducts(productId, limit);
            break;
          case "frequently-bought":
            if (!productId) throw new Error("productId required for frequently-bought recommendations");
            data = await getFrequentlyBoughtTogether(productId, limit);
            break;
          case "popular":
          default:
            data = await getPopularProducts(limit);
            break;
        }

        setProducts(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load recommendations");
      } finally {
        setLoading(false);
      }
    };

    fetchRecommendations();
  }, [type, productId, limit]);

  // Don't render anything if no products or error
  if (error || (!loading && products.length === 0)) {
    return null;
  }

  const displayTitle = title || defaultTitles[type];

  if (loading) {
    return (
      <Stack gap="group" data-slot="product-recommendations">
        <Text as="h3" variant="heading-sm">{displayTitle}</Text>
        <Grid cols={cols} gap="group">
          {Array.from({ length: limit }).map((_, i) => (
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
    );
  }

  return (
    <Stack gap="group" data-slot="product-recommendations">
      <Text as="h3" variant="heading-sm">{displayTitle}</Text>
      <Grid cols={cols} gap="group">
        {products.map((product) => (
          <RecommendationCard key={product.id} product={product} />
        ))}
      </Grid>
    </Stack>
  );
}

function RecommendationCard({ product }: { product: RecommendedProduct }) {
  return (
    <Link href={`/products/${product.id}`} className="group block">
      <Card className="overflow-hidden transition-all hover:border-primary hover:shadow-md">
        <CardContent className="p-0">
          <div className="relative aspect-square bg-muted flex items-center justify-center p-6">
            {/* Wishlist button */}
            <div className="absolute top-2 left-2 z-10">
              <WishlistButton
                productId={product.id}
                productName={product.city_name}
                size="icon-xs"
              />
            </div>

            {/* T-shirt mockup */}
            <div className="relative h-full w-full">
              <svg
                viewBox="0 0 100 100"
                className="h-full w-full text-white drop-shadow-sm transition-transform duration-300 group-hover:scale-105"
              >
                <path
                  d="M20 25 L35 20 L40 30 L60 30 L65 20 L80 25 L85 40 L75 45 L75 85 L25 85 L25 45 L15 40 Z"
                  fill="currentColor"
                  stroke="#e5e5e5"
                  strokeWidth="1"
                />
              </svg>
              <div className="absolute left-1/2 top-1/2 h-10 w-10 -translate-x-1/2 -translate-y-1/4">
                <Image
                  src={`/coats/${product.coat_of_arms_image}`}
                  alt={`${product.city_name} coat of arms`}
                  width={40}
                  height={40}
                  className="h-full w-full object-contain"
                  onError={(e) => {
                    e.currentTarget.src = "/coats/placeholder.svg";
                  }}
                />
              </div>
            </div>
          </div>

          <div className="p-3">
            <Text
              variant="body-sm"
              className="truncate font-medium transition-colors group-hover:text-primary"
            >
              {product.city_name}
            </Text>
            {product.min_price && (
              <Text variant="muted-sm">
                From €{Number(product.min_price).toFixed(2)}
              </Text>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
