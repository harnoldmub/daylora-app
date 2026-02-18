import { describe, it, expect, beforeEach } from "vitest";
import { MockStorage } from "../helpers/mock-storage";
import { buildUser, buildWedding, resetCounter } from "../helpers/factories";

describe("API — Live Jokes", () => {
  let storage: MockStorage;
  let owner: any;
  let wedding: any;

  beforeEach(async () => {
    storage = new MockStorage();
    resetCounter();
    owner = await storage.upsertUser(buildUser());
    wedding = await storage.createWedding(buildWedding(owner.id));
  });

  describe("POST /api/jokes — Create", () => {
    it("CASE: creates a joke", async () => {
      const joke = await storage.createLiveJoke(wedding.id, {
        text: "Pourquoi le marié sourit toujours ? Parce qu'il ne sait pas encore...",
        tone: "funny",
        active: true,
      });

      expect(joke.id).toBeDefined();
      expect(joke.text).toContain("marié");
      expect(joke.weddingId).toBe(wedding.id);
    });
  });

  describe("GET /api/jokes — List", () => {
    it("CASE: returns all jokes for a wedding", async () => {
      await storage.createLiveJoke(wedding.id, { text: "Joke 1", active: true });
      await storage.createLiveJoke(wedding.id, { text: "Joke 2", active: false });

      const jokes = await storage.getAllLiveJokes(wedding.id);
      expect(jokes).toHaveLength(2);
    });
  });

  describe("GET /api/jokes/next — Next joke", () => {
    it("CASE: returns first active joke", async () => {
      await storage.createLiveJoke(wedding.id, { text: "Inactive", active: false });
      await storage.createLiveJoke(wedding.id, { text: "Active one", active: true });

      const next = await storage.getNextLiveJoke(wedding.id);
      expect(next).toBeDefined();
      expect(next!.active).toBe(true);
    });

    it("CASE: returns null when no active jokes", async () => {
      await storage.createLiveJoke(wedding.id, { text: "Inactive", active: false });
      const next = await storage.getNextLiveJoke(wedding.id);
      expect(next).toBeNull();
    });
  });

  describe("PATCH /api/jokes/:id — Update", () => {
    it("CASE: toggles joke active state", async () => {
      const joke = await storage.createLiveJoke(wedding.id, { text: "Test", active: true });
      const updated = await storage.updateLiveJoke(wedding.id, joke.id, { active: false });
      expect(updated.active).toBe(false);
    });
  });

  describe("DELETE /api/jokes/:id — Delete", () => {
    it("CASE: deletes a joke", async () => {
      const joke = await storage.createLiveJoke(wedding.id, { text: "To delete", active: true });
      await storage.deleteLiveJoke(wedding.id, joke.id);
      const jokes = await storage.getAllLiveJokes(wedding.id);
      expect(jokes).toHaveLength(0);
    });
  });

  describe("Multi-tenant isolation", () => {
    it("CASE: jokes are isolated per wedding", async () => {
      const w2 = await storage.createWedding(buildWedding(owner.id, { slug: "w2" }));
      await storage.createLiveJoke(wedding.id, { text: "Joke W1" });
      await storage.createLiveJoke(w2.id, { text: "Joke W2" });

      expect(await storage.getAllLiveJokes(wedding.id)).toHaveLength(1);
      expect(await storage.getAllLiveJokes(w2.id)).toHaveLength(1);
    });
  });
});
