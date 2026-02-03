import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const gridVariants = cva("grid w-full", {
  variants: {
    cols: {
      1: "grid-cols-1",
      2: "grid-cols-1 md:grid-cols-2",
      3: "grid-cols-1 md:grid-cols-2 lg:grid-cols-3",
      4: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4",
      "2-3": "grid-cols-2 lg:grid-cols-3",
      masonry: "grid-cols-2 md:grid-cols-3 lg:grid-cols-4",
    },
    gap: {
      none: "gap-0",
      sm: "gap-2 md:gap-4",
      default: "gap-4 md:gap-6",
      lg: "gap-6 md:gap-8",
      xl: "gap-8 md:gap-12",
      element: "gap-element",
      group: "gap-group",
      section: "gap-section",
    },
  },
  defaultVariants: {
    cols: 2,
    gap: "default",
  },
})

/**
 * Container-query responsive grid variants.
 * Use these when the grid is inside a container query context.
 * Responds to container width instead of viewport width.
 *
 * The parent must have `cq-container` class applied.
 * Use with ResponsiveContainer component for best results.
 */
const gridContainerVariants = cva("grid w-full", {
  variants: {
    cols: {
      1: "grid-cols-1",
      2: "grid-cols-1 cq-md:grid-cols-2",
      3: "grid-cols-1 cq-sm:grid-cols-2 cq-xl:grid-cols-3",
      4: "grid-cols-1 cq-xs:grid-cols-2 cq-lg:grid-cols-3 cq-2xl:grid-cols-4",
      "2-3": "grid-cols-2 cq-xl:grid-cols-3",
      masonry: "grid-cols-2 cq-md:grid-cols-3 cq-2xl:grid-cols-4",
    },
    gap: {
      none: "gap-0",
      sm: "gap-2 cq-md:gap-4",
      default: "gap-4 cq-md:gap-6",
      lg: "gap-6 cq-md:gap-8",
      xl: "gap-8 cq-lg:gap-12",
      element: "gap-element",
      group: "gap-group",
      section: "gap-section",
    },
  },
  defaultVariants: {
    cols: 2,
    gap: "default",
  },
})

interface GridProps
  extends React.ComponentProps<"div">,
    VariantProps<typeof gridVariants> {
  /**
   * When true, uses container queries instead of viewport media queries.
   * The parent must have @container applied (e.g., using ResponsiveContainer).
   * @default false
   */
  containerQuery?: boolean
}

function Grid({
  className,
  cols,
  gap,
  containerQuery = false,
  children,
  ...props
}: GridProps) {
  const variants = containerQuery ? gridContainerVariants : gridVariants

  return (
    <div
      data-slot="grid"
      data-container-query={containerQuery || undefined}
      className={cn(variants({ cols, gap, className }))}
      {...props}
    >
      {children}
    </div>
  )
}

export { Grid, gridVariants, gridContainerVariants }
