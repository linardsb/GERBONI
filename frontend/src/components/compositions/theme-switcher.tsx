"use client"

import { Suspense, useMemo, useState } from "react"
import { useSearchParams } from "next/navigation"
import { useGerboniTheme } from "@/components/providers/theme-provider"
import { Button } from "@/components/elements/button"
import { Card } from "@/components/elements/card"
import { Text } from "@/components/elements/text"
import { Stack } from "@/components/elements/stack"
import { Row } from "@/components/elements/row"
import { IconPalette, IconX, IconCheck } from "@/components/icons"
import { cn } from "@/lib/utils"

/**
 * Internal component that uses useSearchParams.
 * Wrapped in Suspense by the exported ThemeSwitcher.
 */
function ThemeSwitcherInner() {
  const [open, setOpen] = useState(false)
  const searchParams = useSearchParams()
  const { themeId, setTheme, availableThemes } = useGerboniTheme()

  const visible = useMemo(() => {
    const isDev = process.env.NODE_ENV === "development"
    const hasDebugParam = searchParams.get("theme-debug") === "true"
    return isDev || hasDebugParam
  }, [searchParams])

  if (!visible) return null

  return (
    <div data-slot="theme-switcher" className="fixed bottom-4 left-4 z-50">
      {open ? (
        <Card className="w-72 p-4 shadow-lg border border-border" data-slot="theme-switcher-panel">
          <Stack gap="group">
            <Row justify="between" align="center">
              <Text variant="heading-xs">Theme</Text>
              <Button
                variant="ghost"
                size="icon-xs"
                onClick={() => setOpen(false)}
                aria-label="Close theme switcher"
              >
                <IconX className="size-4" aria-hidden="true" />
              </Button>
            </Row>

            <Stack gap="element">
              {availableThemes.map((t) => {
                const isActive = t.id === themeId
                return (
                  <button
                    key={t.id}
                    onClick={() => setTheme(t.id)}
                    className={cn(
                      "flex items-center gap-3 rounded-md p-2 text-left transition-colors duration-fast",
                      "hover:bg-accent",
                      isActive && "bg-accent"
                    )}
                    aria-pressed={isActive}
                  >
                    {/* Color swatch preview */}
                    <div className="flex shrink-0 gap-0.5" aria-hidden="true">
                      <div
                        className="size-4 rounded-sm"
                        style={{ background: t.previewColors.primary }}
                      />
                      <div
                        className="size-4 rounded-sm"
                        style={{ background: t.previewColors.background }}
                      />
                      <div
                        className="size-4 rounded-sm"
                        style={{ background: t.previewColors.foreground }}
                      />
                      <div
                        className="size-4 rounded-sm"
                        style={{ background: t.previewColors.accent }}
                      />
                    </div>

                    <Stack gap="none" className="min-w-0 flex-1">
                      <Text variant="body-sm" className="font-medium truncate">
                        {t.name}
                      </Text>
                      <Text variant="muted-sm" className="truncate">
                        {t.description}
                      </Text>
                    </Stack>

                    {isActive && (
                      <IconCheck className="size-4 shrink-0 text-primary" aria-hidden="true" />
                    )}
                  </button>
                )
              })}
            </Stack>
          </Stack>
        </Card>
      ) : (
        <Button
          variant="outline"
          size="icon"
          onClick={() => setOpen(true)}
          aria-label="Open theme switcher"
          className="shadow-md"
        >
          <IconPalette className="size-5" aria-hidden="true" />
        </Button>
      )}
    </div>
  )
}

/**
 * Floating theme switcher panel.
 *
 * Only visible in development (`NODE_ENV === "development"`)
 * or when `?theme-debug=true` is in the URL.
 *
 * Wrapped in Suspense because useSearchParams() requires it
 * for static rendering in Next.js App Router.
 */
export function ThemeSwitcher() {
  return (
    <Suspense fallback={null}>
      <ThemeSwitcherInner />
    </Suspense>
  )
}
