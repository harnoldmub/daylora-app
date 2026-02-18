import { type Page, request as playwrightRequest } from "@playwright/test";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const TEST_PASSWORD = "SecureE2E!2026";
const API_BASE = "http://127.0.0.1:3000";
const SETUP_FILE = path.join(__dirname, ".e2e-setup.json");

let userCounter = 0;
let setupData: Record<string, { cookie: string; slug: string; weddingId: string }> | null = null;

function loadSetupData() {
  if (setupData) return setupData;
  try {
    setupData = JSON.parse(fs.readFileSync(SETUP_FILE, "utf-8"));
  } catch {
    setupData = {};
  }
  return setupData!;
}

export function setUserOffset(offset: number) {
  userCounter = offset;
}

export function nextUserEmail() {
  userCounter++;
  return `e2e-user-${userCounter}@nocely-test.fr`;
}

function getUserData(email: string) {
  const data = loadSetupData();
  const entry = data[email];
  if (!entry) throw new Error(`No pre-seeded data for ${email}. Run global setup first.`);
  return entry;
}

export async function loginAndSetCookies(page: Page, email: string) {
  const { cookie } = getUserData(email);
  await page.context().addCookies([{
    name: "connect.sid",
    value: cookie,
    domain: "localhost",
    path: "/",
  }]);
  return { email, password: TEST_PASSWORD };
}

export async function getAuthenticatedApiContext(email: string) {
  const { cookie } = getUserData(email);
  const apiCtx = await playwrightRequest.newContext({
    baseURL: API_BASE,
    extraHTTPHeaders: { Cookie: `connect.sid=${cookie}` },
  });
  return apiCtx;
}

export async function createFullAccount(page: Page) {
  const email = nextUserEmail();
  const { cookie, slug, weddingId } = getUserData(email);

  await page.context().addCookies([{
    name: "connect.sid",
    value: cookie,
    domain: "localhost",
    path: "/",
  }]);

  return { email, password: TEST_PASSWORD, slug, weddingId };
}
