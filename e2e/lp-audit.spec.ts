import { test, expect } from '@playwright/test'
import { signIn } from './helpers/auth'

/**
 * e2e: LP audit create → submit lifecycle
 * Day 27 acceptance test for WIT-8 (LP Audit Forms).
 */
test.describe('LP Audit: create → submit', () => {
  test.beforeEach(async ({ page }) => {
    await signIn(page)
  })

  test('creates a new audit form', async ({ page }) => {
    await page.goto('/audit-forms')
    await page.getByRole('link', { name: /new form|create form|\+ form/i }).click()

    await page.getByLabel(/name/i).fill('E2E Test Audit')
    await page.getByLabel(/category/i).selectOption('general')
    await page.getByRole('button', { name: /create|save/i }).click()

    await expect(page.getByText('E2E Test Audit')).toBeVisible()
  })

  test('adds an item to an audit form', async ({ page }) => {
    await page.goto('/audit-forms')

    // Open first form
    await page.getByText('E2E Test Audit').click()

    // Add a checklist item
    await page.getByRole('button', { name: /add item/i }).click()
    await page.getByLabel(/label/i).fill('Cash drawer balanced')
    await page.getByLabel(/type/i).selectOption('checkbox')
    await page.getByRole('button', { name: /save|add/i }).click()

    await expect(page.getByText('Cash drawer balanced')).toBeVisible()
  })

  test('starts and submits an audit run', async ({ page }) => {
    await page.goto('/audit-forms')
    await page.getByText('E2E Test Audit').click()

    await page.getByRole('button', { name: /start audit|run audit/i }).click()

    // Fill in location
    await page.getByLabel(/location/i).fill('Main Street')
    await page.getByRole('button', { name: /start/i }).click()

    // Complete the checkbox item
    await page.locator('input[type="checkbox"]').first().check()

    // Submit
    await page.getByRole('button', { name: /submit/i }).click()

    // Should show score
    await expect(page.getByText(/score|completed|100%/i)).toBeVisible()
  })
})
