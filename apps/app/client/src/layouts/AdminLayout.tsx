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
    Settings,
    Paintbrush,
    ListTree,
    FileText,
    ExternalLink
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useWeddings } from "@/hooks/use-api";
import { Button } from "@/components/ui/button";

export function AdminLayout({ children }: { children: ReactNode }) {
    const { weddingId } = useParams<{ weddingId: string }>();
    const [location, setLocation] = useLocation();
    const { logoutMutation, user } = useAuth();
    const { data: weddings = [] } = useWeddings();
    const isDesignRoute = location.includes("/design");

    const navItems = [
        { name: "Accueil", icon: Home, href: `/{weddingId}/welcome` },
        { name: "Dashboard", icon: LayoutDashboard, href: `/{weddingId}/dashboard` },
        { name: "Invités", icon: Users, href: `/{weddingId}/guests` },
        { name: "Cadeaux", icon: Gift, href: `/{weddingId}/gifts` },
        { name: "Blagues Live", icon: Laugh, href: `/{weddingId}/live` },
        { name: "Emails", icon: Mail, href: `/{weddingId}/emails` },
        { name: "Templates", icon: Palette, href: `/{weddingId}/templates` },
        { name: "Design", icon: Paintbrush, href: `/{weddingId}/design` },
        { name: "Pages", icon: FileText, href: `/{weddingId}/pages` },
        { name: "Site & Menus", icon: ListTree, href: `/{weddingId}/site` },
        { name: "Facturation", icon: CreditCard, href: `/{weddingId}/billing` },
        { name: "Paramètres", icon: Settings, href: `/{weddingId}/settings` },
    ];

    return (
        <div className="flex min-h-screen bg-muted/30">
            {/* Sidebar */}
            <aside className="w-64 hidden md:flex flex-col bg-sidebar text-sidebar-foreground border-r border-sidebar-border">
                <div className="p-6 border-b border-sidebar-border">
                    <Link href="/app">
                        <a className="flex items-center space-x-2">
                            <span className="text-xl font-semibold tracking-tight text-sidebar-foreground">Nocely Admin</span>
                        </a>
                    </Link>
                </div>
                <nav className="flex-1 p-4 space-y-1">
                    {navItems.map((item) => (
                        <Link key={item.href} href={item.href}>
                            <a className={`flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${location === item.href
                                ? "bg-sidebar-accent text-sidebar-accent-foreground"
                                : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                                }`}>
                                <item.icon className="h-4 w-4" />
                                <span>{item.name}</span>
                            </a>
                        </Link>
                    ))}
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

            {/* Main Content */}
            <main className="flex-1 flex flex-col min-w-0">
                <header className="h-16 border-b bg-background/80 backdrop-blur flex items-center px-8">
                    <div className="flex items-center text-sm text-muted-foreground">
                        <Link href="/app">
                            <a className="hover:text-foreground">App</a>
                        </Link>
                        <ChevronRight className="h-4 w-4 mx-2" />
                        <span className="text-foreground font-medium">Gestion du mariage</span>
                    </div>
                    <div className="ml-auto flex items-center gap-3">
                        <span className="text-xs text-muted-foreground">Projet</span>
                        <select
                            className="h-9 rounded-md border border-border bg-background px-3 text-sm"
                            value={weddingId}
                            onChange={(e) => setLocation(`/{e.target.value}/dashboard`)}
                        >
                            {weddings.map((w) => (
                                <option key={w.id} value={w.id}>{w.title}</option>
                            ))}
                        </select>
                        {weddings.find(w => w.id === weddingId) && (
                            <Button
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
                    </div>
                </header>
                <div className={`flex-1 overflow-y-auto ${isDesignRoute ? "p-0" : "p-8"}`}>
                    <div className={isDesignRoute ? "w-full" : "max-w-6xl mx-auto"}>
                        {children}
                    </div>
                </div>
            </main>
        </div>
    );
}
