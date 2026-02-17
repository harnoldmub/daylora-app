import { ReactNode } from "react";
import { Link, useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { type Wedding } from "@shared/schema";
import { ThemeProvider } from "@/components/ThemeProvider";
import { Loader2 } from "lucide-react";

export function PublicLayout({ children }: { children: ReactNode }) {
    const { slug } = useParams<{ slug: string }>();

    const { data: wedding, isLoading } = useQuery<Wedding>({
        queryKey: [`/api/weddings`, slug],
        queryFn: async () => {
            const headers: Record<string, string> = {};
            if (slug) headers["x-wedding-slug"] = slug;
            const res = await fetch("/api/weddings", {
                headers,
                credentials: "include"
            });
            if (!res.ok) {
                if (res.status === 404) return null;
                throw new Error("Failed to fetch wedding");
            }
            const weddings = await res.json();
            return Array.isArray(weddings) ? weddings[0] : weddings;
        },
        enabled: !!slug,
    });

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    if (!wedding) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen">
                <h1 className="text-2xl font-bold mb-4">Mariage introuvable</h1>
                <Link href="/" className="text-primary hover:underline">
                    Retour à l'accueil
                </Link>
            </div>
        );
    }

    return (
        <ThemeProvider wedding={wedding}>
            <div className="flex flex-col min-h-screen">
                <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                    <div className="container flex h-16 items-center justify-between">
                        <Link href={`/${slug}`} className="flex items-center space-x-2">
                            <span className="text-xl font-bold tracking-tight">{wedding.title}</span>
                        </Link>
                        <nav className="flex items-center space-x-6 text-sm font-medium">
                            <Link href={`/${slug}/rsvp`} className="hover:text-primary transition-colors">
                                RSVP
                            </Link>
                            <Link href={`/${slug}/cagnotte`} className="hover:text-primary transition-colors">
                                Cagnotte
                            </Link>
                            <Link href={`/${slug}/live`} className="hover:text-primary transition-colors">
                                Live
                            </Link>
                        </nav>
                    </div>
                </header>
                <main className="flex-1">{children}</main>
                <footer className="py-6 md:px-8 md:py-0 border-t">
                    <div className="container flex flex-col items-center justify-between gap-4 md:h-24 md:flex-row">
                        <p className="text-center text-sm leading-loose text-muted-foreground md:text-left">
                            Fait avec amour sur <span className="font-bold">Nocely</span>
                        </p>
                    </div>
                </footer>
            </div>
        </ThemeProvider>
    );
}
