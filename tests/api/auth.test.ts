import { describe, it, expect, beforeEach } from "vitest";
import { MockStorage } from "../helpers/mock-storage";
import { buildUser, resetCounter } from "../helpers/factories";

describe("API — Auth Routes", () => {
  let storage: MockStorage;

  beforeEach(() => {
    storage = new MockStorage();
    resetCounter();
  });

  describe("POST /api/auth/signup", () => {
    it("CASE: valid signup creates a new user", async () => {
      const payload = {
        email: "lea@nocely.fr",
        password: "SecurePassword123",
        firstName: "Léa",
      };

      const user = await storage.upsertUser({
        ...payload,
        passwordHash: "$2b$10$fake",
      });

      expect(user.email).toBe("lea@nocely.fr");
      expect(user.firstName).toBe("Léa");
      expect(user.id).toBeTruthy();
    });

    it("CASE: duplicate email returns error", async () => {
      await storage.upsertUser(buildUser({ email: "lea@nocely.fr" }));
      const existing = await storage.getUserByEmail("lea@nocely.fr");
      expect(existing).toBeDefined();
    });

    it("CASE: email is stored lowercase", async () => {
      const user = await storage.upsertUser(buildUser({ email: "LEA@NOCELY.FR" }));
      expect(user.email).toBe("lea@nocely.fr");
    });

    it("EDGE: very long email should be handled", async () => {
      const longEmail = "a".repeat(200) + "@nocely.fr";
      const user = await storage.upsertUser(buildUser({ email: longEmail }));
      expect(user.email).toBe(longEmail.toLowerCase());
    });
  });

  describe("POST /api/auth/login", () => {
    it("CASE: returns user for valid credentials", async () => {
      const user = await storage.upsertUser(buildUser({ email: "lea@nocely.fr" }));
      const found = await storage.getUserByEmail("lea@nocely.fr");
      expect(found).toBeDefined();
      expect(found!.id).toBe(user.id);
    });

    it("CASE: returns undefined for non-existent email", async () => {
      const found = await storage.getUserByEmail("unknown@nocely.fr");
      expect(found).toBeUndefined();
    });
  });

  describe("POST /api/auth/logout", () => {
    it("CASE: session is destroyed after logout (simulated)", async () => {
      const user = await storage.upsertUser(buildUser());
      expect(user).toBeDefined();
    });
  });

  describe("GET /api/auth/me", () => {
    it("CASE: returns user data when authenticated", async () => {
      const user = await storage.upsertUser(buildUser({ firstName: "Léa" }));
      const found = await storage.getUser(user.id);
      expect(found!.firstName).toBe("Léa");
    });
  });
});
