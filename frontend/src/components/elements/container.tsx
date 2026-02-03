import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const containerVariants = cva("mx-auto w-full", {
  variants: {
    size: {
      sm: "max-w-2xl px-4 sm:px-6 lg:px-8",
      md: "max-w-4xl px-4 sm:px-6 lg:px-8",
      lg: "max-w-5xl px-4 sm:px-6 lg:px-8",
      xl: "max-w-6xl px-4 sm:px-6 lg:px-8",
      "2xl": "max-w-7xl px-4 sm:px-6 lg:px-8",
      "3xl": "max-w-[90rem] px-4 sm:px-6 lg:px-8",
      full: "px-[1.5%]",
    },
    padding: {
      none: "py-0",
      sm: "py-6",
      md: "py-12",
      lg: "py-16 md:py-24",
      xl: "py-24 md:py-32",
    },
  },
  defaultVariants: {
    size: "full",
    padding: "none",
  },
})

function Container({
  className,
  size,
  padding,
  children,
  ...props
}: React.ComponentProps<"div"> & VariantProps<typeof containerVariants>) {
  return (
    <div
      data-slot="container"
      className={cn(containerVariants({ size, padding, className }))}
      {...props}
    >
      {children}
    </div>
  )
}

export { Container, containerVariants }
