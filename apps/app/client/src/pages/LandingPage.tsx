import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import {
    Heart,
    Sparkles,
    Calendar,
    Gift,
    CheckCircle2,
    ArrowRight,
    ShieldCheck,
    Zap,
    Star,
    Globe,
    Users,
    MessageCircle,
    Layout,
    MousePointerClick,
    QrCode
} from "lucide-react";
import { motion } from "framer-motion";

const staggerContainer = {
    hidden: { opacity: 0 },
    show: {
        opacity: 1,
        transition: {
            staggerChildren: 0.1,
            delayChildren: 0.3,
        },
    },
};

const fadeInUp = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } },
};

export default function LandingPage() {
    return (
        <div className="min-h-screen bg-[#050505] text-white selection:bg-primary/30">
            {/* Premium Navbar */}
            <nav className="fixed top-0 w-full z-50 px-6 py-4">
                <div className="max-w-7xl mx-auto glass-morphism rounded-full px-6 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center shadow-[0_0_15px_rgba(200,169,106,0.5)]">
                            <Heart className="h-5 w-5 text-white fill-white" />
                        </div>
                        <span className="text-2xl font-serif font-bold tracking-tight">Libala</span>
                    </div>

                    <div className="hidden md:flex items-center gap-8 text-sm font-medium text-white/70">
                        <a href="#features" className="hover:text-primary transition-colors">Fonctionnalités</a>
                        <a href="#pricing" className="hover:text-primary transition-colors">Tarifs</a>
                        <a href="#faq" className="hover:text-primary transition-colors">FAQ</a>
                    </div>

                    <div className="flex items-center gap-4">
                        <Link href="/login" title="Connexion">
                            <Button variant="ghost" className="text-sm text-white/70 hover:text-white hover:bg-white/5">Connexion</Button>
                        </Link>
                        <Link href="/signup" title="Commencer">
                            <Button className="rounded-full px-6 h-10 bg-primary text-white hover:bg-primary/90 shadow-[0_0_20px_rgba(200,169,106,0.3)] border-none">
                                C'est parti
                            </Button>
                        </Link>
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-20">
                {/* Animated Background Elements */}
                <div className="absolute top-1/4 -left-20 w-72 h-72 bg-primary/20 rounded-full blur-[120px] animate-blob" />
                <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-primary/10 rounded-full blur-[150px] animate-blob animation-delay-500" />

                <div className="relative z-10 max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                    <motion.div
                        initial="hidden"
                        animate="show"
                        variants={staggerContainer}
                        className="space-y-8"
                    >
                        <motion.div variants={fadeInUp} className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass-morphism text-xs font-semibold tracking-wider uppercase text-primary border-primary/20">
                            <Sparkles className="h-3.5 w-3.5" />
                            L'excellence pour votre grand jour
                        </motion.div>

                        <motion.h1 variants={fadeInUp} className="text-6xl md:text-8xl font-serif font-bold leading-[1.1] tracking-tight">
                            Le plus beau jour mérite le <span className="text-gradient italic">meilleur site</span>.
                        </motion.h1>

                        <motion.p variants={fadeInUp} className="text-lg md:text-xl text-white/60 max-w-xl leading-relaxed">
                            Gérez vos invitations, collectez vos cadeaux et vivez l'instant présent avec vos invités. Une solution élégante, de l'annonce à la lune de miel.
                        </motion.p>

                        <motion.div variants={fadeInUp} className="flex flex-col sm:flex-row gap-4">
                            <Link href="/signup" title="Créer mon site">
                                <Button size="lg" className="rounded-full px-10 h-14 text-lg bg-primary hover:bg-primary/90 group border-none">
                                    Créer notre site gratuitement
                                    <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                                </Button>
                            </Link>
                            <Button size="lg" variant="outline" className="rounded-full px-10 h-14 text-lg glass-morphism border-white/10 hover:bg-white/5">
                                Voir les templates
                            </Button>
                        </motion.div>

                        <motion.div variants={fadeInUp} className="flex items-center gap-6 pt-4">
                            <div className="flex -space-x-3">
                                {[1, 2, 3, 4].map(i => (
                                    <div key={i} className="w-10 h-10 rounded-full border-2 border-[#050505] bg-muted/20" />
                                ))}
                            </div>
                            <div className="text-sm text-white/50">
                                <span className="font-bold text-white">500+ couples</span> nous font déjà confiance
                            </div>
                        </motion.div>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, rotateY: 10 }}
                        animate={{ opacity: 1, scale: 1, rotateY: 0 }}
                        transition={{ duration: 1, ease: "easeOut" }}
                        className="relative hidden lg:block"
                    >
                        <div className="relative z-10 glass-morphism rounded-3xl p-4 overflow-hidden shadow-2xl">
                            <img
                                src="https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&q=80"
                                alt="Wedding Template Mockup"
                                className="rounded-2xl w-full h-[600px] object-cover opacity-80"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-transparent to-transparent opacity-60" />

                            {/* Floating Cards Mockup Icons */}
                            <div className="absolute top-10 left-10 p-4 glass-morphism rounded-2xl animate-float">
                                <Users className="h-6 w-6 text-primary" />
                            </div>
                            <div className="absolute bottom-20 right-10 p-4 glass-morphism rounded-2xl animate-float delay-700">
                                <Heart className="h-6 w-6 text-primary fill-primary" />
                            </div>
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* Features Showcase */}
            <section id="features" className="py-32 px-6">
                <div className="max-w-7xl mx-auto space-y-24">
                    <div className="text-center space-y-4">
                        <h2 className="text-4xl md:text-5xl font-serif font-bold">Pour un mariage connecté</h2>
                        <p className="text-white/40 max-w-2xl mx-auto">Tout a été conçu pour simplifier votre organisation et éblouir vos invités.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                        {[
                            {
                                icon: <MousePointerClick className="h-10 w-10" />,
                                title: "RSVP Intelligent",
                                desc: "Suivi des présences et allergies en temps réel. Plus besoin de relancer."
                            },
                            {
                                icon: <QrCode className="h-10 w-10" />,
                                title: "QR Code Personnel",
                                desc: "Chaque invité reçoit son invitation PDF avec un QR Code unique pour le check-in."
                            },
                            {
                                icon: <Zap className="h-10 w-10" />,
                                title: "Cagnotte Live",
                                desc: "Affichez les contributions sur écran géant avec des animations élégantes."
                            },
                            {
                                icon: <Layout className="h-10 w-10" />,
                                title: "Templates Deluxe",
                                desc: "Choisissez parmi des designs exclusifs qui s'adaptent à tous les styles."
                            }
                        ].map((feature, i) => (
                            <motion.div
                                key={i}
                                whileHover={{ y: -10 }}
                                className="p-8 rounded-3xl glass-morphism transition-all hover-glow space-y-6"
                            >
                                <div className="p-3 w-fit rounded-2xl bg-primary/10 text-primary border border-primary/20">
                                    {feature.icon}
                                </div>
                                <h3 className="text-xl font-serif font-bold">{feature.title}</h3>
                                <p className="text-white/50 text-sm leading-relaxed">{feature.desc}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Pricing Section */}
            <section id="pricing" className="py-32 px-6 bg-gradient-to-b from-transparent via-white/[0.02] to-transparent">
                <div className="max-w-5xl mx-auto space-y-16">
                    <div className="text-center space-y-4 text-center">
                        <h2 className="text-4xl md:text-5xl font-serif font-bold italic">Choisissez votre formule</h2>
                        <p className="text-white/40">Zéro engagement. Annulez quand vous le voulez.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch">
                        {/* Free Tier */}
                        <div className="p-10 rounded-[2.5rem] glass-morphism border-white/5 space-y-8 flex flex-col justify-between">
                            <div className="space-y-6">
                                <div className="text-primary font-bold tracking-widest uppercase text-xs">Découverte</div>
                                <div className="flex items-baseline gap-1">
                                    <span className="text-5xl font-bold">0€</span>
                                </div>
                                <p className="text-white/50 text-sm">L'essentiel pour commencer sereinement.</p>
                                <ul className="space-y-4">
                                    {["1 Template classique", "Jusqu'à 50 invités", "RSVP Standard", "Support par email"].map((item, i) => (
                                        <li key={i} className="flex items-center gap-3 text-sm text-white/70">
                                            <CheckCircle2 className="h-4 w-4 text-primary" />
                                            {item}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                            <Button className="w-full rounded-full h-12 glass-morphism hover:bg-white/10 border-white/10">Commencer</Button>
                        </div>

                        {/* Premium Tier */}
                        <div className="p-10 rounded-[2.5rem] bg-primary relative overflow-hidden space-y-8 flex flex-col justify-between shadow-[0_20px_60px_-15px_rgba(200,169,106,0.2)]">
                            <div className="absolute top-4 right-6 px-3 py-1 bg-white/20 rounded-full text-[10px] font-bold uppercase tracking-tighter text-white">Recommandé</div>
                            <div className="space-y-6">
                                <div className="text-white/80 font-bold tracking-widest uppercase text-xs">Premium (Gold)</div>
                                <div className="flex items-baseline gap-1">
                                    <span className="text-5xl font-bold">29€</span>
                                </div>
                                <p className="text-white/90 text-sm">Tout pour un mariage d'exception et sans limite.</p>
                                <ul className="space-y-4">
                                    {["Templates Deluxe illimités", "Invités illimités", "Cagnotte & Liste de cadeaux", "Live Contributions", "Support prioritaire 7j/7"].map((item, i) => (
                                        <li key={i} className="flex items-center gap-3 text-sm text-white">
                                            <CheckCircle2 className="h-4 w-4 text-white" />
                                            {item}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                            <Link href="/signup" title="Passer au Premium">
                                <Button className="w-full rounded-full h-12 bg-white text-primary hover:bg-white/90 font-bold border-none">
                                    Choisir l'excellence
                                </Button>
                            </Link>
                        </div>
                    </div>
                </div>
            </section>

            {/* FAQ Section */}
            <section id="faq" className="py-32 px-6">
                <div className="max-w-4xl mx-auto space-y-16">
                    <h2 className="text-4xl font-serif font-bold text-center">Questions fréquentes</h2>
                    <div className="space-y-6">
                        {[
                            { q: "Est-ce vraiment gratuit au début ?", a: "Oui, vous pouvez créer votre site et gérer vos 50 premiers invités sans sortir votre carte bleue." },
                            { q: "Puis-je changer de template après avoir commencé ?", a: "Absolument. Votre contenu s'adapte automatiquement au nouveau style choisi." },
                            { q: "Comment fonctionne la cagnotte ?", a: "Nous utilisons Stripe, le leader mondial du paiement sécurisé. L'argent arrive directement sur votre compte bancaire." },
                            { q: "Mes données sont-elles sécurisées ?", a: "Oui, nous utilisons un cryptage de grade bancaire et vos listes d'invités restent strictement privées." }
                        ].map((faq, i) => (
                            <div key={i} className="p-8 rounded-3xl glass-morphism border-white/5 space-y-3">
                                <h4 className="font-serif font-bold text-xl">{faq.q}</h4>
                                <p className="text-white/50 text-sm leading-relaxed">{faq.a}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Final CTA */}
            <section className="py-40 px-6 text-center relative overflow-hidden">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-primary/5 blur-[200px] pointer-events-none" />
                <div className="max-w-4xl mx-auto space-y-12 relative z-10">
                    <h2 className="text-6xl md:text-8xl font-serif font-bold italic text-gradient leading-tight">Prêt à dire Oui ?</h2>
                    <p className="text-xl text-white/50 max-w-xl mx-auto leading-relaxed">
                        Rejoignez les centaines de couples qui utilisent Libala pour rendre leur mariage inoubliable.
                    </p>
                    <div className="pt-8">
                        <Link href="/signup" title="Créer mon site">
                            <Button size="lg" className="rounded-full px-16 h-16 text-xl bg-primary hover:shadow-[0_0_30px_rgba(200,169,106,0.4)] transition-all border-none">
                                C'est parti, c'est gratuit
                            </Button>
                        </Link>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="py-12 border-t border-white/5 px-6">
                <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-12">
                    <div className="flex items-center gap-2">
                        <div className="w-6 h-6 bg-primary rounded-md flex items-center justify-center">
                            <Heart className="h-4 w-4 text-white fill-white" />
                        </div>
                        <span className="text-xl font-serif font-bold tracking-tight">Libala</span>
                    </div>
                    <div className="text-white/30 text-xs font-sans">
                        © 2026 Libala. L'amour, version 2.0.
                    </div>
                    <div className="flex gap-8 text-white/40 text-xs uppercase tracking-widest font-semibold font-sans">
                        <a href="#" className="hover:text-primary transition-colors">Contact</a>
                        <a href="#" className="hover:text-primary transition-colors">Confidentialité</a>
                        <a href="#" className="hover:text-primary transition-colors">CGV</a>
                    </div>
                </div>
            </footer>
        </div>
    );
}
