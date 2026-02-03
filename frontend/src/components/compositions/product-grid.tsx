"use client";

import { ProductCard } from "@/components/components/product-card";
import { Skeleton } from "@/components/elements/skeleton";
import { Grid } from "@/components/elements/grid";
import { Text } from "@/components/elements/text";
import type { Product } from "@/lib/api";

interface ProductGridProps {
  products: Product[];
  loading?: boolean;
  emptyMessage?: string;
}

export function ProductGrid({ products, loading, emptyMessage = "No products available." }: ProductGridProps) {
  if (loading) {
    return (
      <Grid cols={4} gap="lg">
        {[...Array(8)].map((_, i) => (
          <div key={i}>
            <Skeleton className="aspect-square w-full" />
            <Skeleton className="mt-4 h-5 w-3/4" />
            <Skeleton className="mt-2 h-4 w-1/2" />
          </div>
        ))}
      </Grid>
    );
  }

  if (products.length === 0) {
    return (
      <Text variant="muted" align="center">
        {emptyMessage}
      </Text>
    );
  }

  return (
    <Grid cols={4} gap="lg">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </Grid>
  );
}
