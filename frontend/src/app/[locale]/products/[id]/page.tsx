"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Image from "next/image";
import { useTranslations, useLocale } from "next-intl";
import { IconMinus, IconPlus, IconCheck, IconRuler } from "@tabler/icons-react";
import { Button } from "@/components/elements/button";
import { SizeGuideModal } from "@/components/compositions/size-guide-modal";
import { Card, CardContent } from "@/components/elements/card";
import { Skeleton } from "@/components/elements/skeleton";
import { Separator } from "@/components/elements/separator";
import { Badge } from "@/components/elements/badge";
import { Container } from "@/components/elements/container";
import { Grid } from "@/components/elements/grid";
import { Row } from "@/components/elements/row";
import { Stack } from "@/components/elements/stack";
import { Text } from "@/components/elements/text";
import {
  getProduct,
  addToCart,
  createGuestSession,
  type ProductDetail,
} from "@/lib/api";
import { useAuthStore, useCartStore, useRecentlyViewedStore } from "@/lib/store";
import { RecentlyViewed } from "@/components/compositions/recently-viewed";
import { ProductRecommendations } from "@/components/compositions/product-recommendations";
import { ReviewList } from "@/components/compositions/review-list";
import { toast } from "sonner";

const COLORS = ["Black", "White", "Navy", "Gray", "Red", "Green"];
const SIZES = ["XS", "S", "M", "L", "XL", "XXL"];

const COLOR_MAP: Record<string, string> = {
  Black: "#18181b",
  White: "#ffffff",
  Navy: "#1e3a5f",
  Gray: "#71717a",
  Red: "#dc2626",
  Green: "#16a34a",
};

export default function ProductPage() {
  const t = useTranslations("product");
  const tColors = useTranslations("colors");
  const tCommon = useTranslations("common");
  const locale = useLocale();
  const params = useParams();
  const { token, guestSession, setGuestSession } = useAuthStore();
  const { setCart } = useCartStore();
  const { addItem: addRecentlyViewed } = useRecentlyViewedStore();

  const [product, setProduct] = useState<ProductDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedColor, setSelectedColor] = useState("Black");
  const [selectedSize, setSelectedSize] = useState("M");
  const [quantity, setQuantity] = useState(1);
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    const id = Number(params.id);
    if (isNaN(id)) {
      setError(locale === "lv" ? "Nederīgs produkta ID" : "Invalid product ID");
      setLoading(false);
      return;
    }

    getProduct(id, locale as "en" | "lv")
      .then((fetchedProduct) => {
        setProduct(fetchedProduct);
        // Track recently viewed
        addRecentlyViewed({
          id: fetchedProduct.id,
          city_name: fetchedProduct.city_name,
          city_name_lv: fetchedProduct.city_name_lv,
          coat_of_arms_image: fetchedProduct.coat_of_arms_image,
          min_price: Math.min(...fetchedProduct.variants.map((v) => v.price)),
        });
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [params.id, addRecentlyViewed, locale]);

  const selectedVariant = product?.variants.find(
    (v) => v.color === selectedColor && v.size === selectedSize
  );

  // Get translated color name
  const getColorName = (color: string) => {
    const colorKeys: Record<string, string> = {
      Black: tColors("Black"),
      White: tColors("White"),
      Navy: tColors("Navy"),
      Gray: tColors("Gray"),
      Burgundy: tColors("Burgundy"),
      Forest: tColors("Forest"),
      Red: locale === "lv" ? "Sarkans" : "Red",
      Green: locale === "lv" ? "Zaļš" : "Green",
    };
    return colorKeys[color] || color;
  };

  const handleAddToCart = async () => {
    if (!selectedVariant) return;

    setAdding(true);

    try {
      let session = guestSession;
      if (!token && !session) {
        session = await createGuestSession();
        setGuestSession(session);
      }

      const cart = await addToCart(
        selectedVariant.id,
        quantity,
        token,
        session?.session_token
      );
      setCart(cart);
      const cityName = locale === "lv" ? product?.city_name_lv : product?.city_name;
      toast.success(t("addedToCart"), {
        description: `${cityName} T-Shirt (${getColorName(selectedColor)}, ${selectedSize})`,
      });
    } catch (err) {
      toast.error(locale === "lv" ? "Neizdevās pievienot grozam" : "Failed to add to cart", {
        description: err instanceof Error ? err.message : tCommon("tryAgain"),
      });
    } finally {
      setAdding(false);
    }
  };

  if (loading) {
    return (
      <Container padding="md">
        <Grid cols={2} gap="xl">
          <Skeleton className="aspect-square w-full" />
          <Stack gap="md">
            <Skeleton className="h-10 w-3/4" />
            <Skeleton className="h-6 w-1/2" />
            <Skeleton className="h-8 w-24" />
            <Skeleton className="h-24 w-full" />
          </Stack>
        </Grid>
      </Container>
    );
  }

  if (error || !product) {
    return (
      <Container padding="md">
        <Text variant="error" align="center">{error || (locale === "lv" ? "Produkts nav atrasts" : "Product not found")}</Text>
      </Container>
    );
  }

  const displayName = locale === "lv" ? product.city_name_lv : product.city_name;
  const secondaryName = locale === "lv" ? product.city_name : product.city_name_lv;
  const displayDescription = locale === "lv" ? (product.description_lv || product.description) : product.description;

  return (
    <Container padding="md">
      <Grid cols={2} gap="xl">
        {/* Product Image */}
        <Card className="overflow-hidden">
          <CardContent className="p-0">
            <div className="relative aspect-square bg-muted flex items-center justify-center p-12">
              <div className="relative h-full w-full">
                <svg
                  viewBox="0 0 100 100"
                  className="h-full w-full drop-shadow-lg"
                  style={{ color: COLOR_MAP[selectedColor] }}
                >
                  <path
                    d="M20 25 L35 20 L40 30 L60 30 L65 20 L80 25 L85 40 L75 45 L75 85 L25 85 L25 45 L15 40 Z"
                    fill="currentColor"
                    stroke={selectedColor === "White" ? "#e5e5e5" : "transparent"}
                    strokeWidth="1"
                  />
                </svg>
                <div className="absolute left-1/2 top-1/2 h-24 w-24 -translate-x-1/2 -translate-y-1/4">
                  <Image
                    src={`/coats/${product.coat_of_arms_image}`}
                    alt={`${displayName} coat of arms`}
                    width={96}
                    height={96}
                    className="h-full w-full object-contain drop-shadow-md"
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Product Info */}
        <Stack gap="section">
          <Stack gap="element">
            <Text as="h1" variant="heading-xl">{displayName}</Text>
            <Text variant="muted-lg">
              {secondaryName} {locale === "lv" ? "ģerboņa krekls" : "Coat of Arms T-Shirt"}
            </Text>
          </Stack>

          <Text variant="price-lg">
            €{selectedVariant ? Number(selectedVariant.price).toFixed(2) : "24.99"}
          </Text>

          <Text variant="muted">{displayDescription}</Text>

          <Separator />

          {/* Color Selection */}
          <Stack gap="group">
            <Text variant="label">{t("color")}: {getColorName(selectedColor)}</Text>
            <Row gap="group" wrap="wrap">
              {COLORS.map((color) => {
                const variant = product.variants.find(
                  (v) => v.color === color && v.size === selectedSize
                );
                const inStock = variant && variant.stock > 0;

                return (
                  <button
                    key={color}
                    onClick={() => setSelectedColor(color)}
                    disabled={!inStock}
                    aria-label={`${locale === "lv" ? "Izvēlēties" : "Select"} ${getColorName(color)}${!inStock ? (locale === "lv" ? " (nav noliktavā)" : " (out of stock)") : ""}`}
                    aria-pressed={selectedColor === color}
                    className={`relative size-10 border-2 transition-all ${
                      selectedColor === color
                        ? "border-primary ring-2 ring-primary ring-offset-2"
                        : "border-border"
                    } ${!inStock ? "opacity-30" : ""}`}
                    style={{ backgroundColor: COLOR_MAP[color] }}
                  >
                    {selectedColor === color && (
                      <IconCheck
                        aria-hidden="true"
                        className={`absolute inset-0 m-auto size-5 ${
                          color === "White" || color === "Gray"
                            ? "text-foreground"
                            : "text-white"
                        }`}
                      />
                    )}
                  </button>
                );
              })}
            </Row>
          </Stack>

          {/* Size Selection */}
          <Stack gap="group">
            <Row justify="between">
              <Text variant="label">{t("size")}: {selectedSize}</Text>
              <SizeGuideModal
                trigger={
                  <button className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-element transition-colors">
                    <IconRuler className="size-4" aria-hidden="true" />
                    {t("sizeGuide")}
                  </button>
                }
              />
            </Row>
            <Row gap="group" wrap="wrap">
              {SIZES.map((size) => {
                const variant = product.variants.find(
                  (v) => v.color === selectedColor && v.size === size
                );
                const inStock = variant && variant.stock > 0;

                return (
                  <Button
                    key={size}
                    variant={selectedSize === size ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedSize(size)}
                    disabled={!inStock}
                    className={`w-14 ${!inStock ? "opacity-30 line-through" : ""}`}
                  >
                    {size}
                  </Button>
                );
              })}
            </Row>
          </Stack>

          {/* Quantity */}
          <Stack gap="group">
            <Text variant="label">{t("quantity")}</Text>
            <Row gap="group">
              <Button
                variant="outline"
                size="icon"
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                aria-label={locale === "lv" ? "Samazināt daudzumu" : "Decrease quantity"}
              >
                <IconMinus className="size-4" aria-hidden="true" />
              </Button>
              <Text as="span" variant="body-lg" className="w-12 text-center font-medium">
                {quantity}
              </Text>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setQuantity(quantity + 1)}
                aria-label={locale === "lv" ? "Palielināt daudzumu" : "Increase quantity"}
              >
                <IconPlus className="size-4" aria-hidden="true" />
              </Button>
            </Row>
          </Stack>

          {/* Add to Cart */}
          <Stack gap="element">
            <Button
              size="lg"
              className="w-full"
              onClick={handleAddToCart}
              disabled={adding || !selectedVariant || selectedVariant.stock < 1}
            >
              {adding ? tCommon("loading") : t("addToCart")}
            </Button>

            {selectedVariant && selectedVariant.stock > 0 && selectedVariant.stock <= 3 && (
              <Text variant="error" align="center" className="font-medium">
                {t("lowStock", { count: selectedVariant.stock })}
              </Text>
            )}
            {selectedVariant && selectedVariant.stock > 3 && selectedVariant.stock <= 10 && (
              <Text variant="warning" align="center">
                {locale === "lv" ? `Zems krājums - atlikuši ${selectedVariant.stock}` : `Low stock - ${selectedVariant.stock} remaining`}
              </Text>
            )}
          </Stack>

          <Separator />

          {/* Product Details */}
          <Stack gap="group">
            <Text as="h3" variant="heading-xs">{t("details")}</Text>
            <Stack gap="sm">
              <Row gap="element">
                <Badge variant="secondary">{locale === "lv" ? "Materiāls" : "Material"}</Badge>
                <Text variant="muted-sm">{locale === "lv" ? "100% premium kokvilna" : "100% premium cotton"}</Text>
              </Row>
              <Row gap="element">
                <Badge variant="secondary">{locale === "lv" ? "Apdruka" : "Print"}</Badge>
                <Text variant="muted-sm">{locale === "lv" ? "Augstas kvalitātes sietspiede" : "High-quality screen print"}</Text>
              </Row>
              <Row gap="element">
                <Badge variant="secondary">{locale === "lv" ? "Kopšana" : "Care"}</Badge>
                <Text variant="muted-sm">{locale === "lv" ? "Mazgājams mašīnā" : "Machine washable"}</Text>
              </Row>
              <Row gap="element">
                <Badge variant="secondary">{locale === "lv" ? "Dizains" : "Design"}</Badge>
                <Text variant="muted-sm">{locale === "lv" ? "Autentisks ģerbonis" : "Authentic coat of arms"}</Text>
              </Row>
            </Stack>
          </Stack>
        </Stack>
      </Grid>

      {/* Customer Reviews */}
      <div className="mt-section">
        <ReviewList productId={product.id} />
      </div>

      {/* Product Recommendations */}
      <div className="mt-section">
        <ProductRecommendations
          type="related"
          productId={product.id}
          title={t("relatedProducts")}
          limit={4}
        />
      </div>

      {/* Recently Viewed */}
      <div className="mt-section">
        <RecentlyViewed excludeProductId={product.id} maxItems={6} />
      </div>
    </Container>
  );
}
