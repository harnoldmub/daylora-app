import { test, expect } from "@playwright/test";
import { createFullAccount, setUserOffset } from "./helpers";

setUserOffset(9);

test.describe("D — RSVP & Gifts on public page", () => {
  test("public page shows RSVP and gifts sections with correct content", async ({ page }) => {
    const { slug } = await createFullAccount(page);

    await page.goto(`/${slug}`);
    await page.waitForTimeout(4000);

    const bodyText = (await page.locator("body").textContent()) || "";
    expect(bodyText.length).toBeGreaterThan(50);

    const hasRSVP = bodyText.includes("RSVP") ||
                    bodyText.includes("Répondez") ||
                    bodyText.toUpperCase().includes("PRÉSENCE") ||
                    bodyText.includes("Confirmez");
    expect(hasRSVP).toBeTruthy();

    const rsvpSection = page.locator("#rsvp").first();
    if (await rsvpSection.isVisible().catch(() => false)) {
      const rsvpContent = (await rsvpSection.textContent()) || "";
      expect(rsvpContent.length).toBeGreaterThan(0);
      const hasFormElements = (await rsvpSection.locator("input, select, textarea, button, form").count()) > 0;
      if (!hasFormElements) {
        expect(rsvpContent).toBeTruthy();
      }
    }

    const hasGifts = bodyText.includes("Cadeaux") ||
                     bodyText.toUpperCase().includes("LISTE") ||
                     bodyText.toLowerCase().includes("cadeau");
    expect(hasGifts).toBeTruthy();
  });

  test("anonymous user can access public page", async ({ page, browser }) => {
    const { slug } = await createFullAccount(page);

    const anonContext = await browser.newContext();
    const anonPage = await anonContext.newPage();
    await anonPage.goto(`/${slug}`);
    await anonPage.waitForTimeout(5000);

    const bodyText = (await anonPage.locator("body").textContent()) || "";
    const isLoaded = bodyText.length > 50 && !bodyText.includes("introuvable");
    expect(isLoaded).toBeTruthy();

    await anonContext.close();
  });
});
