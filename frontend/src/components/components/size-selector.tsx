"use client"

import * as React from "react"
import { cva } from "class-variance-authority"

import { cn } from "@/lib/utils"
import { PRODUCT_SIZES, type ProductSize } from "@/lib/product-colors"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/elements/tooltip"

const sizeButtonVariants = cva(
  "relative w-14 h-10 text-sm font-medium transition-all duration-fast focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
  {
    variants: {
      selected: {
        true: "bg-primary text-primary-foreground border-primary",
        false: "bg-background text-foreground border border-input hover:bg-accent hover:text-accent-foreground",
      },
      disabled: {
        true: "opacity-30 cursor-not-allowed line-through",
        false: "cursor-pointer",
      },
      lowStock: {
        true: "",
        false: "",
      },
    },
    compoundVariants: [
      {
        disabled: true,
        selected: false,
        className: "hover:bg-background hover:text-foreground",
      },
    ],
    defaultVariants: {
      selected: false,
      disabled: false,
      lowStock: false,
    },
  }
)

export interface SizeSelectorProps {
  /** Currently selected size */
  value: ProductSize
  /** Callback when size changes */
  onValueChange: (size: ProductSize) => void
  /** Function to check if a size is in stock */
  isSizeInStock?: (size: ProductSize) => boolean
  /** Function to get stock count for a size */
  getStockCount?: (size: ProductSize) => number
  /** Current locale for translations */
  locale?: "en" | "lv"
  /** Additional class names */
  className?: string
}

function SizeSelector({
  value,
  onValueChange,
  isSizeInStock,
  getStockCount,
  locale = "en",
  className,
}: SizeSelectorProps) {
  return (
    <div
      data-slot="size-selector"
      className={cn("flex flex-wrap gap-group", className)}
      role="radiogroup"
      aria-label={locale === "lv" ? "Izvēlies izmēru" : "Select size"}
    >
      {PRODUCT_SIZES.map((size) => {
        const isSelected = value === size
        const inStock = isSizeInStock?.(size) ?? true
        const stockCount = getStockCount?.(size)
        const isLowStock = stockCount !== undefined && stockCount > 0 && stockCount <= 5

        return (
          <Tooltip key={size}>
            <TooltipTrigger asChild>
              <button
                type="button"
                onClick={() => inStock && onValueChange(size)}
                disabled={!inStock}
                role="radio"
                aria-checked={isSelected}
                aria-label={`${locale === "lv" ? "Izmērs" : "Size"} ${size}${!inStock ? (locale === "lv" ? " (nav noliktavā)" : " (out of stock)") : ""}`}
                className={cn(
                  sizeButtonVariants({
                    selected: isSelected,
                    disabled: !inStock,
                    lowStock: isLowStock,
                  })
                )}
              >
                {size}

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
              <span>
                {locale === "lv" ? "Izmērs" : "Size"} {size}
              </span>
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

export { SizeSelector, sizeButtonVariants }
