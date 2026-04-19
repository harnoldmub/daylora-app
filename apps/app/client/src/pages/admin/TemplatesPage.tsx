import { useWedding, useUpdateWedding } from "@/hooks/use-api";
import { useParams } from "wouter";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check, Loader2, Lock, Sparkles, Crown } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";
import { useState } from "react";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { GuidedTour, useShouldShowTour } from "@/components/guided-tour";
import { PremiumTemplateUpsell } from "@/components/admin/PremiumUpsellModal";

const TEMPLATES = [
  {
    id: "classic",
    name: "Éclat de Tradition",
    category: "Royal & Intemporel",
    image: "/templates/classic.png",
    description: "L'élégance intemporelle pour un mariage royal sous le signe de la noblesse et de la sérénité.",
    premium: false
  },
  {
    id: "modern",
    name: "Horizon Minimaliste",
    category: "Urban Chic",
    image: "/templates/modern.png",
    description: "Un design épuré et audacieux, pour une esthétique urbaine d'exception à l'élégance affirmée.",
    premium: true
  },
  {
    id: "boho",
    name: "Bohème Sauvage",
    category: "Nature & Liberté",
    image: "/templates/boho.png",
    description: "L'authenticité de la nature alliée à une élégance décontractée pour un mariage libre et organique.",
    premium: true
  },
  {
    id: "avantgarde",
    name: "Studio Couture",
    category: "Éditorial & Mode",
    image: "/templates/avantgarde.png",
    description: "L'avant-garde stylistique pour les couples qui souhaitent briser les codes avec un design éditorial fort.",
    premium: true
  },
  {
    id: "echo",
    name: "Écho",
    category: "Immersif & Parallax",
    image: "/templates/echo.png",
    description: "Une expérience visuelle audacieuse et pure, sublimée par de doux effets de parallax.",
    premium: true
  },
];

export default function TemplatesPage() {
        const { weddingId } = useParams();
        const { data: wedding, isLoading } = useWedding(weddingId);
        const showTour = useShouldShowTour("templates");
        const updateWedding = useUpdateWedding();
        const { toast } = useToast();
        const [previewToken, setPreviewToken] = useState<number>(Date.now());
        const [isApplying, setIsApplying] = useState(false);
        const [pendingTemplateId, setPendingTemplateId] = useState<string | null>(null);

        const [upsellTemplate, setUpsellTemplate] = useState<string | null>(null);

        const handleSelect = async (templateId: string) => {
                if (!wedding) return;
                if (isApplying) return;
                if (wedding.templateId === templateId) return;
                const tmpl = TEMPLATES.find(t => t.id === templateId);
                if (tmpl?.premium && wedding.currentPlan !== "premium") {
                        setUpsellTemplate(tmpl.name);
                        return;
                }
                setIsApplying(true);
                setPendingTemplateId(templateId);
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
                                title: "Mise à jour impossible",
                                description: "Impossible d'appliquer ce template pour le moment. Veuillez réessayer.",
                                variant: "destructive",
                        });
                } finally {
                        setIsApplying(false);
                        setPendingTemplateId(null);
                }
        };

        if (isLoading || !wedding) return <div className="animate-pulse h-64 bg-muted rounded-xl" />;

        const base = typeof window !== "undefined" ? window.location.origin : "https://daylora.app";
        const slug = wedding.slug || wedding.id;
        const previewUrl = `${base}/preview/${slug}?t=${previewToken}`;
        const previewScale = 0.72;
        const previewFrameHeight = 720;
        const previewScaledHeight = Math.round(previewFrameHeight * previewScale);

        return (
                <div className="space-y-8">
                        <AdminPageHeader
                                title="Templates"
                                description="Choisissez un style, puis personnalisez-le dans l'éditeur visuel."
                                actions={
                                        wedding.currentPlan === "premium" ? (
                                                <div className="flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full text-primary text-xs font-bold uppercase tracking-wider">
                                                        <Sparkles className="h-4 w-4" />
                                                        Plan Premium
                                                </div>
                                        ) : (
                                                <div className="flex items-center gap-2 px-4 py-2 border border-border rounded-full text-muted-foreground text-xs font-bold uppercase tracking-wider">
                                                        Plan Gratuit
                                                </div>
                                        )
                                }
                        />

                        <Card className="p-5 border-border/70">
                                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                                        <div>
                                                <div className="flex items-center gap-2">
                                                        <Crown className={`h-4 w-4 ${wedding.currentPlan === "premium" ? "text-amber-600" : "text-muted-foreground"}`} />
                                                        <p className="text-sm font-semibold">
                                                                {wedding.currentPlan === "premium" ? "Templates premium débloqués" : "Templates premium disponibles avec Premium"}
                                                        </p>
                                                </div>
                                                <p className="mt-1 text-sm text-muted-foreground">
                                                        {wedding.currentPlan === "premium"
                                                                ? "Vous pouvez utiliser tous les templates, y compris Horizon Minimaliste et Studio Couture."
                                                                : "Le plan Découverte inclut Éclat de Tradition. Les autres templates sont réservés au plan Premium."}
                                                </p>
                                        </div>
                                        {wedding.currentPlan !== "premium" ? (
                                                <Button asChild variant="outline" className="border-primary/30 text-primary hover:bg-primary/5">
                                                        <Link href={`~/${wedding.id}/billing`}>
                                                                <Sparkles className="mr-2 h-4 w-4" />
                                                                Passer au Premium
                                                        </Link>
                                                </Button>
                                        ) : null}
                                </div>
                        </Card>

                        <div className={`grid grid-cols-3 gap-4 ${isApplying ? "pointer-events-none" : ""}`} data-tour="templates-grid">
                                {TEMPLATES.map((tmpl) => {
                                        const isCurrent = wedding?.templateId === tmpl.id;
                                        const isLocked = tmpl.premium && wedding.currentPlan !== "premium";
                                        return (
                                                <Card
                                                        key={tmpl.id}
                                                        className={`relative cursor-pointer transition-all duration-300 overflow-hidden border ${isCurrent
                                                                ? "border-primary shadow-lg ring-2 ring-primary/20"
                                                                : isLocked ? "opacity-70 hover:opacity-90" : "hover:border-primary/40"
                                                                } ${isApplying && pendingTemplateId !== tmpl.id ? "opacity-60" : ""}`}
                                                        onClick={() => handleSelect(tmpl.id)}
                                                >
                                                        <div className="flex items-center gap-4 p-4">
                                                                <div className="relative w-16 h-20 flex-shrink-0 rounded-lg overflow-hidden border border-border">
                                                                        <img src={tmpl.image} alt={tmpl.name} className="w-full h-full object-cover" />
                                                                        {isCurrent && (
                                                                                <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                                                                                        <div className="bg-primary text-white p-1 rounded-full">
                                                                                                <Check size={12} />
                                                                                        </div>
                                                                                </div>
                                                                        )}
                                                                        {isLocked && !isCurrent && (
                                                                                <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                                                                                        <Lock size={14} className="text-white drop-shadow" />
                                                                                </div>
                                                                        )}
                                                                </div>
                                                                <div className="flex-1 min-w-0">
                                                                        <div className="flex items-center gap-2">
                                                                                <CardTitle className="text-base font-serif">{tmpl.name}</CardTitle>
                                                                                {isLocked && (
                                                                                        <span className="text-[10px] px-1.5 py-0.5 bg-primary/10 text-primary rounded font-semibold uppercase tracking-wider" data-tour="templates-premium">Premium</span>
                                                                                )}
                                                                        </div>
                                                                        <CardDescription className="text-xs mt-1">{tmpl.description}</CardDescription>
                                                                        <div className="mt-2">
                                                                                {isCurrent ? (
                                                                                        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary">
                                                                                                <Check size={12} /> Actuel
                                                                                        </span>
                                                                                ) : isLocked ? (
                                                                                        <Link href={`~/${wedding.id}/billing`} className="text-xs text-primary hover:underline">Passer en Premium</Link>
                                                                                ) : (
                                                                                        <span className="text-xs text-muted-foreground">Sélectionner</span>
                                                                                )}
                                                                        </div>
                                                                </div>
                                                                {isApplying && pendingTemplateId === tmpl.id && (
                                                                        <Loader2 className="h-4 w-4 animate-spin text-primary flex-shrink-0" />
                                                                )}
                                                        </div>
                                                </Card>
                                        );
                                })}
                        </div>

                        <div className="grid grid-cols-1 xl:grid-cols-[1fr_0.4fr] gap-6">
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
                                                        <div className="relative w-full overflow-auto bg-[#F7F3EE]">
                                                                <div
                                                                        className="origin-top-left"
                                                                        style={{
                                                                                transform: `scale(${previewScale})`,
                                                                                width: `${100 / previewScale}%`,
                                                                                height: `${previewScaledHeight}px`,
                                                                        }}
                                                                >
                                                                        <iframe
                                                                                src={previewUrl}
                                                                                title="Preview template"
                                                                                className="w-full border-0"
                                                                                style={{ height: `${previewFrameHeight}px` }}
                                                                        />
                                                                </div>
                                                                {isApplying ? (
                                                                        <div className="absolute inset-0 bg-background/70 backdrop-blur-sm flex items-center justify-center">
                                                                                <div className="flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-semibold text-foreground shadow-lg">
                                                                                        <Loader2 className="h-4 w-4 animate-spin" />
                                                                                        Mise à jour du design...
                                                                                </div>
                                                                        </div>
                                                                ) : null}
                                                        </div>
                                                </div>
                                        </CardContent>
                                </Card>

                                <Card className="p-6 space-y-4 h-fit">
                                        <div className="text-sm font-medium text-muted-foreground">Template actuel</div>
                                        <div className="text-2xl font-serif font-bold">{TEMPLATES.find((t) => t.id === wedding?.templateId)?.name || "Éclat de Tradition"}</div>
                                        <div className="text-sm text-muted-foreground">
                                                Le design est synchronisé sur toutes les pages publiques (RSVP, cagnotte, live).
                                        </div>
                                        <Button asChild className="w-full">
                                                <Link href={`~/${wedding.id}/design`}>Ouvrir l'éditeur visuel</Link>
                                        </Button>
                                </Card>
                        </div>

                        {showTour && (
                                <GuidedTour
                                        tourId="templates"
                                        steps={[
                                                { target: "templates-grid", title: "Choisissez un template", description: "Sélectionnez un style visuel pour votre site. Le design sera appliqué instantanément.", position: "bottom" },
                                                { target: "templates-premium", title: "Templates Premium", description: "Certains templates sont réservés au plan Premium. Passez en Premium pour y accéder.", position: "left" },
                                        ]}
                                />
                        )}

                        <PremiumTemplateUpsell
                                open={!!upsellTemplate}
                                onClose={() => setUpsellTemplate(null)}
                                templateName={upsellTemplate || ""}
                        />
                </div>
        );
}
