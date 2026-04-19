import { Router } from "express";
import { authService } from "./auth-service";
import { authEmails } from "./auth-emails";
import { signupSchema, loginSchema, users } from "@shared/schema";
import { validateRequest } from "./middleware/guards";
import passport from "passport";
import rateLimit from "express-rate-limit";
import { storage } from "./storage";
import { db } from "./db";
import { eq } from "drizzle-orm";
import { isAuthenticated } from "./auth";

const router = Router();

function sanitizeUser(user: Record<string, unknown>) {
    const { passwordHash: _ph, ...safe } = user;
    return safe;
}

// Rate limiters for auth safety
const isDev = process.env.NODE_ENV !== "production";
const signupLimiter = rateLimit({ windowMs: 60 * 1000, max: isDev ? 100 : 5, message: "Trop de tentatives d'inscription. Réessayez dans une minute." });
const loginLimiter = rateLimit({ windowMs: 60 * 1000, max: isDev ? 100 : 10, message: "Trop de tentatives de connexion." });
const resendLimiter = rateLimit({ windowMs: 60 * 1000, max: isDev ? 100 : 3 });

/**
 * SIGNUP
 */
router.post("/signup", signupLimiter, validateRequest(signupSchema), async (req, res) => {
    try {
        const { email, password, firstName } = req.body;
        const existing = await storage.getUserByEmail(email);

        if (existing) {
            // Don't leak if user exists, but give generic error or handle case
            return res.status(400).json({ message: "Cet email est déjà utilisé." });
        }

        const passwordHash = await authService.hashPassword(password);
        const user = await storage.upsertUser({
            email: email.toLowerCase(),
            passwordHash,
            firstName,
            isAdmin: false
        });

        // Create verification token
        const { rawToken, hashedToken } = authService.generateToken();
        await storage.createEmailVerificationToken({
            userId: user.id,
            tokenHash: hashedToken,
            expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24h
        });

        // Send email (non-blocking for account creation)
        let emailDelivery: "sent" | "failed" = "sent";
        try {
            await authEmails.sendVerificationEmail(user.email, user.firstName || "Inconnu", rawToken);
        } catch (mailError) {
            emailDelivery = "failed";
            console.error("Verification email sending failed:", mailError);
        }

        const isDev = process.env.NODE_ENV !== "production";
        const debugVerifyUrl = isDev
            ? `${process.env.APP_BASE_URL || "http://localhost:5174"}/verify-email?token=${rawToken}`
            : undefined;
        const debugVerifyToken = isDev ? rawToken : undefined;

        res.status(201).json({
            message:
                emailDelivery === "sent"
                    ? "Inscription réussie. Vérifiez vos emails pour activer votre compte."
                    : "Compte créé. L'email de vérification n'a pas pu être envoyé pour le moment. Utilisez le lien de vérification ci-dessous en environnement local.",
            user: { id: user.id, email: user.email },
            emailDelivery,
            debugVerifyUrl,
            debugVerifyToken
        });
    } catch (error) {
        console.error("Signup error:", error);
        res.status(500).json({ message: "Erreur lors de l'inscription." });
    }
});

/**
 * LOGIN
 */
router.post("/login", loginLimiter, validateRequest(loginSchema), (req, res, next) => {
    return passport.authenticate("local", (err: any, user: any, info: any) => {
        if (err) return next(err);
        if (!user) {
            return res.status(401).json({ message: info?.message || "Identifiants invalides." });
        }

        if (!user.emailVerifiedAt) {
            return res.status(403).json({
                message: "Compte non vérifié. Veuillez confirmer votre adresse email.",
                canResend: true,
                email: user.email
            });
        }

        req.login(user, (err) => {
            if (err) return next(err);
            storage.updateUser(user.id, { lastLoginAt: new Date() }).catch(() => {});
            return res.json({ message: "Connexion réussie.", user: sanitizeUser(user as any) });
        });
    })(req, res, next);
});

/**
 * EMAIL VERIFICATION
 */
router.get("/verify-email", async (req, res) => {
    const { token } = req.query;
    if (!token || typeof token !== "string") {
        return res.status(400).json({ message: "Token manquant." });
    }

    try {
        const hashedToken = authService.hashToken(token);
        const authToken = await storage.getEmailVerificationTokenByHash(hashedToken);

        if (!authToken || authToken.usedAt || authToken.expiresAt < new Date()) {
            return res.status(400).json({ message: "Lien invalide ou expiré." });
        }

        await storage.updateUser(authToken.userId, { emailVerifiedAt: new Date() });
        await storage.consumeEmailVerificationToken(authToken.id);

        res.json({ message: "Votre email a été vérifié avec succès. Vous pouvez maintenant vous connecter." });
    } catch (error) {
        console.error("Verification error:", error);
        res.status(500).json({ message: "Erreur lors de la vérification." });
    }
});

/**
 * RESEND VERIFICATION
 */
router.post("/resend-verification", resendLimiter, async (req, res) => {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: "Email requis." });

    try {
        const user = await storage.getUserByEmail(email);
        if (!user || user.emailVerifiedAt) {
            return res.json({ message: "Si le compte existe et n'est pas vérifié, un email a été envoyé." });
        }

        const { rawToken, hashedToken } = authService.generateToken();
        await storage.createEmailVerificationToken({
            userId: user.id,
            tokenHash: hashedToken,
            expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        });

        let emailDelivery: "sent" | "failed" = "sent";
        try {
            await authEmails.sendVerificationEmail(user.email, user.firstName || "Inconnu", rawToken);
        } catch (mailError) {
            emailDelivery = "failed";
            console.error("Resend verification email failed:", mailError);
        }

        const isDev = process.env.NODE_ENV !== "production";
        const debugVerifyUrl = isDev
            ? `${process.env.APP_BASE_URL || "http://localhost:5174"}/verify-email?token=${rawToken}`
            : undefined;
        const debugVerifyToken = isDev ? rawToken : undefined;

        res.json({
            message: emailDelivery === "sent" ? "Nouvel email envoyé." : "Impossible d'envoyer l'email pour le moment.",
            emailDelivery,
            debugVerifyUrl,
            debugVerifyToken
        });
    } catch (error) {
        res.status(500).json({ message: "Erreur de serveur." });
    }
});

/**
 * FORGOT PASSWORD
 */
router.post("/forgot-password", resendLimiter, async (req, res) => {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: "Email requis." });

    try {
        const user = await storage.getUserByEmail(email);
        console.log(`[auth] forgot-password lookup: user ${user ? "found" : "NOT found"}`);
        let emailDelivery: "sent" | "failed" = "sent";
        let debugResetUrl: string | undefined;
        if (user) {
            const { rawToken, hashedToken } = authService.generateToken();
            await storage.createPasswordResetToken({
                userId: user.id,
                tokenHash: hashedToken,
                expiresAt: new Date(Date.now() + 60 * 60 * 1000), // 1h
            });
            try {
                await authEmails.sendPasswordResetEmail(user.email, rawToken);
            } catch (mailError) {
                emailDelivery = "failed";
                console.error("Password reset email failed:", mailError);
            }
            if (process.env.NODE_ENV !== "production") {
                debugResetUrl = `${process.env.APP_BASE_URL || "http://localhost:5174"}/reset-password?token=${rawToken}`;
            }
        }
        res.json({
            message: "Si un compte est associé à cet email, vous recevrez un lien de réinitialisation.",
            emailDelivery,
            debugResetUrl
        });
    } catch (error) {
        res.status(500).json({ message: "Erreur de serveur." });
    }
});

/**
 * RESET PASSWORD
 */
router.post("/reset-password", async (req, res) => {
    const { token, password } = req.body;
    if (!token || !password) return res.status(400).json({ message: "Données manquantes." });

    try {
        const hashedToken = authService.hashToken(token);
        const authToken = await storage.getPasswordResetTokenByHash(hashedToken);

        if (!authToken || authToken.usedAt || authToken.expiresAt < new Date()) {
            return res.status(400).json({ message: "Lien invalide ou expiré." });
        }

        const passwordHash = await authService.hashPassword(password);
        await storage.updateUser(authToken.userId, { passwordHash });
        await storage.consumePasswordResetToken(authToken.id);

        res.json({ message: "Votre mot de passe a été réinitialisé avec succès." });
    } catch (error) {
        res.status(500).json({ message: "Erreur de serveur." });
    }
});

/**
 * LOGOUT
 */
router.post("/logout", (req, res) => {
    req.logout((err) => {
        if (err) return res.status(500).json({ message: "Erreur lors de la déconnexion." });
        res.json({ success: true });
    });
});

/**
 * CURRENT USER (ME)
 */
router.get("/me", (req, res) => {
    try {
        if (typeof req.isAuthenticated !== "function" || !req.isAuthenticated()) return res.json(null);
        res.json(sanitizeUser(req.user as any));
    } catch (_err) {
        res.json(null);
    }
});

router.post("/premium-offer-seen", isAuthenticated, async (req, res) => {
    try {
        const userId = (req.user as any)?.id;
        if (!userId) return res.status(401).json({ message: "Non authentifié." });
        await db.update(users).set({ hasSeenPremiumOffer: true }).where(eq(users.id, userId));
        res.json({ ok: true });
    } catch (err) {
        console.error("Failed to mark premium offer as seen:", err);
        res.status(500).json({ message: "Erreur serveur." });
    }
});

router.delete("/account", isAuthenticated, async (req, res) => {
    try {
        const userId = (req.user as any)?.id;
        if (!userId) {
            return res.status(401).json({ message: "Non authentifié." });
        }

        const { reason, details } = req.body || {};
        if (!reason || typeof reason !== "string") {
            return res.status(400).json({ message: "Merci de sélectionner une raison avant de supprimer le compte." });
        }

        console.info("Account deletion requested", {
            userId,
            reason,
            details: typeof details === "string" ? details : null,
        });

        await storage.deleteUserAccount(userId);

        req.logout((err) => {
            if (err) {
                return res.status(500).json({ message: "Compte supprimé, mais la déconnexion a échoué." });
            }
            req.session?.destroy(() => {
                res.json({ ok: true });
            });
        });
    } catch (error) {
        console.error("Delete account error:", error);
        res.status(500).json({ message: "Impossible de supprimer le compte." });
    }
});

export default router;
