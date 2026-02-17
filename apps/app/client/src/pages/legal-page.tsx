import { useMemo } from "react";
import { Link, useParams } from "wouter";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

type LegalKey = "mentions-legales" | "confidentialite" | "cgu" | "cookies";

const CONTENT: Record<LegalKey, { title: string; body: string[] }> = {
  "mentions-legales": {
    title: "Mentions légales",
    body: [
      "Éditeur: Ce site est édité par les mariés.",
      "Hébergement: Service d'hébergement tiers.",
      "Contact: Utilisez les coordonnées indiquées dans le footer du site.",
    ],
  },
  confidentialite: {
    title: "Politique de confidentialité",
    body: [
      "Nous collectons uniquement les informations nécessaires à l'organisation (RSVP, messages, etc.).",
      "Vos données ne sont jamais revendues.",
      "Vous pouvez demander la suppression de vos données auprès des mariés.",
    ],
  },
  cgu: {
    title: "Conditions générales d'utilisation",
    body: [
      "Le site est fourni tel quel dans le cadre de l'événement.",
      "Toute utilisation abusive peut entraîner un blocage.",
    ],
  },
  cookies: {
    title: "Cookies",
    body: [
      "Ce site peut utiliser des cookies techniques (session, sécurité).",
      "Aucun cookie publicitaire n'est utilisé par défaut.",
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
  const { slug, legalSlug } = useParams<{ slug: string; legalSlug: string }>();
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
              Informations liées au site de l'événement.
            </p>
          </div>
          <Button asChild variant="outline" className="rounded-full">
            <Link href={basePath}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Retour
            </Link>
          </Button>
        </div>

        <Card className="p-8 md:p-10 rounded-3xl space-y-4">
          {content.body.map((p, idx) => (
            <p key={idx} className="text-sm md:text-base text-foreground/90 leading-relaxed">
              {p}
            </p>
          ))}
        </Card>
      </div>
    </div>
  );
}

