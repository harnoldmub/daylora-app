import { useEffect, useState } from "react";
import { useLocation, Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Loader2, CheckCircle2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function VerifyEmail() {
    const [params] = useState(() => new URLSearchParams(window.location.search));
    const token = params.get("token");
    const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
    const [message, setMessage] = useState("");

    useEffect(() => {
        if (!token) {
            setStatus("error");
            setMessage("Token de vérification manquant.");
            return;
        }

        async function verify() {
            try {
                const res = await fetch(`/api/auth/verify-email?token=${token}`);
                const data = await res.json();

                if (res.ok) {
                    setStatus("success");
                    setMessage(data.message);
                } else {
                    setStatus("error");
                    setMessage(data.message || "Le lien est invalide ou a expiré.");
                }
            } catch (err) {
                setStatus("error");
                setMessage("Une erreur est survenue lors de la vérification.");
            }
        }

        verify();
    }, [token]);

    return (
        <div className="min-h-screen bg-muted/30 flex items-center justify-center p-6">
            <Card className="w-full max-w-md shadow-lg border-t-4 border-primary text-center">
                <CardHeader>
                    <CardTitle className="text-2xl font-serif">Vérification de compte</CardTitle>
                    <CardDescription>Activation de votre accès Libala</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6 pt-4">
                    {status === "loading" && (
                        <div className="flex flex-col items-center space-y-4 py-8">
                            <Loader2 className="h-12 w-12 text-primary animate-spin" />
                            <p className="text-muted-foreground">Vérification de votre lien en cours...</p>
                        </div>
                    )}

                    {status === "success" && (
                        <div className="flex flex-col items-center space-y-4 py-8">
                            <CheckCircle2 className="h-16 w-16 text-green-500" />
                            <p className="font-medium text-lg text-foreground">{message}</p>
                            <Link href="/login" title="Se connecter">
                                <Button className="w-full rounded-full mt-4">Se connecter maintenant</Button>
                            </Link>
                        </div>
                    )}

                    {status === "error" && (
                        <div className="flex flex-col items-center space-y-4 py-8">
                            <XCircle className="h-16 w-16 text-destructive" />
                            <p className="font-medium text-lg text-destructive">{message}</p>
                            <Link href="/login" title="Retour à la connexion">
                                <Button variant="outline" className="w-full rounded-full mt-4">Retour à la connexion</Button>
                            </Link>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
