"use client";

import { useEffect, useState } from "react";
import { Skeleton } from "@/components/elements/skeleton";
import { Container } from "@/components/elements/container";
import { PageHeader } from "@/components/compositions/page-header";
import { ProductGrid } from "@/components/compositions/product-grid";
import { Text } from "@/components/elements/text";
import { getProducts, type Product } from "@/lib/api";

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getProducts()
      .then(setProducts)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (error) {
    return (
      <Container padding="md" size="full">
        <Text variant="error" align="center">
          Failed to load products: {error}
        </Text>
      </Container>
    );
  }

  return (
    <Container padding="md" size="full">
      {loading ? (
        <div className="mb-12">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="mt-2 h-5 w-96" />
        </div>
      ) : (
        <PageHeader
          title="All Products"
          description="Explore our collection of Latvian city coat of arms t-shirts"
          spacing="lg"
        />
      )}

      <ProductGrid
        products={products}
        loading={loading}
        emptyMessage="No products available yet."
      />
    </Container>
  );
}
