import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";
import { Link, useLocation } from "wouter";

export default function NotFound() {
  const [path] = useLocation();

  const homeHref = (() => {
    const parts = path.split("?")[0].split("#")[0].split("/").filter(Boolean);
    if (!parts.length) return "/";
    if (parts[0] === "preview" && parts[1]) return `/preview/${parts[1]}`;
    return `/${parts[0]}`;
  })();

  return (
    <div className="w-full flex flex-1 items-center justify-center bg-background py-16">
      <Card className="w-full max-w-md mx-4">
        <CardContent className="pt-6">
          <div className="flex mb-4 gap-2 items-center">
            <AlertCircle className="h-8 w-8 text-red-500 shrink-0" />
            <h1 className="text-2xl font-bold text-gray-900">Mariage introuvable</h1>
          </div>

          <p className="mt-4 text-sm text-gray-600">
            Cette page n'existe pas ou a été déplacée.
          </p>

          <div className="mt-6">
            <Link
              href={homeHref}
              className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              Retour à l'accueil
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
