import { useState, useEffect } from "react";
import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
    FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";
import { Check, Heart, Sparkles, ArrowRight, Calendar, Globe, Layout } from "lucide-react";

// Template images
const TEMPLATES = [
    { id: 'heritage', name: 'Héritage', description: 'Le classique intemporel de Nocely', image: 'https://images.unsplash.com/photo-1544078751-58fee2d8a03b?auto=format&fit=crop&q=80' },
    { id: 'classic', name: 'Classique', description: 'Élégant et intemporel', image: '/template_classic_preview_1770241373403.png' },
    { id: 'modern', name: 'Moderne', description: 'Épuré et minimaliste', image: '/template_modern_preview_1770241388271.png' },
    { id: 'minimal', name: 'Minimal', description: 'Audacieux et chic', image: '/template_minimal_preview_1770241404102.png' },
];

const onboardingSchema = z.object({
    title: z.string().min(3, "Le titre doit faire au moins 3 caractères"),
    slug: z.string().min(3, "Le slug doit faire au moins 3 caractères").regex(/^[a-z0-9-]+$/, "Uniquement des minuscules, chiffres et tirets"),
    weddingDate: z.string().min(1, "La date est requise"),
    templateId: z.string().default('classic'),
});

type OnboardingForm = z.infer<typeof onboardingSchema>;

export default function Onboarding() {
    const { toast } = useToast();
    const [, setLocation] = useLocation();
    const [step, setStep] = useState(1);
    const [isLoading, setIsLoading] = useState(false);

    const form = useForm<OnboardingForm>({
        resolver: zodResolver(onboardingSchema),
        defaultValues: {
            title: "",
            slug: "",
            weddingDate: "",
            templateId: "classic",
        },
    });

    // Auto-generate slug from title
    const title = form.watch("title");
    React.useEffect(() => {
        if (title) {
            const generatedSlug = title
                .toLowerCase()
                .normalize("NFD")
                .replace(/[\u0300-\u036f]/g, "")
                .replace(/[^a-z0-9]/g, "-")
                .replace(/-+/g, "-")
                .replace(/^-|-$/g, "");

            form.setValue("slug", generatedSlug, { shouldValidate: true });
        }
    }, [title, form]);

    const nextStep = async () => {
        const isValid = await form.trigger(["title", "slug", "weddingDate"]);
        if (isValid) setStep(2);
    };

    const onSubmit = async (data: OnboardingForm) => {
        // Show loading screen
        setIsLoading(true);

        try {
            // Create the wedding directly (user is already authenticated)
            const response = await fetch("/api/weddings", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify(data),
            });

            if (!response.ok) {
                throw new Error("Failed to create wedding");
            }

            const wedding = await response.json();

            // Redirect to welcome page
            setLocation(`/app/${wedding.id}/welcome`);
        } catch (error) {
            setIsLoading(false);
            toast({
                title: "Erreur",
                description: "Impossible de créer votre projet. Vérifiez vos informations puis réessayez.",
                variant: "destructive",
            });
        }
    };

    return (
        <div className="min-h-screen bg-[#050505] text-white selection:bg-primary/30 flex items-center justify-center p-6 overflow-hidden relative">
            {/* Background elements */}
            <div className="absolute top-1/4 -left-20 w-72 h-72 bg-primary/10 rounded-full blur-[120px] animate-blob pointer-events-none" />
            <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-primary/5 rounded-full blur-[150px] animate-blob animation-delay-500 pointer-events-none" />

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-5xl relative z-10"
            >
                <div className="text-center mb-12">
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass-morphism text-[10px] font-semibold tracking-wider uppercase text-primary border-primary/20 mb-6">
                        <Sparkles className="h-3 w-3" />
                        Lancez votre aventure
                    </div>
                    <h1 className="text-4xl md:text-5xl font-serif font-bold mb-4">
                        Créez votre site <span className="text-gradient italic">Nocely</span>
                    </h1>
                    <p className="text-white/40 max-w-lg mx-auto text-sm">
                        Une plateforme moderne pour créer, personnaliser et publier une expérience digitale élégante.
                    </p>
                </div>

                <div className="flex justify-center gap-4 mb-12">
                    {[1, 2].map((i) => (
                        <div key={i} className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-500 ${step >= i ? 'bg-primary text-white shadow-[0_0_15px_rgba(200,169,106,0.5)]' : 'bg-white/5 text-white/30 border border-white/10'
                                }`}>
                                {step > i ? <Check className="h-4 w-4" /> : i}
                            </div>
                            <span className={`text-xs uppercase tracking-[0.2em] font-medium hidden sm:block ${step >= i ? 'text-primary' : 'text-white/20'
                                }`}>
                                {i === 1 ? 'Détails' : 'Design'}
                            </span>
                            {i === 1 && <div className={`h-[1px] w-12 sm:w-20 mx-2 ${step > 1 ? 'bg-primary' : 'bg-white/10'}`} />}
                        </div>
                    ))}
                </div>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                        <AnimatePresence mode="wait">
                            {step === 1 ? (
                                <motion.div
                                    key="step1"
                                    initial={{ x: 20, opacity: 0 }}
                                    animate={{ x: 0, opacity: 1 }}
                                    exit={{ x: -20, opacity: 0 }}
                                    className="grid grid-cols-1 md:grid-cols-2 gap-8"
                                >
                                    <Card className="glass-morphism p-8 border-white/5 space-y-6 md:col-span-2">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                            <FormField
                                                control={form.control}
                                                name="title"
                                                render={({ field }) => (
                                                    <FormItem className="md:col-span-2">
                                                        <FormLabel className="text-white/70 uppercase tracking-widest text-[10px] font-bold">Titre du projet</FormLabel>
                                                        <FormControl>
                                                            <div className="relative">
                                                                <Heart className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-primary/50" />
                                                                <Input placeholder="Ex: Alex & Sam 2026" {...field} className="glass-morphism border-white/10 h-14 pl-12 focus:border-primary/50 transition-colors text-lg font-serif text-white placeholder:text-white/30" />
                                                            </div>
                                                        </FormControl>
                                                        <FormDescription className="text-white/30 text-[10px]">C'est le nom qui apparaîtra fièrement sur votre invitation.</FormDescription>
                                                        <FormMessage className="text-red-400" />
                                                    </FormItem>
                                                )}
                                            />

                                            <FormField
                                                control={form.control}
                                                name="slug"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel className="text-white/70 uppercase tracking-widest text-[10px] font-bold">Votre URL unique</FormLabel>
                                                        <div className="flex items-center">
                                                            <div className="glass-morphism border-white/10 border-r-0 px-4 h-14 flex items-center text-xs text-white/40 font-mono rounded-l-xl">nocely.com/</div>
                                                            <FormControl>
                                                                <Input {...field} className="glass-morphism border-white/10 rounded-l-none h-14 focus:border-primary/50 transition-colors font-mono text-white placeholder:text-white/30" />
                                                            </FormControl>
                                                        </div>
                                                        <FormMessage className="text-red-400" />
                                                    </FormItem>
                                                )}
                                            />

                                            <FormField
                                                control={form.control}
                                                name="weddingDate"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel className="text-white/70 uppercase tracking-widest text-[10px] font-bold">Date principale</FormLabel>
                                                        <FormControl>
                                                            <div className="relative">
                                                                <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-primary/50" />
                                                                <Input type="date" {...field} className="glass-morphism border-white/10 h-14 pl-12 focus:border-primary/50 transition-colors appearance-none text-white [color-scheme:dark]" />
                                                            </div>
                                                        </FormControl>
                                                        <FormMessage className="text-red-400" />
                                                    </FormItem>
                                                )}
                                            />
                                        </div>
                                    </Card>

                                    <div className="md:col-span-2 flex justify-center">
                                        <Button
                                            type="button"
                                            size="lg"
                                            className="rounded-full px-12 h-16 text-lg bg-primary hover:bg-primary/90 group border-none shadow-[0_10px_30px_rgba(200,169,106,0.2)]"
                                            onClick={nextStep}
                                        >
                                            Choisir notre design
                                            <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                                        </Button>
                                    </div>
                                </motion.div>
                            ) : (
                                <motion.div
                                    key="step2"
                                    initial={{ x: 20, opacity: 0 }}
                                    animate={{ x: 0, opacity: 1 }}
                                    exit={{ x: -20, opacity: 0 }}
                                    className="space-y-12"
                                >
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                                        {TEMPLATES.map((tmpl) => (
                                            <div
                                                key={tmpl.id}
                                                className={`relative cursor-pointer group rounded-[2rem] border-2 transition-all duration-500 overflow-hidden flex flex-col h-full bg-[#111] ${form.watch("templateId") === tmpl.id
                                                    ? 'border-primary shadow-[0_0_40px_rgba(200,169,106,0.15)] scale-[1.02]'
                                                    : 'border-white/5 hover:border-white/20'
                                                    }`}
                                                onClick={() => form.setValue("templateId", tmpl.id)}
                                            >
                                                <div className="aspect-[3/4] relative overflow-hidden">
                                                    <img src={tmpl.image} alt={tmpl.name} className={`object-cover h-full w-full transition-transform duration-1000 ${form.watch("templateId") === tmpl.id ? 'scale-110' : 'group-hover:scale-105'}`} />
                                                    <div className="absolute inset-0 bg-gradient-to-t from-[#111] via-transparent to-transparent opacity-80" />

                                                    {form.watch("templateId") === tmpl.id && (
                                                        <motion.div
                                                            layoutId="active-check"
                                                            className="absolute top-6 right-6 bg-primary text-white p-2 rounded-full shadow-lg"
                                                        >
                                                            <Check size={18} />
                                                        </motion.div>
                                                    )}
                                                </div>
                                                <div className="p-8 space-y-2 mt-auto">
                                                    <h3 className="font-serif font-bold text-2xl group-hover:text-primary transition-colors">{tmpl.name}</h3>
                                                    <p className="text-xs text-white/40 uppercase tracking-widest">{tmpl.description}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    <div className="flex flex-col sm:flex-row gap-4 items-center justify-center pt-8">
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="lg"
                                            className="rounded-full h-14 px-8 text-white/40 hover:text-white hover:bg-white/5"
                                            onClick={() => setStep(1)}
                                        >
                                            ← Modifier les détails
                                        </Button>
                                        <Button
                                            type="submit"
                                            size="lg"
                                            className="rounded-full px-16 h-16 text-xl bg-primary hover:bg-primary/90 shadow-[0_15px_40px_rgba(200,169,106,0.25)] font-bold border-none"
                                        >
                                            Finaliser mon site
                                        </Button>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </form>
                </Form>
            </motion.div>

            {/* Loading Screen */}
            <AnimatePresence>
                {isLoading && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-[#050505] z-50 flex items-center justify-center"
                    >
                        <div className="text-center space-y-8">
                            <motion.div
                                initial={{ scale: 0.8, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                transition={{ delay: 0.2 }}
                                className="relative"
                            >
                                <div className="w-24 h-24 mx-auto bg-primary/20 rounded-2xl flex items-center justify-center border border-primary/30 shadow-[0_0_40px_rgba(200,169,106,0.3)]">
                                    <Sparkles className="h-12 w-12 text-primary animate-pulse" />
                                </div>
                                <div className="absolute inset-0 bg-primary/10 rounded-2xl blur-2xl animate-pulse" />
                            </motion.div>

                            <motion.div
                                initial={{ y: 20, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                transition={{ delay: 0.4 }}
                                className="space-y-4"
                            >
                                <h2 className="text-3xl font-serif font-bold text-white">
                                    Préparation de votre espace Nocely
                                </h2>
                                <div className="space-y-2">
                                    <motion.p
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        transition={{ delay: 0.6 }}
                                        className="text-white/60 text-sm"
                                    >
                                        Configuration de votre design...
                                    </motion.p>
                                    <motion.p
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        transition={{ delay: 1.0 }}
                                        className="text-white/60 text-sm"
                                    >
                                        Initialisation de votre espace...
                                    </motion.p>
                                    <motion.p
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        transition={{ delay: 1.4 }}
                                        className="text-white/60 text-sm"
                                    >
                                        Presque prêt...
                                    </motion.p>
                                </div>
                            </motion.div>

                            <motion.div
                                initial={{ scaleX: 0 }}
                                animate={{ scaleX: 1 }}
                                transition={{ duration: 2, ease: "easeInOut" }}
                                className="w-64 h-1 bg-primary/20 rounded-full mx-auto overflow-hidden"
                            >
                                <motion.div
                                    initial={{ x: "-100%" }}
                                    animate={{ x: "100%" }}
                                    transition={{ duration: 2, ease: "easeInOut" }}
                                    className="h-full w-1/2 bg-gradient-to-r from-transparent via-primary to-transparent"
                                />
                            </motion.div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
