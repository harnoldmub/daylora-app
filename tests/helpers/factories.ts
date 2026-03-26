import { randomUUID } from "crypto";

let counter = 0;
const seq = () => ++counter;

export function buildUser(overrides: Record<string, any> = {}) {
  const n = seq();
  return {
    id: randomUUID(),
    email: `user${n}@test.nocely.fr`,
    passwordHash: "$2b$10$fakehashedpassword",
    firstName: `User${n}`,
    lastName: `Test`,
    isAdmin: false,
    emailVerifiedAt: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

export function buildWedding(ownerId: string, overrides: Record<string, any> = {}) {
  const n = seq();
  return {
    id: randomUUID(),
    ownerId,
    slug: `mariage-test-${n}`,
    title: `Mariage Test ${n}`,
    status: "draft" as const,
    weddingDate: new Date("2026-09-15"),
    datesConfig: "both" as const,
    templateId: "classic",
    currentPlan: "free",
    config: buildWeddingConfig(),
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

export function buildWeddingConfig(overrides: Record<string, any> = {}) {
  return {
    theme: {
      primaryColor: "#D4AF37",
      secondaryColor: "#FFFFFF",
      fontFamily: "serif",
      toneId: "golden-ivory",
      buttonStyle: "solid",
      buttonRadius: "pill",
    },
    seo: { title: "Notre Mariage", description: "Rejoignez-nous" },
    features: { jokesEnabled: true, giftsEnabled: true, cagnotteEnabled: true, liveEnabled: true },
    payments: {
      mode: "stripe" as const,
      externalProvider: "other",
      externalUrl: "",
      stripeStatus: "not_connected" as const,
      stripeAccountId: "",
      allowManualLiveContributions: true,
    },
    texts: {
      siteTitle: "Test Wedding",
      heroTitle: "Léa & Thomas",
      heroSubtitle: "Le Mariage de",
      weddingDate: "15 Septembre 2026",
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
      storyBody: "Nous nous sommes rencontrés en 2019...",
      cagnotteTitle: "CAGNOTTE MARIAGE",
      cagnotteDescription: "Votre présence est notre plus beau cadeau.",
      cagnotteBackLabel: "Retour",
      cagnotteSubmitLabel: "Contribuer",
      invitationTitle: "Invitation",
      invitationSubtitle: "Vous êtes invité(e)",
      invitationBody: "Rejoignez-nous",
      invitationCtaRsvp: "Répondre",
      invitationCtaCagnotte: "Cagnotte",
      footerTitle: "On a hâte",
      footerSubtitle: "Merci",
      footerEmail: "test@nocely.fr",
      footerPhone: "+33 6 12 34 56 78",
      footerAddress: "Paris, France",
      footerCopyright: "© 2026",
      liveTitle: "EN DIRECT",
      liveSubtitle: "Merci",
      liveDonorsTitle: "DONATEURS",
      liveQrCaption: "Scannez",
      galleryTitle: "GALERIE",
      galleryDescription: "Photos",
      giftsTitle: "CADEAUX",
      giftsDescription: "Idées",
    },
    media: {
      heroImage: "",
      couplePhoto: "",
      invitationImage: "",
    },
    branding: { logoUrl: "", logoText: "" },
    sections: {
      countdownDate: "2026-09-15",
      cagnotteSuggestedAmounts: [20, 50, 100, 150, 200],
      cagnotteExternalUrl: "",
      galleryImages: [],
      locationItems: [
        { title: "Mairie", address: "10 Rue Principale", description: "14h30" },
      ],
      programItems: [
        { time: "14:30", title: "Accueil", description: "Bienvenue" },
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
      menuItems: [],
      customPages: [],
    },
    ...overrides,
  };
}

export function buildRsvp(weddingId: string, overrides: Record<string, any> = {}) {
  const n = seq();
  return {
    weddingId,
    firstName: `Invité${n}`,
    lastName: `Famille${n}`,
    email: `invite${n}@test.fr`,
    attending: true,
    guestCount: 2,
    message: "Félicitations !",
    ...overrides,
  };
}

export function buildGift(overrides: Record<string, any> = {}) {
  const n = seq();
  return {
    name: `Cadeau ${n}`,
    description: `Description du cadeau ${n}`,
    price: 5000 + n * 100,
    imageUrl: "",
    externalUrl: "",
    reserved: false,
    ...overrides,
  };
}

export function buildContribution(weddingId: string, overrides: Record<string, any> = {}) {
  const n = seq();
  return {
    weddingId,
    amount: 5000,
    currency: "eur",
    donorName: `Donateur ${n}`,
    donorEmail: `donateur${n}@test.fr`,
    message: "Bon voyage !",
    status: "succeeded" as const,
    ...overrides,
  };
}

export function buildLiveJoke(overrides: Record<string, any> = {}) {
  const n = seq();
  return {
    text: `Blague ${n} : Pourquoi le marié sourit-il toujours ?`,
    tone: "funny" as const,
    active: true,
    ...overrides,
  };
}

export function resetCounter() {
  counter = 0;
}
