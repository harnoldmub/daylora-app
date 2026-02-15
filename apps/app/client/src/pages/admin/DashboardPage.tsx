import { useQuery } from "@tanstack/react-query";
import { type RsvpResponse, type Wedding } from "@shared/schema";
import { OnboardingChecklist } from "@/components/onboarding-checklist";
import { DashboardWidgets } from "@/components/dashboard-widgets";
import { useParams } from "wouter";
import { Loader2, Users, CheckCircle2, XCircle, Calendar, Link2, Copy, ExternalLink } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

export default function DashboardPage() {
    const { weddingId } = useParams<{ weddingId: string }>();
    const { toast } = useToast();

    const { data: responses, isLoading: responsesLoading } = useQuery<RsvpResponse[]>({
        queryKey: ["/api/rsvp", weddingId],
        enabled: !!weddingId,
    });

    const { data: wedding, isLoading: weddingLoading } = useQuery<Wedding>({
        queryKey: [`/api/weddings/${weddingId}`],
        enabled: !!weddingId,
    });

    if (responsesLoading || weddingLoading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    const total = responses?.length || 0;
    const confirmed = (responses || []).filter((r) => r.availability === "confirmed").length;
    const declined = (responses || []).filter((r) => r.availability === "declined").length;
    const pending = total - confirmed - declined;

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-serif font-bold">Tableau de bord</h1>
                    <p className="text-muted-foreground mt-1">
                        Aperçu de l'organisation pour <span className="font-semibold">{wedding?.title}</span>
                    </p>
                </div>

                {wedding && (
                    <Card className="flex items-center gap-3 p-3 bg-primary/5 border-primary/10 max-w-sm w-full">
                        <div className="h-8 w-8 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
                            <Link2 className="h-4 w-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">Lien public</div>
                            <div className="text-sm font-medium truncate">/{wedding.slug}</div>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-primary hover:bg-primary/10"
                                onClick={() => {
                                    const url = `${window.location.origin}/${wedding.slug}`;
                                    navigator.clipboard.writeText(url);
                                    toast({ title: "Copié !", description: "Lien de l'invitation copié." });
                                }}
                            >
                                <Copy className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-primary hover:bg-primary/10"
                                onClick={() => window.open(`/${wedding.slug}`, "_blank")}
                            >
                                <ExternalLink className="h-3.5 w-3.5" />
                            </Button>
                        </div>
                    </Card>
                )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                    { label: "Invités", value: total, icon: Users, hint: "Total RSVP" },
                    { label: "Confirmés", value: confirmed, icon: CheckCircle2, hint: "Réponses positives" },
                    { label: "En attente", value: pending, icon: Calendar, hint: "À relancer" },
                    { label: "Refusés", value: declined, icon: XCircle, hint: "Ne viennent pas" },
                ].map((item) => (
                    <Card key={item.label} className="p-5 flex items-center gap-4">
                        <div className="h-11 w-11 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                            <item.icon className="h-5 w-5" />
                        </div>
                        <div>
                            <div className="text-xs uppercase tracking-widest text-muted-foreground">{item.label}</div>
                            <div className="text-2xl font-semibold">{item.value}</div>
                            <div className="text-xs text-muted-foreground">{item.hint}</div>
                        </div>
                    </Card>
                ))}
            </div>

            {wedding && <OnboardingChecklist wedding={wedding} />}

            <DashboardWidgets
                responses={responses || []}
                onFilterChange={(filter) => {
                    // This would ideally redirect to guests page with filter
                    window.location.href = `/app/${weddingId}/guests?availability=${filter}`;
                }}
            />

            {/* Real-time Activity Feed could go here */}
        </div>
    );
}
