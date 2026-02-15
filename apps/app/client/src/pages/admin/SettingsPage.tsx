import { useEffect, useState } from "react";
import { useParams } from "wouter";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { useWedding, useUpdateWedding } from "@/hooks/use-api";
import { motion } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import { useLocation } from "wouter";
import { useMemo } from "react";

type SiteConfig = {
  appBaseUrl: string;
  marketingBaseUrl: string;
};

export default function SettingsPage() {
  const { weddingId } = useParams<{ weddingId: string }>();
  const { data: wedding } = useWedding(weddingId);
  const updateWedding = useUpdateWedding();
  const { toast } = useToast();
  const [siteConfig, setSiteConfig] = useState<SiteConfig | null>(null);
  const { user, logoutMutation } = useAuth();
  const [, setLocation] = useLocation();
  const [previewToken, setPreviewToken] = useState<number>(Date.now());

  const [slug, setSlug] = useState("");
  const [title, setTitle] = useState("");
  const [isPublished, setIsPublished] = useState(false);
  const [features, setFeatures] = useState({
    cagnotteEnabled: true,
    giftsEnabled: true,
    jokesEnabled: true,
  });

  const templates = [
    { id: "classic", name: "Classique" },
    { id: "modern", name: "Moderne" },
    { id: "minimal", name: "Minimal" },
  ];

  useEffect(() => {
    if (!wedding) return;
    setSlug(wedding.slug);
    setTitle(wedding.title);
    setIsPublished(wedding.isPublished);
    setFeatures({
      cagnotteEnabled: !!wedding.config?.features?.cagnotteEnabled,
      giftsEnabled: !!wedding.config?.features?.giftsEnabled,
      jokesEnabled: !!wedding.config?.features?.jokesEnabled,
    });
  }, [wedding]);

  useEffect(() => {
    fetch("/api/site-config")
      .then((r) => r.json())
      .then(setSiteConfig)
      .catch(() => null);
  }, []);

  if (!wedding) {
    return (
      <div className="p-6">
        <Card className="p-6">
          <p className="text-sm text-muted-foreground">Chargement des paramètres du mariage…</p>
        </Card>
      </div>
    );
  }

  const publicUrl = siteConfig ? `${siteConfig.marketingBaseUrl}/${slug || wedding.id}` : `/${slug || wedding.id}`;
  const appOrigin = typeof window !== "undefined" ? window.location.origin : (siteConfig?.appBaseUrl || "http://localhost:5174");
  const previewUrl = useMemo(() => `${appOrigin}/preview/${slug || wedding.id}?t=${previewToken}`, [appOrigin, slug, wedding.id, previewToken]);

  const handleSave = async () => {
    try {
      await updateWedding.mutateAsync({
        id: wedding.id,
        title,
        slug,
        isPublished,
        templateId: wedding.templateId,
        config: {
          ...wedding.config,
          features: {
            ...wedding.config.features,
            ...features,
          },
        },
      });
      setPreviewToken(Date.now());
      toast({ title: "Paramètres enregistrés" });
    } catch {
      toast({ title: "Erreur", description: "Impossible d'enregistrer", variant: "destructive" });
    }
  };

    return (
        <div className="space-y-8">
            <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-serif font-bold">Paramètres</h1>
                    <p className="text-muted-foreground mt-1">Gérez les informations et modules de votre site.</p>
                </div>
                <div className="text-xs text-muted-foreground">Dernière mise à jour : {new Date().toLocaleDateString("fr-FR")}</div>
            </div>

            <Card className="p-6 space-y-4">
                <h2 className="text-lg font-medium">Informations</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Titre du mariage</label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Slug public</label>
            <Input value={slug} onChange={(e) => setSlug(e.target.value)} />
          </div>
        </div>
        <div className="text-sm text-muted-foreground">
          URL publique:{" "}
          <a className="font-medium text-primary hover:underline" href={publicUrl} target="_blank" rel="noopener noreferrer">
            {publicUrl}
          </a>
        </div>
      </Card>

            <Card className="p-6 space-y-4">
                <h2 className="text-lg font-medium">Compte</h2>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <p className="font-medium">Session</p>
            <p className="text-sm text-muted-foreground">
              {user?.email ? `Connecté en tant que ${user.email}` : "Non connecté"}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              onClick={() => setLocation("/app/login")}
            >
              Se connecter
            </Button>
            <Button
              onClick={() => logoutMutation.mutate()}
              variant="destructive"
            >
              Se déconnecter
            </Button>
          </div>
        </div>
      </Card>

            <Card className="p-6 space-y-4">
                <h2 className="text-lg font-medium">Template public</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {templates.map((t) => (
            <button
              key={t.id}
              className={`rounded-lg border p-4 text-left transition ${wedding.templateId === t.id
                ? "border-primary bg-primary/5"
                : "border-border hover:border-primary/50"
                }`}
              onClick={async () => {
                await updateWedding.mutateAsync({ id: wedding.id, templateId: t.id });
                setPreviewToken(Date.now());
                toast({ title: "Template mis à jour" });
              }}
            >
              <div className="text-sm font-medium">{t.name}</div>
              <div className="text-xs text-muted-foreground">Id: {t.id}</div>
            </button>
          ))}
        </div>
      </Card>

            <Card className="p-6 space-y-4">
                <h2 className="text-lg font-medium">Publication</h2>
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium">Site publié</p>
            <p className="text-sm text-muted-foreground">Rendez le site accessible aux invités</p>
          </div>
          <Switch checked={isPublished} onCheckedChange={setIsPublished} />
        </div>
      </Card>

            <Card className="p-6 space-y-4">
                <h2 className="text-lg font-medium">Modules</h2>
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium">Cagnotte</p>
            <p className="text-sm text-muted-foreground">Activer la page de contribution</p>
          </div>
          <Switch
            checked={features.cagnotteEnabled}
            onCheckedChange={(v) => setFeatures({ ...features, cagnotteEnabled: v })}
          />
        </div>
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium">Liste cadeaux</p>
            <p className="text-sm text-muted-foreground">Activer les cadeaux</p>
          </div>
          <Switch
            checked={features.giftsEnabled}
            onCheckedChange={(v) => setFeatures({ ...features, giftsEnabled: v })}
          />
        </div>
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium">Blagues live</p>
            <p className="text-sm text-muted-foreground">Activer le module live</p>
          </div>
          <Switch
            checked={features.jokesEnabled}
            onCheckedChange={(v) => setFeatures({ ...features, jokesEnabled: v })}
          />
        </div>
      </Card>

            <Card className="p-6 space-y-4">
                <h2 className="text-lg font-medium">Text Preview</h2>
        <p className="text-sm text-muted-foreground">Aperçu rapide des textes principaux.</p>
        <div className="rounded-xl border bg-background p-6">
          <motion.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-3xl md:text-4xl font-serif font-bold"
          >
            {wedding.config?.texts?.heroTitle || wedding.title}
          </motion.h1>
          <p className="text-muted-foreground mt-2">
            {wedding.config?.texts?.heroSubtitle || "Le Mariage de"} {wedding.title}
          </p>
          <p className="mt-4 text-sm uppercase tracking-widest text-primary">
            {wedding.config?.texts?.weddingDate || "19 & 21 mars 2026"}
          </p>
        </div>
      </Card>

            <Card className="p-6 space-y-4">
                <h2 className="text-lg font-medium">Preview complet</h2>
        <p className="text-sm text-muted-foreground">Aperçu du site public (miniature).</p>
        <div className="rounded-xl border bg-background overflow-hidden">
          <div className="bg-muted/40 px-4 py-2 text-xs text-muted-foreground">
            {previewUrl}
          </div>
          <div className="w-full overflow-auto bg-[#F7F3EE]">
            <div className="origin-top-left scale-[0.7] md:scale-[0.8] w-[140%] md:w-[125%]">
              <iframe
                src={previewUrl}
                title="Preview public"
                className="w-full h-[700px] border-0"
              />
            </div>
          </div>
        </div>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSave}>Enregistrer</Button>
      </div>
    </div>
  );
}
