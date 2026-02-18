/**
 * E2E Test Scaffolding — Authentication
 *
 * Requires: npx playwright install chromium
 * Run: npx playwright test tests/e2e/
 */

// import { test, expect } from "@playwright/test";

// const BASE_URL = process.env.APP_BASE_URL || "http://localhost:5000";

/*
test.describe("Authentication", () => {

  test("signup — happy path", async ({ page }) => {
    await page.goto(`${BASE_URL}/app/signup`);
    await page.fill('[name="firstName"]', "Léa");
    await page.fill('[name="email"]', `test-${Date.now()}@nocely.fr`);
    await page.fill('[name="password"]', "SecurePass123!");
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/verify-email|onboarding/);
  });

  test("login — valid credentials", async ({ page }) => {
    await page.goto(`${BASE_URL}/app/login`);
    await page.fill('[name="email"]', "lea@nocely.fr");
    await page.fill('[name="password"]', "SecurePass123!");
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/dashboard|app/);
  });

  test("login — invalid credentials shows error", async ({ page }) => {
    await page.goto(`${BASE_URL}/app/login`);
    await page.fill('[name="email"]', "wrong@nocely.fr");
    await page.fill('[name="password"]', "WrongPassword");
    await page.click('button[type="submit"]');
    await expect(page.locator("text=Identifiants invalides")).toBeVisible();
  });

  test("login — empty form shows validation", async ({ page }) => {
    await page.goto(`${BASE_URL}/app/login`);
    await page.click('button[type="submit"]');
    await expect(page.locator('[role="alert"]')).toBeVisible();
  });

  test("logout — redirects to login", async ({ page }) => {
    // Login first
    await page.goto(`${BASE_URL}/app/login`);
    await page.fill('[name="email"]', "lea@nocely.fr");
    await page.fill('[name="password"]', "SecurePass123!");
    await page.click('button[type="submit"]');
    await page.waitForURL(/dashboard|app/);

    // Logout
    await page.click('[data-testid="logout-button"]');
    await expect(page).toHaveURL(/login/);
  });

  test("protected route — unauthenticated redirects to login", async ({ page }) => {
    await page.goto(`${BASE_URL}/app/dashboard`);
    await expect(page).toHaveURL(/login/);
  });

  test("session persistence — refresh keeps user logged in", async ({ page }) => {
    // Login
    await page.goto(`${BASE_URL}/app/login`);
    await page.fill('[name="email"]', "lea@nocely.fr");
    await page.fill('[name="password"]', "SecurePass123!");
    await page.click('button[type="submit"]');
    await page.waitForURL(/dashboard/);

    // Refresh
    await page.reload();
    await expect(page).toHaveURL(/dashboard/);
  });

});
*/

export {};
