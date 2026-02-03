import * as React from "react"

import { cn } from "@/lib/utils"
import { Section } from "@/components/elements/section"
import { Container } from "@/components/elements/container"
import { Stack } from "@/components/elements/stack"
import { Text } from "@/components/elements/text"

interface HeroMinimalProps {
  title: string
  subtitle?: string
  children?: React.ReactNode
  className?: string
}

function HeroMinimal({ title, subtitle, children, className }: HeroMinimalProps) {
  return (
    <Section spacing="large" className={cn("text-center", className)}>
      <Container size="sm">
        <Stack gap="section" align="center">
          <Text as="h1" variant="display-lg">
            {title}
          </Text>
          {subtitle && (
            <Text variant="muted-lg">
              {subtitle}
            </Text>
          )}
          {children}
        </Stack>
      </Container>
    </Section>
  )
}

export { HeroMinimal }
