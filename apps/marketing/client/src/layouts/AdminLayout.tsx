import { ReactNode } from "react";
import { Link, useLocation, useParams } from "wouter";
import {
    LayoutDashboard,
    Users,
    Gift,
    CreditCard,
    Settings,
    Mail,
    Palette,
    LogOut,
    ChevronRight,
    Home
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";

export function AdminLayout({ children }: { children: ReactNode }) {
    const { weddingId } = useParams<{ weddingId: string }>();
    const [location] = useLocation();
    const { logoutMutation, user } = useAuth();

    const navItems = [
        { name: "Accueil", icon: Home, href: `/app/${weddingId}/welcome` },
        { name: "Dashboard", icon: LayoutDashboard, href: `/app/${weddingId}/dashboard` },
        { name: "Invités", icon: Users, href: `/app/${weddingId}/guests` },
        { name: "Cadeaux", icon: Gift, href: `/app/${weddingId}/gifts` },
        { name: "Emails", icon: Mail, href: `/app/${weddingId}/emails` },
        { name: "Templates", icon: Palette, href: `/app/${weddingId}/templates` },
        { name: "Facturation", icon: CreditCard, href: `/app/${weddingId}/billing` },
        { name: "Paramètres", icon: Settings, href: `/app/${weddingId}/settings` },
    ];

    return (
        <div className="flex min-h-screen bg-muted/20">
            {/* Sidebar */}
            <aside className="w-64 border-r bg-background hidden md:flex flex-col">
                <div className="p-6 border-b">
                    <Link href="/app">
                        <a className="flex items-center space-x-2">
                            <span className="text-xl font-bold tracking-tight text-primary">Libala Admin</span>
                        </a>
                    </Link>
                </div>
                <nav className="flex-1 p-4 space-y-1">
                    {navItems.map((item) => (
                        <Link key={item.href} href={item.href}>
                            <a className={`flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${location === item.href
                                ? "bg-primary/10 text-primary"
                                : "text-muted-foreground hover:bg-muted"
                                }`}>
                                <item.icon className="h-4 w-4" />
                                <span>{item.name}</span>
                            </a>
                        </Link>
                    ))}
                </nav>
                <div className="p-4 border-t space-y-4">
                    <div className="flex items-center space-x-3 px-3">
                        <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary">
                            {user?.firstName?.[0]}{user?.lastName?.[0]}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{user?.firstName} {user?.lastName}</p>
                        </div>
                    </div>
                    <Button
                        variant="ghost"
                        size="sm"
                        className="w-full justify-start text-muted-foreground hover:text-destructive"
                        onClick={() => logoutMutation.mutate()}
                    >
                        <LogOut className="mr-2 h-4 w-4" />
                        Déconnexion
                    </Button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 flex flex-col min-w-0">
                <header className="h-16 border-b bg-background flex items-center px-8">
                    <div className="flex items-center text-sm text-muted-foreground">
                        <Link href="/app">
                            <a className="hover:text-foreground">App</a>
                        </Link>
                        <ChevronRight className="h-4 w-4 mx-2" />
                        <span className="text-foreground font-medium">Gestion du mariage</span>
                    </div>
                </header>
                <div className="flex-1 p-8 overflow-y-auto">
                    {children}
                </div>
            </main>
        </div>
    );
}
