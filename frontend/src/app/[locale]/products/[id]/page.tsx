"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useTranslations, useLocale } from "next-intl";
import {
  IconMinus,
  IconPlus,
  IconShoppingCart,
  IconTruck,
  IconRefresh,
  IconShield,
  IconLoader2,
} from "@/components/icons";
import { Button } from "@/components/elements/button";
import { Button3D } from "@/components/elements/button-3d";
import { SizeGuideModal } from "@/components/compositions/size-guide-modal";
import { Card, CardContent } from "@/components/elements/card";
import { Skeleton } from "@/components/elements/skeleton";
import { Separator } from "@/components/elements/separator";
import { Container } from "@/components/elements/container";
import { Grid } from "@/components/elements/grid";
import { Row } from "@/components/elements/row";
import { Stack } from "@/components/elements/stack";
import { Text } from "@/components/elements/text";
import { TShirtMockup } from "@/components/components/tshirt-mockup";
import { ColorSelector } from "@/components/components/color-selector";
import { SizeSelector } from "@/components/components/size-selector";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/elements/accordion";
import {
  getProduct,
  addToCart,
  createGuestSession,
  type ProductDetail,
} from "@/lib/api";
import { useAuthStore, useCartStore, useRecentlyViewedStore } from "@/lib/store";
import { RecentlyViewed } from "@/components/compositions/recently-viewed";
import { ProductRecommendations } from "@/components/compositions/product-recommendations";
import { toast } from "sonner";
import {
  type ProductColorKey,
  type ProductSize,
  isValidColorKey,
  getColorName,
} from "@/lib/product-colors";

export default function ProductPage() {
  const t = useTranslations("product");
  const tCommon = useTranslations("common");
  const locale = useLocale() as "en" | "lv";
  const params = useParams();
  const { token, guestSession, setGuestSession } = useAuthStore();
  const { setCart } = useCartStore();
  const { addItem: addRecentlyViewed } = useRecentlyViewedStore();

  const [product, setProduct] = useState<ProductDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedColor, setSelectedColor] = useState<ProductColorKey>("Black");
  const [selectedSize, setSelectedSize] = useState<ProductSize>("M");
  const [quantity, setQuantity] = useState(1);
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    const id = Number(params.id);
    if (isNaN(id)) {
      setError(locale === "lv" ? "Nederīgs produkta ID" : "Invalid product ID");
      setLoading(false);
      return;
    }

    getProduct(id, locale)
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

  // Helper to check if a color is in stock for current size
  const isColorInStock = (color: ProductColorKey) => {
    const variant = product?.variants.find(
      (v) => v.color === color && v.size === selectedSize
    );
    return variant ? variant.stock > 0 : false;
  };

  // Helper to get stock count for a color
  const getColorStockCount = (color: ProductColorKey) => {
    const variant = product?.variants.find(
      (v) => v.color === color && v.size === selectedSize
    );
    return variant?.stock ?? 0;
  };

  // Helper to check if a size is in stock for current color
  const isSizeInStock = (size: ProductSize) => {
    const variant = product?.variants.find(
      (v) => v.color === selectedColor && v.size === size
    );
    return variant ? variant.stock > 0 : false;
  };

  // Helper to get stock count for a size
  const getSizeStockCount = (size: ProductSize) => {
    const variant = product?.variants.find(
      (v) => v.color === selectedColor && v.size === size
    );
    return variant?.stock ?? 0;
  };

  const handleColorChange = (color: ProductColorKey) => {
    setSelectedColor(color);
  };

  const handleSizeChange = (size: ProductSize) => {
    setSelectedSize(size);
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
        description: `${cityName} T-Shirt (${getColorName(selectedColor, locale)}, ${selectedSize})`,
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
            <div className="relative aspect-square bg-muted flex items-center justify-center p-12 group">
              <TShirtMockup
                color={selectedColor}
                coatOfArmsImage={product.coat_of_arms_image}
                coatOfArmsAlt={`${displayName} coat of arms`}
                size="lg"
                showHoverEffect
              />
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

          <Row gap="element" align="baseline" className="flex-wrap">
            <Text variant="price-lg">
              €{selectedVariant ? (Number(selectedVariant.price) * quantity).toFixed(2) : "24.99"}
            </Text>
            {quantity > 1 && selectedVariant && (
              <span className="text-muted-foreground font-bold">
                (€{Number(selectedVariant.price).toFixed(2)} × {quantity})
              </span>
            )}
          </Row>

          <Text variant="muted">{displayDescription}</Text>

          <Separator />

          {/* Color Selection */}
          <Stack gap="group">
            <Text variant="label">{t("color")}: {getColorName(selectedColor, locale)}</Text>
            <ColorSelector
              value={selectedColor}
              onValueChange={handleColorChange}
              isColorInStock={isColorInStock}
              getStockCount={getColorStockCount}
              locale={locale}
            />
          </Stack>

          {/* Size Selection */}
          <Stack gap="group">
            <Row justify="between">
              <Text variant="label">{t("size")}: {selectedSize}</Text>
              <SizeGuideModal
                trigger={
                  <button className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-element transition-colors duration-fast">
                    <span className="size-4" aria-hidden="true">📏</span>
                    {t("sizeGuide")}
                  </button>
                }
              />
            </Row>
            <SizeSelector
              value={selectedSize}
              onValueChange={handleSizeChange}
              isSizeInStock={isSizeInStock}
              getStockCount={getSizeStockCount}
              locale={locale}
            />
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
              <Text as="span" variant="body-lg" className="w-12 text-center font-medium tabular-nums">
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

          {/* Add to Cart - Sticky on mobile */}
          <div className="sticky bottom-4 z-10 lg:static lg:z-auto bg-background/95 backdrop-blur-sm py-4 -mx-4 px-4 lg:mx-0 lg:px-0 lg:py-0 lg:bg-transparent lg:backdrop-blur-none">
            <Stack gap="group">
              <Button3D
                size="2xl"
                className="w-full"
                onClick={handleAddToCart}
                disabled={adding || !selectedVariant || selectedVariant.stock < 1}
              >
                {adding ? tCommon("loading") : t("addToCart")}
              </Button3D>

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

              {/* Trust signals */}
              <Row gap="section" justify="center" className="pt-2">
                <Row gap="element" className="text-muted-foreground">
                  <IconTruck className="size-4" aria-hidden="true" />
                  <Text variant="muted-sm">
                    {locale === "lv" ? "Bezmaksas piegāde €50+" : "Free shipping €50+"}
                  </Text>
                </Row>
                <Row gap="element" className="text-muted-foreground">
                  <IconRefresh className="size-4" aria-hidden="true" />
                  <Text variant="muted-sm">
                    {locale === "lv" ? "14 dienu atgriešana" : "14-day returns"}
                  </Text>
                </Row>
              </Row>
            </Stack>
          </div>

          <Separator />

          {/* Product Details - Accordion */}
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="materials">
              <AccordionTrigger>
                {locale === "lv" ? "Materiāli un kopšana" : "Materials & Care"}
              </AccordionTrigger>
              <AccordionContent>
                <Stack gap="sm">
                  <Row gap="element">
                    <Text variant="body-sm" className="font-medium min-w-24">
                      {locale === "lv" ? "Materiāls" : "Material"}
                    </Text>
                    <Text variant="muted-sm">
                      {locale === "lv" ? "100% premium kokvilna" : "100% premium cotton"}
                    </Text>
                  </Row>
                  <Row gap="element">
                    <Text variant="body-sm" className="font-medium min-w-24">
                      {locale === "lv" ? "Apdruka" : "Print"}
                    </Text>
                    <Text variant="muted-sm">
                      {locale === "lv" ? "Augstas kvalitātes sietspiede" : "High-quality screen print"}
                    </Text>
                  </Row>
                  <Row gap="element">
                    <Text variant="body-sm" className="font-medium min-w-24">
                      {locale === "lv" ? "Kopšana" : "Care"}
                    </Text>
                    <Text variant="muted-sm">
                      {locale === "lv" ? "Mazgājams mašīnā līdz 40°C" : "Machine washable up to 40°C"}
                    </Text>
                  </Row>
                </Stack>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="shipping">
              <AccordionTrigger>
                {locale === "lv" ? "Piegāde" : "Shipping"}
              </AccordionTrigger>
              <AccordionContent>
                <Stack gap="sm">
                  <Row gap="element">
                    <IconTruck className="size-4 text-muted-foreground" aria-hidden="true" />
                    <Text variant="muted-sm">
                      {locale === "lv"
                        ? "Bezmaksas piegāde pasūtījumiem virs €50"
                        : "Free shipping on orders over €50"}
                    </Text>
                  </Row>
                  <Row gap="element">
                    <IconShield className="size-4 text-muted-foreground" aria-hidden="true" />
                    <Text variant="muted-sm">
                      {locale === "lv"
                        ? "Droša maksāšana ar Stripe"
                        : "Secure payment with Stripe"}
                    </Text>
                  </Row>
                </Stack>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="heritage">
              <AccordionTrigger>
                {locale === "lv" ? "Latvijas mantojums" : "Latvian Heritage"}
              </AccordionTrigger>
              <AccordionContent>
                <Text variant="muted-sm">
                  {locale === "lv"
                    ? `Šis krekls parāda ${displayName} autentisko ģerboni - simbolu, kas atspoguļo pilsētas bagāto vēsturi un kultūras mantojumu. Katrs ģerbonis ir rūpīgi atveidots, lai saglabātu tā vēsturisko nozīmi.`
                    : `This t-shirt features the authentic coat of arms of ${displayName} - a symbol representing the city's rich history and cultural heritage. Each coat of arms is carefully reproduced to preserve its historical significance.`}
                </Text>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </Stack>
      </Grid>

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
