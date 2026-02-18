import { describe, it, expect, beforeEach } from "vitest";
import { MockStorage } from "../helpers/mock-storage";
import { buildUser, buildWedding, resetCounter } from "../helpers/factories";

describe("API — RSVP", () => {
  let storage: MockStorage;
  let owner: any;
  let wedding: any;

  beforeEach(async () => {
    storage = new MockStorage();
    resetCounter();
    owner = await storage.upsertUser(buildUser());
    wedding = await storage.createWedding(buildWedding(owner.id));
  });

  describe("POST /api/rsvp — Create", () => {
    it("CASE: creates a valid RSVP response", async () => {
      const rsvp = await storage.createRsvpResponse(wedding.id, {
        firstName: "Marie",
        lastName: "Dupont",
        email: "marie@test.fr",
        partySize: 2,
        availability: "confirmed",
      });

      expect(rsvp.id).toBeDefined();
      expect(rsvp.firstName).toBe("Marie");
      expect(rsvp.weddingId).toBe(wedding.id);
    });

    it("CASE: accepts RSVP without email", async () => {
      const rsvp = await storage.createRsvpResponse(wedding.id, {
        firstName: "Paul",
        lastName: "Martin",
        partySize: 1,
        availability: "declined",
      });
      expect(rsvp.id).toBeDefined();
    });

    it("CASE: allows declined RSVP", async () => {
      const rsvp = await storage.createRsvpResponse(wedding.id, {
        firstName: "Jean",
        lastName: "Bernard",
        availability: "declined",
        partySize: 1,
      });
      expect(rsvp.availability).toBe("declined");
    });

    it("CASE: allows pending RSVP", async () => {
      const rsvp = await storage.createRsvpResponse(wedding.id, {
        firstName: "Sophie",
        lastName: "Lambert",
        availability: "pending",
        partySize: 1,
      });
      expect(rsvp.availability).toBe("pending");
    });
  });

  describe("GET /api/rsvp — List", () => {
    it("CASE: returns all RSVPs for a wedding", async () => {
      await storage.createRsvpResponse(wedding.id, { firstName: "A", lastName: "B", partySize: 1, availability: "confirmed" });
      await storage.createRsvpResponse(wedding.id, { firstName: "C", lastName: "D", partySize: 2, availability: "declined" });

      const all = await storage.getAllRsvpResponses(wedding.id);
      expect(all).toHaveLength(2);
    });

    it("CASE: returns empty array for no RSVPs", async () => {
      const all = await storage.getAllRsvpResponses(wedding.id);
      expect(all).toEqual([]);
    });
  });

  describe("PUT /api/rsvp/:id — Update", () => {
    it("CASE: updates RSVP data", async () => {
      const rsvp = await storage.createRsvpResponse(wedding.id, {
        firstName: "Marie",
        lastName: "Dupont",
        partySize: 1,
        availability: "pending",
      });

      const updated = await storage.updateRsvpResponse(wedding.id, rsvp.id, {
        availability: "confirmed",
        partySize: 2,
      });

      expect(updated.availability).toBe("confirmed");
      expect(updated.partySize).toBe(2);
    });

    it("EDGE: cannot update RSVP from different wedding", async () => {
      const otherWedding = await storage.createWedding(buildWedding(owner.id, { slug: "other" }));
      const rsvp = await storage.createRsvpResponse(wedding.id, {
        firstName: "Marie",
        lastName: "Dupont",
        partySize: 1,
        availability: "confirmed",
      });

      await expect(
        storage.updateRsvpResponse(otherWedding.id, rsvp.id, { availability: "declined" })
      ).rejects.toThrow();
    });
  });

  describe("DELETE /api/rsvp/:id — Delete", () => {
    it("CASE: deletes an RSVP", async () => {
      const rsvp = await storage.createRsvpResponse(wedding.id, {
        firstName: "Marie",
        lastName: "Dupont",
        partySize: 1,
        availability: "confirmed",
      });

      await storage.deleteRsvpResponse(wedding.id, rsvp.id);
      const all = await storage.getAllRsvpResponses(wedding.id);
      expect(all).toHaveLength(0);
    });

    it("CASE: deleting non-existent RSVP is safe", async () => {
      await expect(
        storage.deleteRsvpResponse(wedding.id, 999)
      ).resolves.not.toThrow();
    });
  });

  describe("Multi-tenant RSVP isolation", () => {
    it("CASE: RSVPs are isolated between weddings", async () => {
      const otherOwner = await storage.upsertUser(buildUser({ email: "other@test.fr" }));
      const otherWedding = await storage.createWedding(buildWedding(otherOwner.id, { slug: "other-wedding" }));

      await storage.createRsvpResponse(wedding.id, { firstName: "A", lastName: "B", partySize: 1, availability: "confirmed" });
      await storage.createRsvpResponse(wedding.id, { firstName: "C", lastName: "D", partySize: 1, availability: "confirmed" });
      await storage.createRsvpResponse(otherWedding.id, { firstName: "E", lastName: "F", partySize: 1, availability: "confirmed" });

      const w1Rsvps = await storage.getAllRsvpResponses(wedding.id);
      const w2Rsvps = await storage.getAllRsvpResponses(otherWedding.id);

      expect(w1Rsvps).toHaveLength(2);
      expect(w2Rsvps).toHaveLength(1);
    });

    it("CASE: duplicate detection by email+firstName per wedding", async () => {
      await storage.createRsvpResponse(wedding.id, {
        firstName: "Marie",
        lastName: "Dupont",
        email: "marie@test.fr",
        partySize: 1,
        availability: "confirmed",
      });

      const duplicate = await storage.getRsvpByEmailAndFirstName(
        wedding.id,
        "marie@test.fr",
        "Marie"
      );
      expect(duplicate).toBeDefined();
    });
  });
});
