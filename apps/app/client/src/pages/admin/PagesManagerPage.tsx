import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useWedding } from "@/hooks/use-api";
import { useParams, Link } from "wouter";
import { LayoutPanelTop, ListTree, Palette } from "lucide-react";

const CORE_PAGES = [
  { key: "rsvp", label: "RSVP", path: "rsvp" },
  { key: "cagnotte", label: "Cagnotte", path: "cagnotte" },
  { key: "live", label: "Live", path: "live" },
  { key: "story", label: "Histoire", path: "story" },
  { key: "location", label: "Lieux & acces", path: "location" },
  { key: "program", label: "Deroule", path: "program" },
] as const;

export default function PagesManagerPage() {
  const { weddingId } = useParams<{ weddingId: string }>();
  const { data: wedding, isLoading } = useWedding(weddingId);

  if (isLoading || !wedding) {
    return <div className="animate-pulse h-64 bg-muted rounded-xl" />;
  }

  const navigation = wedding.config?.navigation;
  const pages = navigation?.pages || {};
  const customPages = navigation?.customPages || [];

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-serif font-bold">Pages du site</h1>
          <p className="text-muted-foreground mt-1">
            Vue d'ensemble des pages actives et de la navigation publique.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link href={`/app/${wedding.id}/design`}>
            <Button variant="outline">
              <Palette className="h-4 w-4 mr-2" />
              Studio design
            </Button>
          </Link>
          <Link href={`/app/${wedding.id}/site`}>
            <Button>
              <ListTree className="h-4 w-4 mr-2" />
              Configurer menus
            </Button>
          </Link>
        </div>
      </div>

      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <LayoutPanelTop className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold">Pages principales</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {CORE_PAGES.map((item) => {
            const enabled = pages[item.key] ?? true;
            const publicPath = `/${wedding.slug}/${item.path}`;
            return (
              <div key={item.key} className="rounded-xl border p-4 flex items-center justify-between">
                <div>
                  <div className="font-medium">{item.label}</div>
                  <div className="text-xs text-muted-foreground">{publicPath}</div>
                </div>
                <Badge variant={enabled ? "default" : "outline"}>
                  {enabled ? "Actif" : "Masque"}
                </Badge>
              </div>
            );
          })}
        </div>
      </Card>

      <Card className="p-6">
        <h2 className="text-lg font-semibold mb-4">Pages personnalisees</h2>
        {customPages.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Aucune page personnalisee. Ajoutez des pages dans "Site & Menus".
          </p>
        ) : (
          <div className="space-y-3">
            {customPages.map((page) => (
              <div key={page.id} className="rounded-xl border p-4 flex items-center justify-between">
                <div>
                  <div className="font-medium">{page.title}</div>
                  <div className="text-xs text-muted-foreground">/{wedding.slug}/page/{page.slug}</div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={page.enabled ? "default" : "outline"}>
                    {page.enabled ? "Active" : "Inactive"}
                  </Badge>
                  <Badge variant={page.showInMenu ? "secondary" : "outline"}>
                    {page.showInMenu ? "Menu" : "Hors menu"}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
