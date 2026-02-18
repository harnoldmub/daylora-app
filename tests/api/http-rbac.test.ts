import { describe, it, expect, beforeEach } from "vitest";
import supertest from "supertest";
import { createFullTestApp } from "../helpers/test-app";
import { MockStorage } from "../helpers/mock-storage";
import { buildUser, buildWedding, resetCounter } from "../helpers/factories";

describe("HTTP RBAC & Multi-Tenant Isolation", () => {
  let storage: MockStorage;
  let app: ReturnType<typeof createFullTestApp>;
  let owner: any;
  let editor: any;
  let viewer: any;
  let stranger: any;
  let admin: any;
  let wedding: any;

  beforeEach(async () => {
    storage = new MockStorage();
    resetCounter();
    app = createFullTestApp(storage);

    owner = await storage.upsertUser(buildUser({ email: "owner@test.fr", passwordHash: "hashed:ownerpass" }));
    editor = await storage.upsertUser(buildUser({ email: "editor@test.fr", passwordHash: "hashed:editorpass" }));
    viewer = await storage.upsertUser(buildUser({ email: "viewer@test.fr", passwordHash: "hashed:viewerpass" }));
    stranger = await storage.upsertUser(buildUser({ email: "stranger@test.fr", passwordHash: "hashed:strangerpass" }));
    admin = await storage.upsertUser(buildUser({ email: "admin@test.fr", passwordHash: "hashed:adminpass", isAdmin: true }));

    wedding = await storage.createWedding(buildWedding(owner.id, { slug: "rbac-wedding" }));

    await storage.createMembership({ userId: editor.id, weddingId: wedding.id, role: "editor" });
    await storage.createMembership({ userId: viewer.id, weddingId: wedding.id, role: "viewer" });
  });

  async function loginAgent(email: string, password: string) {
    const agent = supertest.agent(app);
    await agent.post("/api/auth/login").send({ email, password });
    return agent;
  }

  describe("Authentication enforcement", () => {
    it("GET /api/rsvp — 401 without auth", async () => {
      const res = await supertest(app)
        .get("/api/rsvp")
        .set("x-wedding-slug", wedding.slug);
      expect(res.status).toBe(401);
    });

    it("GET /api/gifts — 401 without auth", async () => {
      const res = await supertest(app)
        .get("/api/gifts")
        .set("x-wedding-slug", wedding.slug);
      expect(res.status).toBe(401);
    });

    it("POST /api/weddings — 401 without auth", async () => {
      const res = await supertest(app)
        .post("/api/weddings")
        .send({ title: "Test", slug: "test" });
      expect(res.status).toBe(401);
    });

    it("POST /api/rsvp — public endpoint, no auth needed", async () => {
      const res = await supertest(app)
        .post("/api/rsvp")
        .set("x-wedding-slug", wedding.slug)
        .send({ firstName: "Marie", lastName: "Dupont", partySize: 1, availability: "confirmed" });
      expect(res.status).toBe(200);
    });
  });

  describe("Role-based access to RSVP list", () => {
    beforeEach(async () => {
      await storage.createRsvpResponse(wedding.id, {
        firstName: "Guest",
        lastName: "One",
        partySize: 2,
        availability: "confirmed",
      });
    });

    it("owner can list RSVPs", async () => {
      const agent = await loginAgent("owner@test.fr", "ownerpass");
      const res = await agent.get("/api/rsvp").set("x-wedding-slug", wedding.slug);
      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(1);
    });

    it("editor can list RSVPs", async () => {
      const agent = await loginAgent("editor@test.fr", "editorpass");
      const res = await agent.get("/api/rsvp").set("x-wedding-slug", wedding.slug);
      expect(res.status).toBe(200);
    });

    it("viewer can list RSVPs", async () => {
      const agent = await loginAgent("viewer@test.fr", "viewerpass");
      const res = await agent.get("/api/rsvp").set("x-wedding-slug", wedding.slug);
      expect(res.status).toBe(200);
    });

    it("stranger gets 403 on RSVP list", async () => {
      const agent = await loginAgent("stranger@test.fr", "strangerpass");
      const res = await agent.get("/api/rsvp").set("x-wedding-slug", wedding.slug);
      expect(res.status).toBe(403);
    });

    it("admin bypasses role check", async () => {
      const agent = await loginAgent("admin@test.fr", "adminpass");
      const res = await agent.get("/api/rsvp").set("x-wedding-slug", wedding.slug);
      expect(res.status).toBe(200);
    });
  });

  describe("Multi-tenant data isolation via HTTP", () => {
    let otherOwner: any;
    let otherWedding: any;

    beforeEach(async () => {
      otherOwner = await storage.upsertUser(buildUser({ email: "other@test.fr", passwordHash: "hashed:otherpass" }));
      otherWedding = await storage.createWedding(buildWedding(otherOwner.id, { slug: "other-wedding" }));

      await storage.createRsvpResponse(wedding.id, { firstName: "A", lastName: "Guest" });
      await storage.createRsvpResponse(otherWedding.id, { firstName: "B", lastName: "Guest" });
    });

    it("owner sees only own wedding RSVPs", async () => {
      const agent = await loginAgent("owner@test.fr", "ownerpass");
      const res = await agent.get("/api/rsvp").set("x-wedding-slug", wedding.slug);
      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(1);
      expect(res.body[0].firstName).toBe("A");
    });

    it("other owner sees only own wedding RSVPs", async () => {
      const agent = await loginAgent("other@test.fr", "otherpass");
      const res = await agent.get("/api/rsvp").set("x-wedding-slug", otherWedding.slug);
      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(1);
      expect(res.body[0].firstName).toBe("B");
    });

    it("cannot access another owner's wedding by ID", async () => {
      const agent = await loginAgent("owner@test.fr", "ownerpass");
      const res = await agent.get(`/api/weddings/${otherWedding.id}`);
      expect(res.status).toBe(403);
    });
  });

  describe("Wedding ownership", () => {
    it("owner can update their wedding", async () => {
      const agent = await loginAgent("owner@test.fr", "ownerpass");
      const res = await agent
        .patch(`/api/weddings/${wedding.id}`)
        .send({ templateId: "modern" });
      expect(res.status).toBe(200);
      expect(res.body.templateId).toBe("modern");
    });

    it("stranger cannot update wedding", async () => {
      const agent = await loginAgent("stranger@test.fr", "strangerpass");
      const res = await agent
        .patch(`/api/weddings/${wedding.id}`)
        .send({ templateId: "modern" });
      expect(res.status).toBe(403);
    });

    it("admin can update any wedding", async () => {
      const agent = await loginAgent("admin@test.fr", "adminpass");
      const res = await agent
        .patch(`/api/weddings/${wedding.id}`)
        .send({ templateId: "minimal" });
      expect(res.status).toBe(200);
      expect(res.body.templateId).toBe("minimal");
    });
  });

  describe("Wedding creation", () => {
    it("authenticated user can create wedding", async () => {
      const agent = await loginAgent("owner@test.fr", "ownerpass");
      const res = await agent
        .post("/api/weddings")
        .send({ title: "Mon Mariage", slug: "mon-mariage" });
      expect(res.status).toBe(201);
      expect(res.body.slug).toBe("mon-mariage");
    });

    it("rejects duplicate slug", async () => {
      const agent = await loginAgent("owner@test.fr", "ownerpass");
      const res = await agent
        .post("/api/weddings")
        .send({ title: "Test", slug: wedding.slug });
      expect(res.status).toBe(400);
      expect(res.body.message).toContain("Slug déjà utilisé");
    });

    it("rejects missing title", async () => {
      const agent = await loginAgent("owner@test.fr", "ownerpass");
      const res = await agent
        .post("/api/weddings")
        .send({ slug: "only-slug" });
      expect(res.status).toBe(400);
    });
  });

  describe("Wedding tenant resolution", () => {
    it("resolves wedding by x-wedding-slug header", async () => {
      const agent = await loginAgent("owner@test.fr", "ownerpass");
      const res = await agent.get("/api/gifts").set("x-wedding-slug", wedding.slug);
      expect(res.status).toBe(200);
    });

    it("resolves wedding by x-wedding-id header", async () => {
      const agent = await loginAgent("owner@test.fr", "ownerpass");
      const res = await agent.get("/api/gifts").set("x-wedding-id", wedding.id);
      expect(res.status).toBe(200);
    });

    it("404 for invalid slug", async () => {
      const res = await supertest(app)
        .post("/api/rsvp")
        .set("x-wedding-slug", "nonexistent")
        .send({ firstName: "Test", lastName: "Test" });
      expect(res.status).toBe(404);
    });
  });
});
