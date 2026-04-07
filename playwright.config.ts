import { defineConfig, devices } from '@playwright/test'

/**
 * Playwright e2e config for Phase 3 acceptance tests.
 *
 * Run: npx playwright test
 * With UI: npx playwright test --ui
 *
 * Requires:
 *   - App running locally: npm run dev (or set BASE_URL env var)
 *   - TEST_USER_EMAIL + TEST_USER_PASSWORD in .env.test.local
 */

const BASE_URL = process.env.BASE_URL ?? 'http://localhost:3000'

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: [['html', { outputFolder: 'playwright-report' }], ['list']],
  use: {
    baseURL: BASE_URL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 13'] },
    },
  ],
})
