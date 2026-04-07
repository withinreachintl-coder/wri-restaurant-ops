import { Page } from '@playwright/test'

/**
 * Sign in via magic link is not testable end-to-end without a real email inbox.
 * This helper uses test credentials set via TEST_USER_EMAIL + TEST_USER_PASSWORD
 * (password auth must be enabled in Supabase for the test account).
 */
export async function signIn(page: Page) {
  const email = process.env.TEST_USER_EMAIL ?? ''
  const password = process.env.TEST_USER_PASSWORD ?? ''

  if (!email || !password) {
    throw new Error('Set TEST_USER_EMAIL and TEST_USER_PASSWORD in .env.test.local')
  }

  // POST directly to Supabase password sign-in endpoint via the app's auth page
  await page.goto('/auth')
  await page.getByLabel(/email/i).fill(email)
  await page.getByLabel(/password/i).fill(password)
  await page.getByRole('button', { name: /sign in/i }).click()
  await page.waitForURL(/\/dashboard|\/welcome/)
}
