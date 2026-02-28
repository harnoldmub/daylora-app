import { useState, useMemo } from "react";
import {
  HelpCircle,
  X,
  Search,
  ChevronRight,
  ChevronDown,
  Paintbrush,
  Users,
  Gift,
  Share2,
  CreditCard,
  FileText,
  ExternalLink,
  Radio,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";

interface FAQItem {
  question: string;
  answer: string;
  link?: { label: string; href: string };
  category: string;
}

const faqItems: FAQItem[] = [
  {
    category: "Invitation",
    question: "Comment modifier les textes de mon invitation ?",
    answer:
      "Allez dans « Invitation » depuis le menu latéral. Chaque section (Hero, Programme, Histoire, Lieux, RSVP, Cagnotte…) a ses propres champs. Modifiez les textes puis cliquez sur « Appliquer » en bas de la section pour enregistrer.",
    link: { label: "Modifier l'invitation", href: "/design" },
  },
  {
    category: "Invitation",
    question: "Comment changer les couleurs et la typographie ?",
    answer:
      "Dans la page Invitation, ouvrez la section « Couleurs & Typo ». Choisissez une palette prédéfinie ou personnalisez les couleurs primaire et secondaire. Vous pouvez aussi changer la famille typographique (serif ou sans-serif) et le style des boutons.",
    link: { label: "Modifier l'invitation", href: "/design" },
  },
  {
    category: "Invitation",
    question: "Comment changer de template ?",
    answer:
      "Rendez-vous dans « Templates » pour voir les 3 modèles disponibles : Classique (gratuit), Modern et Minimal (Premium). Vous pouvez aussi changer de template depuis la section « Template » de la page Invitation.",
    link: { label: "Voir les Templates", href: "/templates" },
  },
  {
    category: "Invitation",
    question: "Comment ajouter ou changer mon logo ?",
    answer:
      "Dans la page Invitation, ouvrez la section « Logo ». Importez votre logo (PNG, JPG ou SVG) ou définissez un texte de remplacement. Le logo apparaît en haut de votre site public.",
    link: { label: "Modifier l'invitation", href: "/design" },
  },
  {
    category: "Invitation",
    question: "Comment ajouter des lieux et hébergements ?",
    answer:
      "Dans la page Invitation, section « Lieux & Accès », ajoutez vos lieux (cérémonie, réception…) avec titre, adresse et description. Pour chaque lieu, vous pouvez aussi ajouter des suggestions d'hébergements à proximité avec nom, adresse et lien de réservation.",
    link: { label: "Modifier l'invitation", href: "/design" },
  },
  {
    category: "Invités",
    question: "Comment ajouter des invités ?",
    answer:
      "Allez dans « Invités », puis cliquez sur « Ajouter un invité ». Remplissez le prénom, nom, email, téléphone et le nombre d'accompagnants. Vous pouvez aussi exporter la liste au format CSV.",
    link: { label: "Gérer les invités", href: "/guests" },
  },
  {
    category: "Invités",
    question: "Comment suivre les RSVP ?",
    answer:
      "Les réponses RSVP apparaissent automatiquement dans la page Invités avec un statut (confirmé, en attente, refusé). Utilisez les filtres pour trier par statut. Le tableau de bord affiche un récapitulatif en temps réel. En formule gratuite, la limite est de 30 RSVP.",
    link: { label: "Voir les invités", href: "/guests" },
  },
  {
    category: "Invités",
    question: "Comment envoyer les invitations ?",
    answer:
      "Chaque invité reçoit un lien personnalisé vers une invitation élégante à son nom. Depuis le tableau des invités, utilisez les boutons d'action pour ouvrir l'invitation, envoyer un email ou contacter par WhatsApp.",
    link: { label: "Gérer les invités", href: "/guests" },
  },
  {
    category: "Cadeaux",
    question: "Comment gérer la liste de cadeaux ?",
    answer:
      "Dans « Cadeaux », ajoutez des cadeaux avec nom, description et prix. Utilisez le bouton « Ajouter des suggestions » pour pré-remplir 10 idées populaires. Vos invités peuvent réserver un cadeau en cliquant sur « Je m'en occupe » depuis votre site public.",
    link: { label: "Gérer les cadeaux", href: "/gifts" },
  },
  {
    category: "Cadeaux",
    question: "Comment fonctionne la cagnotte en ligne ?",
    answer:
      "La cagnotte permet à vos invités de contribuer financièrement via Stripe. Ils choisissent un montant parmi les suggestions ou saisissent un montant libre, et laissent un message. Vous suivez les contributions en temps réel depuis le tableau de bord.",
  },
  {
    category: "Partage",
    question: "Comment partager mon site ?",
    answer:
      "Votre site est accessible via un lien unique (daylora.app/votre-slug). Publiez-le depuis les Paramètres quand vous êtes prêt. Tant qu'il n'est pas publié, seul vous pouvez le voir en mode aperçu. Partagez le lien par email, WhatsApp ou réseaux sociaux.",
  },
  {
    category: "Partage",
    question: "Comment publier ou dépublier mon site ?",
    answer:
      "Rendez-vous dans « Paramètres » pour activer ou désactiver la publication de votre site. Quand le site est dépublié, les visiteurs non connectés verront une page 404.",
    link: { label: "Paramètres", href: "/settings" },
  },
  {
    category: "Live",
    question: "Comment utiliser l'affichage live ?",
    answer:
      "La page live affiche les contributions en temps réel — idéale pour projeter pendant votre soirée. Un QR code est inclus pour que vos invités participent sur place. Accédez-y depuis « Blagues Live » puis « Voir la page live ».",
    link: { label: "Blagues Live", href: "/live" },
  },
  {
    category: "Abonnement",
    question: "Comment passer au plan Premium ?",
    answer:
      "Rendez-vous dans « Facturation » pour souscrire au plan Premium à 23,99 €/mois ou 149 €/an. Le Premium débloque les 3 templates, les RSVP illimités, la liste de cadeaux, les blagues live, les pages personnalisées, 50 photos en galerie et retire le branding Daylora.",
    link: { label: "Voir les tarifs", href: "/billing" },
  },
  {
    category: "Abonnement",
    question: "Quelles sont les différences entre les plans ?",
    answer:
      "Gratuit : template Classique, 30 RSVP max, cagnotte, 6 photos en galerie, branding Daylora. Premium : 3 templates, RSVP illimités, liste de cadeaux avec réservation, page live et blagues, pages personnalisées, 50 photos, sans branding.",
    link: { label: "Comparer les plans", href: "/billing" },
  },
  {
    category: "Abonnement",
    question: "Comment fonctionne le parrainage ?",
    answer:
      "Chaque utilisateur reçoit un code de parrainage unique. Partagez-le avec vos proches : ils bénéficieront d'une réduction de 10 € sur le plan Premium. Retrouvez votre code dans la page Facturation.",
    link: { label: "Voir mon code", href: "/billing" },
  },
  {
    category: "Pages",
    question: "Comment ajouter des pages personnalisées ?",
    answer:
      "Depuis « Pages », créez des pages supplémentaires pour votre site (infos pratiques, dress code, activités…). Cette fonctionnalité est réservée au plan Premium.",
    link: { label: "Gérer les pages", href: "/pages" },
  },
  {
    category: "Pages",
    question: "Comment configurer le menu de mon site ?",
    answer:
      "Dans « Site & Menus », choisissez quelles sections afficher et réorganisez le menu de navigation. Activez ou désactivez les sections selon vos besoins.",
    link: { label: "Configurer le site", href: "/site" },
  },
];

const categories = Array.from(new Set(faqItems.map((item) => item.category)));

const categoryIcons: Record<string, typeof Paintbrush> = {
  Invitation: Paintbrush,
  Invités: Users,
  Cadeaux: Gift,
  Partage: Share2,
  Live: Radio,
  Abonnement: CreditCard,
  Pages: FileText,
};

export function HelpChatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  const filteredItems = useMemo(() => {
    if (!search.trim()) return faqItems;
    const q = search.toLowerCase();
    return faqItems.filter(
      (item) =>
        item.question.toLowerCase().includes(q) ||
        item.answer.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q),
    );
  }, [search]);

  const groupedItems = useMemo(() => {
    const groups: Record<string, FAQItem[]> = {};
    for (const item of filteredItems) {
      if (!groups[item.category]) groups[item.category] = [];
      groups[item.category].push(item);
    }
    return groups;
  }, [filteredItems]);

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-40 h-12 w-12 rounded-full bg-primary text-primary-foreground shadow-lg hover:bg-primary/90 transition-all hover:scale-105 flex items-center justify-center"
        aria-label="Aide"
      >
        <HelpCircle className="h-6 w-6" />
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50">
          <div
            className="fixed inset-0 bg-black/30 backdrop-blur-sm"
            onClick={() => setIsOpen(false)}
          />
          <div className="fixed inset-y-0 right-0 w-full max-w-md bg-background shadow-2xl flex flex-col z-50 animate-in slide-in-from-right duration-300">
            <div className="flex items-center justify-between p-4 border-b">
              <div className="flex items-center gap-2">
                <HelpCircle className="h-5 w-5 text-primary" />
                <h2 className="text-lg font-semibold">Centre d'aide</h2>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsOpen(false)}
              >
                <X className="h-5 w-5" />
              </Button>
            </div>

            <div className="p-4 border-b">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Rechercher une question..."
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setExpandedIndex(null);
                  }}
                  className="w-full h-10 pl-9 pr-4 rounded-lg border bg-muted/50 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-6">
              {Object.keys(groupedItems).length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <HelpCircle className="h-10 w-10 mx-auto mb-3 opacity-40" />
                  <p className="text-sm">Aucun résultat pour « {search} »</p>
                  <p className="text-xs mt-1">
                    Essayez avec d'autres mots-clés
                  </p>
                </div>
              )}
              {categories
                .filter((cat) => groupedItems[cat])
                .map((category) => {
                  const Icon = categoryIcons[category] || FileText;
                  return (
                    <div key={category}>
                      <div className="flex items-center gap-2 mb-2">
                        <Icon className="h-4 w-4 text-primary" />
                        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                          {category}
                        </h3>
                      </div>
                      <div className="space-y-1">
                        {groupedItems[category].map((item) => {
                          const globalIndex = faqItems.indexOf(item);
                          const isExpanded = expandedIndex === globalIndex;
                          return (
                            <div
                              key={globalIndex}
                              className="rounded-lg border bg-card overflow-hidden"
                            >
                              <button
                                onClick={() =>
                                  setExpandedIndex(
                                    isExpanded ? null : globalIndex,
                                  )
                                }
                                className="w-full flex items-center gap-2 p-3 text-left text-sm font-medium hover:bg-muted/50 transition-colors"
                              >
                                {isExpanded ? (
                                  <ChevronDown className="h-4 w-4 text-primary shrink-0" />
                                ) : (
                                  <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                                )}
                                <span>{item.question}</span>
                              </button>
                              {isExpanded && (
                                <div className="px-3 pb-3 pt-0 ml-6">
                                  <p className="text-sm text-muted-foreground leading-relaxed">
                                    {item.answer}
                                  </p>
                                  {item.link && (
                                    <Link
                                      href={item.link.href}
                                      onClick={() => setIsOpen(false)}
                                      className="inline-flex items-center gap-1 mt-2 text-xs font-medium text-primary hover:underline"
                                    >
                                      <ExternalLink className="h-3 w-3" />
                                      {item.link.label}
                                    </Link>
                                  )}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
            </div>

            <div className="p-4 border-t bg-muted/30">
              <p className="text-xs text-muted-foreground text-center">
                Besoin de plus d'aide ? Contactez-nous à{" "}
                <a
                  href="mailto:support@daylora.com"
                  className="text-primary hover:underline"
                >
                  support@daylora.com
                </a>
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
