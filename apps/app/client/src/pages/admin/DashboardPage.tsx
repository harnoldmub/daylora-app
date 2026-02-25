import { useQuery } from "@tanstack/react-query";
import { type RsvpResponse, type Wedding } from "@shared/schema";
import { OnboardingChecklist } from "@/components/onboarding-checklist";
import { DashboardWidgets } from "@/components/dashboard-widgets";
import { GuidedTour, useShouldShowTour } from "@/components/guided-tour";
import { useParams, Link } from "wouter";
import { Loader2, Users, CheckCircle2, XCircle, Calendar, Link2, Copy, ExternalLink, ArrowRight, Palette, PenLine, UserPlus, Gift, Rocket, Heart } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { KpiCard } from "@/components/admin/KpiCard";

function WeddingCountdown({ wedding }: { wedding: Wedding }) {
    const weddingDate = wedding.weddingDate ? new Date(wedding.weddingDate) : null;

    if (!weddingDate) return null;

    const now = new Date();
    const diffMs = weddingDate.getTime() - now.getTime();
    const daysRemaining = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

    if (daysRemaining < 0) {
        return (
            <Card className="p-8 text-center rounded-2xl border-0 shadow-md bg-gradient-to-br from-rose-50/80 to-amber-50/60">
                <Heart className="h-8 w-8 mx-auto mb-3 text-rose-400" />
                <p className="text-2xl font-light tracking-tight text-foreground/90">
                    Félicitations pour votre mariage !
                </p>
            </Card>
        );
    }

    return (
        <Card className="p-8 text-center rounded-2xl border-0 shadow-md bg-gradient-to-br from-amber-50/60 to-rose-50/40">
            <p className="text-sm uppercase tracking-widest text-muted-foreground mb-2">Votre mariage est dans</p>
            <p className="text-6xl font-extralight tracking-tight text-foreground mb-1">{daysRemaining}</p>
            <p className="text-lg font-light text-muted-foreground">
                {daysRemaining === 1 ? "jour" : "jours"}
            </p>
        </Card>
    );
}

function NextStepCard({ wedding, hasGuests }: { wedding: Wedding; hasGuests: boolean }) {
    const heroSubtitle = wedding.config?.texts?.heroSubtitle;

    let step: { label: string; description: string; href: string; icon: typeof Palette } | null = null;

    if (!wedding.templateId) {
        step = {
            label: "Choisir un design",
            description: "Sélectionnez un template pour donner vie à votre site de mariage.",
            href: `/${wedding.id}/admin/templates`,
            icon: Palette,
        };
    } else if (!wedding.weddingDate || !heroSubtitle) {
        step = {
            label: "Compléter les informations",
            description: "Ajoutez la date et les détails de votre mariage.",
            href: `/${wedding.slug}`,
            icon: PenLine,
        };
    } else if (!hasGuests) {
        step = {
            label: "Ajouter vos invités",
            description: "Commencez à constituer votre liste d'invités.",
            href: `/${wedding.id}/admin/guests`,
            icon: UserPlus,
        };
    } else if (!wedding.isPublished) {
        step = {
            label: "Publier votre site",
            description: "Votre site est prêt ! Partagez-le avec vos proches.",
            href: `/${wedding.id}/admin/welcome`,
            icon: Rocket,
        };
    }

    if (!step) return null;

    const Icon = step.icon;

    return (
        <Card className="p-6 rounded-2xl border-0 shadow-md bg-gradient-to-r from-amber-50 to-rose-50 overflow-hidden">
            <div className="flex items-center gap-5">
                <div className="h-14 w-14 rounded-2xl bg-white/80 shadow-sm flex items-center justify-center shrink-0">
                    <Icon className="h-6 w-6 text-amber-600" />
                </div>
                <div className="flex-1 min-w-0">
                    <p className="text-xs uppercase tracking-widest text-amber-700/70 mb-0.5">Prochaine étape</p>
                    <p className="text-lg font-semibold text-foreground">{step.label}</p>
                    <p className="text-sm text-muted-foreground">{step.description}</p>
                </div>
                <Link href={step.href}>
                    <Button size="lg" className="rounded-xl gap-2 shrink-0">
                        {step.label}
                        <ArrowRight className="h-4 w-4" />
                    </Button>
                </Link>
            </div>
        </Card>
    );
}

export default function DashboardPage() {
    const { weddingId } = useParams<{ weddingId: string }>();
    const { toast } = useToast();
    const showTour = useShouldShowTour();

    const { data: responses, isLoading: responsesLoading } = useQuery<RsvpResponse[]>({
        queryKey: ["/api/rsvp", weddingId],
        enabled: !!weddingId,
    });

    const { data: wedding, isLoading: weddingLoading } = useQuery<Wedding>({
        queryKey: [`/api/weddings/${weddingId}`],
        enabled: !!weddingId,
    });

    const { data: guests } = useQuery<any[]>({
        queryKey: ["/api/guests", weddingId],
        enabled: !!weddingId,
    });

    if (responsesLoading || weddingLoading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    const total = (responses || []).reduce((sum, r) => sum + (r.partySize || 1), 0);
    const confirmed = (responses || []).filter((r) => r.availability === "confirmed").reduce((sum, r) => sum + (r.partySize || 1), 0);
    const declined = (responses || []).filter((r) => r.availability === "declined").reduce((sum, r) => sum + (r.partySize || 1), 0);
    const pending = total - confirmed - declined;
    const hasGuests = Array.isArray(guests) && guests.length > 0;

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <AdminPageHeader
                title="Tableau de bord"
                description={
                    <>
                        Vue d'ensemble Nocely pour <span className="font-semibold">{wedding?.title}</span>
                    </>
                }
                actions={
                    wedding ? (
                        <Card className="flex items-center gap-3 p-3 bg-primary/5 border-primary/10 max-w-sm w-full">
                            <div className="h-8 w-8 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
                                <Link2 className="h-4 w-4" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">Site public</div>
                                <div className="text-sm font-medium truncate">/{wedding.slug}</div>
                            </div>
                            <div className="flex items-center gap-1 shrink-0">
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 text-primary hover:bg-primary/10"
                                    onClick={() => {
                                        const url = `${window.location.origin}/${wedding.slug}`;
                                        navigator.clipboard.writeText(url);
                                        toast({ title: "Lien copié", description: "L'URL publique est prête à être partagée." });
                                    }}
                                >
                                    <Copy className="h-3.5 w-3.5" />
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 text-primary hover:bg-primary/10"
                                    onClick={() => window.open(`/${wedding.slug}`, "_blank")}
                                >
                                    <ExternalLink className="h-3.5 w-3.5" />
                                </Button>
                            </div>
                        </Card>
                    ) : null
                }
            />

            {wedding && <WeddingCountdown wedding={wedding} />}

            {wedding && <NextStepCard wedding={wedding} hasGuests={hasGuests} />}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                    { label: "Invités", value: total, icon: Users, hint: "RSVP reçus", max: wedding?.currentPlan !== "premium" ? 30 : undefined },
                    { label: "Confirmés", value: confirmed, icon: CheckCircle2, hint: "Présences validées" },
                    { label: "En attente", value: pending, icon: Calendar, hint: "Réponses à relancer" },
                    { label: "Refusés", value: declined, icon: XCircle, hint: "Indisponibles" },
                ].map((item) => (
                    <KpiCard
                        key={item.label}
                        label={item.label}
                        value={item.value}
                        hint={item.hint}
                        icon={<item.icon className="h-5 w-5" />}
                        max={item.max}
                    />
                ))}
            </div>

            {wedding && <OnboardingChecklist wedding={wedding} />}

            <DashboardWidgets
                responses={responses || []}
                onFilterChange={(filter) => {
                    window.location.href = `guests?availability=${filter}`;
                }}
            />

            {showTour && <GuidedTour />}
        </div>
    );
}
