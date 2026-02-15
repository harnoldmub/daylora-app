import { useWedding, useGuests, useContributions } from "@/hooks/use-api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Euro, Mail, Loader2 } from "lucide-react";

export default function MinimalAdminDashboard() {
    const { data: wedding, isLoading: weddingLoading } = useWedding();
    const { data: guests, isLoading: guestsLoading } = useGuests();
    const { data: contributions, isLoading: contribsLoading } = useContributions();

    if (weddingLoading || guestsLoading || contribsLoading) {
        return <div className="flex h-screen items-center justify-center"><Loader2 className="animate-spin" /></div>;
    }

    const totalAmount = (contributions || []).reduce((acc, curr) => acc + curr.amount, 0) / 100;
    const confirmedGuests = (guests || []).filter(g => g.availability !== 'pending' && g.availability !== 'unavailable').length;

    return (
        <div className="p-8 space-y-6">
            <header>
                <h1 className="text-3xl font-bold">Tableau de bord : {wedding?.title}</h1>
                <p className="text-muted-foreground italic">Statistiques en temps réel de votre événement.</p>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium italic">Total Cagnotte</CardTitle>
                        <Euro className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{totalAmount.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}</div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium italic">Invités Confirmés</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{confirmedGuests} / {guests?.length || 0}</div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium italic">Taux de réponse</CardTitle>
                        <Mail className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {guests?.length ? Math.round((guests.filter(g => g.availability !== 'pending').length / guests.length) * 100) : 0}%
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Activités Récentes</CardTitle>
                </CardHeader>
                <CardContent>
                    {/* Feed of recent SSE events would go here */}
                    <p className="text-sm text-muted-foreground italic">Le flux d'événements en direct sera affiché ici.</p>
                </CardContent>
            </Card>
        </div>
    );
}
