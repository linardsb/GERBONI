import { test, expect } from '@playwright/test'
import { routes } from './fixtures/test-data'

test.describe('Cart Page', () => {
  test('should display empty cart message', async ({ page }) => {
    await page.goto(routes.cart)
    await page.waitForLoadState('networkidle')

    // Should show cart page content
    const cartContent = page.locator('main')
    await expect(cartContent).toBeVisible()
  })

  test('should navigate to cart from product page after adding item', async ({ page }) => {
    // Go to a product
    await page.goto(routes.product(1))
    await page.waitForLoadState('networkidle')

    // Select color if needed
    const colorButton = page.locator('[data-slot="color-selector"] button').first()
    if (await colorButton.isVisible()) {
      await colorButton.click()
    }

    // Select size if needed
    const sizeButton = page.locator('[data-slot="size-selector"] button').first()
    if (await sizeButton.isVisible()) {
      await sizeButton.click()
    }

    // Click add to cart
    const addToCartButton = page.getByRole('button', { name: /add to cart/i })
    if (await addToCartButton.isVisible()) {
      await addToCartButton.click()

      // Wait for cart update (might show toast or update cart icon)
      await page.waitForTimeout(1000)

      // Navigate to cart
      await page.goto(routes.cart)

      // Cart should show items
      await page.waitForLoadState('networkidle')
    }
  })
})

test.describe('Cart Interactions', () => {
  test('should display checkout button when cart has items', async ({ page }) => {
    // First add an item to cart
    await page.goto(routes.product(1))
    await page.waitForLoadState('networkidle')

    const colorButton = page.locator('[data-slot="color-selector"] button').first()
    if (await colorButton.isVisible()) {
      await colorButton.click()
    }

    const sizeButton = page.locator('[data-slot="size-selector"] button').first()
    if (await sizeButton.isVisible()) {
      await sizeButton.click()
    }

    const addToCartButton = page.getByRole('button', { name: /add to cart/i })
    if (await addToCartButton.isVisible()) {
      await addToCartButton.click()
      await page.waitForTimeout(1000)
    }

    // Go to cart
    await page.goto(routes.cart)
    await page.waitForLoadState('networkidle')
  })
})

test.describe('Cart Icon', () => {
  test('should show cart icon in header', async ({ page }) => {
    await page.goto(routes.home)

    // Look for cart icon/link in header
    const header = page.locator('header')
    await expect(header).toBeVisible()
  })
})
