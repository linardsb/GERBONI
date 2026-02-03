import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"
import { Stack } from "@/components/elements/stack"
import { Text } from "@/components/elements/text"

const pageHeaderVariants = cva("", {
  variants: {
    align: {
      left: "text-left",
      center: "text-center",
    },
    spacing: {
      sm: "mb-group",
      md: "mb-section",
      lg: "mb-page",
    },
  },
  defaultVariants: {
    align: "left",
    spacing: "md",
  },
})

interface PageHeaderProps extends VariantProps<typeof pageHeaderVariants> {
  label?: string
  title: string
  description?: string
  variant?: "default" | "display"
  className?: string
}

function PageHeader({
  label,
  title,
  description,
  variant = "default",
  align,
  spacing,
  className,
}: PageHeaderProps) {
  return (
    <div className={cn(pageHeaderVariants({ align, spacing, className }))}>
      <Stack gap="sm">
        {label && (
          <Text variant="label" className="text-muted-foreground">
            {label}
          </Text>
        )}
        <Text
          as="h1"
          variant={variant === "display" ? "display-md" : "heading-xl"}
        >
          {title}
        </Text>
        {description && (
          <Text variant="muted-lg" className="max-w-2xl">
            {description}
          </Text>
        )}
      </Stack>
    </div>
  )
}

export { PageHeader, pageHeaderVariants }
