import { test, expect } from '@playwright/test'
import { routes } from './fixtures/test-data'

test.describe('Products Page', () => {
  test('should display products list', async ({ page }) => {
    await page.goto(routes.products)
    await page.waitForLoadState('networkidle')

    // Wait for products to load
    const productCards = page.locator('[data-slot="product-card"]')
    await expect(productCards.first()).toBeVisible({ timeout: 10000 })
  })

  test('should navigate to product detail from list', async ({ page }) => {
    await page.goto(routes.products)
    await page.waitForLoadState('networkidle')

    // Click first product
    const firstProduct = page.locator('[data-slot="product-card"]').first()
    await firstProduct.waitFor({ state: 'visible', timeout: 10000 })
    await firstProduct.click()

    // Should be on product detail page
    await expect(page).toHaveURL(/\/products\/\d+/)
  })
})

test.describe('Product Detail Page', () => {
  test('should display product details', async ({ page }) => {
    await page.goto(routes.product(1))
    await page.waitForLoadState('networkidle')

    // Should show product name (city name)
    const productTitle = page.locator('h1').first()
    await expect(productTitle).toBeVisible({ timeout: 10000 })
  })

  test('should display color selector', async ({ page }) => {
    await page.goto(routes.product(1))
    await page.waitForLoadState('networkidle')

    // Wait for color options to load
    const colorButtons = page.locator('[data-slot="color-selector"] button')

    // Should have at least one color option
    await expect(colorButtons.first()).toBeVisible({ timeout: 10000 })
  })

  test('should display size selector', async ({ page }) => {
    await page.goto(routes.product(1))
    await page.waitForLoadState('networkidle')

    // Wait for size options to load
    const sizeButtons = page.locator('[data-slot="size-selector"] button')

    // Should have at least one size option
    await expect(sizeButtons.first()).toBeVisible({ timeout: 10000 })
  })

  test('should allow selecting color and size', async ({ page }) => {
    await page.goto(routes.product(1))
    await page.waitForLoadState('networkidle')

    // Select a color if available
    const firstColorButton = page.locator('[data-slot="color-selector"] button').first()
    if (await firstColorButton.isVisible()) {
      await firstColorButton.click()
    }

    // Select a size if available
    const firstSizeButton = page.locator('[data-slot="size-selector"] button').first()
    if (await firstSizeButton.isVisible()) {
      await firstSizeButton.click()
    }
  })

  test('should display add to cart button', async ({ page }) => {
    await page.goto(routes.product(1))
    await page.waitForLoadState('networkidle')

    // Look for add to cart button
    const addToCartButton = page.getByRole('button', { name: /add to cart/i })

    await expect(addToCartButton).toBeVisible({ timeout: 10000 })
  })

  test('should display product price', async ({ page }) => {
    await page.goto(routes.product(1))
    await page.waitForLoadState('networkidle')

    // Price should be visible (contains € symbol)
    const priceText = page.locator('text=€')
    await expect(priceText.first()).toBeVisible({ timeout: 10000 })
  })
})

test.describe('Product Images', () => {
  test('should display coat of arms image', async ({ page }) => {
    await page.goto(routes.product(1))
    await page.waitForLoadState('networkidle')

    // Wait for image to load - alt text is "{CityName} coat of arms"
    const coatOfArmsImage = page.locator('img[alt*="coat of arms"]').first()

    await expect(coatOfArmsImage).toBeVisible({ timeout: 10000 })
  })
})
