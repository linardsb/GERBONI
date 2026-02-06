import * as React from "react"
import type { IconComponent } from "@/components/icons"

import { cn } from "@/lib/utils"
import { Stack } from "@/components/elements/stack"
import { Text } from "@/components/elements/text"

interface EmptyStateProps {
  icon?: IconComponent
  title: string
  description?: string
  children?: React.ReactNode
  className?: string
}

function EmptyState({
  icon: IconComponent,
  title,
  description,
  children,
  className,
}: EmptyStateProps) {
  return (
    <Stack gap="lg" align="center" className={cn("py-section text-center", className)}>
      {IconComponent && (
        <div className="flex size-16 items-center justify-center text-muted-foreground">
          <IconComponent className="size-16" />
        </div>
      )}
      <Stack gap="sm" align="center">
        <Text as="h1" variant="heading-md">
          {title}
        </Text>
        {description && (
          <Text variant="muted">
            {description}
          </Text>
        )}
      </Stack>
      {children}
    </Stack>
  )
}

export { EmptyState }
