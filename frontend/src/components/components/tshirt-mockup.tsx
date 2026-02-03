"use client"

import * as React from "react"
import Image from "next/image"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"
import { PRODUCT_COLORS, type ProductColorKey } from "@/lib/product-colors"

const tshirtMockupVariants = cva(
  "relative flex items-center justify-center",
  {
    variants: {
      size: {
        sm: "h-16 w-16",
        md: "h-24 w-24",
        lg: "h-full w-full",
      },
    },
    defaultVariants: {
      size: "lg",
    },
  }
)

const coatOfArmsSizeMap = {
  sm: { containerClass: "size-8", imageSize: 32 },
  md: { containerClass: "size-12", imageSize: 48 },
  lg: { containerClass: "size-24", imageSize: 96 },
}

export interface TShirtMockupProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof tshirtMockupVariants> {
  /** The color of the t-shirt */
  color: ProductColorKey
  /** Path to the coat of arms image (relative to /coats/) */
  coatOfArmsImage: string
  /** Alt text for the coat of arms */
  coatOfArmsAlt: string
  /** Whether to show hover zoom effect */
  showHoverEffect?: boolean
}

function TShirtMockup({
  className,
  size = "lg",
  color,
  coatOfArmsImage,
  coatOfArmsAlt,
  showHoverEffect = false,
  ...props
}: TShirtMockupProps) {
  const colorConfig = PRODUCT_COLORS[color]
  const coatSize = coatOfArmsSizeMap[size ?? "lg"]

  // Determine stroke color based on whether the shirt needs a border
  const strokeColor = colorConfig.needsBorder
    ? "var(--border)"
    : "transparent"

  return (
    <div
      data-slot="tshirt-mockup"
      data-color={color}
      className={cn(tshirtMockupVariants({ size, className }))}
      {...props}
    >
      <svg
        viewBox="0 0 100 100"
        className={cn(
          "h-full w-full drop-shadow-md transition-transform duration-normal",
          showHoverEffect && "group-hover:scale-105"
        )}
        style={{ color: colorConfig.oklch }}
        aria-hidden="true"
      >
        <path
          d="M20 25 L35 20 L40 30 L60 30 L65 20 L80 25 L85 40 L75 45 L75 85 L25 85 L25 45 L15 40 Z"
          fill="currentColor"
          stroke={strokeColor}
          strokeWidth="1"
        />
      </svg>
      {/* Coat of arms overlay */}
      <div
        className={cn(
          "absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/4",
          coatSize.containerClass
        )}
      >
        <Image
          src={`/coats/${coatOfArmsImage}`}
          alt={coatOfArmsAlt}
          width={coatSize.imageSize}
          height={coatSize.imageSize}
          className={cn(
            "h-full w-full object-contain drop-shadow-sm transition-transform duration-normal",
            showHoverEffect && "group-hover:scale-110 group-hover:-translate-y-1"
          )}
          onError={(e) => {
            e.currentTarget.src = "/coats/placeholder.svg"
          }}
        />
      </div>
    </div>
  )
}

export { TShirtMockup, tshirtMockupVariants }
