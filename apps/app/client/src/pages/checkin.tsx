import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Loader2, CheckCircle2, User, Users, Calendar, Table as TableIcon, Search, ArrowRight } from "lucide-react";
import { RsvpResponse } from "@shared/schema";

interface CheckInGuest extends RsvpResponse {
    groupType?: string;
}

export default function CheckIn() {
    const [location, setLocation] = useLocation();
    const { toast } = useToast();
    const searchParams = new URLSearchParams(window.location.search);
    const token = searchParams.get("token");

    const [inputToken, setInputToken] = useState("");

    const { data: guest, isLoading, error, refetch } = useQuery<CheckInGuest>({
        queryKey: ["checkin", token],
        queryFn: async () => {
            if (!token) throw new Error("No token");
            const res = await fetch(`/api/checkin?token=${token}`);
            if (!res.ok) throw new Error("Guest not found");
            return res.json();
        },
        enabled: !!token,
        retry: false
    });

    const checkInMutation = useMutation({
        mutationFn: async (id: number) => {
            const res = await fetch(`/api/checkin/${id}`, {
                method: "POST",
            });
            if (!res.ok) throw new Error("Failed to check in");
            return res.json();
        },
        onSuccess: () => {
            toast({
                title: "Succès",
                description: "Invité marqué comme présent",
                variant: "default",
                className: "bg-green-600 text-white border-none"
            });
            refetch();
        },
        onError: () => {
            toast({
                title: "Erreur",
                description: "Impossible de valider l'entrée",
                variant: "destructive",
            });
        }
    });

    const handleManualSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (inputToken.trim()) {
            setLocation(`/checkin?token=${inputToken.trim()}`);
        }
    };

    const clearToken = () => {
        setLocation("/checkin");
        setInputToken("");
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    // If we have a token but no guest and no error (shouldn't happen with React Query logic above, but for safety)
    // or if error, we show search.
    const showSearch = !token || error || !guest;

    return (
        <div className="min-h-screen bg-slate-50 p-4 font-sans flex items-center justify-center">
            <div className="w-full max-w-md space-y-8">
                <div className="text-center">
                    <h1 className="text-2xl font-serif font-bold text-slate-900">Accueil & Check-in</h1>
                    <p className="text-slate-600 text-sm mt-1">Scanner le QR Code ou entrer le code manuel</p>
                </div>

                {showSearch ? (
                    <Card className="border-0 shadow-lg">
                        <CardHeader>
                            <CardTitle className="text-lg text-center font-medium">Recherche Invité</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleManualSubmit} className="space-y-4">
                                <div className="space-y-2">
                                    <Input
                                        placeholder="Scanner ou saisir le token..."
                                        value={inputToken}
                                        onChange={(e) => setInputToken(e.target.value)}
                                        className="text-center text-lg h-12 tracking-widest font-mono uppercase"
                                        autoFocus
                                    />
                                </div>
                                <Button type="submit" className="w-full h-12 text-lg">
                                    <Search className="mr-2 h-5 w-5" />
                                    Rechercher
                                </Button>
                                {error && token && (
                                    <div className="p-3 bg-red-50 text-red-600 text-center rounded-md text-sm mt-4">
                                        Code invalide ou invité non trouvé.
                                    </div>
                                )}
                            </form>
                        </CardContent>
                        {error && token && (
                            <CardFooter>
                                <Button variant="outline" onClick={clearToken} className="w-full">
                                    Réessayer
                                </Button>
                            </CardFooter>
                        )}
                    </Card>
                ) : (
                    <Card className="border-0 shadow-xl overflow-hidden">
                        {/* Header Status Strip */}
                        <div className={`h-3 w-full ${guest?.checkedInAt ? 'bg-green-500' : 'bg-slate-300'}`} />

                        <CardHeader className="text-center pb-4">
                            <div className="mx-auto bg-slate-100 rounded-full p-4 mb-4 w-20 h-20 flex items-center justify-center">
                                {guest?.checkedInAt ? (
                                    <CheckCircle2 className="h-10 w-10 text-green-600" />
                                ) : (
                                    <User className="h-10 w-10 text-slate-600" />
                                )}
                            </div>
                            <CardTitle className="text-2xl font-serif font-bold tracking-tight">
                                {guest?.firstName} {guest?.lastName}
                            </CardTitle>
                            {guest?.checkedInAt && (
                                <span className="inline-block mt-2 px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-bold uppercase tracking-wider">
                                    Déjà Présent
                                </span>
                            )}
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-slate-50 p-4 rounded-xl text-center border border-slate-100">
                                    <Users className="h-5 w-5 mx-auto text-primary mb-2" />
                                    <p className="text-xs text-muted-foreground uppercase font-semibold tracking-wider">Groupe</p>
                                    <p className="font-bold text-lg text-slate-900 mt-1">{guest?.partySize} pers.</p>
                                </div>
                                <div className="bg-slate-50 p-4 rounded-xl text-center border border-slate-100">
                                    <TableIcon className="h-5 w-5 mx-auto text-primary mb-2" />
                                    <p className="text-xs text-muted-foreground uppercase font-semibold tracking-wider">Table</p>
                                    <p className="font-bold text-lg text-slate-900 mt-1">{guest?.tableNumber || "N/A"}</p>
                                </div>
                            </div>

                            <div className="space-y-3 pt-2">
                                <div className="flex justify-between text-sm py-2 border-b border-slate-100">
                                    <span className="text-muted-foreground">Email</span>
                                    <span className="font-medium text-slate-900 max-w-[200px] truncate">{guest?.email || "-"}</span>
                                </div>
                                <div className="flex justify-between text-sm py-2 border-b border-slate-100">
                                    <span className="text-muted-foreground">Disponibilité</span>
                                    <span className="font-medium text-slate-900">
                                        {guest?.availability === 'both' && 'Les deux dates'}
                                        {guest?.availability === 'confirmed' && 'Présent'}
                                        {guest?.availability === 'declined' && 'Absent'}
                                        {guest?.availability === 'unavailable' && 'Indisponible'}
                                    </span>
                                </div>
                            </div>
                        </CardContent>
                        <CardFooter className="flex-col gap-3 pt-2 pb-6">
                            {!guest?.checkedInAt ? (
                                <Button
                                    size="lg"
                                    className="w-full h-14 text-lg font-bold bg-green-600 hover:bg-green-700 shadow-lg shadow-green-900/20"
                                    onClick={() => checkInMutation.mutate(guest.id)}
                                    disabled={checkInMutation.isPending}
                                >
                                    {checkInMutation.isPending ? (
                                        <>
                                            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                            Validation...
                                        </>
                                    ) : (
                                        <>
                                            <CheckCircle2 className="mr-2 h-6 w-6" />
                                            Valider l'entrée
                                        </>
                                    )}
                                </Button>
                            ) : (
                                <div className="w-full p-4 bg-green-50 rounded-lg text-center border border-green-100">
                                    <p className="text-green-800 font-medium">Invité enregistré à {new Date(guest.checkedInAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                                </div>
                            )}

                            <Button variant="ghost" className="w-full mt-2" onClick={clearToken}>
                                <Search className="mr-2 h-4 w-4" />
                                Scanner un autre invité
                            </Button>
                        </CardFooter>
                    </Card>
                )}
            </div>
        </div>
    );
}
