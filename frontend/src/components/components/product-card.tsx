"use client";

import Image from "next/image";
import { useTranslations, useLocale } from "next-intl";
import { Link } from "@/i18n/routing";
import { Card, CardContent } from "@/components/elements/card";
import { Text } from "@/components/elements/text";
import { Badge } from "@/components/elements/badge";
import { WishlistButton } from "@/components/elements/wishlist-button";
import type { Product } from "@/lib/api";

interface ProductCardProps {
  product: Product;
}

const LOW_STOCK_THRESHOLD = 10;
const VERY_LOW_STOCK_THRESHOLD = 3;

export function ProductCard({ product }: ProductCardProps) {
  const t = useTranslations("product");
  const locale = useLocale();

  const isVeryLowStock = product.total_stock !== undefined && product.total_stock > 0 && product.total_stock <= VERY_LOW_STOCK_THRESHOLD;
  const isLowStock = product.total_stock !== undefined && product.total_stock > VERY_LOW_STOCK_THRESHOLD && product.total_stock <= LOW_STOCK_THRESHOLD;
  const isOutOfStock = product.total_stock === 0;

  // Use Latvian name if locale is 'lv', otherwise English
  const displayName = locale === "lv" ? product.city_name_lv : product.city_name;
  const secondaryName = locale === "lv" ? product.city_name : product.city_name_lv;

  return (
    <Link href={`/products/${product.id}`} className="group block">
      <Card className="overflow-hidden transition-all hover:border-primary hover:shadow-lg">
        <CardContent className="p-0">
          {/* Product Preview */}
          <div className="relative aspect-square bg-muted flex items-center justify-center p-8">
            {/* Wishlist button */}
            <div className="absolute top-3 left-3 z-10">
              <WishlistButton
                productId={product.id}
                productName={displayName}
                size="icon-sm"
              />
            </div>
            {/* Stock badges */}
            {isOutOfStock && (
              <Badge variant="destructive" className="absolute top-3 right-3 z-10">
                {t("outOfStock")}
              </Badge>
            )}
            {isVeryLowStock && (
              <Badge variant="destructive" className="absolute top-3 right-3 z-10">
                {t("lowStock", { count: product.total_stock ?? 0 })}
              </Badge>
            )}
            {isLowStock && (
              <Badge variant="secondary" className="absolute top-3 right-3 z-10 bg-orange-100 text-orange-700 border-orange-200">
                {locale === "lv" ? "Zems krājums" : "Low stock"}
              </Badge>
            )}
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
              {/* Coat of arms */}
              <div className="absolute left-1/2 top-1/2 h-16 w-16 -translate-x-1/2 -translate-y-1/4">
                <Image
                  src={`/coats/${product.coat_of_arms_image}`}
                  alt={`${displayName} coat of arms`}
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

          {/* Product Info */}
          <div className="p-4">
            <Text as="h3" variant="heading-xs" className="transition-colors group-hover:text-primary">
              {displayName}
            </Text>
            <Text variant="muted-sm">
              {secondaryName}
            </Text>
            {product.min_price && (
              <Text variant="price" className="mt-2">
                {locale === "lv" ? "No" : "From"} €{Number(product.min_price).toFixed(2)}
              </Text>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
