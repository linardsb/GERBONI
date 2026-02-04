import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Link } from "@/i18n/routing"

import { cn } from "@/lib/utils"

const button3DVariants = cva(
  "btn-3d-pushback inline-flex items-center justify-center whitespace-nowrap text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] cursor-pointer [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "",
        primary: "",
        outline: "",
        minimal: "",
        "minimal-light": "",
      },
      size: {
        default: "",
        sm: "text-sm",
        lg: "text-base",
        xl: "text-base",
        "2xl": "text-lg",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

const faceVariants = {
  default: {
    front: "bg-primary text-primary-foreground border border-primary",
    back: "bg-foreground text-background border border-foreground",
  },
  primary: {
    front: "bg-primary text-primary-foreground border border-primary",
    back: "bg-foreground text-background border border-foreground",
  },
  outline: {
    front: "bg-background text-foreground border border-foreground",
    back: "bg-foreground text-background border border-foreground",
  },
  minimal: {
    front: "bg-background text-foreground border border-foreground",
    back: "bg-foreground text-background border border-foreground",
  },
  "minimal-light": {
    front: "bg-surface-dark/90 text-overlay-foreground border border-overlay-foreground",
    back: "bg-overlay-foreground text-surface-dark border border-overlay-foreground",
  },
}

type Button3DBaseProps = VariantProps<typeof button3DVariants> & {
  children: React.ReactNode
  /** Custom content for the back face. Defaults to same as children. */
  backContent?: React.ReactNode
  className?: string
}

type Button3DAsButton = Button3DBaseProps &
  Omit<React.ComponentProps<"button">, "children"> & {
    href?: never
  }

type Button3DAsLink = Button3DBaseProps &
  Omit<React.ComponentProps<typeof Link>, "children"> & {
    href: string
  }

type Button3DProps = Button3DAsButton | Button3DAsLink

function Button3D({
  className,
  variant = "default",
  size = "default",
  children,
  backContent,
  href,
  ...props
}: Button3DProps) {
  const faces = faceVariants[variant || "default"]

  const content = (
    <>
      <span className={cn("btn-3d-face btn-3d-front", faces.front)}>
        {children}
      </span>
      <span className={cn("btn-3d-face btn-3d-back", faces.back)}>
        {backContent ?? children}
      </span>
    </>
  )

  if (href) {
    return (
      <Link
        href={href}
        data-slot="button-3d"
        data-variant={variant}
        data-size={size}
        className={cn(button3DVariants({ variant, size, className }))}
        {...(props as Omit<React.ComponentProps<typeof Link>, "children" | "href">)}
      >
        {content}
      </Link>
    )
  }

  return (
    <button
      data-slot="button-3d"
      data-variant={variant}
      data-size={size}
      className={cn(button3DVariants({ variant, size, className }))}
      {...(props as Omit<React.ComponentProps<"button">, "children">)}
    >
      {content}
    </button>
  )
}

export { Button3D, button3DVariants }
