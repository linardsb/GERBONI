import { describe, it, expect, beforeEach, afterEach } from "vitest"
import { applyThemeToDOM, clearThemeFromDOM, COLOR_TOKEN_MAP } from "@/lib/themes/theme-utils"
import { gerboniDefault } from "@/lib/themes/gerboni-default"
import { modernMinimal } from "@/lib/themes/modern-minimal"

describe("theme-utils", () => {
  beforeEach(() => {
    // Reset documentElement state
    clearThemeFromDOM()
  })

  afterEach(() => {
    clearThemeFromDOM()
  })

  describe("applyThemeToDOM", () => {
    it("should set all color CSS custom properties on documentElement", () => {
      applyThemeToDOM(modernMinimal)
      const root = document.documentElement

      expect(root.style.getPropertyValue("--primary")).toBe(modernMinimal.colors.primary)
      expect(root.style.getPropertyValue("--background")).toBe(modernMinimal.colors.background)
      expect(root.style.getPropertyValue("--foreground")).toBe(modernMinimal.colors.foreground)
    })

    it("should set typography tokens", () => {
      applyThemeToDOM(modernMinimal)
      const root = document.documentElement

      expect(root.style.getPropertyValue("--font-sans")).toBe(modernMinimal.typography.fontSans)
      expect(root.style.getPropertyValue("--font-heading")).toBe(modernMinimal.typography.fontHeading)
      expect(root.style.getPropertyValue("--tracking-heading")).toBe(modernMinimal.typography.trackingHeading)
      expect(root.style.getPropertyValue("--tracking-body")).toBe(modernMinimal.typography.trackingBody)
    })

    it("should set spacing tokens", () => {
      applyThemeToDOM(modernMinimal)
      const root = document.documentElement

      expect(root.style.getPropertyValue("--space-page")).toBe(modernMinimal.spacing.page)
      expect(root.style.getPropertyValue("--space-section")).toBe(modernMinimal.spacing.section)
      expect(root.style.getPropertyValue("--space-group")).toBe(modernMinimal.spacing.group)
      expect(root.style.getPropertyValue("--space-element")).toBe(modernMinimal.spacing.element)
    })

    it("should set radius tokens", () => {
      applyThemeToDOM(modernMinimal)
      const root = document.documentElement

      expect(root.style.getPropertyValue("--radius")).toBe(modernMinimal.radius.base)
      expect(root.style.getPropertyValue("--radius-card")).toBe(modernMinimal.radius.card)
    })

    it("should set data-theme attribute", () => {
      applyThemeToDOM(modernMinimal)
      expect(document.documentElement.getAttribute("data-theme")).toBe("modern-minimal")
    })

    it("should set effect data attributes", () => {
      applyThemeToDOM(modernMinimal)
      const root = document.documentElement

      expect(root.getAttribute("data-effects-3d")).toBe("false")
      expect(root.getAttribute("data-effects-underline")).toBe("false")
      expect(root.getAttribute("data-effects-scale")).toBe("true")
    })

    it("should inject dark mode style tag when darkColors exist", () => {
      applyThemeToDOM(modernMinimal)
      const styleTag = document.getElementById("gerboni-theme-dark")

      expect(styleTag).not.toBeNull()
      expect(styleTag?.textContent).toContain(".dark {")
      expect(styleTag?.textContent).toContain("--primary:")
    })

    it("should replace dark mode style tag on subsequent calls", () => {
      applyThemeToDOM(modernMinimal)
      applyThemeToDOM(gerboniDefault)

      const styleTags = document.querySelectorAll("#gerboni-theme-dark")
      expect(styleTags.length).toBe(1)
    })
  })

  describe("clearThemeFromDOM", () => {
    it("should remove all inline styles from documentElement", () => {
      applyThemeToDOM(modernMinimal)
      clearThemeFromDOM()
      const root = document.documentElement

      expect(root.style.getPropertyValue("--primary")).toBe("")
      expect(root.style.getPropertyValue("--background")).toBe("")
      expect(root.style.getPropertyValue("--font-sans")).toBe("")
      expect(root.style.getPropertyValue("--space-page")).toBe("")
      expect(root.style.getPropertyValue("--radius")).toBe("")
    })

    it("should remove data attributes", () => {
      applyThemeToDOM(modernMinimal)
      clearThemeFromDOM()
      const root = document.documentElement

      expect(root.getAttribute("data-theme")).toBeNull()
      expect(root.getAttribute("data-effects-3d")).toBeNull()
    })

    it("should remove the dark mode style tag", () => {
      applyThemeToDOM(modernMinimal)
      clearThemeFromDOM()

      expect(document.getElementById("gerboni-theme-dark")).toBeNull()
    })
  })

  describe("COLOR_TOKEN_MAP", () => {
    it("should have an entry for every ThemeColors key", () => {
      const colorKeys = Object.keys(gerboniDefault.colors)
      const mapKeys = Object.keys(COLOR_TOKEN_MAP)

      for (const key of colorKeys) {
        expect(mapKeys).toContain(key)
      }
    })

    it("should map to CSS variable names starting with --", () => {
      for (const value of Object.values(COLOR_TOKEN_MAP)) {
        expect(value).toMatch(/^--/)
      }
    })
  })
})
