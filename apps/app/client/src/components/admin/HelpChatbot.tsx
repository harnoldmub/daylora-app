import { useState, useMemo } from "react";
import {
  HelpCircle,
  X,
  Search,
  ChevronRight,
  ChevronDown,
  Palette,
  Users,
  Gift,
  Share2,
  CreditCard,
  FileText,
  ExternalLink,
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
    category: "Édition",
    question: "Comment modifier les textes de mon site ?",
    answer:
      "Rendez-vous dans la page Design, puis ouvrez la section que vous souhaitez modifier (Hero, Programme, Histoire…). Vous pouvez modifier chaque texte directement dans les champs correspondants. Les changements sont sauvegardés automatiquement.",
    link: { label: "Aller au Design", href: "/design" },
  },
  {
    category: "Édition",
    question: "Comment modifier en live sur mon site ?",
    answer:
      "Depuis la page Design, cliquez sur « Modifier en live » dans la barre supérieure. Vous pourrez éditer les textes directement sur votre site en cliquant dessus. Les modifications sont enregistrées instantanément.",
    link: { label: "Aller au Design", href: "/design" },
  },
  {
    category: "Design",
    question: "Comment changer les couleurs et polices ?",
    answer:
      "Dans la page Design, ouvrez la section « Couleurs & Polices ». Vous pouvez choisir parmi des palettes prédéfinies ou personnaliser chaque couleur individuellement. Les polices sont également modifiables pour les titres et le texte courant.",
    link: { label: "Aller au Design", href: "/design" },
  },
  {
    category: "Design",
    question: "Comment changer de template ?",
    answer:
      "Rendez-vous dans la page Templates pour voir les modèles disponibles : Classique, Moderne et Minimal. Cliquez sur celui qui vous plaît pour l'appliquer. Certains templates sont réservés aux abonnements Premium.",
    link: { label: "Voir les Templates", href: "/templates" },
  },
  {
    category: "Design",
    question: "Comment ajouter ou changer mon logo ?",
    answer:
      "Dans la page Design, section « Logo & Identité », vous pouvez télécharger votre logo personnalisé. Formats acceptés : PNG, JPG, SVG. Taille recommandée : 200×200 pixels minimum.",
    link: { label: "Aller au Design", href: "/design" },
  },
  {
    category: "Invités",
    question: "Comment ajouter des invités ?",
    answer:
      "Allez dans la page Invités, puis cliquez sur « Ajouter un invité ». Remplissez le nom, l'email et le nombre d'accompagnants. Vous pouvez aussi importer une liste depuis un fichier CSV.",
    link: { label: "Gérer les Invités", href: "/guests" },
  },
  {
    category: "Invités",
    question: "Comment gérer les RSVP ?",
    answer:
      "Les réponses RSVP apparaissent automatiquement dans la page Invités. Vous pouvez voir qui a confirmé, décliné ou n'a pas encore répondu. Le tableau de bord affiche un récapitulatif en temps réel.",
    link: { label: "Voir les Invités", href: "/guests" },
  },
  {
    category: "Partage",
    question: "Comment partager mon site de mariage ?",
    answer:
      "Votre site est accessible via un lien unique basé sur votre slug (ex: nocely.com/votre-slug). Vous pouvez le partager par email, WhatsApp ou sur les réseaux sociaux. Retrouvez le lien depuis le bouton « Voir le site » en haut de page.",
  },
  {
    category: "Partage",
    question: "Comment envoyer des invitations ?",
    answer:
      "Depuis la page Invités, vous pouvez envoyer des invitations par email à vos invités. Chaque invité reçoit un lien personnalisé vers votre site avec son nom pré-rempli pour le RSVP.",
    link: { label: "Gérer les Invités", href: "/guests" },
  },
  {
    category: "Cadeaux",
    question: "Comment gérer la liste de cadeaux ?",
    answer:
      "Dans la page Cadeaux, ajoutez les cadeaux souhaités avec un nom, une description et un prix suggéré. Vos invités pourront les consulter et contribuer directement depuis votre site de mariage.",
    link: { label: "Gérer les Cadeaux", href: "/gifts" },
  },
  {
    category: "Cadeaux",
    question: "Comment fonctionne la cagnotte en ligne ?",
    answer:
      "La cagnotte permet à vos invités de contribuer financièrement à votre projet (voyage de noces, etc.). Les paiements sont sécurisés via Stripe. Vous recevez les fonds directement sur votre compte.",
    link: { label: "Gérer les Cadeaux", href: "/gifts" },
  },
  {
    category: "Abonnement",
    question: "Comment passer au plan Premium ?",
    answer:
      "Rendez-vous dans la page Facturation pour découvrir les avantages du plan Premium : templates exclusifs, nombre d'invités illimité, domaine personnalisé et plus encore. Le paiement est sécurisé.",
    link: { label: "Voir les Tarifs", href: "/billing" },
  },
  {
    category: "Abonnement",
    question: "Quelles sont les différences entre les plans ?",
    answer:
      "Le plan Gratuit inclut le template Classique, jusqu'à 50 invités et les fonctionnalités de base. Le plan Premium débloque tous les templates, un nombre d'invités illimité, la cagnotte en ligne, l'envoi d'emails et la personnalisation avancée.",
    link: { label: "Comparer les Plans", href: "/billing" },
  },
  {
    category: "Pages",
    question: "Comment ajouter des pages personnalisées ?",
    answer:
      "Depuis la page Pages, vous pouvez créer des pages supplémentaires pour votre site (hébergement, activités, informations pratiques…). Chaque page peut contenir du texte enrichi et des images.",
    link: { label: "Gérer les Pages", href: "/pages" },
  },
  {
    category: "Pages",
    question: "Comment configurer le menu de mon site ?",
    answer:
      "Dans Site & Menus, vous pouvez choisir quelles sections afficher, réorganiser le menu de navigation et activer/désactiver des pages. Cela vous permet de personnaliser entièrement la structure de votre site.",
    link: { label: "Configurer le Site", href: "/site" },
  },
];

const categories = Array.from(new Set(faqItems.map((item) => item.category)));

const categoryIcons: Record<string, typeof Palette> = {
  Édition: FileText,
  Design: Palette,
  Invités: Users,
  Partage: Share2,
  Cadeaux: Gift,
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
                  href="mailto:support@nocely.com"
                  className="text-primary hover:underline"
                >
                  support@nocely.com
                </a>
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
