import { Request, Response, NextFunction } from "express";
import { ZodSchema } from "zod";
import { storage } from "../storage";
import { type Wedding } from "@shared/schema";

/**
 * Middleware to resolve the wedding tenant context.
 * Resolves by x-wedding-slug header or from the authenticated user's first wedding.
 */
export const withWedding = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const headerSlug = req.headers['x-wedding-slug'];
        const headerWeddingId = req.headers['x-wedding-id'];
        const paramWeddingId = (req.params as any)?.weddingId;
        const user = (req as any).user;
        const querySlug = (req.query as any)?.slug;
        const queryWeddingId = (req.query as any)?.weddingId;

        let wedding: Wedding | undefined;

        if (paramWeddingId) {
            wedding = await storage.getWedding(paramWeddingId as string);
        }

        if (!wedding && headerWeddingId) {
            wedding = await storage.getWedding(headerWeddingId as string);
        }

        if (!wedding && headerSlug && headerSlug !== 'undefined') {
            wedding = await storage.getWeddingBySlug(headerSlug as string);
        }
        if (!wedding && queryWeddingId) {
            wedding = await storage.getWedding(queryWeddingId as string);
        }
        if (!wedding && querySlug) {
            wedding = await storage.getWeddingBySlug(querySlug as string);
        }

        // Fallback to user's first wedding if authenticated and no slug provided
        if (!wedding && user) {
            const userWeddings = await storage.getWeddingsForUser(user.id);
            if (userWeddings.length > 0) {
                wedding = userWeddings[0];
            }
        }

        if (!wedding) {
            return res.status(404).json({ message: "Contexte du mariage introuvable" });
        }

        // Derive the effective plan from Stripe subscription state (prevents stale "premium" flags).
        try {
            const sub = await storage.getSubscriptionByWedding(wedding.id);
            const isPremium = !!sub && ["active", "trialing"].includes(String(sub.status));
            wedding.currentPlan = isPremium ? "premium" : "free";
        } catch {
            wedding.currentPlan = wedding.currentPlan === "premium" ? "premium" : "free";
        }

        (req as any).wedding = wedding;
        next();
    } catch (error) {
        console.error("Tenant resolution error:", error);
        res.status(500).json({ message: "Erreur lors de la résolution du contexte locataire" });
    }
};

/**
 * Middleware to check if the authenticated user has a specific role in the current wedding.
 * Requires withWedding to be called before.
 */
export const requireRole = (roles: string[]) => {
    return async (req: Request, res: Response, next: NextFunction) => {
        const user = (req as any).user;
        const wedding = (req as any).wedding as Wedding;

        if (!user) return res.status(401).json({ message: "Non authentifié" });
        if (!wedding) return res.status(404).json({ message: "Mariage non résolu" });

        // Check if user is the global admin
        if (user.isAdmin) return next();

        // Check if user is the owner
        if (wedding.ownerId === user.id) return next();

        // Check membership role
        const memberships = await storage.getMembershipsByWedding(wedding.id);
        const userMembership = memberships.find(m => m.userId === user.id);

        if (!userMembership || !roles.includes(userMembership.role)) {
            return res.status(403).json({ message: "Accès refusé : rôle insuffisant" });
        }

        next();
    };
};

/**
 * Generic Zod validation middleware for request bodies.
 */
export const validateRequest = (schema: ZodSchema) => {
    return (req: Request, res: Response, next: NextFunction) => {
        try {
            req.body = schema.parse(req.body);
            next();
        } catch (error: any) {
            res.status(400).json({
                message: "Validation échouée",
                errors: error.issues
            });
        }
    };
};

/**
 * Middleware to ensure the wedding has a premium plan for specific features.
 */
export const requirePremium = (req: Request, res: Response, next: NextFunction) => {
    const wedding = (req as any).wedding as Wedding;
    if (!wedding) return res.status(404).json({ message: "Mariage introuvable" });

    if (wedding.currentPlan !== 'premium') {
        return res.status(403).json({
            message: "Cette fonctionnalité requiert un abonnement Premium",
            code: "PREMIUM_REQUIRED"
        });
    }

    next();
};
