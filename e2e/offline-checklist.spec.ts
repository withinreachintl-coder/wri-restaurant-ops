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

    // Complete first available item
    const firstCheckbox = page.locator('input[type="checkbox"]').first()
    await firstCheckbox.check()
    await expect(firstCheckbox).toBeChecked()

    // Pending sync indicator should appear
    await expect(page.getByText(/pending|queued|offline/i)).toBeVisible()

    // Reconnect
    await context.setOffline(false)

    // Sync should complete — pending indicator clears
    await expect(page.getByText(/pending|queued/i)).toBeHidden({ timeout: 15_000 })
  })
})
