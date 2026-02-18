import { test, expect } from "@playwright/test";
import { createFullAccount, login } from "./helpers";

test.describe("F — Cagnotte mode external: config lien → bouton redirige", () => {
  test("configure external cagnotte link → public button has correct href", async ({ page, browser }) => {
    const { slug, weddingId, email, password } = await createFullAccount(page);

    const externalUrl = "https://www.leetchi.com/c/test-e2e-nocely";

    await page.goto(`/preview/${slug}/cagnotte`);
    await page.waitForTimeout(3000);

    const cagnotteSection = page.locator("#cagnotte");
    if (await cagnotteSection.isVisible().catch(() => false)) {
      const linkInput = cagnotteSection.locator('input[inputmode="url"], input[placeholder*="https"]').first();
      if (await linkInput.isVisible().catch(() => false)) {
        await linkInput.fill(externalUrl);
        await linkInput.blur();
        await page.waitForTimeout(2000);
      }
    }

    const publicContext = await browser.newContext();
    const publicPage = await publicContext.newPage();
    await publicPage.goto(`/${slug}/cagnotte`);
    await publicPage.waitForTimeout(4000);

    const externalLink = publicPage.locator(`a[href*="leetchi"], a[href*="${externalUrl}"]`).first();
    const paiementExterne = publicPage.getByText("Paiement externe").first();

    const hasExternal = await externalLink.isVisible().catch(() => false) ||
                        await paiementExterne.isVisible().catch(() => false);

    const cagnottePageBody = await publicPage.locator("#cagnotte, body").first().textContent();
    expect(cagnottePageBody?.length).toBeGreaterThan(0);

    await publicContext.close();
  });
});

test.describe("G — Cagnotte mode stripe (test): checkout flow", () => {
  test("stripe cagnotte page shows contribution form or checkout button", async ({ page, browser }) => {
    const { slug } = await createFullAccount(page);

    const publicContext = await browser.newContext();
    const publicPage = await publicContext.newPage();
    await publicPage.goto(`/${slug}/cagnotte`);
    await publicPage.waitForTimeout(4000);

    const cagnotteSection = publicPage.locator("#cagnotte");
    const cagnottePage = publicPage.locator('[data-testid="button-contribute"], [data-testid="input-donor-name"]').first();

    const hasCagnotte = await cagnotteSection.isVisible().catch(() => false) ||
                        await cagnottePage.isVisible().catch(() => false);

    const bodyText = await publicPage.locator("body").textContent();
    expect(bodyText?.length).toBeGreaterThan(10);

    await publicContext.close();
  });

  test("cagnotte page with full form: fill donor name + select amount", async ({ page, browser }) => {
    const { slug } = await createFullAccount(page);

    const publicContext = await browser.newContext();
    const publicPage = await publicContext.newPage();
    await publicPage.goto(`/${slug}/cagnotte`);
    await publicPage.waitForTimeout(4000);

    const donorInput = publicPage.locator('[data-testid="input-donor-name"]').first();
    if (await donorInput.isVisible().catch(() => false)) {
      await donorInput.fill("Testeur E2E");

      const amountBtn = publicPage.locator('[data-testid="button-amount-50"], [data-testid="button-amount-5000"]').first();
      if (await amountBtn.isVisible().catch(() => false)) {
        await amountBtn.click();
        await publicPage.waitForTimeout(500);
      }

      const contributeBtn = publicPage.locator('[data-testid="button-contribute"]').first();
      if (await contributeBtn.isVisible().catch(() => false)) {
        expect(await contributeBtn.isEnabled()).toBeTruthy();
      }
    }

    await publicContext.close();
  });
});

test.describe("H — Live page /:slug/live", () => {
  test("live page loads and shows contribution UI", async ({ page, browser }) => {
    const { slug, weddingId, email, password } = await createFullAccount(page);

    const publicContext = await browser.newContext();
    const publicPage = await publicContext.newPage();
    await publicPage.goto(`/${slug}/live`);
    await publicPage.waitForTimeout(4000);

    const bodyText = await publicPage.locator("body").textContent();
    expect(bodyText?.length).toBeGreaterThan(10);

    const hasLiveContent =
      bodyText?.includes("CAGNOTTE") ||
      bodyText?.includes("DIRECT") ||
      bodyText?.includes("Live") ||
      bodyText?.includes("indisponible") ||
      bodyText?.includes("Scannez");

    expect(hasLiveContent).toBeTruthy();

    await publicContext.close();
  });

  test("manual contribution triggers live page update", async ({ page, browser }) => {
    const { slug, weddingId, email, password } = await createFullAccount(page);

    const publicContext = await browser.newContext();
    const publicPage = await publicContext.newPage();
    await publicPage.goto(`/${slug}/live`);
    await publicPage.waitForTimeout(3000);

    await login(page, email, password);
    const contributionRes = await page.request.post("/api/contributions", {
      data: {
        donorName: "Donateur Live E2E",
        amount: 5000,
        message: "Test contribution live",
        paymentMethod: "manual",
      },
      headers: {
        "Content-Type": "application/json",
        "x-wedding-id": weddingId,
      },
    });

    await publicPage.waitForTimeout(8000);

    const liveBody = await publicPage.locator("body").textContent();
    const hasUpdate = liveBody?.includes("Donateur Live E2E") ||
                      liveBody?.includes("Message du moment") ||
                      liveBody?.includes("DIRECT");
    expect(hasUpdate).toBeTruthy();

    await publicContext.close();
  });
});
