"use client";

import Image from "next/image";
import { useTranslations, useLocale } from "next-intl";
import { Link } from "@/i18n/routing";
import {
  IconArrowRight,
  IconArrowUpRight,
  IconSparkles,
  IconTruck,
  IconMessageCircle,
  IconShoppingBag,
} from "@tabler/icons-react";
import { WishlistButton } from "@/components/elements/wishlist-button";
import { Button } from "@/components/elements/button";
import { Button3D } from "@/components/elements/button-3d";
import { Section } from "@/components/elements/section";
import { Container } from "@/components/elements/container";
import { Stack } from "@/components/elements/stack";
import { Row } from "@/components/elements/row";
import { Text } from "@/components/elements/text";
import { Grid } from "@/components/elements/grid";
import { Input } from "@/components/elements/input";
import { RecentlyViewedSection } from "@/components/compositions/recently-viewed-section";

const featuredProducts = [
  {
    id: 1,
    name: "Riga",
    nameLv: "Rīga",
    coatOfArms: "riga.svg",
    price: 24.99,
    rating: 4.8,
    reviews: 127,
  },
  {
    id: 2,
    name: "Daugavpils",
    nameLv: "Daugavpils",
    coatOfArms: "daugavpils.svg",
    price: 24.99,
    rating: 4.9,
    reviews: 89,
  },
  {
    id: 3,
    name: "Liepāja",
    nameLv: "Liepāja",
    coatOfArms: "liepaja.svg",
    price: 24.99,
    rating: 4.7,
    reviews: 64,
  },
  {
    id: 4,
    name: "Jelgava",
    nameLv: "Jelgava",
    coatOfArms: "jelgava.svg",
    price: 24.99,
    rating: 4.6,
    reviews: 52,
  },
  {
    id: 5,
    name: "Jūrmala",
    nameLv: "Jūrmala",
    coatOfArms: "jurmala.svg",
    price: 24.99,
    rating: 4.9,
    reviews: 98,
  },
  {
    id: 6,
    name: "Ventspils",
    nameLv: "Ventspils",
    coatOfArms: "ventspils.svg",
    price: 24.99,
    rating: 4.8,
    reviews: 71,
  },
];

function StarRating({ rating, reviews }: { rating: number; reviews: number }) {
  return (
    <Row gap="xs" align="center">
      <Row gap="none">
        {[1, 2, 3, 4, 5].map((star) => (
          <svg
            key={star}
            className={`size-4 ${
              star <= Math.round(rating)
                ? "fill-foreground text-foreground"
                : "text-muted-foreground/30"
            }`}
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path d="M11.525 2.295a.53.53 0 0 1 .95 0l2.31 4.679a2.123 2.123 0 0 0 1.595 1.16l5.166.756a.53.53 0 0 1 .294.904l-3.736 3.638a2.123 2.123 0 0 0-.611 1.878l.882 5.14a.53.53 0 0 1-.771.56l-4.618-2.428a2.122 2.122 0 0 0-1.973 0L6.396 21.01a.53.53 0 0 1-.77-.56l.881-5.139a2.122 2.122 0 0 0-.611-1.879L2.16 9.795a.53.53 0 0 1 .294-.906l5.165-.755a2.122 2.122 0 0 0 1.597-1.16z" />
          </svg>
        ))}
      </Row>
      <Text variant="muted-sm">({reviews})</Text>
    </Row>
  );
}

function ProductCard({
  product,
  quickAddLabel,
}: {
  product: (typeof featuredProducts)[number];
  quickAddLabel: string;
}) {
  const locale = useLocale();

  return (
    <Link href={`/products/${product.id}`} className="group block">
      <div data-slot="product-card">
        {/* Image container with hover effects */}
        <div className="relative overflow-hidden bg-surface-muted mb-4 rounded-card">
          <div className="aspect-[3/4]">
            {/* T-shirt mockup with coat of arms */}
            <div className="relative h-full w-full flex items-center justify-center p-8">
              <svg
                viewBox="0 0 100 100"
                className="h-full w-full text-white drop-shadow-md transition-transform duration-500 group-hover:scale-110"
                aria-hidden="true"
              >
                <path
                  d="M20 25 L35 20 L40 30 L60 30 L65 20 L80 25 L85 40 L75 45 L75 85 L25 85 L25 45 L15 40 Z"
                  fill="currentColor"
                  className="stroke-tshirt-stroke"
                  strokeWidth="1"
                />
              </svg>
              {/* Coat of arms overlay */}
              <div className="absolute left-1/2 top-1/2 h-16 w-16 -translate-x-1/2 -translate-y-1/4">
                <Image
                  src={`/coats/${product.coatOfArms}`}
                  alt={`${product.name} coat of arms`}
                  width={64}
                  height={64}
                  className="h-full w-full object-contain drop-shadow-sm"
                />
              </div>
            </div>
          </div>

          {/* Hover gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-foreground/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

          {/* Wishlist button - appears on hover */}
          <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-all duration-300">
            <WishlistButton
              productId={product.id}
              productName={product.name}
              size="icon-sm"
            />
          </div>

          {/* Quick add button - slides up on hover */}
          <div className="absolute bottom-4 left-4 right-4 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-2 group-hover:translate-y-0">
            <Button
              variant="secondary"
              className="w-full"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                window.location.href = `/${locale}/products/${product.id}`;
              }}
            >
              {quickAddLabel}
            </Button>
          </div>
        </div>

        {/* Product info */}
        <div className="px-2">
          <Text
            as="h3"
            variant="heading-xs"
            className="mb-1 transition-colors group-hover:text-primary"
          >
            {locale === "lv" ? product.nameLv : product.name}
          </Text>
          <Text variant="muted-sm" className="mb-2">
            {locale === "lv" ? product.name : product.nameLv}
          </Text>
          <StarRating rating={product.rating} reviews={product.reviews} />
          <Row justify="between" align="center" className="mt-3">
            <Text variant="muted-sm">XS - XXL</Text>
            <Text variant="price">€{product.price.toFixed(2)}</Text>
          </Row>
        </div>
      </div>
    </Link>
  );
}

export default function HomePage() {
  const t = useTranslations("home");
  const tCommon = useTranslations("common");
  const tProduct = useTranslations("product");
  const locale = useLocale();

  const features = [
    {
      icon: IconSparkles,
      title: t("feature2Title"),
      description: t("feature2Description"),
    },
    {
      icon: IconTruck,
      title: t("feature4Title"),
      description: t("feature4Description"),
    },
    {
      icon: IconMessageCircle,
      title: locale === "lv" ? "AI Atbalsts" : "AI Support",
      description: locale === "lv"
        ? "24/7 AI-balstīts klientu atbalsts pasūtījumiem, atgriešanai un jautājumiem."
        : "24/7 AI-powered customer support for orders, returns, and questions.",
    },
  ];

  const stats = [
    { value: "10", label: locale === "lv" ? "Latvijas pilsētas" : "Latvian Cities" },
    { value: "360", label: locale === "lv" ? "Unikāli varianti" : "Unique Variants" },
    { value: "5★", label: locale === "lv" ? "Klientu vērtējums" : "Customer Rating" },
  ];

  return (
    <div data-slot="home-page">
      {/* Hero Section - Aurova-inspired with gradient and massive typography */}
      <Section spacing="none" className="relative min-h-screen flex items-center justify-center pt-20">
        {/* Gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-background to-surface-muted" />

        <Container className="relative">
          <Stack gap="section" align="center" className="text-center">
            {/* Badge */}
            <div className="inline-block px-4 py-2 bg-background/60 backdrop-blur-sm border border-border-subtle">
              <Text variant="label">{locale === "lv" ? "Jaunā kolekcija 2026" : "New Collection 2026"}</Text>
            </div>

            {/* Massive title - uses Latvian font for authentic typography */}
            <h1 className="font-latvian text-[12vw] lg:text-[10rem] xl:text-[12rem] leading-[0.85] tracking-tight">
              {locale === "lv" ? "Mantojums" : "Heritage"}
            </h1>

            {/* Two-column description */}
            <div className="max-w-2xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-group text-lg leading-relaxed">
              <Text variant="muted" className="opacity-80">
                {t("heroSubtitle")}
              </Text>
              <Text variant="muted" className="opacity-80">
                {t("heroDescription")}
              </Text>
            </div>

            {/* CTA button */}
            <div className="pt-section">
              <Button3D variant="minimal" size="lg" href="/products">
                <span className="text-label">{t("exploreCollection")}</span>
              </Button3D>
            </div>
          </Stack>
        </Container>
      </Section>

      {/* Hero Image Section */}
      <Section spacing="none" className="-mt-32 relative z-10">
        <Container>
          <div className="relative overflow-hidden shadow-2xl rounded-card">
            <div className="aspect-[16/9] lg:aspect-[21/9]">
              {/* Background image */}
              <Image
                src="/bg_images/RigaSunset-1024x632.jpg"
                alt="Riga sunset skyline"
                fill
                className="object-cover"
                priority
              />
              {/* Subtle overlay for text readability */}
              <div className="absolute inset-0 bg-background/70" />
            </div>

            {/* Bottom overlay with collection info */}
            <div className="absolute inset-0 bg-gradient-to-t from-foreground/60 via-transparent to-transparent" />
            <div className="absolute bottom-8 left-8 right-8 text-overlay-foreground">
              <Row justify="between" align="end">
                <Stack gap="element">
                  <Text
                    as="h2"
                    variant="display-sm"
                    className="text-overlay-foreground"
                  >
                    {locale === "lv" ? "Latvijas mantojuma kolekcija" : "Latvian Heritage Collection"}
                  </Text>
                  <Text variant="overlay-muted">
                    {locale === "lv" ? "10 pilsētas • 360 varianti" : "10 Cities • 360 Variants"}
                  </Text>
                </Stack>
                <Stack gap="element" align="end" className="hidden md:flex">
                  <Text variant="overlay-muted">
                    {locale === "lv" ? "Sākot no" : "Starting from"}
                  </Text>
                  <Text className="text-lg font-medium text-overlay-foreground">
                    €24.99
                  </Text>
                </Stack>
              </Row>
            </div>
          </div>
        </Container>
      </Section>

      {/* Stats Section */}
      <Section spacing="large">
        <Container>
          <Grid cols={3} gap="xl">
            {stats.map((stat, index) => (
              <Stack key={index} gap="element" align="center" className="group">
                <Text
                  variant="display-lg"
                  className="transition-transform duration-300 group-hover:scale-105"
                >
                  {stat.value}
                </Text>
                <Text
                  variant="label"
                  className="text-muted-foreground opacity-60"
                >
                  {stat.label}
                </Text>
              </Stack>
            ))}
          </Grid>
        </Container>
      </Section>

      {/* Product Showcase Section - Aurova-inspired with sticky sidebar */}
      <Section spacing="large">
        <Container>
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-page">
            {/* Sticky sidebar with collection info */}
            <div className="lg:col-span-1">
              <div className="lg:sticky lg:top-32">
                <Stack gap="section">
                  <Stack gap="element">
                    <Text
                      variant="label"
                      className="text-muted-foreground opacity-60"
                    >
                      /01 {t("featuredProducts")}
                    </Text>
                    <Text as="h2" variant="display-md">
                      {locale === "lv" ? "Pilsētu ģerboņi" : "City Crests"}
                    </Text>
                    <Text variant="muted" className="leading-relaxed">
                      {locale === "lv"
                        ? "Katrs ģerbonis pārstāv gadsimtiem vēstures, meistara darba un kultūras identitātes. Velciet savu mantojumu ar lepnumu."
                        : "Each coat of arms represents centuries of history, craftsmanship, and cultural identity. Wear your heritage with pride."}
                    </Text>
                  </Stack>

                  <Stack gap="group">
                    <Row justify="between">
                      <Text variant="muted-sm">
                        {locale === "lv" ? "Pieejamie dizaini" : "Available designs"}
                      </Text>
                      <Text variant="body-sm" className="font-medium">
                        10
                      </Text>
                    </Row>
                    <Row justify="between">
                      <Text variant="muted-sm">
                        {locale === "lv" ? "Cenu diapazons" : "Price range"}
                      </Text>
                      <Text variant="body-sm" className="font-medium">
                        €24.99 - €28.99
                      </Text>
                    </Row>
                    <Row justify="between">
                      <Text variant="muted-sm">
                        {locale === "lv" ? "Izmēri" : "Sizes"}
                      </Text>
                      <Text variant="body-sm" className="font-medium">
                        XS - XXL
                      </Text>
                    </Row>
                  </Stack>

                  <Button3D variant="minimal" href="/products" className="w-full">
                    <span className="text-label">{tCommon("viewAll")}</span>
                  </Button3D>
                </Stack>
              </div>
            </div>

            {/* Product Grid */}
            <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-group">
              {featuredProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  quickAddLabel={tProduct("quickView")}
                />
              ))}
            </div>
          </div>
        </Container>
      </Section>

      {/* Recently Viewed (client-side, conditionally shown) */}
      <RecentlyViewedSection />

      {/* Features Section */}
      <Section
        spacing="default"
        background="accent"
        className="border-y border-border-subtle"
      >
        <Container>
          <Grid cols={3} gap="xl">
            {features.map((feature, index) => {
              const IconComponent = feature.icon;
              return (
                <Stack key={index} gap="group" align="center" className="text-center">
                  <div className="size-14 border border-border-subtle flex items-center justify-center">
                    <IconComponent
                      className="size-6 text-foreground"
                      aria-hidden="true"
                    />
                  </div>
                  <Stack gap="element">
                    <Text as="h3" variant="label">
                      {feature.title}
                    </Text>
                    <Text variant="fine" className="leading-relaxed">
                      {feature.description}
                    </Text>
                  </Stack>
                </Stack>
              );
            })}
          </Grid>
        </Container>
      </Section>

      {/* Newsletter Section - Aurova-inspired with background image */}
      <Section spacing="large">
        <Container size="full">
          <div className="relative overflow-hidden text-foreground rounded-card">
            {/* Background image */}
            <Image
              src="/bg_images/pexels-miami302-19405212.jpg"
              alt=""
              fill
              className="object-cover"
              aria-hidden="true"
            />
            {/* White overlay for text readability */}
            <div className="absolute inset-0 bg-background/70" />
            {/* Subtle gradient pattern */}
            <div className="absolute inset-0 opacity-20">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/30 via-transparent to-primary/20" />
            </div>

            <div className="relative text-center py-page px-section">
              <Stack gap="section" align="center">
                <Text as="h2" variant="display-md">
                  {t("newsletterTitle")}
                </Text>
                <Text variant="muted" className="max-w-2xl mx-auto">
                  {t("newsletterDescription")}
                </Text>

                {/* Email form */}
                <Row gap="group" wrap="wrap" justify="center" className="w-full max-w-md">
                  <Input
                    type="email"
                    placeholder={t("newsletterPlaceholder")}
                    variant="minimal"
                    className="flex-1 min-w-52"
                    aria-label={locale === "lv" ? "E-pasta adrese" : "Email address"}
                  />
                  <Button
                    variant="minimal"
                    className="text-label whitespace-nowrap"
                  >
                    {t("newsletterButton")}
                  </Button>
                </Row>

                <Text variant="muted-sm">
                  {locale === "lv"
                    ? "Nav spama, tikai izvēlēts saturs un ekskluzīva piekļuve."
                    : "No spam, just curated content and exclusive access."}
                </Text>
              </Stack>
            </div>
          </div>
        </Container>
      </Section>

      {/* Final CTA Section - with Latvian landscape background */}
      <Section spacing="none">
        <Container size="full">
          <div className="relative overflow-hidden rounded-card">
            {/* Background image - Latvian landscape */}
            <Image
              src="/bg_images/pexels-vilnisphoto-7449712.jpg"
              alt=""
              fill
              className="object-cover"
              aria-hidden="true"
            />
            {/* Overlay for text readability */}
            <div className="absolute inset-0 bg-foreground/60" />

            <div className="relative py-page px-section">
              <Stack gap="section" align="center" className="max-w-2xl mx-auto">
                <Text as="h2" variant="display-md" align="center" className="text-overlay-foreground">
                  {locale === "lv"
                    ? "Gatavs velciet savu mantojumu?"
                    : "Ready to wear your heritage?"}
                </Text>
                <Text variant="overlay-muted" align="center">
                  {locale === "lv"
                    ? "Pievienojieties tūkstošiem latviešu un Latvijas entuziastu, kuri lepni velk savas pilsētas ģerboni."
                    : "Join thousands of Latvians and Latvia enthusiasts who proudly wear their city's coat of arms."}
                </Text>
                <Row gap="group" wrap="wrap" justify="center">
                  <Button3D variant="minimal-light" size="lg" href="/products" className="text-label">
                    {t("shopNow")}
                  </Button3D>
                </Row>
              </Stack>
            </div>
          </div>
        </Container>
      </Section>
    </div>
  );
}
