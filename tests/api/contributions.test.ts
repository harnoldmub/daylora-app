import { describe, it, expect, beforeEach } from "vitest";
import { MockStorage } from "../helpers/mock-storage";
import { buildUser, buildWedding, resetCounter } from "../helpers/factories";

describe("API — Contributions / Cagnotte", () => {
  let storage: MockStorage;
  let owner: any;
  let wedding: any;

  beforeEach(async () => {
    storage = new MockStorage();
    resetCounter();
    owner = await storage.upsertUser(buildUser());
    wedding = await storage.createWedding(buildWedding(owner.id));
  });

  describe("POST /api/contributions/manual — Create", () => {
    it("CASE: creates a manual contribution", async () => {
      const contribution = await storage.createContribution({
        weddingId: wedding.id,
        donorName: "Marie & Pierre",
        donorEmail: "marie@test.fr",
        amount: 15000,
        message: "Félicitations !",
        status: "succeeded",
        source: "manual",
      });

      expect(contribution.id).toBeDefined();
      expect(contribution.amount).toBe(15000);
      expect(contribution.weddingId).toBe(wedding.id);
    });

    it("CASE: contribution without message", async () => {
      const c = await storage.createContribution({
        weddingId: wedding.id,
        donorName: "Anonyme",
        amount: 5000,
        status: "succeeded",
      });
      expect(c.id).toBeDefined();
    });
  });

  describe("GET /api/contributions — List", () => {
    it("CASE: returns all contributions", async () => {
      await storage.createContribution({ weddingId: wedding.id, amount: 5000, status: "succeeded" });
      await storage.createContribution({ weddingId: wedding.id, amount: 10000, status: "succeeded" });
      await storage.createContribution({ weddingId: wedding.id, amount: 3000, status: "pending" });

      const all = await storage.getAllContributions(wedding.id);
      expect(all).toHaveLength(3);
    });
  });

  describe("GET /api/contributions/confirmed", () => {
    it("CASE: returns only succeeded contributions", async () => {
      await storage.createContribution({ weddingId: wedding.id, amount: 5000, status: "succeeded" });
      await storage.createContribution({ weddingId: wedding.id, amount: 10000, status: "succeeded" });
      await storage.createContribution({ weddingId: wedding.id, amount: 3000, status: "pending" });
      await storage.createContribution({ weddingId: wedding.id, amount: 2000, status: "failed" });

      const confirmed = await storage.getConfirmedContributions(wedding.id);
      expect(confirmed).toHaveLength(2);
    });
  });

  describe("GET /api/contributions/total", () => {
    it("CASE: sums only succeeded contributions", async () => {
      await storage.createContribution({ weddingId: wedding.id, amount: 5000, status: "succeeded" });
      await storage.createContribution({ weddingId: wedding.id, amount: 10000, status: "succeeded" });
      await storage.createContribution({ weddingId: wedding.id, amount: 3000, status: "pending" });

      const total = await storage.getTotalContributions(wedding.id);
      expect(total).toBe(15000);
    });

    it("CASE: returns 0 when no contributions", async () => {
      const total = await storage.getTotalContributions(wedding.id);
      expect(total).toBe(0);
    });
  });

  describe("Multi-tenant isolation", () => {
    it("CASE: contributions are isolated per wedding", async () => {
      const w2 = await storage.createWedding(buildWedding(owner.id, { slug: "w2" }));
      await storage.createContribution({ weddingId: wedding.id, amount: 5000, status: "succeeded" });
      await storage.createContribution({ weddingId: w2.id, amount: 10000, status: "succeeded" });

      expect(await storage.getTotalContributions(wedding.id)).toBe(5000);
      expect(await storage.getTotalContributions(w2.id)).toBe(10000);
    });
  });

  describe("Stripe integration — Webhooks", () => {
    it("CASE: marks webhook event as processed (idempotency)", async () => {
      const eventId = "evt_test_123";
      expect(await storage.isStripeWebhookEventProcessed(eventId)).toBe(false);

      await storage.markStripeWebhookEventProcessed(eventId);
      expect(await storage.isStripeWebhookEventProcessed(eventId)).toBe(true);
    });

    it("CASE: deduplication prevents double processing", async () => {
      const eventId = "evt_test_456";
      await storage.markStripeWebhookEventProcessed(eventId);
      await storage.markStripeWebhookEventProcessed(eventId);
      expect(await storage.isStripeWebhookEventProcessed(eventId)).toBe(true);
    });
  });

  describe("Premium subscription", () => {
    it("CASE: upserts subscription", async () => {
      await storage.upsertStripeSubscription({
        weddingId: wedding.id,
        stripeCustomerId: "cus_test_123",
        stripeSubscriptionId: "sub_test_123",
        status: "active",
        priceId: "price_test_123",
      });

      const sub = await storage.getSubscriptionByWedding(wedding.id);
      expect(sub).toBeDefined();
      expect(sub!.status).toBe("active");
    });

    it("CASE: returns undefined for no subscription", async () => {
      const sub = await storage.getSubscriptionByWedding(wedding.id);
      expect(sub).toBeUndefined();
    });
  });
});
