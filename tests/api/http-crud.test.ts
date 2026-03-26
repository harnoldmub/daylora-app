import { describe, it, expect, beforeEach } from "vitest";
import supertest from "supertest";
import { createFullTestApp } from "../helpers/test-app";
import { MockStorage } from "../helpers/mock-storage";
import { buildUser, buildWedding, resetCounter } from "../helpers/factories";

describe("HTTP CRUD Operations", () => {
  let storage: MockStorage;
  let app: ReturnType<typeof createFullTestApp>;
  let owner: any;
  let wedding: any;
  let agent: supertest.Agent;

  beforeEach(async () => {
    storage = new MockStorage();
    resetCounter();
    app = createFullTestApp(storage);

    owner = await storage.upsertUser(buildUser({ email: "owner@test.fr", passwordHash: "hashed:pass" }));
    wedding = await storage.createWedding(buildWedding(owner.id, { slug: "crud-wedding" }));

    agent = supertest.agent(app);
    await agent.post("/api/auth/login").send({ email: "owner@test.fr", password: "pass" });
  });

  describe("RSVP CRUD via HTTP", () => {
    it("creates RSVP via public endpoint", async () => {
      const res = await supertest(app)
        .post("/api/rsvp")
        .set("x-wedding-slug", wedding.slug)
        .send({ firstName: "Marie", lastName: "Dupont", partySize: 2, availability: "confirmed" });

      expect(res.status).toBe(200);
      expect(res.body.firstName).toBe("Marie");
      expect(res.body.weddingId).toBe(wedding.id);
    });

    it("lists RSVPs (authenticated)", async () => {
      await storage.createRsvpResponse(wedding.id, { firstName: "Guest", lastName: "One" });
      await storage.createRsvpResponse(wedding.id, { firstName: "Guest", lastName: "Two" });

      const res = await agent.get("/api/rsvp").set("x-wedding-slug", wedding.slug);
      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(2);
    });

    it("deletes RSVP", async () => {
      const rsvp = await storage.createRsvpResponse(wedding.id, { firstName: "Del", lastName: "Me" });
      const res = await agent
        .delete(`/api/rsvp/${rsvp.id}`)
        .set("x-wedding-slug", wedding.slug);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it("bulk updates invitation type and table assignments", async () => {
      const rsvpA = await storage.createRsvpResponse(wedding.id, { firstName: "Marie", lastName: "A" });
      const rsvpB = await storage.createRsvpResponse(wedding.id, { firstName: "Paul", lastName: "B" });

      const res = await agent
        .post("/api/rsvp/bulk-update")
        .set("x-wedding-slug", wedding.slug)
        .send({
          ids: [rsvpA.id, rsvpB.id],
          patch: {
            invitationTypeId: "full_invite",
            assignedTableId: "family_a",
          },
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.updated).toBe(2);

      const updated = await storage.getAllRsvpResponses(wedding.id);
      expect(updated.every((item: any) => item.invitationTypeId === "full_invite")).toBe(true);
      expect(updated.every((item: any) => item.assignedTableId === "family_a")).toBe(true);
    });
  });

  describe("Gifts CRUD via HTTP", () => {
    it("creates gift", async () => {
      const res = await agent
        .post("/api/gifts")
        .set("x-wedding-slug", wedding.slug)
        .send({ name: "Vase", description: "A nice vase", url: "https://shop.com/vase" });

      expect(res.status).toBe(201);
      expect(res.body.name).toBe("Vase");
    });

    it("lists gifts", async () => {
      await storage.createGift(wedding.id, { name: "Gift 1" });
      await storage.createGift(wedding.id, { name: "Gift 2" });

      const res = await agent.get("/api/gifts").set("x-wedding-slug", wedding.slug);
      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(2);
    });

    it("deletes gift", async () => {
      const gift = await storage.createGift(wedding.id, { name: "Gone" });
      const res = await agent
        .delete(`/api/gifts/${gift.id}`)
        .set("x-wedding-slug", wedding.slug);
      expect(res.status).toBe(200);
    });
  });

  describe("Jokes CRUD via HTTP", () => {
    it("creates joke", async () => {
      const res = await agent
        .post("/api/jokes")
        .set("x-wedding-slug", wedding.slug)
        .send({ content: "Why did the chicken cross the road?" });

      expect(res.status).toBe(201);
      expect(res.body.content).toBe("Why did the chicken cross the road?");
    });

    it("lists jokes", async () => {
      await storage.createLiveJoke(wedding.id, { content: "Joke 1" });
      await storage.createLiveJoke(wedding.id, { content: "Joke 2" });

      const res = await agent.get("/api/jokes").set("x-wedding-slug", wedding.slug);
      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(2);
    });

    it("deletes joke", async () => {
      const joke = await storage.createLiveJoke(wedding.id, { content: "Bye" });
      const res = await agent
        .delete(`/api/jokes/${joke.id}`)
        .set("x-wedding-slug", wedding.slug);
      expect(res.status).toBe(200);
    });
  });

  describe("Contributions via HTTP", () => {
    it("lists contributions (authenticated)", async () => {
      await storage.createContribution({ weddingId: wedding.id, amount: 5000, donorName: "Paul" });

      const res = await agent.get("/api/contributions").set("x-wedding-slug", wedding.slug);
      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(1);
    });

    it("gets total contributions (public)", async () => {
      await storage.createContribution({ weddingId: wedding.id, amount: 5000, status: "succeeded" });
      await storage.createContribution({ weddingId: wedding.id, amount: 3000, status: "succeeded" });

      const res = await supertest(app)
        .get("/api/contributions/total")
        .set("x-wedding-slug", wedding.slug);
      expect(res.status).toBe(200);
      expect(res.body.total).toBe(8000);
    });
  });

  describe("Wedding CRUD via HTTP", () => {
    it("updates wedding config", async () => {
      const newConfig = { ...wedding.config, texts: { ...wedding.config.texts, heroTitle: "Updated!" } };
      const res = await agent
        .patch(`/api/weddings/${wedding.id}`)
        .send({ config: newConfig });

      expect(res.status).toBe(200);
      expect(res.body.config.texts.heroTitle).toBe("Updated!");
    });

    it("updates template", async () => {
      const res = await agent
        .patch(`/api/weddings/${wedding.id}`)
        .send({ templateId: "modern" });

      expect(res.status).toBe(200);
      expect(res.body.templateId).toBe("modern");
    });

    it("returns 404 for non-existent wedding", async () => {
      const res = await agent.get("/api/weddings/nonexistent-id");
      expect(res.status).toBe(404);
    });
  });
});
