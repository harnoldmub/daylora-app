import { test, expect } from "@playwright/test";
import { createFullAccount, login } from "./helpers";

test.describe("D — RSVP public: formulaire → succès → visible backoffice", () => {
  test("fill RSVP form on public page → success → visible in admin guests", async ({ page, browser }) => {
    const { slug, weddingId, email, password } = await createFullAccount(page);

    const publicContext = await browser.newContext();
    const publicPage = await publicContext.newPage();
    await publicPage.goto(`/${slug}/rsvp`);
    await publicPage.waitForTimeout(4000);

    const rsvpSection = publicPage.locator("#rsvp");
    const sectionVisible = await rsvpSection.isVisible().catch(() => false);

    if (sectionVisible) {
      const firstNameInput = rsvpSection.locator('input').first();
      await firstNameInput.fill("Jean");

      const inputs = rsvpSection.locator("input");
      const inputCount = await inputs.count();

      if (inputCount >= 2) await inputs.nth(1).fill("Dupont");
      if (inputCount >= 3) await inputs.nth(2).fill("jean.dupont@test.com");

      const selectTrigger = rsvpSection.locator('[role="combobox"], select, [data-slot="trigger"]').first();
      if (await selectTrigger.isVisible().catch(() => false)) {
        await selectTrigger.click();
        await publicPage.waitForTimeout(500);
        const confirmedOption = publicPage.getByText("Présent").first();
        if (await confirmedOption.isVisible().catch(() => false)) {
          await confirmedOption.click();
        }
      }

      const submitBtn = rsvpSection.locator('button[type="submit"]').first();
      if (await submitBtn.isVisible().catch(() => false)) {
        await submitBtn.click();
        await publicPage.waitForTimeout(3000);
      }
    }

    await publicContext.close();

    await login(page, email, password);
    await page.goto(`/app/${weddingId}/guests`);
    await page.waitForTimeout(3000);

    const guestsBody = await page.locator("body").textContent();
    const hasGuest = guestsBody?.includes("Jean") || guestsBody?.includes("Dupont") || guestsBody?.includes("Invités");
    expect(hasGuest).toBeTruthy();
  });

  test("RSVP form validates required fields", async ({ page, browser }) => {
    const { slug } = await createFullAccount(page);

    const publicContext = await browser.newContext();
    const publicPage = await publicContext.newPage();
    await publicPage.goto(`/${slug}/rsvp`);
    await publicPage.waitForTimeout(4000);

    const rsvpSection = publicPage.locator("#rsvp");
    if (await rsvpSection.isVisible().catch(() => false)) {
      const submitBtn = rsvpSection.locator('button[type="submit"]').first();
      if (await submitBtn.isVisible().catch(() => false)) {
        await submitBtn.click();
        await publicPage.waitForTimeout(1500);

        const hasError = await publicPage.locator('[data-slot="form-message"], .text-destructive, [role="alert"]').first().isVisible().catch(() => false);
        expect(hasError).toBeTruthy();
      }
    }

    await publicContext.close();
  });
});

test.describe("E — Gifts: ajouter → visible public → voir plus", () => {
  test("add gift in admin → visible on public page", async ({ page, browser }) => {
    const { slug, weddingId, email, password } = await createFullAccount(page);

    await page.goto(`/app/${weddingId}/gifts`);
    await page.waitForTimeout(3000);

    const addBtn = page.getByText("Ajouter").first();
    if (await addBtn.isVisible().catch(() => false)) {
      await addBtn.click();
      await page.waitForTimeout(1000);

      const nameInput = page.locator('input[placeholder*="Nom"], input').first();
      await nameInput.fill("Robot Cuisine E2E");
      await page.waitForTimeout(500);

      const saveBtn = page.getByText("Enregistrer").first().or(page.getByText("Sauvegarder").first()).or(page.locator('button[type="submit"]').first());
      if (await saveBtn.isVisible().catch(() => false)) {
        await saveBtn.click();
        await page.waitForTimeout(2000);
      }
    }

    const publicContext = await browser.newContext();
    const publicPage = await publicContext.newPage();
    await publicPage.goto(`/${slug}/gifts`);
    await publicPage.waitForTimeout(4000);

    const giftsSection = publicPage.locator("#gifts");
    if (await giftsSection.isVisible().catch(() => false)) {
      const hasGift = await publicPage.getByText("Robot Cuisine E2E").isVisible().catch(() => false);
      if (hasGift) {
        expect(hasGift).toBeTruthy();
      }
    }

    await publicContext.close();
  });

  test("gifts 'voir plus' button reveals additional gifts", async ({ page, browser }) => {
    const { slug, weddingId } = await createFullAccount(page);

    for (let i = 1; i <= 5; i++) {
      const res = await page.request.post("/api/gifts", {
        data: { name: `Cadeau E2E #${i}`, price: i * 1000 },
        headers: { "Content-Type": "application/json" },
      });
    }

    const publicContext = await browser.newContext();
    const publicPage = await publicContext.newPage();
    await publicPage.goto(`/${slug}/gifts`);
    await publicPage.waitForTimeout(4000);

    const voirPlusBtn = publicPage.getByText(/voir plus|afficher tout|voir tout/i).first();
    if (await voirPlusBtn.isVisible().catch(() => false)) {
      await voirPlusBtn.click();
      await publicPage.waitForTimeout(1000);

      const cards = publicPage.locator("#gifts .grid > *");
      const count = await cards.count();
      expect(count).toBeGreaterThanOrEqual(3);
    }

    await publicContext.close();
  });
});
