type BotReply = {
  status: "open" | "pending" | "answered" | "closed";
  escalateToAdmin: boolean;
  content: string;
  topic: string;
};

const quickReplies = {
  premium: {
    topic: "premium",
    status: "pending",
    content:
      "Daylora Premium débloque les templates premium, les RSVP illimités, les cadeaux illimités, les pages personnalisées, le live et le retrait du branding Daylora. Si vous le souhaitez, je peux aussi vous mettre en relation avec l'équipe pour vérifier si l'offre correspond à votre besoin.",
  },
  guests: {
    topic: "guests",
    status: "pending",
    content:
      "Pour gérer vos invités, rendez-vous dans la page Invités. Vous pouvez y ajouter des invités, suivre les RSVP, attribuer des tables et partager les liens d'invitation personnalisés.",
  },
  design: {
    topic: "design",
    status: "pending",
    content:
      "Pour modifier le site, ouvrez Design ou l'aperçu live. Vous pouvez changer les textes, couleurs, photos et sections sans quitter Daylora.",
  },
  cagnotte: {
    topic: "cagnotte",
    status: "pending",
    content:
      "La cagnotte se configure depuis votre espace Daylora. Vous pouvez connecter Stripe, personnaliser les montants suggérés et suivre les contributions en temps réel.",
  },
  gifts: {
    topic: "gifts",
    status: "pending",
    content:
      "La liste de cadeaux se gère depuis la page Cadeaux. Vous pouvez ajouter vos idées, partager des liens, des photos et laisser Daylora éviter les doublons de réservation.",
  },
  admin: {
    topic: "handoff",
    status: "open",
    escalateToAdmin: true,
    content: "Je transmets votre demande à l'équipe Daylora.",
  },
} as const;

const keywordRules: Array<{ topic: string; keywords: string[]; reply: Omit<BotReply, "topic" | "escalateToAdmin"> & { escalateToAdmin?: boolean } }> = [
  {
    topic: "create_event",
    keywords: ["creer un evenement", "créer un événement", "creer un site", "onboarding", "nouvel evenement", "nouveau mariage"],
    reply: {
      status: "pending",
      content:
        "Pour créer votre événement, utilisez l'onboarding Daylora. Il vous guide pour le titre, l'URL, la date principale, le template et les premiers contenus du site.",
    },
  },
  {
    topic: "design",
    keywords: ["modifier le site", "design", "edition", "édition", "template", "preview", "aperçu", "modifier mon site"],
    reply: {
      status: "pending",
      content:
        "Vous pouvez modifier votre site depuis Design ou l'aperçu live. Daylora permet d'ajuster les textes, les couleurs, les photos, la navigation et les sections principales.",
    },
  },
  {
    topic: "invitations",
    keywords: ["invitation", "invitations", "envoyer les invitations", "envoyer invitation", "envoyer aux invites", "envoyer aux invités"],
    reply: {
      status: "pending",
      content:
        "Les invitations se gèrent depuis la page Invités. Chaque invité peut avoir son lien personnalisé, son QR code et son suivi RSVP dans Daylora.",
    },
  },
  {
    topic: "rsvp",
    keywords: ["rsvp", "confirmer", "confirmation", "presence", "présence", "reponse des invites", "réponse des invités"],
    reply: {
      status: "pending",
      content:
        "Le RSVP est suivi automatiquement dans la page Invités. Vous pouvez voir les confirmés, en attente ou déclinés, puis relancer les invités directement depuis Daylora.",
    },
  },
  {
    topic: "premium",
    keywords: ["premium", "abonnement", "plan premium", "offre premium", "facturation"],
    reply: {
      status: "pending",
      content: quickReplies.premium.content,
    },
  },
  {
    topic: "cagnotte",
    keywords: ["cagnotte", "stripe", "contribution", "paiement", "payer"],
    reply: {
      status: "pending",
      content: quickReplies.cagnotte.content,
    },
  },
  {
    topic: "gifts",
    keywords: ["cadeau", "cadeaux", "liste de cadeaux", "gift", "gifts"],
    reply: {
      status: "pending",
      content: quickReplies.gifts.content,
    },
  },
];

function normalize(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

export function getSupportBotWelcomeMessage() {
  return "Bonjour 👋 Je peux vous aider à configurer votre événement, répondre à vos questions ou vous mettre en relation avec l’équipe Daylora.";
}

export function getSupportBotQuickActions() {
  return [
    { key: "premium", label: "Comprendre l’offre Premium" },
    { key: "guests", label: "Aide pour les invités" },
    { key: "design", label: "Aide pour l’édition du site" },
    { key: "cagnotte", label: "Aide pour la cagnotte" },
    { key: "gifts", label: "Aide pour les cadeaux" },
    { key: "admin", label: "Parler à un admin" },
  ];
}

export function resolveSupportBotReply(input: { content: string; actionKey?: string | null }): BotReply {
  const actionKey = input.actionKey?.trim().toLowerCase() || "";
  if (actionKey && actionKey in quickReplies) {
    const reply = quickReplies[actionKey as keyof typeof quickReplies];
    return {
      topic: reply.topic,
      content: reply.content,
      status: reply.status as BotReply["status"],
      escalateToAdmin: Boolean((reply as any).escalateToAdmin),
    };
  }

  const normalized = normalize(input.content);
  const humanKeywords = ["admin", "humain", "humaine", "equipe", "équipe", "support", "quelqu'un", "quelqu’un", "parler a", "parler à"];
  if (humanKeywords.some((keyword) => normalized.includes(normalize(keyword)))) {
    return {
      topic: "handoff",
      content: "Je transmets votre demande à l'équipe Daylora.",
      status: "open",
      escalateToAdmin: true,
    };
  }

  const matched = keywordRules.find((rule) => rule.keywords.some((keyword) => normalized.includes(normalize(keyword))));
  if (matched) {
    return {
      topic: matched.topic,
      content: matched.reply.content,
      status: matched.reply.status,
      escalateToAdmin: Boolean(matched.reply.escalateToAdmin),
    };
  }

  return {
    topic: "fallback",
    content: "Je ne veux pas vous répondre à côté. Je transmets votre demande à l'équipe Daylora.",
    status: "open",
    escalateToAdmin: true,
  };
}
