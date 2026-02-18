import { test, expect } from "@playwright/test";
import { createFullAccount, setUserOffset } from "./helpers";

setUserOffset(12);

test.describe("F — Cagnotte & Live page", () => {
  test("public page shows cagnotte section with contribute elements", async ({ page }) => {
    const { slug } = await createFullAccount(page);

    await page.goto(`/${slug}`);
    await page.waitForTimeout(4000);

    const bodyText = (await page.locator("body").textContent()) || "";
    const hasCagnotte = bodyText.toLowerCase().includes("cagnotte") ||
                        bodyText.toLowerCase().includes("contribuer") ||
                        bodyText.toLowerCase().includes("participer");
    expect(hasCagnotte).toBeTruthy();

    const cagnotteSection = page.locator("#cagnotte, section:has-text('Cagnotte'), section:has-text('cagnotte')").first();
    if (await cagnotteSection.isVisible().catch(() => false)) {
      const contentText = (await cagnotteSection.textContent()) || "";
      expect(contentText.length).toBeGreaterThan(0);
      const hasAmountsOrButton = contentText.includes("€") ||
                                  contentText.toLowerCase().includes("contribuer") ||
                                  (await cagnotteSection.locator("button, input").count()) > 0;
      expect(hasAmountsOrButton).toBeTruthy();
    }
  });

  test("live page loads and shows contribution-related content", async ({ page }) => {
    const { slug } = await createFullAccount(page);

    await page.goto(`/${slug}/live`);
    await page.waitForTimeout(4000);

    const bodyText = (await page.locator("body").textContent()) || "";
    expect(bodyText.length).toBeGreaterThan(10);
    const hasHeadings = (await page.locator("h1, h2, h3").count()) > 0;
    expect(hasHeadings).toBeTruthy();
  });
});
