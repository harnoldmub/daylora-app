/**
 * Playwright configuration for Nocely E2E tests.
 *
 * To use:
 * 1. Install Playwright: npm i -D @playwright/test
 * 2. Install browsers: npx playwright install chromium
 * 3. Run: npx playwright test --config=tests/e2e/playwright.config.ts
 */

/*
import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./",
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: "html",
  timeout: 30000,
  use: {
    baseURL: process.env.APP_BASE_URL || "http://localhost:5000",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: {
    command: "npm run dev",
    port: 5000,
    reuseExistingServer: true,
    timeout: 60000,
  },
});
*/

export {};
