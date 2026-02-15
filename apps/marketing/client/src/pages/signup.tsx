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
import { signupSchema } from "@shared/schema";
import { useAuth } from "@/hooks/useAuth";
import { Loader2, Heart } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

export default function Signup() {
    const [, setLocation] = useLocation();
    const { signupMutation } = useAuth();

    const form = useForm({
        resolver: zodResolver(signupSchema),
        defaultValues: {
            email: "",
            password: "",
            firstName: "",
        },
    });

    const onSubmit = async (data: any) => {
        try {
            await signupMutation.mutateAsync(data);

            // After successful signup, redirect to onboarding to create wedding
            setLocation("/onboarding");
        } catch (error) {
            // Error is handled by the mutation or toast
        }
    };

    return (
        <div className="min-h-screen bg-[#050505] text-white selection:bg-primary/30 flex items-center justify-center p-6 overflow-hidden relative">
            {/* Background elements */}
            <div className="absolute top-1/4 -left-20 w-72 h-72 bg-primary/10 rounded-full blur-[120px] animate-blob pointer-events-none" />
            <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-primary/5 rounded-full blur-[150px] animate-blob animation-delay-500 pointer-events-none" />

            <Card className="w-full max-w-md glass-morphism relative z-10 border-white/10 shadow-2xl rounded-[2.5rem] overflow-hidden">
                <CardHeader className="text-center pt-10 pb-2">
                    <div className="flex justify-center mb-6">
                        <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center shadow-[0_0_20px_rgba(200,169,106,0.4)]">
                            <Heart className="h-6 w-6 text-white fill-white" />
                        </div>
                    </div>
                    <CardTitle className="text-4xl font-serif font-bold text-white">Libala</CardTitle>
                    <CardDescription className="text-white/40 italic mt-2">Dernière étape avant le grand jour</CardDescription>
                </CardHeader>

                <CardContent className="space-y-6 p-10 pt-4">
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                            <FormField
                                control={form.control}
                                name="firstName"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-white/70 uppercase tracking-widest text-[10px] font-bold">Prénom</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Jean" {...field} className="glass-morphism border-white/10 h-12 focus:border-primary/50 transition-colors" />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="email"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-white/70 uppercase tracking-widest text-[10px] font-bold">Email professionnel</FormLabel>
                                        <FormControl>
                                            <Input placeholder="jean@exemple.com" {...field} className="glass-morphism border-white/10 h-12 focus:border-primary/50 transition-colors" />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="password"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-white/70 uppercase tracking-widest text-[10px] font-bold">Mot de passe secret</FormLabel>
                                        <FormControl>
                                            <Input type="password" {...field} className="glass-morphism border-white/10 h-12 focus:border-primary/50 transition-colors" />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <Button
                                type="submit"
                                className="w-full rounded-full h-14 bg-primary hover:bg-primary/90 text-white font-bold text-lg shadow-[0_10px_30px_rgba(200,169,106,0.2)] border-none mt-4 transition-all"
                                disabled={signupMutation.isPending}
                            >
                                {signupMutation.isPending ? <Loader2 className="animate-spin mr-2" /> : "Créer mon univers"}
                            </Button>
                        </form>
                    </Form>

                    <div className="text-center text-sm pt-4">
                        <span className="text-white/40 font-medium">Déjà parmi nous ?</span>{" "}
                        <Link href="/login" title="Se connecter à Libala" className="text-primary font-bold hover:text-primary/80 transition-colors ml-1">
                            Connectez-vous
                        </Link>
                    </div>

                    <div className="pt-8 border-t border-white/5 text-center">
                        <button
                            onClick={() => setLocation("/")}
                            className="text-[10px] uppercase tracking-widest text-white/20 hover:text-primary transition-all font-bold"
                        >
                            ← Explorer Libala
                        </button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
