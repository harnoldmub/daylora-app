import { Link, useLocation } from "wouter";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

type LegalKey = "mentions-legales" | "confidentialite" | "cgu" | "cookies";

const CONTENT: Record<LegalKey, { title: string; sections: { heading?: string; paragraphs: string[] }[] }> = {
  "mentions-legales": {
    title: "Mentions légales",
    sections: [
      {
        heading: "Éditeur du site",
        paragraphs: [
          "Le site daylora.app est édité par Daylora (forme juridique en cours d'immatriculation — SAS ou auto-entrepreneur).",
          "Siège social : France.",
          "Directeur de la publication : l'équipe fondatrice de Daylora.",
          "Contact : support@daylora.app",
        ],
      },
      {
        heading: "Hébergeur",
        paragraphs: [
          "Le site est hébergé par Replit, Inc. — 350 Bush Street, Suite 900, San Francisco, CA 94104, États-Unis.",
          "Les données de paiement sont traitées par Stripe, Inc. — 354 Oyster Point Blvd, South San Francisco, CA 94080, États-Unis.",
        ],
      },
      {
        heading: "Propriété intellectuelle",
        paragraphs: [
          "L'ensemble du contenu du site (textes, graphismes, logos, icônes, images, clips vidéo) est la propriété exclusive de Daylora ou de ses partenaires et est protégé par les lois françaises et internationales relatives à la propriété intellectuelle.",
          "Toute reproduction, représentation, modification ou exploitation non autorisée de tout ou partie du site est interdite.",
        ],
      },
    ],
  },
  confidentialite: {
    title: "Politique de confidentialité",
    sections: [
      {
        heading: "Responsable du traitement",
        paragraphs: [
          "Le responsable du traitement des données personnelles est Daylora. Contact : support@daylora.app.",
        ],
      },
      {
        heading: "Données collectées",
        paragraphs: [
          "Dans le cadre de l'utilisation de la plateforme Daylora, nous collectons les données suivantes :",
          "• Données d'inscription : adresse e-mail, mot de passe (haché), nom et prénom.",
          "• Données de mariage : noms des mariés, date et lieu de l'événement, photos uploadées.",
          "• Données des invités : nom, prénom, réponse RSVP, nombre de personnes, régime alimentaire, messages.",
          "• Données de paiement : les transactions sont traitées par Stripe. Daylora ne stocke aucun numéro de carte bancaire.",
          "• Données techniques : adresse IP, type de navigateur, pages visitées (à des fins de sécurité uniquement).",
        ],
      },
      {
        heading: "Base légale du traitement",
        paragraphs: [
          "Le traitement de vos données repose sur :",
          "• Le consentement : lors de l'inscription et de l'utilisation volontaire du service.",
          "• L'exécution du contrat : pour fournir le service de création de site de mariage.",
          "• L'intérêt légitime : pour la sécurité du service et la prévention des abus.",
        ],
      },
      {
        heading: "Destinataires des données",
        paragraphs: [
          "Vos données sont accessibles uniquement par :",
          "• L'équipe technique de Daylora (maintenance et support).",
          "• Stripe (traitement des paiements).",
          "• L'hébergeur (stockage sécurisé).",
          "Vos données ne sont jamais vendues ni transmises à des tiers à des fins commerciales ou publicitaires.",
        ],
      },
      {
        heading: "Durée de conservation",
        paragraphs: [
          "Les données liées à votre compte sont conservées pendant toute la durée de votre utilisation du service, puis supprimées dans un délai de 12 mois après la clôture de votre compte.",
          "Les données de facturation sont conservées 10 ans conformément aux obligations comptables françaises.",
        ],
      },
      {
        heading: "Vos droits",
        paragraphs: [
          "Conformément au Règlement Général sur la Protection des Données (RGPD), vous disposez des droits suivants :",
          "• Droit d'accès : obtenir une copie de vos données personnelles.",
          "• Droit de rectification : corriger des données inexactes ou incomplètes.",
          "• Droit de suppression : demander l'effacement de vos données.",
          "• Droit à la portabilité : recevoir vos données dans un format structuré et lisible.",
          "• Droit d'opposition : vous opposer au traitement de vos données.",
          "• Droit à la limitation : restreindre le traitement dans certains cas.",
          "Pour exercer ces droits, contactez-nous à : support@daylora.app.",
          "Vous pouvez également introduire une réclamation auprès de la CNIL (www.cnil.fr).",
        ],
      },
      {
        heading: "Cookies",
        paragraphs: [
          "Pour plus d'informations sur les cookies utilisés, consultez notre page dédiée aux Cookies.",
        ],
      },
    ],
  },
  cgu: {
    title: "Conditions générales d'utilisation",
    sections: [
      {
        heading: "Objet",
        paragraphs: [
          "Les présentes Conditions Générales d'Utilisation (CGU) régissent l'accès et l'utilisation de la plateforme Daylora, accessible à l'adresse daylora.app.",
          "Daylora est un service en ligne permettant de créer et gérer un site de mariage personnalisé, incluant la gestion des invités (RSVP), une cagnotte en ligne, une liste de cadeaux et des fonctionnalités interactives.",
        ],
      },
      {
        heading: "Inscription et compte utilisateur",
        paragraphs: [
          "L'inscription est ouverte à toute personne physique majeure. L'utilisateur s'engage à fournir des informations exactes et à jour.",
          "Chaque utilisateur est responsable de la confidentialité de ses identifiants de connexion. Toute activité réalisée depuis son compte est présumée être de son fait.",
          "Daylora se réserve le droit de suspendre ou supprimer un compte en cas de violation des présentes CGU.",
        ],
      },
      {
        heading: "Utilisation du service",
        paragraphs: [
          "L'utilisateur s'engage à utiliser Daylora conformément à sa destination (organisation de mariage) et dans le respect des lois en vigueur.",
          "Il est interdit de :",
          "• Publier du contenu illicite, diffamatoire, discriminatoire ou portant atteinte aux droits de tiers.",
          "• Utiliser le service à des fins commerciales non autorisées.",
          "• Tenter de compromettre la sécurité ou le fonctionnement de la plateforme.",
        ],
      },
      {
        heading: "Propriété intellectuelle",
        paragraphs: [
          "Le contenu de la plateforme (code, design, textes, logos) est la propriété de Daylora.",
          "Les contenus uploadés par les utilisateurs (photos, textes) restent la propriété de leurs auteurs. L'utilisateur accorde à Daylora une licence limitée pour afficher ces contenus dans le cadre du service.",
        ],
      },
      {
        heading: "Offres et tarification",
        paragraphs: [
          "Daylora propose une offre gratuite et une offre Premium payante. Les tarifs en vigueur sont affichés sur le site.",
          "L'offre Premium est facturée mensuellement avec un engagement minimum de 2 mois. Les paiements sont gérés par Stripe.",
          "Aucun remboursement n'est possible pour les mois déjà consommés.",
        ],
      },
      {
        heading: "Responsabilité",
        paragraphs: [
          "Daylora s'efforce d'assurer la disponibilité et la fiabilité du service mais ne saurait être tenu responsable en cas de :",
          "• Interruption temporaire pour maintenance ou mise à jour.",
          "• Perte de données résultant d'un cas de force majeure.",
          "• Utilisation non conforme du service par l'utilisateur.",
          "La responsabilité de Daylora est limitée au montant des sommes versées par l'utilisateur au cours des 12 derniers mois.",
        ],
      },
      {
        heading: "Résiliation",
        paragraphs: [
          "L'utilisateur peut supprimer son compte à tout moment depuis les paramètres de son tableau de bord.",
          "Daylora se réserve le droit de résilier un compte sans préavis en cas de violation grave des CGU.",
          "En cas de résiliation, les données de l'utilisateur seront supprimées dans un délai de 30 jours, sauf obligation légale de conservation.",
        ],
      },
      {
        heading: "Droit applicable et juridiction",
        paragraphs: [
          "Les présentes CGU sont soumises au droit français.",
          "En cas de litige, les parties s'engagent à rechercher une solution amiable avant toute action judiciaire. À défaut, les tribunaux compétents de Paris seront seuls compétents.",
        ],
      },
    ],
  },
  cookies: {
    title: "Politique de cookies",
    sections: [
      {
        heading: "Qu'est-ce qu'un cookie ?",
        paragraphs: [
          "Un cookie est un petit fichier texte déposé sur votre terminal (ordinateur, smartphone, tablette) lors de la visite d'un site web. Il permet au site de mémoriser des informations sur votre visite.",
        ],
      },
      {
        heading: "Cookies utilisés par Daylora",
        paragraphs: [
          "Daylora utilise exclusivement des cookies strictement nécessaires au fonctionnement du service :",
          "• connect.sid : cookie de session permettant de maintenir votre connexion authentifiée. Durée : session du navigateur.",
          "• Cookies Stripe : déposés par Stripe lors d'un paiement pour assurer la sécurité de la transaction (prévention de la fraude). Ces cookies sont strictement nécessaires au traitement du paiement.",
        ],
      },
      {
        heading: "Cookies analytics et marketing",
        paragraphs: [
          "À ce jour, Daylora n'utilise aucun cookie d'analyse d'audience (analytics) ni aucun cookie publicitaire ou de marketing.",
          "En conséquence, aucune bannière de consentement aux cookies n'est affichée, conformément aux recommandations de la CNIL : les cookies strictement nécessaires ne requièrent pas de consentement préalable.",
          "Si Daylora venait à intégrer des outils d'analyse ou de marketing à l'avenir, une bannière de consentement conforme au RGPD serait mise en place avant tout dépôt de cookies non essentiels.",
        ],
      },
      {
        heading: "Comment gérer les cookies ?",
        paragraphs: [
          "Vous pouvez configurer votre navigateur pour refuser les cookies. Toutefois, le refus des cookies strictement nécessaires peut empêcher le bon fonctionnement du service (notamment la connexion).",
          "Voici comment gérer les cookies dans les principaux navigateurs :",
          "• Chrome : Paramètres > Confidentialité et sécurité > Cookies et autres données de site.",
          "• Firefox : Paramètres > Vie privée et sécurité > Cookies et données de sites.",
          "• Safari : Préférences > Confidentialité > Cookies et données de sites web.",
          "• Edge : Paramètres > Cookies et autorisations de site.",
        ],
      },
      {
        heading: "Contact",
        paragraphs: [
          "Pour toute question relative aux cookies, contactez-nous à : support@daylora.app.",
        ],
      },
    ],
  },
};

export default function MarketingLegalPage() {
  const [location] = useLocation();
  const legalSlug = location.replace(/^\//, "") || "mentions-legales";

  const key = legalSlug as LegalKey;
  const content = CONTENT[key] || CONTENT["mentions-legales"];

  return (
    <div className="min-h-screen bg-[#F6F1EA] text-[#2b2320]">
      <div className="max-w-3xl mx-auto px-6 py-20 space-y-8">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-serif font-bold tracking-tight">{content.title}</h1>
            <p className="text-sm text-[#7A6B5E] mt-2">
              Dernière mise à jour : février 2026
            </p>
          </div>
          <Button asChild variant="outline" className="rounded-full border-[#E9DFD2] hover:bg-white">
            <Link href="/">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Retour
            </Link>
          </Button>
        </div>

        {content.sections.map((section, idx) => (
          <Card key={idx} className="p-8 md:p-10 rounded-3xl border-[#E9DFD2] bg-white/80 space-y-4">
            {section.heading && (
              <h2 className="text-xl font-serif font-bold tracking-tight">{section.heading}</h2>
            )}
            {section.paragraphs.map((p, pIdx) => (
              <p key={pIdx} className="text-sm md:text-base text-[#2b2320]/90 leading-relaxed">
                {p}
              </p>
            ))}
          </Card>
        ))}

        <div className="text-center pt-8">
          <p className="text-xs text-[#8C7A6B]">© 2026 Daylora — support@daylora.app</p>
        </div>
      </div>
    </div>
  );
}
