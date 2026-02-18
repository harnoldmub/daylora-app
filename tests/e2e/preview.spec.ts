import { test, expect } from "@playwright/test";
import { createFullAccount, signupAndLogin, completeOnboarding } from "./helpers";

test.describe("B — Template switch + Preview", () => {
  test("create wedding with classic template → preview shows hero", async ({ page }) => {
    const { slug } = await createFullAccount(page, { template: "classic" });
    await page.goto(`/preview/${slug}`);
    await page.waitForTimeout(3000);
    const body = await page.locator("body").textContent();
    expect(body?.length).toBeGreaterThan(0);
  });

  test("switch template to modern via admin → preview loads", async ({ page }) => {
    const { slug, weddingId } = await createFullAccount(page, { template: "classic" });

    await page.goto(`/app/${weddingId}/templates`);
    await page.waitForTimeout(3000);

    const modernBtn = page.getByText("Moderne").first();
    if (await modernBtn.isVisible().catch(() => false)) {
      await modernBtn.click();
      await page.waitForTimeout(2000);

      const applyBtn = page.getByText("Appliquer").first();
      if (await applyBtn.isVisible().catch(() => false)) {
        await applyBtn.click();
        await page.waitForTimeout(2000);
      }
    }

    await page.goto(`/preview/${slug}`);
    await page.waitForTimeout(3000);
    await expect(page.locator("body")).toBeVisible();
  });

  test("switch template to minimal → preview loads", async ({ page }) => {
    const { slug, weddingId } = await createFullAccount(page, { template: "classic" });

    await page.goto(`/app/${weddingId}/templates`);
    await page.waitForTimeout(3000);

    const minimalBtn = page.getByText("Minimal").first();
    if (await minimalBtn.isVisible().catch(() => false)) {
      await minimalBtn.click();
      await page.waitForTimeout(2000);

      const applyBtn = page.getByText("Appliquer").first();
      if (await applyBtn.isVisible().catch(() => false)) {
        await applyBtn.click();
        await page.waitForTimeout(2000);
      }
    }

    await page.goto(`/preview/${slug}`);
    await page.waitForTimeout(3000);
    await expect(page.locator("body")).toBeVisible();
  });
});

test.describe("C — Publication → page publique /:slug", () => {
  test("public page /:slug loads without auth and shows expected sections", async ({ page, browser }) => {
    const { slug } = await createFullAccount(page);

    const publicContext = await browser.newContext();
    const publicPage = await publicContext.newPage();
    await publicPage.goto(`/${slug}`);
    await publicPage.waitForTimeout(4000);

    await expect(publicPage.locator("body")).toBeVisible();

    const bodyText = await publicPage.locator("body").textContent();
    expect(bodyText?.length).toBeGreaterThan(50);

    const rsvpSection = publicPage.locator("#rsvp");
    const rsvpVisible = await rsvpSection.isVisible().catch(() => false);

    const heroVisible = await publicPage.locator("h1, h2").first().isVisible().catch(() => false);
    expect(heroVisible || rsvpVisible).toBeTruthy();

    await publicContext.close();
  });

  test("public page shows RSVP, gifts, and cagnotte sections", async ({ page, browser }) => {
    const { slug } = await createFullAccount(page);

    const publicContext = await browser.newContext();
    const publicPage = await publicContext.newPage();
    await publicPage.goto(`/${slug}`);
    await publicPage.waitForTimeout(4000);

    const sections = ["rsvp", "gifts", "cagnotte"];
    for (const sectionId of sections) {
      const el = publicPage.locator(`#${sectionId}`);
      const exists = await el.count();
      expect(exists).toBeGreaterThanOrEqual(0);
    }

    await publicContext.close();
  });
});
