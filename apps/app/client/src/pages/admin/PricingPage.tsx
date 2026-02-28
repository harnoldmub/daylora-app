import { useState, useEffect, useRef } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
  Check,
  Crown,
  Loader2,
  CalendarDays,
  Share2,
  Copy,
  Gift,
  ExternalLink,
  FileText,
  AlertTriangle,
  RefreshCw,
  CreditCard,
  Clock,
  Ban,
  HelpCircle,
  MessageSquare,
  Mail,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { type Wedding } from "@shared/schema";
import { useParams } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { KpiCard } from "@/components/admin/KpiCard";
import { queryClient } from "@/lib/queryClient";

interface BillingInfo {
  plan: string;
  status: string | null;
  cancelAtPeriodEnd: boolean;
  currentPeriodEnd: string | null;
  amount: number | null;
  interval: string | null;
  invoices: Array<{
    id: string;
    date: string | null;
    amount: number;
    status: string;
    pdfUrl: string | null;
  }>;
  canCancel: boolean;
  engagementEndDate: string | null;
  subscriptionStart: string | null;
}

function formatDate(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function statusLabel(status: string | null, cancelAtPeriodEnd: boolean) {
  if (cancelAtPeriodEnd && status === "active") return "Annulation prévue";
  switch (status) {
    case "active":
    case "trialing":
      return "Actif";
    case "past_due":
      return "Impayé";
    case "canceled":
      return "Annulé";
    case "incomplete":
      return "Incomplet";
    default:
      return "—";
  }
}

function statusColor(status: string | null, cancelAtPeriodEnd: boolean) {
  if (cancelAtPeriodEnd && status === "active") return "text-amber-600";
  switch (status) {
    case "active":
    case "trialing":
      return "text-green-600";
    case "past_due":
      return "text-red-600";
    case "canceled":
      return "text-muted-foreground";
    default:
      return "text-muted-foreground";
  }
}

function invoiceStatusLabel(status: string) {
  switch (status) {
    case "paid":
      return "Payée";
    case "open":
      return "En attente";
    case "void":
      return "Annulée";
    case "uncollectible":
      return "Irrécouvrable";
    case "draft":
      return "Brouillon";
    default:
      return status;
  }
}

export default function PricingPage() {
  const { weddingId } = useParams<{ weddingId: string }>();
  const { toast } = useToast();
  const [referralInput, setReferralInput] = useState("");
  const [referralValid, setReferralValid] = useState<boolean | null>(null);
  const [promoInput, setPromoInput] = useState("");
  const [promoValid, setPromoValid] = useState<boolean | null>(null);
  const [promoInfo, setPromoInfo] = useState<{ type: string; value: number } | null>(null);

  const { data: wedding, isLoading } = useQuery<Wedding>({
    queryKey: [`/api/weddings/${weddingId}`],
    enabled: !!weddingId,
  });

  const { data: referralData } = useQuery<{ code: string; usageCount: number }>(
    {
      queryKey: ["/api/referral/my-code"],
    }
  );

  const { data: billingInfo, isLoading: billingLoading } =
    useQuery<BillingInfo>({
      queryKey: ["/api/billing/info"],
      enabled: !!weddingId && wedding?.currentPlan === "premium",
    });

  const checkoutMutation = useMutation({
    mutationFn: async (type: "subscription" | "one_time") => {
      const body: any = { type };
      if (referralInput.trim() && referralValid) {
        body.referralCode = referralInput.trim();
      }
      if (promoInput.trim() && promoValid) {
        body.promoCode = promoInput.trim().toUpperCase();
      }
      const res = await apiRequest("POST", "/api/billing/checkout", body);
      return res.json();
    },
    onSuccess: (data) => {
      window.location.href = data.url;
    },
    onError: (err: any) => {
      toast({
        title: "Paiement impossible",
        description:
          err.message ||
          "Le service de paiement est temporairement indisponible. Réessayez dans quelques instants.",
        variant: "destructive",
      });
    },
  });

  const portalMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/billing/portal", {});
      return res.json();
    },
    onSuccess: (data) => {
      window.location.href = data.url;
    },
    onError: (err: any) => {
      toast({
        title: "Portail indisponible",
        description:
          err.message ||
          "Impossible d'ouvrir le portail de facturation. Veuillez réessayer.",
        variant: "destructive",
      });
    },
  });

  const syncMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/billing/sync", {});
      return res.json();
    },
    onSuccess: async (data: any) => {
      await queryClient.invalidateQueries({
        queryKey: [`/api/weddings/${weddingId}`],
      });
      await queryClient.invalidateQueries({ queryKey: ["/api/billing/info"] });
      toast({
        title: "Synchronisation Stripe",
        description:
          data?.currentPlan === "premium"
            ? "Votre abonnement Premium est actif."
            : "Aucun abonnement Premium actif détecté.",
        variant: data?.currentPlan === "premium" ? "default" : "destructive",
      });
    },
    onError: (err: any) => {
      toast({
        title: "Synchronisation impossible",
        description:
          err.message ||
          "Impossible de synchroniser avec Stripe. Veuillez réessayer.",
        variant: "destructive",
      });
    },
  });

  const [paymentPending, setPaymentPending] = useState(false);
  const [paymentCanceled, setPaymentCanceled] = useState(false);

  const upgradeTriggered = useRef(false);
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);

    if (params.get("success") === "1" && wedding?.currentPlan !== "premium") {
      setPaymentPending(true);
      params.delete("success");
      params.delete("session_id");
      const next = `${window.location.pathname}${params.toString() ? `?${params.toString()}` : ""}`;
      window.history.replaceState({}, "", next);
    }

    if (params.get("canceled") === "1") {
      setPaymentCanceled(true);
      params.delete("canceled");
      const next = `${window.location.pathname}${params.toString() ? `?${params.toString()}` : ""}`;
      window.history.replaceState({}, "", next);
    }

    if (upgradeTriggered.current) return;
    if (params.get("upgrade") === "1" && wedding?.currentPlan !== "premium") {
      upgradeTriggered.current = true;
      params.delete("upgrade");
      const next = `${window.location.pathname}${params.toString() ? `?${params.toString()}` : ""}`;
      window.history.replaceState({}, "", next);
      toast({
        title: "Finalisez votre abonnement",
        description: "Votre compte a été créé. Souscrivez à Premium pour accéder à toutes les fonctionnalités.",
      });
    }
  }, [wedding, toast]);

  useEffect(() => {
    if (!paymentPending || wedding?.currentPlan === "premium") return;
    const interval = setInterval(() => {
      syncMutation.mutate();
    }, 8000);
    return () => clearInterval(interval);
  }, [paymentPending, wedding?.currentPlan]);

  useEffect(() => {
    if (paymentPending && wedding?.currentPlan === "premium") {
      setPaymentPending(false);
    }
  }, [wedding?.currentPlan, paymentPending]);

  const validateReferral = async (code: string) => {
    if (!code.trim()) {
      setReferralValid(null);
      return;
    }
    try {
      const res = await fetch(
        `/api/referral/validate/${encodeURIComponent(code.trim())}`
      );
      const data = await res.json();
      setReferralValid(data.valid);
    } catch {
      setReferralValid(false);
    }
  };

  const validatePromo = async (code: string) => {
    if (!code.trim()) {
      setPromoValid(null);
      setPromoInfo(null);
      return;
    }
    try {
      const res = await fetch("/api/promo/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: code.trim() }),
      });
      const data = await res.json();
      setPromoValid(data.valid);
      if (data.valid) {
        setPromoInfo({ type: data.type, value: data.value });
      } else {
        setPromoInfo(null);
      }
    } catch {
      setPromoValid(false);
      setPromoInfo(null);
    }
  };

  const formatPromoDiscount = () => {
    if (!promoInfo) return "";
    if (promoInfo.type === "percentage") return `-${promoInfo.value}%`;
    return `-${(promoInfo.value / 100).toFixed(0)}€`;
  };

  const copyReferralCode = () => {
    if (!referralData?.code) return;
    navigator.clipboard.writeText(referralData.code);
    toast({
      title: "Copié",
      description: "Code de parrainage copié dans le presse-papier.",
    });
  };

  if (isLoading)
    return <Loader2 className="h-8 w-8 animate-spin mx-auto mt-20" />;

  const isPremium = wedding?.currentPlan === "premium";

  if (isPremium) {
    return (
      <PremiumBillingView
        billingInfo={billingInfo}
        billingLoading={billingLoading}
        portalMutation={portalMutation}
        syncMutation={syncMutation}
        referralData={referralData}
        copyReferralCode={copyReferralCode}
      />
    );
  }

  if (paymentPending) {
    return (
      <div className="space-y-8">
        <AdminPageHeader
          title="Paiement en attente"
          description="Votre paiement est en cours de traitement. Le statut sera mis à jour automatiquement."
        />
        <Card className="max-w-lg mx-auto p-10 text-center space-y-6">
          <div className="mx-auto w-16 h-16 rounded-full bg-amber-100 flex items-center justify-center">
            <Clock className="h-8 w-8 text-amber-600" />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-bold">Traitement en cours</h2>
            <p className="text-muted-foreground">
              Votre paiement a bien été reçu par Stripe. La confirmation peut prendre quelques instants.
              Le statut se met à jour automatiquement.
            </p>
          </div>
          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Vérification automatique en cours…</span>
          </div>
          <Button
            size="lg"
            className="h-12 px-8 font-bold"
            onClick={() => syncMutation.mutate()}
            disabled={syncMutation.isPending}
          >
            {syncMutation.isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="mr-2 h-4 w-4" />
            )}
            J'ai payé — Actualiser
          </Button>
          <p className="text-xs text-muted-foreground">
            Si le paiement n'est pas détecté après quelques minutes, contactez-nous à{" "}
            <a href="mailto:support@daylora.app" className="text-primary hover:underline">support@daylora.app</a>.
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <AdminPageHeader
        title="Facturation"
        description="Activez Premium pour débloquer tous les modules du site public et du backoffice."
        actions={
          <Button
            variant="outline"
            onClick={() => syncMutation.mutate()}
            disabled={syncMutation.isPending}
          >
            {syncMutation.isPending && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            Synchroniser Stripe
          </Button>
        }
      />

      {paymentCanceled && (
        <Card className="p-5 border-amber-200 bg-amber-50">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5 shrink-0" />
            <div>
              <p className="font-medium text-amber-900">Paiement non finalisé</p>
              <p className="text-sm text-amber-700 mt-1">
                Le paiement a été annulé ou abandonné. Vous pouvez réessayer à tout moment en choisissant une formule ci-dessous.
              </p>
            </div>
          </div>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <KpiCard
          label="Plan actuel"
          value="Découverte"
          hint="10 invités max"
          icon={<Crown className="h-5 w-5" />}
        />
        <KpiCard
          label="Abonnement"
          value="23,99€"
          hint="Par mois (min. 2 mois)"
          icon={<Check className="h-5 w-5" />}
        />
        <KpiCard
          label="Annuel"
          value="149€"
          hint="Pour 1 an complet"
          icon={<CalendarDays className="h-5 w-5" />}
        />
      </div>

      {referralData && (
        <ReferralCard
          referralData={referralData}
          copyReferralCode={copyReferralCode}
        />
      )}

      <div className="grid md:grid-cols-3 gap-8">
        <Card className="p-8 relative border-primary shadow-lg ring-1 ring-primary">
          <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2">
            <span className="bg-primary text-primary-foreground text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
              Actuel
            </span>
          </div>
          <div className="space-y-6">
            <div>
              <h3 className="text-2xl font-bold">Découverte</h3>
              <p className="text-muted-foreground">L'essentiel pour commencer</p>
            </div>
            <div className="text-4xl font-bold font-serif">0€</div>
            <ul className="space-y-3">
              <Feature text="1 template" checked />
              <Feature text="Jusqu'à 10 invités" checked />
              <Feature text="Jusqu'à 2 cadeaux" checked />
              <Feature text="Cagnotte activée" checked />
              <Feature text="Branding Daylora visible" checked />
              <Feature text="6 photos galerie max" checked />
              <Feature text="Live contributions & blagues" checked={false} />
              <Feature text="Pages personnalisées" checked={false} />
            </ul>
            <Button variant="outline" className="w-full" disabled>
              Plan actuel
            </Button>
          </div>
        </Card>

        <Card className="p-8 relative overflow-hidden border-primary/50 shadow-xl ring-2 ring-primary/30 scale-[1.02]">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2">
            <span className="bg-primary text-primary-foreground text-xs font-bold px-4 py-1.5 rounded-full uppercase tracking-wider shadow-lg">
              Recommandé
            </span>
          </div>
          <div className="absolute top-4 right-4 text-primary/20">
            <Crown className="h-24 w-24 rotate-12" />
          </div>
          <div className="space-y-6">
            <div>
              <h3 className="text-2xl font-bold">Premium</h3>
              <p className="text-muted-foreground">Best seller</p>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-bold font-serif">23,99€</span>
              <span className="text-muted-foreground">/ mois</span>
            </div>
            <ul className="space-y-3">
              <Feature text="Tous les templates" checked />
              <Feature text="Invités illimités" checked />
              <Feature text="Liste cadeaux" checked />
              <Feature text="Live contributions & blagues" checked />
              <Feature text="Suppression branding Daylora" checked />
              <Feature text="50 photos galerie" checked />
              <Feature text="Pages personnalisées" checked />
              <Feature text="Exports complets" checked />
            </ul>
            <div className="space-y-2">
              <div className="flex gap-2">
                <Input
                  placeholder="Code parrainage"
                  value={referralInput}
                  onChange={(e) => {
                    setReferralInput(e.target.value);
                    setReferralValid(null);
                  }}
                  onBlur={() => validateReferral(referralInput)}
                  className="h-10 font-mono uppercase"
                />
                {referralValid === true && (
                  <span className="text-green-600 text-xs self-center font-semibold">
                    -10€
                  </span>
                )}
                {referralValid === false && (
                  <span className="text-red-500 text-xs self-center">
                    Invalide
                  </span>
                )}
              </div>
              <div className="flex gap-2">
                <Input
                  placeholder="Code promo"
                  value={promoInput}
                  onChange={(e) => {
                    setPromoInput(e.target.value);
                    setPromoValid(null);
                    setPromoInfo(null);
                  }}
                  onBlur={() => validatePromo(promoInput)}
                  className="h-10 font-mono uppercase"
                />
                {promoValid === true && (
                  <span className="text-green-600 text-xs self-center font-semibold">
                    {formatPromoDiscount()}
                  </span>
                )}
                {promoValid === false && (
                  <span className="text-red-500 text-xs self-center">
                    Invalide
                  </span>
                )}
              </div>
            </div>
            <Button
              className="w-full h-12 text-base font-bold shadow-md"
              disabled={checkoutMutation.isPending}
              onClick={() => checkoutMutation.mutate("subscription")}
            >
              {checkoutMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              S'abonner — 23,99€/mois
            </Button>
            <p className="text-center text-xs text-muted-foreground">
              Minimum 2 mois, puis sans engagement.
            </p>
          </div>
        </Card>

        <Card className="p-8 relative overflow-hidden border-dashed">
          <div className="absolute top-4 right-4 text-primary/10">
            <CalendarDays className="h-20 w-20" />
          </div>
          <div className="space-y-6">
            <div>
              <h3 className="text-2xl font-bold">Annuel</h3>
              <p className="text-muted-foreground">1 an complet</p>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-bold font-serif">149€</span>
              <span className="text-muted-foreground">/ an</span>
            </div>
            <ul className="space-y-3">
              <Feature text="Tout le Premium inclus" checked />
              <Feature text="12 mois d'accès" checked />
              <Feature text="Économisez 35%" checked />
              <Feature text="Mises à jour incluses" checked />
            </ul>
            <div className="space-y-2">
              <div className="flex gap-2">
                <Input
                  placeholder="Code parrainage"
                  value={referralInput}
                  onChange={(e) => {
                    setReferralInput(e.target.value);
                    setReferralValid(null);
                  }}
                  onBlur={() => validateReferral(referralInput)}
                  className="h-10 font-mono uppercase"
                />
                {referralValid === true && (
                  <span className="text-green-600 text-xs self-center font-semibold">
                    -10€
                  </span>
                )}
                {referralValid === false && (
                  <span className="text-red-500 text-xs self-center">
                    Invalide
                  </span>
                )}
              </div>
              <div className="flex gap-2">
                <Input
                  placeholder="Code promo"
                  value={promoInput}
                  onChange={(e) => {
                    setPromoInput(e.target.value);
                    setPromoValid(null);
                    setPromoInfo(null);
                  }}
                  onBlur={() => validatePromo(promoInput)}
                  className="h-10 font-mono uppercase"
                />
                {promoValid === true && (
                  <span className="text-green-600 text-xs self-center font-semibold">
                    {formatPromoDiscount()}
                  </span>
                )}
                {promoValid === false && (
                  <span className="text-red-500 text-xs self-center">
                    Invalide
                  </span>
                )}
              </div>
            </div>
            <Button
              variant="outline"
              className="w-full"
              disabled={checkoutMutation.isPending}
              onClick={() => checkoutMutation.mutate("one_time")}
            >
              {checkoutMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Acheter — 149€/an
            </Button>
            <p className="text-center text-xs text-muted-foreground">
              Renouvelable chaque année.
            </p>
          </div>
        </Card>
      </div>

      <HelpCard />
    </div>
  );
}

function PremiumBillingView({
  billingInfo,
  billingLoading,
  portalMutation,
  syncMutation,
  referralData,
  copyReferralCode,
}: {
  billingInfo: BillingInfo | undefined;
  billingLoading: boolean;
  portalMutation: any;
  syncMutation: any;
  referralData: { code: string; usageCount: number } | undefined;
  copyReferralCode: () => void;
}) {
  const intervalLabel =
    billingInfo?.interval === "month"
      ? "Mensuel"
      : billingInfo?.interval === "year"
        ? "Annuel"
        : "Premium";
  const amountLabel = billingInfo?.amount
    ? `${billingInfo.amount.toFixed(2).replace(".", ",")}€`
    : "—";
  const intervalSuffix =
    billingInfo?.interval === "month"
      ? " / mois"
      : billingInfo?.interval === "year"
        ? " / an"
        : "";

  return (
    <div className="space-y-8">
      <AdminPageHeader
        title="Facturation"
        description="Gérez votre abonnement Premium, consultez vos factures et modifiez votre moyen de paiement."
        actions={
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => syncMutation.mutate()}
              disabled={syncMutation.isPending}
            >
              {syncMutation.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="mr-2 h-4 w-4" />
              )}
              Synchroniser
            </Button>
            <Button
              onClick={() => portalMutation.mutate()}
              disabled={portalMutation.isPending}
            >
              {portalMutation.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <ExternalLink className="mr-2 h-4 w-4" />
              )}
              Gérer mon abonnement
            </Button>
          </div>
        }
      />

      {billingLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <KpiCard
              label="Plan"
              value={intervalLabel}
              hint={`${amountLabel}${intervalSuffix}`}
              icon={<Crown className="h-5 w-5" />}
            />
            <KpiCard
              label="Statut"
              value={statusLabel(
                billingInfo?.status || null,
                billingInfo?.cancelAtPeriodEnd || false
              )}
              hint={
                billingInfo?.cancelAtPeriodEnd
                  ? `Fin le ${formatDate(billingInfo?.currentPeriodEnd || null)}`
                  : billingInfo?.status === "past_due"
                    ? "Paiement en attente"
                    : "Renouvellement automatique"
              }
              icon={
                billingInfo?.cancelAtPeriodEnd ? (
                  <Ban className="h-5 w-5" />
                ) : billingInfo?.status === "past_due" ? (
                  <AlertTriangle className="h-5 w-5" />
                ) : (
                  <Check className="h-5 w-5" />
                )
              }
            />
            <KpiCard
              label="Prochain paiement"
              value={formatDate(billingInfo?.currentPeriodEnd || null)}
              hint={
                billingInfo?.cancelAtPeriodEnd
                  ? "Pas de renouvellement"
                  : billingInfo?.amount
                    ? `${amountLabel} sera débité`
                    : "—"
              }
              icon={<Clock className="h-5 w-5" />}
            />
          </div>

          {billingInfo?.cancelAtPeriodEnd && billingInfo?.status === "active" && (
            <Card className="p-5 border-amber-200 bg-amber-50">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5 shrink-0" />
                <div>
                  <p className="font-medium text-amber-900">
                    Annulation programmée
                  </p>
                  <p className="text-sm text-amber-700 mt-1">
                    Votre abonnement sera annulé le{" "}
                    {formatDate(billingInfo.currentPeriodEnd)}. Vous conservez
                    l'accès Premium jusqu'à cette date. Pour annuler cette
                    demande, cliquez sur « Gérer mon abonnement ».
                  </p>
                </div>
              </div>
            </Card>
          )}

          {billingInfo?.status === "past_due" && (
            <Card className="p-5 border-red-200 bg-red-50">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5 shrink-0" />
                <div>
                  <p className="font-medium text-red-900">Paiement en échec</p>
                  <p className="text-sm text-red-700 mt-1">
                    Votre dernier paiement a échoué. Mettez à jour votre moyen
                    de paiement via « Gérer mon abonnement » pour éviter la
                    suspension de votre compte.
                  </p>
                </div>
              </div>
            </Card>
          )}

          {!billingInfo?.canCancel &&
            billingInfo?.engagementEndDate &&
            billingInfo?.interval === "month" && (
              <Card className="p-5 border-blue-200 bg-blue-50">
                <div className="flex items-start gap-3">
                  <CalendarDays className="h-5 w-5 text-blue-600 mt-0.5 shrink-0" />
                  <div>
                    <p className="font-medium text-blue-900">
                      Engagement minimum : 2 mois
                    </p>
                    <p className="text-sm text-blue-700 mt-1">
                      Votre abonnement mensuel inclut un engagement de 2 mois.
                      L'annulation sera possible à partir du{" "}
                      {formatDate(billingInfo.engagementEndDate)}.
                    </p>
                  </div>
                </div>
              </Card>
            )}

          <div className="flex justify-center">
            <Button
              size="lg"
              className="h-14 px-8 text-base font-bold shadow-md"
              onClick={() => portalMutation.mutate()}
              disabled={portalMutation.isPending}
            >
              {portalMutation.isPending ? (
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              ) : (
                <CreditCard className="mr-2 h-5 w-5" />
              )}
              Gérer mon abonnement
            </Button>
          </div>

          {referralData && (
            <ReferralCard
              referralData={referralData}
              copyReferralCode={copyReferralCode}
            />
          )}

          {billingInfo?.invoices && billingInfo.invoices.length > 0 && (
            <Card className="overflow-hidden">
              <div className="p-6 border-b">
                <div className="flex items-center gap-3">
                  <FileText className="h-5 w-5 text-primary" />
                  <h3 className="font-bold text-lg">Historique des factures</h3>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b bg-muted/30">
                      <th className="text-left px-6 py-3 text-sm font-medium text-muted-foreground">
                        Date
                      </th>
                      <th className="text-left px-6 py-3 text-sm font-medium text-muted-foreground">
                        Montant
                      </th>
                      <th className="text-left px-6 py-3 text-sm font-medium text-muted-foreground">
                        Statut
                      </th>
                      <th className="text-right px-6 py-3 text-sm font-medium text-muted-foreground">
                        Facture
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {billingInfo.invoices.map((inv) => (
                      <tr key={inv.id} className="border-b last:border-0">
                        <td className="px-6 py-4 text-sm">
                          {formatDate(inv.date)}
                        </td>
                        <td className="px-6 py-4 text-sm font-medium">
                          {inv.amount.toFixed(2).replace(".", ",")}€
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              inv.status === "paid"
                                ? "bg-green-100 text-green-800"
                                : inv.status === "open"
                                  ? "bg-amber-100 text-amber-800"
                                  : "bg-gray-100 text-gray-800"
                            }`}
                          >
                            {invoiceStatusLabel(inv.status)}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          {inv.pdfUrl ? (
                            <a
                              href={inv.pdfUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-primary hover:underline text-sm inline-flex items-center gap-1"
                            >
                              PDF
                              <ExternalLink className="h-3 w-3" />
                            </a>
                          ) : (
                            <span className="text-muted-foreground text-sm">
                              —
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}

          <HelpCard />
        </>
      )}
    </div>
  );
}

function ReferralCard({
  referralData,
  copyReferralCode,
}: {
  referralData: { code: string; usageCount: number };
  copyReferralCode: () => void;
}) {
  return (
    <Card className="p-6 bg-gradient-to-r from-primary/5 to-transparent">
      <div className="flex items-center gap-3 mb-3">
        <Share2 className="h-5 w-5 text-primary" />
        <h3 className="font-bold text-lg">Parrainage</h3>
      </div>
      <p className="text-sm text-muted-foreground mb-3">
        Partagez votre code avec vos amis. Ils bénéficieront de 10€ de
        réduction sur leur abonnement Premium.
      </p>
      <div className="flex items-center gap-3">
        <div className="flex-1 bg-white border rounded-xl px-4 py-3 font-mono font-bold text-lg tracking-widest text-center">
          {referralData.code}
        </div>
        <Button variant="outline" size="icon" onClick={copyReferralCode}>
          <Copy className="h-4 w-4" />
        </Button>
      </div>
      {referralData.usageCount > 0 && (
        <p className="text-xs text-muted-foreground mt-2">
          <Gift className="inline h-3 w-3 mr-1" />
          {referralData.usageCount} ami
          {referralData.usageCount > 1 ? "s" : ""} parrainé
          {referralData.usageCount > 1 ? "s" : ""}
        </p>
      )}
    </Card>
  );
}

function HelpCard() {
  return (
    <Card className="p-6 border-muted bg-muted/30">
      <div className="flex items-start gap-4">
        <div className="rounded-full bg-primary/10 p-2.5 shrink-0">
          <HelpCircle className="h-5 w-5 text-primary" />
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-base mb-1">Besoin d'aide ?</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Une question sur votre abonnement, un paiement ou une facture ? Notre équipe est disponible pour vous accompagner.
          </p>
          <div className="flex flex-wrap gap-3">
            <a href="mailto:support@daylora.app" className="inline-flex">
              <Button variant="outline" size="sm">
                <Mail className="mr-2 h-4 w-4" />
                support@daylora.app
              </Button>
            </a>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                const btn = document.querySelector<HTMLButtonElement>("[data-feedback-trigger]");
                if (btn) btn.click();
              }}
            >
              <MessageSquare className="mr-2 h-4 w-4" />
              Envoyer un message
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
}

function Feature({ text, checked }: { text: string; checked: boolean }) {
  return (
    <li
      className={`flex items-center gap-3 text-sm ${checked ? "text-foreground" : "text-muted-foreground"}`}
    >
      <Check
        className={`h-4 w-4 ${checked ? "text-green-500" : "text-muted-foreground/30"}`}
      />
      <span>{text}</span>
    </li>
  );
}
