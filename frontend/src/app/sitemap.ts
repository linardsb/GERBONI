import type { MetadataRoute } from "next";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://gerboni.lv";
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

interface ProductListItem {
  id: number;
  city_name: string;
}

async function fetchProducts(): Promise<ProductListItem[]> {
  try {
    const res = await fetch(`${API_URL}/products?limit=100`, {
      next: { revalidate: 3600 },
    });
    if (!res.ok) return [];
    return res.json();
  } catch {
    return [];
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const products = await fetchProducts();
  const locales = ["en", "lv"];

  const staticPages = [
    "",
    "/products",
    "/faq",
    "/about",
    "/shipping",
    "/returns",
    "/terms",
    "/auth/login",
    "/auth/register",
  ];

  const entries: MetadataRoute.Sitemap = [];

  // Static pages for each locale
  for (const locale of locales) {
    for (const page of staticPages) {
      entries.push({
        url: `${SITE_URL}/${locale}${page}`,
        lastModified: new Date(),
        changeFrequency: page === "" ? "daily" : "weekly",
        priority: page === "" ? 1.0 : page === "/products" ? 0.9 : 0.7,
      });
    }
  }

  // Product detail pages for each locale
  for (const product of products) {
    for (const locale of locales) {
      entries.push({
        url: `${SITE_URL}/${locale}/products/${product.id}`,
        lastModified: new Date(),
        changeFrequency: "weekly",
        priority: 0.8,
      });
    }
  }

  return entries;
}
