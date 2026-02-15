import "dotenv/config";
import { storage } from "../apps/api/storage";
import { authService } from "../apps/api/auth-service";
import { pool } from "../apps/api/db";
import type { Wedding } from "../packages/shared/schema";

function slugify(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

async function main() {
  const email = (process.env.TEST_USER_EMAIL || "demo@libala.dev").toLowerCase();
  const password = process.env.TEST_USER_PASSWORD || "LibalaTest123!";
  const firstName = process.env.TEST_USER_FIRST_NAME || "Demo";
  const lastName = process.env.TEST_USER_LAST_NAME || "User";

  const passwordHash = await authService.hashPassword(password);
  let user = await storage.getUserByEmail(email);

  if (!user) {
    user = await storage.upsertUser({
      email,
      passwordHash,
      firstName,
      lastName,
      isAdmin: false,
      emailVerifiedAt: new Date(),
    });
  } else {
    user = await storage.updateUser(user.id, {
      passwordHash,
      firstName,
      lastName,
      emailVerifiedAt: new Date(),
    });
  }

  const weddings = await storage.getWeddingsForUser(user.id);
  let wedding = weddings[0];

  if (!wedding) {
    const baseSlug = slugify(`${firstName}-${lastName}`) || "demo-couple";
    const slug = `${baseSlug}-site`;
    const existing = await storage.getWeddingBySlug(slug);

    wedding = await storage.createWedding({
      ownerId: user.id,
      title: "Projet Demo Libala",
      slug: existing ? `${slug}-${Date.now().toString().slice(-4)}` : slug,
      templateId: "classic",
      status: "draft",
      currentPlan: "free",
    });
  }

  // Backfill advanced menu config for existing demo projects.
  const menuDefaults = [
    { id: "rsvp", label: "RSVP", path: "rsvp", enabled: true },
    { id: "cagnotte", label: "Cagnotte", path: "cagnotte", enabled: true },
    { id: "live", label: "Live", path: "live", enabled: true },
    { id: "story", label: "Histoire", path: "story", enabled: true },
    { id: "location", label: "Lieux", path: "location", enabled: true },
    { id: "program", label: "Programme", path: "program", enabled: true },
  ];

  const nav = (wedding as Wedding).config?.navigation;
  const existingMenu = (nav?.menuItems || []) as Array<{ id: string } & Record<string, any>>;
  const mergedMenu = menuDefaults.map((item) => {
    const found = existingMenu.find((m) => m.id === item.id);
    return found ? { ...item, ...found } : item;
  });
  const missingCoreItems = menuDefaults.some((item) => !existingMenu.some((m) => m.id === item.id));
  const hasCompletePages =
    typeof nav?.pages?.story === "boolean" &&
    typeof nav?.pages?.location === "boolean" &&
    typeof nav?.pages?.program === "boolean";

  if (missingCoreItems || !hasCompletePages) {
    wedding = await storage.updateWedding(wedding.id, {
      config: {
        ...(wedding.config || {}),
        navigation: {
          ...(wedding.config?.navigation || {}),
          pages: {
            rsvp: true,
            cagnotte: true,
            live: true,
            story: true,
            location: true,
            program: true,
            ...(wedding.config?.navigation?.pages || {}),
          },
          menuItems: mergedMenu,
          customPages: wedding.config?.navigation?.customPages || [],
        },
      },
    });
  }

  const appBaseUrl = process.env.APP_BASE_URL || "http://localhost:5174";
  const marketingBaseUrl = process.env.MARKETING_BASE_URL || "http://localhost:5173";

  console.log("Test user ready");
  console.log(`email=${email}`);
  console.log(`password=${password}`);
  console.log(`weddingId=${wedding.id}`);
  console.log(`adminUrl=${appBaseUrl}/app/login`);
  console.log(`publicUrl=${marketingBaseUrl}/${wedding.slug}`);
}

main()
  .catch((error) => {
    console.error("Failed to create test user:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await pool.end();
  });
