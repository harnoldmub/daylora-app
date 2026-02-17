import { useMutation, useQuery } from "@tanstack/react-query";
import { Check, Crown, Loader2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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

    const { data: wedding, isLoading } = useQuery<Wedding>({
        queryKey: [`/api/weddings/${weddingId}`],
        enabled: !!weddingId,
    });

    const checkoutMutation = useMutation({
        mutationFn: async (type: 'subscription' | 'one_time') => {
            const res = await apiRequest("POST", "/api/billing/checkout", { type });
            return res.json();
        },
        onSuccess: (data) => {
            window.location.href = data.url;
        },
        onError: (err: any) => {
            toast({
                title: "Erreur",
                description: err.message,
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
            toast({
                title: "Erreur",
                description: err.message || "Sync Stripe impossible",
                variant: "destructive",
            });
        },
    });

    if (isLoading) return <Loader2 className="h-8 w-8 animate-spin mx-auto mt-20" />;

    const isPremium = wedding?.currentPlan === 'premium';

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
                        {syncMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Synchroniser Stripe
                    </Button>
                }
            />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <KpiCard
                    label="Plan actuel"
                    value={isPremium ? "Premium" : "Découverte"}
                    hint={isPremium ? "Modules illimités" : "Fonctionnalités essentielles"}
                    icon={<Crown className="h-5 w-5" />}
                />
                <KpiCard
                    label="Abonnement"
                    value="19€"
                    hint="Par mois"
                    icon={<Check className="h-5 w-5" />}
                />
                <KpiCard
                    label="Accès à vie"
                    value="149€"
                    hint="Paiement unique"
                    icon={<Check className="h-5 w-5" />}
                />
            </div>

            <div className="grid md:grid-cols-2 gap-8">
                {/* Free Plan */}
                <Card className={`p-8 relative ${!isPremium ? 'border-primary shadow-lg ring-1 ring-primary' : ''}`}>
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
                            <Feature text="Jusqu'à 50 invités" checked />
                            <Feature text="Cagnotte activée" checked />
                            <Feature text="Branding Nocely visible" checked />
                            <Feature text="Liste cadeaux" checked={false} />
                            <Feature text="Live contributions avancé" checked={false} />
                        </ul>
                        <Button variant="outline" className="w-full" disabled={!isPremium}>
                            {!isPremium ? "Plan actuel" : "Sélectionner Découverte"}
                        </Button>
                    </div>
                </Card>

                {/* Premium Plan */}
                <Card className={`p-8 relative overflow-hidden ${isPremium ? 'border-primary shadow-lg ring-1 ring-primary' : ''}`}>
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
                            <span className="text-4xl font-bold font-serif">19€</span>
                            <span className="text-muted-foreground">/ mois</span>
                        </div>
                        <ul className="space-y-3">
                            <Feature text="2 templates premium" checked />
                            <Feature text="Invités illimités" checked />
                            <Feature text="Liste cadeaux" checked />
                            <Feature text="Live Contributions & Jokes" checked />
                            <Feature text="Suppression branding Nocely" checked />
                            <Feature text="Exports complets" checked />
                            <Feature text="Emails illimités" checked />
                        </ul>
                        <Button
                            className="w-full"
                            disabled={isPremium || checkoutMutation.isPending}
                            onClick={() => checkoutMutation.mutate('subscription')}
                        >
                            {checkoutMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {isPremium ? "Déjà Premium" : "Passer au Premium"}
                        </Button>
                        <p className="text-center text-xs text-muted-foreground">
                            Minimum 2 mois, puis sans engagement.
                        </p>
                    </div>
                </Card>
            </div>
        </div>
    );
}

function Feature({ text, checked }: { text: string; checked: boolean }) {
    return (
        <li className={`flex items-center gap-3 text-sm ${checked ? 'text-foreground' : 'text-muted-foreground'}`}>
            <Check className={`h-4 w-4 ${checked ? 'text-green-500' : 'text-muted-foreground/30'}`} />
            <span>{text}</span>
        </li>
    );
}
