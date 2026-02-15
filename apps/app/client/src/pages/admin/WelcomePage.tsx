import { useWedding, useUpdateWedding } from "@/hooks/use-api";
import { useParams, Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ExternalLink, Layout, Sparkles, CheckCircle2, Eye, EyeOff } from "lucide-react";
import { motion } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import { useEffect, useState } from "react";

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

    const appBaseUrl = siteConfig?.appBaseUrl || "http://localhost:5174";
    const appOrigin = typeof window !== "undefined" ? window.location.origin : appBaseUrl;
    const marketingBaseUrl = siteConfig?.marketingBaseUrl || "http://localhost:5173";
    const publicUrl = `${marketingBaseUrl}/${wedding.slug || wedding.id}`;
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
                title: "Erreur",
                description: "Impossible de modifier le statut de publication",
                variant: "destructive",
            });
        }
    };

    return (
        <div className="min-h-screen bg-[#F7F3EE] text-[#2b2320] flex items-center justify-center p-6 relative overflow-hidden">
            <div className="absolute -top-24 right-0 w-72 h-72 bg-[#E7D9C8]/60 rounded-full blur-[140px] pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-80 h-80 bg-[#D7C6B2]/45 rounded-full blur-[160px] pointer-events-none" />

            <motion.div
                initial={{ opacity: 0, scale: 0.97 }}
                animate={{ opacity: 1, scale: 1 }}
                className="max-w-3xl w-full relative z-10"
            >
                <div className="text-center space-y-4 mb-12">
                    <div className="flex justify-center mb-6">
                        <div className="w-20 h-20 bg-white rounded-2xl flex items-center justify-center border border-[#E6DCCF] shadow-lg">
                            <CheckCircle2 className="h-10 w-10 text-primary" />
                        </div>
                    </div>
                    <h1 className="text-4xl md:text-6xl font-serif font-bold tracking-tight">C'est prêt, {wedding.title} !</h1>
                    <p className="text-[#7A6B5E] text-lg">Votre univers de mariage est officiellement créé.</p>

                    <div className="flex items-center justify-center gap-3 mt-6">
                        {wedding.isPublished ? (
                            <div className="flex items-center gap-2 px-4 py-2 bg-green-100 border border-green-200 rounded-full text-green-700 text-sm font-medium">
                                <Eye className="h-4 w-4" />
                                Site publié
                            </div>
                        ) : (
                            <div className="flex items-center gap-2 px-4 py-2 bg-amber-100 border border-amber-200 rounded-full text-amber-700 text-sm font-medium">
                                <EyeOff className="h-4 w-4" />
                                Brouillon
                            </div>
                        )}
                    </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                    {/* Preview URL (Always accessible) */}
                    <Card className="bg-white border border-[#E6DCCF] overflow-hidden group hover:border-[#D5BFA7] transition-all duration-300 rounded-[2rem] shadow-sm">
                        <CardHeader>
                            <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                <EyeOff className="h-6 w-6 text-amber-700" />
                            </div>
                            <CardTitle className="text-2xl font-serif text-[#2b2320]">Lien de prévisualisation</CardTitle>
                            <CardDescription className="text-[#7A6B5E]">Accessible même en brouillon</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="p-3 bg-[#FAF6F0] rounded-xl border border-[#EDE2D6] text-xs font-mono text-[#7A6B5E] break-all">
                                {previewUrl}
                            </div>
                            <Button asChild className="w-full rounded-full h-12 bg-amber-600 hover:bg-amber-700 text-white font-bold border-none transition-all">
                                <a href={previewUrl} target="_blank" rel="noopener noreferrer">Prévisualiser</a>
                            </Button>
                        </CardContent>
                    </Card>

                    {/* Public Site Link */}
                    <Card className="bg-white border border-[#E6DCCF] overflow-hidden group hover:border-primary/40 transition-all duration-300 rounded-[2rem] shadow-sm">
                        <CardHeader>
                            <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                <ExternalLink className="h-6 w-6 text-primary" />
                            </div>
                            <CardTitle className="text-2xl font-serif text-[#2b2320]">Lien public</CardTitle>
                            <CardDescription className="text-[#7A6B5E]">{wedding.isPublished ? "Site en ligne" : "Publier pour activer"}</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="p-3 bg-[#FAF6F0] rounded-xl border border-[#EDE2D6] text-xs font-mono text-[#7A6B5E] break-all">
                                {publicUrl}
                            </div>
                            {wedding.isPublished ? (
                                <Button asChild className="w-full rounded-full h-12 bg-primary hover:bg-primary/90 text-white font-bold border-none transition-all">
                                    <a href={publicUrl} target="_blank" rel="noopener noreferrer">Ouvrir le site</a>
                                </Button>
                            ) : (
                                <Button
                                    onClick={handlePublishToggle}
                                    className="w-full rounded-full h-12 bg-green-600 hover:bg-green-700 text-white font-bold border-none transition-all"
                                >
                                    <Eye className="mr-2 h-4 w-4" />
                                    Publier mon site
                                </Button>
                            )}
                            {wedding.isPublished && (
                                <Button
                                    onClick={handlePublishToggle}
                                    variant="outline"
                                    className="w-full rounded-full h-10 border-[#E6DCCF] hover:bg-[#F3EBE1] text-[#7A6B5E] text-sm"
                                >
                                    <EyeOff className="mr-2 h-3 w-3" />
                                    Dépublier
                                </Button>
                            )}
                        </CardContent>
                    </Card>

                    {/* Admin Link */}
                    <Card className="bg-white border border-[#E6DCCF] overflow-hidden group hover:border-primary/40 transition-all duration-300 rounded-[2rem] shadow-sm">
                        <CardHeader>
                            <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                <Layout className="h-6 w-6 text-primary" />
                            </div>
                            <CardTitle className="text-2xl font-serif text-[#2b2320]">Gérer mon site</CardTitle>
                            <CardDescription className="text-[#7A6B5E]">Accédez au tableau de bord</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex flex-col gap-2">
                                <Button variant="outline" asChild className="w-full rounded-full h-12 border-[#E6DCCF] hover:bg-[#F3EBE1] text-[#5D5147] transition-all">
                                    <Link href={`/app/${wedding.id}/dashboard`}>Tableau de bord</Link>
                                </Button>
                                <Button asChild variant="secondary" className="w-full rounded-full h-12 bg-[#EDE2D6] hover:bg-[#E3D6C7] text-[#3A2F2B] border-none transition-all">
                                    <Link href={`/app/${wedding.id}/templates`}>
                                        <Sparkles className="mr-2 h-4 w-4" />
                                        Modifier le design
                                    </Link>
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <div className="mt-12 text-center">
                    <p className="text-[#B6A796] text-sm italic uppercase tracking-[0.2em]">Libala — L'excellence pour votre mariage</p>
                </div>
            </motion.div>
        </div>
    );
}
