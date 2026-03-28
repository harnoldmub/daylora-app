import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express, Request, Response, NextFunction } from "express";
import session from "express-session";
import connectPg from "connect-pg-simple";
import { storage } from "./storage";
import { authService } from "./auth-service";
import createMemoryStore from "memorystore";

export function setupAuth(app: Express) {
    const sessionTtl = 2 * 60 * 60 * 1000; // 2 hours
    let sessionStore: session.Store;
    const useDbStore =
        process.env.SESSION_STORE === "db" ||
        (process.env.NODE_ENV === "production" && !!process.env.DATABASE_URL);

    if (useDbStore && process.env.DATABASE_URL) {
        const PostgresStore = connectPg(session);
        sessionStore = new PostgresStore({
            conString: process.env.DATABASE_URL,
            createTableIfMissing: true,
            ttl: sessionTtl / 1000,
            tableName: "sessions",
        });
    } else {
        const MemoryStore = createMemoryStore(session);
        sessionStore = new MemoryStore({
            checkPeriod: sessionTtl,
        });
    }

    app.set("trust proxy", 1);
    app.use(
        session({
            secret: process.env.SESSION_SECRET || "daylora-secret-key",
            resave: false,
            saveUninitialized: false,
            store: sessionStore,
            cookie: {
                maxAge: sessionTtl,
                secure: process.env.NODE_ENV === "production", // false in dev
                sameSite: "lax",
                httpOnly: true,
                domain: process.env.NODE_ENV === "production" ? (process.env.SESSION_COOKIE_DOMAIN || undefined) : undefined,
            },
        })
    );

    app.use(passport.initialize());
    app.use(passport.session());

    passport.use(
        new LocalStrategy({ usernameField: "email" }, async (email, password, done) => {
            try {
                const user = await storage.getUserByEmail(email);
                if (!user || !user.passwordHash) {
                    return done(null, false, { message: "Identifiants invalides." });
                }

                const isValid = await authService.verifyPassword(password, user.passwordHash);
                if (!isValid) {
                    return done(null, false, { message: "Identifiants invalides." });
                }

                return done(null, user);
            } catch (err) {
                return done(err);
            }
        })
    );

    passport.serializeUser((user: any, done) => {
        done(null, user.id);
    });

    passport.deserializeUser(async (id: string, done) => {
        try {
            const user = await storage.getUser(id);
            done(null, user || null);
        } catch (_err) {
            // Avoid crashing auth flow on transient DB errors
            done(null, null);
        }
    });
}

// Middleware to check authentication
export function isAuthenticated(req: Request, res: Response, next: NextFunction) {
    if (req.isAuthenticated()) {
        return next();
    }
    res.status(401).json({ message: "Votre session a expiré. Merci de vous reconnecter." });
}
