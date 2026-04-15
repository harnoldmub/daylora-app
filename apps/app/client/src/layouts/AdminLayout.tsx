import { ReactNode, useEffect, useState } from "react";
import { Link, useLocation, useParams } from "wouter";
import {
    LayoutDashboard,
    Users,
    Gift,
    CreditCard,
    Mail,
    Palette,
    LogOut,
    ChevronRight,
    Home,
    MessageSquare,
    Settings,
    Paintbrush,
    ListTree,
    ScanLine,
    Tag,
    ListChecks,
    Wallet,
    ExternalLink,
    HelpCircle,
    Menu,
    X,
    Languages,
    Plus,
    Lock,
    Crown
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useCreateWedding, useUpdateWedding, useWeddings } from "@/hooks/use-api";
import { Button } from "@/components/ui/button";
import { HelpChatbot } from "@/components/admin/HelpChatbot";
import { FeedbackModal } from "@/components/admin/FeedbackModal";
import { PremiumUpsellModal } from "@/components/admin/PremiumUpsellModal";
import { InternalSupportChat } from "@/components/support/InternalSupportChat";
import { getAppNls } from "@/lib/nls";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export function AdminLayout({ children, weddingId: weddingIdProp }: { children: ReactNode; weddingId?: string }) {
    const params = useParams<{ weddingId: string }>();
    const weddingId = weddingIdProp || params.weddingId || "";
    const [location, setLocation] = useLocation();
    const { logoutMutation, user } = useAuth();
    const { data: weddings = [] } = useWeddings();
    const updateWedding = useUpdateWedding();
    const createWedding = useCreateWedding();
    const { toast } = useToast();
    const currentWeddingForModal = weddings.find((w: any) => w.id === (weddingIdProp || params.weddingId));
    const ownedWeddings = weddings.filter((item: any) => item.ownerId === user?.id);
    const canManageMultipleSites = !!user?.isAdmin || ownedWeddings.some((item: any) => item.currentPlan === "premium");
    const persistedLanguage = (currentWeddingForModal?.config as any)?.language === "en" ? "en" : "fr";
    const [languageOverride, setLanguageOverride] = useState<"fr" | "en" | null>(null);
    const currentLanguage = languageOverride ?? persistedLanguage;
    const nls = getAppNls(currentLanguage);
    const isDesignRoute = location.includes("/design");
    const currentWeddingTitle = currentWeddingForModal?.title || "Choisir un site";
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [helpMenuOpen, setHelpMenuOpen] = useState(false);
    const [createSiteDialogOpen, setCreateSiteDialogOpen] = useState(false);
    const [newSiteTitle, setNewSiteTitle] = useState("");
    const [newSiteSlug, setNewSiteSlug] = useState("");
    const [newSiteDate, setNewSiteDate] = useState("");
    const [newSiteSlugEdited, setNewSiteSlugEdited] = useState(false);
    const canCreateAnotherSite = canManageMultipleSites || ownedWeddings.length === 0;

    useEffect(() => {
        setLanguageOverride(null);
    }, [persistedLanguage, currentWeddingForModal?.id]);

    const handleLanguageChange = async (nextLanguage: "fr" | "en") => {
        if (!currentWeddingForModal || nextLanguage === persistedLanguage || updateWedding.isPending) return;
        setLanguageOverride(nextLanguage);
        try {
            await updateWedding.mutateAsync({
                id: currentWeddingForModal.id,
                config: {
                    ...(currentWeddingForModal.config || {}),
                    language: nextLanguage,
                },
            });
        } catch {
            setLanguageOverride(null);
        }
    };

    const languageSwitcher = (
        <div className="rounded-xl border border-sidebar-border/80 bg-sidebar-accent/40 p-3">
            <div className="mb-2 flex items-center gap-2 text-xs font-medium uppercase tracking-[0.18em] text-sidebar-foreground/60">
                <Languages className="h-3.5 w-3.5" />
                <span>{nls.adminLayout.languageLabel}</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
                {([
                    ["fr", nls.adminLayout.languageFr],
                    ["en", nls.adminLayout.languageEn],
                ] as const).map(([value, label]) => {
                    const isActive = currentLanguage === value;
                    return (
                        <Button
                            key={value}
                            type="button"
                            variant={isActive ? "default" : "outline"}
                            size="sm"
                            disabled={!currentWeddingForModal || updateWedding.isPending}
                            className={isActive
                                ? "h-9 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90"
                                : "h-9 rounded-lg border-sidebar-border bg-background/80 text-sidebar-foreground hover:bg-sidebar-accent"}
                            onClick={() => handleLanguageChange(value)}
                        >
                            {label}
                        </Button>
                    );
                })}
            </div>
        </div>
    );
    const supportPageLabel =
        location === "/templates" ? nls.adminLayout.pageLabels.templates :
        location === "/design" ? nls.adminLayout.pageLabels.design :
        location === "/guests" ? nls.adminLayout.pageLabels.guests :
        location.startsWith("/checklist") ? "Checklist" :
        location.startsWith("/budget") ? "Budget" :
        location === "/guest-experience" ? nls.adminLayout.pageLabels.guestExperience :
        location === "/billing" ? nls.adminLayout.pageLabels.billing :
        location === "/gifts" ? nls.adminLayout.pageLabels.gifts :
        location === "/site" ? nls.adminLayout.pageLabels.site :
        location === "/check-in-ops" ? nls.adminLayout.pageLabels.checkInOps :
        "";
    const fallbackSupportPageLabel = (() => {
        if (supportPageLabel) return supportPageLabel;
        const cleanedLocation = location.replace(/^~\//, "/").split("?")[0].split("#")[0];
        if (cleanedLocation === "/" || cleanedLocation === "") return nls.adminLayout.pageLabels.home;
        const lastSegment = cleanedLocation.split("/").filter(Boolean).pop();
        if (!lastSegment) return nls.adminLayout.pageLabels.fallback;
        return decodeURIComponent(lastSegment)
            .replace(/[-_]+/g, " ")
            .replace(/\b\w/g, (letter) => letter.toUpperCase());
    })();

    const isPremium = currentWeddingForModal?.currentPlan === "premium";

    const navItems = [
        { name: nls.adminLayout.nav.home, icon: Home, href: "/welcome" },
        { name: nls.adminLayout.nav.dashboard, icon: LayoutDashboard, href: "/dashboard" },
        { name: nls.adminLayout.nav.design, icon: Paintbrush, href: "/design" },
        { name: nls.adminLayout.nav.guests, icon: Users, href: "/guests" },
        { name: "Checklist", icon: ListChecks, href: "/checklist", isPremiumOnly: true },
        { name: "Budget", icon: Wallet, href: "/budget", isPremiumOnly: true },
        { name: nls.adminLayout.nav.guestExperience, icon: Tag, href: "/guest-experience", isPremiumOnly: true },
        { name: nls.adminLayout.nav.checkInOps, icon: ScanLine, href: "/check-in-ops", isPremiumOnly: true },
        { name: nls.adminLayout.nav.templates, icon: Palette, href: "/templates" },
        { name: nls.adminLayout.nav.site, icon: ListTree, href: "/site" },
        { name: nls.adminLayout.nav.gifts, icon: Gift, href: "/gifts" },
        { name: nls.adminLayout.nav.emails, icon: Mail, href: "/emails" },
        { name: nls.adminLayout.nav.billing, icon: CreditCard, href: "/billing" },
        ...(user?.isAdmin ? [{ name: nls.adminLayout.nav.feedback, icon: MessageSquare, href: "/feedback" }] : []),
        { name: nls.adminLayout.nav.settings, icon: Settings, href: "/settings" },
    ];

    const buildSlug = (value: string) =>
        value
            .toLowerCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/^-+|-+$/g, "")
            .slice(0, 80);

    const handleOpenCreateSite = () => {
        if (!canCreateAnotherSite) {
            toast({
                title: "Un seul site pour le moment",
                description: "Votre espace actuel inclut déjà un site. Passez au Premium pour en créer plusieurs.",
                variant: "soft",
            });
            setLocation("/billing");
            return;
        }
        setCreateSiteDialogOpen(true);
    };

    const handleCreateSite = async () => {
        const nextTitle = newSiteTitle.trim();
        const nextSlug = buildSlug(newSiteSlug || newSiteTitle);

        if (nextTitle.length < 3) {
            toast({
                title: "Donnez-lui un nom un peu plus précis",
                description: "Ajoutez au moins 3 caractères pour que le site soit facile à reconnaître.",
                variant: "soft",
            });
            return;
        }

        if (nextSlug.length < 3) {
            toast({
                title: "L'adresse mérite d'être complétée",
                description: "Choisissez une adresse un peu plus précise pour pouvoir la partager facilement.",
                variant: "soft",
            });
            return;
        }

        try {
            const created = await createWedding.mutateAsync({
                title: nextTitle,
                slug: nextSlug,
                weddingDate: newSiteDate ? new Date(newSiteDate) : undefined,
                templateId: currentWeddingForModal?.templateId || "classic",
                toneId: (currentWeddingForModal?.config as any)?.theme?.toneId || "golden-ivory",
                language: (currentWeddingForModal?.config as any)?.language || "fr",
            });

            setCreateSiteDialogOpen(false);
            setNewSiteTitle("");
            setNewSiteSlug("");
            setNewSiteDate("");
            setNewSiteSlugEdited(false);
            toast({ title: "Nouveau site créé", description: "Vous pouvez maintenant le personnaliser." });
            setLocation(`~/${created.id}/dashboard`);
        } catch (error: any) {
            const message = String(error?.message || "");
            toast({
                title: message.includes("Premium") ? "Plusieurs sites, c'est dans Premium" : "Le site n'a pas encore pu être créé",
                description: message.includes("Premium")
                    ? "Activez Premium pour ajouter un autre site à votre espace."
                    : "Réessayez dans quelques instants. Votre brouillon n'est pas perdu.",
                variant: "soft",
            });
        }
    };

    if (isDesignRoute) {
        const currentWedding = weddings.find(w => w.id === weddingId);
        return (
            <div className="flex flex-col min-h-screen bg-muted/30">
                <header className="h-14 border-b bg-background/95 backdrop-blur flex items-center px-4 gap-3 shrink-0 z-50">
                    <Button
                        variant="ghost"
                        size="sm"
                        className="gap-2 text-muted-foreground hover:text-foreground"
                        onClick={() => setLocation("/dashboard")}
                    >
                        <ChevronRight className="h-4 w-4 rotate-180" />
                        <span>{nls.adminLayout.back}</span>
                    </Button>
                    <div className="h-6 w-px bg-border" />
                    <div className="flex items-center gap-2">
                        <Paintbrush className="h-4 w-4 text-primary" />
                        <span className="text-sm font-semibold">{nls.adminLayout.design}</span>
                    </div>
                    <div className="ml-auto flex items-center gap-3">
                        {currentWedding && (
                            <Button
                                variant="outline"
                                size="sm"
                                className="gap-2 border-primary/20 hover:border-primary/40 text-primary"
                                onClick={() => window.open(`/preview/${currentWedding.slug}`, "_blank")}
                            >
                                <Paintbrush className="h-4 w-4" />
                                <span className="hidden sm:inline">{nls.adminLayout.editLive}</span>
                            </Button>
                        )}
                        {currentWedding && (
                            <Button
                                variant="outline"
                                size="sm"
                                className="gap-2"
                                onClick={() => window.open(`/${currentWedding.slug}`, "_blank")}
                            >
                                <ExternalLink className="h-4 w-4" />
                                <span className="hidden sm:inline">{nls.adminLayout.viewSite}</span>
                            </Button>
                        )}
                        <Button
                            variant="ghost"
                            size="sm"
                            className="gap-2 text-muted-foreground hover:text-foreground"
                            onClick={() => setHelpMenuOpen(true)}
                        >
                            <HelpCircle className="h-4 w-4" />
                            <span className="hidden sm:inline">{nls.adminLayout.helpCenter}</span>
                        </Button>
                    </div>
                </header>
                <div className="flex-1 overflow-y-auto p-0">
                <div className="w-full">
                    {children}
                </div>
            </div>
            <InternalSupportChat
                pageLabel={fallbackSupportPageLabel}
                weddingId={currentWedding?.id || weddingId || null}
                weddingSlug={currentWedding?.slug || null}
                weddingName={currentWedding?.title || null}
                userEmail={user?.email || null}
                currentPlan={currentWedding?.currentPlan || null}
                className="bottom-4 right-4 left-auto"
            />
            <HelpChatbot isOpen={helpMenuOpen} onOpenChange={setHelpMenuOpen} hideTrigger language={currentLanguage} />
        </div>
    );
    }

    return (
        <div className="flex min-h-screen bg-muted/30">
            <aside className="w-64 hidden md:flex flex-col bg-sidebar text-sidebar-foreground border-r border-sidebar-border">
                <div className="p-6 border-b border-sidebar-border">
                    <Link href="/" className="flex items-center space-x-2">
                        <span className="text-xl font-semibold tracking-tight text-sidebar-foreground">{nls.adminLayout.brand}</span>
                    </Link>
                </div>
                <nav className="flex-1 p-4 space-y-1" data-tour="sidebar-nav">
                    {navItems.map((item) => {
                        const isActive = location === item.href;
                        const tourAttr = item.href === "/design" ? "sidebar-design" : undefined;
                        return (
                            <Link key={item.href} href={item.href} data-tour={tourAttr} className={`flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${isActive
                                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                                    : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                                    }`}>
                                <item.icon className="h-4 w-4" />
                                <span className="flex-1">{item.name}</span>
                                {item.isPremiumOnly && !isPremium && (
                                    <Crown className="h-3 w-3 text-amber-500/70" />
                                )}
                            </Link>
                        );
                    })}
                </nav>
                <div className="p-4 border-t border-sidebar-border space-y-4">
                    <div className="flex items-center space-x-3 px-3">
                        <div className="h-8 w-8 rounded-full bg-sidebar-accent flex items-center justify-center text-xs font-bold text-sidebar-accent-foreground">
                            {user?.firstName?.[0]}{user?.lastName?.[0]}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{user?.firstName} {user?.lastName}</p>
                        </div>
                    </div>
                    {languageSwitcher}
                    <Button
                        variant="ghost"
                        size="sm"
                        className="w-full justify-start text-sidebar-foreground/70 hover:text-sidebar-foreground"
                        onClick={() => setHelpMenuOpen(true)}
                    >
                        <HelpCircle className="mr-2 h-4 w-4" />
                        {nls.adminLayout.helpCenter}
                    </Button>
                    <FeedbackModal />
                    <Button
                        variant="ghost"
                        size="sm"
                        className="w-full justify-start text-sidebar-foreground/70 hover:text-destructive"
                        onClick={() => logoutMutation.mutate()}
                    >
                        <LogOut className="mr-2 h-4 w-4" />
                        {nls.adminLayout.logout}
                    </Button>
                </div>
            </aside>

            {mobileMenuOpen && (
                <div className="fixed inset-0 z-50 md:hidden">
                    <div className="fixed inset-0 bg-black/50" onClick={() => setMobileMenuOpen(false)} />
                    <aside className="fixed inset-y-0 left-0 w-72 bg-sidebar text-sidebar-foreground flex flex-col z-50 shadow-xl">
                        <div className="p-4 flex items-center justify-between border-b border-sidebar-border">
                            <span className="text-lg font-semibold">{nls.adminLayout.brand}</span>
                            <Button variant="ghost" size="icon" onClick={() => setMobileMenuOpen(false)}>
                                <X className="h-5 w-5" />
                            </Button>
                        </div>
                        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
                            <div className="mb-4">
                                {languageSwitcher}
                            </div>
                            {navItems.map((item) => {
                                const isActive = location === item.href;
                                return (
                                    <Link key={item.href} href={item.href}
                                        onClick={() => setMobileMenuOpen(false)}
                                        className={`flex items-center space-x-3 px-4 py-3 min-h-[44px] rounded-lg text-sm font-medium transition-colors ${isActive
                                            ? "bg-sidebar-accent text-sidebar-accent-foreground"
                                            : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                                            }`}
                                    >
                                        <item.icon className="h-5 w-5" />
                                        <span className="flex-1">{item.name}</span>
                                        {item.isPremiumOnly && !isPremium && (
                                            <Lock className="h-4 w-4 text-amber-500/70" />
                                        )}
                                    </Link>
                                );
                            })}
                            <Button
                                variant="ghost"
                                size="sm"
                                className="w-full justify-start min-h-[44px] text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                                onClick={() => {
                                    setMobileMenuOpen(false);
                                    setHelpMenuOpen(true);
                                }}
                            >
                                <HelpCircle className="mr-2 h-5 w-5" />
                                {nls.adminLayout.helpCenter}
                            </Button>
                        </nav>
                        <div className="p-4 border-t border-sidebar-border space-y-2">
                            <FeedbackModal />
                            <Button
                                variant="ghost"
                                size="sm"
                                className="w-full justify-start min-h-[44px] text-sidebar-foreground/70 hover:text-destructive"
                                onClick={() => logoutMutation.mutate()}
                            >
                                <LogOut className="mr-2 h-4 w-4" />
                                {nls.adminLayout.logout}
                            </Button>
                        </div>
                    </aside>
                </div>
            )}

            <main className="flex-1 flex flex-col min-w-0">
                <header className="h-16 border-b bg-background/80 backdrop-blur flex items-center px-4 md:px-8">
                    <Button variant="ghost" size="icon" className="md:hidden mr-2" onClick={() => setMobileMenuOpen(true)}>
                        <Menu className="h-5 w-5" />
                    </Button>
                    <div className="flex items-center text-sm text-muted-foreground">
                        <Link href="/" className="hover:text-foreground">Daylora</Link>
                        <ChevronRight className="h-4 w-4 mx-2" />
                        <span className="text-foreground font-medium">{nls.adminLayout.weddingManagement}</span>
                    </div>
                    <div className="ml-auto flex items-center gap-3">
                        <div className="hidden sm:block min-w-[240px]">
                            <Select
                                value={weddingId}
                                onValueChange={(value) => {
                                    if (value === "__create__") {
                                        handleOpenCreateSite();
                                        return;
                                    }
                                    setLocation(`~/${value}/dashboard`);
                                }}
                            >
                                <SelectTrigger className="h-11 rounded-xl border-border/70 bg-white/90 px-4 text-sm font-medium shadow-sm hover:border-primary/30 focus:ring-primary/20">
                                    <SelectValue>{currentWeddingTitle}</SelectValue>
                                </SelectTrigger>
                                <SelectContent className="rounded-2xl border-border/70 bg-white/95 p-2 shadow-2xl backdrop-blur-sm">
                                    {weddings.map((w) => (
                                        <SelectItem
                                            key={w.id}
                                            value={w.id}
                                            className="rounded-xl py-3 pl-9 pr-3 text-sm font-medium"
                                        >
                                            {w.title}
                                        </SelectItem>
                                    ))}
                                    {canCreateAnotherSite ? (
                                        <SelectItem
                                            value="__create__"
                                            className="rounded-xl py-3 pl-9 pr-3 text-sm font-semibold text-primary"
                                        >
                                            <span className="flex items-center gap-2">
                                                <Plus className="h-4 w-4" />
                                                Nouveau site
                                            </span>
                                        </SelectItem>
                                    ) : null}
                                </SelectContent>
                            </Select>
                        </div>
                        {weddings.find(w => w.id === weddingId) && (
                            <Button
                                data-tour="view-site"
                                variant="outline"
                                size="sm"
                                className="gap-2 border-primary/20 hover:border-primary/40 text-primary"
                                onClick={() => {
                                    const w = weddings.find(w => w.id === weddingId);
                                    if (w) window.open(`/${w.slug}`, "_blank");
                                }}
                            >
                                <ExternalLink className="h-4 w-4" />
                                <span className="hidden sm:inline">{nls.adminLayout.viewSite}</span>
                            </Button>
                        )}
                        <Button
                            variant="ghost"
                            size="icon"
                            className="text-muted-foreground hover:text-destructive"
                            onClick={() => logoutMutation.mutate()}
                            title={nls.adminLayout.logoutTitle}
                        >
                            <LogOut className="h-4 w-4" />
                        </Button>
                    </div>
                </header>
                <div className="flex-1 overflow-y-auto p-4 md:p-10">
                    <div className="max-w-5xl mx-auto">
                        {children}
                    </div>
                </div>
            </main>
            <InternalSupportChat
                pageLabel={fallbackSupportPageLabel}
                weddingId={currentWeddingForModal?.id || weddingId || null}
                weddingSlug={currentWeddingForModal?.slug || null}
                weddingName={currentWeddingForModal?.title || null}
                userEmail={user?.email || null}
                currentPlan={currentWeddingForModal?.currentPlan || null}
                className="bottom-4 right-4 left-auto"
            />
            <HelpChatbot isOpen={helpMenuOpen} onOpenChange={setHelpMenuOpen} hideTrigger language={currentLanguage} />
            {user && currentWeddingForModal && (
                <PremiumUpsellModal user={user} wedding={currentWeddingForModal} />
            )}
            <Dialog open={createSiteDialogOpen} onOpenChange={setCreateSiteDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Créer un nouveau site</DialogTitle>
                        <DialogDescription>
                            Ajoutez un nouveau site à votre espace. Vous pourrez ensuite le personnaliser normalement.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-foreground">Nom du site</label>
                            <Input
                                value={newSiteTitle}
                                onChange={(e) => {
                                    const value = e.target.value;
                                    setNewSiteTitle(value);
                                    if (!newSiteSlugEdited) setNewSiteSlug(buildSlug(value));
                                }}
                                placeholder="Ex : Mariage Emma & James"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-foreground">Adresse du site</label>
                            <Input
                                value={newSiteSlug}
                                onChange={(e) => {
                                    const value = buildSlug(e.target.value);
                                    setNewSiteSlug(value);
                                    setNewSiteSlugEdited(value.length > 0);
                                }}
                                placeholder="emma-et-james"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-foreground">Date</label>
                            <Input
                                type="date"
                                value={newSiteDate}
                                onChange={(e) => setNewSiteDate(e.target.value)}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => {
                                setCreateSiteDialogOpen(false);
                                setNewSiteTitle("");
                                setNewSiteSlug("");
                                setNewSiteDate("");
                                setNewSiteSlugEdited(false);
                            }}
                        >
                            Annuler
                        </Button>
                        <Button onClick={handleCreateSite} disabled={createWedding.isPending}>
                            {createWedding.isPending ? "Création..." : "Créer le site"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
