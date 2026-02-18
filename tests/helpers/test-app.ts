import express from "express";
import session from "express-session";
import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import createMemoryStore from "memorystore";
import supertest from "supertest";
import type { MockStorage } from "./mock-storage";

const MemoryStore = createMemoryStore(session);

export interface TestUser {
  id: string;
  email: string;
  firstName: string;
  isAdmin: boolean;
}

export function createTestApp(storage: MockStorage) {
  const app = express();

  app.use(express.json({ limit: "10mb" }));
  app.use(express.urlencoded({ extended: false }));

  const sessionStore = new MemoryStore({ checkPeriod: 86400000 });
  app.use(
    session({
      secret: "test-secret",
      resave: false,
      saveUninitialized: false,
      store: sessionStore,
      cookie: { secure: false, httpOnly: true, sameSite: "lax" },
    })
  );

  const localPassport = new passport.Passport();

  localPassport.use(
    new LocalStrategy({ usernameField: "email" }, async (email, password, done) => {
      const user = await storage.getUserByEmail(email);
      if (!user) return done(null, false, { message: "Identifiants invalides." });
      if (!user.passwordHash) return done(null, false, { message: "Identifiants invalides." });
      if (user.passwordHash !== password && user.passwordHash !== `hashed:${password}`) {
        return done(null, false, { message: "Identifiants invalides." });
      }
      return done(null, user);
    })
  );

  localPassport.serializeUser((user: any, done) => done(null, user.id));
  localPassport.deserializeUser(async (id: string, done) => {
    const user = await storage.getUser(id);
    done(null, user || null);
  });

  app.use(localPassport.initialize());
  app.use(localPassport.session());

  (app as any)._passport = localPassport;

  return app;
}

export function setupAuthRoutes(app: express.Express, storage: MockStorage) {
  const localPassport = (app as any)._passport || passport;

  app.post("/api/auth/login", (req, res, next) => {
    localPassport.authenticate("local", (err: any, user: any, info: any) => {
      if (err) return next(err);
      if (!user) return res.status(401).json({ message: info?.message || "Identifiants invalides." });
      req.login(user, (err) => {
        if (err) return next(err);
        return res.json({ message: "Connexion réussie.", user });
      });
    })(req, res, next);
  });

  app.post("/api/auth/signup", async (req, res) => {
    try {
      const { email, password, firstName } = req.body;
      if (!email || !password) return res.status(400).json({ message: "Email et mot de passe requis" });
      const existing = await storage.getUserByEmail(email);
      if (existing) return res.status(400).json({ message: "Cet email est déjà utilisé." });

      const user = await storage.upsertUser({
        email: email.toLowerCase(),
        passwordHash: `hashed:${password}`,
        firstName: firstName || "",
        isAdmin: false,
      });

      res.status(201).json({ message: "Inscription réussie.", user: { id: user.id, email: user.email } });
    } catch {
      res.status(500).json({ message: "Erreur lors de l'inscription." });
    }
  });

  app.get("/api/auth/me", (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Non authentifié" });
    res.json(req.user);
  });

  app.post("/api/auth/logout", (req, res) => {
    req.logout(() => {
      res.json({ message: "Déconnexion réussie." });
    });
  });
}

function isAuthenticated(req: express.Request, res: express.Response, next: express.NextFunction) {
  if (req.isAuthenticated()) return next();
  return res.status(401).json({ message: "Non authentifié" });
}

function withWedding(storage: MockStorage) {
  return async (req: express.Request, res: express.Response, next: express.NextFunction) => {
    try {
      const headerSlug = req.headers["x-wedding-slug"] as string | undefined;
      const headerWeddingId = req.headers["x-wedding-id"] as string | undefined;
      const paramWeddingId = (req.params as any)?.weddingId;
      const user = (req as any).user;

      let wedding;

      if (paramWeddingId) wedding = await storage.getWedding(paramWeddingId);
      if (!wedding && headerWeddingId) wedding = await storage.getWedding(headerWeddingId);
      if (!wedding && headerSlug && headerSlug !== "undefined") wedding = await storage.getWeddingBySlug(headerSlug);

      if (!wedding && user) {
        const userWeddings = await storage.getWeddingsForUser(user.id);
        if (userWeddings.length > 0) wedding = userWeddings[0];
      }

      if (!wedding) return res.status(404).json({ message: "Contexte du mariage introuvable" });

      try {
        const sub = await storage.getSubscriptionByWedding(wedding.id);
        const isPremium = !!sub && ["active", "trialing"].includes(String(sub.status));
        wedding.currentPlan = isPremium ? "premium" : "free";
      } catch {
        // keep existing plan
      }

      (req as any).wedding = wedding;
      next();
    } catch {
      res.status(500).json({ message: "Erreur résolution mariage" });
    }
  };
}

function requireRole(storage: MockStorage, roles: string[]) {
  return async (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const user = (req as any).user;
    const wedding = (req as any).wedding;

    if (!user) return res.status(401).json({ message: "Non authentifié" });
    if (!wedding) return res.status(404).json({ message: "Mariage non résolu" });
    if (user.isAdmin) return next();
    if (wedding.ownerId === user.id) return next();

    const memberships = await storage.getMembershipsByWedding(wedding.id);
    const userMembership = memberships.find((m: any) => m.userId === user.id);

    if (!userMembership || !roles.includes(userMembership.role)) {
      return res.status(403).json({ message: "Accès refusé : rôle insuffisant" });
    }
    next();
  };
}

export function setupCrudRoutes(app: express.Express, storage: MockStorage) {
  const weddingMw = withWedding(storage);

  app.get("/api/weddings/:id", isAuthenticated, async (req, res) => {
    const wedding = await storage.getWedding(req.params.id);
    if (!wedding) return res.status(404).json({ message: "Mariage introuvable" });
    const user = (req as any).user;
    if (!user.isAdmin) {
      const membership = await storage.getMembershipByUserAndWedding(user.id, wedding.id);
      if (wedding.ownerId !== user.id && !membership) {
        return res.status(403).json({ message: "Accès refusé" });
      }
    }
    res.json(wedding);
  });

  app.post("/api/weddings", isAuthenticated, async (req, res) => {
    try {
      const user = (req as any).user;
      const { title, slug } = req.body || {};
      if (!title || !slug) return res.status(400).json({ message: "Titre et slug requis" });
      const existing = await storage.getWeddingBySlug(slug);
      if (existing) return res.status(400).json({ message: "Slug déjà utilisé" });

      const wedding = await storage.createWedding({
        ownerId: user.id,
        title,
        slug,
        templateId: req.body.templateId || "classic",
        config: req.body.config || {},
        status: "draft",
      });
      res.status(201).json(wedding);
    } catch {
      res.status(500).json({ message: "Erreur création mariage" });
    }
  });

  app.patch("/api/weddings/:id", isAuthenticated, async (req, res) => {
    try {
      const wedding = await storage.getWedding(req.params.id);
      if (!wedding) return res.status(404).json({ message: "Mariage introuvable" });
      const user = (req as any).user;
      if (wedding.ownerId !== user.id && !user.isAdmin) {
        return res.status(403).json({ message: "Accès refusé" });
      }
      const updated = await storage.updateWedding(wedding.id, req.body);
      res.json(updated);
    } catch {
      res.status(500).json({ message: "Erreur mise à jour" });
    }
  });

  app.post("/api/rsvp", weddingMw, async (req, res) => {
    try {
      const wedding = (req as any).wedding;
      const response = await storage.createRsvpResponse(wedding.id, req.body);
      res.json(response);
    } catch {
      res.status(400).json({ message: "Invalid request data" });
    }
  });

  app.get("/api/rsvp", isAuthenticated, weddingMw, requireRole(storage, ["owner", "admin", "editor", "viewer"]), async (req, res) => {
    try {
      const wedding = (req as any).wedding;
      const responses = await storage.getAllRsvpResponses(wedding.id);
      res.json(responses);
    } catch {
      res.status(500).json({ message: "Failed to fetch RSVPs" });
    }
  });

  app.delete("/api/rsvp/:id", isAuthenticated, weddingMw, async (req, res) => {
    try {
      const wedding = (req as any).wedding;
      const id = parseInt(req.params.id);
      await storage.deleteRsvpResponse(wedding.id, id);
      res.json({ success: true });
    } catch {
      res.status(500).json({ message: "Failed to delete RSVP" });
    }
  });

  app.get("/api/gifts", isAuthenticated, weddingMw, async (req, res) => {
    const wedding = (req as any).wedding;
    const gifts = await storage.getAllGifts(wedding.id);
    res.json(gifts);
  });

  app.post("/api/gifts", isAuthenticated, weddingMw, async (req, res) => {
    try {
      const wedding = (req as any).wedding;
      const gift = await storage.createGift(wedding.id, req.body);
      res.status(201).json(gift);
    } catch {
      res.status(400).json({ message: "Invalid gift data" });
    }
  });

  app.delete("/api/gifts/:id", isAuthenticated, weddingMw, async (req, res) => {
    try {
      const wedding = (req as any).wedding;
      await storage.deleteGift(wedding.id, parseInt(req.params.id));
      res.json({ success: true });
    } catch {
      res.status(500).json({ message: "Failed to delete gift" });
    }
  });

  app.get("/api/contributions", isAuthenticated, weddingMw, async (req, res) => {
    const wedding = (req as any).wedding;
    const contributions = await storage.getAllContributions(wedding.id);
    res.json(contributions);
  });

  app.get("/api/contributions/total", weddingMw, async (req, res) => {
    const wedding = (req as any).wedding;
    const total = await storage.getTotalContributions(wedding.id);
    res.json({ total });
  });

  app.get("/api/jokes", isAuthenticated, weddingMw, async (req, res) => {
    const wedding = (req as any).wedding;
    const jokes = await storage.getAllLiveJokes(wedding.id);
    res.json(jokes);
  });

  app.post("/api/jokes", isAuthenticated, weddingMw, async (req, res) => {
    try {
      const wedding = (req as any).wedding;
      const joke = await storage.createLiveJoke(wedding.id, req.body);
      res.status(201).json(joke);
    } catch {
      res.status(400).json({ message: "Invalid joke data" });
    }
  });

  app.delete("/api/jokes/:id", isAuthenticated, weddingMw, async (req, res) => {
    try {
      const wedding = (req as any).wedding;
      await storage.deleteLiveJoke(wedding.id, parseInt(req.params.id));
      res.json({ success: true });
    } catch {
      res.status(500).json({ message: "Failed to delete joke" });
    }
  });
}

export function createFullTestApp(storage: MockStorage) {
  const app = createTestApp(storage);
  setupAuthRoutes(app, storage);
  setupCrudRoutes(app, storage);
  return app;
}

export async function authenticatedAgent(
  app: express.Express,
  user: TestUser
): Promise<supertest.Agent> {
  const agent = supertest.agent(app);

  await agent
    .post("/api/auth/login")
    .send({ email: user.email, password: user.passwordHash?.replace("hashed:", "") || "testpassword123" })
    .expect(200);

  return agent;
}

export function unauthenticatedAgent(app: express.Express): supertest.Agent {
  return supertest.agent(app);
}
