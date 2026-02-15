import { useWedding, useUpdateWedding } from "@/hooks/use-api";
import { useParams } from "wouter";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check, Sparkles } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";
import { useMemo, useState } from "react";

const TEMPLATES = [
    { id: 'classic', name: 'Classique', description: 'Élégant et intemporel', image: '/previews/template_classic_preview_v2.png' },
    { id: 'modern', name: 'Moderne', description: 'Épuré et minimaliste', image: '/previews/template_modern_preview_v2.png' },
    { id: 'minimal', name: 'Minimal', description: 'Audacieux et chic', image: '/previews/template_minimal_preview_v2.png' },
];

export default function TemplatesPage() {
    const { weddingId } = useParams();
    const { data: wedding, isLoading } = useWedding(weddingId);
    const updateWedding = useUpdateWedding();
    const { toast } = useToast();
    const [previewToken, setPreviewToken] = useState<number>(Date.now());

    if (isLoading || !wedding) return <div className="animate-pulse h-64 bg-muted rounded-xl" />;

    const handleSelect = async (templateId: string) => {
        if (!wedding) return;
        try {
            await updateWedding.mutateAsync({
                id: wedding.id,
                templateId
            });
            toast({
                title: "Design mis à jour",
                description: "Le nouveau design a été appliqué à votre site.",
            });
            setPreviewToken(Date.now());
        } catch (error) {
            toast({
                title: "Erreur",
                description: "Impossible de mettre à jour le design.",
                variant: "destructive",
            });
        }
    };

    const previewUrl = useMemo(() => {
        const base = typeof window !== "undefined" ? window.location.origin : "http://localhost:5174";
        const slug = wedding.slug || wedding.id;
        return `${base}/preview/${slug}?t=${previewToken}`;
    }, [wedding.slug, wedding.id, previewToken]);

    return (
        <div className="space-y-8">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-serif font-bold text-foreground">Templates</h1>
                    <p className="text-muted-foreground mt-1">Choisissez un style, puis personnalisez‑le dans l’éditeur visuel.</p>
                </div>
                {wedding.currentPlan === "premium" ? (
                    <div className="flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full text-primary text-xs font-bold uppercase tracking-wider">
                        <Sparkles className="h-4 w-4" />
                        Plan Premium
                    </div>
                ) : (
                    <div className="flex items-center gap-2 px-4 py-2 border border-border rounded-full text-muted-foreground text-xs font-bold uppercase tracking-wider">
                        Plan Gratuit
                    </div>
                )}
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-[1.2fr_0.8fr] gap-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {TEMPLATES.map((tmpl) => (
                        <Card
                            key={tmpl.id}
                            className={`relative cursor-pointer transition-all duration-300 overflow-hidden border ${wedding?.templateId === tmpl.id
                                ? "border-primary shadow-lg ring-2 ring-primary/20"
                                : "hover:border-primary/40"
                                }`}
                            onClick={() => handleSelect(tmpl.id)}
                        >
                            <div className="aspect-[3/4] relative">
                                <img src={tmpl.image} alt={tmpl.name} className="w-full h-full object-cover" />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/55 to-transparent" />
                                {wedding?.templateId === tmpl.id && (
                                    <div className="absolute top-4 right-4 bg-primary text-white p-2 rounded-full shadow-lg">
                                        <Check size={16} />
                                    </div>
                                )}
                            </div>
                            <CardHeader className="p-4">
                                <CardTitle className="text-lg font-serif">{tmpl.name}</CardTitle>
                                <CardDescription className="text-xs uppercase tracking-wider">{tmpl.description}</CardDescription>
                            </CardHeader>
                            <CardContent className="p-4 pt-0">
                                <Button variant={wedding?.templateId === tmpl.id ? "default" : "outline"} className="w-full h-10 rounded-full text-xs font-bold uppercase tracking-widest">
                                    {wedding?.templateId === tmpl.id ? "Actuel" : "Sélectionner"}
                                </Button>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                <div className="space-y-6">
                    <Card className="p-6 space-y-4 h-fit">
                        <div className="text-sm font-medium text-muted-foreground">Template actuel</div>
                        <div className="text-2xl font-serif font-bold">{TEMPLATES.find((t) => t.id === wedding?.templateId)?.name || "Classique"}</div>
                        <div className="text-sm text-muted-foreground">
                            Le design est synchronisé sur toutes les pages publiques (RSVP, cagnotte, live).
                        </div>
                        <Button asChild className="w-full">
                            <Link href={`/app/${wedding.id}/design`}>Ouvrir l’éditeur visuel</Link>
                        </Button>
                    </Card>

                    <Card className="overflow-hidden">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-base">Aperçu du template</CardTitle>
                            <CardDescription>Prévisualisez le rendu public en direct.</CardDescription>
                        </CardHeader>
                        <CardContent className="pt-0">
                            <div className="rounded-xl border bg-background overflow-hidden">
                                <div className="bg-muted/40 px-4 py-2 text-xs text-muted-foreground flex items-center justify-between gap-2">
                                    <span className="truncate">{previewUrl}</span>
                                    <a
                                        href={previewUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-primary font-medium whitespace-nowrap"
                                    >
                                        Ouvrir
                                    </a>
                                </div>
                                <div className="w-full overflow-auto bg-[#F7F3EE]">
                                    <div className="origin-top-left scale-[0.72] w-[140%]">
                                        <iframe
                                            src={previewUrl}
                                            title="Preview template"
                                            className="w-full h-[720px] border-0"
                                        />
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
