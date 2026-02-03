import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { IconCheck, IconX, IconAlertTriangle } from "@tabler/icons-react"

import { cn } from "@/lib/utils"

const statusIconVariants = cva(
  "flex items-center justify-center",
  {
    variants: {
      variant: {
        success: "bg-success/10 text-success",
        error: "bg-destructive/10 text-destructive",
        warning: "bg-warning/10 text-warning",
      },
      size: {
        sm: "h-10 w-10",
        md: "h-16 w-16",
        lg: "h-20 w-20",
      },
    },
    defaultVariants: {
      variant: "success",
      size: "md",
    },
  }
)

const iconSizes = {
  sm: "h-5 w-5",
  md: "h-8 w-8",
  lg: "h-10 w-10",
}

const defaultIcons = {
  success: IconCheck,
  error: IconX,
  warning: IconAlertTriangle,
}

interface StatusIconProps extends VariantProps<typeof statusIconVariants> {
  icon?: React.ComponentType<{ className?: string }>
  className?: string
}

function StatusIcon({
  variant = "success",
  size = "md",
  icon,
  className,
}: StatusIconProps) {
  const IconComponent = icon || defaultIcons[variant || "success"]

  return (
    <div className={cn(statusIconVariants({ variant, size, className }))}>
      <IconComponent className={iconSizes[size || "md"]} />
    </div>
  )
}

export { StatusIcon, statusIconVariants }
