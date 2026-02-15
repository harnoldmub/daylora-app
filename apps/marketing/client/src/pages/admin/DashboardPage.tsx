import { useQuery } from "@tanstack/react-query";
import { type RsvpResponse, type Wedding } from "@shared/schema";
import { OnboardingChecklist } from "@/components/onboarding-checklist";
import { DashboardWidgets } from "@/components/dashboard-widgets";
import { useParams } from "wouter";
import { Loader2 } from "lucide-react";

export default function DashboardPage() {
    const { weddingId } = useParams<{ weddingId: string }>();

    const { data: responses, isLoading: responsesLoading } = useQuery<RsvpResponse[]>({
        queryKey: [`/api/rsvp`],
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

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div>
                <h1 className="text-3xl font-serif font-bold">Tableau de bord</h1>
                <p className="text-muted-foreground mt-1">
                    Aperçu de l'organisation pour <span className="font-semibold">{wedding?.title}</span>
                </p>
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
