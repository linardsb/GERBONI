import { test, expect } from '@playwright/test'
import { routes } from './fixtures/test-data'

test.describe('Chat Widget', () => {
  test('should display chat widget button on homepage', async ({ page }) => {
    await page.goto(routes.home)
    await page.waitForLoadState('networkidle')

    // Chat trigger button has aria-label "Open chat" and aria-controls
    const chatButton = page.getByRole('button', { name: /open chat|atvērt čatu/i })
    await expect(chatButton).toBeVisible({ timeout: 10000 })
  })

  test('should open chat panel when clicking trigger', async ({ page }) => {
    await page.goto(routes.home)
    await page.waitForLoadState('networkidle')

    // Click the chat trigger
    const chatButton = page.getByRole('button', { name: /open chat|atvērt čatu/i })
    await chatButton.waitFor({ state: 'visible', timeout: 10000 })
    await chatButton.click()

    // Chat panel has data-slot="chat-widget" and role="dialog"
    const chatPanel = page.locator('[data-slot="chat-widget"]')
    await expect(chatPanel).toBeVisible({ timeout: 5000 })
  })

  test('should display message input in chat panel', async ({ page }) => {
    await page.goto(routes.home)
    await page.waitForLoadState('networkidle')

    // Open chat
    const chatButton = page.getByRole('button', { name: /open chat|atvērt čatu/i })
    await chatButton.waitFor({ state: 'visible', timeout: 10000 })
    await chatButton.click()

    // Should have a text input for messages
    const messageInput = page.locator('[data-slot="chat-widget"] input, [data-slot="chat-widget"] textarea').first()
    await expect(messageInput).toBeVisible({ timeout: 5000 })
  })

  test('should be able to close chat panel', async ({ page }) => {
    await page.goto(routes.home)
    await page.waitForLoadState('networkidle')

    // Open chat
    const chatButton = page.getByRole('button', { name: /open chat|atvērt čatu/i })
    await chatButton.waitFor({ state: 'visible', timeout: 10000 })
    await chatButton.click()

    // Chat should be open
    const chatPanel = page.locator('[data-slot="chat-widget"]')
    await expect(chatPanel).toBeVisible({ timeout: 5000 })

    // Click the same toggle button to close (aria-label changes to "Close chat")
    const closeButton = page.getByRole('button', { name: /close chat|aizvērt čatu/i })
    await closeButton.click()
    await expect(chatPanel).not.toBeVisible({ timeout: 3000 })
  })
})
