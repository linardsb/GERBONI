import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const rowVariants = cva("flex flex-row", {
  variants: {
    gap: {
      none: "gap-0",
      xs: "gap-1",
      sm: "gap-2",
      md: "gap-4",
      lg: "gap-6",
      xl: "gap-8",
      "2xl": "gap-12",
      element: "gap-element",
      group: "gap-group",
      section: "gap-section",
      page: "gap-page",
    },
    align: {
      start: "items-start",
      center: "items-center",
      end: "items-end",
      baseline: "items-baseline",
      stretch: "items-stretch",
    },
    justify: {
      start: "justify-start",
      center: "justify-center",
      end: "justify-end",
      between: "justify-between",
      around: "justify-around",
      evenly: "justify-evenly",
    },
    wrap: {
      nowrap: "flex-nowrap",
      wrap: "flex-wrap",
      "wrap-reverse": "flex-wrap-reverse",
    },
  },
  defaultVariants: {
    gap: "md",
    align: "center",
    justify: "start",
    wrap: "nowrap",
  },
})

function Row({
  className,
  gap,
  align,
  justify,
  wrap,
  children,
  ...props
}: React.ComponentProps<"div"> & VariantProps<typeof rowVariants>) {
  return (
    <div
      data-slot="row"
      className={cn(rowVariants({ gap, align, justify, wrap, className }))}
      {...props}
    >
      {children}
    </div>
  )
}

export { Row, rowVariants }
