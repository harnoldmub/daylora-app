import { describe, it, expect, beforeEach } from "vitest";
import {
  buildUser,
  buildWedding,
  buildWeddingConfig,
  buildRsvp,
  buildGift,
  buildContribution,
  buildLiveJoke,
  resetCounter,
} from "../helpers/factories";

describe("test factories", () => {
  beforeEach(() => {
    resetCounter();
  });

  describe("buildUser", () => {
    it("creates a user with unique id and email", () => {
      const user1 = buildUser();
      const user2 = buildUser();
      expect(user1.id).not.toBe(user2.id);
      expect(user1.email).not.toBe(user2.email);
    });

    it("accepts overrides", () => {
      const user = buildUser({ firstName: "Léa", isAdmin: true });
      expect(user.firstName).toBe("Léa");
      expect(user.isAdmin).toBe(true);
    });

    it("has required fields", () => {
      const user = buildUser();
      expect(user.id).toBeTruthy();
      expect(user.email).toContain("@test.nocely.fr");
      expect(user.passwordHash).toBeTruthy();
      expect(user.createdAt).toBeInstanceOf(Date);
    });
  });

  describe("buildWedding", () => {
    it("creates a wedding with unique slug", () => {
      const w1 = buildWedding("owner1");
      const w2 = buildWedding("owner1");
      expect(w1.slug).not.toBe(w2.slug);
    });

    it("sets ownerId", () => {
      const w = buildWedding("owner-id-123");
      expect(w.ownerId).toBe("owner-id-123");
    });

    it("defaults to draft status and free plan", () => {
      const w = buildWedding("owner1");
      expect(w.status).toBe("draft");
      expect(w.currentPlan).toBe("free");
    });

    it("includes complete config", () => {
      const w = buildWedding("owner1");
      expect(w.config.theme).toBeDefined();
      expect(w.config.features).toBeDefined();
      expect(w.config.payments).toBeDefined();
      expect(w.config.texts).toBeDefined();
      expect(w.config.navigation).toBeDefined();
    });
  });

  describe("buildWeddingConfig", () => {
    it("has valid default theme", () => {
      const config = buildWeddingConfig();
      expect(config.theme.primaryColor).toMatch(/^#[0-9A-Fa-f]{6}$/);
      expect(["serif", "sans"]).toContain(config.theme.fontFamily);
    });

    it("has all features enabled by default", () => {
      const config = buildWeddingConfig();
      expect(config.features.jokesEnabled).toBe(true);
      expect(config.features.giftsEnabled).toBe(true);
      expect(config.features.cagnotteEnabled).toBe(true);
      expect(config.features.liveEnabled).toBe(true);
    });

    it("accepts overrides", () => {
      const config = buildWeddingConfig({
        features: { jokesEnabled: false, giftsEnabled: false, cagnotteEnabled: true, liveEnabled: true },
      });
      expect(config.features.jokesEnabled).toBe(false);
    });
  });

  describe("buildRsvp", () => {
    it("creates an RSVP with weddingId", () => {
      const rsvp = buildRsvp("wedding-1");
      expect(rsvp.weddingId).toBe("wedding-1");
      expect(rsvp.firstName).toBeTruthy();
      expect(rsvp.attending).toBe(true);
    });
  });

  describe("buildGift", () => {
    it("creates a gift with unique name", () => {
      const g1 = buildGift();
      const g2 = buildGift();
      expect(g1.name).not.toBe(g2.name);
    });
  });

  describe("buildContribution", () => {
    it("creates a contribution with amount and weddingId", () => {
      const c = buildContribution("wedding-1");
      expect(c.weddingId).toBe("wedding-1");
      expect(c.amount).toBeGreaterThan(0);
      expect(c.status).toBe("succeeded");
    });
  });

  describe("buildLiveJoke", () => {
    it("creates an active joke", () => {
      const joke = buildLiveJoke();
      expect(joke.text).toBeTruthy();
      expect(joke.active).toBe(true);
    });
  });
});
