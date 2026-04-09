import { useEffect, useState } from "react";
import { useParams } from "wouter";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useWedding, useUpdateWedding, useDeleteWedding, useWeddings, useCreateWedding } from "@/hooks/use-api";
import { motion } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import { useLocation } from "wouter";
import { useMemo } from "react";
import { AlertTriangle, Check, Copy, ExternalLink, HelpCircle, Lock, Plus, Sparkles, Trash2 } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { resetAllTours } from "@/components/guided-tour";

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
  const { data: weddings = [] } = useWeddings();
  const updateWedding = useUpdateWedding();
  const deleteWedding = useDeleteWedding();
  const createWedding = useCreateWedding();
  const { toast } = useToast();
  const [siteConfig, setSiteConfig] = useState<SiteConfig | null>(null);
  const { user, logoutMutation } = useAuth();
  const [, setLocation] = useLocation();
  const [previewToken, setPreviewToken] = useState<number>(Date.now());
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteAccountDialogOpen, setDeleteAccountDialogOpen] = useState(false);
  const [createSiteDialogOpen, setCreateSiteDialogOpen] = useState(false);
  const [newSiteTitle, setNewSiteTitle] = useState("");
  const [newSiteSlug, setNewSiteSlug] = useState("");
  const [newSiteDate, setNewSiteDate] = useState("");
  const [deleteAccountReason, setDeleteAccountReason] = useState("");
  const [deleteAccountDetails, setDeleteAccountDetails] = useState("");

  const [slug, setSlug] = useState("");
  const [title, setTitle] = useState("");
  const [isPublished, setIsPublished] = useState(false);
  const [features, setFeatures] = useState({
    cagnotteEnabled: true,
    giftsEnabled: true,
    jokesEnabled: true,
  });
  const [payments, setPayments] = useState<PaymentSettings>({
    mode: "external",
    externalProvider: "other",
    externalUrl: "",
    stripeStatus: "not_connected",
    stripeAccountId: "",
    allowManualLiveContributions: true,
  });

  const templates = [
    { id: "classic", name: "Classique", premium: false },
    { id: "modern", name: "Moderne", premium: true },
    { id: "minimal", name: "Minimal", premium: true },
    { id: "avantgarde", name: "Avant-Garde", premium: true },
  ];
  const isPremium = wedding?.currentPlan === "premium";
  const canDeleteWedding = !!wedding && (user?.isAdmin || wedding.ownerId === user?.id);
  const ownedWeddings = weddings.filter((item) => item.ownerId === user?.id);
  const canManageMultipleSites = !!user?.isAdmin || ownedWeddings.some((item) => item.currentPlan === "premium");
  const planItems = isPremium
    ? [
        "Sites multiples",
        "Templates premium",
        "Invités illimités",
        "Cadeaux illimités",
        "Blagues live",
        "Suppression du branding Daylora",
      ]
    : [
        "1 site",
        "Template Classic",
        "10 invités maximum",
        "2 cadeaux maximum",
        "Cagnotte incluse",
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
      mode: "external",
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

  const appOrigin = typeof window !== "undefined" ? window.location.origin : (siteConfig?.appBaseUrl || "https://daylora.app");
  const publicUrl = `${appOrigin}/${slug || wedding?.id}`;
  const previewUrl = useMemo(() => `${appOrigin}/preview/${slug || wedding?.id}?t=${previewToken}`, [appOrigin, slug, wedding?.id, previewToken]);

  if (!wedding) {
    return (
      <div className="p-6">
        <Card className="p-6">
          <p className="text-sm text-muted-foreground">Chargement de la configuration Daylora…</p>
        </Card>
      </div>
    );
  }

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

  const buildSlug = (value: string) =>
    value
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 80);

  const handleDeleteWedding = async () => {
    if (!wedding) return;

    try {
      await deleteWedding.mutateAsync(wedding.id);
      queryClient.removeQueries({ queryKey: ["/api/weddings", wedding.id] });
      toast({ title: "Site supprimé", description: "Le site a bien été supprimé." });
      setDeleteDialogOpen(false);
      setLocation("/dashboard");
    } catch {
      toast({
        title: "Suppression impossible",
        description: "Réessayez dans quelques secondes.",
        variant: "destructive",
      });
    }
  };

  const handleCreateSite = async () => {
    if (!wedding) return;
    const nextTitle = newSiteTitle.trim();
    const nextSlug = buildSlug(newSiteSlug || newSiteTitle);

    if (nextTitle.length < 3) {
      toast({ title: "Nom trop court", description: "Ajoutez un nom de site plus clair.", variant: "destructive" });
      return;
    }

    if (nextSlug.length < 3) {
      toast({ title: "URL invalide", description: "Ajoutez une adresse de site valide.", variant: "destructive" });
      return;
    }

    try {
      const created = await createWedding.mutateAsync({
        title: nextTitle,
        slug: nextSlug,
        weddingDate: newSiteDate ? new Date(newSiteDate) : undefined,
        templateId: wedding.templateId || "classic",
        toneId: (wedding.config as any)?.theme?.toneId || "golden-ivory",
        language: (wedding.config as any)?.language || "fr",
      });
      setCreateSiteDialogOpen(false);
      setNewSiteTitle("");
      setNewSiteSlug("");
      setNewSiteDate("");
      toast({ title: "Nouveau site créé", description: "Vous pouvez maintenant le configurer." });
      setLocation(`/${created.id}/dashboard`);
    } catch (error) {
      toast({
        title: "Création impossible",
        description: error instanceof Error ? error.message : "Réessayez dans quelques secondes.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteAccount = async () => {
    try {
      await apiRequest("DELETE", "/api/auth/account", {
        reason: deleteAccountReason,
        details: deleteAccountDetails.trim() || null,
      });
      queryClient.setQueryData(["/api/auth/me"], null);
      queryClient.removeQueries({ queryKey: ["/api/weddings"] });
      queryClient.removeQueries({ queryKey: ["/api/weddings/list"] });
      toast({ title: "Compte supprimé", description: "Votre compte Daylora a bien été supprimé." });
      setDeleteAccountDialogOpen(false);
      setDeleteAccountReason("");
      setDeleteAccountDetails("");
      setLocation("/login");
    } catch (error) {
      toast({
        title: "Suppression impossible",
        description: error instanceof Error ? error.message : "Réessayez dans quelques secondes.",
        variant: "destructive",
      });
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
              onClick={async () => {
                try {
                  await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
                } catch {}
                queryClient.setQueryData(["/api/auth/me"], null);
                setLocation("/login");
              }}
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
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div>
            <h2 className="text-lg font-medium">Inclus dans votre plan</h2>
            <p className="text-sm text-muted-foreground">
              Vous êtes actuellement sur le plan {isPremium ? "Premium" : "Découverte"}.
            </p>
          </div>
          {!isPremium ? (
            <Button variant="outline" className="border-primary/30 text-primary hover:bg-primary/5" onClick={() => setLocation("/billing")}>
              <Sparkles className="mr-2 h-4 w-4" />
              Passer au Premium
            </Button>
          ) : (
            <div className="inline-flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-medium text-amber-800">
              <Sparkles className="h-3.5 w-3.5" />
              Premium actif
            </div>
          )}
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          {planItems.map((item) => (
            <div key={item} className="flex items-center gap-3 rounded-xl border bg-background px-4 py-3">
              <div className={`rounded-full p-1.5 ${isPremium ? "bg-amber-100 text-amber-800" : "bg-primary/10 text-primary"}`}>
                <Check className="h-3.5 w-3.5" />
              </div>
              <span className="text-sm font-medium">{item}</span>
            </div>
          ))}
        </div>
      </Card>

      <Card className="p-6 space-y-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div>
            <h2 className="text-lg font-medium">Mes sites</h2>
            <p className="text-sm text-muted-foreground">
              Gérez vos sites Daylora depuis un seul endroit.
            </p>
          </div>
          {canManageMultipleSites ? (
            <Button onClick={() => setCreateSiteDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Créer un nouveau site
            </Button>
          ) : (
            <div className="flex flex-wrap items-center gap-2">
              <div className="inline-flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-medium text-amber-800">
                <Lock className="h-3.5 w-3.5" />
                Action Premium
              </div>
              <Button variant="outline" className="border-primary/30 text-primary hover:bg-primary/5" onClick={() => setLocation("/billing")}>
                <Sparkles className="mr-2 h-4 w-4" />
                Débloquer les sites multiples
              </Button>
            </div>
          )}
        </div>

        <div className="space-y-3">
          {ownedWeddings.map((item) => {
            const isCurrent = item.id === wedding?.id;
            const itemUrl = `${appOrigin}/${item.slug || item.id}`;
            return (
              <div key={item.id} className={`rounded-xl border p-4 ${isCurrent ? "border-primary bg-primary/5" : "border-border bg-background"}`}>
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-medium">{item.title}</p>
                      {isCurrent ? <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary">Site actuel</span> : null}
                      <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${item.currentPlan === "premium" ? "bg-amber-100 text-amber-800" : "bg-muted text-muted-foreground"}`}>
                        {item.currentPlan === "premium" ? "Premium" : "Free"}
                      </span>
                      <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${item.isPublished ? "bg-emerald-100 text-emerald-800" : "bg-muted text-muted-foreground"}`}>
                        {item.isPublished ? "Publié" : "Brouillon"}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">{item.slug}</p>
                    <p className="mt-1 text-xs text-muted-foreground break-all">{itemUrl}</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {!isCurrent ? (
                      <Button variant="outline" onClick={() => setLocation(`/${item.id}/dashboard`)}>
                        Ouvrir
                      </Button>
                    ) : null}
                    <Button variant="outline" onClick={() => copyToClipboard(itemUrl, "Lien du site")}>
                      <Copy className="mr-2 h-4 w-4" />
                      Copier le lien
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </Card>

            <Card className="p-6 space-y-4">
                <h2 className="text-lg font-medium">Template public</h2>
        <p className="text-sm text-muted-foreground">Choisissez la base visuelle qui sera reprise dans le Studio Design.</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {templates.map((t) => {
              const locked = t.premium && !isPremium;
              return (
                <button
                  key={t.id}
                  disabled={locked}
                  className={`rounded-lg border p-4 text-left transition ${wedding.templateId === t.id
                    ? "border-primary bg-primary/5"
                    : locked ? "border-border opacity-50 cursor-not-allowed" : "border-border hover:border-primary/50"
                    }`}
                  onClick={async () => {
                    if (locked) return;
                    await updateWedding.mutateAsync({ id: wedding.id, templateId: t.id });
                    setPreviewToken(Date.now());
                    toast({ title: "Template mis à jour", description: "Le nouveau style est appliqué." });
                  }}
                >
                  <div className="text-sm font-medium flex items-center gap-2">
                    {t.name}
                    {t.premium && (
                      <span className={`text-[10px] px-1.5 py-0.5 rounded font-semibold uppercase ${locked ? "bg-primary/10 text-primary" : "bg-amber-100 text-amber-800"}`}>
                        Premium
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
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
            <p className="text-sm text-muted-foreground">
              Affiche la liste de cadeaux sur la page d'accueil.
              {!isPremium && " (max. 2 en Découverte)"}
            </p>
          </div>
          <Switch
            checked={features.giftsEnabled}
            onCheckedChange={(v) => setFeatures({ ...features, giftsEnabled: v })}
          />
        </div>
      </Card>

            <Card className="p-6 space-y-4">
                <h2 className="text-lg font-medium">Cagnotte</h2>
        <p className="text-sm text-muted-foreground">
          Ajoutez le lien vers votre cagnotte en ligne (Leetchi, PayPal, Lydia, etc.). Vos invités seront redirigés vers ce lien.
        </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Fournisseur</label>
              <select
                className="h-10 rounded-md border border-border bg-background px-3 text-sm w-full"
                value={payments.externalProvider}
                onChange={(e) => setPayments((prev) => ({ ...prev, externalProvider: e.target.value, mode: "external" }))}
              >
                <option value="leetchi">Leetchi</option>
                <option value="paypal">PayPal</option>
                <option value="lydia">Lydia</option>
                <option value="other">Autre</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">URL de la cagnotte</label>
              <Input
                placeholder="https://..."
                value={payments.externalUrl}
                onChange={(e) => setPayments((prev) => ({ ...prev, externalUrl: e.target.value, mode: "external" }))}
              />
            </div>
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

      <Card className="p-6 space-y-3">
        <h2 className="text-lg font-medium flex items-center gap-2">
          <HelpCircle className="h-5 w-5 text-muted-foreground" />
          Guide d'utilisation
        </h2>
        <p className="text-sm text-muted-foreground">Revoir le guide interactif qui explique comment utiliser la plateforme.</p>
        <Button
          variant="outline"
          onClick={() => {
            resetAllTours();
            toast({ title: "Guide réinitialisé", description: "Retournez sur chaque page pour revoir les guides." });
          }}
        >
          Relancer le guide
        </Button>
      </Card>

      {canDeleteWedding ? (
        <Card className="border-destructive/30 bg-destructive/5 p-6 space-y-4">
          <div className="flex items-start gap-3">
            <div className="rounded-full bg-destructive/10 p-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div className="space-y-1">
              <h2 className="text-lg font-medium text-foreground">Supprimer ce site</h2>
              <p className="text-sm text-muted-foreground">
                Cette action supprime définitivement le site, les invités, les cadeaux, la cagnotte et les données associées.
              </p>
            </div>
          </div>
          <div className="flex justify-end">
            <Button variant="destructive" onClick={() => setDeleteDialogOpen(true)}>
              <Trash2 className="mr-2 h-4 w-4" />
              Supprimer le site
            </Button>
          </div>
        </Card>
      ) : null}

      <Card className="border-destructive/20 p-6 space-y-4">
        <div className="flex items-start gap-3">
          <div className="rounded-full bg-destructive/10 p-2 text-destructive">
            <Trash2 className="h-5 w-5" />
          </div>
          <div className="space-y-1">
            <h2 className="text-lg font-medium text-foreground">Supprimer mon compte</h2>
            <p className="text-sm text-muted-foreground">
              Cette action supprime votre compte et tous les sites dont vous êtes propriétaire.
            </p>
          </div>
        </div>
        <div className="flex justify-end">
          <Button variant="outline" className="border-destructive/30 text-destructive hover:bg-destructive/5" onClick={() => setDeleteAccountDialogOpen(true)}>
            <Trash2 className="mr-2 h-4 w-4" />
            Supprimer mon compte
          </Button>
        </div>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSave}>Enregistrer les paramètres</Button>
      </div>

      <Dialog open={createSiteDialogOpen} onOpenChange={setCreateSiteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Créer un nouveau site</DialogTitle>
            <DialogDescription>
              Ajoutez un nouveau site à votre espace premium. Vous pourrez ensuite le personnaliser normalement.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Nom du site</label>
              <Input
                value={newSiteTitle}
                onChange={(e) => {
                  const value = e.target.value;
                  setNewSiteTitle(value);
                  setNewSiteSlug((current) => (current ? current : buildSlug(value)));
                }}
                placeholder="Ex : Mariage de Sarah & Adam"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Adresse du site</label>
              <Input
                value={newSiteSlug}
                onChange={(e) => setNewSiteSlug(buildSlug(e.target.value))}
                placeholder="ex-mariage-sarah-adam"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Date de l'événement</label>
              <Input
                type="date"
                value={newSiteDate}
                onChange={(e) => setNewSiteDate(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateSiteDialogOpen(false)}>Annuler</Button>
            <Button onClick={() => void handleCreateSite()} disabled={createWedding.isPending}>
              {createWedding.isPending ? "Création..." : "Créer le site"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer ce site ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible. Le site <span className="font-medium text-foreground">{wedding.title}</span> et toutes ses données seront supprimés définitivement.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={(event) => {
                event.preventDefault();
                void handleDeleteWedding();
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteWedding.isPending ? "Suppression..." : "Supprimer définitivement"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={deleteAccountDialogOpen}
        onOpenChange={(open) => {
          setDeleteAccountDialogOpen(open);
          if (!open) {
            setDeleteAccountReason("");
            setDeleteAccountDetails("");
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer votre compte ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible. Votre compte Daylora, vos sites et vos données associées seront supprimés définitivement.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Étape 1 : pourquoi souhaitez-vous partir ?</label>
              <select
                className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm"
                value={deleteAccountReason}
                onChange={(e) => setDeleteAccountReason(e.target.value)}
              >
                <option value="">Choisir une raison</option>
                <option value="too_expensive">C'est trop cher</option>
                <option value="missing_features">Il manque des fonctionnalités</option>
                <option value="too_complex">C'est trop complexe pour moi</option>
                <option value="temporary_project">Mon projet est terminé</option>
                <option value="using_other_tool">J'utilise un autre outil</option>
                <option value="other">Autre raison</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Étape 2 : un commentaire si vous le souhaitez</label>
              <Textarea
                rows={3}
                value={deleteAccountDetails}
                onChange={(e) => setDeleteAccountDetails(e.target.value)}
                placeholder="Expliquez-nous brièvement votre raison..."
              />
            </div>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={(event) => {
                event.preventDefault();
                void handleDeleteAccount();
              }}
              disabled={!deleteAccountReason}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Supprimer définitivement
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
