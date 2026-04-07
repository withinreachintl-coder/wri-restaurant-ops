import { test, expect } from '@playwright/test'
import { signIn } from './helpers/auth'

/**
 * e2e: Offline checklist → sync on reconnect
 * Day 27 acceptance test for WIT-7 (PWA offline).
 */
test.describe('Offline checklist → sync', () => {
  test.beforeEach(async ({ page }) => {
    await signIn(page)
  })

  test('checklist loads from cache while offline', async ({ page, context }) => {
    // Visit checklist online first (primes service worker cache)
    await page.goto('/checklist')
    await expect(page.getByRole('heading', { name: /checklist/i })).toBeVisible()

    // Go offline
    await context.setOffline(true)

    // Reload — should serve from SW cache
    await page.reload()
    await expect(page.getByRole('heading', { name: /checklist/i })).toBeVisible()

    // Offline banner should appear
    await expect(page.getByText(/offline/i)).toBeVisible()
  })

  test('can complete checklist items while offline and sync on reconnect', async ({
    page,
    context,
  }) => {
    await page.goto('/checklist')

    // Go offline
    await context.setOffline(true)

    // Enter staff name so tasks can be toggled
    await page.fill('input[placeholder="Enter your name"]', 'Test Staff')
    await page.getByRole('button', { name: /start/i }).click()

    // Complete first available task (the toggle buttons render as amber checkboxes)
    const firstToggle = page.locator('button').filter({ has: page.locator('svg') }).first()
    await firstToggle.click()

    // Offline banner should be visible
    await expect(page.getByText(/offline/i)).toBeVisible()

    // Reconnect
    await context.setOffline(false)

    // Sync banner should appear then clear
    await expect(page.getByText(/syncing|synced/i)).toBeVisible({ timeout: 15_000 })
    await expect(page.getByText(/offline/i)).toBeHidden({ timeout: 20_000 })
  })
})
