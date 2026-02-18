import { describe, it, expect, beforeEach } from "vitest";
import supertest from "supertest";
import { createFullTestApp } from "../helpers/test-app";
import { MockStorage } from "../helpers/mock-storage";
import { buildUser, resetCounter } from "../helpers/factories";

describe("HTTP Auth Routes", () => {
  let storage: MockStorage;
  let app: ReturnType<typeof createFullTestApp>;

  beforeEach(async () => {
    storage = new MockStorage();
    resetCounter();
    app = createFullTestApp(storage);
  });

  describe("POST /api/auth/signup", () => {
    it("creates a new user", async () => {
      const res = await supertest(app)
        .post("/api/auth/signup")
        .send({ email: "LEA@Nocely.Fr", password: "Str0ng!Pass", firstName: "Léa" });

      expect(res.status).toBe(201);
      expect(res.body.user.email).toBe("lea@nocely.fr");
    });

    it("rejects duplicate email", async () => {
      await storage.upsertUser(buildUser({ email: "lea@test.fr", passwordHash: "hashed:test" }));

      const res = await supertest(app)
        .post("/api/auth/signup")
        .send({ email: "lea@test.fr", password: "test", firstName: "Léa" });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain("déjà utilisé");
    });

    it("rejects missing email", async () => {
      const res = await supertest(app)
        .post("/api/auth/signup")
        .send({ password: "test" });

      expect(res.status).toBe(400);
    });
  });

  describe("POST /api/auth/login", () => {
    it("logs in with valid credentials", async () => {
      await storage.upsertUser(buildUser({ email: "lea@test.fr", passwordHash: "hashed:mypass" }));

      const res = await supertest(app)
        .post("/api/auth/login")
        .send({ email: "lea@test.fr", password: "mypass" });

      expect(res.status).toBe(200);
      expect(res.body.message).toContain("réussie");
    });

    it("rejects invalid credentials", async () => {
      await storage.upsertUser(buildUser({ email: "lea@test.fr", passwordHash: "hashed:correct" }));

      const res = await supertest(app)
        .post("/api/auth/login")
        .send({ email: "lea@test.fr", password: "wrong" });

      expect(res.status).toBe(401);
    });

    it("rejects non-existent user", async () => {
      const res = await supertest(app)
        .post("/api/auth/login")
        .send({ email: "nobody@test.fr", password: "pass" });

      expect(res.status).toBe(401);
    });
  });

  describe("GET /api/auth/me", () => {
    it("returns 401 for unauthenticated request", async () => {
      const res = await supertest(app).get("/api/auth/me");
      expect(res.status).toBe(401);
    });

    it("returns user data when authenticated", async () => {
      const user = await storage.upsertUser(buildUser({ email: "lea@test.fr", passwordHash: "hashed:pass123" }));
      const agent = supertest.agent(app);

      await agent.post("/api/auth/login").send({ email: "lea@test.fr", password: "pass123" });
      const res = await agent.get("/api/auth/me");

      expect(res.status).toBe(200);
      expect(res.body.email).toBe("lea@test.fr");
    });
  });

  describe("POST /api/auth/logout", () => {
    it("logs out the user and clears session", async () => {
      await storage.upsertUser(buildUser({ email: "lea@test.fr", passwordHash: "hashed:pass123" }));
      const agent = supertest.agent(app);

      await agent.post("/api/auth/login").send({ email: "lea@test.fr", password: "pass123" });
      await agent.post("/api/auth/logout").expect(200);

      const res = await agent.get("/api/auth/me");
      expect(res.status).toBe(401);
    });
  });

  describe("Session persistence", () => {
    it("maintains session across requests", async () => {
      await storage.upsertUser(buildUser({ email: "lea@test.fr", passwordHash: "hashed:pass123" }));
      const agent = supertest.agent(app);

      await agent.post("/api/auth/login").send({ email: "lea@test.fr", password: "pass123" });

      const res1 = await agent.get("/api/auth/me");
      expect(res1.status).toBe(200);

      const res2 = await agent.get("/api/auth/me");
      expect(res2.status).toBe(200);
      expect(res2.body.id).toBe(res1.body.id);
    });
  });
});
