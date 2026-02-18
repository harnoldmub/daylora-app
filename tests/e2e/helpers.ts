import { type Page, type BrowserContext, expect } from "@playwright/test";

export const TEST_USER = {
  firstName: "E2E",
  email: `e2e-${Date.now()}@nocely-test.fr`,
  password: "SecureE2E!2026",
};

export function uniqueEmail() {
  return `e2e-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@nocely-test.fr`;
}

export function uniqueSlug() {
  return `e2e-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export async function signup(page: Page, opts?: { email?: string; password?: string; firstName?: string }) {
  const email = opts?.email ?? uniqueEmail();
  const password = opts?.password ?? TEST_USER.password;
  const firstName = opts?.firstName ?? TEST_USER.firstName;

  await page.goto("/app/signup");
  await page.locator('input[name="firstName"]').fill(firstName);
  await page.locator('input[name="email"]').fill(email);
  await page.locator('input[name="password"]').fill(password);
  await page.locator('button[type="submit"]').click();

  await page.waitForURL(/\/app\/login/, { timeout: 15000 });
  return { email, password, firstName };
}

export async function login(page: Page, email: string, password: string) {
  await page.goto(`/app/login`);
  await page.locator('input[name="email"]').fill(email);
  await page.locator('input[name="password"]').fill(password);
  await page.locator('button[type="submit"]').click();
  await page.waitForURL(/\/app/, { timeout: 15000 });
}

export async function signupAndLogin(page: Page, opts?: { email?: string; password?: string; firstName?: string }) {
  const creds = await signup(page, opts);
  await login(page, creds.email, creds.password);
  return creds;
}

export async function completeOnboarding(page: Page, opts?: { slug?: string; title?: string; template?: string }) {
  const slug = opts?.slug ?? uniqueSlug();
  const title = opts?.title ?? `Mariage ${slug}`;
  const template = opts?.template ?? "classic";
  const futureDate = new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

  await page.goto("/app/onboarding");
  await page.waitForSelector('input[name="title"]', { timeout: 10000 });

  await page.locator('input[name="title"]').fill(title);
  await page.locator('input[name="slug"]').fill(slug);
  await page.locator('input[type="date"]').fill(futureDate);

  await page.getByText("Suivant").first().click();

  if (template !== "classic") {
    const templateLabel = template === "modern" ? "Moderne" : "Minimal";
    await page.getByText(templateLabel).click();
  }
  await page.getByText("Suivant").first().click();

  await page.getByText("Suivant").first().click();

  await page.getByText("Suivant").first().click();

  await page.getByText("Suivant").first().click();

  await page.getByText("Suivant").first().click();

  await page.locator('button[type="submit"]').click();
  await page.waitForURL(/\/app\/\d+\/welcome/, { timeout: 30000 });

  const url = page.url();
  const match = url.match(/\/app\/(\d+)\/welcome/);
  const weddingId = match?.[1] ?? "";

  return { slug, title, weddingId };
}

export async function createFullAccount(page: Page, opts?: { slug?: string; template?: string; email?: string; password?: string; firstName?: string }) {
  const creds = await signupAndLogin(page, { email: opts?.email, password: opts?.password, firstName: opts?.firstName });
  const wedding = await completeOnboarding(page, { slug: opts?.slug, template: opts?.template });
  return { ...creds, ...wedding };
}
