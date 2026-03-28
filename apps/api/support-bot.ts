type BotReply = {
  status: "open" | "pending" | "answered" | "closed";
  escalateToAdmin: boolean;
  content: string;
  topic: string;
};

const quickReplies: Record<string, { topic: string; status: string; content: string; escalateToAdmin?: boolean }> = {
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
  edit_texts: {
    topic: "design",
    status: "pending",
    content:
      "Allez dans « Design » depuis le menu latéral. Chaque section (Hero, Programme, Histoire, Lieux, RSVP, Cagnotte…) a ses propres champs. Modifiez les textes puis cliquez sur « Appliquer » en bas de la section pour enregistrer.",
  },
  edit_colors: {
    topic: "design",
    status: "pending",
    content:
      "Dans la page Design, ouvrez la section « Couleurs & Typo ». Choisissez une palette prédéfinie ou personnalisez les couleurs primaire et secondaire. Vous pouvez aussi changer la famille typographique (serif ou sans-serif) et le style des boutons.",
  },
  change_template: {
    topic: "design",
    status: "pending",
    content:
      "Rendez-vous dans « Templates » pour voir les 3 modèles disponibles : Classique (gratuit), Modern et Minimal (Premium). Vous pouvez aussi changer de template depuis la section « Template » de la page Design.",
  },
  edit_logo: {
    topic: "design",
    status: "pending",
    content:
      "Dans la page Design, ouvrez la section « Logo ». Importez votre logo (PNG, JPG ou SVG) ou définissez un texte de remplacement. Le logo apparaît en haut de votre site public.",
  },
  edit_locations: {
    topic: "design",
    status: "pending",
    content:
      "Dans la page Design, section « Lieux & Accès », ajoutez vos lieux (cérémonie, réception…) avec titre, adresse et description. Pour chaque lieu, vous pouvez aussi ajouter des suggestions d'hébergements à proximité.",
  },
  add_guests: {
    topic: "guests",
    status: "pending",
    content:
      "Allez dans « Invités », puis cliquez sur « Ajouter un invité ». Remplissez le prénom, nom, email, téléphone et le nombre d'accompagnants. Vous pouvez aussi exporter la liste au format CSV.",
  },
  track_rsvp: {
    topic: "guests",
    status: "pending",
    content:
      "Les réponses RSVP apparaissent automatiquement dans la page Invités avec un statut (confirmé, en attente, refusé). Utilisez les filtres pour trier par statut. Le tableau de bord affiche un récapitulatif en temps réel. En formule gratuite, la limite est de 10 RSVP.",
  },
  send_invitations: {
    topic: "guests",
    status: "pending",
    content:
      "Chaque invité reçoit un lien personnalisé vers une invitation élégante à son nom. Depuis le tableau des invités, utilisez les boutons d'action pour ouvrir l'invitation, envoyer un email ou contacter par WhatsApp.",
  },
  gift_list: {
    topic: "gifts",
    status: "pending",
    content:
      "Dans « Cadeaux », ajoutez des cadeaux avec nom, description et prix. Utilisez le bouton « Ajouter des suggestions » pour pré-remplir 10 idées populaires. Vos invités peuvent réserver un cadeau en cliquant sur « Je m'en occupe » depuis votre site public.",
  },
  how_cagnotte: {
    topic: "cagnotte",
    status: "pending",
    content:
      "La cagnotte permet à vos invités de contribuer financièrement via Stripe. Ils choisissent un montant parmi les suggestions ou saisissent un montant libre, et laissent un message. Vous suivez les contributions en temps réel depuis le tableau de bord.",
  },
  share_site: {
    topic: "share",
    status: "pending",
    content:
      "Votre site est accessible via un lien unique (daylora.app/votre-slug). Publiez-le depuis les Paramètres quand vous êtes prêt. Tant qu'il n'est pas publié, seul vous pouvez le voir en mode aperçu. Partagez le lien par email, WhatsApp ou réseaux sociaux.",
  },
  publish_site: {
    topic: "share",
    status: "pending",
    content:
      "Rendez-vous dans « Paramètres » pour activer ou désactiver la publication de votre site. Quand le site est dépublié, les visiteurs non connectés verront une page 404.",
  },
  live_display: {
    topic: "live",
    status: "pending",
    content:
      "La page live affiche les contributions en temps réel — idéale pour projeter pendant votre soirée. Un QR code est inclus pour que vos invités participent sur place. Accédez-y depuis « Blagues Live » puis « Voir la page live ».",
  },
  go_premium: {
    topic: "premium",
    status: "pending",
    content:
      "Rendez-vous dans « Facturation » pour souscrire au plan Premium à 23,99 €/mois ou 149 €/an. Le Premium débloque les 3 templates, les RSVP illimités, la liste de cadeaux, les blagues live, les pages personnalisées, 50 photos en galerie et retire le branding Daylora.",
  },
  plan_differences: {
    topic: "premium",
    status: "pending",
    content:
      "Gratuit : template Classique, 10 RSVP max, 2 cadeaux, cagnotte, 6 photos en galerie, branding Daylora. Premium : 3 templates, RSVP illimités, cadeaux illimités, page live et blagues, pages personnalisées, 50 photos, sans branding.",
  },
  referral: {
    topic: "premium",
    status: "pending",
    content:
      "Chaque utilisateur reçoit un code de parrainage unique. Partagez-le avec vos proches : ils bénéficieront d'une réduction de 10 € sur le plan Premium. Retrouvez votre code dans la page Facturation.",
  },
  custom_pages: {
    topic: "pages",
    status: "pending",
    content:
      "Depuis « Pages », créez des pages supplémentaires pour votre site (infos pratiques, dress code, activités…). Cette fonctionnalité est réservée au plan Premium.",
  },
  configure_menu: {
    topic: "pages",
    status: "pending",
    content:
      "Dans « Site & Menus », choisissez quelles sections afficher et réorganisez le menu de navigation. Activez ou désactivez les sections selon vos besoins.",
  },
  design: {
    topic: "design",
    status: "pending",
    content:
      "Vous pouvez modifier votre site depuis la page Design ou l'aperçu live. Daylora permet d'ajuster les textes, les couleurs, les photos, la navigation et les sections principales.",
  },
  admin: {
    topic: "handoff",
    status: "open",
    escalateToAdmin: true,
    content: "Je transmets votre demande à l'équipe Daylora.",
  },
};

const keywordRules: Array<{ replyKey: string; keywords: string[] }> = [
  { replyKey: "edit_texts", keywords: ["modifier les textes", "changer les textes", "editer les textes", "éditer les textes", "modifier texte", "texte du site"] },
  { replyKey: "edit_colors", keywords: ["couleur", "couleurs", "typographie", "typo", "police", "palette", "changer la couleur", "modifier les couleurs"] },
  { replyKey: "change_template", keywords: ["changer de template", "changer template", "template", "modele", "modèle", "classique", "modern", "minimal"] },
  { replyKey: "edit_logo", keywords: ["logo", "ajouter un logo", "changer le logo", "modifier le logo"] },
  { replyKey: "edit_locations", keywords: ["lieu", "lieux", "adresse", "hébergement", "hebergement", "hotel", "hôtel", "cérémonie", "ceremonie", "réception", "reception"] },
  { replyKey: "add_guests", keywords: ["ajouter un invite", "ajouter un invité", "ajouter des invites", "ajouter des invités", "nouvel invite", "nouvel invité"] },
  { replyKey: "track_rsvp", keywords: ["rsvp", "suivre les rsvp", "confirmer", "confirmation", "presence", "présence", "reponse des invites", "réponse des invités"] },
  { replyKey: "send_invitations", keywords: ["envoyer les invitations", "envoyer invitation", "envoyer aux invites", "envoyer aux invités", "invitation", "invitations", "qr code"] },
  { replyKey: "gift_list", keywords: ["cadeau", "cadeaux", "liste de cadeaux", "gift", "gifts", "réservation cadeau", "reservation cadeau", "ajouter un cadeau"] },
  { replyKey: "how_cagnotte", keywords: ["cagnotte", "contribution", "pot commun", "contribuer", "montant"] },
  { replyKey: "share_site", keywords: ["partager", "partager mon site", "lien du site", "url du site", "slug"] },
  { replyKey: "publish_site", keywords: ["publier", "publication", "dépublier", "depublier", "mettre en ligne", "site public"] },
  { replyKey: "live_display", keywords: ["live", "temps réel", "temps reel", "blague", "blagues", "projection", "écran", "ecran", "affichage live"] },
  { replyKey: "go_premium", keywords: ["passer au premium", "souscrire", "s'abonner", "acheter premium", "facturation", "paiement stripe"] },
  { replyKey: "plan_differences", keywords: ["difference entre les plans", "différence entre les plans", "plan gratuit", "plan premium", "comparaison", "gratuit vs premium"] },
  { replyKey: "premium", keywords: ["premium", "abonnement", "offre premium", "tarif", "prix"] },
  { replyKey: "referral", keywords: ["parrainage", "parrain", "code parrainage", "réduction parrainage", "reduction parrainage"] },
  { replyKey: "custom_pages", keywords: ["page personnalisee", "page personnalisée", "pages personnalisees", "pages personnalisées", "ajouter une page", "nouvelle page", "dress code", "infos pratiques"] },
  { replyKey: "configure_menu", keywords: ["menu", "navigation", "configurer le menu", "réorganiser le menu", "reorganiser le menu", "section", "sections", "activer une section"] },
  { replyKey: "design", keywords: ["modifier le site", "design", "edition", "édition", "preview", "aperçu", "modifier mon site"] },
];

function normalize(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

export function getSupportBotWelcomeMessage() {
  return "Bonjour 👋 Je peux vous aider à configurer votre mariage, répondre à vos questions ou vous mettre en relation avec l'équipe Daylora.";
}

export function getSupportBotQuickActions() {
  return [
    { key: "premium", label: "Comprendre l'offre Premium" },
    { key: "plan_differences", label: "Différences entre les plans" },
    { key: "go_premium", label: "Passer au Premium" },
    { key: "referral", label: "Comment fonctionne le parrainage ?" },
    { key: "add_guests", label: "Ajouter des invités" },
    { key: "track_rsvp", label: "Suivre les RSVP" },
    { key: "send_invitations", label: "Envoyer les invitations" },
    { key: "edit_texts", label: "Modifier les textes du site" },
    { key: "edit_colors", label: "Changer couleurs et typographie" },
    { key: "change_template", label: "Changer de template" },
    { key: "edit_logo", label: "Ajouter ou changer le logo" },
    { key: "edit_locations", label: "Ajouter des lieux et hébergements" },
    { key: "gift_list", label: "Gérer la liste de cadeaux" },
    { key: "how_cagnotte", label: "Fonctionnement de la cagnotte" },
    { key: "share_site", label: "Partager mon site" },
    { key: "publish_site", label: "Publier ou dépublier mon site" },
    { key: "live_display", label: "Utiliser l'affichage live" },
    { key: "custom_pages", label: "Ajouter des pages personnalisées" },
    { key: "configure_menu", label: "Configurer le menu du site" },
    { key: "admin", label: "Parler à un admin" },
  ];
}

export function resolveSupportBotReply(input: { content: string; actionKey?: string | null }): BotReply {
  const actionKey = input.actionKey?.trim().toLowerCase() || "";
  if (actionKey && actionKey in quickReplies) {
    const reply = quickReplies[actionKey];
    return {
      topic: reply.topic,
      content: reply.content,
      status: reply.status as BotReply["status"],
      escalateToAdmin: Boolean(reply.escalateToAdmin),
    };
  }

  const normalized = normalize(input.content);
  const humanKeywords = ["admin", "humain", "humaine", "equipe", "support", "quelqu un", "parler a"];
  if (humanKeywords.some((keyword) => normalized.includes(normalize(keyword)))) {
    return {
      topic: "handoff",
      content: "Je transmets votre demande à l'équipe Daylora.",
      status: "open",
      escalateToAdmin: true,
    };
  }

  const matched = keywordRules.find((rule) => rule.keywords.some((keyword) => normalized.includes(normalize(keyword))));
  if (matched && matched.replyKey in quickReplies) {
    const reply = quickReplies[matched.replyKey];
    return {
      topic: reply.topic,
      content: reply.content,
      status: reply.status as BotReply["status"],
      escalateToAdmin: Boolean(reply.escalateToAdmin),
    };
  }

  return {
    topic: "fallback",
    content: "Je ne veux pas vous répondre à côté. Je transmets votre demande à l'équipe Daylora.",
    status: "open",
    escalateToAdmin: true,
  };
}
