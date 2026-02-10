/**
 * Gerboni Theme System — Type Definitions
 *
 * Every customizable token is typed here. Themes are TS objects
 * that the ThemeProvider applies as CSS custom properties at runtime.
 */

/** Font to load dynamically via the FontFace API */
export interface ThemeFontDefinition {
  /** CSS font-family name */
  family: string
  /** Path relative to /public (e.g. "/fonts/themes/modern/Inter.woff2") */
  src: string
  /** CSS font-weight (default "400") */
  weight?: string
  /** CSS font-style (default "normal") */
  style?: string
}

/** All semantic color tokens — values must be valid CSS (oklch, hex, etc.) */
export interface ThemeColors {
  background: string
  foreground: string
  card: string
  cardForeground: string
  popover: string
  popoverForeground: string
  primary: string
  primaryForeground: string
  secondary: string
  secondaryForeground: string
  muted: string
  mutedForeground: string
  accent: string
  accentForeground: string
  destructive: string
  destructiveForeground: string
  border: string
  input: string
  ring: string
  surfaceMuted: string
  surfaceDark: string
  borderSubtle: string
  success: string
  successForeground: string
  warning: string
  warningForeground: string
  overlayForeground: string
  overlayForegroundMuted: string
  overlayForegroundSubtle: string
  redBrand: string
  redBrandForeground: string
  ratingFill: string
  successBg: string
  tshirtStroke: string
  chart1: string
  chart2: string
  chart3: string
  chart4: string
  chart5: string
  sidebar: string
  sidebarForeground: string
  sidebarPrimary: string
  sidebarPrimaryForeground: string
  sidebarAccent: string
  sidebarAccentForeground: string
  sidebarBorder: string
  sidebarRing: string
}

/** Typography settings */
export interface ThemeTypography {
  /** CSS font-family for body text (maps to --font-sans) */
  fontSans: string
  /** CSS font-family for headings (maps to --font-heading via --font-capsuula fallback) */
  fontHeading: string
  /** CSS font-family for serif/display (maps to --font-serif) */
  fontSerif: string
  /** CSS font-family for monospace (maps to --font-mono) */
  fontMono: string
  /** CSS font-family for Latvian display text (maps to --font-latvian) */
  fontLatvian: string
  /** Letter-spacing for headings (e.g. "0.04em") */
  trackingHeading: string
  /** Letter-spacing for body text (e.g. "0.01em") */
  trackingBody: string
}

/** Semantic spacing scale */
export interface ThemeSpacing {
  /** Page-level sections (default: "3rem") */
  page: string
  /** Section boundaries (default: "2rem") */
  section: string
  /** Related items (default: "1rem") */
  group: string
  /** Tight spacing (default: "0.5rem") */
  element: string
}

/** Border radius tokens */
export interface ThemeRadius {
  /** Base radius (--radius, default: "0") */
  base: string
  /** Card/hero radius (--radius-card, default: "0.625rem") */
  card: string
}

/** Animation overrides */
export interface ThemeAnimations {
  durationInstant?: string
  durationFast?: string
  durationNormal?: string
  durationSlow?: string
  durationSlower?: string
  easingDefault?: string
  easingIn?: string
  easingOut?: string
  easingInOut?: string
  easingBounce?: string
  easingSpring?: string
}

/** Visual effect toggles */
export interface ThemeEffects {
  /** Enable 3D pushback button flip effect */
  enable3DButton: boolean
  /** Enable hover underline on nav/footer links */
  enableHoverUnderline: boolean
  /** Enable scale-on-hover for product images */
  enableHoverScale: boolean
}

/** Preview colors for the theme switcher UI */
export interface ThemePreviewColors {
  primary: string
  background: string
  foreground: string
  accent: string
}

/** Complete theme definition */
export interface GerboniTheme {
  id: string
  name: string
  description: string
  previewColors: ThemePreviewColors
  colors: ThemeColors
  /** Partial color overrides for dark mode — merged on top of colors */
  darkColors: Partial<ThemeColors>
  typography: ThemeTypography
  spacing: ThemeSpacing
  radius: ThemeRadius
  animations?: ThemeAnimations
  effects: ThemeEffects
  /** Fonts to load dynamically (not needed if using already-loaded fonts) */
  fonts?: ThemeFontDefinition[]
}
