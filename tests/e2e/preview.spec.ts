import { test, expect } from "@playwright/test";
import { createFullAccount, setUserOffset } from "./helpers";

setUserOffset(5);

test.describe("B — Preview & Public page", () => {
  test("preview page loads with headings and sections", async ({ page }) => {
    const { slug } = await createFullAccount(page);
    await page.goto(`/preview/${slug}`);
    await page.waitForTimeout(4000);
    const body = await page.locator("body").textContent();
    expect(body?.length).toBeGreaterThan(0);
    const headings = await page.locator("h1, h2").count();
    expect(headings).toBeGreaterThan(0);
    const sections = await page.locator("section, [id]").count();
    expect(sections).toBeGreaterThan(0);
  });

  test("public page /:slug loads without auth and shows content", async ({ page, browser }) => {
    const { slug } = await createFullAccount(page);

    const publicContext = await browser.newContext();
    const publicPage = await publicContext.newPage();
    await publicPage.goto(`/${slug}`);
    await publicPage.waitForTimeout(4000);

    await expect(publicPage.locator("body")).toBeVisible();
    const bodyText = await publicPage.locator("body").textContent();
    expect(bodyText?.length).toBeGreaterThan(50);
    const headingCount = await publicPage.locator("h1, h2").count();
    expect(headingCount).toBeGreaterThan(0);

    await publicContext.close();
  });
});
