import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { type RsvpResponse, type Wedding } from "@shared/schema";
import { OnboardingChecklist } from "@/components/onboarding-checklist";
import { DashboardWidgets } from "@/components/dashboard-widgets";
import { GuidedTour, useShouldShowTour } from "@/components/guided-tour";
import { useParams, Link } from "wouter";
import { Loader2, Users, CheckCircle2, XCircle, Calendar, Link2, Copy, ExternalLink, ArrowRight, Palette, PenLine, UserPlus, Rocket, Heart, Sparkles, LayoutList } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { KpiCard } from "@/components/admin/KpiCard";

function EmotionalGreeting({ wedding }: { wedding: Wedding }) {
    const coupleNames = wedding.config?.texts?.heroTitle || wedding.title;
    const weddingDate = wedding.weddingDate ? new Date(wedding.weddingDate) : null;
    const now = new Date();
    const isPast = weddingDate && weddingDate.getTime() < now.getTime();

    let greeting: string;
    if (isPast) {
        greeting = `Félicitations ${coupleNames}, votre belle histoire continue.`;
    } else {
        greeting = `${coupleNames}, votre histoire commence ici.`;
    }

    return (
        <div className="animate-slide-up">
            <p className="text-2xl md:text-3xl font-serif font-light tracking-tight text-foreground/90 leading-snug">
                {greeting}
            </p>
            <p className="text-sm text-muted-foreground/60 mt-1 font-light">
                Bienvenue dans la création de votre journée inoubliable
            </p>
        </div>
    );
}

function WeddingCountdown({ wedding }: { wedding: Wedding }) {
    const weddingDate = wedding.weddingDate ? new Date(wedding.weddingDate) : null;

    if (!weddingDate) return null;

    const now = new Date();
    const diffMs = weddingDate.getTime() - now.getTime();
    const daysRemaining = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

    if (daysRemaining < 0) {
        return (
            <div className="text-center py-6 animate-slide-up stagger-1">
                <Heart className="h-6 w-6 mx-auto mb-2 text-rose-300" />
                <p className="text-lg font-light text-muted-foreground">
                    Votre mariage a eu lieu — profitez de chaque souvenir.
                </p>
            </div>
        );
    }

    return (
        <div className="text-center py-4 animate-slide-up stagger-1">
            <p className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground/50 mb-1">Jour J dans</p>
            <p className="text-5xl md:text-6xl font-extralight tracking-tight text-foreground/80">{daysRemaining}</p>
            <p className="text-sm font-light text-muted-foreground/50 mt-0.5">
                {daysRemaining === 1 ? "jour" : "jours"}
            </p>
        </div>
    );
}

function NextStepCard({ wedding, hasGuests }: { wedding: Wedding; hasGuests: boolean }) {
    const heroSubtitle = wedding.config?.texts?.heroSubtitle;

    let step: { label: string; description: string; href: string; icon: typeof Palette } | null = null;

    if (!wedding.templateId) {
        step = {
            label: "Choisir un design",
            description: "Sélectionnez un template pour donner vie à votre site.",
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
            description: "Votre site est prêt — partagez-le avec vos proches.",
            href: `/${wedding.id}/admin/welcome`,
            icon: Rocket,
        };
    }

    if (!step) return null;

    const Icon = step.icon;

    return (
        <div className="animate-slide-up stagger-2">
            <Card className="relative p-0 rounded-2xl border-0 overflow-hidden shadow-md">
                <div className="absolute inset-0 bg-gradient-to-r from-amber-50/80 via-rose-50/40 to-amber-50/60" />
                <div className="relative p-6 md:p-8 flex flex-col md:flex-row items-start md:items-center gap-5">
                    <div className="h-14 w-14 rounded-2xl bg-white shadow-sm flex items-center justify-center shrink-0">
                        <Icon className="h-6 w-6 text-amber-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-[10px] uppercase tracking-[0.2em] text-amber-700/60 font-medium mb-1">Prochaine étape</p>
                        <p className="text-xl font-semibold text-foreground tracking-tight">{step.label}</p>
                        <p className="text-sm text-muted-foreground mt-0.5">{step.description}</p>
                    </div>
                    <Link href={step.href}>
                        <Button size="lg" className="rounded-xl gap-2 shrink-0 shadow-sm px-8 text-base">
                            {step.label}
                            <ArrowRight className="h-4 w-4" />
                        </Button>
                    </Link>
                </div>
            </Card>
        </div>
    );
}

function SiteLink({ wedding }: { wedding: Wedding }) {
    const { toast } = useToast();

    return (
        <div className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl bg-muted/40 border border-border/40 max-w-sm">
            <Link2 className="h-3.5 w-3.5 text-muted-foreground/50 shrink-0" />
            <span className="text-sm text-muted-foreground truncate flex-1">/{wedding.slug}</span>
            <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-muted-foreground/50 hover:text-foreground"
                onClick={() => {
                    const url = `${window.location.origin}/${wedding.slug}`;
                    navigator.clipboard.writeText(url);
                    toast({ title: "Lien copié" });
                }}
            >
                <Copy className="h-3 w-3" />
            </Button>
            <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-muted-foreground/50 hover:text-foreground"
                onClick={() => window.open(`/${wedding.slug}`, "_blank")}
            >
                <ExternalLink className="h-3 w-3" />
            </Button>
        </div>
    );
}

export default function DashboardPage() {
    const { weddingId } = useParams<{ weddingId: string }>();
    const showTour = useShouldShowTour();
    const [simplified, setSimplified] = useState(() => {
        try { return localStorage.getItem("nocely_simplified") === "true"; } catch { return false; }
    });

    const toggleSimplified = () => {
        const next = !simplified;
        setSimplified(next);
        try { localStorage.setItem("nocely_simplified", String(next)); } catch {}
    };

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
                <Loader2 className="h-8 w-8 animate-spin text-primary/40" />
            </div>
        );
    }

    const total = (responses || []).reduce((sum, r) => sum + (r.partySize || 1), 0);
    const confirmed = (responses || []).filter((r) => r.availability === "confirmed").reduce((sum, r) => sum + (r.partySize || 1), 0);
    const declined = (responses || []).filter((r) => r.availability === "declined").reduce((sum, r) => sum + (r.partySize || 1), 0);
    const pending = total - confirmed - declined;
    const hasGuests = Array.isArray(guests) && guests.length > 0;

    return (
        <div className="space-y-10 pb-8">
            <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
                <div className="space-y-3">
                    {wedding && <EmotionalGreeting wedding={wedding} />}
                    {wedding && <SiteLink wedding={wedding} />}
                </div>
                <Button
                    variant="ghost"
                    size="sm"
                    className="text-muted-foreground/50 hover:text-foreground gap-2 self-start md:self-auto"
                    onClick={toggleSimplified}
                >
                    {simplified ? <Sparkles className="h-3.5 w-3.5" /> : <LayoutList className="h-3.5 w-3.5" />}
                    <span className="text-xs">{simplified ? "Mode complet" : "Simplifier"}</span>
                </Button>
            </div>

            {wedding && <WeddingCountdown wedding={wedding} />}

            {wedding && <NextStepCard wedding={wedding} hasGuests={hasGuests} />}

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 animate-slide-up stagger-3">
                <KpiCard
                    label="Invités"
                    value={total}
                    icon={<Users className="h-4.5 w-4.5" />}
                    hint="RSVP reçus"
                    max={wedding?.currentPlan !== "premium" ? 30 : undefined}
                />
                <KpiCard
                    label="Confirmés"
                    value={confirmed}
                    icon={<CheckCircle2 className="h-4.5 w-4.5" />}
                    hint="Présences"
                />
                {!simplified && (
                    <KpiCard
                        label="En attente"
                        value={pending}
                        icon={<Calendar className="h-4.5 w-4.5" />}
                        hint="À relancer"
                    />
                )}
                {!simplified && (
                    <KpiCard
                        label="Refusés"
                        value={declined}
                        icon={<XCircle className="h-4.5 w-4.5" />}
                        hint="Indisponibles"
                    />
                )}
            </div>

            {wedding && <OnboardingChecklist wedding={wedding} />}

            {!simplified && (
                <DashboardWidgets
                    responses={responses || []}
                    onFilterChange={(filter) => {
                        window.location.href = `guests?availability=${filter}`;
                    }}
                />
            )}

            {showTour && <GuidedTour />}
        </div>
    );
}
