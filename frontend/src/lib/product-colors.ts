/**
 * Product color definitions using OKLch color space
 * Used for t-shirt mockups and color selectors
 */

export type ProductColorKey = "Black" | "White" | "Red"

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
  Red: {
    oklch: "oklch(0.463 0.142 23)",
    bgClass: "bg-primary",
    needsBorder: false,
    darkText: false,
    name: { en: "Burgundy", lv: "Bordo" },
  },
}

/** All available product colors in order */
export const PRODUCT_COLOR_KEYS: ProductColorKey[] = [
  "Black",
  "White",
  "Red",
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
