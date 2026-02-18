import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  globalSetup: "./global-setup.ts",
  testDir: "./",
  testMatch: "**/*.spec.ts",
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: [["html", { open: "never" }]],
  timeout: 120000,
  expect: { timeout: 10000 },
  use: {
    baseURL: process.env.APP_BASE_URL || "http://localhost:5000",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    headless: true,
    viewport: { width: 1280, height: 720 },
    launchOptions: {
      executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH || "/nix/store/qa9cnw4v5xkxyip6mb9kxqfq1z4x2dx1-chromium-138.0.7204.100/bin/chromium",
      args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-gpu", "--disable-dev-shm-usage"],
    },
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: {
    command: "SESSION_STORE=db npm run dev",
    port: 5000,
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
  },
});
