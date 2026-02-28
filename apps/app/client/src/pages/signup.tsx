import { useEffect, useState } from "react";
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
import { Loader2, Heart, Eye, EyeOff } from "lucide-react";

export default function Signup() {
    const [, setLocation] = useLocation();
    const { signupMutation } = useAuth();
    const [showPassword, setShowPassword] = useState(false);

    useEffect(() => {
        document.title = "Daylora – Inscription";
    }, []);

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
            const result: any = await signupMutation.mutateAsync(data);

            if (result?.debugVerifyToken) {
                await fetch(`/api/auth/verify-email?token=${encodeURIComponent(result.debugVerifyToken)}`, {
                    credentials: "include",
                });
            }

            setLocation(`/login?email=${encodeURIComponent(data.email)}`);
        } catch (error) {
        }
    };

    return (
        <div className="min-h-screen bg-[#F7F3EE] text-[#2b2320] flex items-center justify-center p-6 relative">
            <div className="absolute -top-20 right-0 w-64 h-64 bg-[#E7D9C8]/60 rounded-full blur-[120px]" />
            <div className="absolute bottom-0 left-0 w-72 h-72 bg-[#D7C6B2]/40 rounded-full blur-[140px]" />

            <Card className="w-full max-w-md bg-white border border-[#E6DCCF] shadow-xl rounded-[1.5rem] overflow-hidden relative z-10">
                <CardHeader className="text-center pt-10 pb-2">
                    <div className="flex justify-center mb-6">
                        <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center shadow-md">
                            <Heart className="h-6 w-6 text-white fill-white" />
                        </div>
                    </div>
                    <CardTitle className="text-4xl font-serif font-bold text-[#2b2320]">Daylora</CardTitle>
                    <CardDescription className="text-[#7A6B5E] italic mt-2">Créez votre espace en quelques minutes</CardDescription>
                </CardHeader>

                <CardContent className="space-y-6 p-10 pt-4">
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                            <FormField
                                control={form.control}
                                name="firstName"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-[#6B5B4F] uppercase tracking-widest text-[10px] font-bold">Prénom</FormLabel>
                                        <FormControl>
                                            <Input autoComplete="given-name" placeholder="Jean" {...field} className="bg-white border-[#E6DCCF] h-12 focus:border-primary/50 transition-colors" />
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
                                        <FormLabel className="text-[#6B5B4F] uppercase tracking-widest text-[10px] font-bold">Email professionnel</FormLabel>
                                        <FormControl>
                                            <Input type="email" autoComplete="username" placeholder="jean@exemple.com" {...field} className="bg-white border-[#E6DCCF] h-12 focus:border-primary/50 transition-colors" />
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
                                        <FormLabel className="text-[#6B5B4F] uppercase tracking-widest text-[10px] font-bold">Mot de passe secret</FormLabel>
                                        <FormControl>
                                            <div className="relative">
                                                <Input
                                                    type={showPassword ? "text" : "password"}
                                                    autoComplete="new-password"
                                                    {...field}
                                                    className="bg-white border-[#E6DCCF] h-12 focus:border-primary/50 transition-colors pr-12"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => setShowPassword(!showPassword)}
                                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#B6A796] hover:text-[#6B5B4F] transition-colors"
                                                    tabIndex={-1}
                                                >
                                                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                                                </button>
                                            </div>
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <Button
                                type="submit"
                                className="w-full rounded-full h-14 bg-primary hover:bg-primary/90 text-white font-bold text-lg shadow-md border-none mt-4 transition-all"
                                disabled={signupMutation.isPending}
                            >
                                {signupMutation.isPending ? <Loader2 className="animate-spin mr-2" /> : "Créer mon site"}
                            </Button>
                        </form>
                    </Form>

                    <div className="text-center text-sm pt-4">
                        <span className="text-[#7A6B5E] font-medium">Déjà parmi nous ?</span>{" "}
                        <Link href="/login" title="Se connecter à Daylora" className="text-primary font-bold hover:text-primary/80 transition-colors ml-1">
                            Connectez-vous
                        </Link>
                    </div>

                    <div className="pt-8 border-t border-[#EFE7DD] text-center">
                        <button
                            onClick={() => window.location.href = "https://daylora.app/"}
                            className="text-[10px] uppercase tracking-widest text-[#B6A796] hover:text-primary transition-all font-bold"
                        >
                            ← Découvrir Daylora
                        </button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
