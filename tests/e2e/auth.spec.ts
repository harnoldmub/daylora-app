import { test, expect } from "@playwright/test";
import { loginAndSetCookies, createFullAccount, nextUserEmail, setUserOffset, TEST_PASSWORD } from "./helpers";

setUserOffset(0);

test.describe("A — Auth & Backoffice", () => {
  test("unauthenticated user is redirected to login", async ({ page }) => {
    await page.goto("/app/dashboard");
    await page.waitForTimeout(3000);
    const url = page.url();
    expect(url).toMatch(/\/(app\/login|app\/signup|app$)/);
  });

  test("authenticated user can access /app and dashboard", async ({ page }) => {
    const { weddingId } = await createFullAccount(page);
    await page.goto("/app");
    await page.waitForTimeout(3000);
    expect(page.url()).not.toMatch(/\/app\/login$/);

    await page.goto(`/app/${weddingId}`);
    await page.waitForTimeout(3000);
    expect(page.url()).toContain(`/app/${weddingId}`);
    const body = await page.locator("body").textContent();
    expect(body?.length).toBeGreaterThan(50);
  });

  test("session persists after page reload", async ({ page }) => {
    await loginAndSetCookies(page, nextUserEmail());
    await page.goto("/app");
    await page.waitForTimeout(2000);
    await page.reload();
    await page.waitForTimeout(2000);
    expect(page.url()).not.toMatch(/\/app\/login$/);
  });
});
