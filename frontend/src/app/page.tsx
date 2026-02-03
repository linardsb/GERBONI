"use client";

import Link from "next/link";
import Image from "next/image";
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
import { Section } from "@/components/elements/section";
import { Container } from "@/components/elements/container";
import { Stack } from "@/components/elements/stack";
import { Row } from "@/components/elements/row";
import { Text } from "@/components/elements/text";
import { Grid } from "@/components/elements/grid";
import { Card, CardContent } from "@/components/elements/card";
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

const features = [
  {
    icon: IconSparkles,
    title: "Premium Quality",
    description:
      "100% cotton, pre-shrunk fabric with high-quality screen printing that lasts.",
  },
  {
    icon: IconTruck,
    title: "Fast Shipping",
    description:
      "2-4 days within Latvia, 5-10 days for EU. Free shipping over €50.",
  },
  {
    icon: IconMessageCircle,
    title: "AI Support",
    description:
      "24/7 AI-powered customer support for orders, returns, and questions.",
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
}: {
  product: (typeof featuredProducts)[number];
}) {
  return (
    <Link href={`/products/${product.id}`} className="group block">
      <div data-slot="product-card">
        {/* Image container with hover effects */}
        <div className="relative overflow-hidden bg-surface-muted mb-4">
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
                  stroke="#e5e5e5"
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
                window.location.href = `/products/${product.id}`;
              }}
            >
              Quick Add
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
            {product.name}
          </Text>
          <Text variant="muted-sm" className="mb-2">
            {product.nameLv}
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
              <Text variant="label">New Collection 2026</Text>
            </div>

            {/* Massive title */}
            <h1 className="text-display text-[12vw] lg:text-[10rem] xl:text-[12rem] leading-[0.85] tracking-tighter">
              Heritage
            </h1>

            {/* Two-column description */}
            <div className="max-w-2xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-group text-lg leading-relaxed">
              <Text variant="muted" className="opacity-80">
                Premium t-shirts featuring authentic coats of arms from
                Latvia&apos;s most iconic cities.
              </Text>
              <Text variant="muted" className="opacity-80">
                Each design tells a story of centuries of history, culture, and
                national pride.
              </Text>
            </div>

            {/* CTA buttons */}
            <Row gap="group" wrap="wrap" justify="center" className="pt-section">
              <Button variant="minimal" size="lg" asChild className="group">
                <Link href="/products">
                  <span className="text-label">Explore Collection</span>
                  <IconArrowRight
                    className="size-4 transition-transform duration-300 group-hover:translate-x-1"
                    aria-hidden="true"
                  />
                </Link>
              </Button>
              <Button variant="text-underline" size="lg" asChild>
                <Link href="/about">Our Story</Link>
              </Button>
            </Row>
          </Stack>
        </Container>
      </Section>

      {/* Hero Image Section */}
      <Section spacing="none" className="-mt-32 relative z-10">
        <Container>
          <div className="relative overflow-hidden shadow-2xl">
            <div className="aspect-[16/9] lg:aspect-[21/9] bg-surface-muted">
              {/* Placeholder hero image with gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-surface-muted to-muted" />
              <div className="absolute inset-0 flex items-center justify-center">
                <Stack gap="group" align="center">
                  <div className="size-32 border border-border-subtle flex items-center justify-center">
                    <Image
                      src="/coats/riga.svg"
                      alt="Riga coat of arms"
                      width={80}
                      height={80}
                      className="drop-shadow-lg"
                    />
                  </div>
                </Stack>
              </div>
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
                    Latvian Heritage Collection
                  </Text>
                  <Text variant="overlay-muted">10 Cities • 360 Variants</Text>
                </Stack>
                <Stack gap="element" align="end" className="hidden md:flex">
                  <Text variant="overlay-muted">Starting from</Text>
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
            {[
              { value: "10", label: "Latvian Cities" },
              { value: "360", label: "Unique Variants" },
              { value: "5★", label: "Customer Rating" },
            ].map((stat, index) => (
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
                      /01 Featured
                    </Text>
                    <Text as="h2" variant="display-md">
                      City Crests
                    </Text>
                    <Text variant="muted" className="leading-relaxed">
                      Each coat of arms represents centuries of history,
                      craftsmanship, and cultural identity. Wear your heritage
                      with pride.
                    </Text>
                  </Stack>

                  <Stack gap="group">
                    <Row justify="between">
                      <Text variant="muted-sm">Available designs</Text>
                      <Text variant="body-sm" className="font-medium">
                        10
                      </Text>
                    </Row>
                    <Row justify="between">
                      <Text variant="muted-sm">Price range</Text>
                      <Text variant="body-sm" className="font-medium">
                        €24.99 - €28.99
                      </Text>
                    </Row>
                    <Row justify="between">
                      <Text variant="muted-sm">Sizes</Text>
                      <Text variant="body-sm" className="font-medium">
                        XS - XXL
                      </Text>
                    </Row>
                  </Stack>

                  <Button variant="minimal" asChild className="w-full group">
                    <Link href="/products">
                      <span className="text-label">Browse All</span>
                      <IconArrowUpRight
                        className="size-4 transition-transform duration-300 group-hover:translate-x-1 group-hover:-translate-y-1"
                        aria-hidden="true"
                      />
                    </Link>
                  </Button>
                </Stack>
              </div>
            </div>

            {/* Product Grid */}
            <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-group">
              {featuredProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
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
        <Container>
          <div className="relative overflow-hidden bg-surface-dark text-overlay-foreground">
            {/* Background pattern */}
            <div className="absolute inset-0 opacity-10">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/30 via-transparent to-primary/20" />
            </div>

            <div className="relative text-center py-page px-section">
              <Stack gap="section" align="center">
                <Text as="h2" variant="display-md" className="text-overlay-foreground">
                  Join the Heritage Community
                </Text>
                <Text variant="overlay-muted" className="max-w-2xl mx-auto">
                  Be the first to discover new city designs, exclusive drops,
                  and member-only benefits.
                </Text>

                {/* Email form */}
                <Row gap="group" wrap="wrap" justify="center" className="w-full max-w-md">
                  <Input
                    type="email"
                    placeholder="Enter your email"
                    variant="minimal-dark"
                    className="flex-1 min-w-[200px]"
                    aria-label="Email address"
                  />
                  <Button
                    variant="minimal-light"
                    className="text-label whitespace-nowrap"
                  >
                    Subscribe
                  </Button>
                </Row>

                <Text variant="overlay-subtle" className="text-sm">
                  No spam, just curated content and exclusive access.
                </Text>
              </Stack>
            </div>
          </div>
        </Container>
      </Section>

      {/* Final CTA Section */}
      <Section spacing="large" background="muted">
        <Container>
          <Stack gap="section" align="center" className="max-w-2xl mx-auto">
            <Text as="h2" variant="display-md" align="center">
              Ready to wear your heritage?
            </Text>
            <Text variant="muted" align="center">
              Join thousands of Latvians and Latvia enthusiasts who proudly wear
              their city&apos;s coat of arms.
            </Text>
            <Row gap="group" wrap="wrap" justify="center">
              <Button variant="minimal" asChild size="lg" className="text-label">
                <Link href="/products">
                  <IconShoppingBag className="size-4" aria-hidden="true" />
                  Shop Now
                </Link>
              </Button>
            </Row>
          </Stack>
        </Container>
      </Section>
    </div>
  );
}
