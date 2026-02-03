import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const responsiveContainerVariants = cva("cq-container", {
  variants: {
    name: {
      default: "",
      card: "cq-container/card",
      section: "cq-container/section",
      sidebar: "cq-container/sidebar",
      main: "cq-container/main",
      grid: "cq-container/grid",
    },
    type: {
      "inline-size": "cq-container",
      normal: "cq-container-normal",
    },
  },
  defaultVariants: {
    name: "default",
    type: "inline-size",
  },
})

interface ResponsiveContainerProps
  extends React.ComponentProps<"div">,
    VariantProps<typeof responsiveContainerVariants> {
  /**
   * Custom container name for nested container queries.
   * Use this when you need to target a specific ancestor container.
   * @example containerName="product-card"
   */
  containerName?: string
}

/**
 * ResponsiveContainer enables container queries on children.
 *
 * Container queries allow responsive styles based on the container's width
 * rather than the viewport width, enabling truly reusable components.
 *
 * @example Basic usage
 * ```tsx
 * <ResponsiveContainer>
 *   <div className="flex flex-col cq-sm:flex-row cq-lg:grid cq-lg:grid-cols-3">
 *     <Card />
 *     <Card />
 *     <Card />
 *   </div>
 * </ResponsiveContainer>
 * ```
 *
 * @example With Grid component using container queries
 * ```tsx
 * <ResponsiveContainer>
 *   <Grid cols={4} containerQuery>
 *     <ProductCard />
 *     <ProductCard />
 *   </Grid>
 * </ResponsiveContainer>
 * ```
 *
 * @example Named container (for nested scenarios)
 * ```tsx
 * <ResponsiveContainer name="card">
 *   <div className="cq-sm:flex-row">...</div>
 * </ResponsiveContainer>
 * ```
 *
 * Available breakpoints (cq- prefix):
 * cq-3xs (16rem), cq-2xs (18rem), cq-xs (20rem), cq-sm (24rem),
 * cq-md (28rem), cq-lg (32rem), cq-xl (36rem), cq-2xl (42rem),
 * cq-3xl (48rem), cq-4xl (56rem), cq-5xl (64rem), cq-6xl (72rem), cq-7xl (80rem)
 */
function ResponsiveContainer({
  className,
  name,
  type,
  containerName,
  style,
  children,
  ...props
}: ResponsiveContainerProps) {
  // Custom container name uses inline style
  const containerStyles = containerName
    ? { ...style, containerType: "inline-size", containerName } as React.CSSProperties
    : style

  // If custom containerName, we only need the base container type utility
  // Otherwise, use the named variant which includes container-name
  const shouldUseNamedVariant = !containerName && name && name !== "default"

  return (
    <div
      data-slot="responsive-container"
      data-container-name={containerName || name || undefined}
      className={cn(
        containerName
          ? "" // Custom name handled via inline style
          : responsiveContainerVariants({
              name: shouldUseNamedVariant ? name : "default",
              type,
            }),
        className
      )}
      style={containerStyles}
      {...props}
    >
      {children}
    </div>
  )
}

export { ResponsiveContainer, responsiveContainerVariants }
