import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useLocation, Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { z } from "zod";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { Loader2, CheckCircle2 } from "lucide-react";

const resetSchema = z.object({
    password: z.string().min(8, "Le mot de passe doit contenir au moins 8 caractères."),
    confirmPassword: z.string().min(1, "Veuillez confirmer votre mot de passe.")
}).refine((data) => data.password === data.confirmPassword, {
    message: "Les deux mots de passe ne correspondent pas. Veuillez les saisir à nouveau.",
    path: ["confirmPassword"],
});

export default function ResetPassword() {
    const [params] = useState(() => new URLSearchParams(window.location.search));
    const token = params.get("token");
    const [, setLocation] = useLocation();
    const { toast } = useToast();
    const [isSuccess, setIsSuccess] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const form = useForm({
        resolver: zodResolver(resetSchema),
        defaultValues: {
            password: "",
            confirmPassword: "",
        },
    });

    const onSubmit = async (data: any) => {
        if (!token) {
            toast({ title: "Lien invalide", description: "Le lien de réinitialisation est incomplet ou a expiré. Veuillez demander un nouveau lien.", variant: "destructive" });
            return;
        }

        setIsLoading(true);
        try {
            await apiRequest("POST", "/api/auth/reset-password", { token, password: data.password });
            setIsSuccess(true);
            toast({ title: "Mot de passe modifié", description: "Votre mot de passe a été réinitialisé avec succès. Vous pouvez maintenant vous connecter." });
        } catch (err: any) {
            const msg = err.message || "";
            let description = "Impossible de réinitialiser le mot de passe. Veuillez réessayer.";
            if (msg.includes("expiré") || msg.includes("expired") || msg.includes("invalide") || msg.includes("invalid")) {
                description = "Ce lien de réinitialisation a expiré ou n'est plus valide. Veuillez demander un nouveau lien.";
            } else if (msg) {
                description = msg;
            }
            toast({ title: "Réinitialisation impossible", description, variant: "destructive" });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-muted/30 flex items-center justify-center p-6">
            <Card className="w-full max-w-md shadow-lg border-t-4 border-primary">
                <CardHeader className="text-center">
                    <CardTitle className="text-2xl font-serif">Nouveau mot de passe</CardTitle>
                    <CardDescription>Sécurisez votre accès Daylora</CardDescription>
                </CardHeader>

                <CardContent className="space-y-6 pt-4">
                    {isSuccess ? (
                        <div className="text-center py-6 space-y-4">
                            <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto" />
                            <p className="font-medium text-lg">Mot de passe modifié avec succès !</p>
                            <p className="text-muted-foreground text-sm">
                                Votre nouveau mot de passe est actif. Connectez-vous dès maintenant.
                            </p>
                            <Link href="/login" title="Se connecter">
                                <Button className="w-full rounded-full mt-4">Se connecter</Button>
                            </Link>
                        </div>
                    ) : (
                        <Form {...form}>
                            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                                <FormField
                                    control={form.control}
                                    name="password"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Nouveau mot de passe</FormLabel>
                                            <FormControl>
                                                <Input type="password" {...field} disabled={isLoading} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="confirmPassword"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Confirmez le mot de passe</FormLabel>
                                            <FormControl>
                                                <Input type="password" {...field} disabled={isLoading} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <Button type="submit" className="w-full rounded-full" disabled={isLoading}>
                                    {isLoading ? <Loader2 className="animate-spin mr-2" /> : null}
                                    Réinitialiser le mot de passe
                                </Button>
                            </form>
                        </Form>
                    )}

                    {!isSuccess && (
                        <div className="text-center border-t pt-4">
                            <Link href="/login" title="Annuler" className="text-sm text-muted-foreground hover:text-primary">
                                Annuler et retourner à la connexion
                            </Link>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
