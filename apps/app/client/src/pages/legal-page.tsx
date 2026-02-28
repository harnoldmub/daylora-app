import { useMemo } from "react";
import { Link, useParams } from "wouter";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

type LegalKey = "mentions-legales" | "confidentialite" | "cgu" | "cookies";

interface LegalSection {
  heading?: string;
  paragraphs: string[];
}

interface LegalContent {
  title: string;
  subtitle: string;
  lastUpdated: string;
  sections: LegalSection[];
}

const CONTENT: Record<LegalKey, LegalContent> = {
  "mentions-legales": {
    title: "Mentions légales",
    subtitle: "Informations légales relatives au site Daylora.",
    lastUpdated: "Février 2026",
    sections: [
      {
        heading: "1. Éditeur du site",
        paragraphs: [
          "Le site Daylora (accessible à l'adresse daylora.app) est édité par Daylora, société en cours d'immatriculation (SAS / auto-entrepreneur).",
          "Siège social : Paris, France.",
          "Email de contact : support@daylora.app",
          "Directeur de la publication : L'équipe Daylora.",
        ],
      },
      {
        heading: "2. Hébergeur",
        paragraphs: [
          "Le site est hébergé par Replit, Inc., 350 Bush Street, Suite 900, San Francisco, CA 94104, États-Unis.",
          "Site web : https://replit.com",
        ],
      },
      {
        heading: "3. Propriété intellectuelle",
        paragraphs: [
          "L'ensemble du contenu du site Daylora (textes, graphismes, logos, icônes, images, logiciels) est la propriété exclusive de Daylora ou de ses partenaires et est protégé par les lois françaises et internationales relatives à la propriété intellectuelle.",
          "Toute reproduction, représentation, modification, publication ou adaptation de tout ou partie des éléments du site est interdite sans l'autorisation écrite préalable de Daylora.",
        ],
      },
      {
        heading: "4. Données personnelles",
        paragraphs: [
          "Pour toute question relative au traitement de vos données personnelles, veuillez consulter notre Politique de confidentialité ou nous contacter à support@daylora.app.",
        ],
      },
      {
        heading: "5. Crédits",
        paragraphs: [
          "Conception et développement : Daylora.",
          "Photographies : fournies par les utilisateurs ou issues de banques d'images libres de droits.",
        ],
      },
    ],
  },
  confidentialite: {
    title: "Politique de confidentialité",
    subtitle: "Comment nous protégeons vos données personnelles.",
    lastUpdated: "Février 2026",
    sections: [
      {
        heading: "1. Responsable du traitement",
        paragraphs: [
          "Le responsable du traitement des données personnelles est Daylora, joignable à l'adresse support@daylora.app.",
        ],
      },
      {
        heading: "2. Données collectées",
        paragraphs: [
          "Dans le cadre de l'utilisation de nos services, nous collectons les données suivantes :",
          "• Données d'inscription : adresse email, nom et prénom.",
          "• Données de mariage : noms des mariés, date et lieu de l'événement, informations du programme.",
          "• Données des invités : nom, prénom, email, réponses RSVP (présence, nombre d'accompagnants, restrictions alimentaires, message).",
          "• Données de contribution : montant, nom du contributeur, message (dans le cadre de la cagnotte).",
          "• Données techniques : adresse IP, type de navigateur, pages visitées (logs serveur uniquement, aucun outil d'analyse tiers).",
        ],
      },
      {
        heading: "3. Base légale du traitement",
        paragraphs: [
          "Nous traitons vos données sur les bases légales suivantes :",
          "• Consentement : lorsque vous vous inscrivez et fournissez volontairement vos informations.",
          "• Exécution du contrat : les données nécessaires à la fourniture du service (gestion du mariage, RSVP, cagnotte).",
          "• Intérêt légitime : amélioration du service et sécurité de la plateforme.",
        ],
      },
      {
        heading: "4. Destinataires des données",
        paragraphs: [
          "Vos données personnelles sont accessibles uniquement :",
          "• À l'équipe Daylora (support technique et administration).",
          "• Aux organisateurs du mariage (mariés) pour les données liées à leur événement.",
          "• À Stripe (prestataire de paiement) pour les transactions financières.",
          "Nous ne vendons, ne louons et ne partageons jamais vos données avec des tiers à des fins commerciales ou publicitaires.",
        ],
      },
      {
        heading: "5. Durée de conservation",
        paragraphs: [
          "• Données de compte : conservées tant que votre compte est actif. Supprimées dans un délai de 30 jours après la demande de suppression du compte.",
          "• Données de mariage et invités : conservées pendant 12 mois après la date de l'événement, puis supprimées automatiquement sauf demande contraire.",
          "• Données de paiement : conservées conformément aux obligations légales comptables (10 ans pour les factures).",
          "• Logs techniques : conservés 12 mois maximum.",
        ],
      },
      {
        heading: "6. Vos droits",
        paragraphs: [
          "Conformément au Règlement Général sur la Protection des Données (RGPD), vous disposez des droits suivants :",
          "• Droit d'accès : obtenir une copie de vos données personnelles.",
          "• Droit de rectification : corriger des données inexactes ou incomplètes.",
          "• Droit de suppression : demander l'effacement de vos données.",
          "• Droit à la portabilité : recevoir vos données dans un format structuré et lisible par machine.",
          "• Droit d'opposition : vous opposer au traitement de vos données pour des motifs légitimes.",
          "• Droit de limitation : demander la limitation du traitement dans certaines circonstances.",
          "Pour exercer ces droits, contactez-nous à : support@daylora.app. Nous nous engageons à répondre dans un délai de 30 jours.",
          "Vous pouvez également introduire une réclamation auprès de la CNIL (Commission Nationale de l'Informatique et des Libertés) : www.cnil.fr.",
        ],
      },
      {
        heading: "7. Cookies",
        paragraphs: [
          "Pour les informations relatives à l'utilisation des cookies, veuillez consulter notre page dédiée aux Cookies.",
        ],
      },
      {
        heading: "8. Sécurité",
        paragraphs: [
          "Nous mettons en œuvre des mesures techniques et organisationnelles appropriées pour protéger vos données personnelles contre l'accès non autorisé, la perte, la destruction ou l'altération. Les connexions sont chiffrées via HTTPS et les mots de passe sont hashés avec des algorithmes sécurisés.",
        ],
      },
      {
        heading: "9. Contact DPO",
        paragraphs: [
          "Pour toute question relative à la protection de vos données personnelles, vous pouvez contacter notre Délégué à la Protection des Données (DPO) à l'adresse : dpo@daylora.app.",
        ],
      },
    ],
  },
  cgu: {
    title: "Conditions générales d'utilisation",
    subtitle: "Conditions régissant l'utilisation du service Daylora.",
    lastUpdated: "Février 2026",
    sections: [
      {
        heading: "1. Objet",
        paragraphs: [
          "Les présentes Conditions Générales d'Utilisation (CGU) ont pour objet de définir les conditions d'accès et d'utilisation du service Daylora, plateforme en ligne de création de sites de mariage, de gestion d'invités et de cagnotte.",
        ],
      },
      {
        heading: "2. Acceptation des CGU",
        paragraphs: [
          "L'utilisation du service Daylora implique l'acceptation pleine et entière des présentes CGU. Si vous n'acceptez pas ces conditions, veuillez ne pas utiliser le service.",
        ],
      },
      {
        heading: "3. Inscription et compte utilisateur",
        paragraphs: [
          "L'accès aux fonctionnalités de gestion nécessite la création d'un compte utilisateur. Vous vous engagez à fournir des informations exactes et à jour lors de votre inscription.",
          "Vous êtes responsable de la confidentialité de vos identifiants de connexion. Toute activité effectuée depuis votre compte est présumée être de votre fait.",
          "Daylora se réserve le droit de suspendre ou supprimer un compte en cas de violation des présentes CGU.",
        ],
      },
      {
        heading: "4. Description du service",
        paragraphs: [
          "Daylora propose les fonctionnalités suivantes :",
          "• Création et personnalisation d'un site de mariage.",
          "• Gestion de la liste d'invités et des RSVP.",
          "• Mise en place d'une liste de cadeaux et/ou d'une cagnotte en ligne.",
          "• Envoi d'invitations numériques.",
          "• Outils de gestion du jour J (check-in, animations live).",
          "Le service est proposé en version gratuite avec des fonctionnalités de base, et en version premium avec des fonctionnalités avancées.",
        ],
      },
      {
        heading: "5. Obligations de l'utilisateur",
        paragraphs: [
          "L'utilisateur s'engage à :",
          "• Utiliser le service conformément à sa destination (organisation de mariage ou événement similaire).",
          "• Ne pas publier de contenu illicite, diffamatoire, discriminatoire ou portant atteinte aux droits de tiers.",
          "• Ne pas tenter de perturber le fonctionnement du service (attaques, scraping, etc.).",
          "• Respecter les droits de propriété intellectuelle de Daylora et des tiers.",
          "• Obtenir le consentement des personnes dont les données sont renseignées sur la plateforme (invités, conjoint).",
        ],
      },
      {
        heading: "6. Propriété intellectuelle",
        paragraphs: [
          "Le service Daylora, incluant son code, ses designs, ses templates et ses contenus, est protégé par le droit de la propriété intellectuelle.",
          "L'utilisateur conserve la propriété de ses contenus personnels (photos, textes) téléchargés sur la plateforme. En les publiant, il accorde à Daylora une licence limitée d'hébergement et d'affichage nécessaire au fonctionnement du service.",
        ],
      },
      {
        heading: "7. Responsabilité",
        paragraphs: [
          "Daylora s'efforce d'assurer la disponibilité et le bon fonctionnement du service, sans obligation de résultat.",
          "Daylora ne saurait être tenue responsable :",
          "• Des interruptions temporaires du service pour maintenance ou mises à jour.",
          "• Des contenus publiés par les utilisateurs.",
          "• Des dommages indirects résultant de l'utilisation du service.",
          "• De la perte de données en cas de force majeure.",
        ],
      },
      {
        heading: "8. Cagnotte et paiements",
        paragraphs: [
          "Les transactions financières (cagnotte, abonnement premium) sont traitées par Stripe, prestataire de paiement sécurisé. Daylora n'a pas accès aux informations bancaires complètes des utilisateurs.",
          "Les fonds de la cagnotte sont reversés directement sur le compte Stripe Connect des mariés. Daylora peut prélever une commission sur les transactions, dont le montant est précisé lors de la mise en place de la cagnotte.",
        ],
      },
      {
        heading: "9. Résiliation",
        paragraphs: [
          "L'utilisateur peut supprimer son compte à tout moment depuis les paramètres de son espace personnel ou en contactant support@daylora.app.",
          "Daylora se réserve le droit de résilier un compte sans préavis en cas de violation grave des CGU.",
          "En cas de résiliation, les données personnelles de l'utilisateur seront supprimées conformément à notre Politique de confidentialité.",
        ],
      },
      {
        heading: "10. Modification des CGU",
        paragraphs: [
          "Daylora se réserve le droit de modifier les présentes CGU à tout moment. Les utilisateurs seront informés de toute modification substantielle par email ou notification dans le service. L'utilisation continue du service après modification vaut acceptation des nouvelles conditions.",
        ],
      },
      {
        heading: "11. Droit applicable et juridiction",
        paragraphs: [
          "Les présentes CGU sont régies par le droit français. En cas de litige, et après tentative de résolution amiable, les tribunaux compétents de Paris seront seuls compétents.",
        ],
      },
    ],
  },
  cookies: {
    title: "Politique de cookies",
    subtitle: "Informations sur l'utilisation des cookies sur Daylora.",
    lastUpdated: "Février 2026",
    sections: [
      {
        heading: "1. Qu'est-ce qu'un cookie ?",
        paragraphs: [
          "Un cookie est un petit fichier texte stocké sur votre terminal (ordinateur, tablette, smartphone) lors de la visite d'un site web. Il permet au site de mémoriser certaines informations pour faciliter votre navigation.",
        ],
      },
      {
        heading: "2. Cookies utilisés par Daylora",
        paragraphs: [
          "Daylora utilise exclusivement des cookies strictement nécessaires au fonctionnement du service :",
          "• connect.sid : cookie de session permettant de maintenir votre authentification lors de la navigation. Ce cookie est supprimé à la fermeture du navigateur ou après expiration de la session.",
          "• Cookies Stripe : cookies déposés par notre prestataire de paiement Stripe lors des transactions financières (cagnotte, abonnement premium). Ces cookies sont strictement nécessaires à la sécurité et au bon déroulement des paiements.",
        ],
      },
      {
        heading: "3. Cookies analytiques et marketing",
        paragraphs: [
          "Daylora n'utilise actuellement aucun cookie analytique (type Google Analytics) ni aucun cookie marketing ou publicitaire (type Facebook Pixel).",
          "En conséquence, aucune bannière de consentement aux cookies n'est affichée car tous les cookies utilisés sont strictement nécessaires au fonctionnement du service, conformément à l'article 82 de la loi Informatique et Libertés et aux lignes directrices de la CNIL.",
          "Si des cookies non essentiels devaient être ajoutés à l'avenir, une bannière de consentement serait mise en place conformément à la réglementation en vigueur.",
        ],
      },
      {
        heading: "4. Comment gérer les cookies ?",
        paragraphs: [
          "Vous pouvez à tout moment configurer votre navigateur pour accepter ou refuser les cookies. Veuillez noter que la désactivation des cookies strictement nécessaires peut empêcher le bon fonctionnement du service (impossibilité de se connecter, par exemple).",
          "Voici comment gérer les cookies dans les principaux navigateurs :",
          "• Google Chrome : Paramètres > Confidentialité et sécurité > Cookies et autres données des sites.",
          "• Mozilla Firefox : Paramètres > Vie privée et sécurité > Cookies et données de sites.",
          "• Safari : Préférences > Confidentialité > Cookies et données de sites web.",
          "• Microsoft Edge : Paramètres > Cookies et autorisations de sites > Cookies et données de site.",
        ],
      },
      {
        heading: "5. En savoir plus",
        paragraphs: [
          "Pour en savoir plus sur les cookies et vos droits, vous pouvez consulter le site de la CNIL : www.cnil.fr/fr/cookies-et-autres-traceurs.",
          "Pour toute question, contactez-nous à : support@daylora.app.",
        ],
      },
    ],
  },
};

function getBasePath(slug: string) {
  if (!slug) return "/";
  if (typeof window === "undefined") return `/${slug}`;
  const pathname = window.location.pathname || "";
  const previewPrefix = `/preview/${slug}`;
  return pathname.startsWith(previewPrefix) ? previewPrefix : `/${slug}`;
}

export default function LegalPage() {
  const _params = useParams();
  const slug = (_params as any).slug || (_params as any).weddingId || "";
  const legalSlug = (_params as any).legalSlug || "";
  const basePath = useMemo(() => getBasePath(slug), [slug]);

  const key = (legalSlug || "") as LegalKey;
  const content = CONTENT[key] || CONTENT["mentions-legales"];

  return (
    <div className="min-h-[70vh] px-6 py-16 bg-background">
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-serif font-bold tracking-tight">{content.title}</h1>
            <p className="text-sm text-muted-foreground mt-2">
              {content.subtitle}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Dernière mise à jour : {content.lastUpdated}
            </p>
          </div>
          <Button asChild variant="outline" className="rounded-full">
            <Link href={basePath}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Retour
            </Link>
          </Button>
        </div>

        <Card className="p-8 md:p-10 rounded-3xl space-y-8">
          {content.sections.map((section, sIdx) => (
            <div key={sIdx} className="space-y-3">
              {section.heading && (
                <h2 className="text-lg md:text-xl font-semibold text-foreground">
                  {section.heading}
                </h2>
              )}
              {section.paragraphs.map((p, pIdx) => (
                <p key={pIdx} className="text-sm md:text-base text-foreground/90 leading-relaxed">
                  {p}
                </p>
              ))}
            </div>
          ))}
        </Card>
      </div>
    </div>
  );
}
