/**
 * Theme CSS injection utilities
 *
 * applyThemeToDOM() sets CSS custom properties on <html> so all components
 * using semantic tokens (bg-primary, gap-section, etc.) update instantly.
 */

import type { GerboniTheme, ThemeColors, ThemeAnimations } from "./types"

// ---------------------------------------------------------------------------
// Token → CSS variable mapping
// ---------------------------------------------------------------------------

/** Maps ThemeColors keys to their CSS custom property names */
const COLOR_TOKEN_MAP: Record<keyof ThemeColors, string> = {
  background: "--background",
  foreground: "--foreground",
  card: "--card",
  cardForeground: "--card-foreground",
  popover: "--popover",
  popoverForeground: "--popover-foreground",
  primary: "--primary",
  primaryForeground: "--primary-foreground",
  secondary: "--secondary",
  secondaryForeground: "--secondary-foreground",
  muted: "--muted",
  mutedForeground: "--muted-foreground",
  accent: "--accent",
  accentForeground: "--accent-foreground",
  destructive: "--destructive",
  destructiveForeground: "--destructive-foreground",
  border: "--border",
  input: "--input",
  ring: "--ring",
  surfaceMuted: "--surface-muted",
  surfaceDark: "--surface-dark",
  borderSubtle: "--border-subtle",
  success: "--success",
  successForeground: "--success-foreground",
  warning: "--warning",
  warningForeground: "--warning-foreground",
  overlayForeground: "--overlay-foreground",
  overlayForegroundMuted: "--overlay-foreground-muted",
  overlayForegroundSubtle: "--overlay-foreground-subtle",
  redBrand: "--red-brand",
  redBrandForeground: "--red-brand-foreground",
  ratingFill: "--rating-fill",
  successBg: "--success-bg",
  tshirtStroke: "--tshirt-stroke",
  chart1: "--chart-1",
  chart2: "--chart-2",
  chart3: "--chart-3",
  chart4: "--chart-4",
  chart5: "--chart-5",
  sidebar: "--sidebar",
  sidebarForeground: "--sidebar-foreground",
  sidebarPrimary: "--sidebar-primary",
  sidebarPrimaryForeground: "--sidebar-primary-foreground",
  sidebarAccent: "--sidebar-accent",
  sidebarAccentForeground: "--sidebar-accent-foreground",
  sidebarBorder: "--sidebar-border",
  sidebarRing: "--sidebar-ring",
}

const ANIMATION_TOKEN_MAP: Record<keyof Required<ThemeAnimations>, string> = {
  durationInstant: "--duration-instant",
  durationFast: "--duration-fast",
  durationNormal: "--duration-normal",
  durationSlow: "--duration-slow",
  durationSlower: "--duration-slower",
  easingDefault: "--easing-default",
  easingIn: "--easing-in",
  easingOut: "--easing-out",
  easingInOut: "--easing-in-out",
  easingBounce: "--easing-bounce",
  easingSpring: "--easing-spring",
}

/** Style tag ID used for dark mode overrides */
const DARK_STYLE_ID = "gerboni-theme-dark"

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Apply a theme to the DOM by setting CSS custom properties on <html>.
 *
 * - Sets all light-mode color tokens inline on documentElement
 * - Injects/replaces a <style> tag for dark-mode overrides
 * - Sets data-theme, data-effects-* attributes
 * - Updates spacing, radius, typography, and animation tokens
 */
export function applyThemeToDOM(theme: GerboniTheme): void {
  const root = document.documentElement

  // --- Colors (light mode) ---
  for (const [key, cssVar] of Object.entries(COLOR_TOKEN_MAP)) {
    const value = theme.colors[key as keyof ThemeColors]
    if (value) {
      root.style.setProperty(cssVar, value)
    }
  }

  // --- Dark mode overrides via <style> tag ---
  let darkStyle = document.getElementById(DARK_STYLE_ID) as HTMLStyleElement | null
  if (theme.darkColors && Object.keys(theme.darkColors).length > 0) {
    const darkRules = Object.entries(theme.darkColors)
      .filter(([, v]) => v != null)
      .map(([key, value]) => {
        const cssVar = COLOR_TOKEN_MAP[key as keyof ThemeColors]
        return cssVar ? `  ${cssVar}: ${value};` : ""
      })
      .filter(Boolean)
      .join("\n")

    const css = `.dark {\n${darkRules}\n}`

    if (!darkStyle) {
      darkStyle = document.createElement("style")
      darkStyle.id = DARK_STYLE_ID
      document.head.appendChild(darkStyle)
    }
    darkStyle.textContent = css
  } else if (darkStyle) {
    darkStyle.remove()
  }

  // --- Typography ---
  root.style.setProperty("--font-sans", theme.typography.fontSans)
  root.style.setProperty("--font-heading", theme.typography.fontHeading)
  root.style.setProperty("--font-serif", theme.typography.fontSerif)
  root.style.setProperty("--font-mono", theme.typography.fontMono)
  root.style.setProperty("--font-latvian", theme.typography.fontLatvian)
  root.style.setProperty("--tracking-heading", theme.typography.trackingHeading)
  root.style.setProperty("--tracking-body", theme.typography.trackingBody)

  // --- Spacing ---
  root.style.setProperty("--space-page", theme.spacing.page)
  root.style.setProperty("--space-section", theme.spacing.section)
  root.style.setProperty("--space-group", theme.spacing.group)
  root.style.setProperty("--space-element", theme.spacing.element)

  // --- Radius ---
  root.style.setProperty("--radius", theme.radius.base)
  root.style.setProperty("--radius-card", theme.radius.card)

  // --- Animations (optional overrides) ---
  if (theme.animations) {
    for (const [key, cssVar] of Object.entries(ANIMATION_TOKEN_MAP)) {
      const value = theme.animations[key as keyof ThemeAnimations]
      if (value) {
        root.style.setProperty(cssVar, value)
      }
    }
  }

  // --- Effects ---
  root.setAttribute("data-theme", theme.id)
  root.setAttribute("data-effects-3d", String(theme.effects.enable3DButton))
  root.setAttribute("data-effects-underline", String(theme.effects.enableHoverUnderline))
  root.setAttribute("data-effects-scale", String(theme.effects.enableHoverScale))
}

/**
 * Remove all theme-applied inline styles and data attributes from <html>.
 * Used when reverting to the CSS-defined default theme.
 */
export function clearThemeFromDOM(): void {
  const root = document.documentElement

  // Remove all color properties
  for (const cssVar of Object.values(COLOR_TOKEN_MAP)) {
    root.style.removeProperty(cssVar)
  }

  // Remove typography
  root.style.removeProperty("--font-sans")
  root.style.removeProperty("--font-heading")
  root.style.removeProperty("--font-serif")
  root.style.removeProperty("--font-mono")
  root.style.removeProperty("--font-latvian")
  root.style.removeProperty("--tracking-heading")
  root.style.removeProperty("--tracking-body")

  // Remove spacing
  root.style.removeProperty("--space-page")
  root.style.removeProperty("--space-section")
  root.style.removeProperty("--space-group")
  root.style.removeProperty("--space-element")

  // Remove radius
  root.style.removeProperty("--radius")
  root.style.removeProperty("--radius-card")

  // Remove animation overrides
  for (const cssVar of Object.values(ANIMATION_TOKEN_MAP)) {
    root.style.removeProperty(cssVar)
  }

  // Remove dark style tag
  document.getElementById(DARK_STYLE_ID)?.remove()

  // Remove data attributes
  root.removeAttribute("data-theme")
  root.removeAttribute("data-effects-3d")
  root.removeAttribute("data-effects-underline")
  root.removeAttribute("data-effects-scale")
}

/**
 * Dynamically load fonts defined in a theme using the FontFace API.
 * Returns once all fonts are loaded (or logs warnings on failure).
 */
export async function loadThemeFonts(theme: GerboniTheme): Promise<void> {
  if (!theme.fonts || theme.fonts.length === 0) return

  const promises = theme.fonts.map(async (fontDef) => {
    const face = new FontFace(fontDef.family, `url(${fontDef.src})`, {
      weight: fontDef.weight || "400",
      style: fontDef.style || "normal",
    })

    try {
      const loaded = await face.load()
      document.fonts.add(loaded)
    } catch (err) {
      console.warn(`[Theme] Failed to load font "${fontDef.family}" from ${fontDef.src}:`, err)
    }
  })

  await Promise.all(promises)
}

export { COLOR_TOKEN_MAP, ANIMATION_TOKEN_MAP }
