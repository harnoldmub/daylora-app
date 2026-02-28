import { useEffect, useState } from "react";
import { useLocation, Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Loader2, CheckCircle2, XCircle, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function VerifyEmail() {
    const [params] = useState(() => new URLSearchParams(window.location.search));
    const token = params.get("token");
    const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
    const [message, setMessage] = useState("");
    const [showResend, setShowResend] = useState(false);
    const [resendEmail, setResendEmail] = useState("");
    const [resendStatus, setResendStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
    const [resendMessage, setResendMessage] = useState("");

    useEffect(() => {
        if (!token) {
            setStatus("error");
            setMessage("Le lien de vérification est incomplet ou invalide. Vérifiez votre email ou demandez un nouveau lien ci-dessous.");
            setShowResend(true);
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
                    setMessage(data.message || "Ce lien de vérification n'est plus valide ou a expiré. Demandez un nouveau lien ci-dessous.");
                    setShowResend(true);
                }
            } catch (err) {
                setStatus("error");
                setMessage("Impossible de vérifier votre compte pour le moment. Vérifiez votre connexion internet et réessayez dans quelques instants.");
                setShowResend(true);
            }
        }

        verify();
    }, [token]);

    const handleResend = async () => {
        if (!resendEmail.trim()) return;
        setResendStatus("sending");
        try {
            const res = await fetch("/api/auth/resend-verification", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email: resendEmail.trim().toLowerCase() }),
            });
            const data = await res.json();
            if (res.ok) {
                setResendStatus("sent");
                setResendMessage("Si un compte existe avec cette adresse, un nouveau lien de vérification vous a été envoyé. Pensez à vérifier vos spams.");
            } else {
                setResendStatus("error");
                setResendMessage(data.message || "Impossible d'envoyer l'email de vérification. Veuillez réessayer dans quelques instants.");
            }
        } catch {
            setResendStatus("error");
            setResendMessage("Une erreur est survenue. Vérifiez votre connexion internet et réessayez.");
        }
    };

    return (
        <div className="min-h-screen bg-muted/30 flex items-center justify-center p-6">
            <Card className="w-full max-w-md shadow-lg border-t-4 border-primary text-center">
                <CardHeader>
                    <CardTitle className="text-2xl font-serif">Vérification de compte</CardTitle>
                    <CardDescription>Activation de votre espace Daylora</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6 pt-4">
                    {status === "loading" && (
                        <div className="flex flex-col items-center space-y-4 py-8">
                            <Loader2 className="h-12 w-12 text-primary animate-spin" />
                            <p className="text-muted-foreground">Vérification de votre adresse email en cours…</p>
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

                            {showResend && resendStatus !== "sent" && (
                                <div className="w-full space-y-3 pt-4 border-t">
                                    <p className="text-sm text-muted-foreground">Saisissez votre adresse email pour recevoir un nouveau lien :</p>
                                    <div className="flex gap-2">
                                        <Input
                                            type="email"
                                            placeholder="Votre adresse email"
                                            value={resendEmail}
                                            onChange={(e) => setResendEmail(e.target.value)}
                                            className="flex-1"
                                        />
                                        <Button
                                            onClick={handleResend}
                                            disabled={resendStatus === "sending" || !resendEmail.trim()}
                                            size="sm"
                                            className="shrink-0"
                                        >
                                            {resendStatus === "sending" ? (
                                                <Loader2 className="h-4 w-4 animate-spin" />
                                            ) : (
                                                <Mail className="h-4 w-4" />
                                            )}
                                        </Button>
                                    </div>
                                    {resendStatus === "error" && (
                                        <p className="text-xs text-destructive">{resendMessage}</p>
                                    )}
                                </div>
                            )}

                            {resendStatus === "sent" && (
                                <div className="w-full pt-4 border-t">
                                    <p className="text-sm text-green-600 font-medium">{resendMessage}</p>
                                </div>
                            )}

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
