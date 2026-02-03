import * as React from "react"
import Image from "next/image"

import { cn } from "@/lib/utils"
import { Stack } from "@/components/elements/stack"
import { Text } from "@/components/elements/text"

interface FeatureSectionProps {
  image: string
  title: string
  description: string
  reverse?: boolean
  children?: React.ReactNode
  className?: string
}

function FeatureSection({
  image,
  title,
  description,
  reverse = false,
  children,
  className,
}: FeatureSectionProps) {
  return (
    <div
      className={cn(
        "grid md:grid-cols-2 gap-section md:gap-page items-center",
        reverse && "md:[&>*:first-child]:order-2",
        className
      )}
    >
      <div className="relative aspect-[4/3] overflow-hidden">
        <Image
          src={image}
          alt={title}
          fill
          className="object-cover"
        />
      </div>
      <Stack gap="lg">
        <Text as="h3" variant="display-md">{title}</Text>
        <Text variant="muted" className="leading-relaxed">{description}</Text>
        {children}
      </Stack>
    </div>
  )
}

export { FeatureSection }
