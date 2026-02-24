import { Router } from "express";
import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { storage } from "./storage";

const router = Router();

const APP_BASE_URL = process.env.APP_BASE_URL
  || (process.env.REPLIT_DEV_DOMAIN ? `https://${process.env.REPLIT_DEV_DOMAIN}` : "http://localhost:5000");

const googleCallbackURL = `${APP_BASE_URL}/api/auth/google/callback`;
console.log("[google-oauth] callbackURL:", googleCallbackURL);

if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: googleCallbackURL,
        scope: ["profile", "email"],
      },
      async (_accessToken, _refreshToken, profile, done) => {
        try {
          const googleId = profile.id;
          const email = profile.emails?.[0]?.value?.toLowerCase();
          const firstName = profile.name?.givenName || profile.displayName || "";
          const lastName = profile.name?.familyName || "";
          const profileImageUrl = profile.photos?.[0]?.value || "";

          let user = await storage.getUserByGoogleId(googleId);

          if (user) {
            await storage.updateUser(user.id, { lastLoginAt: new Date() });
            return done(null, user);
          }

          if (email) {
            user = await storage.getUserByEmail(email);
            if (user) {
              await storage.updateUser(user.id, {
                googleId,
                profileImageUrl: user.profileImageUrl || profileImageUrl,
                emailVerifiedAt: user.emailVerifiedAt || new Date(),
                lastLoginAt: new Date(),
              });
              const updated = await storage.getUser(user.id);
              return done(null, updated!);
            }
          }

          if (!email) {
            return done(null, false, { message: "Aucun email associé au compte Google." });
          }

          const newUser = await storage.upsertUser({
            email,
            firstName,
            lastName,
            googleId,
            profileImageUrl,
            emailVerifiedAt: new Date(),
          });

          await storage.updateUser(newUser.id, { lastLoginAt: new Date() });
          return done(null, newUser);
        } catch (err) {
          return done(err as Error);
        }
      }
    )
  );

  router.get(
    "/google",
    passport.authenticate("google", { scope: ["profile", "email"] })
  );

  router.get(
    "/google/callback",
    (req, res, next) => {
      passport.authenticate("google", (err: any, user: any, info: any) => {
        if (err) {
          console.error("[google-oauth] Strategy error:", err.message);
          return res.redirect("/login?error=google");
        }
        if (!user) {
          console.error("[google-oauth] No user returned:", info);
          return res.redirect("/login?error=google");
        }
        req.logIn(user, (loginErr) => {
          if (loginErr) {
            console.error("[google-oauth] Login error:", loginErr.message);
            return res.redirect("/login?error=google");
          }
          return res.redirect("/dashboard");
        });
      })(req, res, next);
    }
  );
}

router.get("/apple/redirect", (_req, res) => {
  const clientId = process.env.APPLE_CLIENT_ID;
  if (!clientId) {
    return res.redirect("/login?error=apple_not_configured");
  }
  const redirectUri = `${APP_BASE_URL}/api/auth/apple/callback`;
  const state = Math.random().toString(36).substring(2);
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code id_token",
    scope: "name email",
    response_mode: "form_post",
    state,
  });
  res.redirect(`https://appleid.apple.com/auth/authorize?${params.toString()}`);
});

router.post("/apple/callback", async (req, res) => {
  try {
    const { id_token, user: appleUserData } = req.body;

    if (!id_token) {
      return res.redirect("/login?error=apple");
    }

    const payload = JSON.parse(
      Buffer.from(id_token.split(".")[1], "base64").toString()
    );

    const appleId = payload.sub;
    const email = payload.email?.toLowerCase();

    let parsedUserData: { name?: { firstName?: string; lastName?: string } } = {};
    if (appleUserData) {
      try {
        parsedUserData = typeof appleUserData === "string" ? JSON.parse(appleUserData) : appleUserData;
      } catch {}
    }

    let user = await storage.getUserByAppleId(appleId);

    if (user) {
      await storage.updateUser(user.id, { lastLoginAt: new Date() });
      req.login(user, (err) => {
        if (err) return res.redirect("/login?error=apple");
        return res.redirect("/dashboard");
      });
      return;
    }

    if (email) {
      user = await storage.getUserByEmail(email);
      if (user) {
        await storage.updateUser(user.id, {
          appleId,
          emailVerifiedAt: user.emailVerifiedAt || new Date(),
          lastLoginAt: new Date(),
        });
        const updated = await storage.getUser(user.id);
        req.login(updated!, (err) => {
          if (err) return res.redirect("/login?error=apple");
          return res.redirect("/dashboard");
        });
        return;
      }
    }

    if (!email) {
      return res.redirect("/login?error=apple_no_email");
    }

    const newUser = await storage.upsertUser({
      email,
      firstName: parsedUserData?.name?.firstName || "",
      lastName: parsedUserData?.name?.lastName || "",
      appleId,
      emailVerifiedAt: new Date(),
    });

    await storage.updateUser(newUser.id, { lastLoginAt: new Date() });

    req.login(newUser, (err) => {
      if (err) return res.redirect("/login?error=apple");
      return res.redirect("/dashboard");
    });
  } catch (error) {
    console.error("Apple OAuth error:", error);
    return res.redirect("/login?error=apple");
  }
});

export default router;
