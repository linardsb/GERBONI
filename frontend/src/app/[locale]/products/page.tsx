"use client";

import { useEffect, useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { Skeleton } from "@/components/elements/skeleton";
import { Container } from "@/components/elements/container";
import { PageHeader } from "@/components/compositions/page-header";
import { ProductGrid } from "@/components/compositions/product-grid";
import { Text } from "@/components/elements/text";
import { getProducts, type Product } from "@/lib/api";

export default function ProductsPage() {
  const tCommon = useTranslations("common");
  const t = useTranslations("product");
  const locale = useLocale();

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getProducts(locale as "en" | "lv")
      .then(setProducts)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [locale]);

  if (error) {
    return (
      <Container padding="md" size="full">
        <Text variant="error" align="center">
          {tCommon("error")}: {error}
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
          title={t("allProducts")}
          description={t("allProductsDescription")}
          spacing="lg"
        />
      )}

      <ProductGrid
        products={products}
        loading={loading}
        emptyMessage={t("noProducts")}
      />
    </Container>
  );
}
