import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const sectionVariants = cva("w-full", {
  variants: {
    spacing: {
      default: "py-16 md:py-24",
      compact: "py-8 md:py-12",
      large: "py-24 md:py-32",
      none: "py-0",
    },
    background: {
      default: "bg-background",
      muted: "bg-surface-muted",
      dark: "bg-surface-dark text-white",
      accent: "bg-muted/40",
    },
  },
  defaultVariants: {
    spacing: "default",
    background: "default",
  },
})

function Section({
  className,
  spacing,
  background,
  children,
  ...props
}: React.ComponentProps<"section"> & VariantProps<typeof sectionVariants>) {
  return (
    <section
      data-slot="section"
      className={cn(sectionVariants({ spacing, background, className }))}
      {...props}
    >
      {children}
    </section>
  )
}

export { Section, sectionVariants }
