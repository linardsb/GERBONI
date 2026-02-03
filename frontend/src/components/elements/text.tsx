import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const textVariants = cva("", {
  variants: {
    variant: {
      // Display - serif italic for hero/marketing headings
      "display-xl": "text-display text-5xl md:text-7xl lg:text-8xl",
      "display-lg": "text-display text-4xl md:text-5xl lg:text-6xl",
      "display-md": "text-display text-3xl md:text-4xl lg:text-5xl",
      "display-sm": "text-display text-2xl md:text-3xl",
      // Headings - sans-serif bold
      "heading-xl": "text-4xl font-bold tracking-tight",
      "heading-lg": "text-3xl font-bold",
      "heading-md": "text-2xl font-bold",
      "heading-sm": "text-xl font-semibold",
      "heading-xs": "text-lg font-semibold",
      // Body text
      "body-lg": "text-lg leading-relaxed",
      "body-md": "text-base leading-relaxed",
      "body-sm": "text-sm leading-relaxed",
      // Labels - uppercase tracked
      label: "text-label",
      // Fine print
      fine: "text-fine",
      // Muted descriptions
      muted: "text-muted-foreground",
      "muted-sm": "text-sm text-muted-foreground",
      "muted-lg": "text-lg text-muted-foreground",
      // Price
      price: "font-bold text-primary",
      "price-lg": "text-3xl font-bold text-primary",
      // Status colors
      error: "text-destructive",
      success: "text-success",
      warning: "text-warning",
      // Overlay text (for dark backgrounds/images)
      "overlay": "text-overlay-foreground",
      "overlay-muted": "text-overlay-foreground-muted",
      "overlay-subtle": "text-overlay-foreground-subtle",
      // Special
      emoji: "text-3xl",
      "nav-link": "text-sm font-medium text-foreground/80 hover:text-foreground transition-colors",
      "link-primary": "font-medium text-primary hover:underline",
    },
    align: {
      left: "text-left",
      center: "text-center",
      right: "text-right",
    },
  },
  defaultVariants: {
    variant: "body-md",
  },
})

type TextElement = "p" | "span" | "h1" | "h2" | "h3" | "h4" | "h5" | "h6" | "div" | "label"

interface TextProps
  extends Omit<React.HTMLAttributes<HTMLElement>, "children">,
    VariantProps<typeof textVariants> {
  as?: TextElement
  asChild?: boolean
  children?: React.ReactNode
}

function Text({
  className,
  variant,
  align,
  as = "p",
  asChild = false,
  children,
  ...props
}: TextProps) {
  const Comp = asChild ? Slot : as

  return (
    <Comp
      data-slot="text"
      data-variant={variant}
      className={cn(textVariants({ variant, align, className }))}
      {...props}
    >
      {children}
    </Comp>
  )
}

export { Text, textVariants }
