import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const stackVariants = cva("flex flex-col", {
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
      stretch: "items-stretch",
    },
  },
  defaultVariants: {
    gap: "md",
    align: "stretch",
  },
})

function Stack({
  className,
  gap,
  align,
  children,
  ...props
}: React.ComponentProps<"div"> & VariantProps<typeof stackVariants>) {
  return (
    <div
      data-slot="stack"
      className={cn(stackVariants({ gap, align, className }))}
      {...props}
    >
      {children}
    </div>
  )
}

export { Stack, stackVariants }
