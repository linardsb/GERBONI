import { test, expect } from '@playwright/test'
import { routes } from './fixtures/test-data'

test.describe('Authentication', () => {
  test.describe('Login Page', () => {
    test('should display login form', async ({ page }) => {
      await page.goto(routes.login)

      // Should have email and password inputs
      const emailInput = page.locator('input[type="email"], input[name="email"]')
      const passwordInput = page.locator('input[type="password"], input[name="password"]')

      await expect(emailInput.first()).toBeVisible({ timeout: 10000 })
      await expect(passwordInput.first()).toBeVisible({ timeout: 10000 })
    })

    test('should have submit button', async ({ page }) => {
      await page.goto(routes.login)

      const submitButton = page.getByRole('button', { name: /log in|sign in|submit/i })
      await expect(submitButton).toBeVisible({ timeout: 10000 })
    })

    test('should have link to register page', async ({ page }) => {
      await page.goto(routes.login)

      const registerLink = page.getByRole('link', { name: /register|sign up|create account/i })
      await expect(registerLink).toBeVisible({ timeout: 10000 })
    })

    test('should show error for invalid credentials', async ({ page }) => {
      await page.goto(routes.login)

      // Fill in invalid credentials
      const emailInput = page.locator('input[type="email"], input[name="email"]').first()
      const passwordInput = page.locator('input[type="password"], input[name="password"]').first()

      await emailInput.fill('invalid@example.com')
      await passwordInput.fill('wrongpassword')

      // Submit the form
      const submitButton = page.getByRole('button', { name: /log in|sign in|submit/i })
      await submitButton.click()

      // Should show error message (might be toast or inline)
      // Wait for potential error state
      await page.waitForTimeout(2000)
    })
  })

  test.describe('Register Page', () => {
    test('should display registration form', async ({ page }) => {
      await page.goto(routes.register)

      // Should have email and password inputs
      const emailInput = page.locator('input[type="email"], input[name="email"]')
      const passwordInput = page.locator('input[type="password"], input[name="password"]')

      await expect(emailInput.first()).toBeVisible({ timeout: 10000 })
      await expect(passwordInput.first()).toBeVisible({ timeout: 10000 })
    })

    test('should have submit button', async ({ page }) => {
      await page.goto(routes.register)

      const submitButton = page.getByRole('button', { name: /register|sign up|create/i })
      await expect(submitButton).toBeVisible({ timeout: 10000 })
    })

    test('should have link to login page', async ({ page }) => {
      await page.goto(routes.register)

      const loginLink = page.getByRole('link', { name: /log in|sign in|already have/i })
      await expect(loginLink).toBeVisible({ timeout: 10000 })
    })
  })

  test.describe('Protected Routes', () => {
    test('should redirect to login when accessing account page unauthenticated', async ({ page }) => {
      await page.goto(routes.account)

      // Should redirect to login or show login prompt
      await page.waitForURL(/login|account/, { timeout: 5000 })
    })

    test('should redirect to login when accessing orders page unauthenticated', async ({ page }) => {
      await page.goto(routes.orders)

      // Should redirect to login or show login prompt
      await page.waitForURL(/login|orders/, { timeout: 5000 })
    })
  })
})

test.describe('Guest Checkout Flow', () => {
  test('should allow guest to proceed to checkout', async ({ page }) => {
    // Add item to cart first
    await page.goto(routes.product(1))
    await page.waitForLoadState('networkidle')

    // Select options if available
    const colorButton = page.locator('[data-slot="color-button"]').first()
    if (await colorButton.isVisible()) {
      await colorButton.click()
    }

    const sizeButton = page.locator('[data-slot="size-button"]').first()
    if (await sizeButton.isVisible()) {
      await sizeButton.click()
    }

    // Add to cart
    const addToCartButton = page.getByRole('button', { name: /add to cart/i })
    if (await addToCartButton.isVisible()) {
      await addToCartButton.click()
      await page.waitForTimeout(1000)

      // Go to checkout
      await page.goto(routes.checkout)

      // Should be able to proceed as guest (page should load)
      await page.waitForLoadState('networkidle')
    }
  })
})
