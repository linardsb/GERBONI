"use client";

import { Suspense, useEffect, useState, useCallback, useMemo } from "react";
import { useTranslations, useLocale } from "next-intl";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { IconSearch, IconX } from "@tabler/icons-react";
import { Skeleton } from "@/components/elements/skeleton";
import { Container } from "@/components/elements/container";
import { PageHeader } from "@/components/compositions/page-header";
import { ProductGrid } from "@/components/compositions/product-grid";
import { Text } from "@/components/elements/text";
import { Input } from "@/components/elements/input";
import { cn } from "@/lib/utils";
import { getProducts, type Product, type ProductFilters } from "@/lib/api";

const COLORS = ["Black", "White", "Red"] as const;
const SIZES = ["XS", "S", "M", "L", "XL", "XXL"] as const;
const SORT_OPTIONS = ["", "price_asc", "price_desc", "name_asc", "newest"] as const;

export default function ProductsPage() {
  return (
    <Suspense
      fallback={
        <Container padding="md" size="full">
          <div className="mb-12">
            <Skeleton className="h-10 w-48" />
            <Skeleton className="mt-2 h-5 w-96" />
          </div>
          <Skeleton className="h-12 w-full" />
        </Container>
      }
    >
      <ProductsContent />
    </Suspense>
  );
}

function ProductsContent() {
  const tCommon = useTranslations("common");
  const t = useTranslations("product");
  const locale = useLocale();
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchInput, setSearchInput] = useState(searchParams.get("q") || "");

  // Read filters from URL params
  const filters = useMemo<ProductFilters>(() => ({
    lang: locale as "en" | "lv",
    q: searchParams.get("q") || undefined,
    color: searchParams.get("color") || undefined,
    size: searchParams.get("size") || undefined,
    sort: searchParams.get("sort") || undefined,
  }), [locale, searchParams]);

  const hasActiveFilters = !!(filters.q || filters.color || filters.size || filters.sort);

  // Update URL params
  const updateParams = useCallback(
    (updates: Record<string, string | null>) => {
      const params = new URLSearchParams(searchParams.toString());
      for (const [key, value] of Object.entries(updates)) {
        if (value) {
          params.set(key, value);
        } else {
          params.delete(key);
        }
      }
      const query = params.toString();
      router.replace(`${pathname}${query ? `?${query}` : ""}`, { scroll: false });
    },
    [searchParams, router, pathname]
  );

  // Fetch products when filters change
  useEffect(() => {
    let cancelled = false;
    getProducts(filters)
      .then((data) => {
        if (!cancelled) setProducts(data);
      })
      .catch((err) => {
        if (!cancelled) setError(err.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [filters]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      const current = searchParams.get("q") || "";
      if (searchInput !== current) {
        updateParams({ q: searchInput || null });
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput, searchParams, updateParams]);

  const clearFilters = useCallback(() => {
    setSearchInput("");
    router.replace(pathname, { scroll: false });
  }, [router, pathname]);

  const colorTranslations: Record<string, string> = {
    Black: t("colorBlack"),
    White: t("colorWhite"),
    Red: t("colorRed"),
  };

  const sortLabels: Record<string, string> = {
    "": t("sortDefault"),
    price_asc: t("sortPriceAsc"),
    price_desc: t("sortPriceDesc"),
    name_asc: t("sortNameAsc"),
    newest: t("sortNewest"),
  };

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
      {loading && !products.length ? (
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

      {/* Filter Bar */}
      <div data-slot="product-filters" className="mb-8 flex flex-col gap-group">
        {/* Search + Sort Row */}
        <div className="flex flex-col gap-group sm:flex-row sm:items-center sm:justify-between">
          {/* Search Input */}
          <div className="relative w-full sm:max-w-xs">
            <IconSearch
              className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden="true"
            />
            <Input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder={t("searchPlaceholder")}
              className="pl-9 pr-8"
              aria-label={t("searchPlaceholder")}
            />
            {searchInput && (
              <button
                onClick={() => setSearchInput("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded-sm p-0.5 text-muted-foreground transition-colors duration-fast hover:text-foreground"
                aria-label={tCommon("close")}
              >
                <IconX className="size-4" />
              </button>
            )}
          </div>

          {/* Sort Dropdown */}
          <select
            data-slot="sort-select"
            value={filters.sort || ""}
            onChange={(e) => updateParams({ sort: e.target.value || null })}
            className="h-9 rounded-md border border-input bg-transparent px-3 text-sm text-foreground transition-colors duration-fast focus-visible:border-ring focus-visible:outline-none focus-visible:ring-ring/50 focus-visible:ring-[3px]"
            aria-label={t("sortBy")}
          >
            {SORT_OPTIONS.map((opt) => (
              <option key={opt} value={opt}>
                {sortLabels[opt]}
              </option>
            ))}
          </select>
        </div>

        {/* Color + Size Chips Row */}
        <div className="flex flex-wrap items-center gap-group">
          {/* Color Chips */}
          <div className="flex items-center gap-element">
            <Text variant="muted-sm" className="font-medium">
              {t("filterByColor")}:
            </Text>
            <div className="flex gap-element">
              {COLORS.map((color) => {
                const isActive = filters.color?.toLowerCase() === color.toLowerCase();
                return (
                  <button
                    key={color}
                    onClick={() =>
                      updateParams({ color: isActive ? null : color })
                    }
                    className={cn(
                      "rounded-full border px-3 py-1 text-xs font-medium transition-colors duration-fast",
                      isActive
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border text-muted-foreground hover:border-foreground hover:text-foreground"
                    )}
                    aria-pressed={isActive}
                    aria-label={colorTranslations[color]}
                  >
                    {colorTranslations[color]}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Divider */}
          <div className="hidden h-6 w-px bg-border sm:block" aria-hidden="true" />

          {/* Size Chips */}
          <div className="flex items-center gap-element">
            <Text variant="muted-sm" className="font-medium">
              {t("filterBySize")}:
            </Text>
            <div className="flex gap-element">
              {SIZES.map((size) => {
                const isActive = filters.size?.toUpperCase() === size.toUpperCase();
                return (
                  <button
                    key={size}
                    onClick={() =>
                      updateParams({ size: isActive ? null : size })
                    }
                    className={cn(
                      "rounded-md border px-2 py-1 text-xs font-medium transition-colors duration-fast",
                      isActive
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border text-muted-foreground hover:border-foreground hover:text-foreground"
                    )}
                    aria-pressed={isActive}
                    aria-label={size}
                  >
                    {size}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Active Filters Summary */}
        {hasActiveFilters && (
          <div className="flex items-center gap-element">
            <Text variant="muted-sm">
              {loading
                ? tCommon("loading")
                : t("resultsCount", { count: products.length })}
            </Text>
            <button
              onClick={clearFilters}
              className="text-xs font-medium text-primary underline transition-colors duration-fast hover:text-primary/80"
            >
              {t("clearFilters")}
            </button>
          </div>
        )}
      </div>

      <ProductGrid
        products={products}
        loading={loading && !products.length}
        emptyMessage={hasActiveFilters ? t("noFilterResults") : t("noProducts")}
      />
    </Container>
  );
}
