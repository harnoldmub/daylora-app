import { Button } from "@/components/ui/button";
import {
  Heart,
  Sparkles,
  Calendar,
  Gift,
  CheckCircle2,
  ArrowRight,
  Users,
  MessageCircle,
  Layout,
  MousePointerClick,
  QrCode,
  Play,
  ShieldCheck,
  Wand2,
  Crown,
  PartyPopper,
  Layers,
  Rocket,
} from "lucide-react";
import { motion } from "framer-motion";
import { useEffect, useMemo, useRef, useState } from "react";

const APP_BASE_URL = import.meta.env.VITE_APP_BASE_URL || "http://localhost:5174";

const fadeUp = {
  hidden: { opacity: 0, y: 18 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } },
};

const SCENES = [
  {
    kicker: "Création express",
    title: "Créez votre site en quelques minutes",
    desc: "Un wizard guidé qui génère un site complet dès la fin de l’onboarding.",
    image: "/cinematic/scene_creation_express_v2_png_1770982391605.png",
    icon: <Wand2 className="h-5 w-5" />,
  },
  {
    kicker: "RSVP intelligent",
    title: "Gérez vos invités facilement",
    desc: "Tableaux, filtres, confirmations et exports pour un suivi clair en temps réel.",
    image: "/cinematic/scene_rsvp_intelligent_v2_png_1770982414436.png",
    icon: <Users className="h-5 w-5" />,
  },
  {
    kicker: "Invitations",
    title: "Invitations personnalisées & QR code",
    desc: "PDF élégants, QR code sécurisé et invitations mobiles prêtes à partager.",
    image: "/cinematic/scene_invitation_mobile_png_1770982438404.png",
    icon: <QrCode className="h-5 w-5" />,
  },
  {
    kicker: "Paiements",
    title: "Cagnotte sécurisée",
    desc: "Stripe intégré, messages des invités et montants en direct.",
    image: "/cinematic/scene_payments_secure_png_1770982456771.png",
    icon: <Gift className="h-5 w-5" />,
  },
  {
    kicker: "Live",
    title: "Contributions live & animations",
    desc: "Notifications en temps réel, confettis et messages qui apparaissent comme une scène.",
    image: "/cinematic/scene_live_experience_v2_png_1770982504994.png",
    icon: <PartyPopper className="h-5 w-5" />,
  },
  {
    kicker: "Cadeaux",
    title: "Liste de cadeaux moderne",
    desc: "Catalogue élégant, réservations et suivi clair dans l’admin.",
    image: "/cinematic/scene_gift_registry_v2_png_1770982539304.png",
    icon: <Gift className="h-5 w-5" />,
  },
  {
    kicker: "Design",
    title: "Trois templates élégants",
    desc: "Chaque template est personnalisable et harmonisé sur toutes les pages publiques.",
    image: "/cinematic/scene_templates_design_v2_png_1770982570312.png",
    icon: <Layout className="h-5 w-5" />,
  },
  {
    kicker: "Publication",
    title: "Publiez en un clic",
    desc: "Votre site est prêt : lien public, lien admin et prévisualisation immédiate.",
    image: "/cinematic/scene_publication_success_v2_png_1770982589944.png",
    icon: <Rocket className="h-5 w-5" />,
  },
];

const JOURNEY_STEPS = [
  {
    title: "Création du compte",
    desc: "Email, mot de passe, vérification rapide. Simple et immédiat.",
  },
  {
    title: "Wizard rapide",
    desc: "4–5 écrans maximum avec progression visible et données par défaut.",
  },
  {
    title: "Modules",
    desc: "Activez la cagnotte, la liste cadeaux, le live ou les blagues en un clic.",
  },
  {
    title: "Offre",
    desc: "Choisissez la version gratuite ou Premium, sans pression.",
  },
  {
    title: "Site prêt",
    desc: "Lien public, lien admin et email automatique envoyé.",
  },
];

export default function LandingPage() {
  const [activeScene, setActiveScene] = useState(0);
  const sceneRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const index = Number(entry.target.getAttribute("data-index"));
            if (!Number.isNaN(index)) setActiveScene(index);
          }
        });
      },
      { rootMargin: "-30% 0px -30% 0px", threshold: 0.3 }
    );

    sceneRefs.current.forEach((el) => el && observer.observe(el));
    return () => observer.disconnect();
  }, []);

  const activeImage = useMemo(() => SCENES[activeScene]?.image, [activeScene]);

  return (
    <div className="min-h-screen bg-[#F6F1EA] text-[#2b2320] selection:bg-primary/20">
      <nav className="fixed top-0 w-full z-50 px-6 py-4">
        <div className="max-w-7xl mx-auto rounded-full px-6 py-3 flex items-center justify-between bg-white/70 backdrop-blur border border-[#E9DFD2]">
          <div className="flex items-center gap-3 group cursor-pointer">
            <div className="w-12 h-12 bg-gradient-to-br from-primary to-[#8C7A6B] rounded-2xl flex items-center justify-center shadow-[0_8px_30px_rgba(200,169,106,0.5)] transition-all group-hover:scale-110 group-hover:rotate-3">
              <Heart className="h-7 w-7 text-white fill-white" />
            </div>
            <div className="flex flex-col -space-y-1">
              <span className="text-2xl font-serif font-black tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-[#2b2320] via-primary to-[#7A6B5E]">Nocely</span>
              <span className="text-[8px] font-black uppercase tracking-[0.4em] text-primary/60 ml-0.5">Wedding platform</span>
            </div>
          </div>

          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-[#7A6B5E]">
            <a href="#cinema" className="hover:text-primary transition-colors">Expérience</a>
            <a href="#journey" className="hover:text-primary transition-colors">Parcours</a>
            <a href="#pricing" className="hover:text-primary transition-colors">Tarifs</a>
            <a href="#faq" className="hover:text-primary transition-colors">FAQ</a>
          </div>

          <div className="flex items-center gap-6">
            <a href={`${APP_BASE_URL}/app/login`} title="Connexion">
              <Button variant="ghost" className="text-xs font-bold uppercase tracking-widest text-[#7A6B5E] hover:text-[#2b2320] transition-colors">Connexion</Button>
            </a>
            <a href={`${APP_BASE_URL}/app/signup`} title="Créer mon site">
              <Button className="rounded-full px-8 h-12 bg-[#2b2320] text-white hover:bg-black transition-all shadow-xl shadow-black/10 hover:-translate-y-0.5 border-none">
                Créer mon site
              </Button>
            </a>
          </div>
        </div>
      </nav>

      <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-24">
        <div className="absolute inset-0">
          <video
            className="w-full h-full object-cover"
            autoPlay
            loop
            muted
            playsInline
            poster="/cinematic/hero_poster.png"
          >
            <source src="https://videos.pexels.com/video-files/3015488/3015488-uhd_3840_2160_30fps.mp4" type="video/mp4" />
          </video>
          {/* Dark overlay for better text contrast */}
          <div className="absolute inset-0 bg-black/40" />
          <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-[#F6F1EA]" />
          <div className="absolute inset-x-0 bottom-0 h-64 bg-gradient-to-t from-[#F6F1EA] via-[#F6F1EA]/80 to-transparent" />
        </div>

        <motion.div
          initial="hidden"
          animate="show"
          variants={{ hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.15 } } }}
          className="relative z-10 max-w-6xl mx-auto px-6 text-center space-y-8"
        >
          <motion.div variants={fadeUp} className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-white/10 backdrop-blur-md text-xs font-bold tracking-[0.2em] uppercase text-white border border-white/20 shadow-xl">
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            L'excellence du mariage
          </motion.div>

          <div className="space-y-4">
            <motion.h1
              variants={fadeUp}
              className="text-7xl md:text-[10rem] font-serif font-extrabold leading-[0.85] tracking-tighter text-white drop-shadow-[0_10px_30px_rgba(0,0,0,0.5)]"
            >
              Nocely
            </motion.h1>

            <motion.p
              variants={fadeUp}
              className="text-2xl md:text-4xl text-white/95 max-w-4xl mx-auto leading-tight font-serif italic drop-shadow-lg"
            >
              La nouvelle génération de sites de mariage
            </motion.p>
          </div>

          <motion.div
            variants={fadeUp}
            className="flex flex-col gap-4 py-4"
          >
            <p className="text-lg md:text-xl text-white/90 max-w-2xl mx-auto leading-relaxed font-medium drop-shadow-md">
              Créez une expérience mémorable pour vos invités.
            </p>
            <p className="text-sm md:text-base text-white/70 max-w-xl mx-auto leading-relaxed tracking-wider uppercase font-semibold">
              Beautiful weddings, effortlessly online.
            </p>
          </motion.div>

          <motion.div variants={fadeUp} className="flex flex-col sm:flex-row gap-6 justify-center pt-4">
            <a href={`${APP_BASE_URL}/app/signup`} title="Créer mon site">
              <Button size="lg" className="rounded-full px-12 h-16 text-xl bg-primary hover:bg-primary/90 group border-none shadow-[0_15px_35px_rgba(200,169,106,0.4)] transition-all hover:-translate-y-1">
                Commencer
                <ArrowRight className="ml-3 h-6 w-6 group-hover:translate-x-1 transition-transform" />
              </Button>
            </a>
            <Button asChild size="lg" variant="outline" className="rounded-full px-12 h-16 text-xl border-white/20 bg-white/5 backdrop-blur-md text-white hover:bg-white/20 shadow-xl transition-all hover:-translate-y-1">
              <a href="#cinema">
                <Play className="mr-3 h-5 w-5 fill-white" />
                Voir la démo
              </a>
            </Button>
          </motion.div>

          <motion.div variants={fadeUp} className="flex items-center justify-center gap-6 pt-2 text-white/70 text-sm">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4" />
              Paiements sécurisés
            </div>
            <div className="flex items-center gap-2">
              <MousePointerClick className="h-4 w-4" />
              Site prêt en 3 minutes
            </div>
            <div className="flex items-center gap-2">
              <MessageCircle className="h-4 w-4" />
              Live en temps réel
            </div>
          </motion.div>
        </motion.div>
      </section>

      <section id="cinema" className="py-28 px-6">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-[0.9fr_1.1fr] gap-14 items-start">
          <div className="sticky top-28 space-y-6">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/80 text-xs font-semibold tracking-wider uppercase text-primary border border-[#E9DFD2]">
              <Sparkles className="h-3.5 w-3.5" />
              Expérience cinématique
            </div>
            <h2 className="text-4xl md:text-5xl font-serif font-bold">Chaque fonctionnalité est une scène.</h2>
            <p className="text-[#7A6B5E]">Faites défiler pour voir le produit comme un mini‑film : animations, visuels immersifs et transitions élégantes.</p>
            <div className="rounded-[2rem] overflow-hidden shadow-2xl border border-[#E9DFD2] bg-white relative group">
              <motion.img
                key={activeImage}
                src={activeImage}
                alt="Aperçu Nocely"
                className="w-full h-[520px] object-cover transition-all duration-700 group-hover:scale-105"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, ease: "easeOut" }}
              />
              <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-60" />
              <div className="absolute inset-0 pointer-events-none border-[12px] border-white/10 rounded-[2rem]" />

              <div className="absolute bottom-8 left-8 right-8 z-10 flex items-center justify-between text-white drop-shadow-lg">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-full bg-white/20 backdrop-blur-md border border-white/30">
                    {SCENES[activeScene]?.icon}
                  </div>
                  <span className="text-sm font-semibold uppercase tracking-widest">{SCENES[activeScene]?.kicker}</span>
                </div>
                <div className="flex gap-1.5">
                  {SCENES.map((_, i) => (
                    <div key={i} className={`h-1 rounded-full transition-all duration-300 ${activeScene === i ? "w-6 bg-white" : "w-2 bg-white/30"}`} />
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-8">
            {SCENES.map((scene, index) => (
              <motion.div
                key={scene.title}
                data-index={index}
                ref={(el) => (sceneRefs.current[index] = el)}
                className={`min-h-[50vh] p-10 rounded-[2.5rem] border transition-all duration-500 relative overflow-hidden group/card ${activeScene === index
                  ? "bg-white shadow-[0_22px_70px_-15px_rgba(200,169,106,0.18)] border-primary/20 scale-[1.02]"
                  : "bg-white/40 border-[#E9DFD2] opacity-60 hover:opacity-100"
                  }`}
                initial="hidden"
                whileInView="show"
                viewport={{ once: true, amount: 0.3 }}
                variants={fadeUp}
              >
                <div className={`absolute top-0 left-0 w-1.5 h-full bg-primary transition-transform duration-500 ${activeScene === index ? "scale-y-100" : "scale-y-0"}`} />

                <div className="flex items-center gap-4 text-xs font-bold uppercase tracking-[0.2em] text-primary">
                  <span className={`p-3 rounded-2xl transition-all duration-300 ${activeScene === index ? "bg-primary text-white shadow-lg" : "bg-primary/5 text-primary border border-primary/10"}`}>
                    {scene.icon}
                  </span>
                  <span className="opacity-80">{scene.kicker}</span>
                </div>

                <h3 className="text-3xl md:text-4xl font-serif font-bold mt-8 leading-tight">{scene.title}</h3>
                <p className="text-[#7A6B5E] mt-5 max-w-xl text-lg leading-relaxed">{scene.desc}</p>

                <div className="mt-8 flex items-center gap-2 text-primary font-semibold text-sm group/btn cursor-pointer">
                  En savoir plus
                  <ArrowRight className="h-4 w-4 transition-transform group-hover/btn:translate-x-1" />
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section id="rsvp" className="py-32 px-6 bg-white relative overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-primary/5 blur-[120px] rounded-full opacity-50" />

        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-20 items-center relative z-10">
          <div className="space-y-8">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-[10px] font-black tracking-[0.2em] uppercase text-primary border border-primary/20">
              <CheckCircle2 className="h-3.5 w-3.5" />
              RSVP intelligent
            </div>
            <h2 className="text-5xl md:text-7xl font-serif font-bold leading-[1.1]">Confirmez en un éclat.</h2>
            <p className="text-[#7A6B5E] text-xl leading-relaxed max-w-lg">
              Une interface fluide pour vos invités, une gestion simplifiée pour vous. Fini les tableaux Excel interminables.
            </p>

            <div className="space-y-6 pt-4">
              {[
                { title: "Statuts en direct", desc: "Suivez qui vient, qui décline et qui hésite en temps réel." },
                { title: "QR Codes uniques", desc: "Chaque invité reçoit son pass numérique personnalisé." },
                { title: "Filtres avancés", desc: "Triez par table, par famille ou par régime alimentaire." }
              ].map((item, i) => (
                <div key={i} className="flex gap-4">
                  <div className="mt-1 w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center border border-primary/30">
                    <div className="w-2 h-2 rounded-full bg-primary" />
                  </div>
                  <div>
                    <h4 className="font-bold text-[#2b2320]">{item.title}</h4>
                    <p className="text-[#7A6B5E] text-sm">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="p-1 px-1 rounded-[3rem] bg-gradient-to-br from-[#E9DFD2] via-white to-[#E9DFD2] shadow-2xl"
          >
            <div className="bg-white rounded-[2.9rem] p-10 md:p-14 space-y-10 border border-white shadow-inner">
              <div className="text-center space-y-2">
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-primary/60">Bienvenue</p>
                <h3 className="text-4xl font-serif font-bold tracking-tight">Marie & Thomas</h3>
                <p className="text-[#7A6B5E] italic">21 Juin 2026</p>
              </div>

              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-[#7A6B5E]">Votre nom</label>
                  <div className="h-14 w-full rounded-2xl bg-[#F6F1EA] border border-[#E9DFD2] flex items-center px-6 text-[#2b2320] font-medium opacity-60">
                    Famille Lawson
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 rounded-2xl bg-primary text-white text-center font-bold shadow-lg shadow-primary/20 cursor-pointer">
                    Je serai présent
                  </div>
                  <div className="p-4 rounded-2xl bg-white border border-[#E9DFD2] text-[#7A6B5E] text-center font-bold cursor-pointer hover:bg-[#F6F1EA] transition-colors">
                    Je ne pourrai pas
                  </div>
                </div>

                <div className="p-6 rounded-2xl border-2 border-dashed border-[#E9DFD2] text-center space-y-3 bg-[#F6F1EA]/50">
                  <Users className="h-6 w-6 mx-auto text-primary/40" />
                  <p className="text-xs font-medium text-[#7A6B5E]">Nombre de personnes : <span className="text-primary font-bold">4</span></p>
                </div>
              </div>

              <Button className="w-full h-16 rounded-2xl bg-[#2b2320] text-white hover:bg-black text-lg font-bold transition-all shadow-xl shadow-black/10">
                Confirmer ma présence
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      <section id="journey" className="py-28 px-6 bg-gradient-to-b from-transparent via-[#F1E7DB] to-transparent">
        <div className="max-w-6xl mx-auto space-y-12">
          <div className="text-center space-y-4">
            <h2 className="text-4xl md:text-5xl font-serif font-bold">Le parcours idéal</h2>
            <p className="text-[#7A6B5E]">Un wizard court, intuitif et rassurant. L’utilisateur ne part jamais dans le vide.</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.1fr] gap-10">
            <div className="space-y-6">
              {JOURNEY_STEPS.map((step, index) => (
                <div key={step.title} className="p-6 rounded-3xl bg-white/80 border border-[#E9DFD2] shadow-sm">
                  <div className="text-xs uppercase tracking-widest text-primary">Étape {index + 1}</div>
                  <h3 className="text-2xl font-serif font-bold mt-2">{step.title}</h3>
                  <p className="text-[#7A6B5E] mt-2">{step.desc}</p>
                </div>
              ))}
            </div>

            <div className="p-8 rounded-[2.5rem] bg-white/80 border border-[#E9DFD2] shadow-sm space-y-6">
              <div className="flex items-center justify-between text-sm font-semibold">
                <span>Wizard rapide</span>
                <span className="text-primary">5 étapes</span>
              </div>
              <div className="h-2 rounded-full bg-[#E9DFD2] overflow-hidden">
                <div className="h-full w-4/5 bg-primary rounded-full" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm text-[#5D5147]">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-primary" />
                  Noms + dates
                </div>
                <div className="flex items-center gap-2">
                  <Layout className="h-4 w-4 text-primary" />
                  Choix du template
                </div>
                <div className="flex items-center gap-2">
                  <Gift className="h-4 w-4 text-primary" />
                  Modules activables
                </div>
                <div className="flex items-center gap-2">
                  <Crown className="h-4 w-4 text-primary" />
                  Offre claire
                </div>
                <div className="flex items-center gap-2">
                  <Rocket className="h-4 w-4 text-primary" />
                  Site prêt
                </div>
              </div>
              <div className="rounded-2xl border border-primary/20 bg-primary/5 p-6">
                <div className="flex items-center gap-3 text-primary font-semibold">
                  <PartyPopper className="h-5 w-5" />
                  Votre site est prêt !
                </div>
                <p className="text-sm text-[#6B5B4F] mt-2">Lien public, lien admin et bouton “Publier” inclus.</p>
              </div>
              <div className="flex flex-col sm:flex-row gap-3">
                <Button variant="outline" className="flex-1">Prévisualiser</Button>
                <Button className="flex-1 bg-primary text-white">Publier</Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="pricing" className="py-28 px-6">
        <div className="max-w-5xl mx-auto space-y-12">
          <div className="text-center space-y-4">
            <h2 className="text-4xl md:text-5xl font-serif font-bold italic">Des formules claires</h2>
            <p className="text-[#7A6B5E]">Simple, transparent, sans surprise.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="p-10 rounded-[2.5rem] bg-white/80 border border-[#E9DFD2] space-y-8 flex flex-col justify-between shadow-sm">
              <div className="space-y-6">
                <div className="text-primary font-bold tracking-widest uppercase text-xs">Free</div>
                <div className="flex items-baseline gap-1">
                  <span className="text-5xl font-bold">0€</span>
                </div>
                <p className="text-[#7A6B5E] text-sm">Pour tester rapidement et publier votre première version.</p>
                <ul className="space-y-4">
                  {[
                    "1 template",
                    "Jusqu'à 50 invités",
                    "Cagnotte activée",
                    "Branding Nocely visible",
                    "Sans liste cadeaux",
                    "Sans live contributions avancé",
                  ].map((item, i) => (
                    <li key={i} className="flex items-center gap-3 text-sm text-[#6B5B4F]">
                      <CheckCircle2 className="h-4 w-4 text-primary" />
                      {item}
                    </li>
                  ))}
                </ul>
                <a href={`${APP_BASE_URL}/app/signup`} className="w-full">
                  <Button className="w-full rounded-full h-12 bg-white text-primary font-bold hover:bg-[#F3EBE1] border border-[#E6DCCF]">
                    Démarrer gratuitement
                  </Button>
                </a>
              </div>
            </div>

            <div className="p-10 rounded-[2.5rem] bg-primary relative overflow-hidden space-y-8 flex flex-col justify-between shadow-[0_20px_60px_-15px_rgba(200,169,106,0.2)] hover:-translate-y-1 transition-transform">
              <div className="absolute top-4 right-6 px-3 py-1 bg-white/20 rounded-full text-[10px] font-bold uppercase tracking-tighter text-white">Best seller</div>
              <div className="space-y-6">
                <div className="text-white/80 font-bold tracking-widest uppercase text-xs">Premium</div>
                <div className="flex items-baseline gap-1">
                  <span className="text-5xl font-bold text-white">19€</span>
                  <span className="text-white/80 text-sm">/mois</span>
                </div>
                <p className="text-white/90 text-sm">Best seller. Minimum 2 mois, puis flexible.</p>
                <ul className="space-y-4">
                  {[
                    "2 templates premium",
                    "Invités illimités",
                    "Liste cadeaux",
                    "Live contributions + animations",
                    "Blagues live",
                    "Suppression branding Nocely",
                    "Export complet",
                    "Emails illimités",
                  ].map((item, i) => (
                    <li key={i} className="flex items-center gap-3 text-sm text-white">
                      <CheckCircle2 className="h-4 w-4 text-white" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
              <a href={`${APP_BASE_URL}/app/signup`} title="Passer au Premium">
                <Button className="w-full rounded-full h-12 bg-white text-primary hover:bg-white/90 font-bold border-none">
                  Choisir Premium
                </Button>
              </a>
            </div>
          </div>
          <p className="text-center text-sm text-[#8C7A6B]">
            FR/EN ready. Conçu pour une expérience premium et internationale.
          </p>
        </div>
      </section>

      <section id="faq" className="py-28 px-6">
        <div className="max-w-4xl mx-auto space-y-12">
          <h2 className="text-4xl font-serif font-bold text-center">FAQ</h2>
          <div className="space-y-6">
            {[
              { q: "Puis-je modifier mon design après création ? / Can I edit the design later?", a: "Oui, à tout moment. Couleurs, typographie, textes, boutons et images sont éditables." },
              { q: "Les invités ont-ils besoin d'un compte ? / Do guests need an account?", a: "Non. Le site public est accessible sans connexion." },
              { q: "Comment fonctionne la cagnotte ? / How does payment work?", a: "Paiement sécurisé et suivi en direct des contributions." },
              { q: "Puis-je exporter mes invités ? / Can I export my guests?", a: "Oui, export complet disponible dans le backoffice." },
            ].map((faq, i) => (
              <div key={i} className="p-8 rounded-3xl bg-white/70 border border-[#E9DFD2] space-y-3">
                <h4 className="font-serif font-bold text-xl">{faq.q}</h4>
                <p className="text-[#7A6B5E] text-sm leading-relaxed">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-32 px-6 text-center relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-primary/10 blur-[200px] pointer-events-none" />
        <div className="max-w-4xl mx-auto space-y-10 relative z-10">
          <h2 className="text-6xl md:text-7xl font-serif font-bold italic text-gradient leading-tight">Votre site est prêt en 3 minutes</h2>
          <p className="text-xl text-[#7A6B5E] max-w-xl mx-auto leading-relaxed">
            Créez votre projet, choisissez un style et publiez votre site sans effort.
          </p>
          <div className="pt-4">
            <a href={`${APP_BASE_URL}/app/signup`} title="Créer mon site">
              <Button size="lg" className="rounded-full px-16 h-16 text-xl bg-primary hover:shadow-[0_12px_30px_rgba(196,165,117,0.45)] transition-all border-none">
                Créer mon site / Create my site
              </Button>
            </a>
          </div>
        </div>
      </section>

      <footer className="py-12 border-t border-[#E6DCCF] px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-12">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-primary rounded-md flex items-center justify-center">
              <Heart className="h-4 w-4 text-white fill-white" />
            </div>
            <span className="text-xl font-serif font-bold tracking-tight">Nocely</span>
          </div>
          <div className="text-[#B6A796] text-xs font-sans">
            © 2026 Nocely. La nouvelle génération de sites de mariage.
          </div>
          <div className="flex gap-8 text-[#8C7A6B] text-xs uppercase tracking-widest font-semibold font-sans">
            <a href="#" className="hover:text-primary transition-colors">Contact</a>
            <a href="#" className="hover:text-primary transition-colors">Confidentialité</a>
            <a href="#" className="hover:text-primary transition-colors">CGV</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
