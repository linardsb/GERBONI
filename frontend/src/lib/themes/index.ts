/**
 * Theme Registry
 *
 * All available themes are registered here.
 * To add a new theme: import it and add to the themes array.
 */

import type { GerboniTheme } from "./types"
import { gerboniDefault } from "./gerboni-default"
import { modernMinimal } from "./modern-minimal"
import { classicHeritage } from "./classic-heritage"

export const themes: GerboniTheme[] = [gerboniDefault, modernMinimal, classicHeritage]

export const DEFAULT_THEME_ID = "gerboni-default"

export function getThemeById(id: string): GerboniTheme | undefined {
  return themes.find((t) => t.id === id)
}

// Re-exports
export type { GerboniTheme, ThemeColors, ThemePreviewColors } from "./types"
export { gerboniDefault } from "./gerboni-default"
export { modernMinimal } from "./modern-minimal"
export { classicHeritage } from "./classic-heritage"
export { applyThemeToDOM, clearThemeFromDOM, loadThemeFonts } from "./theme-utils"
