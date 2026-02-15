import { useMutation, useQuery } from "@tanstack/react-query";
import { Check, Crown, Loader2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { type Wedding } from "@shared/schema";
import { useParams } from "wouter";

export default function PricingPage() {
    const { weddingId } = useParams<{ weddingId: string }>();
    const { toast } = useToast();

    const { data: wedding, isLoading } = useQuery<Wedding>({
        queryKey: [`/api/weddings/${weddingId}`],
        enabled: !!weddingId,
    });

    const checkoutMutation = useMutation({
        mutationFn: async (type: 'subscription' | 'one_time') => {
            const res = await fetch("/api/billing/checkout", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ type }),
            });
            if (!res.ok) throw new Error("Erreur lors de la création de la session");
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

    if (isLoading) return <Loader2 className="h-8 w-8 animate-spin mx-auto mt-20" />;

    const isPremium = wedding?.currentPlan === 'premium';

    return (
        <div className="max-w-5xl mx-auto space-y-12">
            <div className="text-center space-y-4">
                <h1 className="text-4xl font-serif font-bold tracking-tight">Choisissez votre formule</h1>
                <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                    Simplifiez l'organisation de votre mariage avec nos outils premium et offrez une expérience unique à vos invités.
                </p>
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
                            <Feature text="1 Template classique" checked />
                            <Feature text="Jusqu'à 50 invités" checked />
                            <Feature text="RSVP Standard" checked />
                            <Feature text="Liste cadeaux" checked={false} />
                            <Feature text="Live features" checked={false} />
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
                            <h3 className="text-2xl font-bold">Premium Gold</h3>
                            <p className="text-muted-foreground">L'excellence pour votre mariage</p>
                        </div>
                        <div className="flex items-baseline gap-2">
                            <span className="text-4xl font-bold font-serif">29€</span>
                            <span className="text-muted-foreground">/ mois</span>
                        </div>
                        <ul className="space-y-3">
                            <Feature text="Tous les Templates" checked />
                            <Feature text="Invités illimités" checked />
                            <Feature text="Liste cadeaux & Cagnotte" checked />
                            <Feature text="Live Contributions & Jokes" checked />
                            <Feature text="Exports Excel complets" checked />
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
                            Sans engagement. Annulez dès que votre mariage est terminé.
                        </p>
                    </div>
                </Card>
            </div>

            <div className="bg-muted/30 rounded-2xl p-8 text-center space-y-4">
                <h2 className="text-xl font-bold">Vous préférez un paiement unique ?</h2>
                <p className="text-muted-foreground max-w-xl mx-auto">
                    Accédez à vie (pas de limite mensuelle) à toutes les fonctionnalités Premium pour un montant fixe.
                </p>
                <Button
                    variant="outline"
                    disabled={isPremium || checkoutMutation.isPending}
                    onClick={() => checkoutMutation.mutate('one_time')}
                >
                    Acheter l'accès complet pour 149€
                </Button>
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
