import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { Container } from "@/components/elements/container";
import { Text } from "@/components/elements/text";
import { JsonLd } from "@/components/compositions/json-ld";
import { ProductClient } from "./product-client";
import type { ProductDetail } from "@/lib/api";

const API_URL = process.env.INTERNAL_API_URL || process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://gerboni.lv";

type Props = {
  params: Promise<{ locale: string; id: string }>;
};

async function fetchProduct(id: string, lang: string): Promise<ProductDetail | null> {
  try {
    const res = await fetch(`${API_URL}/products/${id}?lang=${lang}`, {
      next: { revalidate: 300 },
    });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, id } = await params;
  const product = await fetchProduct(id, locale);

  if (!product) {
    const t = await getTranslations({ locale, namespace: "product" });
    return { title: t("productNotFound") };
  }

  const cityName = locale === "lv"
    ? product.city_name_lv || product.city_name
    : product.city_name;
  const description = locale === "lv"
    ? product.description_lv || product.description
    : product.description;
  const title = locale === "lv"
    ? `${cityName} ģerboņa krekls | GERBONI`
    : `${cityName} Coat of Arms T-Shirt | GERBONI`;

  return {
    title,
    description: description.slice(0, 160),
    openGraph: {
      title,
      description: description.slice(0, 160),
      url: `${SITE_URL}/${locale}/products/${id}`,
      siteName: "GERBONI",
      type: "website",
      images: [
        {
          url: `${SITE_URL}/coats/${product.coat_of_arms_image}`,
          width: 800,
          height: 800,
          alt: `${cityName} coat of arms t-shirt`,
        },
      ],
    },
    alternates: {
      canonical: `${SITE_URL}/${locale}/products/${id}`,
      languages: {
        en: `${SITE_URL}/en/products/${id}`,
        lv: `${SITE_URL}/lv/products/${id}`,
      },
    },
  };
}

export default async function ProductPage({ params }: Props) {
  const { locale, id } = await params;

  if (isNaN(Number(id))) {
    notFound();
  }

  const product = await fetchProduct(id, locale);

  if (!product) {
    const t = await getTranslations({ locale, namespace: "product" });
    return (
      <Container padding="md">
        <Text variant="error" align="center">{t("productNotFound")}</Text>
      </Container>
    );
  }

  const cityName = locale === "lv"
    ? product.city_name_lv || product.city_name
    : product.city_name;
  const description = locale === "lv"
    ? product.description_lv || product.description
    : product.description;
  const minPrice = product.variants.length
    ? Math.min(...product.variants.map((v) => v.price))
    : 24.99;
  const maxPrice = product.variants.length
    ? Math.max(...product.variants.map((v) => v.price))
    : 28.99;
  const totalStock = product.variants.reduce((sum, v) => sum + v.stock, 0);

  const productJsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: `${cityName} Coat of Arms T-Shirt`,
    description,
    image: `${SITE_URL}/coats/${product.coat_of_arms_image}`,
    brand: {
      "@type": "Brand",
      name: "GERBONI",
    },
    offers: {
      "@type": "AggregateOffer",
      lowPrice: minPrice.toFixed(2),
      highPrice: maxPrice.toFixed(2),
      priceCurrency: "EUR",
      availability: totalStock > 0
        ? "https://schema.org/InStock"
        : "https://schema.org/OutOfStock",
      offerCount: product.variants.length,
    },
    sku: product.variants[0]?.sku,
    category: "Clothing > T-Shirts",
  };

  return (
    <>
      <JsonLd data={productJsonLd} />
      <ProductClient product={product} />
    </>
  );
}
