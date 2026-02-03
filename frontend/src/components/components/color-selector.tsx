"use client"

import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { IconCheck } from "@tabler/icons-react"

import { cn } from "@/lib/utils"
import {
  PRODUCT_COLORS,
  PRODUCT_COLOR_KEYS,
  type ProductColorKey,
} from "@/lib/product-colors"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/elements/tooltip"

const colorButtonVariants = cva(
  "relative size-10 border-2 transition-all duration-fast focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
  {
    variants: {
      selected: {
        true: "border-primary ring-2 ring-primary ring-offset-2",
        false: "border-border hover:border-primary/50",
      },
      disabled: {
        true: "opacity-30 cursor-not-allowed",
        false: "cursor-pointer",
      },
    },
    defaultVariants: {
      selected: false,
      disabled: false,
    },
  }
)

export interface ColorSelectorProps {
  /** Currently selected color */
  value: ProductColorKey
  /** Callback when color changes */
  onValueChange: (color: ProductColorKey) => void
  /** Function to check if a color is in stock */
  isColorInStock?: (color: ProductColorKey) => boolean
  /** Function to get stock count for a color */
  getStockCount?: (color: ProductColorKey) => number
  /** Current locale for translations */
  locale?: "en" | "lv"
  /** Additional class names */
  className?: string
}

function ColorSelector({
  value,
  onValueChange,
  isColorInStock,
  getStockCount,
  locale = "en",
  className,
}: ColorSelectorProps) {
  return (
    <div
      data-slot="color-selector"
      className={cn("flex flex-wrap gap-group", className)}
      role="radiogroup"
      aria-label={locale === "lv" ? "Izvēlies krāsu" : "Select color"}
    >
      {PRODUCT_COLOR_KEYS.map((color) => {
        const colorConfig = PRODUCT_COLORS[color]
        const isSelected = value === color
        const inStock = isColorInStock?.(color) ?? true
        const stockCount = getStockCount?.(color)
        const isLowStock = stockCount !== undefined && stockCount > 0 && stockCount <= 5

        return (
          <Tooltip key={color}>
            <TooltipTrigger asChild>
              <button
                type="button"
                onClick={() => inStock && onValueChange(color)}
                disabled={!inStock}
                role="radio"
                aria-checked={isSelected}
                aria-label={`${colorConfig.name[locale]}${!inStock ? (locale === "lv" ? " (nav noliktavā)" : " (out of stock)") : ""}`}
                className={cn(
                  colorButtonVariants({
                    selected: isSelected,
                    disabled: !inStock,
                  })
                )}
                style={{ backgroundColor: colorConfig.oklch }}
              >
                {/* Selection checkmark */}
                {isSelected && (
                  <IconCheck
                    aria-hidden="true"
                    className={cn(
                      "absolute inset-0 m-auto size-5",
                      colorConfig.darkText ? "text-foreground" : "text-white"
                    )}
                  />
                )}

                {/* Out of stock indicator - diagonal line */}
                {!inStock && (
                  <div
                    className="absolute inset-0 flex items-center justify-center"
                    aria-hidden="true"
                  >
                    <div className="h-px w-full rotate-45 bg-foreground/50" />
                  </div>
                )}

                {/* Low stock indicator dot */}
                {isLowStock && inStock && (
                  <span
                    className="absolute -right-1 -top-1 size-3 rounded-full bg-warning border-2 border-background"
                    aria-hidden="true"
                  />
                )}
              </button>
            </TooltipTrigger>
            <TooltipContent>
              <span>{colorConfig.name[locale]}</span>
              {!inStock && (
                <span className="text-muted-foreground ml-1">
                  ({locale === "lv" ? "nav noliktavā" : "out of stock"})
                </span>
              )}
              {isLowStock && inStock && (
                <span className="text-warning ml-1">
                  ({locale === "lv" ? `${stockCount} atlicis` : `${stockCount} left`})
                </span>
              )}
            </TooltipContent>
          </Tooltip>
        )
      })}
    </div>
  )
}

export { ColorSelector, colorButtonVariants }
