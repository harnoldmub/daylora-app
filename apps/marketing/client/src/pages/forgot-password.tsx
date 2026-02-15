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
import { Loader2, MailCheck } from "lucide-react";

const forgotSchema = z.object({
    email: z.string().email("Email invalide"),
});

export default function ForgotPassword() {
    const [, setLocation] = useLocation();
    const { toast } = useToast();
    const [isSent, setIsSent] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const form = useForm({
        resolver: zodResolver(forgotSchema),
        defaultValues: {
            email: "",
        },
    });

    const onSubmit = async (data: any) => {
        setIsLoading(true);
        try {
            await apiRequest("POST", "/api/auth/forgot-password", data);
            setIsSent(true);
            toast({ title: "Email envoyé", description: "Consultez votre boîte mail pour réinitialiser votre mot de passe." });
        } catch (err: any) {
            toast({ title: "Erreur", description: err.message, variant: "destructive" });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-muted/30 flex items-center justify-center p-6">
            <Card className="w-full max-w-md shadow-lg border-t-4 border-primary">
                <CardHeader className="text-center">
                    <CardTitle className="text-2xl font-serif">Mot de passe oublié</CardTitle>
                    <CardDescription>Nous vous enverrons un lien de réinitialisation</CardDescription>
                </CardHeader>

                <CardContent className="space-y-6 pt-4">
                    {isSent ? (
                        <div className="text-center py-6 space-y-4">
                            <MailCheck className="h-16 w-16 text-primary mx-auto animate-pulse" />
                            <p className="text-muted-foreground">
                                Si un compte est associé à l'adresse <strong>{form.getValues("email")}</strong>, vous recevrez un email sous peu.
                            </p>
                            <Link href="/login" title="Retour à la connexion">
                                <Button variant="outline" className="w-full rounded-full mt-4">Retour à la connexion</Button>
                            </Link>
                        </div>
                    ) : (
                        <Form {...form}>
                            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                                <FormField
                                    control={form.control}
                                    name="email"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Email de votre compte</FormLabel>
                                            <FormControl>
                                                <Input placeholder="jean@exemple.com" {...field} disabled={isLoading} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <Button type="submit" className="w-full rounded-full" disabled={isLoading}>
                                    {isLoading ? <Loader2 className="animate-spin mr-2" /> : null}
                                    Envoyer le lien
                                </Button>
                            </form>
                        </Form>
                    )}

                    {!isSent && (
                        <div className="text-center border-t pt-4">
                            <Link href="/login" title="Se connecter" className="text-sm text-primary hover:underline">
                                Pas besoin ? Retour à la connexion
                            </Link>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
