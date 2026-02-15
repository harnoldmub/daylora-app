import { useWedding, useUpdateWedding } from "@/hooks/use-api";
import { useParams } from "wouter";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check, Sparkles, Layout } from "lucide-react";
import { motion } from "framer-motion";
import { useToast } from "@/hooks/use-toast";

const TEMPLATES = [
    { id: 'heritage', name: 'Héritage', description: 'Le classique intemporel de Libala', image: 'https://images.unsplash.com/photo-1544078751-58fee2d8a03b?auto=format&fit=crop&q=80' },
    { id: 'classic', name: 'Classique', description: 'Élégant et intemporel', image: '/template_classic_preview_1770241373403.png' },
    { id: 'modern', name: 'Moderne', description: 'Épuré et minimaliste', image: '/template_modern_preview_1770241388271.png' },
    { id: 'minimal', name: 'Minimal', description: 'Audacieux et chic', image: '/template_minimal_preview_1770241404102.png' },
];

export default function TemplatesPage() {
    const { weddingId } = useParams();
    const { data: wedding, isLoading } = useWedding(weddingId);
    const updateWedding = useUpdateWedding();
    const { toast } = useToast();

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
        } catch (error) {
            toast({
                title: "Erreur",
                description: "Impossible de mettre à jour le design.",
                variant: "destructive",
            });
        }
    };

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-serif font-bold text-foreground">Design du site</h1>
                    <p className="text-muted-foreground mt-1">Personnalisez l'apparence de votre invitation en un clic.</p>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full text-primary text-xs font-bold uppercase tracking-wider">
                    <Sparkles className="h-4 w-4" />
                    Premium active
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {TEMPLATES.map((tmpl) => (
                    <Card
                        key={tmpl.id}
                        className={`relative cursor-pointer transition-all duration-300 overflow-hidden border-2 ${wedding?.templateId === tmpl.id ? 'border-primary shadow-lg ring-2 ring-primary/20' : 'hover:border-primary/40'
                            }`}
                        onClick={() => handleSelect(tmpl.id)}
                    >
                        <div className="aspect-[3/4] relative">
                            <img src={tmpl.image} alt={tmpl.name} className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
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
        </div>
    );
}
