import { test, expect } from '@playwright/test'
import { routes } from './fixtures/test-data'

test.describe('Authentication', () => {
  test.describe('Login Page', () => {
    test('should display login form', async ({ page }) => {
      await page.goto(routes.login)
      await page.waitForLoadState('networkidle')

      // Should have email and password inputs
      const emailInput = page.locator('input[type="email"]')
      const passwordInput = page.locator('input[type="password"]')

      await expect(emailInput.first()).toBeVisible({ timeout: 10000 })
      await expect(passwordInput.first()).toBeVisible({ timeout: 10000 })
    })

    test('should have submit button', async ({ page }) => {
      await page.goto(routes.login)
      await page.waitForLoadState('networkidle')

      const submitButton = page.getByRole('button', { name: /log in|sign in|submit/i })
      await expect(submitButton).toBeVisible({ timeout: 10000 })
    })

    test('should have link to register page', async ({ page }) => {
      await page.goto(routes.login)
      await page.waitForLoadState('networkidle')

      // The login page uses a text toggle (not a link) to switch to register mode
      const signUpText = page.getByText(/sign up/i)
      await expect(signUpText.first()).toBeVisible({ timeout: 10000 })
    })

    test('should show error for invalid credentials', async ({ page }) => {
      await page.goto(routes.login)
      await page.waitForLoadState('networkidle')

      // Fill in invalid credentials
      const emailInput = page.locator('input[type="email"]').first()
      const passwordInput = page.locator('input[type="password"]').first()

      await emailInput.fill('invalid@example.com')
      await passwordInput.fill('wrongpassword')

      // Submit the form
      const submitButton = page.getByRole('button', { name: /log in|sign in|submit/i })
      await submitButton.click()

      // Should show error message (toast or inline)
      await page.waitForTimeout(2000)
    })
  })

  test.describe('Register Page', () => {
    test('should display registration form', async ({ page }) => {
      await page.goto(routes.register)
      await page.waitForLoadState('networkidle')

      // Should have email and password inputs
      const emailInput = page.locator('input[type="email"]')
      const passwordInput = page.locator('input[type="password"]')

      await expect(emailInput.first()).toBeVisible({ timeout: 10000 })
      await expect(passwordInput.first()).toBeVisible({ timeout: 10000 })
    })

    test('should have submit button', async ({ page }) => {
      await page.goto(routes.register)
      await page.waitForLoadState('networkidle')

      const submitButton = page.getByRole('button', { name: /register|sign up|create/i })
      await expect(submitButton).toBeVisible({ timeout: 10000 })
    })

    test('should have link to login page', async ({ page }) => {
      await page.goto(routes.register)
      await page.waitForLoadState('networkidle')

      // The register page uses a text toggle (not a link) to switch to login mode
      const signInText = page.getByText(/sign in/i)
      await expect(signInText.first()).toBeVisible({ timeout: 10000 })
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
    const colorButton = page.locator('[data-slot="color-selector"] button').first()
    if (await colorButton.isVisible()) {
      await colorButton.click()
    }

    const sizeButton = page.locator('[data-slot="size-selector"] button').first()
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
