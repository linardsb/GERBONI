/**
 * Design Token Reference
 *
 * This file provides TypeScript constants for the Gerboni design system tokens.
 * Use these for validation, testing, and documentation purposes.
 *
 * The actual CSS variables are defined in globals.css.
 */

/**
 * Semantic spacing tokens for gap, padding, and margin
 */
export const SPACING = {
  // Semantic tokens (preferred)
  semantic: {
    page: { css: '--space-page', value: '3rem', pixels: 48, description: 'Page-level sections, major divisions' },
    section: { css: '--space-section', value: '2rem', pixels: 32, description: 'Section boundaries, card groups' },
    group: { css: '--space-group', value: '1rem', pixels: 16, description: 'Related items, form fields' },
    element: { css: '--space-element', value: '0.5rem', pixels: 8, description: 'Inline items, tight spacing' },
  },
  // Numeric scale (for fine control)
  numeric: {
    none: { class: 'gap-0', value: '0' },
    xs: { class: 'gap-1', value: '0.25rem' },
    sm: { class: 'gap-2', value: '0.5rem' },
    md: { class: 'gap-4', value: '1rem' },
    lg: { class: 'gap-6', value: '1.5rem' },
    xl: { class: 'gap-8', value: '2rem' },
    '2xl': { class: 'gap-12', value: '3rem' },
  },
} as const

/**
 * Semantic color tokens
 */
export const COLORS = {
  background: {
    background: 'bg-background',
    foreground: 'bg-foreground',
    card: 'bg-card',
    surfaceMuted: 'bg-surface-muted',
    surfaceDark: 'bg-surface-dark',
    primary: 'bg-primary',
    secondary: 'bg-secondary',
    muted: 'bg-muted',
    accent: 'bg-accent',
    destructive: 'bg-destructive',
    success: 'bg-success',
    warning: 'bg-warning',
    redBrand: 'bg-red-brand',
  },
  text: {
    foreground: 'text-foreground',
    mutedForeground: 'text-muted-foreground',
    primary: 'text-primary',
    primaryForeground: 'text-primary-foreground',
    secondary: 'text-secondary-foreground',
    destructive: 'text-destructive',
    success: 'text-success',
    warning: 'text-warning',
    redBrand: 'text-red-brand',
    redBrandForeground: 'text-red-brand-foreground',
    overlayForeground: 'text-overlay-foreground',
    overlayForegroundMuted: 'text-overlay-foreground-muted',
    overlayForegroundSubtle: 'text-overlay-foreground-subtle',
  },
  border: {
    border: 'border-border',
    borderSubtle: 'border-border-subtle',
    input: 'border-input',
    ring: 'border-ring',
  },
} as const

/**
 * Container query breakpoints
 * Parent must have `cq-container` class
 */
export const CONTAINER_QUERIES = {
  '3xs': { prefix: 'cq-3xs:', minWidth: '16rem', pixels: 256 },
  '2xs': { prefix: 'cq-2xs:', minWidth: '18rem', pixels: 288 },
  xs: { prefix: 'cq-xs:', minWidth: '20rem', pixels: 320 },
  sm: { prefix: 'cq-sm:', minWidth: '24rem', pixels: 384 },
  md: { prefix: 'cq-md:', minWidth: '28rem', pixels: 448 },
  lg: { prefix: 'cq-lg:', minWidth: '32rem', pixels: 512 },
  xl: { prefix: 'cq-xl:', minWidth: '36rem', pixels: 576 },
  '2xl': { prefix: 'cq-2xl:', minWidth: '42rem', pixels: 672 },
  '3xl': { prefix: 'cq-3xl:', minWidth: '48rem', pixels: 768 },
  '4xl': { prefix: 'cq-4xl:', minWidth: '56rem', pixels: 896 },
  '5xl': { prefix: 'cq-5xl:', minWidth: '64rem', pixels: 1024 },
  '6xl': { prefix: 'cq-6xl:', minWidth: '72rem', pixels: 1152 },
  '7xl': { prefix: 'cq-7xl:', minWidth: '80rem', pixels: 1280 },
} as const

/**
 * Forbidden patterns that violate the design system
 * Used for validation and linting
 */
export const FORBIDDEN_PATTERNS = [
  {
    pattern: /style=\{/,
    message: 'Use Tailwind classes instead of inline styles',
    severity: 'error' as const,
  },
  {
    pattern: /gap-\[\d/,
    message: 'Use semantic gap tokens: gap-element, gap-group, gap-section, gap-page',
    severity: 'error' as const,
  },
  {
    pattern: /p-\[\d/,
    message: 'Use padding variants instead of arbitrary padding',
    severity: 'error' as const,
  },
  {
    pattern: /p[xytblr]-\[\d/,
    message: 'Use padding variants instead of arbitrary padding',
    severity: 'error' as const,
  },
  {
    pattern: /m-\[\d/,
    message: 'Use margin tokens instead of arbitrary margin',
    severity: 'warning' as const,
  },
  {
    pattern: /m[xytblr]-\[\d/,
    message: 'Use margin tokens instead of arbitrary margin',
    severity: 'warning' as const,
  },
  {
    pattern: /#[0-9a-fA-F]{3,6}(?![0-9a-fA-F])/,
    message: 'Use semantic color tokens instead of hex colors',
    severity: 'error' as const,
  },
  {
    pattern: /rgb\(/,
    message: 'Use semantic color tokens instead of rgb()',
    severity: 'error' as const,
  },
  {
    pattern: /rgba\(/,
    message: 'Use semantic color tokens instead of rgba()',
    severity: 'error' as const,
  },
  {
    pattern: /hsl\(/,
    message: 'Use semantic color tokens instead of hsl()',
    severity: 'error' as const,
  },
  {
    pattern: /hsla\(/,
    message: 'Use semantic color tokens instead of hsla()',
    severity: 'error' as const,
  },
] as const

/**
 * Validate code against design system patterns
 * @param code - The code string to validate
 * @returns Array of violations with messages and severity
 */
export function validateDesignSystem(code: string): Array<{
  pattern: RegExp
  message: string
  severity: 'error' | 'warning'
  match: string
}> {
  const violations: Array<{
    pattern: RegExp
    message: string
    severity: 'error' | 'warning'
    match: string
  }> = []

  for (const { pattern, message, severity } of FORBIDDEN_PATTERNS) {
    const match = code.match(pattern)
    if (match) {
      violations.push({
        pattern,
        message,
        severity,
        match: match[0],
      })
    }
  }

  return violations
}

/**
 * Check if a component has the required data-slot attribute
 * @param code - The component code string
 * @returns true if data-slot is present
 */
export function hasDataSlot(code: string): boolean {
  return /data-slot=["'][\w-]+["']/.test(code)
}

/**
 * Check if a component uses cn() for className merging
 * @param code - The component code string
 * @returns true if cn() is used with className
 */
export function usesCnUtility(code: string): boolean {
  return /className=\{cn\(/.test(code)
}

/**
 * Valid gap values for layout components
 */
export const VALID_GAP_VALUES = [
  'none',
  'xs',
  'sm',
  'md',
  'lg',
  'xl',
  '2xl',
  'element',
  'group',
  'section',
  'page',
] as const

export type GapValue = (typeof VALID_GAP_VALUES)[number]

/**
 * Typography variants available in the Text component
 */
export const TEXT_VARIANTS = [
  // Display
  'display-xl',
  'display-lg',
  'display-md',
  'display-sm',
  // Headings
  'heading-xl',
  'heading-lg',
  'heading-md',
  'heading-sm',
  'heading-xs',
  // Body
  'body-lg',
  'body-md',
  'body-sm',
  // Special
  'label',
  'fine',
  'muted',
  'muted-sm',
  'muted-lg',
  'price',
  'price-lg',
  'error',
  'success',
  'warning',
  'overlay',
  'overlay-muted',
  'overlay-subtle',
  'emoji',
  'nav-link',
  'link-primary',
] as const

export type TextVariant = (typeof TEXT_VARIANTS)[number]

/**
 * Button variants
 */
export const BUTTON_VARIANTS = [
  'default',
  'destructive',
  'outline',
  'secondary',
  'ghost',
  'link',
  'minimal',
  'minimal-light',
  'text-underline',
] as const

export type ButtonVariant = (typeof BUTTON_VARIANTS)[number]

/**
 * Button sizes
 */
export const BUTTON_SIZES = [
  'default',
  'xs',
  'sm',
  'lg',
  'icon',
  'icon-xs',
  'icon-sm',
  'icon-lg',
] as const

export type ButtonSize = (typeof BUTTON_SIZES)[number]

/**
 * Card variants
 */
export const CARD_VARIANTS = [
  'default',
  'outline',
  'ghost',
  'elevated',
  'muted',
] as const

export type CardVariant = (typeof CARD_VARIANTS)[number]

/**
 * Animation duration tokens
 */
export const ANIMATION_DURATION = {
  instant: { css: '--duration-instant', value: '50ms', ms: 50, description: 'Micro-interactions, toggles' },
  fast: { css: '--duration-fast', value: '150ms', ms: 150, description: 'Hover states, quick feedback' },
  normal: { css: '--duration-normal', value: '300ms', ms: 300, description: 'Standard transitions' },
  slow: { css: '--duration-slow', value: '500ms', ms: 500, description: 'Page transitions, modals' },
  slower: { css: '--duration-slower', value: '700ms', ms: 700, description: 'Complex animations' },
} as const

export type AnimationDuration = keyof typeof ANIMATION_DURATION

/**
 * Animation easing tokens
 */
export const ANIMATION_EASING = {
  default: { css: '--easing-default', value: 'cubic-bezier(0.4, 0, 0.2, 1)', description: 'Standard easing' },
  in: { css: '--easing-in', value: 'cubic-bezier(0.4, 0, 1, 1)', description: 'Accelerating' },
  out: { css: '--easing-out', value: 'cubic-bezier(0, 0, 0.2, 1)', description: 'Decelerating' },
  inOut: { css: '--easing-in-out', value: 'cubic-bezier(0.4, 0, 0.2, 1)', description: 'Smooth both ways' },
  bounce: { css: '--easing-bounce', value: 'cubic-bezier(0.34, 1.56, 0.64, 1)', description: 'Bouncy overshoot' },
  spring: { css: '--easing-spring', value: 'cubic-bezier(0.175, 0.885, 0.32, 1.275)', description: 'Spring-like' },
} as const

export type AnimationEasing = keyof typeof ANIMATION_EASING

/**
 * Icon size tokens (for consistent icon sizing)
 */
export const ICON_SIZES = {
  xs: { class: 'size-3', pixels: 12, description: 'Inline icons, badges' },
  sm: { class: 'size-4', pixels: 16, description: 'Button icons, small UI' },
  md: { class: 'size-5', pixels: 20, description: 'Standard icons' },
  lg: { class: 'size-6', pixels: 24, description: 'Navigation, emphasis' },
  xl: { class: 'size-8', pixels: 32, description: 'Feature icons' },
  '2xl': { class: 'size-10', pixels: 40, description: 'Hero icons' },
  '3xl': { class: 'size-12', pixels: 48, description: 'Empty states' },
} as const

export type IconSize = keyof typeof ICON_SIZES

/**
 * Z-index scale for layering
 */
export const Z_INDEX = {
  base: 0,
  dropdown: 10,
  sticky: 20,
  fixed: 30,
  modalBackdrop: 40,
  modal: 50,
  popover: 60,
  tooltip: 70,
  toast: 80,
  max: 9999,
} as const

export type ZIndex = keyof typeof Z_INDEX
