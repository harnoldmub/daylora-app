import { useWedding, useUpdateWedding } from "@/hooks/use-api";
import { useParams, Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ExternalLink, Layout, Sparkles, CheckCircle2, Eye, EyeOff, FileEdit } from "lucide-react";
import { motion } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import { useEffect, useState } from "react";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { KpiCard } from "@/components/admin/KpiCard";

type SiteConfig = {
    appBaseUrl: string;
    marketingBaseUrl: string;
};

export default function WelcomePage() {
    const { weddingId } = useParams();
    const { data: wedding, isLoading } = useWedding(weddingId);
    const updateWedding = useUpdateWedding();
    const { toast } = useToast();
    const [siteConfig, setSiteConfig] = useState<SiteConfig | null>(null);

    useEffect(() => {
        fetch("/api/site-config")
            .then((r) => r.json())
            .then(setSiteConfig)
            .catch(() => null);
    }, []);

    if (isLoading || !wedding) return <div className="animate-pulse h-screen bg-muted" />;

    const appOrigin = typeof window !== "undefined" ? window.location.origin : (siteConfig?.appBaseUrl || "https://daylora.app");
    const publicUrl = `${appOrigin}/${wedding.slug || wedding.id}`;
    const previewUrl = `${appOrigin}/preview/${wedding.slug || wedding.id}`;

    const handlePublishToggle = async () => {
        try {
            await updateWedding.mutateAsync({
                id: wedding.id,
                isPublished: !wedding.isPublished
            });
            toast({
                title: wedding.isPublished ? "Site dépublié" : "Site publié !",
                description: wedding.isPublished
                    ? "Votre site n'est plus accessible publiquement"
                    : "Votre site est maintenant visible par tous",
            });
        } catch (error) {
            toast({
                title: "Publication impossible",
                description: "Impossible de modifier le statut de publication. Veuillez réessayer.",
                variant: "destructive",
            });
        }
    };

    return (
        <div className="space-y-8">
            <AdminPageHeader
                title={`Bienvenue, ${wedding.title}`}
                description="Votre site est prêt. Publiez-le et partagez vos liens."
                actions={
                    wedding.isPublished ? (
                        <Button onClick={handlePublishToggle} variant="outline">
                            <EyeOff className="h-4 w-4 mr-2" />
                            Dépublier
                        </Button>
                    ) : (
                        <Button onClick={handlePublishToggle}>
                            <Eye className="h-4 w-4 mr-2" />
                            Publier le site
                        </Button>
                    )
                }
            />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <KpiCard
                    label="Statut"
                    value={wedding.isPublished ? "En ligne" : "Brouillon"}
                    hint={wedding.isPublished ? "Visible publiquement" : "Preview uniquement"}
                    icon={wedding.isPublished ? <Eye className="h-5 w-5" /> : <EyeOff className="h-5 w-5" />}
                />
                <KpiCard
                    label="Template"
                    value={wedding.templateId || "classic"}
                    hint="Style actuel"
                    icon={<Sparkles className="h-5 w-5" />}
                />
                <KpiCard
                    label="Plan"
                    value={wedding.currentPlan === "premium" ? "Premium" : "Free"}
                    hint="Facturation active"
                    icon={<CheckCircle2 className="h-5 w-5" />}
                />
            </div>

            <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="grid md:grid-cols-3 gap-6">
                <Card className="shadow-sm">
                    <CardHeader>
                        <CardTitle className="text-xl font-serif">Prévisualisation</CardTitle>
                        <CardDescription>Accessible même en brouillon.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <div className="p-3 rounded-lg border bg-muted/30 text-xs font-mono break-all">{previewUrl}</div>
                        <Button asChild className="w-full">
                            <a href={previewUrl} target="_blank" rel="noopener noreferrer">Ouvrir la preview</a>
                        </Button>
                    </CardContent>
                </Card>

                <Card className="shadow-sm">
                    <CardHeader>
                        <CardTitle className="text-xl font-serif">Site public</CardTitle>
                        <CardDescription>{wedding.isPublished ? "En ligne" : "Publiez pour l'activer"}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <div className="p-3 rounded-lg border bg-muted/30 text-xs font-mono break-all">{publicUrl}</div>
                        <Button asChild className="w-full" disabled={!wedding.isPublished}>
                            <a href={publicUrl} target="_blank" rel="noopener noreferrer">Voir le site</a>
                        </Button>
                    </CardContent>
                </Card>

                <Card className="shadow-sm">
                    <CardHeader>
                        <CardTitle className="text-xl font-serif">Administration</CardTitle>
                        <CardDescription>Accédez aux modules de gestion.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <Button variant="outline" asChild className="w-full">
                            <Link href="/dashboard">
                                <Layout className="h-4 w-4 mr-2" />
                                Tableau de bord
                            </Link>
                        </Button>
                        <Button asChild className="w-full">
                            <Link href="/design">
                                <FileEdit className="h-4 w-4 mr-2" />
                                Modifier l'invitation
                            </Link>
                        </Button>
                        <Button variant="outline" asChild className="w-full">
                            <Link href="/templates">
                                <ExternalLink className="h-4 w-4 mr-2" />
                                Templates & design
                            </Link>
                        </Button>
                    </CardContent>
                </Card>
            </motion.div>
        </div>
    );
}
