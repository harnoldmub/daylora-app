import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import bcrypt from "bcryptjs";
import type { Express, RequestHandler } from "express";

// Admin credentials (hardcoded for this simple use case)
const ADMIN_USERNAME = "AR2026_Admin";
const ADMIN_PASSWORD_HASH = bcrypt.hashSync("Julien&Marie2026", 10);

export function setupLocalAuth(app: Express) {
  // Configure Local Strategy
  passport.use(
    "local",
    new LocalStrategy(
      {
        usernameField: "username",
        passwordField: "password",
      },
      async (username, password, done) => {
        try {
          // Check credentials
          if (username === ADMIN_USERNAME && bcrypt.compareSync(password, ADMIN_PASSWORD_HASH)) {
            // Return a simple admin user object
            return done(null, { 
              id: "admin", 
              username: ADMIN_USERNAME,
              isAdmin: true 
            });
          }
          return done(null, false, { message: "Identifiants incorrects" });
        } catch (error) {
          return done(error);
        }
      }
    )
  );

  // Login route
  app.post("/api/login", (req, res, next) => {
    passport.authenticate("local", (err: any, user: any, info: any) => {
      if (err) {
        return res.status(500).json({ message: "Erreur serveur" });
      }
      if (!user) {
        return res.status(401).json({ message: info?.message || "Identifiants incorrects" });
      }
      
      req.login(user, (loginErr) => {
        if (loginErr) {
          return res.status(500).json({ message: "Erreur de connexion" });
        }
        // Set session cookie expiration to 4 hours
        if (req.session) {
          req.session.cookie.maxAge = 4 * 60 * 60 * 1000; // 4 hours in milliseconds
        }
        return res.json({ success: true, user });
      });
    })(req, res, next);
  });

  // Logout route
  app.post("/api/logout", (req, res) => {
    req.logout((err) => {
      if (err) {
        return res.status(500).json({ message: "Erreur de déconnexion" });
      }
      res.json({ success: true });
    });
  });
}

export const isLocallyAuthenticated: RequestHandler = (req, res, next) => {
  if (req.isAuthenticated() && (req.user as any)?.isAdmin) {
    return next();
  }
  return res.status(401).json({ message: "Votre session a expiré. Merci de vous reconnecter." });
};
