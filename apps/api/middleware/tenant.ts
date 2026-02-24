import { Request, Response, NextFunction } from "express";
import { storage } from "../storage";

export async function withWeddingFromRequest(req: Request, res: Response, next: NextFunction) {
  try {
    const paramWeddingId = (req.params as any)?.weddingId;
    const headerWeddingId = req.headers["x-wedding-id"];
    const headerSlug = req.headers["x-wedding-slug"];
    const user = (req as any).user;
    const querySlug = (req.query as any)?.slug;
    const queryWeddingId = (req.query as any)?.weddingId;

    let wedding;

    if (paramWeddingId) {
      wedding = await storage.getWedding(paramWeddingId);
    }

    if (!wedding && headerWeddingId) {
      wedding = await storage.getWedding(headerWeddingId as string);
    }

    if (!wedding && headerSlug && headerSlug !== "undefined") {
      wedding = await storage.getWeddingBySlug(headerSlug as string);
    }
    if (!wedding && queryWeddingId) {
      wedding = await storage.getWedding(queryWeddingId as string);
    }
    if (!wedding && querySlug) {
      wedding = await storage.getWeddingBySlug(querySlug as string);
    }

    if (!wedding && user) {
      const weddings = await storage.getWeddingsForUser(user.id);
      if (weddings.length > 0) wedding = weddings[0];
    }

    if (!wedding) return res.status(404).json({ message: "Mariage introuvable" });

    // Derive effective plan (avoid stale "premium" display if no active subscription exists).
    try {
      const sub = await storage.getSubscriptionByWedding(wedding.id);
      const isPremium = !!sub && ["active", "trialing"].includes(String(sub.status));
      wedding.currentPlan = isPremium ? "premium" : "free";
    } catch {
      wedding.currentPlan = wedding.currentPlan === "premium" ? "premium" : "free";
    }

    (req as any).wedding = wedding;

    const isPreview = req.headers["x-preview-mode"] === "true";
    const isAuthenticated = !!(req as any).user;
    if (!wedding.isPublished && !isPreview && !isAuthenticated) {
      return res.status(404).json({ message: "Ce site n'est pas encore publié." });
    }

    next();
  } catch (error) {
    res.status(500).json({ message: "Erreur résolution mariage" });
  }
}
