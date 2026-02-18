import { FullConfig } from "@playwright/test";
import pg from "pg";
import argon2 from "argon2";
import crypto from "crypto";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PASSWORD = "SecureE2E!2026";
const USER_COUNT = 25;

function signCookie(sid: string, secret: string): string {
  const signature = crypto.createHmac("sha256", secret).update(sid).digest("base64").replace(/=+$/, "");
  return `s:${sid}.${signature}`;
}


export default async function globalSetup(config: FullConfig) {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.log("No DATABASE_URL, skipping global setup");
    return;
  }

  const sessionSecret = process.env.SESSION_SECRET || "nocely-secret-key";
  const pool = new pg.Pool({ connectionString: databaseUrl });
  const passwordHash = await argon2.hash(PASSWORD, { type: argon2.argon2id });

  const setupData: Record<string, { cookie: string; slug: string; weddingId: string }> = {};

  try {
    await pool.query(`DELETE FROM gifts WHERE wedding_id IN (SELECT id FROM weddings WHERE owner_id LIKE 'e2e-user-%')`);
    await pool.query(`DELETE FROM rsvp_responses WHERE wedding_id IN (SELECT id FROM weddings WHERE owner_id LIKE 'e2e-user-%')`);
    await pool.query(`DELETE FROM contributions WHERE wedding_id IN (SELECT id FROM weddings WHERE owner_id LIKE 'e2e-user-%')`);
    await pool.query(`DELETE FROM memberships WHERE wedding_id IN (SELECT id FROM weddings WHERE owner_id LIKE 'e2e-user-%')`);
    await pool.query(`DELETE FROM weddings WHERE owner_id LIKE 'e2e-user-%'`);
    await pool.query(`DELETE FROM sessions WHERE sid LIKE 'e2e-%' OR sess::text LIKE '%e2e-user-%'`);

    for (let i = 1; i <= USER_COUNT; i++) {
      const userId = `e2e-user-${i}`;
      const email = `e2e-user-${i}@nocely-test.fr`;
      const firstName = `E2EUser${i}`;

      await pool.query(
        `INSERT INTO users (id, email, password_hash, first_name, is_admin, email_verified_at, created_at, updated_at)
         VALUES ($1, $2, $3, $4, false, NOW(), NOW(), NOW())
         ON CONFLICT (id) DO UPDATE SET password_hash = $3, email_verified_at = NOW()`,
        [userId, email, passwordHash, firstName]
      );

      const sid = crypto.randomBytes(24).toString("hex");
      const expire = new Date(Date.now() + 24 * 60 * 60 * 1000);
      const sess = {
        cookie: {
          originalMaxAge: 604800000,
          expires: expire.toISOString(),
          httpOnly: true,
          path: "/",
          secure: false,
          sameSite: "lax",
        },
        passport: { user: userId },
      };

      await pool.query(
        `INSERT INTO sessions (sid, sess, expire) VALUES ($1, $2, $3)
         ON CONFLICT (sid) DO UPDATE SET sess = $2, expire = $3`,
        [sid, JSON.stringify(sess), expire]
      );

      const slug = `e2e-${i}-${Date.now().toString(36)}`;
      const title = `Mariage E2E ${i}`;
      const futureDate = new Date(Date.now() + 180 * 24 * 60 * 60 * 1000);

      const weddingResult = await pool.query(
        `INSERT INTO weddings (slug, owner_id, title, status, wedding_date, is_published, created_at, updated_at)
         VALUES ($1, $2, $3, 'active', $4, true, NOW(), NOW())
         RETURNING id`,
        [slug, userId, title, futureDate]
      );

      const weddingId = String(weddingResult.rows[0].id);

      setupData[email] = {
        cookie: signCookie(sid, sessionSecret),
        slug,
        weddingId,
      };
    }

    const outputPath = path.join(__dirname, ".e2e-setup.json");
    fs.writeFileSync(outputPath, JSON.stringify(setupData));

    console.log(`E2E Setup: ${USER_COUNT} users + weddings + sessions ready`);
  } catch (err) {
    console.error("E2E Setup error:", err);
    throw err;
  } finally {
    await pool.end();
  }
}
