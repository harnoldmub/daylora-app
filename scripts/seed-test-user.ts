import "dotenv/config";
import { storage } from "../apps/api/storage";
import { authService } from "../apps/api/auth-service";

async function seedTestUser() {
  const email = "test@libala.dev";
  const password = "Test1234!";
  const firstName = "Test";
  const lastName = "User";
  const slug = "marie-et-sophie";

  const existing = await storage.getUserByEmail(email);
  const passwordHash = await authService.hashPassword(password);

  let user;
  if (existing) {
    user = await storage.updateUser(existing.id, {
      passwordHash,
      firstName,
      lastName,
      emailVerifiedAt: new Date(),
    });
  } else {
    user = await storage.upsertUser({
      email,
      passwordHash,
      firstName,
      lastName,
      emailVerifiedAt: new Date(),
      isAdmin: false,
    });
  }

  const weddings = await storage.getWeddingsByOwner(user.id);
  const existingWedding = weddings.find((w) => w.slug === slug);

  if (!existingWedding) {
    await storage.createWedding({
      ownerId: user.id,
      title: "Marie et Sophie",
      slug,
      templateId: "classic",
      status: "draft",
    });
  }

  console.log("seed complete");
}

seedTestUser().catch((err) => {
  console.error(err);
  process.exit(1);
});
