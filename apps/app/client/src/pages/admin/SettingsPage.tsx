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
import { Copy, ExternalLink } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { apiRequest } from "@/lib/queryClient";

type SiteConfig = {
  appBaseUrl: string;
  marketingBaseUrl: string;
};

type PaymentSettings = {
  mode: "stripe" | "external";
  externalProvider: string;
  externalUrl: string;
  stripeStatus: "not_connected" | "connected";
  stripeAccountId: string;
  allowManualLiveContributions: boolean;
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
  const [payments, setPayments] = useState<PaymentSettings>({
    mode: "stripe",
    externalProvider: "other",
    externalUrl: "",
    stripeStatus: "not_connected",
    stripeAccountId: "",
    allowManualLiveContributions: true,
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
    setPayments({
      mode: wedding.config?.payments?.mode === "external" ? "external" : "stripe",
      externalProvider: wedding.config?.payments?.externalProvider || "other",
      externalUrl: wedding.config?.payments?.externalUrl || wedding.config?.sections?.cagnotteExternalUrl || "",
      stripeStatus: wedding.config?.payments?.stripeStatus === "connected" ? "connected" : "not_connected",
      stripeAccountId: wedding.config?.payments?.stripeAccountId || "",
      allowManualLiveContributions: wedding.config?.payments?.allowManualLiveContributions ?? true,
    });
  }, [wedding]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const stripe = params.get("stripe");
    if (!stripe) return;
    if (stripe === "connected") toast({ title: "Stripe connecté", description: "Votre compte Stripe est maintenant relié à ce projet." });
    if (stripe === "error") toast({ title: "Connexion Stripe impossible", description: "Réessayez ou vérifiez la configuration Stripe Connect.", variant: "destructive" });
    if (stripe === "invalid_state") toast({ title: "Connexion annulée", description: "La session Stripe Connect n'est plus valide.", variant: "destructive" });
    if (stripe === "expired") toast({ title: "Connexion expirée", description: "Relancez la connexion Stripe Connect.", variant: "destructive" });
    // Clean URL (avoid repeating toasts)
    params.delete("stripe");
    const next = `${window.location.pathname}${params.toString() ? `?${params.toString()}` : ""}`;
    window.history.replaceState({}, "", next);
  }, [toast]);

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
          <p className="text-sm text-muted-foreground">Chargement de la configuration Nocely…</p>
        </Card>
      </div>
    );
  }

  const publicUrl = siteConfig ? `${siteConfig.marketingBaseUrl}/${slug || wedding.id}` : `/${slug || wedding.id}`;
  const appOrigin = typeof window !== "undefined" ? window.location.origin : (siteConfig?.appBaseUrl || "http://localhost:5174");
  const previewUrl = useMemo(() => `${appOrigin}/preview/${slug || wedding.id}?t=${previewToken}`, [appOrigin, slug, wedding.id, previewToken]);

  const handleSave = async () => {
    if (payments.mode === "external" && !payments.externalUrl.trim()) {
      toast({
        title: "Lien manquant",
        description: "Ajoutez l'URL de la cagnotte externe pour continuer.",
        variant: "destructive",
      });
      return;
    }
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
          payments: {
            ...wedding.config.payments,
            ...payments,
          },
          sections: {
            ...wedding.config.sections,
            cagnotteExternalUrl: payments.externalUrl || wedding.config?.sections?.cagnotteExternalUrl || "",
          },
        },
      });
      setPreviewToken(Date.now());
      toast({ title: "Paramètres enregistrés", description: "Vos changements sont en ligne sur la preview." });
    } catch {
      toast({ title: "Enregistrement impossible", description: "Réessayez dans quelques secondes.", variant: "destructive" });
    }
  };

  const copyToClipboard = async (value: string, label: string) => {
    try {
      await navigator.clipboard.writeText(value);
      toast({ title: `${label} copié`, description: "Prêt à partager." });
    } catch {
      toast({ title: "Copie impossible", description: `Impossible de copier ${label.toLowerCase()}.`, variant: "destructive" });
    }
  };

    return (
        <div className="space-y-8">
            <AdminPageHeader
              title="Paramètres"
              description="Centralisez les réglages du site, des modules et de la publication."
              actions={<div className="text-xs text-muted-foreground">Dernière mise à jour : {new Date().toLocaleDateString("fr-FR")}</div>}
            />

            <Card className="p-6 space-y-4">
                <h2 className="text-lg font-medium">Identité du site</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Titre affiché</label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">URL publique (slug)</label>
            <Input value={slug} onChange={(e) => setSlug(e.target.value)} />
          </div>
        </div>
        <div className="text-sm text-muted-foreground">
          Lien public:{" "}
          <a className="font-medium text-primary hover:underline" href={publicUrl} target="_blank" rel="noopener noreferrer">
            {publicUrl}
          </a>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => copyToClipboard(publicUrl, "Lien public")}>
            <Copy className="h-4 w-4 mr-2" />
            Copier le lien public
          </Button>
          <Button variant="outline" asChild>
            <a href={previewUrl} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="h-4 w-4 mr-2" />
              Ouvrir l'aperçu
            </a>
          </Button>
          <Button variant="outline" onClick={() => copyToClipboard(previewUrl, "Lien preview")}>
            <Copy className="h-4 w-4 mr-2" />
            Copier la preview
          </Button>
        </div>
      </Card>

            <Card className="p-6 space-y-4">
                <h2 className="text-lg font-medium">Session</h2>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <p className="font-medium">Compte connecté</p>
            <p className="text-sm text-muted-foreground">
              {user?.email ? `Connecté en tant que ${user.email}` : "Non connecté"}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              onClick={() => setLocation("/app/login")}
            >
              Changer de compte
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
        <p className="text-sm text-muted-foreground">Choisissez la base visuelle qui sera reprise dans le Studio Design.</p>
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
                toast({ title: "Template mis à jour", description: "Le nouveau style est appliqué." });
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
            <p className="text-sm text-muted-foreground">Rend le site accessible via son lien public.</p>
          </div>
          <Switch checked={isPublished} onCheckedChange={setIsPublished} />
        </div>
      </Card>

            <Card className="p-6 space-y-4">
                <h2 className="text-lg font-medium">Modules actifs</h2>
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium">Cagnotte</p>
            <p className="text-sm text-muted-foreground">Affiche le bouton et la section de contribution.</p>
          </div>
          <Switch
            checked={features.cagnotteEnabled}
            onCheckedChange={(v) => setFeatures({ ...features, cagnotteEnabled: v })}
          />
        </div>
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium">Liste cadeaux</p>
            <p className="text-sm text-muted-foreground">Affiche la liste de cadeaux sur la page d'accueil.</p>
          </div>
          <Switch
            checked={features.giftsEnabled}
            onCheckedChange={(v) => setFeatures({ ...features, giftsEnabled: v })}
          />
        </div>
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium">Blagues live</p>
            <p className="text-sm text-muted-foreground">Active les blagues et animations en direct.</p>
          </div>
          <Switch
            checked={features.jokesEnabled}
            onCheckedChange={(v) => setFeatures({ ...features, jokesEnabled: v })}
          />
        </div>
      </Card>

            <Card className="p-6 space-y-4">
                <h2 className="text-lg font-medium">Paiements & cagnotte</h2>
        <p className="text-sm text-muted-foreground">
          Choisissez le mode de collecte: Stripe intégré ou lien externe (Leetchi, PayPal, Lydia, Stripe Payment Link...).
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button
            type="button"
            className={`rounded-xl border p-4 text-left transition ${
              payments.mode === "stripe" ? "border-primary bg-primary/5" : "border-border"
            }`}
            onClick={() => setPayments((prev) => ({ ...prev, mode: "stripe" }))}
          >
            <p className="font-medium">Stripe intégré</p>
            <p className="text-sm text-muted-foreground mt-1">Checkout intégré avec suivi live automatique.</p>
          </button>
          <button
            type="button"
            className={`rounded-xl border p-4 text-left transition ${
              payments.mode === "external" ? "border-primary bg-primary/5" : "border-border"
            }`}
            onClick={() => setPayments((prev) => ({ ...prev, mode: "external" }))}
          >
            <p className="font-medium">Lien externe</p>
            <p className="text-sm text-muted-foreground mt-1">Redirige vers votre cagnotte externe.</p>
          </button>
        </div>

        {payments.mode === "stripe" ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Statut Stripe</label>
              <div className="h-10 rounded-md border border-border bg-background px-3 text-sm w-full flex items-center justify-between">
                <span>{payments.stripeStatus === "connected" && payments.stripeAccountId ? "Connecté" : "Non connecté"}</span>
                <span className={`text-xs font-semibold ${payments.stripeStatus === "connected" && payments.stripeAccountId ? "text-emerald-600" : "text-muted-foreground"}`}>
                  {payments.stripeStatus === "connected" && payments.stripeAccountId ? "OK" : "À connecter"}
                </span>
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Stripe account ID (optionnel)</label>
              <Input
                placeholder="acct_..."
                value={payments.stripeAccountId}
                onChange={(e) => setPayments((prev) => ({ ...prev, stripeAccountId: e.target.value }))}
              />
            </div>
            <div className="md:col-span-2">
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    window.location.href = `/api/stripe/connect/start?weddingId=${encodeURIComponent(wedding.id)}`;
                  }}
                >
                  Connecter Stripe (OAuth)
                </Button>
                <Button
                  variant="outline"
                  onClick={async () => {
                    try {
                      await apiRequest("POST", "/api/stripe/connect/disconnect");
                      setPayments((prev) => ({ ...prev, stripeStatus: "not_connected", stripeAccountId: "" }));
                      setPreviewToken(Date.now());
                      toast({ title: "Stripe déconnecté", description: "Le projet repasse en mode non connecté." });
                    } catch (e: any) {
                      toast({ title: "Action impossible", description: e?.message || "Impossible de déconnecter Stripe.", variant: "destructive" });
                    }
                  }}
                  disabled={payments.stripeStatus !== "connected" || !payments.stripeAccountId}
                >
                  Déconnecter Stripe
                </Button>
                <Button variant="outline" asChild>
                  <a href="https://dashboard.stripe.com/register" target="_blank" rel="noopener noreferrer">
                    Créer un compte Stripe
                  </a>
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Fournisseur externe</label>
              <select
                className="h-10 rounded-md border border-border bg-background px-3 text-sm w-full"
                value={payments.externalProvider}
                onChange={(e) => setPayments((prev) => ({ ...prev, externalProvider: e.target.value }))}
              >
                <option value="leetchi">Leetchi</option>
                <option value="paypal">PayPal</option>
                <option value="lydia">Lydia</option>
                <option value="stripe_payment_link">Stripe Payment Link</option>
                <option value="other">Autre</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">URL de la cagnotte externe</label>
              <Input
                placeholder="https://..."
                value={payments.externalUrl}
                onChange={(e) => setPayments((prev) => ({ ...prev, externalUrl: e.target.value }))}
              />
            </div>
          </div>
        )}

        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium">Contributions manuelles (live)</p>
            <p className="text-sm text-muted-foreground">Permet de saisir des dons manuellement depuis l'admin.</p>
          </div>
          <Switch
            checked={payments.allowManualLiveContributions}
            onCheckedChange={(v) => setPayments((prev) => ({ ...prev, allowManualLiveContributions: v }))}
          />
        </div>
      </Card>

            <Card className="p-6 space-y-4">
                <h2 className="text-lg font-medium">Aperçu éditorial</h2>
        <p className="text-sm text-muted-foreground">Validation rapide des textes clés du site.</p>
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
                <h2 className="text-lg font-medium">Aperçu complet</h2>
        <p className="text-sm text-muted-foreground">Version miniature du site public en temps réel.</p>
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
        <Button onClick={handleSave}>Enregistrer les paramètres</Button>
      </div>
    </div>
  );
}
