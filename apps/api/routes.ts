import { type Express } from "express";
import { createServer } from "http";
import { randomUUID } from "node:crypto";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./auth";
import authRoutes from "./auth-routes";
import { validateRequest, withWedding, requireRole } from "./middleware/guards";
import {
  insertRsvpResponseSchema,
  updateRsvpResponseSchema,
  insertContributionSchema,
  insertGiftSchema,
  PLAN_LIMITS,
  type InsertRsvpResponse,
} from "@shared/schema";
import { z } from "zod";
import { sendRsvpConfirmationEmail, sendGuestConfirmationEmail, sendContributionNotification, sendPersonalizedInvitation } from "./email";
import { generateInvitationPDF } from "./invitation-service";
import { liveService } from "./live-service";
import { getStripePublishableKey, getUncachableStripeClient } from "./stripeClient";
import { withWeddingFromRequest } from "./middleware/tenant";

const DEFAULT_WEDDING_CONFIG = {
  theme: {
    primaryColor: "#D4AF37",
    secondaryColor: "#FFFFFF",
    fontFamily: "serif",
    toneId: "golden-ivory",
    buttonStyle: "solid",
    buttonRadius: "pill",
  },
  seo: { title: "Notre Mariage", description: "Rejoignez-nous pour célébrer notre union" },
  features: { jokesEnabled: true, giftsEnabled: true, cagnotteEnabled: true, liveEnabled: true },
  payments: {
    mode: "stripe",
    externalProvider: "other",
    externalUrl: "",
    stripeStatus: "not_connected",
    stripeAccountId: "",
    allowManualLiveContributions: true,
  },
  texts: {
    siteTitle: "",
    heroTitle: "",
    heroSubtitle: "Le Mariage de",
    weddingDate: "",
    heroCta: "Confirmer votre présence",
    rsvpTitle: "CONFIRMEZ VOTRE PRÉSENCE",
    rsvpDescription: "Nous serions ravis de vous compter parmi nous",
    rsvpButton: "Je confirme ma présence",
    navRsvp: "RSVP",
    navCagnotte: "Cagnotte",
    navLive: "Live",
    locationTitle: "LIEU & ACCÈS",
    locationDescription: "Toutes les informations pour nous rejoindre",
    programTitle: "DÉROULEMENT",
    programDescription: "Le programme de notre journée",
    storyTitle: "NOTRE HISTOIRE",
    storyBody: "",
    cagnotteTitle: "CAGNOTTE MARIAGE",
    cagnotteDescription: "Votre présence est notre plus beau cadeau. Si vous souhaitez contribuer à notre voyage de noces ou à notre nouveau départ, vous pouvez participer à notre cagnotte.",
    cagnotteBackLabel: "Retour",
    cagnotteSubmitLabel: "Contribuer",
    invitationTitle: "Invitation",
    invitationSubtitle: "Vous êtes invité(e) à célébrer avec nous",
    invitationBody: "Retrouvez ici toutes les informations utiles pour le jour J.",
    invitationCtaRsvp: "Répondre au RSVP",
    invitationCtaCagnotte: "Accéder à la cagnotte",
    footerTitle: "On a hâte de vous voir",
    footerSubtitle: "Merci de faire partie de cette aventure.",
    footerEmail: "",
    footerPhone: "",
    footerAddress: "",
    footerCopyright: "© 2026. Tous droits réservés.",
    liveTitle: "CAGNOTTE EN DIRECT",
    liveSubtitle: "Merci pour votre générosité",
    liveDonorsTitle: "NOS GÉNÉREUX DONATEURS",
    liveQrCaption: "Scannez pour contribuer",
    galleryTitle: "GALERIE",
    galleryDescription: "Quelques instants capturés avant le grand jour.",
    giftsTitle: "LISTE DE CADEAUX",
    giftsDescription: "Quelques idées pour ceux qui souhaitent nous faire plaisir.",
  },
  media: {
    heroImage: "",
    couplePhoto: "",
    invitationImage: "",
  },
  branding: {
    logoUrl: "",
    logoText: "",
  },
  sections: {
    countdownDate: "",
    cagnotteSuggestedAmounts: [20, 50, 100, 150, 200],
    cagnotteExternalUrl: "",
    invitationShowLocations: true,
    invitationShowCountdown: true,
    // Small, local placeholders (editable later). Keep these lightweight to avoid huge default rows.
    galleryImages: [
      "/defaults/gallery/01.jpg",
      "/defaults/gallery/02.jpg",
      "/defaults/gallery/03.jpg",
      "/defaults/gallery/04.jpg",
      "/defaults/gallery/05.jpg",
      "/defaults/gallery/06.jpg",
    ],
    locationItems: [
      {
        title: "Cérémonie civile",
        address: "Mairie de Lille — 10 Rue Pierre Mauroy",
        description: "Rendez-vous à 14h30 pour accueillir les invités."
      },
      {
        title: "Réception",
        address: "Château de la Verrière — Salle des Roses",
        description: "Cocktail et dîner à partir de 18h."
      }
    ],
    programItems: [
      {
        time: "14:30",
        title: "Accueil des invités",
        description: "Installation et photos de famille."
      },
      {
        time: "15:00",
        title: "Cérémonie",
        description: "Échange des vœux et sortie des mariés."
      },
      {
        time: "18:30",
        title: "Cocktail & Dîner",
        description: "Apéritif, repas et animations."
      }
    ],
  },
  navigation: {
    pages: {
      rsvp: true,
      cagnotte: true,
      gifts: true,
      live: true,
      story: true,
      gallery: true,
      location: true,
      program: true,
    },
    heroCtaPath: "rsvp",
    menuItems: [
      { id: "home", label: "Accueil", path: "home", enabled: true, linkType: "anchor", anchorId: "hero", externalUrl: "" },
      { id: "rsvp", label: "RSVP", path: "rsvp", enabled: true, linkType: "anchor", anchorId: "rsvp", externalUrl: "" },
      { id: "gifts", label: "Cadeaux", path: "gifts", enabled: true, linkType: "anchor", anchorId: "gifts", externalUrl: "" },
      { id: "story", label: "Histoire", path: "story", enabled: true, linkType: "anchor", anchorId: "story", externalUrl: "" },
      { id: "gallery", label: "Photos", path: "gallery", enabled: true, linkType: "anchor", anchorId: "gallery", externalUrl: "" },
      { id: "location", label: "Lieux", path: "location", enabled: true, linkType: "anchor", anchorId: "location", externalUrl: "" },
      { id: "program", label: "Programme", path: "program", enabled: true, linkType: "anchor", anchorId: "program", externalUrl: "" },
      { id: "cagnotte", label: "Cagnotte", path: "cagnotte", enabled: true, linkType: "anchor", anchorId: "cagnotte", externalUrl: "" },
    ],
    customPages: [],
  },
};

const WEDDING_TEMPLATES = {
  classic: {
    theme: {
      primaryColor: "#C8A96A",
      secondaryColor: "#FFFDF9",
      fontFamily: "serif",
      toneId: "golden-ivory",
      buttonStyle: "solid",
      buttonRadius: "pill",
    },
  },
  modern: {
    theme: {
      primaryColor: "#1F4AA2",
      secondaryColor: "#F4F8FF",
      fontFamily: "sans",
      toneId: "ocean-pearl",
      buttonStyle: "solid",
      buttonRadius: "rounded",
    },
  },
  minimal: {
    theme: {
      primaryColor: "#1F2937",
      secondaryColor: "#F8FAFC",
      fontFamily: "sans",
      toneId: "custom",
      buttonStyle: "outline",
      buttonRadius: "square",
    },
  },
} as const;

const COLOR_TONES = {
  "golden-ivory": { id: "golden-ivory", primaryColor: "#C8A96A", secondaryColor: "#FFFDF9" },
  "rose-sunset": { id: "rose-sunset", primaryColor: "#D16A7D", secondaryColor: "#FFF3F6" },
  "sage-olive": { id: "sage-olive", primaryColor: "#5A7A65", secondaryColor: "#F2F7F1" },
  "ocean-pearl": { id: "ocean-pearl", primaryColor: "#1F4AA2", secondaryColor: "#F2F6FF" },
} as const;

type ColorToneId = keyof typeof COLOR_TONES;

function resolveTone(toneId?: string) {
  if (!toneId) return COLOR_TONES["golden-ivory"];
  return COLOR_TONES[toneId as ColorToneId] || COLOR_TONES["golden-ivory"];
}

function applyTemplateConfig(templateId: string, currentConfig: any) {
  const template = WEDDING_TEMPLATES[templateId as keyof typeof WEDDING_TEMPLATES];
  if (!template) return currentConfig;
  const currentTheme = currentConfig?.theme || {};
  const forceTemplateTheme = {
    ...DEFAULT_WEDDING_CONFIG.theme,
    ...currentTheme,
    ...template.theme,
    // Force template identity when user explicitly changes template.
    toneId: template.theme.toneId || currentTheme.toneId || DEFAULT_WEDDING_CONFIG.theme.toneId,
    primaryColor: template.theme.primaryColor,
    secondaryColor: template.theme.secondaryColor,
    fontFamily: template.theme.fontFamily,
    buttonStyle: template.theme.buttonStyle,
    buttonRadius: template.theme.buttonRadius,
  };
  return {
    ...DEFAULT_WEDDING_CONFIG,
    ...currentConfig,
    theme: forceTemplateTheme,
  };
}

export async function registerRoutes(app: Express) {
  setupAuth(app);
  app.use("/api/auth", authRoutes);

  const isDevEnv = process.env.NODE_ENV !== "production";
  const signupWithWeddingLimiter = (await import("express-rate-limit")).default({ windowMs: 60 * 1000, max: isDevEnv ? 100 : 5, message: "Trop de tentatives. Réessayez dans une minute." });
  const { authService } = await import("./auth-service");
  const { authEmails } = await import("./auth-emails");

  app.post("/api/auth/signup-with-wedding", signupWithWeddingLimiter, async (req, res) => {
    try {
      const { email, password, firstName, title, slug, weddingDate, templateId, storyBody, toneId, features, paymentMode, externalCagnotteUrl, externalProvider, heroImage, couplePhoto, galleryImages, plan } = req.body || {};

      if (!email || !password || !firstName) return res.status(400).json({ message: "Email, mot de passe et prénom requis." });
      if (!title || !slug) return res.status(400).json({ message: "Titre et URL du site requis." });
      if (password.length < 8) return res.status(400).json({ message: "Le mot de passe doit contenir au moins 8 caractères." });
      if (paymentMode === "external" && features?.cagnotteEnabled && !externalCagnotteUrl?.trim()) {
        return res.status(400).json({ message: "Ajoutez un lien de cagnotte externe." });
      }

      const existing = await storage.getUserByEmail(email);
      if (existing) return res.status(400).json({ message: "Cet email est déjà utilisé." });

      const existingSlug = await storage.getWeddingBySlug(slug);
      if (existingSlug) return res.status(400).json({ message: "Cette URL est déjà prise. Choisissez-en une autre." });

      const isHugeDataUrl = (value: unknown, limit: number) =>
        typeof value === "string" && value.startsWith("data:image/") && value.length > limit;
      if (isHugeDataUrl(heroImage, 3_000_000) || isHugeDataUrl(couplePhoto, 3_000_000)) {
        return res.status(413).json({ message: "Image trop volumineuse." });
      }
      if (Array.isArray(galleryImages)) {
        if (galleryImages.length > 10) return res.status(400).json({ message: "Maximum 10 photos." });
        if (galleryImages.some((img: any) => isHugeDataUrl(img, 1_200_000))) return res.status(413).json({ message: "Une photo est trop volumineuse." });
      }

      const passwordHash = await authService.hashPassword(password);
      const user = await storage.upsertUser({
        email: email.toLowerCase(),
        passwordHash,
        firstName,
        isAdmin: false,
      });

      const { rawToken, hashedToken } = authService.generateToken();
      await storage.createEmailVerificationToken({
        userId: user.id,
        tokenHash: hashedToken,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      });

      try {
        await authEmails.sendVerificationEmail(user.email, user.firstName || "Inconnu", rawToken);
      } catch (mailError) {
        console.error("Verification email sending failed:", mailError);
      }

      const config = applyTemplateConfig(templateId || "classic", DEFAULT_WEDDING_CONFIG);
      const tone = resolveTone(toneId);
      const mergedConfig = {
        ...config,
        theme: { ...config.theme, toneId: tone.id, primaryColor: tone.primaryColor, secondaryColor: tone.secondaryColor },
        features: { ...config.features, ...(features || {}) },
        payments: {
          ...config.payments,
          mode: paymentMode === "external" ? "external" : "stripe",
          externalProvider: externalProvider || config.payments.externalProvider || "other",
          externalUrl: externalCagnotteUrl || config.payments.externalUrl || "",
          stripeStatus: paymentMode === "external" ? "not_connected" : (config.payments.stripeStatus || "not_connected"),
        },
        media: { ...config.media, heroImage: heroImage || config.media.heroImage, couplePhoto: couplePhoto || config.media.couplePhoto },
        texts: {
          ...config.texts,
          siteTitle: title || config.texts.siteTitle || "",
          heroTitle: title || config.texts.heroTitle || "",
          heroSubtitle: config.texts.heroSubtitle || "Le Mariage de",
          weddingDate: weddingDate || config.texts.weddingDate || "",
          storyBody: storyBody || config.texts.storyBody || "",
        },
        sections: {
          ...config.sections,
          cagnotteExternalUrl: externalCagnotteUrl || config.sections.cagnotteExternalUrl || "",
          galleryImages: (Array.isArray(galleryImages) && galleryImages.length > 0) ? galleryImages : config.sections.galleryImages,
          countdownDate: weddingDate || config.sections.countdownDate || "",
        },
        navigation: {
          ...config.navigation,
          pages: {
            ...config.navigation.pages,
            cagnotte: features?.cagnotteEnabled ?? config.navigation.pages.cagnotte,
            gifts: features?.giftsEnabled ?? (config.navigation.pages as any).gifts,
            live: features?.liveEnabled ?? config.navigation.pages.live,
          },
          menuItems: (config.navigation.menuItems || []).map((item: any) => {
            if (item.id === "cagnotte") return { ...item, enabled: features?.cagnotteEnabled ?? item.enabled };
            if (item.id === "gifts") return { ...item, enabled: features?.giftsEnabled ?? item.enabled };
            if (item.id === "live") return { ...item, enabled: features?.liveEnabled ?? item.enabled };
            return item;
          }),
        },
      };

      let wedding;
      try {
        wedding = await storage.createWedding({
          ownerId: user.id,
          title,
          slug,
          templateId: templateId || "classic",
          weddingDate: weddingDate ? new Date(weddingDate) : null,
          currentPlan: plan === "premium" || plan === "lifetime" ? "premium" : "free",
          config: mergedConfig,
          status: "draft",
        });
      } catch (weddingError) {
        console.error("Wedding creation failed after user creation, cleaning up user:", weddingError);
        try { await storage.deleteUser(user.id); } catch (_) {}
        return res.status(500).json({ message: "Erreur lors de la création du site. Réessayez." });
      }

      const isDev = process.env.NODE_ENV !== "production";
      res.status(201).json({
        message: "Compte créé et site généré ! Vérifiez vos emails pour activer votre compte.",
        user: { id: user.id, email: user.email },
        wedding: { id: wedding.id, slug: wedding.slug },
        debugVerifyToken: isDev ? rawToken : undefined,
      });
    } catch (error) {
      console.error("Signup with wedding error:", error);
      res.status(500).json({ message: "Erreur lors de la création. Réessayez." });
    }
  });

  const liveJokeInputSchema = z.object({
    content: z.string().min(1),
    tone: z.string().optional(),
    frequency: z.number().int().optional(),
    category: z.string().optional(),
    isActive: z.boolean().optional(),
  });

  // Public: publishable key
  app.get("/api/stripe/publishable-key", async (_req, res) => {
    try {
      const key = await getStripePublishableKey();
      res.json({ key });
    } catch (error) {
      res.status(500).json({ message: "Stripe key not available" });
    }
  });

  // Stripe Connect OAuth
  app.get("/api/stripe/connect/start", isAuthenticated, withWedding, requireRole(["owner", "admin"]), async (req, res) => {
    try {
      const wedding = (req as any).wedding;
      const user = (req as any).user;
      const clientId = process.env.STRIPE_CONNECT_CLIENT_ID;
      if (!clientId) {
        return res.status(500).json({ message: "STRIPE_CONNECT_CLIENT_ID manquant" });
      }

      const appBase = process.env.APP_BASE_URL || "http://localhost:5174";
      const redirectUri = `${appBase}/api/stripe/connect/callback`;
      const state = randomUUID();

      (req as any).session.stripeConnectState = {
        state,
        weddingId: wedding.id,
        userId: user.id,
        createdAt: Date.now(),
      };

      const qs = new URLSearchParams({
        response_type: "code",
        client_id: clientId,
        scope: "read_write",
        redirect_uri: redirectUri,
        state,
      });

      res.redirect(`https://connect.stripe.com/oauth/authorize?${qs.toString()}`);
    } catch {
      res.status(500).json({ message: "Impossible de démarrer Stripe Connect" });
    }
  });

  app.get("/api/stripe/connect/callback", isAuthenticated, async (req, res) => {
    const appBase = process.env.APP_BASE_URL || "http://localhost:5174";
    const redirectTo = (weddingId?: string, params?: string) =>
      `${appBase}/${weddingId || ""}/settings${params ? `?${params}` : ""}`;

    try {
      const code = req.query.code as string | undefined;
      const state = req.query.state as string | undefined;
      const oauthError = req.query.error as string | undefined;
      const user = (req as any).user;
      const sessionState = (req as any).session?.stripeConnectState as
        | { state: string; weddingId: string; userId: string; createdAt: number }
        | undefined;

      if (!sessionState) {
        return res.redirect(`${appBase}/login`);
      }

      const { weddingId } = sessionState;
      if (oauthError) {
        return res.redirect(redirectTo(weddingId, "stripe=error"));
      }

      if (!code || !state || sessionState.state !== state || sessionState.userId !== user.id) {
        return res.redirect(redirectTo(weddingId, "stripe=invalid_state"));
      }

      if (Date.now() - sessionState.createdAt > 10 * 60 * 1000) {
        return res.redirect(redirectTo(weddingId, "stripe=expired"));
      }

      const wedding = await storage.getWedding(weddingId);
      if (!wedding) {
        return res.redirect(`${appBase}/app`);
      }
      const membership = await storage.getMembershipByUserAndWedding(user.id, wedding.id);
      if (!user.isAdmin && wedding.ownerId !== user.id && !membership) {
        return res.redirect(`${appBase}/app`);
      }

      const stripe = await getUncachableStripeClient();
      const tokenResp = await stripe.oauth.token({
        grant_type: "authorization_code",
        code,
      });

      const stripeAccountId = tokenResp.stripe_user_id;
      const nextConfig = {
        ...(wedding.config || {}),
        payments: {
          ...(wedding.config?.payments || {}),
          mode: "stripe",
          stripeStatus: "connected",
          stripeAccountId,
        },
      } as any;

      await storage.updateWedding(wedding.id, { config: nextConfig });
      (req as any).session.stripeConnectState = null;
      return res.redirect(redirectTo(wedding.id, "stripe=connected"));
    } catch {
      const sessionState = (req as any).session?.stripeConnectState as { weddingId?: string } | undefined;
      return res.redirect(redirectTo(sessionState?.weddingId, "stripe=error"));
    }
  });

  app.post("/api/stripe/connect/disconnect", isAuthenticated, withWedding, requireRole(["owner", "admin"]), async (req, res) => {
    try {
      const wedding = (req as any).wedding;
      const nextConfig = {
        ...(wedding.config || {}),
        payments: {
          ...(wedding.config?.payments || {}),
          stripeStatus: "not_connected",
          stripeAccountId: "",
        },
      } as any;
      const updated = await storage.updateWedding(wedding.id, { config: nextConfig });
      res.json({ success: true, wedding: updated });
    } catch {
      res.status(500).json({ message: "Impossible de déconnecter Stripe" });
    }
  });

  // Wedding context / CRUD
  app.get("/api/weddings", withWeddingFromRequest, async (req, res) => {
    const wedding = (req as any).wedding;
    if (!wedding) return res.status(404).json({ message: "Mariage introuvable" });
    res.json(wedding);
  });

  app.get("/api/weddings/list", isAuthenticated, async (req, res) => {
    const user = (req as any).user;
    const weddings = await storage.getWeddingsForUser(user.id);
    res.json(weddings);
  });

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
      const {
        title,
        slug,
        templateId,
        toneId,
        weddingDate,
        currentPlan,
        features,
        paymentMode,
        externalCagnotteUrl,
        externalProvider,
        heroImage,
        couplePhoto,
        galleryImages,
        storyBody
      } = req.body || {};

      if (!title || !slug) return res.status(400).json({ message: "Titre et slug requis" });
      const existing = await storage.getWeddingBySlug(slug);
      if (existing) return res.status(400).json({ message: "Slug déjà utilisé" });

      // Guardrail: don't allow huge base64 blobs in config
      const isHugeDataUrl = (value: unknown, limit: number) =>
        typeof value === "string" && value.startsWith("data:image/") && value.length > limit;

      if (isHugeDataUrl(heroImage, 3_000_000) || isHugeDataUrl(couplePhoto, 3_000_000)) {
        return res.status(413).json({ message: "Image trop volumineuse. Importez une image plus légère." });
      }
      if (Array.isArray(galleryImages)) {
        if (galleryImages.length > 10) {
          return res.status(400).json({ message: "Maximum 10 photos dans la galerie." });
        }
        if (galleryImages.some((img) => isHugeDataUrl(img, 1_200_000))) {
          return res.status(413).json({ message: "Une photo de la galerie est trop volumineuse. Importez une image plus légère." });
        }
      }

      const config = applyTemplateConfig(templateId || "classic", DEFAULT_WEDDING_CONFIG);
      const tone = resolveTone(toneId);
      const mergedConfig = {
        ...config,
        theme: {
          ...config.theme,
          toneId: tone.id,
          primaryColor: tone.primaryColor,
          secondaryColor: tone.secondaryColor,
        },
        features: {
          ...config.features,
          ...(features || {}),
        },
        payments: {
          ...config.payments,
          mode: paymentMode === "external" ? "external" : "stripe",
          externalProvider: externalProvider || config.payments.externalProvider || "other",
          externalUrl: externalCagnotteUrl || config.payments.externalUrl || "",
          stripeStatus: paymentMode === "external" ? "not_connected" : (config.payments.stripeStatus || "not_connected"),
        },
        media: {
          ...config.media,
          heroImage: heroImage || config.media.heroImage,
          couplePhoto: couplePhoto || config.media.couplePhoto,
        },
        texts: {
          ...config.texts,
          storyBody: storyBody || config.texts.storyBody,
        },
        sections: {
          ...config.sections,
          cagnotteExternalUrl: externalCagnotteUrl || config.sections.cagnotteExternalUrl || "",
          galleryImages: galleryImages || config.sections.galleryImages,
        },
        navigation: {
          ...config.navigation,
          pages: {
            ...config.navigation.pages,
            cagnotte: features?.cagnotteEnabled ?? config.navigation.pages.cagnotte,
            gifts: features?.giftsEnabled ?? (config.navigation.pages as any).gifts,
            live: features?.liveEnabled ?? config.navigation.pages.live,
          },
          menuItems: (config.navigation.menuItems || []).map((item: any) => {
            if (item.id === "cagnotte") {
              return { ...item, enabled: features?.cagnotteEnabled ?? item.enabled };
            }
            if (item.id === "gifts") {
              return { ...item, enabled: features?.giftsEnabled ?? item.enabled };
            }
            if (item.id === "live") {
              return { ...item, enabled: features?.liveEnabled ?? item.enabled };
            }
            return item;
          }),
        },
      };

      const wedding = await storage.createWedding({
        ownerId: user.id,
        title,
        slug,
        templateId: templateId || "classic",
        weddingDate: weddingDate ? new Date(weddingDate) : null,
        currentPlan: currentPlan === "premium" ? "premium" : "free",
        config: mergedConfig,
        status: "draft",
      });
      res.status(201).json(wedding);
    } catch (error) {
      res.status(500).json({ message: "Erreur création mariage" });
    }
  });

  app.patch("/api/weddings/:id", isAuthenticated, async (req, res) => {
    try {
      const { id } = req.params;
      const wedding = await storage.getWedding(id);
      if (!wedding) return res.status(404).json({ message: "Mariage introuvable" });
      const user = (req as any).user;
      if (!user.isAdmin) {
        const membership = await storage.getMembershipByUserAndWedding(user.id, wedding.id);
        if (wedding.ownerId !== user.id && !membership) {
          return res.status(403).json({ message: "Accès refusé" });
        }
      }

      const updates = req.body || {};

      // Guardrail: don't allow huge base64 blobs in config (prevents 413 and keeps DB sane).
      const isHugeDataUrl = (value: unknown, limit: number) =>
        typeof value === "string" && value.startsWith("data:image/") && value.length > limit;
      if (updates?.config) {
        const logoUrl = updates.config?.branding?.logoUrl;
        const heroImage = updates.config?.media?.heroImage;
        const couplePhoto = updates.config?.media?.couplePhoto;
        const invitationImage = updates.config?.media?.invitationImage;
        const galleryImages = updates.config?.sections?.galleryImages;

        if (isHugeDataUrl(logoUrl, 220_000)) {
          return res.status(413).json({ message: "Logo trop volumineux. Importez une image plus légère." });
        }
        if (isHugeDataUrl(heroImage, 3_000_000) || isHugeDataUrl(couplePhoto, 3_000_000) || isHugeDataUrl(invitationImage, 2_000_000)) {
          return res.status(413).json({ message: "Image trop volumineuse. Importez une image plus légère." });
        }
        if (Array.isArray(galleryImages)) {
          if (galleryImages.length > 10) {
            return res.status(400).json({ message: "Maximum 10 photos dans la galerie." });
          }
          if (galleryImages.some((img) => isHugeDataUrl(img, 1_200_000))) {
            return res.status(413).json({ message: "Une photo de la galerie est trop volumineuse. Importez une image plus légère." });
          }
        }
      }
      if (updates.slug && updates.slug !== wedding.slug) {
        const existing = await storage.getWeddingBySlug(updates.slug);
        if (existing) {
          return res.status(400).json({ message: "Slug déjà utilisé" });
        }
      }

      if (updates.config && typeof updates.config === "object") {
        const incomingConfig = updates.config;
        updates.config = {
          ...wedding.config,
          ...incomingConfig,
          seo: {
            ...(wedding.config?.seo || {}),
            ...(incomingConfig?.seo || {}),
          },
          theme: {
            ...(wedding.config?.theme || {}),
            ...(incomingConfig?.theme || {}),
          },
          texts: {
            ...(wedding.config?.texts || {}),
            ...(incomingConfig?.texts || {}),
          },
          media: {
            ...(wedding.config?.media || {}),
            ...(incomingConfig?.media || {}),
          },
          branding: {
            ...(wedding.config?.branding || {}),
            ...(incomingConfig?.branding || {}),
          },
          features: {
            ...(wedding.config?.features || {}),
            ...(incomingConfig?.features || {}),
          },
          payments: {
            ...(wedding.config?.payments || {}),
            ...(incomingConfig?.payments || {}),
          },
          sections: {
            ...(wedding.config?.sections || {}),
            ...(incomingConfig?.sections || {}),
            locationItems:
              incomingConfig?.sections?.locationItems ??
              wedding.config?.sections?.locationItems ??
              DEFAULT_WEDDING_CONFIG.sections.locationItems,
            programItems:
              incomingConfig?.sections?.programItems ??
              wedding.config?.sections?.programItems ??
              DEFAULT_WEDDING_CONFIG.sections.programItems,
            cagnotteSuggestedAmounts:
              incomingConfig?.sections?.cagnotteSuggestedAmounts ??
              wedding.config?.sections?.cagnotteSuggestedAmounts ??
              DEFAULT_WEDDING_CONFIG.sections.cagnotteSuggestedAmounts,
          },
          navigation: {
            ...(wedding.config?.navigation || {}),
            ...(incomingConfig?.navigation || {}),
            pages: {
              ...(wedding.config?.navigation?.pages || {}),
              ...(incomingConfig?.navigation?.pages || {}),
            },
            menuItems:
              incomingConfig?.navigation?.menuItems ??
              wedding.config?.navigation?.menuItems ??
              DEFAULT_WEDDING_CONFIG.navigation.menuItems,
            customPages:
              incomingConfig?.navigation?.customPages ??
              wedding.config?.navigation?.customPages ??
              DEFAULT_WEDDING_CONFIG.navigation.customPages,
          },
        };
      }

      if (updates.templateId) {
        const baseConfig = updates.config || wedding.config;
        updates.config = applyTemplateConfig(updates.templateId, baseConfig);
      }

      const updated = await storage.updateWedding(id, updates);
      res.json(updated);
    } catch (error) {
      res.status(500).json({ message: "Erreur mise à jour" });
    }
  });

  // RSVP
  app.post("/api/rsvp", withWedding, validateRequest(insertRsvpResponseSchema), async (req, res) => {
    try {
      const wedding = (req as any).wedding;
      const plan = wedding.currentPlan === "premium" ? "premium" : "free";
      const limits = PLAN_LIMITS[plan];
      const currentCount = await storage.getRsvpCount(wedding.id);
      const data = req.body as InsertRsvpResponse;
      const incoming = data.partySize || 1;
      if (currentCount + incoming > limits.maxRsvp) {
        return res.status(402).json({ message: `La limite de ${limits.maxRsvp} invités est atteinte. Passez au Premium pour accueillir tous vos invités.` });
      }
      const response = await storage.createRsvpResponse(wedding.id, data);

      if (response.email) {
        sendGuestConfirmationEmail(wedding, {
          email: response.email,
          firstName: response.firstName,
          lastName: response.lastName,
          availability: response.availability,
        }).catch(() => null);
      }
      sendRsvpConfirmationEmail(wedding, {
        firstName: response.firstName,
        lastName: response.lastName,
        availability: response.availability,
      }).catch(() => null);

      res.json(response);
    } catch (error) {
      res.status(400).json({ message: "Invalid request data" });
    }
  });

  app.get("/api/rsvp", isAuthenticated, withWedding, requireRole(["owner", "admin", "editor", "viewer"]), async (req, res) => {
    try {
      const wedding = (req as any).wedding;
      const responses = await storage.getAllRsvpResponses(wedding.id);
      res.json(responses);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch RSVPs" });
    }
  });

  app.get("/api/guests", isAuthenticated, withWedding, async (req, res) => {
    const wedding = (req as any).wedding;
    const responses = await storage.getAllRsvpResponses(wedding.id);
    res.json(responses);
  });

  app.put("/api/rsvp/:id", isAuthenticated, withWedding, validateRequest(updateRsvpResponseSchema), async (req, res) => {
    try {
      const wedding = (req as any).wedding;
      const id = parseInt(req.params.id);
      const response = await storage.updateRsvpResponse(wedding.id, id, req.body);
      res.json(response);
    } catch (error) {
      res.status(400).json({ message: "Invalid request data" });
    }
  });

  app.patch("/api/rsvp/:id", isAuthenticated, withWedding, async (req, res) => {
    try {
      const wedding = (req as any).wedding;
      const id = parseInt(req.params.id);
      const response = await storage.updateRsvpResponse(wedding.id, id, req.body);
      res.json(response);
    } catch (error) {
      res.status(500).json({ message: "Failed to update RSVP" });
    }
  });

  app.delete("/api/rsvp/:id", isAuthenticated, withWedding, async (req, res) => {
    try {
      const wedding = (req as any).wedding;
      const id = parseInt(req.params.id);
      await storage.deleteRsvpResponse(wedding.id, id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete RSVP" });
    }
  });

  app.post("/api/rsvp/bulk", isAuthenticated, withWedding, async (req, res) => {
    try {
      const wedding = (req as any).wedding;
      const guests = req.body;
      if (!Array.isArray(guests)) return res.status(400).json({ message: "Input must be an array" });
      const results = { success: 0, failed: 0, errors: [] as string[] };

      for (const guest of guests) {
        try {
          await storage.createRsvpResponse(wedding.id, guest);
          results.success++;
        } catch (error: any) {
          results.failed++;
          results.errors.push(`${guest.firstName} ${guest.lastName}: ${error.message}`);
        }
      }
      res.json(results);
    } catch (error) {
      res.status(500).json({ message: "Failed to process bulk import" });
    }
  });

  // Guests / Invitations
  app.get("/api/guests/:id", async (req, res) => {
    const id = parseInt(req.params.id);
    const guest = await storage.getRsvpResponseById(id);
    if (!guest) return res.status(404).json({ message: "Invitation non trouvée" });
    res.json(guest);
  });

  app.get("/api/invitation/guest/:token", async (req, res) => {
    const token = req.params.token;
    const guest = await storage.getRsvpResponseByPublicToken(token);
    if (!guest) return res.status(404).json({ message: "Invitation non trouvée" });
    res.json(guest);
  });

  // Public PDF download (token-based, non-guessable)
  app.get("/api/invitation/pdf/:token", async (req, res) => {
    try {
      const token = req.params.token;
      const guest = await storage.getRsvpResponseByPublicToken(token);
      if (!guest) return res.status(404).json({ message: "Invitation non trouvée" });

      const pdfBuffer = await generateInvitationPDF({
        id: guest.id,
        firstName: guest.firstName,
        lastName: guest.lastName,
        tableNumber: guest.tableNumber,
      });

      res.setHeader("Content-Type", "application/pdf");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="invitation-${guest.firstName}-${guest.lastName}.pdf"`
      );
      res.send(pdfBuffer);
    } catch (_error) {
      res.status(500).json({ message: "Impossible de générer le PDF" });
    }
  });

  app.post("/api/invitation/generate/:id", isAuthenticated, withWedding, async (req, res) => {
    try {
      const wedding = (req as any).wedding;
      const id = parseInt(req.params.id);
      const response = await storage.getRsvpResponse(wedding.id, id);
      if (!response) return res.status(404).json({ message: "Guest not found" });
      const pdfBuffer = await generateInvitationPDF({
        id: response.id,
        firstName: response.firstName,
        lastName: response.lastName,
        tableNumber: response.tableNumber,
      });
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", `inline; filename=\"invitation-${response.firstName}-${response.lastName}.pdf\"`);
      res.send(pdfBuffer);
    } catch (error) {
      res.status(500).json({ message: "Failed to generate invitation" });
    }
  });

  app.post("/api/send-invitation", isAuthenticated, withWedding, async (req, res) => {
    try {
      const wedding = (req as any).wedding;
      const { email, firstName, lastName, message, publicToken } = req.body;
      if (!email || !firstName || !lastName) {
        return res.status(400).json({ message: "Email, prénom et nom requis" });
      }
      await sendPersonalizedInvitation(wedding, { email, firstName, lastName, message, publicToken });
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Échec de l'envoi de l'invitation" });
    }
  });

  // Check-in
  app.get("/api/checkin", async (req, res) => {
    const token = req.query.token as string;
    if (!token) return res.status(400).json({ message: "Token manquant" });
    const guest = await storage.getRsvpResponseByPublicToken(token);
    if (!guest) return res.status(404).json({ message: "Guest not found" });
    res.json({
      ...guest,
      groupType: guest.partySize > 1 ? "couple" : "solo",
    });
  });

  app.post("/api/checkin/:id", async (req, res) => {
    const id = parseInt(req.params.id);
    const guest = await storage.getRsvpResponseById(id);
    if (!guest) return res.status(404).json({ message: "Guest not found" });
    const updated = await storage.updateRsvpResponse(guest.weddingId, id, { checkedInAt: new Date() });
    res.json(updated);
  });

  // Gifts
  app.get("/api/gifts", isAuthenticated, withWedding, async (req, res) => {
    const wedding = (req as any).wedding;
    const gifts = await storage.getGifts(wedding.id);
    res.json(gifts);
  });

  // Public gifts list (one-page public site)
  app.get("/api/gifts/public", withWedding, async (req, res) => {
    const wedding = (req as any).wedding;
    const gifts = await storage.getGifts(wedding.id);
    res.json(gifts);
  });

  app.post("/api/gifts", isAuthenticated, withWedding, validateRequest(insertGiftSchema), async (req, res) => {
    const wedding = (req as any).wedding;
    const imageUrl = req.body?.imageUrl;
    if (typeof imageUrl === "string" && imageUrl.startsWith("data:image/") && imageUrl.length > 900_000) {
      return res.status(413).json({ message: "Image trop volumineuse. Importez une image plus légère." });
    }
    const gift = await storage.createGift(wedding.id, req.body);
    res.json(gift);
  });

  app.patch("/api/gifts/:id", isAuthenticated, withWedding, async (req, res) => {
    const wedding = (req as any).wedding;
    const id = parseInt(req.params.id, 10);
    const imageUrl = req.body?.imageUrl;
    if (typeof imageUrl === "string" && imageUrl.startsWith("data:image/") && imageUrl.length > 900_000) {
      return res.status(413).json({ message: "Image trop volumineuse. Importez une image plus légère." });
    }
    const gift = await storage.updateGift(wedding.id, id, req.body);
    res.json(gift);
  });

  app.delete("/api/gifts/:id", isAuthenticated, withWedding, async (req, res) => {
    const wedding = (req as any).wedding;
    const id = parseInt(req.params.id, 10);
    await storage.deleteGift(wedding.id, id);
    res.json({ success: true });
  });

  app.post("/api/gifts/:id/reserve", withWedding, async (req, res) => {
    const wedding = (req as any).wedding;
    const id = parseInt(req.params.id, 10);
    const { guestName } = req.body || {};
    if (!guestName || typeof guestName !== "string" || guestName.trim().length === 0) {
      return res.status(400).json({ message: "Le nom de l'invité est requis." });
    }
    const allGifts = await storage.getGifts(wedding.id);
    const gift = allGifts.find((g) => g.id === id);
    if (!gift) return res.status(404).json({ message: "Cadeau non trouvé." });
    if (gift.isReserved) return res.status(409).json({ message: "Ce cadeau est déjà réservé." });
    const updated = await storage.updateGift(wedding.id, id, {
      isReserved: true,
      reservedBy: guestName.trim(),
    });
    res.json(updated);
  });

  app.post("/api/gifts/:id/unreserve", isAuthenticated, withWedding, async (req, res) => {
    const wedding = (req as any).wedding;
    const id = parseInt(req.params.id, 10);
    const updated = await storage.updateGift(wedding.id, id, {
      isReserved: false,
      reservedBy: null,
    });
    res.json(updated);
  });

  // Contributions
  app.get("/api/contributions", isAuthenticated, withWedding, async (req, res) => {
    const wedding = (req as any).wedding;
    const contributions = await storage.getCompletedContributions(wedding.id);
    res.json(contributions);
  });

  app.get("/api/contributions/confirmed", withWedding, async (req, res) => {
    const wedding = (req as any).wedding;
    const contributions = await storage.getCompletedContributions(wedding.id);
    res.json(contributions);
  });

  app.get("/api/contributions/total", withWedding, async (req, res) => {
    const wedding = (req as any).wedding;
    const total = await storage.getTotalContributions(wedding.id);
    res.json({ total, currency: "eur" });
  });

  app.get("/api/contributions/live", withWedding, async (req, res) => {
    const wedding = (req as any).wedding;
    const recent = await storage.getRecentContributions(wedding.id, 10);
    const latest = recent.length > 0 ? recent[0] : null;
    const total = await storage.getTotalContributions(wedding.id);
    res.json({ total, currency: "eur", latest, recent });
  });

  const manualContributionSchema = z.object({
    donorName: z.string().min(1, "Nom requis"),
    amount: z.number().int().min(100, "Montant minimum: 1€"),
    donorEmail: z.string().email("Email invalide").optional().nullable(),
    message: z.string().optional().nullable(),
  });

  app.post("/api/contributions/manual", isAuthenticated, withWedding, validateRequest(manualContributionSchema), async (req, res) => {
    const wedding = (req as any).wedding;
    const payments = (wedding?.config?.payments || {}) as {
      allowManualLiveContributions?: boolean;
    };
    if (payments.allowManualLiveContributions === false) {
      return res.status(403).json({ message: "Les contributions manuelles sont désactivées pour ce projet." });
    }

    const manualIntentId = `manual_${wedding.id}_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
    const contribution = await storage.createContribution(wedding.id, {
      donorName: req.body.donorName,
      donorEmail: req.body.donorEmail || null,
      amount: req.body.amount,
      message: req.body.message || null,
      stripePaymentIntentId: manualIntentId,
    });
    const updatedContribution = await storage.updateContributionStatus(manualIntentId, "paid");

    liveService.broadcast(wedding.id, "contribution_created", updatedContribution || contribution);
    await storage.createLiveEvent(wedding.id, "contribution_created", updatedContribution || contribution);

    res.status(201).json(updatedContribution || contribution);
  });

  // SSE Live Stream
  app.get("/api/live/stream", withWedding, async (req, res) => {
    const wedding = (req as any).wedding;
    liveService.addConnection(wedding.id, req, res);
  });

  // Live jokes admin
  app.get("/api/jokes", isAuthenticated, withWedding, async (req, res) => {
    const wedding = (req as any).wedding;
    const jokes = await storage.getJokes(wedding.id);
    res.json(jokes);
  });

  app.post("/api/jokes", isAuthenticated, withWedding, validateRequest(liveJokeInputSchema), async (req, res) => {
    const wedding = (req as any).wedding;
    const joke = await storage.createJoke(wedding.id, req.body);
    res.json(joke);
  });

  app.patch("/api/jokes/:id", isAuthenticated, withWedding, async (req, res) => {
    const wedding = (req as any).wedding;
    const id = parseInt(req.params.id);
    const joke = await storage.updateJoke(wedding.id, id, req.body);
    res.json(joke);
  });

  app.delete("/api/jokes/:id", isAuthenticated, withWedding, async (req, res) => {
    const wedding = (req as any).wedding;
    const id = parseInt(req.params.id);
    await storage.deleteJoke(wedding.id, id);
    res.json({ success: true });
  });

  app.get("/api/jokes/next", withWedding, async (req, res) => {
    const wedding = (req as any).wedding;
    if (!wedding.config?.features?.jokesEnabled) {
      return res.json({ joke: null });
    }
    const jokes = await storage.getJokes(wedding.id);
    const active = jokes.filter((j) => j.isActive);
    const joke = active.length > 0 ? active[Math.floor(Math.random() * active.length)] : null;
    if (joke) {
      await storage.createLiveEvent(wedding.id, "joke_shown", joke);
      liveService.broadcast(wedding.id, "joke_shown", joke);
    }
    res.json({ joke });
  });

  // Stripe checkout for contributions
  app.post("/api/create-checkout-session", withWedding, validateRequest(insertContributionSchema), async (req, res) => {
    try {
      const wedding = (req as any).wedding;
      const payments = (wedding?.config?.payments || {}) as {
        mode?: "stripe" | "external";
        externalUrl?: string;
        stripeStatus?: "not_connected" | "connected";
        stripeAccountId?: string;
      };
      const sections = (wedding?.config?.sections || {}) as {
        cagnotteExternalUrl?: string;
      };
      const externalUrl = payments.externalUrl || sections.cagnotteExternalUrl || "";
      const mode = payments.mode || (externalUrl ? "external" : "stripe");

      if (mode === "external") {
        if (!externalUrl) {
          return res.status(400).json({
            message: "Aucun lien de cagnotte externe configuré. Ajoutez-le dans les paramètres.",
          });
        }
        return res.json({
          url: externalUrl,
          mode: "external",
        });
      }

      const stripeAccountId = payments.stripeAccountId || "";
      const stripeConnected = payments.stripeStatus === "connected" && !!stripeAccountId;
      if (!stripeConnected) {
        if (externalUrl) {
          return res.json({ url: externalUrl, mode: "external" });
        }
        return res.status(400).json({
          message: "Stripe n'est pas connecté. Connectez votre compte Stripe ou configurez un lien externe.",
        });
      }

      const { donorName, donorEmail, amount, message } = req.body;
      const stripe = await getUncachableStripeClient();
      const session = await stripe.checkout.sessions.create({
        mode: "payment",
        payment_method_types: ["card"],
        line_items: [
          {
            quantity: 1,
            price_data: {
              currency: "eur",
              product_data: {
                name: `Contribution - ${wedding.title}`,
              },
              unit_amount: amount,
            },
          },
        ],
        metadata: {
          purpose: "contribution",
          weddingId: wedding.id,
          donorName,
          donorEmail: donorEmail || "",
          message: message || "",
        },
        payment_intent_data: {
          transfer_data: {
            destination: stripeAccountId,
          },
          // Keep fees = 0 for now (destination charge). Can add application_fee_amount later.
        },
        success_url: `${process.env.APP_BASE_URL || "http://localhost:5174"}/contribution/merci?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${process.env.APP_BASE_URL || "http://localhost:5174"}/${wedding.slug}/cagnotte`,
      });

      res.json({ url: session.url });
    } catch (error) {
      res.status(500).json({ message: "Paiement Stripe indisponible" });
    }
  });

  // Referral codes
  app.get("/api/referral/my-code", isAuthenticated, async (req, res) => {
    try {
      const userId = (req as any).user.id;
      let code = await storage.getReferralCodeByUser(userId);
      if (!code) {
        code = await storage.createReferralCode(userId);
      }
      const usageCount = await storage.getReferralUsageCount(userId);
      res.json({ code: code.code, usageCount });
    } catch (error) {
      res.status(500).json({ message: "Erreur lors de la récupération du code parrainage." });
    }
  });

  app.get("/api/referral/validate/:code", async (req, res) => {
    try {
      const ref = await storage.getReferralCodeByCode(req.params.code);
      if (!ref || ref.usedByUserId) {
        return res.json({ valid: false });
      }
      res.json({ valid: true, discountCents: ref.discountCents });
    } catch {
      res.json({ valid: false });
    }
  });

  // Billing (Premium)
  app.post("/api/billing/checkout", isAuthenticated, withWedding, async (req, res) => {
    try {
      const wedding = (req as any).wedding;
      const userId = (req as any).user.id;
      const { type, referralCode } = req.body as { type: "subscription" | "one_time"; referralCode?: string };

      let stripe;
      try {
        stripe = await getUncachableStripeClient();
      } catch {
        return res.status(503).json({ message: "Stripe n'est pas configuré. Veuillez connecter votre compte Stripe." });
      }

      const priceId = type === "subscription"
        ? process.env.STRIPE_PRICE_SUBSCRIPTION
        : process.env.STRIPE_PRICE_LIFETIME;
      if (!priceId) return res.status(500).json({ message: "Le prix Stripe n'est pas configuré." });

      let discounts: any[] = [];
      let validatedReferralCode = "";
      if (referralCode) {
        const ref = await storage.getReferralCodeByCode(referralCode);
        if (ref && !ref.usedByUserId && ref.ownerUserId !== userId) {
          try {
            const coupon = await stripe.coupons.create({
              amount_off: ref.discountCents,
              currency: "eur",
              duration: "once",
              name: `Parrainage ${ref.code}`,
              metadata: { referralCodeId: String(ref.id), referrerUserId: ref.ownerUserId },
            });
            discounts = [{ coupon: coupon.id }];
            validatedReferralCode = ref.code;
          } catch (couponError) {
            console.error("Referral coupon creation failed:", couponError);
          }
        }
      }

      const sessionConfig: any = {
        mode: type === "subscription" ? "subscription" : "payment",
        line_items: [{ price: priceId, quantity: 1 }],
        metadata: { weddingId: wedding.id, purpose: "billing", billingType: type, referralCode: validatedReferralCode || undefined, userId },
        success_url: `${process.env.APP_BASE_URL || "http://localhost:5174"}/${wedding.id}/billing?success=1&session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${process.env.APP_BASE_URL || "http://localhost:5174"}/${wedding.id}/billing?canceled=1`,
      };

      if (type === "subscription") {
        sessionConfig.subscription_data = { metadata: { weddingId: wedding.id, purpose: "billing" } };
        if (discounts.length > 0) sessionConfig.discounts = discounts;
      } else {
        sessionConfig.payment_intent_data = { metadata: { weddingId: wedding.id, purpose: "billing" } };
        if (discounts.length > 0) sessionConfig.discounts = discounts;
      }

      const session = await stripe.checkout.sessions.create(sessionConfig);
      res.json({ url: session.url });
    } catch (error) {
      res.status(500).json({ message: "Erreur Stripe" });
    }
  });

  app.post("/api/billing/sync", isAuthenticated, withWedding, async (req, res) => {
    try {
      const wedding = (req as any).wedding;

      let stripe;
      try {
        stripe = await getUncachableStripeClient();
      } catch {
        return res.status(503).json({ message: "Stripe n'est pas configuré. Veuillez connecter votre compte Stripe." });
      }

      let subs: any[] = [];
      try {
        const result = await (stripe as any).subscriptions.search({
          query: `metadata['weddingId']:'${wedding.id}'`,
          limit: 10,
        });
        subs = result?.data || [];
      } catch {
        try {
          const result = await stripe.subscriptions.list({ limit: 100, status: "all" as any });
          subs = (result?.data || []).filter((s: any) => s?.metadata?.weddingId === wedding.id);
        } catch {
          return res.json({ ok: true, found: false, currentPlan: wedding.currentPlan || "free" });
        }
      }

      if (!subs.length) {
        return res.json({ ok: true, found: false, currentPlan: wedding.currentPlan || "free" });
      }

      const preferred = subs.find((s: any) => ["active", "trialing"].includes(String(s.status))) || subs[0];
      await storage.upsertStripeSubscription({
        weddingId: wedding.id,
        stripeCustomerId: String(preferred.customer || ""),
        stripeSubscriptionId: String(preferred.id || ""),
        priceId: preferred?.items?.data?.[0]?.price?.id || null,
        status: String(preferred.status || "incomplete"),
        currentPeriodEnd: preferred?.current_period_end ? new Date(preferred.current_period_end * 1000) : null,
      });
      const isPremium = ["active", "trialing"].includes(String(preferred.status || ""));
      await storage.updateWedding(wedding.id, { currentPlan: isPremium ? "premium" : "free" });

      res.json({ ok: true, found: true, status: preferred.status, currentPlan: isPremium ? "premium" : "free" });
    } catch (error: any) {
      res.status(500).json({ message: "Sync Stripe impossible : " + (error?.message || "erreur inconnue") });
    }
  });

  app.get("/api/contribution/verify", async (req, res) => {
    try {
      const sessionId = req.query.session_id as string;
      if (!sessionId) return res.status(400).json({ message: "Missing session_id" });

      const stripe = await getUncachableStripeClient();
      const session = await stripe.checkout.sessions.retrieve(sessionId);
      if (session.payment_status !== "paid") {
        return res.status(400).json({ message: "Payment not completed" });
      }

      const weddingId = session.metadata?.weddingId;
      if (!weddingId) return res.status(400).json({ message: "Missing wedding context" });
      const wedding = await storage.getWedding(weddingId);
      if (!wedding) return res.status(404).json({ message: "Mariage introuvable" });

      const paymentIntentId = session.payment_intent as string;
      let contribution = await storage.getContributionByPaymentIntent(paymentIntentId);
      if (!contribution) {
        contribution = await storage.createContribution(wedding.id, {
          donorName: session.metadata?.donorName || "Invité",
          donorEmail: session.metadata?.donorEmail || null,
          amount: session.amount_total || 0,
          message: session.metadata?.message || null,
          stripePaymentIntentId: paymentIntentId,
        });
      }
      await storage.updateContributionStatus(paymentIntentId, "paid");

      sendContributionNotification(wedding, {
        donorName: contribution.donorName || "Invité",
        amount: contribution.amount,
        currency: contribution.currency,
        message: contribution.message,
      }).catch(() => null);

      if (contribution.donorEmail) {
        const { sendContributorThankYou } = await import("./email");
        sendContributorThankYou(wedding, {
          email: contribution.donorEmail,
          donorName: contribution.donorName || "Invité",
          amount: contribution.amount,
          currency: contribution.currency,
        }).catch(() => null);
      }

      liveService.broadcast(wedding.id, "contribution_created", contribution);
      await storage.createLiveEvent(wedding.id, "contribution_created", contribution);

      res.json({
        success: true,
        donorName: contribution.donorName,
        amount: contribution.amount,
        contribution,
      });
    } catch (error) {
      res.status(500).json({ message: "Verification error" });
    }
  });

  // Email logs
  app.get("/api/admin/email-logs", isAuthenticated, withWedding, async (req, res) => {
    const wedding = (req as any).wedding;
    const logs = await storage.getEmailLogs(wedding.id);
    res.json(logs);
  });

  app.get("/api/plan-limits", isAuthenticated, withWedding, async (req, res) => {
    const wedding = (req as any).wedding;
    const plan = wedding.currentPlan === "premium" ? "premium" : "free";
    const limits = PLAN_LIMITS[plan];
    const rsvpCount = await storage.getRsvpCount(wedding.id);
    res.json({ plan, limits, rsvpCount });
  });

  // Site config (public links for admin UI)
  app.get("/api/site-config", async (_req, res) => {
    res.json({
      appBaseUrl: process.env.APP_BASE_URL || "http://localhost:5174",
      marketingBaseUrl: process.env.MARKETING_BASE_URL || "http://localhost:5173",
    });
  });

  const httpServer = createServer(app);
  return httpServer;
}
