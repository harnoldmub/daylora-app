import { test, expect } from "@playwright/test";
import { createFullAccount, loginAndSetCookies, nextUserEmail, setUserOffset } from "./helpers";

setUserOffset(15);

test.describe("I — Multi-tenant isolation & inline editing", () => {
  test("owner sees their wedding in the dashboard", async ({ page }) => {
    const { weddingId } = await createFullAccount(page);

    await page.goto(`/app/${weddingId}`);
    await page.waitForTimeout(3000);

    expect(page.url()).toContain(`/app/${weddingId}`);
    const body = await page.locator("body").textContent();
    expect(body?.length).toBeGreaterThan(50);
  });

  test("preview mode loads for owner with headings", async ({ page }) => {
    const { slug } = await createFullAccount(page);

    await page.goto(`/preview/${slug}`);
    await page.waitForTimeout(4000);

    const body = await page.locator("body").textContent();
    expect(body?.length).toBeGreaterThan(50);
    const headings = page.locator("h1, h2");
    expect(await headings.count()).toBeGreaterThan(0);
  });

  test("different user sees their own data, not someone else's", async ({ browser }) => {
    const contextA = await browser.newContext();
    const pageA = await contextA.newPage();
    const accountA = await createFullAccount(pageA);
    await contextA.close();

    const contextB = await browser.newContext();
    const pageB = await contextB.newPage();
    const accountB = await createFullAccount(pageB);

    await pageB.goto(`/app/${accountB.weddingId}`);
    await pageB.waitForTimeout(3000);

    const navLinks = await pageB.locator(`a[href*="${accountB.weddingId}"]`).count();
    expect(navLinks).toBeGreaterThan(0);

    const linksToA = await pageB.locator(`a[href*="${accountA.weddingId}"]`).count();
    expect(linksToA).toBe(0);

    await contextB.close();
  });
});
