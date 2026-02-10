"use client"

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react"
import type { GerboniTheme } from "@/lib/themes/types"
import { themes, DEFAULT_THEME_ID, getThemeById } from "@/lib/themes"
import { applyThemeToDOM, clearThemeFromDOM, loadThemeFonts } from "@/lib/themes/theme-utils"

const STORAGE_KEY = "gerboni-theme"

/** Read persisted theme ID from localStorage (safe for SSR) */
function getStoredThemeId(): string {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored && getThemeById(stored)) return stored
  } catch {
    // localStorage not available (SSR, private browsing)
  }
  return DEFAULT_THEME_ID
}

interface GerboniThemeContextValue {
  /** The active theme object */
  theme: GerboniTheme
  /** The active theme ID */
  themeId: string
  /** Switch to a different theme by ID */
  setTheme: (id: string) => void
  /** All registered themes */
  availableThemes: GerboniTheme[]
}

const GerboniThemeContext = createContext<GerboniThemeContextValue | null>(null)

/**
 * Provides the Gerboni theme system.
 *
 * Reads theme preference from localStorage via lazy state initializer,
 * applies CSS variables to documentElement, and exposes setTheme() for switching.
 *
 * The default theme (gerboni-default) is a no-op — it clears
 * inline overrides so the CSS-defined :root values take effect,
 * ensuring SSR fallback stays pixel-perfect.
 */
export function GerboniThemeProvider({ children }: { children: React.ReactNode }) {
  // Lazy initializers read localStorage synchronously — no useEffect setState needed
  const [themeId, setThemeId] = useState(getStoredThemeId)
  const [theme, setThemeObj] = useState<GerboniTheme>(() => getThemeById(getStoredThemeId())!)
  const initialApplied = useRef(false)

  // Apply non-default theme to DOM on first mount (side effect only, no setState)
  useEffect(() => {
    if (initialApplied.current) return
    initialApplied.current = true
    if (themeId !== DEFAULT_THEME_ID) {
      applyThemeToDOM(theme)
      loadThemeFonts(theme)
    }
  }, [themeId, theme])

  const setTheme = useCallback((id: string) => {
    const found = getThemeById(id)
    if (!found) return

    setThemeId(id)
    setThemeObj(found)

    if (id === DEFAULT_THEME_ID) {
      // Clear inline overrides — CSS :root values serve as the default
      clearThemeFromDOM()
    } else {
      applyThemeToDOM(found)
      loadThemeFonts(found)
    }

    try {
      if (id === DEFAULT_THEME_ID) {
        localStorage.removeItem(STORAGE_KEY)
      } else {
        localStorage.setItem(STORAGE_KEY, id)
      }
    } catch {
      // localStorage not available
    }
  }, [])

  return (
    <GerboniThemeContext.Provider
      value={{ theme, themeId, setTheme, availableThemes: themes }}
    >
      {children}
    </GerboniThemeContext.Provider>
  )
}

/**
 * Access the Gerboni theme context.
 * Must be used within <GerboniThemeProvider>.
 */
export function useGerboniTheme(): GerboniThemeContextValue {
  const ctx = useContext(GerboniThemeContext)
  if (!ctx) {
    throw new Error("useGerboniTheme must be used within <GerboniThemeProvider>")
  }
  return ctx
}
