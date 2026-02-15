import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
    Calendar,
    Heart,
    ChevronDown,
    X,
    Share2,
    Facebook,
    Twitter,
    MessageCircle,
    Link2,
    Check,
    Gift,
} from "lucide-react";
import { useParams, Redirect, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import {
    insertRsvpResponseSchema,
    type InsertRsvpResponse,
} from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { AccommodationSection } from "@/components/accommodation";
import { motion } from "framer-motion";
import { useWedding, useUpdateWedding } from "@/hooks/use-api";
import { useAuth } from "@/hooks/useAuth";
import { InlineEditor } from "@/components/ui/inline-editor";
import { Layout, Eye } from "lucide-react";

// Default/Fake data for empty state or loading
const FAKE_DATA = {
    title: "Sophie & Marc",
    date: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(), // 60 days from now
    location: "Château de la Verrière",
    heroImage: "https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&q=80",
    couplePhoto: "https://images.unsplash.com/photo-1583939003579-730e3918a45a?auto=format&fit=crop&q=80",
    story: "Leur histoire a commencé il y a quelques années, une rencontre simple qui s'est transformée en une belle aventure. Aujourd'hui, ils s'apprêtent à dire 'Oui' entourés de leurs proches."
};

function Countdown({ weddingDate }: { weddingDate: string }) {
    const [timeLeft, setTimeLeft] = useState({
        days: 0,
        hours: 0,
        minutes: 0,
        seconds: 0,
    });

    useEffect(() => {
        const target = new Date(weddingDate);
        const timer = setInterval(() => {
            const now = new Date();
            const difference = target.getTime() - now.getTime();

            if (difference > 0) {
                setTimeLeft({
                    days: Math.floor(difference / (1000 * 60 * 60 * 24)),
                    hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
                    minutes: Math.floor((difference / 1000 / 60) % 60),
                    seconds: Math.floor((difference / 1000) % 60),
                });
            }
        }, 1000);
        return () => clearInterval(timer);
    }, [weddingDate]);

    return (
        <div className="flex gap-4 md:gap-8 justify-center items-center flex-wrap">
            {[
                { value: timeLeft.days, label: "Jours" },
                { value: timeLeft.hours, label: "Heures" },
                { value: timeLeft.minutes, label: "Minutes" },
                { value: timeLeft.seconds, label: "Secondes" },
            ].map((item, idx) => (
                <div key={idx} className="flex flex-col items-center">
                    <div className="w-16 h-16 md:w-20 md:h-20 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
                        <span className="text-2xl md:text-3xl font-serif font-bold text-primary">
                            {item.value.toString().padStart(2, "0")}
                        </span>
                    </div>
                    <span className="text-xs md:text-sm text-muted-foreground mt-2 font-sans">
                        {item.label}
                    </span>
                </div>
            ))}
        </div>
    );
}

export default function InvitationPage() {
    const params = useParams();
    const [, setLocation] = useLocation();

    // Extract slug from either /:slug or /preview/:slug
    const slug = params.slug || (window.location.pathname.startsWith('/preview/')
        ? window.location.pathname.split('/')[2]
        : window.location.pathname.split('/')[1]);

    const { data: wedding, isLoading } = useWedding(slug);
    const updateWedding = useUpdateWedding();
    const { user } = useAuth();
    const queryClient = useQueryClient();
    const { toast } = useToast();
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [editMode, setEditMode] = useState(false);

    // Determines if current user can edit this wedding
    const canEdit = !!(user && wedding && user.id === wedding.ownerId);

    // Save text helper
    const handleSaveText = async (key: string, value: string) => {
        if (!wedding) return;

        try {
            await updateWedding.mutateAsync({
                id: wedding.id,
                config: {
                    ...wedding.config,
                    texts: {
                        ...(wedding.config.texts || {}),
                        [key]: value
                    }
                }
            });
            toast({ title: "Modifications enregistrées" });
        } catch (error) {
            toast({
                title: "Erreur lors de la sauvegarde",
                variant: "destructive"
            });
        }
    };

    const form = useForm<InsertRsvpResponse>({
        resolver: zodResolver(insertRsvpResponseSchema),
        defaultValues: {
            firstName: "",
            lastName: "",
            email: "",
            phone: "",
            partySize: 1,
            availability: undefined,
            notes: "",
        },
    });

    const rsvpMutation = useMutation({
        mutationFn: async (data: InsertRsvpResponse) => {
            return await apiRequest("POST", "/api/rsvp", data);
        },
        onSuccess: () => {
            setIsSubmitted(true);
            form.reset();
            queryClient.invalidateQueries({ queryKey: ["/api/rsvp"] });
        },
        onError: (error: Error) => {
            toast({
                title: "Erreur",
                description: error.message || "Une erreur s'est produite.",
                variant: "destructive",
            });
        },
    });

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
            </div>
        );
    }

    const currentWedding = wedding || {
        ...FAKE_DATA,
        id: "fake-id",
        slug: "demo",
        templateId: "classic",
        config: { theme: { primaryColor: "#C8A96A" } }
    } as any;

    if (currentWedding.templateId === 'heritage') {
        return <Redirect to={`/invitation/${currentWedding.id}`} />;
    }

    return (
        <div className="min-h-screen bg-background relative group/page">
            {/* Edit Toggle for Owner */}
            {canEdit && (
                <div className="fixed bottom-6 right-6 z-50 flex gap-2">
                    {editMode ? (
                        <div className="bg-primary text-white px-4 py-2 rounded-full shadow-lg flex items-center gap-2 animate-in slide-in-from-bottom-5">
                            <span className="text-sm font-medium">Mode Édition</span>
                            <Button
                                size="sm"
                                variant="secondary"
                                className="h-7 px-2 rounded-full text-xs"
                                onClick={() => setEditMode(false)}
                            >
                                <Check className="h-3 w-3 mr-1" /> Terminer
                            </Button>
                        </div>
                    ) : (
                        <Button
                            className="rounded-full shadow-lg h-12 px-6 bg-primary/90 hover:bg-primary backdrop-blur-sm"
                            onClick={() => setEditMode(true)}
                        >
                            <Layout className="mr-2 h-4 w-4" />
                            Modifier les textes
                        </Button>
                    )}
                </div>
            )}

            {/* Hero Section */}
            <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
                <motion.div
                    className="absolute inset-0 bg-cover bg-center opacity-40"
                    style={{ backgroundImage: `url(${currentWedding.heroImage || FAKE_DATA.heroImage})` }}
                    initial={{ scale: 1 }}
                    animate={{ scale: 1.1 }}
                    transition={{ duration: 20, repeat: Infinity, repeatType: "reverse", ease: "easeInOut" }}
                />
                <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-black/10 to-background" />

                <div className="relative z-10 text-center px-6 max-w-6xl mx-auto">
                    <motion.div
                        className="text-xs md:text-sm font-sans tracking-[0.3em] uppercase text-primary mb-3 flex justify-center"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                    >
                        <InlineEditor
                            value={currentWedding.config?.texts?.heroSubtitle || "Le Mariage de"}
                            onSave={(val) => handleSaveText("heroSubtitle", val)}
                            canEdit={canEdit && editMode}
                            placeholder="Le Mariage de"
                        />
                    </motion.div>

                    <h1 className="text-5xl md:text-7xl lg:text-8xl font-serif font-light text-foreground mb-6 leading-tight">
                        {currentWedding.title.split(" & ").map((name: string, i: number) => (
                            <span key={i}>
                                {i > 0 && <span className="text-primary mx-4">&</span>}
                                {name}
                            </span>
                        ))}
                    </h1>

                    <div className="mb-8">
                        <p className="text-2xl md:text-4xl font-serif font-light text-foreground/80 tracking-wide">
                            {currentWedding.weddingDate ? new Date(currentWedding.weddingDate).toLocaleDateString("fr-FR", { day: 'numeric', month: 'long', year: 'numeric' }) : "Prochainement"}
                        </p>
                    </div>

                    <Button
                        size="lg"
                        className="rounded-full px-12 py-6 text-sm tracking-widest uppercase font-semibold"
                        onClick={() => document.getElementById("rsvp")?.scrollIntoView({ behavior: "smooth" })}
                    >
                        Confirmer votre présence
                    </Button>
                </div>
            </section>

            {/* RSVP Section */}
            <section id="rsvp" className="py-24 px-6 bg-muted/30">
                <div className="max-w-3xl mx-auto">
                    {!isSubmitted ? (
                        <>
                            <div className="mb-12">
                                <Countdown weddingDate={currentWedding.weddingDate || FAKE_DATA.date} />
                            </div>
                            <h2 className="text-3xl md:text-4xl font-serif font-light text-center mb-4 text-foreground tracking-wide flex justify-center">
                                <InlineEditor
                                    value={currentWedding.config?.texts?.rsvpTitle || "CONFIRMEZ VOTRE PRÉSENCE"}
                                    onSave={(val) => handleSaveText("rsvpTitle", val)}
                                    canEdit={canEdit && editMode}
                                    className="uppercase" // Force uppercase display
                                />
                            </h2>
                            <p className="text-center text-muted-foreground mb-12 max-w-xl mx-auto flex justify-center">
                                <InlineEditor
                                    value={currentWedding.config?.texts?.rsvpDescription || "Nous serions ravis de vous compter parmi nous"}
                                    onSave={(val) => handleSaveText("rsvpDescription", val)}
                                    canEdit={canEdit && editMode}
                                    isTextArea={true} // Allow multiline for description
                                    className="text-center"
                                />
                            </p>

                            <Card className="p-8 md:p-16 border-2 border-primary/10">
                                <Form {...form}>
                                    <form onSubmit={form.handleSubmit((d) => rsvpMutation.mutate(d))} className="space-y-8">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <FormField
                                                control={form.control}
                                                name="firstName"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>Prénom *</FormLabel>
                                                        <FormControl><Input {...field} placeholder="Votre prénom" /></FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                            <FormField
                                                control={form.control}
                                                name="lastName"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>Nom *</FormLabel>
                                                        <FormControl><Input {...field} placeholder="Votre nom" /></FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <FormField
                                                control={form.control}
                                                name="email"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>Adresse email *</FormLabel>
                                                        <FormControl><Input {...field} value={field.value ?? ""} type="email" placeholder="votre@email.com" /></FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                            <FormField
                                                control={form.control}
                                                name="availability"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>Serez-vous présent ? *</FormLabel>
                                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                            <FormControl>
                                                                <SelectTrigger>
                                                                    <SelectValue placeholder="Sélectionnez" />
                                                                </SelectTrigger>
                                                            </FormControl>
                                                            <SelectContent>
                                                                <SelectItem value="confirmed">Oui, avec grand plaisir !</SelectItem>
                                                                <SelectItem value="declined">Non, je ne pourrai pas être présent</SelectItem>
                                                            </SelectContent>
                                                        </Select>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                        </div>
                                        <Button type="submit" size="lg" className="w-full rounded-full" disabled={rsvpMutation.isPending}>
                                            {rsvpMutation.isPending ? "Envoi..." : "Je confirme ma présence"}
                                        </Button>
                                    </form>
                                </Form>
                            </Card>
                        </>
                    ) : (
                        <div className="text-center py-20">
                            <Check className="h-20 w-20 text-green-500 mx-auto mb-6" />
                            <h3 className="text-3xl font-serif font-bold mb-4">Merci !</h3>
                            <p className="text-muted-foreground mb-8">Nous avons bien reçu votre réponse.</p>
                            <Button variant="outline" onClick={() => setIsSubmitted(false)}>Ajouter une autre réponse</Button>
                        </div>
                    )}
                </div>
            </section>

            {/* Story Section */}
            <section className="py-24 px-6">
                <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                    <div className="relative p-4 bg-primary/10 rounded-lg">
                        <div className="aspect-[3/4] overflow-hidden rounded-md shadow-2xl">
                            <img
                                src={currentWedding.couplePhoto || FAKE_DATA.couplePhoto}
                                alt="Couple"
                                className="w-full h-full object-cover"
                            />
                        </div>
                    </div>
                    <div>
                        <h2 className="text-4xl font-serif font-light mb-8">NOTRE HISTOIRE</h2>
                        <div className="space-y-6 text-muted-foreground leading-relaxed">
                            <p>{currentWedding.story || FAKE_DATA.story}</p>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
}
