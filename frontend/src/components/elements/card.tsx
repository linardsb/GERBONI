import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const cardVariants = cva(
  "bg-card text-card-foreground flex flex-col",
  {
    variants: {
      variant: {
        default: "border shadow-sm",
        outline: "border-2",
        ghost: "border-transparent",
        elevated: "border shadow-md",
        muted: "bg-surface-muted border-border-subtle",
      },
      padding: {
        none: "p-0",
        sm: "p-4",
        md: "p-6",
        lg: "p-8",
      },
      gap: {
        none: "gap-0",
        sm: "gap-2",
        md: "gap-4",
        lg: "gap-6",
        section: "gap-section",
      },
      radius: {
        none: "rounded-none",
        sm: "rounded-sm",
        md: "rounded-md",
        lg: "rounded-lg",
        xl: "rounded-xl",
      },
    },
    defaultVariants: {
      variant: "default",
      padding: "none",
      gap: "lg",
      radius: "xl",
    },
  }
)

const cardContentVariants = cva("", {
  variants: {
    padding: {
      none: "px-0",
      sm: "px-4",
      md: "px-6",
      lg: "px-8",
    },
  },
  defaultVariants: {
    padding: "md",
  },
})

function Card({
  className,
  variant,
  padding,
  gap,
  radius,
  ...props
}: React.ComponentProps<"div"> & VariantProps<typeof cardVariants>) {
  return (
    <div
      data-slot="card"
      data-variant={variant}
      className={cn(cardVariants({ variant, padding, gap, radius, className }))}
      {...props}
    />
  )
}

function CardHeader({
  className,
  padding,
  ...props
}: React.ComponentProps<"div"> & VariantProps<typeof cardContentVariants>) {
  return (
    <div
      data-slot="card-header"
      className={cn(
        "@container/card-header grid auto-rows-min grid-rows-[auto_auto] items-start gap-element pt-6 has-data-[slot=card-action]:grid-cols-[1fr_auto] [.border-b]:pb-6",
        cardContentVariants({ padding }),
        className
      )}
      {...props}
    />
  )
}

function CardTitle({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-title"
      className={cn("leading-none font-semibold", className)}
      {...props}
    />
  )
}

function CardDescription({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-description"
      className={cn("text-muted-foreground text-sm", className)}
      {...props}
    />
  )
}

function CardAction({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-action"
      className={cn(
        "col-start-2 row-span-2 row-start-1 self-start justify-self-end",
        className
      )}
      {...props}
    />
  )
}

function CardContent({
  className,
  padding,
  ...props
}: React.ComponentProps<"div"> & VariantProps<typeof cardContentVariants>) {
  return (
    <div
      data-slot="card-content"
      className={cn(cardContentVariants({ padding }), className)}
      {...props}
    />
  )
}

function CardFooter({
  className,
  padding,
  ...props
}: React.ComponentProps<"div"> & VariantProps<typeof cardContentVariants>) {
  return (
    <div
      data-slot="card-footer"
      className={cn(
        "flex items-center pb-6 [.border-t]:pt-6",
        cardContentVariants({ padding }),
        className
      )}
      {...props}
    />
  )
}

export {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardAction,
  CardDescription,
  CardContent,
  cardVariants,
  cardContentVariants,
}
