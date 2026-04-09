import type {
  EmailLog,
  Gift,
  OrganizationBudgetCategory,
  OrganizationBudgetItem,
  OrganizationChecklistCategory,
  OrganizationChecklistItem,
  OrganizationPlanningItem,
  RsvpResponse,
  Wedding,
} from "@shared/schema";

export const DEFAULT_CHECKLIST_BLUEPRINT = [
  {
    key: "venue",
    label: "Lieu",
    items: ["Définir le style de l'événement", "Visiter les lieux possibles", "Réserver le lieu principal"],
  },
  {
    key: "guests",
    label: "Invités",
    items: ["Estimer le nombre d'invités", "Créer la première liste d'invités", "Préparer l'envoi des invitations"],
  },
  {
    key: "outfits",
    label: "Tenues",
    items: ["Choisir les tenues principales", "Planifier les retouches", "Prévoir les accessoires"],
  },
  {
    key: "decor",
    label: "Déco",
    items: ["Définir la palette et l'ambiance", "Lister les éléments décoratifs", "Valider les fleurs et la scénographie"],
  },
  {
    key: "catering",
    label: "Traiteur",
    items: ["Comparer les options traiteur", "Valider le menu", "Confirmer les besoins alimentaires particuliers"],
  },
  {
    key: "music",
    label: "Musique",
    items: ["Choisir l'ambiance musicale", "Confirmer le DJ ou le groupe", "Préparer les morceaux clés"],
  },
  {
    key: "admin",
    label: "Administratif",
    items: ["Vérifier les démarches administratives", "Conserver les documents importants", "Planifier les signatures nécessaires"],
  },
  {
    key: "transport",
    label: "Transport",
    items: ["Prévoir les trajets principaux", "Informer les invités des accès", "Confirmer les horaires de transport"],
  },
];

export const DEFAULT_BUDGET_BLUEPRINT = [
  { key: "venue", label: "Lieu" },
  { key: "catering", label: "Traiteur" },
  { key: "photo", label: "Photo / vidéo" },
  { key: "outfits", label: "Tenues" },
  { key: "decor", label: "Décoration" },
  { key: "music", label: "Musique" },
  { key: "transport", label: "Transport" },
];

export function buildDefaultPlanning(weddingDate?: Date | string | null) {
  const targetDate = weddingDate ? new Date(weddingDate) : null;
  const offsetDate = (daysBefore: number) => {
    if (!targetDate || Number.isNaN(targetDate.getTime())) return null;
    const next = new Date(targetDate);
    next.setDate(next.getDate() - daysBefore);
    return next;
  };

  return [
    { title: "Réserver le lieu", kind: "milestone", dueAt: offsetDate(180), description: "Bloquez le lieu principal dès que possible." },
    { title: "Confirmer les prestataires", kind: "milestone", dueAt: offsetDate(120), description: "Traiteur, photo, musique, décoration." },
    { title: "Envoyer les invitations", kind: "milestone", dueAt: offsetDate(60), description: "Préparez les envois et vérifiez les liens RSVP." },
    { title: "Finaliser le plan de table", kind: "milestone", dueAt: offsetDate(21), description: "Ajustez les placements selon les réponses reçues." },
    { title: "Confirmer les derniers détails", kind: "reminder", dueAt: offsetDate(7), description: "Confirmez tous les horaires et les contacts clés." },
  ];
}

export function buildChecklistSummary(
  categories: OrganizationChecklistCategory[],
  items: OrganizationChecklistItem[],
) {
  return categories.map((category) => {
    const categoryItems = items.filter((item) => item.categoryId === category.id);
    const done = categoryItems.filter((item) => item.status === "done").length;
    const inProgress = categoryItems.filter((item) => item.status === "in_progress").length;
    const total = categoryItems.length;
    return {
      ...category,
      items: categoryItems,
      total,
      done,
      inProgress,
      progress: total > 0 ? Math.round((done / total) * 100) : 0,
    };
  });
}

export function buildBudgetSummary(
  categories: OrganizationBudgetCategory[],
  items: OrganizationBudgetItem[],
) {
  const byCategory = categories.map((category) => {
    const categoryItems = items.filter((item) => item.categoryId === category.id);
    const planned = categoryItems.reduce((sum, item) => sum + (item.plannedAmountCents || 0), 0);
    const actual = categoryItems.reduce((sum, item) => sum + (item.actualAmountCents || 0), 0);
    return {
      ...category,
      items: categoryItems,
      plannedAmountCents: planned,
      actualAmountCents: actual,
      remainingAmountCents: planned - actual,
    };
  });

  const totals = byCategory.reduce(
    (acc, category) => {
      acc.plannedAmountCents += category.plannedAmountCents;
      acc.actualAmountCents += category.actualAmountCents;
      acc.remainingAmountCents += category.remainingAmountCents;
      return acc;
    },
    { plannedAmountCents: 0, actualAmountCents: 0, remainingAmountCents: 0 },
  );

  return { categories: byCategory, totals };
}

export function computeOrganizationProgress(input: {
  wedding: Wedding;
  guests: RsvpResponse[];
  gifts: Gift[];
  emails: EmailLog[];
  checklistItems: OrganizationChecklistItem[];
  planningItems: OrganizationPlanningItem[];
}) {
  const { wedding, guests, gifts, emails, checklistItems, planningItems } = input;
  const config = wedding.config || ({} as any);

  const checks = [
    {
      key: "eventInfo",
      label: "Informations événement",
      points: 15,
      done: Boolean(wedding.weddingDate && wedding.title && config?.texts?.heroSubtitle),
      description: "Date, titre et présentation de l'événement",
    },
    {
      key: "sitePublished",
      label: "Site publié",
      points: 10,
      done: Boolean((wedding as any).isPublished || wedding.status === "published"),
      description: "Votre site est visible en ligne",
    },
    {
      key: "guestsAdded",
      label: "Invités ajoutés",
      points: 10,
      done: guests.length > 0,
      description: "Au moins un invité est enregistré",
    },
    {
      key: "rsvpReady",
      label: "RSVP prêt",
      points: 10,
      done: Boolean(config?.navigation?.pages?.rsvp),
      description: "Le module RSVP est actif sur le site",
    },
    {
      key: "giftsReady",
      label: "Cadeaux configurés",
      points: 10,
      done: Boolean(config?.features?.giftsEnabled && gifts.length > 0),
      description: "La liste de cadeaux est prête",
    },
    {
      key: "cagnotteReady",
      label: "Cagnotte configurée",
      points: 10,
      done: Boolean(
        config?.features?.cagnotteEnabled &&
        (
          config?.payments?.mode === "stripe" ||
          config?.payments?.externalUrl ||
          (config?.payments?.contributionMethods || []).length > 0
        ),
      ),
      description: "Vos moyens de contribution sont configurés",
    },
    {
      key: "emailsReady",
      label: "Emails prêts",
      points: 10,
      done: emails.length > 0,
      description: "Au moins un email a déjà été préparé ou envoyé",
    },
    {
      key: "checklist",
      label: "Checklist avancée",
      points: 15,
      done: checklistItems.length > 0 && checklistItems.some((item) => item.status === "done"),
      description: "Votre organisation avance dans la checklist",
    },
    {
      key: "planning",
      label: "Planning préparé",
      points: 10,
      done: planningItems.length > 0,
      description: "Vous avez commencé à planifier les étapes clés",
    },
  ];

  const totalPoints = checks.reduce((sum, check) => sum + check.points, 0);
  const earnedPoints = checks.reduce((sum, check) => sum + (check.done ? check.points : 0), 0);
  const score = totalPoints > 0 ? Math.round((earnedPoints / totalPoints) * 100) : 0;

  const nextActions = checks
    .filter((check) => !check.done)
    .slice(0, 4)
    .map((check) => ({
      key: check.key,
      label: check.label,
      description: check.description,
    }));

  return {
    score,
    earnedPoints,
    totalPoints,
    checks,
    nextActions,
  };
}
