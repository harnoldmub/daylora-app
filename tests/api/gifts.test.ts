import { describe, it, expect, beforeEach } from "vitest";
import { MockStorage } from "../helpers/mock-storage";
import { buildUser, buildWedding, resetCounter } from "../helpers/factories";

describe("API — Gifts", () => {
  let storage: MockStorage;
  let owner: any;
  let wedding: any;

  beforeEach(async () => {
    storage = new MockStorage();
    resetCounter();
    owner = await storage.upsertUser(buildUser());
    wedding = await storage.createWedding(buildWedding(owner.id));
  });

  describe("POST /api/gifts — Create", () => {
    it("CASE: creates a gift", async () => {
      const gift = await storage.createGift(wedding.id, {
        name: "Service à thé",
        description: "Un magnifique service en porcelaine",
        price: 8500,
        imageUrl: "https://example.com/gift.jpg",
      });

      expect(gift.id).toBeDefined();
      expect(gift.name).toBe("Service à thé");
      expect(gift.weddingId).toBe(wedding.id);
    });

    it("CASE: creates gift without optional fields", async () => {
      const gift = await storage.createGift(wedding.id, {
        name: "Cadeau simple",
      });
      expect(gift.id).toBeDefined();
    });
  });

  describe("GET /api/gifts — List", () => {
    it("CASE: returns all gifts for wedding", async () => {
      await storage.createGift(wedding.id, { name: "Gift 1", price: 5000 });
      await storage.createGift(wedding.id, { name: "Gift 2", price: 10000 });

      const gifts = await storage.getAllGifts(wedding.id);
      expect(gifts).toHaveLength(2);
    });

    it("CASE: returns empty array when no gifts", async () => {
      const gifts = await storage.getAllGifts(wedding.id);
      expect(gifts).toEqual([]);
    });
  });

  describe("PATCH /api/gifts/:id — Update", () => {
    it("CASE: updates gift details", async () => {
      const gift = await storage.createGift(wedding.id, { name: "Original", price: 5000 });
      const updated = await storage.updateGift(wedding.id, gift.id, {
        name: "Mis à jour",
        price: 7500,
      });

      expect(updated.name).toBe("Mis à jour");
      expect(updated.price).toBe(7500);
    });

    it("CASE: marks gift as reserved", async () => {
      const gift = await storage.createGift(wedding.id, { name: "Gift", reserved: false });
      const updated = await storage.updateGift(wedding.id, gift.id, { reserved: true });
      expect(updated.reserved).toBe(true);
    });

    it("EDGE: cannot update gift from other wedding", async () => {
      const otherWedding = await storage.createWedding(buildWedding(owner.id, { slug: "other" }));
      const gift = await storage.createGift(wedding.id, { name: "My Gift" });

      await expect(
        storage.updateGift(otherWedding.id, gift.id, { name: "Hacked" })
      ).rejects.toThrow();
    });
  });

  describe("DELETE /api/gifts/:id — Delete", () => {
    it("CASE: deletes a gift", async () => {
      const gift = await storage.createGift(wedding.id, { name: "To Delete" });
      await storage.deleteGift(wedding.id, gift.id);
      const gifts = await storage.getAllGifts(wedding.id);
      expect(gifts).toHaveLength(0);
    });

    it("EDGE: deleting from wrong wedding does nothing", async () => {
      const otherWedding = await storage.createWedding(buildWedding(owner.id, { slug: "other" }));
      const gift = await storage.createGift(wedding.id, { name: "Safe Gift" });
      await storage.deleteGift(otherWedding.id, gift.id);

      const gifts = await storage.getAllGifts(wedding.id);
      expect(gifts).toHaveLength(1);
    });
  });

  describe("Multi-tenant gift isolation", () => {
    it("CASE: gifts are isolated per wedding", async () => {
      const w2 = await storage.createWedding(buildWedding(owner.id, { slug: "w2" }));
      await storage.createGift(wedding.id, { name: "Gift A" });
      await storage.createGift(w2.id, { name: "Gift B" });

      expect(await storage.getAllGifts(wedding.id)).toHaveLength(1);
      expect(await storage.getAllGifts(w2.id)).toHaveLength(1);
    });
  });
});
