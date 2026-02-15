import { useWedding, useUpdateWedding } from "@/hooks/use-api";
import { useParams, Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ExternalLink, Layout, Settings, Sparkles, CheckCircle2, Eye, EyeOff } from "lucide-react";
import { motion } from "framer-motion";
import { useToast } from "@/hooks/use-toast";

export default function WelcomePage() {
    const { weddingId } = useParams();
    const { data: wedding, isLoading } = useWedding(weddingId);
    const updateWedding = useUpdateWedding();
    const { toast } = useToast();

    if (isLoading || !wedding) return <div className="animate-pulse h-screen bg-muted" />;

    const publicUrl = `http://localhost:3000/${wedding.slug}`;
    const previewUrl = `http://localhost:3000/preview/${wedding.slug}`;

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
        <div className="min-h-screen bg-[#050505] text-white flex items-center justify-center p-6 relative overflow-hidden">
            {/* Background elements */}
            <div className="absolute top-1/4 -left-20 w-72 h-72 bg-primary/10 rounded-full blur-[120px] animate-blob pointer-events-none" />
            <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-primary/5 rounded-full blur-[150px] animate-blob animation-delay-500 pointer-events-none" />

            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="max-w-2xl w-full relative z-10"
            >
                <div className="text-center space-y-4 mb-12">
                    <div className="flex justify-center mb-6">
                        <div className="w-20 h-20 bg-primary/20 rounded-2xl flex items-center justify-center border border-primary/30 shadow-[0_0_30px_rgba(200,169,106,0.2)]">
                            <CheckCircle2 className="h-10 w-10 text-primary" />
                        </div>
                    </div>
                    <h1 className="text-4xl md:text-6xl font-serif font-bold tracking-tight">C'est prêt, {wedding.title} !</h1>
                    <p className="text-white/60 text-lg">Votre univers de mariage est officiellement créé.</p>

                    {/* Publication Status */}
                    <div className="flex items-center justify-center gap-3 mt-6">
                        {wedding.isPublished ? (
                            <div className="flex items-center gap-2 px-4 py-2 bg-green-500/20 border border-green-500/30 rounded-full text-green-400 text-sm font-medium">
                                <Eye className="h-4 w-4" />
                                Site publié
                            </div>
                        ) : (
                            <div className="flex items-center gap-2 px-4 py-2 bg-orange-500/20 border border-orange-500/30 rounded-full text-orange-400 text-sm font-medium">
                                <EyeOff className="h-4 w-4" />
                                Brouillon
                            </div>
                        )}
                    </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                    {/* Preview URL (Always accessible) */}
                    <Card className="glass-morphism border-white/10 overflow-hidden group hover:border-orange-500/50 transition-all duration-500 rounded-[2rem]">
                        <CardHeader>
                            <div className="w-12 h-12 bg-orange-500/10 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                <EyeOff className="h-6 w-6 text-orange-400" />
                            </div>
                            <CardTitle className="text-2xl font-serif text-white">Lien de prévisualisation</CardTitle>
                            <CardDescription className="text-white/40">Accessible même en brouillon</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="p-3 bg-white/5 rounded-xl border border-white/10 text-xs font-mono text-white/60 break-all">
                                {previewUrl}
                            </div>
                            <Button asChild className="w-full rounded-full h-12 bg-orange-600 hover:bg-orange-700 text-white font-bold border-none transition-all">
                                <a href={previewUrl} target="_blank" rel="noopener noreferrer">Prévisualiser</a>
                            </Button>
                        </CardContent>
                    </Card>

                    {/* Public Site Link */}
                    <Card className="glass-morphism border-white/10 overflow-hidden group hover:border-primary/50 transition-all duration-500 rounded-[2rem]">
                        <CardHeader>
                            <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                <ExternalLink className="h-6 w-6 text-primary" />
                            </div>
                            <CardTitle className="text-2xl font-serif text-white">Lien public</CardTitle>
                            <CardDescription className="text-white/40">{wedding.isPublished ? "Site en ligne" : "Publier pour activer"}</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="p-3 bg-white/5 rounded-xl border border-white/10 text-xs font-mono text-white/60 break-all">
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
                                    className="w-full rounded-full h-10 border-white/10 hover:bg-white/5 text-white/60 text-sm"
                                >
                                    <EyeOff className="mr-2 h-3 w-3" />
                                    Dépublier
                                </Button>
                            )}
                        </CardContent>
                    </Card>

                    {/* Admin Link */}
                    <Card className="glass-morphism border-white/10 overflow-hidden group hover:border-primary/50 transition-all duration-500 rounded-[2rem]">
                        <CardHeader>
                            <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                <Layout className="h-6 w-6 text-primary" />
                            </div>
                            <CardTitle className="text-2xl font-serif text-white">Gérer mon site</CardTitle>
                            <CardDescription className="text-white/40">Accédez au tableau de bord</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex flex-col gap-2">
                                <Button variant="outline" asChild className="w-full rounded-full h-12 border-white/10 hover:bg-white/5 text-white/80 transition-all">
                                    <Link href={`/app/${wedding.id}/dashboard`}>Tableau de bord</Link>
                                </Button>
                                <Button asChild variant="secondary" className="w-full rounded-full h-12 bg-white/10 hover:bg-white/20 text-white border-none transition-all">
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
                    <p className="text-white/20 text-sm italic uppercase tracking-[0.2em]">Libala — L'excellence pour votre mariage</p>
                </div>
            </motion.div>
        </div>
    );
}
