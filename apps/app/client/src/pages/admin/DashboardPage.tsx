import { Component, type ReactNode, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { type RsvpResponse, type Wedding } from "@shared/schema";
import { OnboardingChecklist } from "@/components/onboarding-checklist";
import { DashboardWidgets } from "@/components/dashboard-widgets";
import { GuidedTour, useShouldShowTour } from "@/components/guided-tour";
import { useParams, Link, useLocation } from "wouter";
import { Loader2, Users, CheckCircle2, XCircle, Calendar, Link2, Copy, ExternalLink, ArrowRight, Palette, PenLine, UserPlus, Rocket, Heart, Sparkles, LayoutList, Crown, ListChecks, CalendarDays, Lock } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { KpiCard } from "@/components/admin/KpiCard";
import { getAppNls } from "@/lib/nls";
import { Progress } from "@/components/ui/progress";
import { useChecklist, useOrganizationProgress, usePlanning } from "@/hooks/use-api";

class DashboardSectionErrorBoundary extends Component<
    { fallback: ReactNode; children: ReactNode },
    { hasError: boolean }
> {
    constructor(props: { fallback: ReactNode; children: ReactNode }) {
        super(props);
        this.state = { hasError: false };
    }

    static getDerivedStateFromError() {
        return { hasError: true };
    }

    componentDidCatch(error: unknown) {
        console.error("Dashboard section crashed:", error);
    }

    render() {
        if (this.state.hasError) return this.props.fallback;
        return this.props.children;
    }
}

function EmotionalGreeting({ wedding }: { wedding: Wedding }) {
    const language = wedding.config?.language === "en" ? "en" : "fr";
    const nls = getAppNls(language);
    const coupleNames = wedding.config?.texts?.heroTitle || wedding.title;
    const weddingDate = wedding.weddingDate ? new Date(wedding.weddingDate) : null;
    const now = new Date();
    const isPast = weddingDate && weddingDate.getTime() < now.getTime();

    let greeting: string;
    if (isPast) {
        greeting = `${coupleNames}, ${nls.dashboard.congratulationsSuffix}`;
    } else {
        greeting = `${coupleNames}, ${nls.dashboard.welcomeSuffix}`;
    }

    return (
        <div className="animate-slide-up">
            <p className="text-2xl md:text-3xl font-serif font-light tracking-tight text-foreground/90 leading-snug">
                {greeting}
            </p>
            <p className="text-sm text-muted-foreground/60 mt-1 font-light">
                {nls.dashboard.welcomeSubtitle}
            </p>
        </div>
    );
}

function WeddingCountdown({ wedding }: { wedding: Wedding }) {
    const language = wedding.config?.language === "en" ? "en" : "fr";
    const nls = getAppNls(language);
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
                    {nls.dashboard.weddingHappened}
                </p>
            </div>
        );
    }

    return (
        <div className="text-center py-4 animate-slide-up stagger-1">
            <p className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground/50 mb-1">{nls.dashboard.countdownLabel}</p>
            <p className="text-5xl md:text-6xl font-extralight tracking-tight text-foreground/80">{daysRemaining}</p>
            <p className="text-sm font-light text-muted-foreground/50 mt-0.5">
                {daysRemaining === 1 ? nls.dashboard.countdownDay : nls.dashboard.countdownDays}
            </p>
        </div>
    );
}

function NextStepCard({ wedding, hasGuests }: { wedding: Wedding; hasGuests: boolean }) {
    const language = wedding.config?.language === "en" ? "en" : "fr";
    const nls = getAppNls(language);
    const heroSubtitle = wedding.config?.texts?.heroSubtitle;

    let step: { label: string; description: string; href: string; icon: typeof Palette } | null = null;

    if (!wedding.templateId) {
        step = {
            label: nls.dashboard.steps.chooseDesign,
            description: nls.dashboard.steps.chooseDesignDesc,
            href: `~/${wedding.id}/templates`,
            icon: Palette,
        };
    } else if (!wedding.weddingDate || !heroSubtitle) {
        step = {
            label: nls.dashboard.steps.completeInfo,
            description: nls.dashboard.steps.completeInfoDesc,
            href: `~/${wedding.id}/design`,
            icon: PenLine,
        };
    } else if (!hasGuests) {
        step = {
            label: nls.dashboard.steps.addGuests,
            description: nls.dashboard.steps.addGuestsDesc,
            href: `~/${wedding.id}/guests`,
            icon: UserPlus,
        };
    } else if (!wedding.isPublished) {
        step = {
            label: nls.dashboard.steps.publish,
            description: nls.dashboard.steps.publishDesc,
            href: `~/${wedding.id}/welcome`,
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
                        <p className="text-[10px] uppercase tracking-[0.2em] text-amber-700/60 font-medium mb-1">{nls.dashboard.nextStepLabel}</p>
                        <p className="text-xl font-semibold text-foreground tracking-tight">{step.label}</p>
                        <p className="text-sm text-muted-foreground mt-0.5">{step.description}</p>
                    </div>
                    <Button asChild size="lg" className="rounded-xl gap-2 shrink-0 shadow-sm px-8 text-base">
                        <Link href={step.href}>
                            {step.label}
                            <ArrowRight className="h-4 w-4" />
                        </Link>
                    </Button>
                </div>
            </Card>
        </div>
    );
}

function SiteLink({ wedding }: { wedding: Wedding }) {
    const { toast } = useToast();
    const language = wedding.config?.language === "en" ? "en" : "fr";
    const nls = getAppNls(language);

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
                    toast({ title: nls.dashboard.linkCopied });
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
    const [, setLocation] = useLocation();
    const showTour = useShouldShowTour("dashboard");
    const [simplified, setSimplified] = useState(() => {
        try { return localStorage.getItem("daylora_simplified") === "true"; } catch { return false; }
    });

    const toggleSimplified = () => {
        const next = !simplified;
        setSimplified(next);
        try { localStorage.setItem("daylora_simplified", String(next)); } catch {}
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
    const { data: organizationProgress } = useOrganizationProgress();
    const { data: checklistData } = useChecklist();
    const { data: planningData } = usePlanning();

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
    const language = wedding?.config?.language === "en" ? "en" : "fr";
    const nls = getAppNls(language);

    return (
        <div className="space-y-10 pb-8">
            <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
                <div className="space-y-3" data-tour="dashboard-greeting">
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
                    <span className="text-xs">{simplified ? nls.dashboard.fullMode : nls.dashboard.simplify}</span>
                </Button>
            </div>

            {wedding && (
                <Card className="p-5 border-border/70">
                    <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                        <div>
                            <div className="flex items-center gap-2">
                                <Crown className={`h-4 w-4 ${wedding.currentPlan === "premium" ? "text-amber-600" : "text-muted-foreground"}`} />
                                <p className="text-sm font-semibold">
                                    {wedding.currentPlan === "premium" ? "Plan Premium actif" : "Plan Découverte"}
                                </p>
                            </div>
                            <p className="mt-1 text-sm text-muted-foreground">
                                {wedding.currentPlan === "premium"
                                    ? "Vous avez accès aux invités illimités, aux cadeaux illimités, aux templates premium et aux sites multiples."
                                    : "Vous pouvez créer 1 site, inviter jusqu'à 10 invités et ajouter jusqu'à 2 cadeaux."}
                            </p>
                        </div>
                        {wedding.currentPlan !== "premium" ? (
                            <Button asChild variant="outline" className="border-primary/30 text-primary hover:bg-primary/5">
                                <Link href={`~/${wedding.id}/billing`}>
                                    <Sparkles className="mr-2 h-4 w-4" />
                                    Débloquer Premium
                                </Link>
                            </Button>
                        ) : null}
                    </div>
                </Card>
            )}

            {wedding && <WeddingCountdown wedding={wedding} />}

            {wedding && <NextStepCard wedding={wedding} hasGuests={hasGuests} />}

            {organizationProgress ? (
                <Card className="rounded-2xl border-border/70 p-5 shadow-sm">
                    <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
                        <div>
                            <div className="flex items-center justify-between gap-4">
                                <div>
                                    <p className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground/60">Progression globale</p>
                                    <h2 className="mt-1 text-2xl font-semibold tracking-tight">{organizationProgress.score}% organisé</h2>
                                    <p className="mt-1 text-sm text-muted-foreground">
                                        Votre score se base sur le site, les invités, la communication et l’organisation.
                                    </p>
                                </div>
                                <div className="rounded-2xl bg-primary/10 px-4 py-3 text-right">
                                    <p className="text-2xl font-semibold text-primary">{organizationProgress.earnedPoints}</p>
                                    <p className="text-xs uppercase tracking-[0.18em] text-primary/70">sur {organizationProgress.totalPoints} points</p>
                                </div>
                            </div>
                            <Progress value={organizationProgress.score} className="mt-4 h-2.5" />
                            <div className="mt-4 grid gap-3 md:grid-cols-2">
                                <KpiCard
                                    label="Checklist"
                                    value={checklistData?.totals?.done || 0}
                                    hint={`${checklistData?.totals?.total || 0} tâches suivies`}
                                    icon={<ListChecks className="h-4.5 w-4.5" />}
                                />
                                <KpiCard
                                    label="Vue planning"
                                    value={planningData?.items?.length || 0}
                                    hint="Étapes planifiées"
                                    icon={<CalendarDays className="h-4.5 w-4.5" />}
                                />
                            </div>
                        </div>

                        <div className="rounded-2xl border border-border/70 bg-muted/20 p-4">
                            <p className="text-sm font-semibold">Prochaines actions recommandées</p>
                            <div className="mt-3 space-y-3">
                                {organizationProgress.nextActions.length > 0 ? organizationProgress.nextActions.map((action) => (
                                    <div key={action.key} className="rounded-xl bg-background p-3 shadow-sm">
                                        <p className="font-medium">{action.label}</p>
                                        <p className="mt-1 text-sm text-muted-foreground">{action.description}</p>
                                    </div>
                                )) : (
                                    <div className="rounded-xl bg-background p-3 shadow-sm">
                                        <p className="font-medium">Très bon rythme</p>
                                        <p className="mt-1 text-sm text-muted-foreground">
                                            Votre organisation est déjà bien avancée. Continuez à affiner les derniers détails.
                                        </p>
                                    </div>
                                )}
                            </div>
                            <div className="mt-4 flex flex-wrap gap-2">
                                <Button asChild variant="outline" size="sm">
                                    <Link href={`~/${weddingId}/checklist`}>
                                        {wedding?.currentPlan !== "premium" && <Crown className="mr-2 h-3 w-3 text-amber-500/70" />}
                                        Ouvrir la checklist
                                    </Link>
                                </Button>
                                <Button asChild variant="outline" size="sm">
                                    <Link href={`~/${weddingId}/checklist?view=planning`}>
                                        {wedding?.currentPlan !== "premium" && <Crown className="mr-2 h-3 w-3 text-amber-500/70" />}
                                        Voir la vue planning
                                    </Link>
                                </Button>
                            </div>
                        </div>
                    </div>
                </Card>
            ) : null}

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 animate-slide-up stagger-3" data-tour="dashboard-kpis">
                <KpiCard
                    label={nls.dashboard.kpis.guests}
                    value={total}
                    icon={<Users className="h-4.5 w-4.5" />}
                    hint={nls.dashboard.kpis.guestsHint}
                    max={wedding?.currentPlan !== "premium" ? 10 : undefined}
                />
                <KpiCard
                    label={nls.dashboard.kpis.confirmed}
                    value={confirmed}
                    icon={<CheckCircle2 className="h-4.5 w-4.5" />}
                    hint={nls.dashboard.kpis.confirmedHint}
                />
                {!simplified && (
                    <KpiCard
                        label={nls.dashboard.kpis.pending}
                        value={pending}
                        icon={<Calendar className="h-4.5 w-4.5" />}
                        hint={nls.dashboard.kpis.pendingHint}
                    />
                )}
                {!simplified && (
                    <KpiCard
                        label={nls.dashboard.kpis.declined}
                        value={declined}
                        icon={<XCircle className="h-4.5 w-4.5" />}
                        hint={nls.dashboard.kpis.declinedHint}
                    />
                )}
            </div>

            <div data-tour="dashboard-checklist">
                <DashboardSectionErrorBoundary
                    fallback={
                        <Card className="rounded-2xl border-border/70 p-5 shadow-sm">
                            <p className="text-sm font-semibold">Checklist</p>
                            <p className="mt-1 text-sm text-muted-foreground">
                                Cette zone se recharge encore. Vous pouvez déjà continuer depuis les autres sections du tableau de bord.
                            </p>
                            {wedding ? (
                                <Button asChild className="mt-4">
                                    <Link href={`~/${wedding.id}/checklist`}>Ouvrir la checklist</Link>
                                </Button>
                            ) : null}
                        </Card>
                    }
                >
                    {wedding && <OnboardingChecklist wedding={wedding} />}
                </DashboardSectionErrorBoundary>
            </div>

            {!simplified && (
                <DashboardSectionErrorBoundary
                    fallback={
                        <Card className="rounded-2xl border-border/70 p-5 shadow-sm">
                            <p className="text-sm font-semibold">Statistiques détaillées</p>
                            <p className="mt-1 text-sm text-muted-foreground">
                                Les graphiques détaillés ne se sont pas chargés cette fois. Les indicateurs principaux restent bien disponibles plus haut.
                            </p>
                        </Card>
                    }
                >
                    <DashboardWidgets
                        responses={responses || []}
                        language={language}
                        onFilterChange={(filter) => {
                            setLocation(`~/${weddingId}/guests?availability=${filter}`);
                        }}
                    />
                </DashboardSectionErrorBoundary>
            )}

            {showTour && (
                <DashboardSectionErrorBoundary fallback={null}>
                    <GuidedTour
                        tourId="dashboard"
                        steps={[
                            { target: "dashboard-greeting", title: nls.dashboard.tour.welcomeTitle, description: nls.dashboard.tour.welcomeDesc, position: "bottom" },
                            { target: "dashboard-kpis", title: nls.dashboard.tour.statsTitle, description: nls.dashboard.tour.statsDesc, position: "bottom" },
                            { target: "dashboard-checklist", title: nls.dashboard.tour.progressTitle, description: nls.dashboard.tour.progressDesc, position: "top" },
                        ]}
                    />
                </DashboardSectionErrorBoundary>
            )}
        </div>
    );
}
