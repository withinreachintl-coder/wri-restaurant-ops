import { test, expect } from '@playwright/test'
import { signIn } from './helpers/auth'

/**
 * e2e: R&M ticket lifecycle — submit → assign → complete
 * Day 27 acceptance test for WIT-9 (R&M Ticket Tracking).
 */
test.describe('R&M Ticket: submit → assign → complete', () => {
  test.beforeEach(async ({ page }) => {
    await signIn(page)
  })

  test('staff submits a new R&M ticket', async ({ page }) => {
    await page.goto('/maintenance/submit')

    await page.getByLabel(/title/i).fill('Fryer not heating — E2E test')
    await page.getByLabel(/description/i).fill('Oil not reaching temperature after 30 min.')
    await page.getByLabel(/urgency/i).selectOption('urgent')
    await page.getByLabel(/location/i).fill('Kitchen')

    await page.getByRole('button', { name: /submit/i }).click()

    await expect(page.getByText(/submitted|ticket created/i)).toBeVisible()
  })

  test('manager queue shows new ticket', async ({ page }) => {
    await page.goto('/maintenance')
    await expect(page.getByText('Fryer not heating — E2E test')).toBeVisible()
  })

  test('manager assigns ticket to vendor', async ({ page }) => {
    await page.goto('/maintenance')
    await page.getByText('Fryer not heating — E2E test').click()

    // Assign to vendor (pick first available or create)
    const assignBtn = page.getByRole('button', { name: /assign vendor/i })
    await assignBtn.click()

    // Select or confirm first vendor
    const vendorSelect = page.getByLabel(/vendor/i)
    if (await vendorSelect.isVisible()) {
      await vendorSelect.selectOption({ index: 0 })
      await page.getByRole('button', { name: /confirm|assign/i }).click()
    }

    await expect(page.getByText(/assigned/i)).toBeVisible()
  })

  test('manager marks ticket completed', async ({ page }) => {
    await page.goto('/maintenance')
    await page.getByText('Fryer not heating — E2E test').click()

    await page.getByRole('button', { name: /complete|mark complete/i }).click()

    // Confirm in dialog if present
    const confirmBtn = page.getByRole('button', { name: /confirm/i })
    if (await confirmBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await confirmBtn.click()
    }

    await expect(page.getByText(/completed/i)).toBeVisible()
  })
})
