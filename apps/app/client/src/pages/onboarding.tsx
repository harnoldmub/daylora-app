import React, { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useLocation } from "wouter";
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
} from "lucide-react";
import { compressImageFileToJpegDataUrl } from "@/lib/image";

const TEMPLATES = [
  { id: "classic", name: "Classique", description: "Élégant et intemporel", image: "/previews/template_classic_preview_v2.png" },
  { id: "modern", name: "Moderne", description: "Épuré et minimaliste", image: "/previews/template_modern_preview_v2.png" },
  { id: "minimal", name: "Minimal", description: "Audacieux et chic", image: "/previews/template_minimal_preview_v2.png" },
];

const MAX_ONBOARDING_GALLERY_IMAGES = 6;

const onboardingSchema = z.object({
  title: z.string().min(3, "Le titre doit faire au moins 3 caractères"),
  slug: z
    .string()
    .min(3, "Le slug doit faire au moins 3 caractères")
    .regex(/^[a-z0-9-]+$/, "Uniquement des minuscules, chiffres et tirets"),
  weddingDate: z.string().min(1, "La date est requise"),
  templateId: z.string().default("classic"),
  storyBody: z.string().optional(),
});

type OnboardingForm = z.infer<typeof onboardingSchema>;

type ModulesState = {
  cagnotteEnabled: boolean;
  giftsEnabled: boolean;
  jokesEnabled: boolean;
  liveEnabled: boolean;
};

const stepLabels = ["Mariage", "Style", "Photos", "Galerie", "Modules", "Offre", "Final"];

export default function Onboarding() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [plan, setPlan] = useState<"free" | "premium">("free");
  const [toneId, setToneId] = useState<string>(COLOR_TONES[0].id);
  const [modules, setModules] = useState<ModulesState>({
    cagnotteEnabled: true,
    giftsEnabled: true,
    jokesEnabled: true,
    liveEnabled: true,
  });
  const [paymentMode, setPaymentMode] = useState<"stripe" | "external">("stripe");
  const [externalCagnotteUrl, setExternalCagnotteUrl] = useState("");
  const [externalProvider, setExternalProvider] = useState("other");

  const [heroImage, setHeroImage] = useState<string>("");
  const [couplePhoto, setCouplePhoto] = useState<string>("");
  const [galleryImages, setGalleryImages] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  const form = useForm<OnboardingForm>({
    resolver: zodResolver(onboardingSchema),
    defaultValues: {
      title: "",
      slug: "",
      weddingDate: "",
      templateId: "classic",
      storyBody: "",
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
      toast({ title: "Erreur", description: "L'image est trop lourde.", variant: "destructive" });
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
      toast({ title: "Erreur", description: "Une ou plusieurs images sont trop lourdes.", variant: "destructive" });
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

  const progress = useMemo(() => (step / 7) * 100, [step]);

  const goNext = async () => {
    if (step === 1) {
      const valid = await form.trigger(["title", "slug", "weddingDate"]);
      if (!valid) return;
    }
    setStep((s) => Math.min(7, s + 1));
  };

  const goBack = () => setStep((s) => Math.max(1, s - 1));

  const onSubmit = async (data: OnboardingForm) => {
    setIsLoading(true);
    try {
      if (paymentMode === "external" && !externalCagnotteUrl.trim()) {
        throw new Error("Ajoutez un lien de cagnotte externe.");
      }
      const response = await fetch("/api/weddings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          ...data,
          currentPlan: plan,
          weddingDate: data.weddingDate,
          features: {
            cagnotteEnabled: modules.cagnotteEnabled,
            giftsEnabled: modules.giftsEnabled,
            jokesEnabled: modules.jokesEnabled,
            liveEnabled: modules.liveEnabled,
          },
          paymentMode,
          externalCagnotteUrl: externalCagnotteUrl.trim(),
          externalProvider,
          toneId,
          heroImage,
          couplePhoto,
          galleryImages,
          storyBody: data.storyBody,
        }),
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(text || "Creation impossible");
      }

      const wedding = await response.json();
      setLocation(`/app/${wedding.id}/welcome`);
    } catch (error: any) {
      setIsLoading(false);
      toast({
        title: "Erreur",
        description: error?.message || "Impossible de créer votre projet. Vérifiez le slug et réessayez.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-[#F7F3EE] text-[#2b2320] flex items-center justify-center p-6">
      <div className="w-full max-w-6xl">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/80 text-[10px] font-semibold tracking-wider uppercase text-primary border border-[#E9DFD2] mb-6">
            <Sparkles className="h-3 w-3" />
            Wizard rapide
          </div>
          <h1 className="text-4xl md:text-5xl font-serif font-bold mb-3">Créez votre projet en 3 minutes</h1>
          <p className="text-[#7A6B5E] max-w-3xl mx-auto">
            Nocely est une plateforme moderne pour créer une expérience digitale élégante en quelques minutes.
            Site public premium, backoffice complet, tout reste modifiable ensuite.
          </p>
        </div>

        <Card className="p-6 md:p-8 bg-white border border-[#E6DCCF] rounded-[2rem] shadow-sm">
          <div className="mb-8">
            <div className="flex items-center justify-between text-xs uppercase tracking-widest text-[#8C7A6B] font-semibold mb-3">
              <span>Étape {step}/7</span>
              <span>{stepLabels[step - 1]}</span>
            </div>
            <div className="h-2 rounded-full bg-[#EFE5D9] overflow-hidden">
              <div className="h-full bg-primary rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
            </div>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              <AnimatePresence mode="wait">
                {step === 1 && (
                  <motion.div key="s1" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -14 }} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="title"
                      render={({ field }) => (
                        <FormItem className="md:col-span-2">
                          <FormLabel>Titre du projet</FormLabel>
                          <FormControl>
                            <Input placeholder="Ex: Alex et Sam" {...field} className="h-12" />
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
                            <Input {...field} className="h-12" placeholder="marie-et-sophie" />
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
                          <FormLabel>Date principale</FormLabel>
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
                      name="storyBody"
                      render={({ field }) => (
                        <FormItem className="md:col-span-2">
                          <FormLabel>Quelques mots sur votre histoire</FormLabel>
                          <FormControl>
                            <Input placeholder="Nous nous sommes rencontrés..." {...field} className="h-12" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </motion.div>
                )}

                {step === 2 && (
                  <motion.div key="s2" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -14 }} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                      {TEMPLATES.map((tmpl) => (
                        <button
                          type="button"
                          key={tmpl.id}
                          className={`text-left border rounded-3xl overflow-hidden transition-all ${form.watch("templateId") === tmpl.id ? "border-primary ring-2 ring-primary/20" : "border-[#E6DCCF]"
                            }`}
                          onClick={() => form.setValue("templateId", tmpl.id)}
                        >
                          <img src={tmpl.image} alt={tmpl.name} className="w-full h-56 object-cover" />
                          <div className="p-4 space-y-1 bg-white">
                            <div className="font-serif text-2xl font-bold">{tmpl.name}</div>
                            <div className="text-xs uppercase tracking-wider text-muted-foreground">{tmpl.description}</div>
                          </div>
                        </button>
                      ))}
                    </div>

                    <div className="rounded-3xl border border-[#E6DCCF] p-5 bg-[#FBF8F3]">
                      <div className="text-xs uppercase tracking-[0.25em] text-muted-foreground mb-4">
                        Ton de couleurs
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {COLOR_TONES.map((tone) => (
                          <button
                            key={tone.id}
                            type="button"
                            onClick={() => setToneId(tone.id)}
                            className={`w-full text-left border rounded-2xl p-4 transition-all ${toneId === tone.id ? "border-primary ring-2 ring-primary/20 bg-white" : "border-[#E6DCCF] bg-white/80"
                              }`}
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
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="space-y-4">
                        <FormLabel className="text-lg">Photo principale (Hero)</FormLabel>
                        <div className="relative aspect-[16/9] rounded-3xl overflow-hidden border-2 border-dashed border-[#E6DCCF] bg-[#FBF8F3] group transition-all hover:border-primary/30">
                          {heroImage ? (
                            <>
                              <img src={heroImage} className="w-full h-full object-cover" alt="Hero" />
                              <button
                                type="button"
                                onClick={() => setHeroImage("")}
                                className="absolute top-4 right-4 h-10 w-10 rounded-full bg-black/50 text-white flex items-center justify-center backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity"
                              >
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
                              <button
                                type="button"
                                onClick={() => setCouplePhoto("")}
                                className="absolute top-4 right-4 h-10 w-10 rounded-full bg-black/50 text-white flex items-center justify-center backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                <X className="h-5 w-5" />
                              </button>
                            </>
                          ) : (
                            <label className="absolute inset-0 flex flex-col items-center justify-center cursor-pointer">
                              <ImageIcon className="h-10 w-10 text-[#8C7A6B] mb-2" />
                              <span className="text-sm font-semibold text-[#8C7A6B]">Photo du couple</span>
                              <span className="text-[10px] text-[#A69585] mt-1 uppercase tracking-wider">Format carre</span>
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
                    <div className="text-center mb-6">
                      <h3 className="text-2xl font-serif font-bold mb-2">Configurez votre galerie</h3>
                      <p className="text-[#7A6B5E]">Importez jusqu'a {MAX_ONBOARDING_GALLERY_IMAGES} photos de vos meilleurs moments.</p>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {galleryImages.map((src, idx) => (
                        <div key={idx} className="relative aspect-square rounded-2xl overflow-hidden border border-[#E6DCCF] group">
                          <img src={src} className="w-full h-full object-cover" alt={`Gallery ${idx}`} />
                          <button
                            type="button"
                            onClick={() => setGalleryImages(prev => prev.filter((_, i) => i !== idx))}
                            className="absolute top-2 right-2 h-8 w-8 rounded-full bg-black/50 text-white flex items-center justify-center backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity"
                          >
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
                    {[
                      { key: "cagnotteEnabled", label: "Cagnotte", icon: <Wallet className="h-4 w-4" /> },
                      { key: "giftsEnabled", label: "Liste cadeaux", icon: <Gift className="h-4 w-4" /> },
                      { key: "jokesEnabled", label: "Blagues live", icon: <MessageCircle className="h-4 w-4" /> },
                      { key: "liveEnabled", label: "Contributions live", icon: <Zap className="h-4 w-4" /> },
                    ].map((item) => (
                      <div key={item.key} className="flex items-center justify-between border border-[#E6DCCF] rounded-2xl px-5 py-4">
                        <div className="flex items-center gap-3 font-medium">
                          <span className="text-primary">{item.icon}</span>
                          {item.label}
                        </div>
                        <Switch
                          checked={modules[item.key as keyof ModulesState]}
                          onCheckedChange={(checked) => setModules((prev) => ({ ...prev, [item.key]: checked }))}
                        />
                      </div>
                    ))}
                    <p className="text-xs text-muted-foreground">Tous les modules sont modifiables plus tard dans le backoffice.</p>

                    <div className="rounded-2xl border border-[#E6DCCF] p-4 space-y-4">
                      <div className="text-sm font-semibold">Mode de cagnotte</div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <button
                          type="button"
                          className={`rounded-xl border p-3 text-left ${paymentMode === "stripe" ? "border-primary bg-primary/5" : "border-[#E6DCCF]"}`}
                          onClick={() => setPaymentMode("stripe")}
                        >
                          <div className="font-medium">Stripe intégré</div>
                          <div className="text-xs text-muted-foreground mt-1">Paiement direct et live automatique</div>
                        </button>
                        <button
                          type="button"
                          className={`rounded-xl border p-3 text-left ${paymentMode === "external" ? "border-primary bg-primary/5" : "border-[#E6DCCF]"}`}
                          onClick={() => setPaymentMode("external")}
                        >
                          <div className="font-medium">Lien externe</div>
                          <div className="text-xs text-muted-foreground mt-1">Leetchi, PayPal, Lydia, etc.</div>
                        </button>
                      </div>

                      {paymentMode === "external" ? (
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
                      ) : null}
                    </div>
                  </motion.div>
                )}

                {step === 6 && (
                  <motion.div key="s6" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -14 }} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <button
                      type="button"
                      className={`p-6 rounded-3xl border text-left transition-all ${plan === "free" ? "border-primary ring-2 ring-primary/20" : "border-[#E6DCCF]"}`}
                      onClick={() => setPlan("free")}
                    >
                      <div className="text-xs uppercase tracking-widest text-muted-foreground">Gratuit</div>
                      <div className="text-4xl font-bold mt-1">0€</div>
                      <ul className="mt-4 text-sm text-[#6B5B4F] space-y-2">
                        <li>1 template</li>
                        <li>RSVP + exports</li>
                        <li>Jusqu'a 50 invites</li>
                      </ul>
                    </button>
                    <button
                      type="button"
                      className={`p-6 rounded-3xl border text-left transition-all ${plan === "premium" ? "border-primary ring-2 ring-primary/20" : "border-[#E6DCCF]"}`}
                      onClick={() => setPlan("premium")}
                    >
                      <div className="text-xs uppercase tracking-widest text-muted-foreground">Premium</div>
                      <div className="text-4xl font-bold mt-1">29€</div>
                      <ul className="mt-4 text-sm text-[#6B5B4F] space-y-2">
                        <li>Invites illimites</li>
                        <li>Cagnotte + live + PDF</li>
                        <li>Support prioritaire</li>
                      </ul>
                    </button>
                  </motion.div>
                )}

                {step === 7 && (
                  <motion.div key="s7" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -14 }} className="space-y-6">
                    <div className="rounded-3xl border border-[#E6DCCF] p-6 bg-[#FBF8F3]">
                      <div className="text-2xl font-serif font-bold mb-2">Votre site est prêt</div>
                      <p className="text-[#7A6B5E]">Confirmez et nous générons tout automatiquement : site public, admin, modules et URLs.</p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div className="rounded-2xl border border-[#E6DCCF] p-4">
                        <div className="text-muted-foreground uppercase tracking-wider text-xs">Projet</div>
                        <div className="font-semibold mt-1">{form.getValues("title")}</div>
                        <div className="text-muted-foreground">/{form.getValues("slug")}</div>
                      </div>
                      <div className="rounded-2xl border border-[#E6DCCF] p-4">
                        <div className="text-muted-foreground uppercase tracking-wider text-xs">Plan</div>
                        <div className="font-semibold mt-1">{plan === "premium" ? "Premium" : "Gratuit"}</div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
                <Button type="button" variant="ghost" onClick={goBack} disabled={step === 1 || isLoading}>
                  Retour
                </Button>

                <div className="flex items-center gap-2">
                  {step < 7 && (
                    <Button type="button" variant="outline" onClick={goNext} disabled={isLoading || isUploading}>
                      Passer
                    </Button>
                  )}

                  {step < 7 ? (
                    <Button type="button" onClick={goNext} disabled={isLoading || isUploading}>
                      {isUploading ? "Import..." : "Continuer"}
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  ) : (
                    <Button type="submit" disabled={isLoading || isUploading}>
                      {isLoading ? "Création..." : "Créer mon site"}
                    </Button>
                  )}
                </div>
              </div>
            </form>
          </Form>
        </Card>

        <div className="text-center mt-6 text-xs text-[#8C7A6B]">
          <Heart className="inline h-3.5 w-3.5 mr-1" />
          Tout est editable plus tard depuis le studio design.
        </div>
      </div>
    </div>
  );
}
