import { sql } from 'drizzle-orm';
import {
  index,
  jsonb,
  pgTable,
  timestamp,
  varchar,
  text,
  integer,
  uuid,
  serial,
  boolean,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

export type GuestExperienceInvitationType = {
  id: string;
  label: string;
  description?: string;
  enabled: boolean;
  segmentIds: string[];
  optionIds: string[];
  emailVariant?: string;
};

export type GuestExperienceSegment = {
  id: string;
  label: string;
  time?: string;
  venueLabel?: string;
  venueAddress?: string;
  description?: string;
  enabled: boolean;
  invitationTypeIds: string[];
  sortOrder: number;
};

export type GuestExperienceOption = {
  id: string;
  label: string;
  description?: string;
  enabled: boolean;
  time?: string;
  venueLabel?: string;
  venueAddress?: string;
  priceCents?: number | null;
  invitationTypeIds: string[];
};

export type GuestExperienceTable = {
  id: string;
  name: string;
  number?: number | null;
  capacity?: number | null;
  category?: string | null;
  notes?: string | null;
  enabled: boolean;
};

// Session storage table.
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table.
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique().notNull(),
  passwordHash: text("password_hash"),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  isAdmin: boolean("is_admin").default(false),
  googleId: varchar("google_id").unique(),
  appleId: varchar("apple_id").unique(),
  emailVerifiedAt: timestamp("email_verified_at"),
  lastLoginAt: timestamp("last_login_at"),
  hasSeenPremiumOffer: boolean("has_seen_premium_offer").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

export type ContributionMethodPaypal = {
  id: string;
  type: "paypal";
  enabled: boolean;
  sortOrder: number;
  paypalUrl: string;
  label?: string;
};

export type ContributionMethodPhone = {
  id: string;
  type: "phone";
  enabled: boolean;
  sortOrder: number;
  number: string;
  label: string;
};

export type ContributionMethodLink = {
  id: string;
  type: "link";
  enabled: boolean;
  sortOrder: number;
  url: string;
  serviceName: string;
};

export type ContributionMethodBank = {
  id: string;
  type: "bank";
  enabled: boolean;
  sortOrder: number;
  accountHolder: string;
  bankName: string;
  iban?: string;
  bic?: string;
  accountNumber?: string;
};

export type ContributionMethod =
  | ContributionMethodPaypal
  | ContributionMethodPhone
  | ContributionMethodLink
  | ContributionMethodBank;

// Weddings storage table (Multi-tenancy)
export const weddings = pgTable("weddings", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  ownerId: varchar("owner_id").references(() => users.id).notNull(),
  slug: varchar("slug", { length: 100 }).unique().notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  status: varchar("status", { length: 20 }).notNull().default('draft'), // 'draft', 'published', 'archived'
  weddingDate: timestamp("wedding_date"),
  datesConfig: varchar("dates_config", { length: 50 }).notNull().default('both'), // '19', '21', 'both'
  templateId: varchar("template_id", { length: 50 }).default('classic'),
  config: jsonb("config").$type<{
    language?: "fr" | "en";
    theme: {
      primaryColor: string;
      secondaryColor: string;
      fontFamily: string;
      toneId: string;
      buttonStyle: string;
      buttonRadius: string;
      headerLayout?: string;
      headerSpacing?: string;
      headerModel?: string;
      footerModel?: string;
      rsvpModel?: string;
    };
    seo: {
      title: string;
      description: string;
      ogImage?: string;
    };
    features: {
      jokesEnabled: boolean;
      giftsEnabled: boolean;
      cagnotteEnabled: boolean;
      liveEnabled: boolean;
    };
    payments: {
      mode: "stripe" | "external";
      externalProvider: string;
      externalUrl: string;
      stripeStatus: "not_connected" | "connected";
      stripeAccountId?: string;
      allowManualLiveContributions: boolean;
      contributionMethods?: ContributionMethod[];
    };
    texts: {
      siteTitle: string;
      heroTitle: string;
      heroSubtitle: string;
      weddingDate: string;
      heroCta: string;
      rsvpTitle: string;
      rsvpDescription: string;
      rsvpButton: string;
      navRsvp: string;
      navCagnotte: string;
      navLive: string;
      locationTitle: string;
      locationDescription: string;
      programTitle: string;
      programDescription: string;
      storyTitle: string;
      storyBody: string;
      cagnotteTitle: string;
      cagnotteDescription: string;
      cagnotteBackLabel: string;
      cagnotteSubmitLabel: string;
      invitationTitle: string;
      invitationSubtitle: string;
      invitationBody: string;
      invitationCtaRsvp: string;
      invitationCtaCagnotte: string;
      footerTitle: string;
      footerSubtitle: string;
      footerEmail: string;
      footerPhone: string;
      footerAddress: string;
      footerCopyright: string;
      liveTitle: string;
      liveSubtitle: string;
      liveDonorsTitle: string;
      liveQrCaption: string;
      galleryTitle: string;
      galleryDescription: string;
      giftsTitle: string;
      giftsDescription: string;
    };
    media: {
      heroImage: string;
      couplePhoto: string;
      invitationImage?: string;
    };
    branding: {
      logoUrl: string;
      logoText: string;
    };
    sections: {
      countdownDate: string;
      cagnotteSuggestedAmounts: number[];
      cagnotteExternalUrl: string;
      invitationShowLocations?: boolean;
      invitationShowCountdown?: boolean;
      galleryImages: string[];
      locationItems: {
        title: string;
        address: string;
        description: string;
      }[];
      programItems: {
        time: string;
        title: string;
        description: string;
      }[];
      guestExperience?: {
        invitationTypes?: GuestExperienceInvitationType[];
        eventSegments?: GuestExperienceSegment[];
        eventOptions?: GuestExperienceOption[];
        tables?: GuestExperienceTable[];
        checkInSettings?: {
          allowMassCheckIn?: boolean;
          showPendingOnlyByDefault?: boolean;
        };
      };
    };
    navigation: {
      pages: {
        rsvp: boolean;
        cagnotte: boolean;
        gifts: boolean;
        live: boolean;
        story: boolean;
        gallery: boolean;
        location: boolean;
        program: boolean;
      };
      menuItems: {
        id: string;
        label: string;
        path: string;
        enabled: boolean;
        linkType?: "anchor" | "external";
        anchorId?: string;
        externalUrl?: string;
      }[];
      customPages: {
        id: string;
        title: string;
        slug: string;
        content: string;
        enabled: boolean;
        showInMenu: boolean;
      }[];
      heroCtaPath?: string;
    };
  }>().notNull().default({
    language: "fr",
    theme: {
      primaryColor: '#D4AF37',
      secondaryColor: '#FFFFFF',
      fontFamily: 'serif',
      toneId: 'golden-ivory',
      buttonStyle: 'solid',
      buttonRadius: 'pill',
      headerLayout: 'balanced',
      headerSpacing: 'comfortable',
      headerModel: 'model1',
      footerModel: 'model1',
      rsvpModel: 'model1',
    },
    seo: { title: 'Notre Mariage', description: 'Rejoignez-nous pour célébrer notre union' },
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
      heroTitle: "", // Default: dynamic from title
      heroSubtitle: "Vous êtes cordialement invité(e) au mariage de",
      weddingDate: "", // Default: dynamic from date
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
      giftsDescription: "Quelques idées pour ceux qui souhaitent nous faire plaisir."
    },
    media: {
      heroImage: "",
      couplePhoto: "",
      invitationImage: "",
    },
    branding: {
      logoUrl: "",
      logoText: ""
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
      guestExperience: {
        invitationTypes: [],
        eventSegments: [],
        eventOptions: [],
        tables: [],
        checkInSettings: {
          allowMassCheckIn: true,
          showPendingOnlyByDefault: false,
        },
      },
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
        { id: "cagnotte", label: "Cagnotte", path: "cagnotte", enabled: true, linkType: "anchor", anchorId: "cagnotte", externalUrl: "" }
      ],
      customPages: []
    }
  }),
  currentPlan: varchar("current_plan", { length: 20 }).notNull().default('free'), // 'free', 'premium'
  isPublished: boolean("is_published").notNull().default(false), // Draft by default
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export type Wedding = typeof weddings.$inferSelect;
export type InsertWedding = typeof weddings.$inferInsert;

// Memberships (RBAC)
export const memberships = pgTable("memberships", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  weddingId: uuid("wedding_id").references(() => weddings.id).notNull(),
  role: varchar("role", { length: 20 }).notNull().default('editor'), // 'owner', 'admin', 'editor', 'viewer'
  createdAt: timestamp("created_at").defaultNow(),
});

// RSVP Responses table (Guests)
export const rsvpResponses = pgTable("rsvp_responses", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  weddingId: uuid("wedding_id").references(() => weddings.id).notNull(),
  firstName: varchar("first_name", { length: 100 }).notNull(),
  lastName: varchar("last_name", { length: 100 }).notNull(),
  email: varchar("email", { length: 255 }),
  phone: varchar("phone", { length: 50 }),
  partySize: integer("party_size").notNull().default(1),
  availability: varchar("availability", { length: 50 }).notNull().default('pending'), // 'confirmed', 'declined', 'pending'
  chosenDates: jsonb("chosen_dates").$type<string[]>().default([]),
  tableNumber: integer("table_number"),
  invitationTypeId: varchar("invitation_type_id", { length: 100 }),
  assignedTableId: varchar("assigned_table_id", { length: 100 }),
  allowedOptionIds: jsonb("allowed_option_ids").$type<string[]>().default([]),
  selectedOptionIds: jsonb("selected_option_ids").$type<string[]>().default([]),
  notes: text("notes"),
  status: varchar("status", { length: 50 }).notNull().default('pending'), // 'pending', 'confirmed', 'declined'
  publicToken: varchar("public_token").unique().default(sql`gen_random_uuid()`),
  invitationSentAt: timestamp("invitation_sent_at"),
  whatsappInvitationSentAt: timestamp("whatsapp_invitation_sent_at"),
  confirmedAt: timestamp("confirmed_at"),
  checkedInAt: timestamp("checked_in_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

export type RsvpResponse = typeof rsvpResponses.$inferSelect;
export type InsertRsvpResponseDb = typeof rsvpResponses.$inferInsert;

// Contributions table
export const contributions = pgTable("contributions", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  weddingId: uuid("wedding_id").references(() => weddings.id).notNull(),
  giftId: integer("gift_id").references(() => gifts.id),
  donorName: varchar("donor_name", { length: 255 }),
  donorEmail: varchar("donor_email", { length: 255 }),
  amount: integer("amount").notNull(),
  currency: varchar("currency", { length: 10 }).notNull().default('eur'),
  message: text("message"),
  stripePaymentIntentId: varchar("stripe_payment_intent_id", { length: 255 }),
  status: varchar("status", { length: 50 }).notNull().default('pending'), // 'pending', 'paid', 'failed', 'refunded'
  createdAt: timestamp("created_at").defaultNow(),
  completedAt: timestamp("completed_at"),
});

export type Contribution = typeof contributions.$inferSelect;
export type InsertContributionDb = typeof contributions.$inferInsert;

// Gifts table
export const gifts = pgTable("gifts", {
  id: serial("id").primaryKey(),
  weddingId: uuid("wedding_id").references(() => weddings.id).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  imageUrl: text("image_url"),
  sourceUrl: text("source_url"),
  price: integer("price"), // Total price of the gift
  contributedAmount: integer("contributed_amount").notNull().default(0),
  isReserved: boolean("is_reserved").notNull().default(false),
  reservedBy: varchar("reserved_by", { length: 255 }),
  createdAt: timestamp("created_at").defaultNow(),
});

export type Gift = typeof gifts.$inferSelect;
export type InsertGift = typeof gifts.$inferInsert;

// Live Jokes table
export const liveJokes = pgTable("live_jokes", {
  id: serial("id").primaryKey(),
  weddingId: uuid("wedding_id").references(() => weddings.id).notNull(),
  content: text("content").notNull(),
  category: varchar("category", { length: 50 }).default('funny'),
  tone: varchar("tone", { length: 20 }).default('safe'), // 'safe', 'fun', 'second-degree'
  isActive: boolean("is_active").notNull().default(true),
  frequency: integer("frequency").default(30), // Frequency in seconds
  createdAt: timestamp("created_at").defaultNow(),
});

export type LiveJoke = typeof liveJokes.$inferSelect;
export type InsertLiveJoke = typeof liveJokes.$inferInsert;

// Live Events (Activity Log / SSE)
export const liveEvents = pgTable("live_events", {
  id: serial("id").primaryKey(),
  weddingId: uuid("wedding_id").references(() => weddings.id).notNull(),
  type: varchar("type", { length: 50 }).notNull(), // 'contribution_created', 'rsvp_updated', 'joke_shown'
  payload: jsonb("payload").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Emails Log
export const emailLogs = pgTable("email_logs", {
  id: serial("id").primaryKey(),
  weddingId: uuid("wedding_id").references(() => weddings.id),
  guestId: integer("guest_id").references(() => rsvpResponses.id),
  type: varchar("type", { length: 50 }).notNull(),
  to: varchar("to", { length: 255 }).notNull(),
  subject: varchar("subject", { length: 255 }),
  status: varchar("status", { length: 20 }).notNull(), // 'sent', 'failed', 'delivered'
  providerId: varchar("provider_id", { length: 255 }),
  payload: jsonb("payload"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Stripe Subscriptions
export const stripeSubscriptions = pgTable("stripe_subscriptions", {
  id: serial("id").primaryKey(),
  weddingId: uuid("wedding_id").references(() => weddings.id).notNull(),
  stripeCustomerId: varchar("stripe_customer_id", { length: 255 }).notNull(),
  stripeSubscriptionId: varchar("stripe_subscription_id", { length: 255 }).unique(),
  priceId: varchar("price_id", { length: 255 }),
  status: varchar("status", { length: 20 }).notNull(),
  currentPeriodEnd: timestamp("current_period_end"),
  cancelAtPeriodEnd: boolean("cancel_at_period_end").default(false),
  subscriptionStartDate: timestamp("subscription_start_date"),
  featureFlags: jsonb("feature_flags").default({}),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Stripe Webhook Events (Idempotency)
export const stripeWebhookEvents = pgTable("stripe_webhook_events", {
  id: varchar("id").primaryKey(), // Stripe event ID
  type: varchar("type", { length: 100 }).notNull(),
  processedAt: timestamp("processed_at").defaultNow(),
});

// Email verification tokens
export const emailVerificationTokens = pgTable("email_verification_tokens", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  tokenHash: varchar("token_hash", { length: 255 }).notNull().unique(),
  expiresAt: timestamp("expires_at").notNull(),
  usedAt: timestamp("used_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

export type EmailVerificationToken = typeof emailVerificationTokens.$inferSelect;
export type InsertEmailVerificationToken = typeof emailVerificationTokens.$inferInsert;

// Password reset tokens
export const passwordResetTokens = pgTable("password_reset_tokens", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  tokenHash: varchar("token_hash", { length: 255 }).notNull().unique(),
  expiresAt: timestamp("expires_at").notNull(),
  usedAt: timestamp("used_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

export type PasswordResetToken = typeof passwordResetTokens.$inferSelect;
export type InsertPasswordResetToken = typeof passwordResetTokens.$inferInsert;

// Zod Schemas for Validation
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  emailVerifiedAt: true,
  lastLoginAt: true
});
export const insertWeddingSchema = createInsertSchema(weddings).omit({ id: true, createdAt: true, updatedAt: true });

export const signupSchema = z.object({
  email: z.string().min(1, "Ce champ est obligatoire.").email("Veuillez saisir une adresse email valide."),
  password: z.string().min(8, "Le mot de passe doit contenir au moins 8 caractères."),
  firstName: z.string().min(1, "Ce champ est obligatoire."),
});

export const loginSchema = z.object({
  email: z.string().min(1, "Ce champ est obligatoire.").email("Veuillez saisir une adresse email valide."),
  password: z.string().min(1, "Ce champ est obligatoire."),
});

export const insertRsvpResponseSchema = z.object({
  firstName: z.string().min(1, "Ce champ est obligatoire."),
  lastName: z.string().min(1, "Ce champ est obligatoire."),
  email: z.string().optional().nullable()
    .transform(val => !val || val === '' ? null : val)
    .refine(val => !val || z.string().email().safeParse(val).success, {
      message: "Veuillez saisir une adresse email valide."
    }),
  partySize: z.number().int().min(1, "Nombre de personnes invalide.").max(2, "Nombre de personnes invalide."),
  availability: z.enum(['confirmed', 'declined', 'pending'], {
    errorMap: () => ({ message: "Veuillez indiquer votre disponibilité." })
  }),
  invitationTypeId: z.string().optional().nullable().transform(val => !val || val === '' ? null : val),
  assignedTableId: z.string().optional().nullable().transform(val => !val || val === '' ? null : val),
  allowedOptionIds: z.array(z.string()).optional(),
  selectedOptionIds: z.array(z.string()).optional(),
  phone: z.string().optional().nullable().transform(val => !val || val === '' ? null : val),
  notes: z.string().optional().nullable().transform(val => !val || val === '' ? null : val),
});

export type InsertRsvpResponse = z.infer<typeof insertRsvpResponseSchema>;

export const updateRsvpResponseSchema = z.object({
  firstName: z.string().min(1, "Ce champ est obligatoire."),
  lastName: z.string().min(1, "Ce champ est obligatoire."),
  email: z.string().optional().nullable()
    .transform(val => !val || val === '' ? null : val)
    .refine(val => !val || z.string().email().safeParse(val).success, {
      message: "Veuillez saisir une adresse email valide."
    }),
  partySize: z.number().int().min(1, "Nombre de personnes invalide.").max(5, "Nombre de personnes invalide."),
  availability: z.enum(['confirmed', 'declined', 'pending'], {
    errorMap: () => ({ message: "Veuillez indiquer votre disponibilité." })
  }),
  tableNumber: z.union([z.number().int().positive(), z.null(), z.undefined()]).optional(),
  invitationTypeId: z.string().optional().nullable(),
  assignedTableId: z.string().optional().nullable(),
  allowedOptionIds: z.array(z.string()).optional(),
  selectedOptionIds: z.array(z.string()).optional(),
  notes: z.string().nullable().optional(),
  status: z.string().optional(),
  phone: z.string().optional().nullable(),
  publicToken: z.string().optional().nullable(),
  invitationSentAt: z.union([z.string(), z.date()]).optional().nullable().transform(val => val ? new Date(val) : null),
  whatsappInvitationSentAt: z.union([z.string(), z.date()]).optional().nullable().transform(val => val ? new Date(val) : null),
  confirmedAt: z.union([z.string(), z.date()]).optional().nullable().transform(val => val ? new Date(val) : null),
  checkedInAt: z.union([z.string(), z.date()]).optional().nullable().transform(val => val ? new Date(val) : null),
});

export type UpdateRsvpResponse = z.infer<typeof updateRsvpResponseSchema>;

export const insertContributionSchema = z.object({
  donorName: z.string().min(1, "Ce champ est obligatoire."),
  donorEmail: z.string().email("Veuillez saisir une adresse email valide.").optional().nullable()
    .transform(val => !val || val === '' ? null : val),
  amount: z.number().int().min(100, "Le montant minimum est de 1 euro."),
  message: z.string().optional().nullable().transform(val => !val || val === '' ? null : val),
});

export type InsertContribution = z.infer<typeof insertContributionSchema>;

// weddingId is resolved from headers (tenant), and computed fields are server-managed.
export const insertGiftSchema = createInsertSchema(gifts).omit({
  id: true,
  createdAt: true,
  weddingId: true,
  contributedAmount: true,
  isReserved: true,
  reservedBy: true,
});
export const insertLiveJokeSchema = createInsertSchema(liveJokes).omit({ id: true, createdAt: true, weddingId: true });
export const insertEmailVerificationTokenSchema = createInsertSchema(emailVerificationTokens).omit({ id: true, createdAt: true });
export const insertPasswordResetTokenSchema = createInsertSchema(passwordResetTokens).omit({ id: true, createdAt: true });

export const insertEmailLogSchema = createInsertSchema(emailLogs).omit({ id: true, createdAt: true });

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  weddings: many(weddings),
  emailVerificationTokens: many(emailVerificationTokens),
  passwordResetTokens: many(passwordResetTokens),
  memberships: many(memberships),
  supportConversations: many(supportConversations),
  supportMessages: many(supportMessages),
}));

export const weddingsRelations = relations(weddings, ({ one, many }) => ({
  owner: one(users, {
    fields: [weddings.ownerId],
    references: [users.id],
  }),
  rsvpResponses: many(rsvpResponses),
  contributions: many(contributions),
  gifts: many(gifts),
  liveJokes: many(liveJokes),
  memberships: many(memberships),
  subscriptions: many(stripeSubscriptions),
  supportConversations: many(supportConversations),
  supportMessages: many(supportMessages),
  organizationChecklistCategories: many(organizationChecklistCategories),
  organizationChecklistItems: many(organizationChecklistItems),
  organizationPlanningItems: many(organizationPlanningItems),
  organizationBudgetCategories: many(organizationBudgetCategories),
  organizationBudgetItems: many(organizationBudgetItems),
}));

export const membershipsRelations = relations(memberships, ({ one }) => ({
  user: one(users, {
    fields: [memberships.userId],
    references: [users.id],
  }),
  wedding: one(weddings, {
    fields: [memberships.weddingId],
    references: [weddings.id],
  }),
}));

export const rsvpResponsesRelations = relations(rsvpResponses, ({ one }) => ({
  wedding: one(weddings, {
    fields: [rsvpResponses.weddingId],
    references: [weddings.id],
  }),
}));

export const contributionsRelations = relations(contributions, ({ one }) => ({
  wedding: one(weddings, {
    fields: [contributions.weddingId],
    references: [weddings.id],
  }),
  gift: one(gifts, {
    fields: [contributions.giftId],
    references: [gifts.id],
  }),
}));

export const giftsRelations = relations(gifts, ({ one, many }) => ({
  wedding: one(weddings, {
    fields: [gifts.weddingId],
    references: [weddings.id],
  }),
  contributions: many(contributions),
}));

export const liveJokesRelations = relations(liveJokes, ({ one }) => ({
  wedding: one(weddings, {
    fields: [liveJokes.weddingId],
    references: [weddings.id],
  }),
}));

export const stripeSubscriptionsRelations = relations(stripeSubscriptions, ({ one }) => ({
  wedding: one(weddings, {
    fields: [stripeSubscriptions.weddingId],
    references: [weddings.id],
  }),
}));
export type EmailLog = typeof emailLogs.$inferSelect;
export type InsertEmailLog = typeof emailLogs.$inferInsert;

export const emailVerificationTokensRelations = relations(emailVerificationTokens, ({ one }) => ({
  user: one(users, {
    fields: [emailVerificationTokens.userId],
    references: [users.id],
  }),
}));

export const passwordResetTokensRelations = relations(passwordResetTokens, ({ one }) => ({
  user: one(users, {
    fields: [passwordResetTokens.userId],
    references: [users.id],
  }),
}));

export const referralCodes = pgTable("referral_codes", {
  id: serial("id").primaryKey(),
  code: varchar("code", { length: 20 }).unique().notNull(),
  ownerUserId: varchar("owner_user_id").references(() => users.id).notNull(),
  usedByUserId: varchar("used_by_user_id").references(() => users.id),
  discountCents: integer("discount_cents").notNull().default(1000),
  usedAt: timestamp("used_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

export type ReferralCode = typeof referralCodes.$inferSelect;
export type InsertReferralCode = typeof referralCodes.$inferInsert;

export const referralCodesRelations = relations(referralCodes, ({ one }) => ({
  owner: one(users, {
    fields: [referralCodes.ownerUserId],
    references: [users.id],
  }),
}));

export const productFeedback = pgTable("product_feedback", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  weddingId: uuid("wedding_id").references(() => weddings.id),
  type: varchar("type", { length: 30 }).notNull(),
  message: text("message").notNull(),
  rating: integer("rating"),
  currentUrl: varchar("current_url", { length: 500 }),
  screenshotUrl: varchar("screenshot_url", { length: 1000 }),
  status: varchar("status", { length: 20 }).notNull().default("new"),
  createdAt: timestamp("created_at").defaultNow(),
});

export type ProductFeedback = typeof productFeedback.$inferSelect;
export type InsertProductFeedback = typeof productFeedback.$inferInsert;

export const supportConversations = pgTable("support_conversations", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  weddingId: uuid("wedding_id").references(() => weddings.id),
  status: varchar("status", { length: 20 }).notNull().default("open"),
  sourcePage: varchar("source_page", { length: 255 }),
  sourcePlan: varchar("source_plan", { length: 20 }),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  lastMessageAt: timestamp("last_message_at").defaultNow(),
  lastReadByUserAt: timestamp("last_read_by_user_at"),
  lastReadByAdminAt: timestamp("last_read_by_admin_at"),
});

export type SupportConversation = typeof supportConversations.$inferSelect;
export type InsertSupportConversation = typeof supportConversations.$inferInsert;

export const supportMessages = pgTable("support_messages", {
  id: serial("id").primaryKey(),
  conversationId: integer("conversation_id").references(() => supportConversations.id).notNull(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  weddingId: uuid("wedding_id").references(() => weddings.id),
  role: varchar("role", { length: 20 }).notNull(),
  senderType: varchar("sender_type", { length: 20 }).notNull().default("user"),
  senderId: varchar("sender_id", { length: 255 }),
  content: text("content").notNull(),
  pageLabel: varchar("page_label", { length: 255 }),
  currentUrl: varchar("current_url", { length: 1000 }),
  metadata: jsonb("metadata").$type<Record<string, any>>().default({}),
  readAt: timestamp("read_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

export type SupportMessage = typeof supportMessages.$inferSelect;
export type InsertSupportMessage = typeof supportMessages.$inferInsert;

export const organizationChecklistCategories = pgTable("organization_checklist_categories", {
  id: serial("id").primaryKey(),
  weddingId: uuid("wedding_id").references(() => weddings.id).notNull(),
  key: varchar("key", { length: 80 }),
  label: varchar("label", { length: 255 }).notNull(),
  sortOrder: integer("sort_order").notNull().default(0),
  isDefault: boolean("is_default").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export type OrganizationChecklistCategory = typeof organizationChecklistCategories.$inferSelect;
export type InsertOrganizationChecklistCategory = typeof organizationChecklistCategories.$inferInsert;

export const organizationChecklistItems = pgTable("organization_checklist_items", {
  id: serial("id").primaryKey(),
  weddingId: uuid("wedding_id").references(() => weddings.id).notNull(),
  categoryId: integer("category_id").references(() => organizationChecklistCategories.id).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  status: varchar("status", { length: 20 }).notNull().default("todo"),
  isDefault: boolean("is_default").notNull().default(false),
  sortOrder: integer("sort_order").notNull().default(0),
  dueDate: timestamp("due_date"),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export type OrganizationChecklistItem = typeof organizationChecklistItems.$inferSelect;
export type InsertOrganizationChecklistItem = typeof organizationChecklistItems.$inferInsert;

export const organizationPlanningItems = pgTable("organization_planning_items", {
  id: serial("id").primaryKey(),
  weddingId: uuid("wedding_id").references(() => weddings.id).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  status: varchar("status", { length: 20 }).notNull().default("todo"),
  kind: varchar("kind", { length: 30 }).notNull().default("milestone"),
  startsAt: timestamp("starts_at"),
  dueAt: timestamp("due_at"),
  sortOrder: integer("sort_order").notNull().default(0),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export type OrganizationPlanningItem = typeof organizationPlanningItems.$inferSelect;
export type InsertOrganizationPlanningItem = typeof organizationPlanningItems.$inferInsert;

export const organizationBudgetCategories = pgTable("organization_budget_categories", {
  id: serial("id").primaryKey(),
  weddingId: uuid("wedding_id").references(() => weddings.id).notNull(),
  key: varchar("key", { length: 80 }),
  label: varchar("label", { length: 255 }).notNull(),
  sortOrder: integer("sort_order").notNull().default(0),
  isDefault: boolean("is_default").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export type OrganizationBudgetCategory = typeof organizationBudgetCategories.$inferSelect;
export type InsertOrganizationBudgetCategory = typeof organizationBudgetCategories.$inferInsert;

export const organizationBudgetItems = pgTable("organization_budget_items", {
  id: serial("id").primaryKey(),
  weddingId: uuid("wedding_id").references(() => weddings.id).notNull(),
  categoryId: integer("category_id").references(() => organizationBudgetCategories.id).notNull(),
  label: varchar("label", { length: 255 }).notNull(),
  plannedAmountCents: integer("planned_amount_cents").notNull().default(0),
  actualAmountCents: integer("actual_amount_cents").notNull().default(0),
  status: varchar("status", { length: 20 }).notNull().default("planned"),
  vendorName: varchar("vendor_name", { length: 255 }),
  notes: text("notes"),
  paymentDueAt: timestamp("payment_due_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export type OrganizationBudgetItem = typeof organizationBudgetItems.$inferSelect;
export type InsertOrganizationBudgetItem = typeof organizationBudgetItems.$inferInsert;

export const insertProductFeedbackSchema = createInsertSchema(productFeedback).omit({
  id: true,
  createdAt: true,
});

export const insertOrganizationChecklistCategorySchema = createInsertSchema(organizationChecklistCategories).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  weddingId: true,
});

export const insertOrganizationChecklistItemSchema = createInsertSchema(organizationChecklistItems).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  weddingId: true,
  completedAt: true,
});

export const insertOrganizationPlanningItemSchema = createInsertSchema(organizationPlanningItems).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  weddingId: true,
  completedAt: true,
});

export const insertOrganizationBudgetCategorySchema = createInsertSchema(organizationBudgetCategories).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  weddingId: true,
});

export const insertOrganizationBudgetItemSchema = createInsertSchema(organizationBudgetItems).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  weddingId: true,
});

export const insertSupportMessageSchema = z.object({
  content: z.string().min(1, "Le message est requis.").max(3000, "Le message est trop long."),
  pageLabel: z.string().max(255).optional().nullable(),
  currentUrl: z.string().max(1000).optional().nullable(),
  weddingId: z.string().uuid().optional().nullable(),
  actionKey: z.string().max(100).optional().nullable(),
});

export const productFeedbackRelations = relations(productFeedback, ({ one }) => ({
  wedding: one(weddings, {
    fields: [productFeedback.weddingId],
    references: [weddings.id],
  }),
  user: one(users, {
    fields: [productFeedback.userId],
    references: [users.id],
  }),
}));

export const supportConversationsRelations = relations(supportConversations, ({ one, many }) => ({
  wedding: one(weddings, {
    fields: [supportConversations.weddingId],
    references: [weddings.id],
  }),
  user: one(users, {
    fields: [supportConversations.userId],
    references: [users.id],
  }),
  messages: many(supportMessages),
}));

export const supportMessagesRelations = relations(supportMessages, ({ one }) => ({
  conversation: one(supportConversations, {
    fields: [supportMessages.conversationId],
    references: [supportConversations.id],
  }),
  wedding: one(weddings, {
    fields: [supportMessages.weddingId],
    references: [weddings.id],
  }),
  user: one(users, {
    fields: [supportMessages.userId],
    references: [users.id],
  }),
}));

export const organizationChecklistCategoriesRelations = relations(organizationChecklistCategories, ({ one, many }) => ({
  wedding: one(weddings, {
    fields: [organizationChecklistCategories.weddingId],
    references: [weddings.id],
  }),
  items: many(organizationChecklistItems),
}));

export const organizationChecklistItemsRelations = relations(organizationChecklistItems, ({ one }) => ({
  wedding: one(weddings, {
    fields: [organizationChecklistItems.weddingId],
    references: [weddings.id],
  }),
  category: one(organizationChecklistCategories, {
    fields: [organizationChecklistItems.categoryId],
    references: [organizationChecklistCategories.id],
  }),
}));

export const organizationPlanningItemsRelations = relations(organizationPlanningItems, ({ one }) => ({
  wedding: one(weddings, {
    fields: [organizationPlanningItems.weddingId],
    references: [weddings.id],
  }),
}));

export const organizationBudgetCategoriesRelations = relations(organizationBudgetCategories, ({ one, many }) => ({
  wedding: one(weddings, {
    fields: [organizationBudgetCategories.weddingId],
    references: [weddings.id],
  }),
  items: many(organizationBudgetItems),
}));

export const organizationBudgetItemsRelations = relations(organizationBudgetItems, ({ one }) => ({
  wedding: one(weddings, {
    fields: [organizationBudgetItems.weddingId],
    references: [weddings.id],
  }),
  category: one(organizationBudgetCategories, {
    fields: [organizationBudgetItems.categoryId],
    references: [organizationBudgetCategories.id],
  }),
}));

export const superAdmins = pgTable("super_admins", {
  id: serial("id").primaryKey(),
  email: varchar("email", { length: 255 }).unique().notNull(),
  passwordHash: text("password_hash").notNull(),
  mustChangePassword: boolean("must_change_password").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export type SuperAdmin = typeof superAdmins.$inferSelect;
export type InsertSuperAdmin = typeof superAdmins.$inferInsert;

export const adminAuditLogs = pgTable("admin_audit_logs", {
  id: serial("id").primaryKey(),
  adminId: integer("admin_id").references(() => superAdmins.id).notNull(),
  action: varchar("action", { length: 100 }).notNull(),
  targetType: varchar("target_type", { length: 50 }),
  targetId: varchar("target_id", { length: 255 }),
  details: jsonb("details"),
  ipAddress: varchar("ip_address", { length: 100 }),
  createdAt: timestamp("created_at").defaultNow(),
});

export type AdminAuditLog = typeof adminAuditLogs.$inferSelect;
export type InsertAdminAuditLog = typeof adminAuditLogs.$inferInsert;

export const adminAuditLogsRelations = relations(adminAuditLogs, ({ one }) => ({
  admin: one(superAdmins, {
    fields: [adminAuditLogs.adminId],
    references: [superAdmins.id],
  }),
}));

export const promoCodes = pgTable("promo_codes", {
  id: serial("id").primaryKey(),
  code: varchar("code", { length: 50 }).unique().notNull(),
  type: varchar("type", { length: 20 }).notNull(),
  value: integer("value").notNull(),
  durationMonths: integer("duration_months"),
  startDate: timestamp("start_date").defaultNow(),
  endDate: timestamp("end_date"),
  maxUses: integer("max_uses"),
  maxUsesPerUser: integer("max_uses_per_user").default(1),
  currentUses: integer("current_uses").notNull().default(0),
  isActive: boolean("is_active").notNull().default(true),
  stripePromoId: varchar("stripe_promo_id", { length: 255 }),
  createdAt: timestamp("created_at").defaultNow(),
});

export type PromoCode = typeof promoCodes.$inferSelect;
export type InsertPromoCode = typeof promoCodes.$inferInsert;

export const PLAN_LIMITS = {
  free: {
    maxSites: 1,
    maxRsvp: 10,
    maxGifts: 2,
    giftsEnabled: true,
    liveEnabled: false,
    jokesEnabled: false,
    cagnotteEnabled: true,
    customPagesEnabled: false,
    removeBranding: false,
    maxGalleryImages: 6,
  },
  premium: {
    maxSites: Infinity,
    maxRsvp: Infinity,
    maxGifts: Infinity,
    giftsEnabled: true,
    liveEnabled: true,
    jokesEnabled: true,
    cagnotteEnabled: true,
    customPagesEnabled: true,
    removeBranding: true,
    maxGalleryImages: 50,
  },
} as const;
