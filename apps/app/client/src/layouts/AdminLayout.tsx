import { ReactNode } from "react";
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
    Laugh,
    MessageSquare,
    Settings,
    Paintbrush,
    ListTree,
    FileText,
    ExternalLink,
    Menu,
    X
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useWeddings } from "@/hooks/use-api";
import { Button } from "@/components/ui/button";
import { HelpChatbot } from "@/components/admin/HelpChatbot";
import { FeedbackModal } from "@/components/admin/FeedbackModal";
import { useState } from "react";

export function AdminLayout({ children, weddingId: weddingIdProp }: { children: ReactNode; weddingId?: string }) {
    const params = useParams<{ weddingId: string }>();
    const weddingId = weddingIdProp || params.weddingId || "";
    const [location, setLocation] = useLocation();
    const { logoutMutation, user } = useAuth();
    const { data: weddings = [] } = useWeddings();
    const isDesignRoute = location.includes("/design");
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    const navItems = [
        { name: "Accueil", icon: Home, href: "/welcome" },
        { name: "Dashboard", icon: LayoutDashboard, href: "/dashboard" },
        { name: "Design", icon: Paintbrush, href: "/design" },
        { name: "Invités", icon: Users, href: "/guests" },
        { name: "Templates", icon: Palette, href: "/templates" },
        { name: "Site & Menus", icon: ListTree, href: "/site" },
        { name: "Cadeaux", icon: Gift, href: "/gifts" },
        { name: "Emails", icon: Mail, href: "/emails" },
        { name: "Pages", icon: FileText, href: "/pages" },
        { name: "Blagues Live", icon: Laugh, href: "/live" },
        { name: "Facturation", icon: CreditCard, href: "/billing" },
        { name: "Avis", icon: MessageSquare, href: "/feedback" },
        { name: "Paramètres", icon: Settings, href: "/settings" },
    ];

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
                        <span>Retour</span>
                    </Button>
                    <div className="h-6 w-px bg-border" />
                    <div className="flex items-center gap-2">
                        <Paintbrush className="h-4 w-4 text-primary" />
                        <span className="text-sm font-semibold">Design</span>
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
                                <span className="hidden sm:inline">Modifier en live</span>
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
                                <span className="hidden sm:inline">Voir le site</span>
                            </Button>
                        )}
                    </div>
                </header>
                <div className="flex-1 overflow-y-auto p-0">
                    <div className="w-full">
                        {children}
                    </div>
                </div>
                <HelpChatbot />
            </div>
        );
    }

    return (
        <div className="flex min-h-screen bg-muted/30">
            <aside className="w-64 hidden md:flex flex-col bg-sidebar text-sidebar-foreground border-r border-sidebar-border">
                <div className="p-6 border-b border-sidebar-border">
                    <Link href="/" className="flex items-center space-x-2">
                        <span className="text-xl font-semibold tracking-tight text-sidebar-foreground">Nocely Admin</span>
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
                                <span>{item.name}</span>
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
                    <FeedbackModal />
                    <Button
                        variant="ghost"
                        size="sm"
                        className="w-full justify-start text-sidebar-foreground/70 hover:text-destructive"
                        onClick={() => logoutMutation.mutate()}
                    >
                        <LogOut className="mr-2 h-4 w-4" />
                        Déconnexion
                    </Button>
                </div>
            </aside>

            {mobileMenuOpen && (
                <div className="fixed inset-0 z-50 md:hidden">
                    <div className="fixed inset-0 bg-black/50" onClick={() => setMobileMenuOpen(false)} />
                    <aside className="fixed inset-y-0 left-0 w-72 bg-sidebar text-sidebar-foreground flex flex-col z-50 shadow-xl">
                        <div className="p-4 flex items-center justify-between border-b border-sidebar-border">
                            <span className="text-lg font-semibold">Nocely Admin</span>
                            <Button variant="ghost" size="icon" onClick={() => setMobileMenuOpen(false)}>
                                <X className="h-5 w-5" />
                            </Button>
                        </div>
                        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
                            {navItems.map((item) => {
                                const isActive = location === item.href;
                                return (
                                    <Link key={item.href} href={item.href}
                                        onClick={() => setMobileMenuOpen(false)}
                                        className={`flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${isActive
                                            ? "bg-sidebar-accent text-sidebar-accent-foreground"
                                            : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                                            }`}
                                    >
                                        <item.icon className="h-4 w-4" />
                                        <span>{item.name}</span>
                                    </Link>
                                );
                            })}
                        </nav>
                        <div className="p-4 border-t border-sidebar-border space-y-2">
                            <FeedbackModal />
                            <Button
                                variant="ghost"
                                size="sm"
                                className="w-full justify-start text-sidebar-foreground/70 hover:text-destructive"
                                onClick={() => logoutMutation.mutate()}
                            >
                                <LogOut className="mr-2 h-4 w-4" />
                                Déconnexion
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
                        <Link href="/" className="hover:text-foreground">Nocely</Link>
                        <ChevronRight className="h-4 w-4 mx-2" />
                        <span className="text-foreground font-medium">Gestion du mariage</span>
                    </div>
                    <div className="ml-auto flex items-center gap-3">
                        <select
                            className="h-9 rounded-md border border-border bg-background px-3 text-sm hidden sm:block"
                            value={weddingId}
                            onChange={(e) => setLocation(`~/${e.target.value}/dashboard`)}
                        >
                            {weddings.map((w) => (
                                <option key={w.id} value={w.id}>{w.title}</option>
                            ))}
                        </select>
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
                                <span className="hidden sm:inline">Voir le site</span>
                            </Button>
                        )}
                        <Button
                            variant="ghost"
                            size="icon"
                            className="text-muted-foreground hover:text-destructive"
                            onClick={() => logoutMutation.mutate()}
                            title="Se déconnecter"
                        >
                            <LogOut className="h-4 w-4" />
                        </Button>
                    </div>
                </header>
                <div className="flex-1 overflow-y-auto p-5 md:p-10">
                    <div className="max-w-5xl mx-auto">
                        {children}
                    </div>
                </div>
            </main>
            <HelpChatbot />
        </div>
    );
}
