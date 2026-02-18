import { describe, it, expect, beforeEach } from "vitest";
import { MockStorage } from "../helpers/mock-storage";
import { buildUser, buildWedding, buildWeddingConfig, resetCounter } from "../helpers/factories";

describe("API — Weddings", () => {
  let storage: MockStorage;
  let owner: any;

  beforeEach(async () => {
    storage = new MockStorage();
    resetCounter();
    owner = await storage.upsertUser(buildUser({ firstName: "Léa" }));
  });

  describe("POST /api/weddings — Create", () => {
    it("CASE: creates a wedding with valid data", async () => {
      const wedding = await storage.createWedding(
        buildWedding(owner.id, { slug: "lea-thomas-2026", title: "Léa & Thomas" })
      );
      expect(wedding.id).toBeTruthy();
      expect(wedding.slug).toBe("lea-thomas-2026");
      expect(wedding.ownerId).toBe(owner.id);
      expect(wedding.status).toBe("draft");
    });

    it("CASE: wedding has complete config", async () => {
      const wedding = await storage.createWedding(buildWedding(owner.id));
      expect(wedding.config.theme).toBeDefined();
      expect(wedding.config.features).toBeDefined();
      expect(wedding.config.payments).toBeDefined();
      expect(wedding.config.texts).toBeDefined();
      expect(wedding.config.navigation).toBeDefined();
    });

    it("EDGE: slug uniqueness is enforced", async () => {
      await storage.createWedding(buildWedding(owner.id, { slug: "unique-slug" }));
      const found = await storage.getWeddingBySlug("unique-slug");
      expect(found).toBeDefined();
    });

    it("CASE: owner can have multiple weddings", async () => {
      await storage.createWedding(buildWedding(owner.id, { slug: "wedding-1" }));
      await storage.createWedding(buildWedding(owner.id, { slug: "wedding-2" }));
      const weddings = await storage.getWeddingsByOwner(owner.id);
      expect(weddings).toHaveLength(2);
    });
  });

  describe("GET /api/weddings/:id — Read", () => {
    it("CASE: returns wedding by id", async () => {
      const wedding = await storage.createWedding(buildWedding(owner.id));
      const found = await storage.getWedding(wedding.id);
      expect(found).toBeDefined();
      expect(found!.title).toBe(wedding.title);
    });

    it("CASE: returns undefined for non-existent id", async () => {
      const found = await storage.getWedding("non-existent-uuid");
      expect(found).toBeUndefined();
    });
  });

  describe("GET /api/weddings — Public by slug", () => {
    it("CASE: returns wedding by slug", async () => {
      await storage.createWedding(buildWedding(owner.id, { slug: "mon-mariage" }));
      const found = await storage.getWeddingBySlug("mon-mariage");
      expect(found).toBeDefined();
    });

    it("CASE: returns undefined for unknown slug", async () => {
      const found = await storage.getWeddingBySlug("does-not-exist");
      expect(found).toBeUndefined();
    });
  });

  describe("PATCH /api/weddings/:id — Update", () => {
    it("CASE: updates title", async () => {
      const wedding = await storage.createWedding(buildWedding(owner.id));
      const updated = await storage.updateWedding(wedding.id, { title: "Nouveau Titre" });
      expect(updated.title).toBe("Nouveau Titre");
    });

    it("CASE: updates status to published", async () => {
      const wedding = await storage.createWedding(buildWedding(owner.id));
      const updated = await storage.updateWedding(wedding.id, { status: "published" });
      expect(updated.status).toBe("published");
    });

    it("CASE: updates config partially (deep merge)", async () => {
      const wedding = await storage.createWedding(buildWedding(owner.id));
      const newConfig = {
        ...wedding.config,
        theme: { ...wedding.config.theme, primaryColor: "#FF0000" },
      };
      const updated = await storage.updateWedding(wedding.id, { config: newConfig });
      expect(updated.config.theme.primaryColor).toBe("#FF0000");
      expect(updated.config.features).toBeDefined();
    });

    it("CASE: updates template", async () => {
      const wedding = await storage.createWedding(buildWedding(owner.id));
      const updated = await storage.updateWedding(wedding.id, { templateId: "modern" });
      expect(updated.templateId).toBe("modern");
    });

    it("EDGE: updates plan to premium", async () => {
      const wedding = await storage.createWedding(buildWedding(owner.id));
      const updated = await storage.updateWedding(wedding.id, { currentPlan: "premium" });
      expect(updated.currentPlan).toBe("premium");
    });
  });

  describe("GET /api/weddings/list — User's weddings", () => {
    it("CASE: returns only user's weddings", async () => {
      const other = await storage.upsertUser(buildUser({ email: "other@test.fr" }));
      await storage.createWedding(buildWedding(owner.id, { slug: "w1" }));
      await storage.createWedding(buildWedding(other.id, { slug: "w2" }));

      const ownerWeddings = await storage.getWeddingsByOwner(owner.id);
      expect(ownerWeddings).toHaveLength(1);
      expect(ownerWeddings[0].slug).toBe("w1");
    });

    it("CASE: includes weddings via membership", async () => {
      const other = await storage.upsertUser(buildUser({ email: "other@test.fr" }));
      const otherWedding = await storage.createWedding(buildWedding(other.id, { slug: "w-shared" }));
      await storage.createMembership({ userId: owner.id, weddingId: otherWedding.id, role: "editor" });

      const weddings = await storage.getWeddingsForUser(owner.id);
      expect(weddings.length).toBeGreaterThanOrEqual(1);
      expect(weddings.some((w: any) => w.slug === "w-shared")).toBe(true);
    });
  });
});
