import React, { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useLocation, Link } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
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
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { COLOR_TONES } from "@/lib/design-presets";
import {
  ArrowRight,
  Calendar,
  Check,
  Gift,
  Heart,
  Layout,
  MessageCircle,
  Sparkles,
  Wallet,
  Zap,
  Camera,
  Image as ImageIcon,
  Upload,
  Plus,
  X,
  Eye,
  EyeOff,
  ExternalLink,
  Lock,
  Mail,
  User,
  Star,
} from "lucide-react";
import { compressImageFileToJpegDataUrl } from "@/lib/image";

const TEMPLATES = [
  { id: "classic", name: "Classique", description: "Élégant et intemporel", image: "/previews/template_classic_preview_v2.png", premium: false },
  { id: "modern", name: "Moderne", description: "Épuré et minimaliste", image: "/previews/template_modern_preview_v2.png", premium: true },
  { id: "minimal", name: "Minimal", description: "Audacieux et chic", image: "/previews/template_minimal_preview_v2.png", premium: true },
];

const MAX_ONBOARDING_GALLERY_IMAGES = 6;

const onboardingSchema = z.object({
  title: z.string().min(3, "Le titre de votre mariage doit contenir au moins 3 caractères (ex : Marie & Pierre)."),
  slug: z
    .string()
    .min(3, "L'adresse de votre site doit contenir au moins 3 caractères.")
    .regex(/^[a-z0-9-]+$/, "L'adresse ne peut contenir que des lettres minuscules, des chiffres et des tirets."),
  weddingDate: z.string().min(1, "Veuillez indiquer la date de votre mariage."),
  templateId: z.string().default("classic"),
  storyBody: z.string().optional(),
  email: z.string().email("Veuillez saisir une adresse email valide."),
  password: z.string().min(8, "Le mot de passe doit contenir au moins 8 caractères."),
  firstName: z.string().min(1, "Veuillez renseigner votre prénom."),
});

type OnboardingForm = z.infer<typeof onboardingSchema>;

type ModulesState = {
  cagnotteEnabled: boolean;
  giftsEnabled: boolean;
  jokesEnabled: boolean;
  liveEnabled: boolean;
};

const TOTAL_STEPS = 7;
const stepLabels = ["Mariage", "Style", "Photos", "Galerie", "Formule", "Aperçu", "Compte"];

export default function Onboarding() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [plan, setPlan] = useState<"free" | "premium" | "lifetime">("free");
  const [toneId, setToneId] = useState<string>(COLOR_TONES[0].id);
  const [modules, setModules] = useState<ModulesState>({
    cagnotteEnabled: true,
    giftsEnabled: true,
    jokesEnabled: true,
    liveEnabled: true,
  });
  const [paymentMode, setPaymentMode] = useState<"external">("external");
  const [externalCagnotteUrl, setExternalCagnotteUrl] = useState("");
  const [externalProvider, setExternalProvider] = useState("other");
  const [heroImage, setHeroImage] = useState<string>("");
  const [couplePhoto, setCouplePhoto] = useState<string>("");
  const [galleryImages, setGalleryImages] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [referralCode, setReferralCode] = useState("");

  const form = useForm<OnboardingForm>({
    resolver: zodResolver(onboardingSchema),
    defaultValues: {
      title: "",
      slug: "",
      weddingDate: "",
      templateId: "classic",
      storyBody: "",
      email: "",
      password: "",
      firstName: "",
    },
  });

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>, target: 'hero' | 'couple') => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    try {
      const compressed = await compressImageFileToJpegDataUrl(file, {
        maxSize: 1200,
        quality: 0.82,
        maxDataUrlLength: 3_000_000,
      });
      if (target === 'hero') setHeroImage(compressed);
      else setCouplePhoto(compressed);
    } catch (err) {
      toast({ title: "Image trop volumineuse", description: "L'image sélectionnée est trop lourde. Essayez une photo de moins de 5 Mo.", variant: "destructive" });
    } finally {
      setIsUploading(false);
    }
  };

  const handleGalleryUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setIsUploading(true);
    const remaining = MAX_ONBOARDING_GALLERY_IMAGES - galleryImages.length;
    const batch = Array.from(files).slice(0, remaining);

    try {
      const next = [...galleryImages];
      for (const file of batch) {
        const compressed = await compressImageFileToJpegDataUrl(file, {
          maxSize: 1000,
          quality: 0.8,
          maxDataUrlLength: 1_200_000,
        });
        next.push(compressed);
      }
      setGalleryImages(next);
    } catch (err) {
      toast({ title: "Images trop volumineuses", description: "Une ou plusieurs images sont trop lourdes. Essayez des photos de moins de 5 Mo chacune.", variant: "destructive" });
    } finally {
      setIsUploading(false);
    }
  };

  const title = form.watch("title");
  useEffect(() => {
    if (!title) return;
    const generatedSlug = title
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "");

    form.setValue("slug", generatedSlug, { shouldValidate: true });
  }, [title, form]);

  const progress = useMemo(() => (step / TOTAL_STEPS) * 100, [step]);

  const goNext = async () => {
    if (step === 1) {
      const valid = await form.trigger(["title", "slug", "weddingDate", "firstName"]);
      if (!valid) return;
    }
    if (step === 5 && modules.cagnotteEnabled && !externalCagnotteUrl.trim()) {
      toast({ title: "Lien de cagnotte manquant", description: "Veuillez ajouter l'URL de votre cagnotte externe.", variant: "destructive" });
      return;
    }
    if (step === 7) {
      const valid = await form.trigger(["email", "password"]);
      if (!valid) return;
    }
    setStep((s) => Math.min(TOTAL_STEPS, s + 1));
  };

  const goBack = () => setStep((s) => Math.max(1, s - 1));

  const selectedTemplate = TEMPLATES.find(t => t.id === form.watch("templateId")) || TEMPLATES[0];
  const requiresPremiumTemplate = selectedTemplate.premium;
  const selectedTone = COLOR_TONES.find(t => t.id === toneId) || COLOR_TONES[0];

  const onSubmit = async (data: OnboardingForm) => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/auth/signup-with-wedding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          email: data.email,
          password: data.password,
          firstName: data.firstName,
          title: data.title,
          slug: data.slug,
          weddingDate: data.weddingDate,
          templateId: data.templateId,
          storyBody: data.storyBody,
          toneId,
          features: {
            cagnotteEnabled: modules.cagnotteEnabled,
            giftsEnabled: modules.giftsEnabled,
            jokesEnabled: modules.jokesEnabled,
            liveEnabled: modules.liveEnabled,
          },
          paymentMode,
          externalCagnotteUrl: externalCagnotteUrl.trim(),
          externalProvider,
          heroImage,
          couplePhoto,
          galleryImages,
          plan,
          referralCode: referralCode.trim() || undefined,
        }),
      });

      if (!response.ok) {
        const body = await response.json().catch(() => ({ message: "Une erreur inattendue est survenue." }));
        throw new Error(body.message || "Impossible de créer votre site. Veuillez réessayer.");
      }

      const result = await response.json();

      if (result?.debugVerifyToken) {
        await fetch(`/api/auth/verify-email?token=${encodeURIComponent(result.debugVerifyToken)}`, {
          credentials: "include",
        });
      }

      setLocation(`/login?email=${encodeURIComponent(data.email)}&created=1`);
    } catch (error: any) {
      setIsLoading(false);
      const msg = error?.message || "";
      let description = "Impossible de créer votre site pour le moment. Veuillez réessayer.";
      if (msg.includes("existe déjà") || msg.includes("already") || msg.includes("déjà utilisé")) {
        description = "Un compte existe déjà avec cette adresse email. Connectez-vous ou utilisez une autre adresse.";
      } else if (msg.includes("slug") || msg.includes("URL")) {
        description = "Cette adresse de site est déjà prise. Choisissez une autre URL.";
      } else if (msg) {
        description = msg;
      }
      toast({
        title: "Création impossible",
        description,
        variant: "destructive",
      });
    }
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "";
    try {
      return new Date(dateStr).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
    } catch { return dateStr; }
  };

  return (
    <div className="min-h-screen bg-[#F7F3EE] text-[#2b2320] flex items-center justify-center p-4 md:p-6">
      <div className="w-full max-w-6xl">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/80 text-[10px] font-semibold tracking-wider uppercase text-primary border border-[#E9DFD2] mb-4">
            <Sparkles className="h-3 w-3" />
            Créez votre site de mariage
          </div>
          <h1 className="text-3xl md:text-5xl font-serif font-bold mb-2">Votre site en quelques minutes</h1>
          <p className="text-[#7A6B5E] max-w-2xl mx-auto text-sm md:text-base">
            Configurez tout, visualisez le résultat, puis créez votre compte pour le publier.
          </p>
        </div>

        <Card className="p-5 md:p-8 bg-white border border-[#E6DCCF] rounded-[2rem] shadow-sm">
          <div className="mb-6">
            <div className="flex items-center justify-between text-xs uppercase tracking-widest text-[#8C7A6B] font-semibold mb-3">
              <span>Étape {step}/{TOTAL_STEPS}</span>
              <span>{stepLabels[step - 1]}</span>
            </div>
            <div className="flex gap-1">
              {stepLabels.map((_, i) => (
                <div key={i} className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${i < step ? 'bg-primary' : 'bg-[#EFE5D9]'}`} />
              ))}
            </div>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              <AnimatePresence mode="wait">
                {step === 1 && (
                  <motion.div key="s1" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -14 }} className="space-y-6">
                    <div className="text-center mb-2">
                      <h2 className="text-2xl font-serif font-bold">Parlez-nous de votre mariage</h2>
                      <p className="text-[#7A6B5E] text-sm mt-1">Ces informations apparaîtront sur votre site</p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <FormField
                        control={form.control}
                        name="title"
                        render={({ field }) => (
                          <FormItem className="md:col-span-2">
                            <FormLabel>Titre du projet</FormLabel>
                            <FormControl>
                              <Input placeholder="Ex: Marie & Pierre" {...field} className="h-12" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="slug"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>URL publique</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">daylora.app/</span>
                                <Input {...field} className="h-12 pl-[8.5rem]" placeholder="marie-et-pierre" />
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="weddingDate"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Date du mariage</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input type="date" {...field} className="h-12 pl-10" />
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="firstName"
                        render={({ field }) => (
                          <FormItem className="md:col-span-2">
                            <FormLabel>Votre prénom</FormLabel>
                            <FormControl>
                              <Input placeholder="Marie" {...field} className="h-12" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="storyBody"
                        render={({ field }) => (
                          <FormItem className="md:col-span-2">
                            <FormLabel>Quelques mots sur votre histoire <span className="text-muted-foreground font-normal">(optionnel)</span></FormLabel>
                            <FormControl>
                              <Input placeholder="Nous nous sommes rencontrés..." {...field} className="h-12" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </motion.div>
                )}

                {step === 2 && (
                  <motion.div key="s2" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -14 }} className="space-y-6">
                    <div className="text-center mb-2">
                      <h2 className="text-2xl font-serif font-bold">Choisissez votre style</h2>
                      <p className="text-[#7A6B5E] text-sm mt-1">Template et palette de couleurs de votre site</p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                      {TEMPLATES.map((tmpl) => (
                        <button
                          type="button"
                          key={tmpl.id}
                          className={`text-left border rounded-3xl overflow-hidden transition-all relative ${form.watch("templateId") === tmpl.id ? "border-primary ring-2 ring-primary/20" : "border-[#E6DCCF]"}`}
                          onClick={() => {
                            form.setValue("templateId", tmpl.id);
                            if (tmpl.premium && plan === "free") {
                              setPlan("premium");
                            }
                          }}
                        >
                          {tmpl.premium && (
                            <span className="absolute top-3 right-3 z-10 text-[10px] font-bold bg-white/90 backdrop-blur-sm text-primary px-2.5 py-1 rounded-full uppercase tracking-wider shadow-sm border border-primary/10 flex items-center gap-1">
                              <Star className="h-3 w-3" />
                              Premium
                            </span>
                          )}
                          <img src={tmpl.image} alt={tmpl.name} className="w-full h-56 object-cover" />
                          <div className="p-4 space-y-1 bg-white">
                            <div className="font-serif text-2xl font-bold">{tmpl.name}</div>
                            <div className="text-xs uppercase tracking-wider text-muted-foreground">{tmpl.description}</div>
                          </div>
                        </button>
                      ))}
                    </div>
                    <div className="rounded-3xl border border-[#E6DCCF] p-5 bg-[#FBF8F3]">
                      <div className="text-xs uppercase tracking-[0.25em] text-muted-foreground mb-4">Ton de couleurs</div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {COLOR_TONES.map((tone) => (
                          <button
                            key={tone.id}
                            type="button"
                            onClick={() => setToneId(tone.id)}
                            className={`w-full text-left border rounded-2xl p-4 transition-all ${toneId === tone.id ? "border-primary ring-2 ring-primary/20 bg-white" : "border-[#E6DCCF] bg-white/80"}`}
                          >
                            <div className="flex items-center gap-2 mb-2">
                              <span className="h-4 w-4 rounded-full border" style={{ backgroundColor: tone.primaryColor }} />
                              <span className="h-4 w-4 rounded-full border" style={{ backgroundColor: tone.secondaryColor }} />
                            </div>
                            <div className="font-semibold text-sm">{tone.name}</div>
                            <div className="text-xs text-muted-foreground mt-1">{tone.description}</div>
                          </button>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}

                {step === 3 && (
                  <motion.div key="s3" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -14 }} className="space-y-8">
                    <div className="text-center mb-2">
                      <h2 className="text-2xl font-serif font-bold">Vos photos</h2>
                      <p className="text-[#7A6B5E] text-sm mt-1">Ajoutez vos plus belles photos pour personnaliser le site</p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="space-y-4">
                        <FormLabel className="text-lg">Photo principale (Hero)</FormLabel>
                        <div className="relative aspect-[16/9] rounded-3xl overflow-hidden border-2 border-dashed border-[#E6DCCF] bg-[#FBF8F3] group transition-all hover:border-primary/30">
                          {heroImage ? (
                            <>
                              <img src={heroImage} className="w-full h-full object-cover" alt="Hero" />
                              <button type="button" onClick={() => setHeroImage("")} className="absolute top-4 right-4 h-10 w-10 rounded-full bg-black/50 text-white flex items-center justify-center backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity">
                                <X className="h-5 w-5" />
                              </button>
                            </>
                          ) : (
                            <label className="absolute inset-0 flex flex-col items-center justify-center cursor-pointer">
                              <Camera className="h-10 w-10 text-[#8C7A6B] mb-2" />
                              <span className="text-sm font-semibold text-[#8C7A6B]">Ajouter une photo</span>
                              <span className="text-[10px] text-[#A69585] mt-1 uppercase tracking-wider">Format paysage recommandé</span>
                              <input type="file" accept="image/*" className="hidden" onChange={(e) => handlePhotoUpload(e, 'hero')} />
                            </label>
                          )}
                        </div>
                      </div>
                      <div className="space-y-4">
                        <FormLabel className="text-lg">Photo secondaire (Histoire)</FormLabel>
                        <div className="relative aspect-square rounded-3xl overflow-hidden border-2 border-dashed border-[#E6DCCF] bg-[#FBF8F3] group transition-all hover:border-primary/30 max-w-[320px] mx-auto md:mx-0">
                          {couplePhoto ? (
                            <>
                              <img src={couplePhoto} className="w-full h-full object-cover" alt="Couple" />
                              <button type="button" onClick={() => setCouplePhoto("")} className="absolute top-4 right-4 h-10 w-10 rounded-full bg-black/50 text-white flex items-center justify-center backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity">
                                <X className="h-5 w-5" />
                              </button>
                            </>
                          ) : (
                            <label className="absolute inset-0 flex flex-col items-center justify-center cursor-pointer">
                              <ImageIcon className="h-10 w-10 text-[#8C7A6B] mb-2" />
                              <span className="text-sm font-semibold text-[#8C7A6B]">Photo du couple</span>
                              <span className="text-[10px] text-[#A69585] mt-1 uppercase tracking-wider">Format carré</span>
                              <input type="file" accept="image/*" className="hidden" onChange={(e) => handlePhotoUpload(e, 'couple')} />
                            </label>
                          )}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}

                {step === 4 && (
                  <motion.div key="s4" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -14 }} className="space-y-6">
                    <div className="text-center mb-2">
                      <h2 className="text-2xl font-serif font-bold">Votre galerie</h2>
                      <p className="text-[#7A6B5E] text-sm mt-1">Importez jusqu'à {MAX_ONBOARDING_GALLERY_IMAGES} photos de vos meilleurs moments</p>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {galleryImages.map((src, idx) => (
                        <div key={idx} className="relative aspect-square rounded-2xl overflow-hidden border border-[#E6DCCF] group">
                          <img src={src} className="w-full h-full object-cover" alt={`Gallery ${idx}`} />
                          <button type="button" onClick={() => setGalleryImages(prev => prev.filter((_, i) => i !== idx))} className="absolute top-2 right-2 h-8 w-8 rounded-full bg-black/50 text-white flex items-center justify-center backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity">
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                      {galleryImages.length < MAX_ONBOARDING_GALLERY_IMAGES && (
                        <label className="aspect-square rounded-2xl border-2 border-dashed border-[#E6DCCF] bg-[#FBF8F3] flex flex-col items-center justify-center cursor-pointer hover:border-primary/30 transition-all">
                          <Plus className="h-8 w-8 text-[#8C7A6B] mb-1" />
                          <span className="text-xs font-semibold text-[#8C7A6B]">Ajouter</span>
                          <input type="file" accept="image/*" multiple className="hidden" onChange={handleGalleryUpload} />
                        </label>
                      )}
                    </div>
                  </motion.div>
                )}

                {step === 5 && (
                  <motion.div key="s5" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -14 }} className="space-y-4">
                    <div className="text-center mb-2">
                      <h2 className="text-2xl font-serif font-bold">Votre formule</h2>
                      <p className="text-[#7A6B5E] text-sm mt-1">Choisissez votre plan et activez vos modules</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                      <button
                        type="button"
                        className={`rounded-2xl border-2 p-4 text-left transition-all ${plan === "free" ? "border-primary bg-primary/5" : "border-[#E6DCCF] hover:border-primary/30"} ${requiresPremiumTemplate ? "opacity-50 cursor-not-allowed" : ""}`}
                        onClick={() => {
                          if (!requiresPremiumTemplate) setPlan("free");
                        }}
                      >
                        <div className="font-bold text-lg">Découverte</div>
                        <div className="text-3xl font-serif font-bold mt-1">0€</div>
                        <div className="text-xs text-[#7A6B5E] mt-1">30 invités max, cagnotte incluse</div>
                        {requiresPremiumTemplate && (
                          <div className="text-[10px] text-primary font-medium mt-2">Le template choisi nécessite le plan Premium</div>
                        )}
                      </button>
                      <button
                        type="button"
                        className={`rounded-2xl border-2 p-4 text-left transition-all relative overflow-hidden ${plan !== "free" ? "border-primary bg-primary/5" : "border-[#E6DCCF] hover:border-primary/30"}`}
                        onClick={() => setPlan("premium")}
                      >
                        <div className="absolute top-2 right-2">
                          <span className="bg-primary text-white text-[10px] font-bold px-2 py-0.5 rounded-full">POPULAIRE</span>
                        </div>
                        <div className="font-bold text-lg flex items-center gap-2">
                          <Star className="h-4 w-4 text-primary" />
                          Premium
                        </div>
                        <div className="flex items-baseline gap-1 mt-1">
                          <span className="text-3xl font-serif font-bold">19€</span>
                          <span className="text-sm text-[#7A6B5E]">/mois</span>
                        </div>
                        <div className="text-xs text-[#7A6B5E] mt-1">Invités illimités, tous les modules</div>
                      </button>
                    </div>

                    {[
                      { key: "cagnotteEnabled", label: "Cagnotte", icon: <Wallet className="h-4 w-4" />, premium: false },
                      { key: "giftsEnabled", label: "Liste cadeaux", icon: <Gift className="h-4 w-4" />, premium: false },
                      { key: "jokesEnabled", label: "Blagues live", icon: <MessageCircle className="h-4 w-4" />, premium: true },
                      { key: "liveEnabled", label: "Contributions live", icon: <Zap className="h-4 w-4" />, premium: true },
                    ].map((item) => {
                      const isLocked = item.premium && plan === "free";
                      return (
                        <div key={item.key} className={`flex items-center justify-between border rounded-2xl px-5 py-4 ${isLocked ? "border-[#E6DCCF] opacity-60" : "border-[#E6DCCF]"}`}>
                          <div className="flex items-center gap-3 font-medium">
                            <span className="text-primary">{item.icon}</span>
                            {item.label}
                            {item.premium && (
                              <span className="text-[10px] font-bold bg-primary/10 text-primary px-2 py-0.5 rounded-full uppercase">Premium</span>
                            )}
                          </div>
                          <Switch
                            checked={isLocked ? false : modules[item.key as keyof ModulesState]}
                            onCheckedChange={(checked) => setModules((prev) => ({ ...prev, [item.key]: checked }))}
                            disabled={isLocked}
                          />
                        </div>
                      );
                    })}
                    <p className="text-xs text-muted-foreground">Vous pourrez changer de plan à tout moment depuis votre espace admin.</p>

                    <div className="rounded-2xl border border-[#E6DCCF] p-4 space-y-4">
                      <div className="text-sm font-semibold">Cagnotte</div>
                      <p className="text-xs text-muted-foreground">Redirigez vos invités vers votre cagnotte (Leetchi, PayPal, Lydia, etc.)</p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <Input
                          value={externalCagnotteUrl}
                          onChange={(e) => setExternalCagnotteUrl(e.target.value)}
                          placeholder="https://..."
                          className="h-11"
                        />
                        <select
                          value={externalProvider}
                          onChange={(e) => setExternalProvider(e.target.value)}
                          className="h-11 rounded-md border border-border bg-background px-3 text-sm"
                        >
                          <option value="leetchi">Leetchi</option>
                          <option value="paypal">PayPal</option>
                          <option value="lydia">Lydia</option>
                          <option value="stripe_payment_link">Stripe Payment Link</option>
                          <option value="other">Autre</option>
                        </select>
                      </div>
                    </div>
                  </motion.div>
                )}

                {step === 6 && (
                  <motion.div key="s6" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -14 }} className="space-y-6">
                    <div className="text-center mb-2">
                      <h2 className="text-2xl font-serif font-bold">Aperçu de votre site</h2>
                      <p className="text-[#7A6B5E] text-sm mt-1">Voici à quoi ressemblera votre site de mariage</p>
                    </div>

                    <div className="rounded-3xl border border-[#E6DCCF] overflow-hidden shadow-lg">
                      <div className="relative h-64 md:h-80 overflow-hidden" style={{ backgroundColor: selectedTone.secondaryColor }}>
                        {heroImage ? (
                          <img src={heroImage} className="w-full h-full object-cover" alt="Preview hero" />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-b from-[#D7C6B2]/30 to-[#E7D9C8]/50 flex items-center justify-center">
                            <Camera className="h-12 w-12 text-[#B6A796]" />
                          </div>
                        )}
                        <div className="absolute inset-0 bg-black/30 flex flex-col items-center justify-center text-white">
                          <div className="text-sm uppercase tracking-[0.3em] font-semibold mb-2 opacity-80">Le mariage de</div>
                          <h3 className="text-3xl md:text-5xl font-serif font-bold mb-3">{form.watch("title") || "Marie & Pierre"}</h3>
                          {form.watch("weddingDate") && (
                            <div className="text-lg font-light opacity-90">{formatDate(form.watch("weddingDate"))}</div>
                          )}
                          <button type="button" className="mt-6 px-8 py-3 rounded-full text-sm font-semibold transition-all" style={{ backgroundColor: selectedTone.primaryColor, color: "#fff" }}>
                            Confirmer votre présence
                          </button>
                        </div>
                      </div>

                      <div className="p-6 md:p-8 space-y-6" style={{ backgroundColor: selectedTone.secondaryColor }}>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                          {[
                            { label: "Template", value: selectedTemplate.name },
                            { label: "Couleur", value: selectedTone.name },
                            { label: "RSVP", value: "Activé" },
                            { label: "Cagnotte", value: modules.cagnotteEnabled ? "Activée" : "Désactivée" },
                          ].map((item, i) => (
                            <div key={i} className="rounded-2xl bg-white/80 border border-[#E6DCCF]/50 p-3 text-center">
                              <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{item.label}</div>
                              <div className="font-semibold text-sm mt-1">{item.value}</div>
                            </div>
                          ))}
                        </div>

                        <div className="flex flex-wrap gap-2 justify-center">
                          {["Accueil", "RSVP", modules.giftsEnabled && "Cadeaux", "Histoire", "Photos", "Lieux", "Programme", modules.cagnotteEnabled && "Cagnotte"].filter(Boolean).map((item, i) => (
                            <span key={i} className="px-3 py-1.5 rounded-full text-xs font-semibold border" style={{ borderColor: selectedTone.primaryColor, color: selectedTone.primaryColor }}>
                              {item}
                            </span>
                          ))}
                        </div>

                        {(couplePhoto || form.watch("storyBody")) && (
                          <div className="flex items-center gap-6 rounded-2xl bg-white/60 p-5 border border-[#E6DCCF]/50">
                            {couplePhoto && <img src={couplePhoto} className="w-20 h-20 rounded-2xl object-cover flex-shrink-0" alt="Couple" />}
                            <div>
                              <div className="text-xs uppercase tracking-wider text-muted-foreground mb-1">Notre histoire</div>
                              <div className="text-sm text-[#6B5B4F]">{form.watch("storyBody") || "Votre histoire d'amour..."}</div>
                            </div>
                          </div>
                        )}

                        {galleryImages.length > 0 && (
                          <div>
                            <div className="text-xs uppercase tracking-wider text-muted-foreground mb-3 text-center">Galerie</div>
                            <div className="flex gap-2 overflow-x-auto pb-2">
                              {galleryImages.map((src, idx) => (
                                <img key={idx} src={src} className="w-20 h-20 rounded-xl object-cover flex-shrink-0" alt={`Preview ${idx}`} />
                              ))}
                            </div>
                          </div>
                        )}

                        <div className="text-center pt-4 space-y-4">
                          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-50 text-green-700 text-sm font-semibold border border-green-200">
                            <Check className="h-4 w-4" />
                            Votre site est prêt à être publié
                          </div>
                          <p className="text-xs text-muted-foreground">URL : <span className="font-semibold">daylora.app/{form.watch("slug")}</span></p>
                          <Button
                            type="button"
                            variant="outline"
                            className="gap-2"
                            onClick={() => {
                              const previewData = {
                                title: form.getValues("title"),
                                slug: form.getValues("slug"),
                                weddingDate: form.getValues("weddingDate"),
                                templateId: form.getValues("templateId"),
                                storyBody: form.getValues("storyBody"),
                                toneId,
                                heroImage,
                                couplePhoto,
                                galleryImages,
                                features: modules,
                              };
                              localStorage.setItem("daylora_onboarding_preview", JSON.stringify(previewData));
                              window.open("/onboarding-preview", "_blank");
                            }}
                          >
                            <ExternalLink className="h-4 w-4" />
                            Voir l'aperçu complet du site
                          </Button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}

                {step === 7 && (
                  <motion.div key="s7" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -14 }} className="space-y-6">
                    <div className="text-center mb-2">
                      <h2 className="text-2xl font-serif font-bold">Créez votre compte</h2>
                      <p className="text-[#7A6B5E] text-sm mt-1">Dernière étape pour publier votre site</p>
                    </div>

                    <div className="max-w-md mx-auto space-y-5">
                      <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-[#6B5B4F] uppercase tracking-widest text-[10px] font-bold">Email</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input type="email" autoComplete="username" placeholder="marie@exemple.com" {...field} className="h-12 pl-10" />
                              </div>
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
                            <FormLabel className="text-[#6B5B4F] uppercase tracking-widest text-[10px] font-bold">Mot de passe</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                  type={showPassword ? "text" : "password"}
                                  autoComplete="new-password"
                                  placeholder="8 caractères minimum"
                                  {...field}
                                  className="h-12 pl-10 pr-12"
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

                      <div>
                        <label className="text-[#6B5B4F] uppercase tracking-widest text-[10px] font-bold block mb-2">Code parrainage (optionnel)</label>
                        <Input
                          value={referralCode}
                          onChange={(e) => setReferralCode(e.target.value.toUpperCase())}
                          placeholder="Ex: ABC123"
                          className="h-12 font-mono tracking-widest uppercase"
                        />
                        <p className="text-xs text-[#7A6B5E] mt-1">Vous avez un code d'un ami ? Entrez-le pour 10€ de réduction sur Premium.</p>
                      </div>

                      <div className="rounded-2xl bg-[#FBF8F3] border border-[#E6DCCF] p-4">
                        <div className="flex items-start gap-3">
                          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                            <Check className="h-4 w-4 text-primary" />
                          </div>
                          <div>
                            <div className="font-semibold text-sm">Récapitulatif</div>
                            <div className="text-xs text-[#7A6B5E] mt-1 space-y-1">
                              <div>Site : <span className="font-semibold">{form.watch("title")}</span></div>
                              <div>URL : <span className="font-semibold">daylora.app/{form.watch("slug")}</span></div>
                              <div>Template : <span className="font-semibold">{selectedTemplate.name}</span></div>
                              <div>Date : <span className="font-semibold">{formatDate(form.watch("weddingDate"))}</span></div>
                              <div>Plan : <span className="font-semibold">{plan === "free" ? "Découverte (gratuit)" : "Premium (19€/mois)"}</span></div>
                            </div>
                          </div>
                        </div>
                      </div>

                      <p className="text-xs text-center text-muted-foreground">
                        Un email de vérification sera envoyé à votre adresse pour activer votre compte.
                      </p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
                <Button type="button" variant="ghost" onClick={goBack} disabled={step === 1 || isLoading}>
                  Retour
                </Button>

                <div className="flex items-center gap-2">
                  {step < TOTAL_STEPS && step !== 6 && (
                    <Button type="button" variant="outline" onClick={goNext} disabled={isLoading || isUploading}>
                      Passer
                    </Button>
                  )}

                  {step < TOTAL_STEPS ? (
                    <Button type="button" onClick={goNext} disabled={isLoading || isUploading}>
                      {isUploading ? "Import..." : step === 6 ? "Tout est bon, je continue" : "Continuer"}
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  ) : (
                    <Button type="submit" disabled={isLoading || isUploading} className="px-8">
                      {isLoading ? "Création en cours..." : "Créer mon compte et publier"}
                      {!isLoading && <Heart className="ml-2 h-4 w-4" />}
                    </Button>
                  )}
                </div>
              </div>
            </form>
          </Form>
        </Card>

        <div className="text-center mt-5 space-y-2">
          <div className="text-xs text-[#8C7A6B]">
            <Heart className="inline h-3.5 w-3.5 mr-1" />
            Tout est modifiable plus tard depuis votre espace admin.
          </div>
          <div className="text-sm">
            <span className="text-[#7A6B5E]">Déjà un compte ?</span>{" "}
            <Link href="/login" className="text-primary font-bold hover:text-primary/80 transition-colors">
              Connectez-vous
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
