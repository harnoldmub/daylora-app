import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Check, Crown, Loader2, CalendarDays, Share2, Copy, Gift } from "lucide-react";
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

export default function PricingPage() {
        const { weddingId } = useParams<{ weddingId: string }>();
        const { toast } = useToast();
        const [referralInput, setReferralInput] = useState("");
        const [referralValid, setReferralValid] = useState<boolean | null>(null);

        const { data: wedding, isLoading } = useQuery<Wedding>({
                queryKey: [`/api/weddings/${weddingId}`],
                enabled: !!weddingId,
        });

        const { data: referralData } = useQuery<{ code: string; usageCount: number }>({
                queryKey: ["/api/referral/my-code"],
        });

        const { data: planData } = useQuery<{ plan: string; limits: any; rsvpCount: number }>({
                queryKey: ["/api/plan-limits"],
        });

        const checkoutMutation = useMutation({
                mutationFn: async (type: "subscription" | "one_time") => {
                        const body: any = { type };
                        if (referralInput.trim() && referralValid) {
                                body.referralCode = referralInput.trim();
                        }
                        const res = await apiRequest("POST", "/api/billing/checkout", body);
                        return res.json();
                },
                onSuccess: (data) => {
                        window.location.href = data.url;
                },
                onError: (err: any) => {
                        toast({ title: "Paiement impossible", description: err.message || "Le service de paiement est temporairement indisponible. Réessayez dans quelques instants.", variant: "destructive" });
                },
        });

        const syncMutation = useMutation({
                mutationFn: async () => {
                        const res = await apiRequest("POST", "/api/billing/sync", {});
                        return res.json();
                },
                onSuccess: async (data: any) => {
                        await queryClient.invalidateQueries({ queryKey: [`/api/weddings/${weddingId}`] });
                        toast({
                                title: "Synchronisation Stripe",
                                description: data?.currentPlan === "premium"
                                        ? "Votre abonnement Premium est actif."
                                        : "Aucun abonnement Premium actif détecté.",
                                variant: data?.currentPlan === "premium" ? "default" : "destructive",
                        });
                },
                onError: (err: any) => {
                        toast({ title: "Synchronisation impossible", description: err.message || "Impossible de synchroniser avec Stripe. Veuillez réessayer.", variant: "destructive" });
                },
        });

        const validateReferral = async (code: string) => {
                if (!code.trim()) { setReferralValid(null); return; }
                try {
                        const res = await fetch(`/api/referral/validate/${encodeURIComponent(code.trim())}`);
                        const data = await res.json();
                        setReferralValid(data.valid);
                } catch {
                        setReferralValid(false);
                }
        };

        const copyReferralCode = () => {
                if (!referralData?.code) return;
                navigator.clipboard.writeText(referralData.code);
                toast({ title: "Copié", description: "Code de parrainage copié dans le presse-papier." });
        };

        if (isLoading) return <Loader2 className="h-8 w-8 animate-spin mx-auto mt-20" />;

        const isPremium = wedding?.currentPlan === "premium";

        return (
                <div className="space-y-8">
                        <AdminPageHeader
                                title="Facturation"
                                description="Activez Premium pour débloquer tous les modules du site public et du backoffice."
                                actions={
                                        <Button variant="outline" onClick={() => syncMutation.mutate()} disabled={syncMutation.isPending}>
                                                {syncMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                                Synchroniser Stripe
                                        </Button>
                                }
                        />

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <KpiCard
                                        label="Plan actuel"
                                        value={isPremium ? "Premium" : "Découverte"}
                                        hint={isPremium ? "Modules illimités" : "30 invités max"}
                                        icon={<Crown className="h-5 w-5" />}
                                />
                                <KpiCard label="Abonnement" value="23,99€" hint="Par mois (min. 2 mois)" icon={<Check className="h-5 w-5" />} />
                                <KpiCard label="Annuel" value="149€" hint="Pour 1 an complet" icon={<CalendarDays className="h-5 w-5" />} />
                        </div>

                        {referralData && (
                                <Card className="p-6 bg-gradient-to-r from-primary/5 to-transparent">
                                        <div className="flex items-center gap-3 mb-3">
                                                <Share2 className="h-5 w-5 text-primary" />
                                                <h3 className="font-bold text-lg">Parrainage</h3>
                                        </div>
                                        <p className="text-sm text-muted-foreground mb-3">
                                                Partagez votre code avec vos amis. Ils bénéficieront de 10€ de réduction sur leur abonnement Premium.
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
                                                        {referralData.usageCount} ami{referralData.usageCount > 1 ? "s" : ""} parrainé{referralData.usageCount > 1 ? "s" : ""}
                                                </p>
                                        )}
                                </Card>
                        )}

                        <div className="grid md:grid-cols-3 gap-8">
                                <Card className={`p-8 relative ${!isPremium ? "border-primary shadow-lg ring-1 ring-primary" : ""}`}>
                                        {!isPremium && (
                                                <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2">
                                                        <span className="bg-primary text-primary-foreground text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                                                                Actuel
                                                        </span>
                                                </div>
                                        )}
                                        <div className="space-y-6">
                                                <div>
                                                        <h3 className="text-2xl font-bold">Découverte</h3>
                                                        <p className="text-muted-foreground">L'essentiel pour commencer</p>
                                                </div>
                                                <div className="text-4xl font-bold font-serif">0€</div>
                                                <ul className="space-y-3">
                                                        <Feature text="1 template" checked />
                                                        <Feature text="Jusqu'à 30 invités" checked />
                                                        <Feature text="Cagnotte activée" checked />
                                                        <Feature text="Branding Nocely visible" checked />
                                                        <Feature text="6 photos galerie max" checked />
                                                        <Feature text="Liste cadeaux" checked={false} />
                                                        <Feature text="Live contributions & blagues" checked={false} />
                                                        <Feature text="Pages personnalisées" checked={false} />
                                                </ul>
                                                <Button variant="outline" className="w-full" disabled={!isPremium}>
                                                        {!isPremium ? "Plan actuel" : "Sélectionner Découverte"}
                                                </Button>
                                        </div>
                                </Card>

                                <Card className={`p-8 relative overflow-hidden ${isPremium ? "border-primary shadow-lg ring-1 ring-primary" : "border-primary/50 shadow-xl ring-2 ring-primary/30 scale-[1.02]"}`}>
                                        {!isPremium && (
                                                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2">
                                                        <span className="bg-primary text-primary-foreground text-xs font-bold px-4 py-1.5 rounded-full uppercase tracking-wider shadow-lg">
                                                                Recommandé
                                                        </span>
                                                </div>
                                        )}
                                        <div className="absolute top-4 right-4 text-primary/20">
                                                <Crown className="h-24 w-24 rotate-12" />
                                        </div>
                                        {isPremium && (
                                                <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2">
                                                        <span className="bg-primary text-primary-foreground text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                                                                Actuel
                                                        </span>
                                                </div>
                                        )}
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
                                                        <Feature text="Suppression branding Nocely" checked />
                                                        <Feature text="50 photos galerie" checked />
                                                        <Feature text="Pages personnalisées" checked />
                                                        <Feature text="Exports complets" checked />
                                                </ul>
                                                {!isPremium && (
                                                        <div className="space-y-2">
                                                                <div className="flex gap-2">
                                                                        <Input
                                                                                placeholder="Code parrainage"
                                                                                value={referralInput}
                                                                                onChange={(e) => { setReferralInput(e.target.value); setReferralValid(null); }}
                                                                                onBlur={() => validateReferral(referralInput)}
                                                                                className="h-10 font-mono uppercase"
                                                                        />
                                                                        {referralValid === true && <span className="text-green-600 text-xs self-center font-semibold">-10€</span>}
                                                                        {referralValid === false && <span className="text-red-500 text-xs self-center">Invalide</span>}
                                                                </div>
                                                        </div>
                                                )}
                                                <Button
                                                        className="w-full h-12 text-base font-bold shadow-md"
                                                        disabled={isPremium || checkoutMutation.isPending}
                                                        onClick={() => checkoutMutation.mutate("subscription")}
                                                >
                                                        {checkoutMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                                        {isPremium ? "Déjà Premium" : "S'abonner — 23,99€/mois"}
                                                </Button>
                                                <p className="text-center text-xs text-muted-foreground">Minimum 2 mois, puis sans engagement.</p>
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
                                                {!isPremium && (
                                                        <div className="space-y-2">
                                                                <div className="flex gap-2">
                                                                        <Input
                                                                                placeholder="Code parrainage"
                                                                                value={referralInput}
                                                                                onChange={(e) => { setReferralInput(e.target.value); setReferralValid(null); }}
                                                                                onBlur={() => validateReferral(referralInput)}
                                                                                className="h-10 font-mono uppercase"
                                                                        />
                                                                        {referralValid === true && <span className="text-green-600 text-xs self-center font-semibold">-10€</span>}
                                                                        {referralValid === false && <span className="text-red-500 text-xs self-center">Invalide</span>}
                                                                </div>
                                                        </div>
                                                )}
                                                <Button
                                                        variant="outline"
                                                        className="w-full"
                                                        disabled={isPremium || checkoutMutation.isPending}
                                                        onClick={() => checkoutMutation.mutate("one_time")}
                                                >
                                                        {checkoutMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                                        {isPremium ? "Déjà Premium" : "Acheter — 149€/an"}
                                                </Button>
                                                <p className="text-center text-xs text-muted-foreground">Renouvelable chaque année.</p>
                                        </div>
                                </Card>
                        </div>
                </div>
        );
}

function Feature({ text, checked }: { text: string; checked: boolean }) {
        return (
                <li className={`flex items-center gap-3 text-sm ${checked ? "text-foreground" : "text-muted-foreground"}`}>
                        <Check className={`h-4 w-4 ${checked ? "text-green-500" : "text-muted-foreground/30"}`} />
                        <span>{text}</span>
                </li>
        );
}
