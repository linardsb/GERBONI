/**
 * Product color definitions using OKLch color space
 * Used for t-shirt mockups and color selectors
 */

export type ProductColorKey = "Black" | "White" | "Navy" | "Gray" | "Red" | "Green"

export interface ProductColor {
  /** OKLch color value for the shirt */
  oklch: string
  /** Tailwind-compatible class for backgrounds */
  bgClass: string
  /** Whether the color needs a visible border (for light colors) */
  needsBorder: boolean
  /** Whether text on this color should be dark */
  darkText: boolean
  /** Localized names */
  name: {
    en: string
    lv: string
  }
}

export const PRODUCT_COLORS: Record<ProductColorKey, ProductColor> = {
  Black: {
    oklch: "oklch(0.2 0 0)",
    bgClass: "bg-zinc-900",
    needsBorder: false,
    darkText: false,
    name: { en: "Black", lv: "Melns" },
  },
  White: {
    oklch: "oklch(0.99 0 0)",
    bgClass: "bg-white",
    needsBorder: true,
    darkText: true,
    name: { en: "White", lv: "Balts" },
  },
  Navy: {
    oklch: "oklch(0.35 0.05 250)",
    bgClass: "bg-blue-950",
    needsBorder: false,
    darkText: false,
    name: { en: "Navy", lv: "Tumši zils" },
  },
  Gray: {
    oklch: "oklch(0.6 0 0)",
    bgClass: "bg-zinc-400",
    needsBorder: false,
    darkText: true,
    name: { en: "Gray", lv: "Pelēks" },
  },
  Red: {
    oklch: "oklch(0.5 0.2 25)",
    bgClass: "bg-red-600",
    needsBorder: false,
    darkText: false,
    name: { en: "Red", lv: "Sarkans" },
  },
  Green: {
    oklch: "oklch(0.45 0.15 145)",
    bgClass: "bg-green-600",
    needsBorder: false,
    darkText: false,
    name: { en: "Green", lv: "Zaļš" },
  },
}

/** All available product colors in order */
export const PRODUCT_COLOR_KEYS: ProductColorKey[] = [
  "Black",
  "White",
  "Navy",
  "Gray",
  "Red",
  "Green",
]

/** All available sizes */
export const PRODUCT_SIZES = ["XS", "S", "M", "L", "XL", "XXL"] as const
export type ProductSize = (typeof PRODUCT_SIZES)[number]

/**
 * Get localized color name
 */
export function getColorName(
  color: ProductColorKey,
  locale: "en" | "lv"
): string {
  return PRODUCT_COLORS[color]?.name[locale] ?? color
}

/**
 * Check if a string is a valid product color key
 */
export function isValidColorKey(color: string): color is ProductColorKey {
  return color in PRODUCT_COLORS
}
