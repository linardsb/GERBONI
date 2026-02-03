import * as React from "react"
import Image from "next/image"
import Link from "next/link"

import { cn } from "@/lib/utils"
import { Stack } from "@/components/elements/stack"
import { Text } from "@/components/elements/text"

interface ImageCardProps {
  image: string
  title: string
  label?: string
  subtitle?: string
  href: string
  aspectRatio?: "square" | "portrait" | "landscape"
  className?: string
}

const aspectRatioClasses = {
  square: "aspect-square",
  portrait: "aspect-[4/5]",
  landscape: "aspect-[16/9]",
}

function ImageCard({
  image,
  title,
  label,
  subtitle,
  href,
  aspectRatio = "portrait",
  className,
}: ImageCardProps) {
  return (
    <Link
      href={href}
      className={cn(
        "group relative overflow-hidden block",
        aspectRatioClasses[aspectRatio],
        className
      )}
    >
      <Image
        src={image}
        alt={title}
        fill
        className="object-cover hover-scale"
      />
      <div className="absolute inset-0 overlay-gradient-up" />
      <div className="absolute bottom-0 left-0 right-0 p-group">
        <Stack gap="sm">
          {label && (
            <Text variant="label" className="text-overlay-foreground-muted">
              {label}
            </Text>
          )}
          <Text as="h3" variant="display-sm" className="text-overlay-foreground">
            {title}
          </Text>
          {subtitle && (
            <Text variant="overlay-muted">
              {subtitle}
            </Text>
          )}
        </Stack>
      </div>
    </Link>
  )
}

export { ImageCard }
