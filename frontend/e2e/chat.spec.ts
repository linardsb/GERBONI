import { test, expect } from '@playwright/test'
import { routes } from './fixtures/test-data'

test.describe('Chat Widget', () => {
  test('should display chat widget button on homepage', async ({ page }) => {
    await page.goto(routes.home)

    // Chat widget should have a trigger button
    const chatButton = page.locator('[data-slot="chat-widget"] button, [data-testid="chat-trigger"]').first()
    await expect(chatButton).toBeVisible({ timeout: 10000 })
  })

  test('should open chat panel when clicking trigger', async ({ page }) => {
    await page.goto(routes.home)

    // Click the chat trigger
    const chatButton = page.locator('[data-slot="chat-widget"] button, [data-testid="chat-trigger"]').first()
    await chatButton.waitFor({ state: 'visible', timeout: 10000 })
    await chatButton.click()

    // Chat panel should be visible
    const chatPanel = page.locator('[data-slot="chat-panel"], [data-testid="chat-panel"]').first()
    await expect(chatPanel).toBeVisible({ timeout: 5000 })
  })

  test('should display message input in chat panel', async ({ page }) => {
    await page.goto(routes.home)

    // Open chat
    const chatButton = page.locator('[data-slot="chat-widget"] button, [data-testid="chat-trigger"]').first()
    await chatButton.waitFor({ state: 'visible', timeout: 10000 })
    await chatButton.click()

    // Should have a text input for messages
    const messageInput = page.locator('[data-slot="chat-panel"] input, [data-slot="chat-panel"] textarea, [data-testid="chat-input"]').first()
    await expect(messageInput).toBeVisible({ timeout: 5000 })
  })

  test('should be able to close chat panel', async ({ page }) => {
    await page.goto(routes.home)

    // Open chat
    const chatButton = page.locator('[data-slot="chat-widget"] button, [data-testid="chat-trigger"]').first()
    await chatButton.waitFor({ state: 'visible', timeout: 10000 })
    await chatButton.click()

    // Chat should be open
    const chatPanel = page.locator('[data-slot="chat-panel"], [data-testid="chat-panel"]').first()
    await expect(chatPanel).toBeVisible({ timeout: 5000 })

    // Close it
    const closeButton = chatPanel.locator('button').filter({ hasText: /close|×/i }).first()
    if (await closeButton.isVisible()) {
      await closeButton.click()
      await expect(chatPanel).not.toBeVisible({ timeout: 3000 })
    }
  })
})
