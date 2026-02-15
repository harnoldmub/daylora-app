import { type Express } from "express";
import { createServer } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./auth";
import authRoutes from "./auth-routes";
import { validateRequest, withWedding, requireRole } from "./middleware/guards";
import {
  insertRsvpResponseSchema,
  updateRsvpResponseSchema,
  insertContributionSchema,
  insertGiftSchema,
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
    liveTitle: "CAGNOTTE EN DIRECT",
    liveSubtitle: "Merci pour votre générosité",
    liveDonorsTitle: "NOS GÉNÉREUX DONATEURS",
    liveQrCaption: "Scannez pour contribuer",
    galleryTitle: "GALERIE",
    galleryDescription: "Quelques instants capturés avant le grand jour.",
  },
  media: {
    heroImage: "",
    couplePhoto: "",
  },
  branding: {
    logoUrl: "",
    logoText: "",
  },
  sections: {
    countdownDate: "",
    cagnotteSuggestedAmounts: [20, 50, 100, 150, 200],
    galleryImages: [],
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
      live: true,
      story: true,
      gallery: true,
      location: true,
      program: true,
    },
    heroCtaPath: "rsvp",
    menuItems: [
      { id: "rsvp", label: "RSVP", path: "rsvp", enabled: true },
      { id: "cagnotte", label: "Cagnotte", path: "cagnotte", enabled: true },
      { id: "live", label: "Live", path: "live", enabled: true },
      { id: "story", label: "Histoire", path: "story", enabled: true },
      { id: "gallery", label: "Photos", path: "gallery", enabled: true },
      { id: "location", label: "Lieux", path: "location", enabled: true },
      { id: "program", label: "Programme", path: "program", enabled: true },
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

  const liveJokeInputSchema = z.object({
    content: z.string().min(1),
    tone: z.string().optional(),
    frequency: z.number().int().optional(),
    category: z.string().optional(),
    isActive: z.boolean().optional(),
  });

  // Root route for API
  app.get("/", (req, res) => {
    res.send(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Libala API</title>
          <style>
            body { font-family: system-ui, sans-serif; max-width: 600px; margin: 40px auto; padding: 20px; line-height: 1.6; }
            h1 { color: #333; }
            .card { background: #f5f5f5; padding: 20px; border-radius: 8px; border: 1px solid #ddd; }
            a { color: #0066cc; text-decoration: none; font-weight: bold; }
            a:hover { text-decoration: underline; }
            ul { padding-left: 20px; }
            li { margin-bottom: 10px; }
          </style>
        </head>
        <body>
          <div class="card">
            <h1>Backend Server Running</h1>
            <p>This is the API server for Libala.</p>
            <ul>
              <li><strong>Marketing (Public Site):</strong> <a href="http://localhost:5173">http://localhost:5173</a></li>
              <li><strong>App (Admin):</strong> <a href="http://localhost:5174">http://localhost:5174</a></li>
            </ul>
          </div>
        </body>
      </html>
    `);
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
      const { title, slug, templateId, toneId, weddingDate, currentPlan, features } = req.body || {};
      if (!title || !slug) return res.status(400).json({ message: "Titre et slug requis" });
      const existing = await storage.getWeddingBySlug(slug);
      if (existing) return res.status(400).json({ message: "Slug déjà utilisé" });

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
        navigation: {
          ...config.navigation,
          pages: {
            ...config.navigation.pages,
            cagnotte: features?.cagnotteEnabled ?? config.navigation.pages.cagnotte,
            live: features?.liveEnabled ?? config.navigation.pages.live,
          },
          menuItems: (config.navigation.menuItems || []).map((item: any) => {
            if (item.id === "cagnotte") {
              return { ...item, enabled: features?.cagnotteEnabled ?? item.enabled };
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

        if (isHugeDataUrl(logoUrl, 220_000)) {
          return res.status(413).json({ message: "Logo trop volumineux. Importez une image plus legere." });
        }
        if (isHugeDataUrl(heroImage, 3_000_000) || isHugeDataUrl(couplePhoto, 3_000_000)) {
          return res.status(413).json({ message: "Image trop volumineuse. Importez une image plus legere." });
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
      const data = req.body as InsertRsvpResponse;
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

  app.post("/api/gifts", isAuthenticated, withWedding, validateRequest(insertGiftSchema), async (req, res) => {
    const wedding = (req as any).wedding;
    const gift = await storage.createGift(wedding.id, req.body);
    res.json(gift);
  });

  app.patch("/api/gifts/:id", isAuthenticated, withWedding, async (req, res) => {
    const wedding = (req as any).wedding;
    const id = parseInt(req.params.id, 10);
    const gift = await storage.updateGift(wedding.id, id, req.body);
    res.json(gift);
  });

  app.delete("/api/gifts/:id", isAuthenticated, withWedding, async (req, res) => {
    const wedding = (req as any).wedding;
    const id = parseInt(req.params.id, 10);
    await storage.deleteGift(wedding.id, id);
    res.json({ success: true });
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
        success_url: `${process.env.APP_BASE_URL || "http://localhost:5174"}/contribution/merci?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${process.env.APP_BASE_URL || "http://localhost:5174"}/${wedding.slug}/cagnotte`,
      });

      res.json({ url: session.url });
    } catch (error) {
      res.status(500).json({ message: "Stripe error" });
    }
  });

  // Billing (Premium)
  app.post("/api/billing/checkout", isAuthenticated, withWedding, async (req, res) => {
    try {
      const wedding = (req as any).wedding;
      const { type } = req.body as { type: "subscription" | "one_time" };
      const stripe = await getUncachableStripeClient();
      const priceId = type === "subscription"
        ? process.env.STRIPE_PRICE_SUBSCRIPTION
        : process.env.STRIPE_PRICE_LIFETIME;
      if (!priceId) return res.status(500).json({ message: "Stripe price not configured" });

      const session = await stripe.checkout.sessions.create({
        mode: type === "subscription" ? "subscription" : "payment",
        line_items: [{ price: priceId, quantity: 1 }],
        metadata: { weddingId: wedding.id, purpose: "billing", billingType: type },
        subscription_data: type === "subscription" ? { metadata: { weddingId: wedding.id, purpose: "billing" } } : undefined,
        payment_intent_data: type === "one_time" ? { metadata: { weddingId: wedding.id, purpose: "billing" } } : undefined,
        success_url: `${process.env.APP_BASE_URL || "http://localhost:5174"}/app/${wedding.id}/billing?success=1`,
        cancel_url: `${process.env.APP_BASE_URL || "http://localhost:5174"}/app/${wedding.id}/billing?canceled=1`,
      });
      res.json({ url: session.url });
    } catch (error) {
      res.status(500).json({ message: "Erreur Stripe" });
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
