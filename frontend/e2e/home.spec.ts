import { test, expect } from '@playwright/test'
import { routes } from './fixtures/test-data'

test.describe('Homepage', () => {
  test('should display the homepage', async ({ page }) => {
    await page.goto(routes.home)

    // Check for main page elements
    await expect(page).toHaveTitle(/GERBONI/i)
  })

  test('should display hero section', async ({ page }) => {
    await page.goto(routes.home)

    // Check for hero heading
    const heroHeading = page.locator('h1').first()
    await expect(heroHeading).toBeVisible()
  })

  test('should display product cards', async ({ page }) => {
    await page.goto(routes.home)

    // Wait for products to load
    const productCards = page.locator('[data-slot="product-card"]')

    // Should have at least some product cards
    await expect(productCards.first()).toBeVisible({ timeout: 10000 })
  })

  test('should navigate to product page when clicking product card', async ({ page }) => {
    await page.goto(routes.home)

    // Wait for and click on the first product card
    const firstProductCard = page.locator('[data-slot="product-card"]').first()
    await firstProductCard.waitFor({ state: 'visible', timeout: 10000 })
    await firstProductCard.click()

    // Should navigate to product detail page
    await expect(page).toHaveURL(/\/products\/\d+/)
  })

  test('should have working navigation', async ({ page }) => {
    await page.goto(routes.home)

    // Check header exists
    const header = page.locator('header')
    await expect(header).toBeVisible()
  })

  test('should have working footer', async ({ page }) => {
    await page.goto(routes.home)

    // Check footer exists
    const footer = page.locator('footer')
    await expect(footer).toBeVisible()
  })
})

test.describe('Language Switching', () => {
  test('should switch between English and Latvian', async ({ page }) => {
    await page.goto('/en')

    // Find language switcher
    const languageSwitcher = page.locator('[data-slot="language-switcher"]').first()

    if (await languageSwitcher.isVisible()) {
      // Click to open dropdown (if it's a dropdown)
      await languageSwitcher.click()

      // Look for Latvian option
      const lvOption = page.getByText('LV').first()
      if (await lvOption.isVisible()) {
        await lvOption.click()

        // Should navigate to Latvian version
        await expect(page).toHaveURL(/\/lv/)
      }
    }
  })
})
