import { test, expect } from "@playwright/test";
import { signup, login, signupAndLogin, uniqueEmail, TEST_USER } from "./helpers";

test.describe("A — Signup → Login → Onboarding → Site généré → Backoffice", () => {
  test("signup creates account and redirects to login", async ({ page }) => {
    const creds = await signup(page);
    await expect(page).toHaveURL(/\/app\/login/);
    expect(creds.email).toBeTruthy();
  });

  test("login with valid credentials reaches dashboard/onboarding", async ({ page }) => {
    const creds = await signup(page);
    await login(page, creds.email, creds.password);
    await expect(page).toHaveURL(/\/app\/(onboarding|\d+)/);
  });

  test("login with invalid credentials shows error", async ({ page }) => {
    await page.goto("/app/login");
    await page.locator('input[name="email"]').fill("nonexistent@nocely.fr");
    await page.locator('input[name="password"]').fill("WrongPassword123!");
    await page.locator('button[type="submit"]').click();
    await page.waitForTimeout(2000);
    const errorVisible = await page.locator('[role="alert"], [data-variant="destructive"], .text-destructive').first().isVisible().catch(() => false);
    const toastVisible = await page.locator('[data-state="open"]').first().isVisible().catch(() => false);
    expect(errorVisible || toastVisible).toBeTruthy();
  });

  test("signup → login → complete onboarding wizard → welcome page", async ({ page }) => {
    const creds = await signupAndLogin(page);
    await page.goto("/app/onboarding");
    await page.waitForSelector('input[name="title"]', { timeout: 10000 });

    const slug = `e2e-onboard-${Date.now()}`;
    const futureDate = new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

    await page.locator('input[name="title"]').fill(`Mariage ${slug}`);
    await page.locator('input[name="slug"]').fill(slug);
    await page.locator('input[type="date"]').fill(futureDate);

    for (let i = 0; i < 6; i++) {
      await page.getByText("Suivant").first().click();
      await page.waitForTimeout(500);
    }

    await page.locator('button[type="submit"]').click();
    await page.waitForURL(/\/app\/\d+\/welcome/, { timeout: 30000 });
    await expect(page).toHaveURL(/\/app\/\d+\/welcome/);
  });

  test("after onboarding, user can access backoffice dashboard", async ({ page }) => {
    const creds = await signupAndLogin(page);
    await page.goto("/app/onboarding");
    await page.waitForSelector('input[name="title"]', { timeout: 10000 });

    const slug = `e2e-dash-${Date.now()}`;
    const futureDate = new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

    await page.locator('input[name="title"]').fill(`Mariage ${slug}`);
    await page.locator('input[name="slug"]').fill(slug);
    await page.locator('input[type="date"]').fill(futureDate);

    for (let i = 0; i < 6; i++) {
      await page.getByText("Suivant").first().click();
      await page.waitForTimeout(500);
    }

    await page.locator('button[type="submit"]').click();
    await page.waitForURL(/\/app\/\d+\/welcome/, { timeout: 30000 });

    const url = page.url();
    const weddingId = url.match(/\/app\/(\d+)\//)?.[1];
    expect(weddingId).toBeTruthy();

    await page.goto(`/app/${weddingId}/dashboard`);
    await page.waitForTimeout(2000);
    await expect(page).toHaveURL(new RegExp(`/app/${weddingId}`));
  });

  test("unauthenticated user is redirected to login", async ({ page }) => {
    await page.goto("/app/dashboard");
    await page.waitForTimeout(3000);
    const url = page.url();
    expect(url).toMatch(/\/(app\/login|app\/signup|app$)/);
  });

  test("session persists after page reload", async ({ page }) => {
    const creds = await signupAndLogin(page);
    const urlBefore = page.url();
    await page.reload();
    await page.waitForTimeout(2000);
    const urlAfter = page.url();
    expect(urlAfter).not.toMatch(/\/app\/login/);
  });
});
