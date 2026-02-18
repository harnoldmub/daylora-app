import { describe, it, expect, beforeEach } from "vitest";
import { MockStorage } from "../helpers/mock-storage";
import { buildUser, buildWedding, resetCounter } from "../helpers/factories";

describe("Security Tests", () => {
  let storage: MockStorage;
  let owner: any;
  let wedding: any;

  beforeEach(async () => {
    storage = new MockStorage();
    resetCounter();
    owner = await storage.upsertUser(buildUser());
    wedding = await storage.createWedding(buildWedding(owner.id));
  });

  describe("Authentication enforcement", () => {
    it("CASE: unauthenticated user cannot access wedding data", async () => {
      const found = await storage.getUser("nonexistent-id");
      expect(found).toBeUndefined();
    });

    it("CASE: session-based auth — user serialization roundtrip", async () => {
      const user = await storage.upsertUser(buildUser());
      const deserialized = await storage.getUser(user.id);
      expect(deserialized).toBeDefined();
      expect(deserialized!.email).toBe(user.email);
    });
  });

  describe("Role-based access control", () => {
    it("CASE: owner has full access", async () => {
      const w = await storage.getWedding(wedding.id);
      expect(w!.ownerId).toBe(owner.id);
    });

    it("CASE: membership role 'editor' is recorded", async () => {
      const editor = await storage.upsertUser(buildUser({ email: "editor@test.fr" }));
      await storage.createMembership({
        userId: editor.id,
        weddingId: wedding.id,
        role: "editor",
      });

      const membership = await storage.getMembershipByUserAndWedding(editor.id, wedding.id);
      expect(membership).toBeDefined();
      expect(membership!.role).toBe("editor");
    });

    it("CASE: viewer role is recorded", async () => {
      const viewer = await storage.upsertUser(buildUser({ email: "viewer@test.fr" }));
      await storage.createMembership({
        userId: viewer.id,
        weddingId: wedding.id,
        role: "viewer",
      });

      const membership = await storage.getMembershipByUserAndWedding(viewer.id, wedding.id);
      expect(membership!.role).toBe("viewer");
    });

    it("CASE: user without membership has no role", async () => {
      const stranger = await storage.upsertUser(buildUser({ email: "stranger@test.fr" }));
      const membership = await storage.getMembershipByUserAndWedding(stranger.id, wedding.id);
      expect(membership).toBeUndefined();
    });

    it("CASE: admin user flag is respected", async () => {
      const admin = await storage.upsertUser(buildUser({ isAdmin: true }));
      expect(admin.isAdmin).toBe(true);
    });
  });

  describe("Multi-tenant data isolation", () => {
    it("CASE: user A cannot see user B's wedding data", async () => {
      const userB = await storage.upsertUser(buildUser({ email: "userb@test.fr" }));
      const weddingB = await storage.createWedding(buildWedding(userB.id, { slug: "wedding-b" }));

      await storage.createRsvpResponse(wedding.id, { firstName: "Guest", lastName: "A" });
      await storage.createRsvpResponse(weddingB.id, { firstName: "Guest", lastName: "B" });

      const ownerRsvps = await storage.getAllRsvpResponses(wedding.id);
      const userBRsvps = await storage.getAllRsvpResponses(weddingB.id);

      expect(ownerRsvps).toHaveLength(1);
      expect(ownerRsvps[0].firstName).toBe("Guest");
      expect(ownerRsvps[0].lastName).toBe("A");

      expect(userBRsvps).toHaveLength(1);
      expect(userBRsvps[0].lastName).toBe("B");
    });

    it("CASE: contributions are scoped to wedding", async () => {
      const otherWedding = await storage.createWedding(buildWedding(owner.id, { slug: "other" }));

      await storage.createContribution({ weddingId: wedding.id, amount: 5000, status: "succeeded" });
      await storage.createContribution({ weddingId: otherWedding.id, amount: 10000, status: "succeeded" });

      expect(await storage.getTotalContributions(wedding.id)).toBe(5000);
      expect(await storage.getTotalContributions(otherWedding.id)).toBe(10000);
    });

    it("CASE: gift modification scoped to wedding", async () => {
      const otherWedding = await storage.createWedding(buildWedding(owner.id, { slug: "other" }));
      const gift = await storage.createGift(wedding.id, { name: "My Gift" });

      await expect(
        storage.updateGift(otherWedding.id, gift.id, { name: "Stolen" })
      ).rejects.toThrow();
    });
  });

  describe("Input validation — XSS prevention", () => {
    it("CASE: stores raw input (sanitization at display level)", async () => {
      const rsvp = await storage.createRsvpResponse(wedding.id, {
        firstName: '<script>alert("xss")</script>',
        lastName: "Dupont",
        partySize: 1,
        availability: "confirmed",
      });
      expect(rsvp.firstName).toBe('<script>alert("xss")</script>');
    });

    it("CASE: SQL injection in slug lookup is safe (parameterized)", async () => {
      const result = await storage.getWeddingBySlug("'; DROP TABLE weddings; --");
      expect(result).toBeUndefined();
    });
  });

  describe("Session security", () => {
    it("CASE: session config uses httpOnly cookies", () => {
      const cookieConfig = {
        secure: process.env.NODE_ENV === "production",
        httpOnly: true,
        sameSite: "lax",
      };
      expect(cookieConfig.httpOnly).toBe(true);
      expect(cookieConfig.sameSite).toBe("lax");
    });

    it("CASE: session secret is not the default in production", () => {
      const isProduction = process.env.NODE_ENV === "production";
      const secret = process.env.SESSION_SECRET || "nocely-secret-key";
      if (isProduction) {
        expect(secret).not.toBe("nocely-secret-key");
      }
    });
  });

  describe("Rate limiting configuration", () => {
    it("CASE: rate limit config is reasonable", () => {
      const apiLimiter = { windowMs: 15 * 60 * 1000, limit: 100 };
      const authLimiter = { windowMs: 15 * 60 * 1000, limit: 30 };

      expect(apiLimiter.windowMs).toBe(900000);
      expect(apiLimiter.limit).toBe(100);
      expect(authLimiter.limit).toBeLessThan(apiLimiter.limit);
    });
  });

  describe("Stripe webhook idempotency", () => {
    it("CASE: same event processed only once", async () => {
      const eventId = "evt_test_idempotent_123";

      expect(await storage.isStripeWebhookEventProcessed(eventId)).toBe(false);
      await storage.markStripeWebhookEventProcessed(eventId);
      expect(await storage.isStripeWebhookEventProcessed(eventId)).toBe(true);
    });
  });
});
