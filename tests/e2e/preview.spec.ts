/**
 * E2E Test Scaffolding — Preview & Inline Editing
 *
 * Requires: npx playwright install chromium
 * Run: npx playwright test tests/e2e/
 */

// import { test, expect } from "@playwright/test";

// const BASE_URL = process.env.APP_BASE_URL || "http://localhost:5000";

/*
test.describe("Preview Mode", () => {

  test.beforeEach(async ({ page }) => {
    // Login before each test
    await page.goto(`${BASE_URL}/app/login`);
    await page.fill('[name="email"]', "lea@nocely.fr");
    await page.fill('[name="password"]', "SecurePass123!");
    await page.click('button[type="submit"]');
    await page.waitForURL(/dashboard/);
  });

  test("preview page loads correctly", async ({ page }) => {
    await page.goto(`${BASE_URL}/preview/test-wedding`);
    await expect(page.locator("h1")).toBeVisible();
  });

  test("inline edit — click to edit hero title", async ({ page }) => {
    await page.goto(`${BASE_URL}/preview/test-wedding`);
    const heroTitle = page.locator('[data-editable="heroTitle"]');
    await heroTitle.click();
    await heroTitle.fill("Nouveau Titre");
    await heroTitle.blur();
    await expect(page.locator("text=Modifications enregistrées")).toBeVisible();
  });

  test("template switch preserves content", async ({ page }) => {
    await page.goto(`${BASE_URL}/app/:weddingId/templates`);
    const modernCard = page.locator('text=Moderne');
    await modernCard.click();
    await page.click('text=Appliquer');
    // Verify content preserved after template switch
    await page.goto(`${BASE_URL}/preview/test-wedding`);
    await expect(page.locator("h1")).toBeVisible();
  });

  test("gallery images display", async ({ page }) => {
    await page.goto(`${BASE_URL}/preview/test-wedding`);
    const gallery = page.locator('[data-section="gallery"]');
    await expect(gallery).toBeVisible();
  });

  test("RSVP form submits in preview", async ({ page }) => {
    await page.goto(`${BASE_URL}/preview/test-wedding/rsvp`);
    const form = page.locator('form');
    await expect(form).toBeVisible();
  });

  test("public site loads without auth", async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    await page.goto(`${BASE_URL}/test-wedding`);
    await expect(page.locator("body")).toBeVisible();
    await context.close();
  });

});
*/

export {};
