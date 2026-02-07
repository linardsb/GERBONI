"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
import { cva } from "class-variance-authority"
import { IconCheck, IconShoppingCart, IconTruck, IconCreditCard, IconCircleCheck } from "@/components/icons"

import { cn } from "@/lib/utils"
import { Text } from "@/components/elements/text"

const stepVariants = cva(
  "relative flex size-10 items-center justify-center rounded-full border-2 transition-colors duration-normal",
  {
    variants: {
      status: {
        completed: "border-primary bg-primary text-primary-foreground",
        current: "border-primary bg-background text-primary",
        upcoming: "border-border bg-background text-muted-foreground",
      },
    },
    defaultVariants: {
      status: "upcoming",
    },
  }
)

const stepLabelVariants = cva(
  "text-xs font-medium transition-colors duration-fast",
  {
    variants: {
      status: {
        completed: "text-primary",
        current: "text-foreground",
        upcoming: "text-muted-foreground",
      },
    },
    defaultVariants: {
      status: "upcoming",
    },
  }
)

type StepStatus = "completed" | "current" | "upcoming"

export type CheckoutStep = "cart" | "shipping" | "payment" | "confirmation"

const STEPS: { key: CheckoutStep; icon: React.ElementType; labelKey: string }[] = [
  { key: "cart", icon: IconShoppingCart, labelKey: "stepCart" },
  { key: "shipping", icon: IconTruck, labelKey: "stepShipping" },
  { key: "payment", icon: IconCreditCard, labelKey: "stepPayment" },
  { key: "confirmation", icon: IconCircleCheck, labelKey: "stepConfirmation" },
]

export interface CheckoutProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Current step in the checkout flow */
  currentStep: CheckoutStep
}

function CheckoutProgress({
  className,
  currentStep,
  ...props
}: CheckoutProgressProps) {
  const t = useTranslations("checkout")
  const currentIndex = STEPS.findIndex((s) => s.key === currentStep)

  const getStepStatus = (index: number): StepStatus => {
    if (index < currentIndex) return "completed"
    if (index === currentIndex) return "current"
    return "upcoming"
  }

  return (
    <nav
      data-slot="checkout-progress"
      aria-label={t("checkoutProgress")}
      className={cn("w-full", className)}
      {...props}
    >
      <ol className="flex items-center justify-between">
        {STEPS.map((step, index) => {
          const status = getStepStatus(index)
          const Icon = step.icon
          const isLast = index === STEPS.length - 1

          return (
            <li
              key={step.key}
              className={cn("flex items-center", !isLast && "flex-1")}
            >
              <div className="flex flex-col items-center gap-2">
                {/* Step circle */}
                <div
                  className={cn(stepVariants({ status }))}
                  aria-current={status === "current" ? "step" : undefined}
                >
                  {status === "completed" ? (
                    <IconCheck className="size-5" aria-hidden="true" />
                  ) : (
                    <Icon className="size-5" aria-hidden="true" />
                  )}
                </div>

                {/* Step label */}
                <Text
                  variant="body-sm"
                  className={cn(stepLabelVariants({ status }), "hidden sm:block")}
                >
                  {t(step.labelKey)}
                </Text>
              </div>

              {/* Connector line */}
              {!isLast && (
                <div
                  className={cn(
                    "mx-4 h-0.5 flex-1 transition-colors duration-normal",
                    index < currentIndex ? "bg-primary" : "bg-border"
                  )}
                  aria-hidden="true"
                />
              )}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}

export { CheckoutProgress, stepVariants, stepLabelVariants }
