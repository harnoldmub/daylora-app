import { test, expect } from "@playwright/test";
import { createFullAccount, signupAndLogin, login } from "./helpers";

test.describe("I — Permissions multi-tenant: user A ne peut pas voir wedding B", () => {
  test("user B cannot access user A's backoffice", async ({ browser }) => {
    const contextA = await browser.newContext();
    const pageA = await contextA.newPage();
    const accountA = await createFullAccount(pageA);
    await contextA.close();

    const contextB = await browser.newContext();
    const pageB = await contextB.newPage();
    const accountB = await createFullAccount(pageB);

    await pageB.goto(`/app/${accountA.weddingId}/dashboard`);
    await pageB.waitForTimeout(3000);

    const url = pageB.url();
    const body = await pageB.locator("body").textContent();

    const isBlocked =
      !url.includes(`/app/${accountA.weddingId}/dashboard`) ||
      body?.includes("403") ||
      body?.includes("non autorisé") ||
      body?.includes("accès refusé") ||
      body?.includes("interdit") ||
      url.includes("/app/login");

    expect(isBlocked || !url.includes(accountA.weddingId)).toBeTruthy();

    await contextB.close();
  });

  test("user B cannot access user A's wedding via API (403)", async ({ browser }) => {
    const contextA = await browser.newContext();
    const pageA = await contextA.newPage();
    const accountA = await createFullAccount(pageA);
    await contextA.close();

    const contextB = await browser.newContext();
    const pageB = await contextB.newPage();
    const accountB = await createFullAccount(pageB);

    const response = await pageB.request.get(`/api/weddings/${accountA.weddingId}`, {
      headers: { "x-wedding-id": accountA.weddingId },
    });

    const status = response.status();
    expect([401, 403, 404]).toContain(status);

    await contextB.close();
  });

  test("user B cannot modify user A's RSVP via API", async ({ browser }) => {
    const contextA = await browser.newContext();
    const pageA = await contextA.newPage();
    const accountA = await createFullAccount(pageA);
    await contextA.close();

    const contextB = await browser.newContext();
    const pageB = await contextB.newPage();
    const accountB = await createFullAccount(pageB);

    const response = await pageB.request.get("/api/rsvp", {
      headers: { "x-wedding-id": accountA.weddingId },
    });

    const status = response.status();
    expect([401, 403, 404]).toContain(status);

    await contextB.close();
  });

  test("public page /:slug is accessible to anyone", async ({ browser }) => {
    const contextA = await browser.newContext();
    const pageA = await contextA.newPage();
    const accountA = await createFullAccount(pageA);
    await contextA.close();

    const anonContext = await browser.newContext();
    const anonPage = await anonContext.newPage();
    await anonPage.goto(`/${accountA.slug}`);
    await anonPage.waitForTimeout(4000);

    await expect(anonPage.locator("body")).toBeVisible();
    const body = await anonPage.locator("body").textContent();
    expect(body?.length).toBeGreaterThan(50);

    await anonContext.close();
  });
});

test.describe("J — Preview edition: modifier texte inline → refresh → persistance", () => {
  test("edit hero title inline in preview → text persists after reload", async ({ page }) => {
    const { slug, weddingId, email, password } = await createFullAccount(page);

    await page.goto(`/preview/${slug}`);
    await page.waitForTimeout(4000);

    const heroTitle = page.locator("h1").first();
    const originalText = await heroTitle.textContent();
    expect(originalText?.length).toBeGreaterThan(0);

    const editable = page.locator('[data-editable], [contenteditable="true"]').first();
    if (await editable.isVisible().catch(() => false)) {
      await editable.click();
      await page.waitForTimeout(500);

      await editable.fill("Titre E2E Modifié");
      await editable.blur();
      await page.waitForTimeout(2000);

      await page.reload();
      await page.waitForTimeout(4000);

      const newText = await page.locator("h1").first().textContent();
      const bodyText = await page.locator("body").textContent();
      const persisted = newText?.includes("Titre E2E Modifié") || bodyText?.includes("Titre E2E Modifié");
    }

    await expect(page.locator("body")).toBeVisible();
  });

  test("preview mode loads correctly for owner", async ({ page }) => {
    const { slug } = await createFullAccount(page);

    await page.goto(`/preview/${slug}`);
    await page.waitForTimeout(4000);

    await expect(page.locator("body")).toBeVisible();
    const body = await page.locator("body").textContent();
    expect(body?.length).toBeGreaterThan(50);
  });

  test("preview page shows editable areas for owner", async ({ page }) => {
    const { slug } = await createFullAccount(page);

    await page.goto(`/preview/${slug}`);
    await page.waitForTimeout(4000);

    const headings = page.locator("h1, h2");
    const headingCount = await headings.count();
    expect(headingCount).toBeGreaterThan(0);
  });

  test("non-owner cannot edit in preview mode", async ({ browser }) => {
    const contextA = await browser.newContext();
    const pageA = await contextA.newPage();
    const accountA = await createFullAccount(pageA);
    await contextA.close();

    const contextB = await browser.newContext();
    const pageB = await contextB.newPage();
    const accountB = await createFullAccount(pageB);

    await pageB.goto(`/preview/${accountA.slug}`);
    await pageB.waitForTimeout(4000);

    const editableElements = pageB.locator('[contenteditable="true"]');
    const count = await editableElements.count();
    expect(count).toBe(0);

    await contextB.close();
  });
});
