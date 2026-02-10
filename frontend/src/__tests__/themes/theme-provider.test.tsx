import { describe, it, expect, beforeEach, vi } from "vitest"
import { render, screen, fireEvent } from "@testing-library/react"
import { GerboniThemeProvider, useGerboniTheme } from "@/components/providers/theme-provider"
import { DEFAULT_THEME_ID, themes } from "@/lib/themes"

// Helper component that exposes context values for testing
function ThemeConsumer() {
  const { themeId, theme, setTheme, availableThemes } = useGerboniTheme()
  return (
    <div>
      <span data-testid="theme-id">{themeId}</span>
      <span data-testid="theme-name">{theme.name}</span>
      <span data-testid="theme-count">{availableThemes.length}</span>
      <button onClick={() => setTheme("modern-minimal")}>Switch to Modern</button>
      <button onClick={() => setTheme("gerboni-default")}>Switch to Default</button>
      <button onClick={() => setTheme("invalid-id")}>Switch to Invalid</button>
    </div>
  )
}

describe("GerboniThemeProvider", () => {
  beforeEach(() => {
    localStorage.clear()
    // Reset documentElement
    document.documentElement.style.cssText = ""
    document.documentElement.removeAttribute("data-theme")
  })

  it("should provide default theme on initial render", () => {
    render(
      <GerboniThemeProvider>
        <ThemeConsumer />
      </GerboniThemeProvider>
    )

    expect(screen.getByTestId("theme-id")).toHaveTextContent(DEFAULT_THEME_ID)
    expect(screen.getByTestId("theme-name")).toHaveTextContent("Gerboni")
  })

  it("should expose all registered themes", () => {
    render(
      <GerboniThemeProvider>
        <ThemeConsumer />
      </GerboniThemeProvider>
    )

    expect(screen.getByTestId("theme-count")).toHaveTextContent(String(themes.length))
  })

  it("should switch theme when setTheme is called", () => {
    render(
      <GerboniThemeProvider>
        <ThemeConsumer />
      </GerboniThemeProvider>
    )

    fireEvent.click(screen.getByText("Switch to Modern"))

    expect(screen.getByTestId("theme-id")).toHaveTextContent("modern-minimal")
    expect(screen.getByTestId("theme-name")).toHaveTextContent("Modern Minimal")
  })

  it("should persist theme to localStorage on switch", () => {
    render(
      <GerboniThemeProvider>
        <ThemeConsumer />
      </GerboniThemeProvider>
    )

    fireEvent.click(screen.getByText("Switch to Modern"))

    expect(localStorage.getItem("gerboni-theme")).toBe("modern-minimal")
  })

  it("should remove localStorage key when switching back to default", () => {
    render(
      <GerboniThemeProvider>
        <ThemeConsumer />
      </GerboniThemeProvider>
    )

    fireEvent.click(screen.getByText("Switch to Modern"))
    expect(localStorage.getItem("gerboni-theme")).toBe("modern-minimal")

    fireEvent.click(screen.getByText("Switch to Default"))
    expect(localStorage.getItem("gerboni-theme")).toBeNull()
  })

  it("should read persisted theme from localStorage on mount", () => {
    localStorage.setItem("gerboni-theme", "modern-minimal")

    render(
      <GerboniThemeProvider>
        <ThemeConsumer />
      </GerboniThemeProvider>
    )

    // The useEffect fires synchronously in jsdom tests
    expect(screen.getByTestId("theme-id")).toHaveTextContent("modern-minimal")
  })

  it("should ignore invalid theme IDs and keep current theme", () => {
    render(
      <GerboniThemeProvider>
        <ThemeConsumer />
      </GerboniThemeProvider>
    )

    fireEvent.click(screen.getByText("Switch to Invalid"))

    // Should still be default
    expect(screen.getByTestId("theme-id")).toHaveTextContent(DEFAULT_THEME_ID)
  })

  it("should ignore invalid persisted theme ID on mount", () => {
    localStorage.setItem("gerboni-theme", "nonexistent-theme")

    render(
      <GerboniThemeProvider>
        <ThemeConsumer />
      </GerboniThemeProvider>
    )

    expect(screen.getByTestId("theme-id")).toHaveTextContent(DEFAULT_THEME_ID)
  })

  it("should set CSS custom properties when switching to non-default theme", () => {
    render(
      <GerboniThemeProvider>
        <ThemeConsumer />
      </GerboniThemeProvider>
    )

    fireEvent.click(screen.getByText("Switch to Modern"))

    const root = document.documentElement
    expect(root.style.getPropertyValue("--primary")).not.toBe("")
    expect(root.getAttribute("data-theme")).toBe("modern-minimal")
  })

  it("should clear CSS custom properties when switching to default theme", () => {
    render(
      <GerboniThemeProvider>
        <ThemeConsumer />
      </GerboniThemeProvider>
    )

    fireEvent.click(screen.getByText("Switch to Modern"))
    fireEvent.click(screen.getByText("Switch to Default"))

    const root = document.documentElement
    expect(root.style.getPropertyValue("--primary")).toBe("")
    expect(root.getAttribute("data-theme")).toBeNull()
  })

  it("should throw when useGerboniTheme is used outside provider", () => {
    // Suppress console.error for this test
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {})

    expect(() => {
      render(<ThemeConsumer />)
    }).toThrow("useGerboniTheme must be used within <GerboniThemeProvider>")

    consoleSpy.mockRestore()
  })
})
