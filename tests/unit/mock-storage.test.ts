import { describe, it, expect, beforeEach } from "vitest";
import { MockStorage } from "../helpers/mock-storage";
import { buildUser, buildWedding, resetCounter } from "../helpers/factories";

describe("MockStorage", () => {
  let storage: MockStorage;

  beforeEach(() => {
    storage = new MockStorage();
    resetCounter();
  });

  describe("users", () => {
    it("creates and retrieves a user by id", async () => {
      const data = buildUser();
      const user = await storage.upsertUser(data);
      const found = await storage.getUser(user.id);
      expect(found).toBeDefined();
      expect(found!.email).toBe(data.email.toLowerCase());
    });

    it("retrieves user by email (case-insensitive)", async () => {
      await storage.upsertUser(buildUser({ email: "Lea@Test.FR" }));
      const found = await storage.getUserByEmail("lea@test.fr");
      expect(found).toBeDefined();
    });

    it("returns undefined for missing user", async () => {
      const found = await storage.getUser("nonexistent");
      expect(found).toBeUndefined();
    });

    it("updates an existing user", async () => {
      const user = await storage.upsertUser(buildUser());
      const updated = await storage.updateUser(user.id, { firstName: "Updated" });
      expect(updated.firstName).toBe("Updated");
    });
  });

  describe("weddings", () => {
    it("creates and retrieves by id", async () => {
      const data = buildWedding("owner-1");
      const wedding = await storage.createWedding(data);
      const found = await storage.getWedding(wedding.id);
      expect(found).toBeDefined();
      expect(found!.slug).toBe(data.slug);
    });

    it("retrieves by slug", async () => {
      const data = buildWedding("owner-1", { slug: "lea-thomas" });
      await storage.createWedding(data);
      const found = await storage.getWeddingBySlug("lea-thomas");
      expect(found).toBeDefined();
    });

    it("retrieves weddings by owner", async () => {
      await storage.createWedding(buildWedding("owner-1"));
      await storage.createWedding(buildWedding("owner-1"));
      await storage.createWedding(buildWedding("owner-2"));
      const weddings = await storage.getWeddingsByOwner("owner-1");
      expect(weddings).toHaveLength(2);
    });

    it("updates wedding data", async () => {
      const wedding = await storage.createWedding(buildWedding("owner-1"));
      const updated = await storage.updateWedding(wedding.id, { status: "published" });
      expect(updated.status).toBe("published");
    });
  });

  describe("RSVP", () => {
    it("creates and retrieves RSVPs", async () => {
      const wedding = await storage.createWedding(buildWedding("owner-1"));
      const rsvp = await storage.createRsvpResponse(wedding.id, {
        firstName: "Marie",
        lastName: "Dupont",
        email: "marie@test.fr",
        attending: true,
      });
      expect(rsvp.id).toBeDefined();

      const all = await storage.getAllRsvpResponses(wedding.id);
      expect(all).toHaveLength(1);
    });

    it("isolates RSVPs per wedding", async () => {
      const w1 = await storage.createWedding(buildWedding("o1", { slug: "w1" }));
      const w2 = await storage.createWedding(buildWedding("o2", { slug: "w2" }));

      await storage.createRsvpResponse(w1.id, { firstName: "A", lastName: "B" });
      await storage.createRsvpResponse(w1.id, { firstName: "C", lastName: "D" });
      await storage.createRsvpResponse(w2.id, { firstName: "E", lastName: "F" });

      expect(await storage.getAllRsvpResponses(w1.id)).toHaveLength(2);
      expect(await storage.getAllRsvpResponses(w2.id)).toHaveLength(1);
    });

    it("deletes RSVP only from correct wedding", async () => {
      const w1 = await storage.createWedding(buildWedding("o1", { slug: "w1" }));
      const w2 = await storage.createWedding(buildWedding("o2", { slug: "w2" }));

      const rsvp = await storage.createRsvpResponse(w1.id, { firstName: "A", lastName: "B" });
      await storage.deleteRsvpResponse(w2.id, rsvp.id);
      expect(await storage.getAllRsvpResponses(w1.id)).toHaveLength(1);

      await storage.deleteRsvpResponse(w1.id, rsvp.id);
      expect(await storage.getAllRsvpResponses(w1.id)).toHaveLength(0);
    });
  });

  describe("gifts", () => {
    it("creates and deletes gifts", async () => {
      const wedding = await storage.createWedding(buildWedding("o1"));
      const gift = await storage.createGift(wedding.id, { name: "Cadeau", price: 5000 });
      expect(gift.id).toBeDefined();

      await storage.deleteGift(wedding.id, gift.id);
      const all = await storage.getAllGifts(wedding.id);
      expect(all).toHaveLength(0);
    });
  });

  describe("contributions", () => {
    it("calculates total", async () => {
      const wedding = await storage.createWedding(buildWedding("o1"));
      await storage.createContribution({ weddingId: wedding.id, amount: 5000, status: "succeeded" });
      await storage.createContribution({ weddingId: wedding.id, amount: 3000, status: "succeeded" });
      await storage.createContribution({ weddingId: wedding.id, amount: 2000, status: "pending" });

      const total = await storage.getTotalContributions(wedding.id);
      expect(total).toBe(8000);
    });
  });

  describe("reset", () => {
    it("clears all data", async () => {
      await storage.upsertUser(buildUser());
      await storage.createWedding(buildWedding("o1"));
      storage.reset();
      expect(storage.users.size).toBe(0);
      expect(storage.weddings.size).toBe(0);
    });
  });
});
