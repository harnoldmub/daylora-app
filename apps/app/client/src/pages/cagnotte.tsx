import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Gift, Heart, Loader2, ArrowLeft, MessageCircle, ExternalLink, Phone, Building2, CreditCard, Copy, Check, Send } from "lucide-react";
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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { z } from "zod";
import { Link, useParams } from "wouter";
import { type Contribution, type ContributionMethod } from "@shared/schema";
import { useWedding } from "@/hooks/use-api";
import { getButtonClass } from "@/lib/design-presets";

const declareFormSchema = z.object({
  donorName: z.string().min(1, "Veuillez saisir votre nom."),
  amount: z.string().min(1, "Veuillez indiquer le montant.").refine(
    (val) => {
      const num = parseFloat(val);
      return !isNaN(num) && num >= 1;
    },
    { message: "Le montant minimum est de 1 €." }
  ),
  message: z.string().optional(),
});

type DeclareFormValues = z.infer<typeof declareFormSchema>;

const TEMPLATE_THEME = {
  classic: {
    pageBg: "bg-background",
    heroOverlay: "from-black/45 via-black/20 to-background",
    cardClass: "border border-primary/15 bg-card/95 shadow-[0_16px_45px_rgba(0,0,0,0.12)]",
  },
  modern: {
    pageBg: "bg-background",
    heroOverlay: "from-black/55 via-black/25 to-background",
    cardClass: "border border-primary/15 bg-card shadow-[0_18px_46px_rgba(0,0,0,0.12)]",
  },
  minimal: {
    pageBg: "bg-background",
    heroOverlay: "from-black/55 via-black/25 to-background",
    cardClass: "border border-primary/15 bg-card shadow-[0_14px_30px_rgba(0,0,0,0.10)]",
  },
} as const;

const getButtonRadiusClass = (buttonRadius?: string) => {
  if (buttonRadius === "square") return "rounded-md";
  if (buttonRadius === "rounded") return "rounded-xl";
  return "rounded-full";
};

function Countdown({ weddingDate }: { weddingDate: string }) {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    const targetDate = new Date(weddingDate);
    const timer = setInterval(() => {
      const difference = targetDate.getTime() - Date.now();
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
    <div className="flex gap-3 md:gap-6 justify-center items-center flex-wrap">
      {[
        { value: timeLeft.days, label: "Jours" },
        { value: timeLeft.hours, label: "Heures" },
        { value: timeLeft.minutes, label: "Minutes" },
        { value: timeLeft.seconds, label: "Secondes" },
      ].map((item, idx) => (
        <div key={idx} className="flex flex-col items-center">
          <div className="w-14 h-14 md:w-16 md:h-16 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
            <span className="text-xl md:text-2xl font-serif font-bold text-primary">
              {item.value.toString().padStart(2, "0")}
            </span>
          </div>
          <span className="text-xs text-muted-foreground mt-1 font-sans">{item.label}</span>
        </div>
      ))}
    </div>
  );
}

function AnimatedMessages({ messages }: { messages: string[] }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    if (messages.length <= 1) return;
    const interval = setInterval(() => {
      setIsVisible(false);
      setTimeout(() => {
        setCurrentIndex((prev) => (prev + 1) % messages.length);
        setIsVisible(true);
      }, 500);
    }, 5000);
    return () => clearInterval(interval);
  }, [messages.length]);

  if (messages.length === 0) return null;

  return (
    <div className="py-8 px-6 bg-gradient-to-br from-primary/10 via-primary/5 to-background rounded-xl border border-primary/20 mb-8 shadow-sm">
      <div className="flex items-center justify-center gap-2 text-sm font-medium text-primary/80 mb-6">
        <MessageCircle className="h-4 w-4" />
        <span className="uppercase tracking-wider">Leurs messages d'affection</span>
        <MessageCircle className="h-4 w-4" />
      </div>
      <div className={`text-center transition-all duration-500 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"}`}>
        <p className="text-lg md:text-xl font-serif italic text-foreground/90 leading-relaxed px-4">
          « {messages[currentIndex]} »
        </p>
      </div>
      {messages.length > 1 && (
        <div className="flex justify-center gap-1.5 mt-6">
          {messages.map((_, idx) => (
            <div
              key={idx}
              className={`h-1.5 rounded-full transition-all duration-300 ${idx === currentIndex ? "bg-primary w-8" : "bg-primary/20 w-1.5"}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function getMethodIcon(type: ContributionMethod["type"]) {
  switch (type) {
    case "paypal": return CreditCard;
    case "phone": return Phone;
    case "link": return ExternalLink;
    case "bank": return Building2;
  }
}

function getMethodTitle(method: ContributionMethod) {
  switch (method.type) {
    case "paypal": return "PayPal";
    case "phone": return method.label || "Mobile Money";
    case "link": return method.serviceName || "Lien externe";
    case "bank": return method.bankName || "Virement bancaire";
  }
}

function getMethodDescription(method: ContributionMethod) {
  switch (method.type) {
    case "paypal": return "Envoyez via PayPal";
    case "phone": return `Envoyez à ${method.number}`;
    case "link": return "Cliquez pour être redirigé";
    case "bank": return `${method.accountHolder} — ${method.bankName}`;
  }
}

function CopyButton({ text, label }: { text: string; label: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };
  return (
    <Button variant="outline" size="sm" onClick={handleCopy} className="gap-1.5 text-xs">
      {copied ? <Check className="h-3 w-3 text-green-500" /> : <Copy className="h-3 w-3" />}
      {copied ? "Copié !" : label}
    </Button>
  );
}

function MethodCard({ method, buttonRadiusClass }: { method: ContributionMethod; buttonRadiusClass: string }) {
  const Icon = getMethodIcon(method.type);
  const isRedirect = method.type === "paypal" || method.type === "link";
  const redirectUrl = method.type === "paypal" ? method.paypalUrl : method.type === "link" ? method.url : "";

  return (
    <Card className="overflow-hidden border border-primary/10 hover:border-primary/25 transition-all hover:shadow-md">
      <div className="p-5">
        <div className="flex items-start gap-4">
          <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
            <Icon className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-sm text-foreground">{getMethodTitle(method)}</h3>
            <p className="text-xs text-muted-foreground mt-0.5">{getMethodDescription(method)}</p>
          </div>
        </div>

        <div className="mt-4">
          {isRedirect && redirectUrl ? (
            <Button asChild className={`w-full ${buttonRadiusClass}`} size="sm">
              <a href={redirectUrl} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-3.5 w-3.5 mr-2" />
                {method.type === "paypal" ? "Ouvrir PayPal" : "Ouvrir le lien"}
              </a>
            </Button>
          ) : method.type === "phone" ? (
            <div className="space-y-2">
              <div className="flex items-center gap-2 bg-muted/50 rounded-lg px-3 py-2">
                <span className="text-sm font-mono flex-1">{method.number}</span>
                <CopyButton text={method.number} label="Copier" />
              </div>
            </div>
          ) : method.type === "bank" ? (
            <div className="space-y-2">
              <div className="bg-muted/50 rounded-lg px-3 py-2">
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Titulaire</div>
                <div className="text-xs font-medium">{method.accountHolder}</div>
              </div>
              <div className="flex items-center gap-2 bg-muted/50 rounded-lg px-3 py-2">
                <div className="flex-1">
                  <div className="text-[10px] uppercase tracking-wider text-muted-foreground">IBAN</div>
                  <div className="font-mono text-xs break-all">{method.iban}</div>
                </div>
                <CopyButton text={method.iban} label="Copier" />
              </div>
              {method.bic && (
                <div className="flex items-center gap-2 bg-muted/50 rounded-lg px-3 py-2">
                  <div className="flex-1">
                    <div className="text-[10px] uppercase tracking-wider text-muted-foreground">BIC</div>
                    <div className="font-mono text-xs">{method.bic}</div>
                  </div>
                  <CopyButton text={method.bic} label="Copier" />
                </div>
              )}
            </div>
          ) : null}
        </div>
      </div>
    </Card>
  );
}

export default function CagnottePage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [declareOpen, setDeclareOpen] = useState(false);
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null);
  const _params = useParams();
  const slug = (_params as any).slug || (_params as any).weddingId || "";
  const { data: wedding } = useWedding(slug);
  const basePath = useMemo(() => {
    if (!slug) return "/";
    if (typeof window === "undefined") return `/${slug}`;
    const pathname = window.location.pathname || "";
    const previewPrefix = `/preview/${slug}`;
    return pathname.startsWith(previewPrefix) ? previewPrefix : `/${slug}`;
  }, [slug]);

  const { data: contributions } = useQuery<Contribution[]>({
    queryKey: ["/api/contributions/confirmed", slug],
    queryFn: async () => {
      const url = slug
        ? `/api/contributions/confirmed?slug=${encodeURIComponent(slug)}`
        : "/api/contributions/confirmed";
      const response = await apiRequest("GET", url);
      return response.json();
    },
    enabled: !!slug,
  });

  const messages = contributions
    ?.map((c) => c.message)
    .filter((m): m is string => !!m && m.length > 0) || [];

  const displayTitle = wedding?.title || "Notre Mariage";
  const displayDate =
    wedding?.config?.texts?.weddingDate ||
    (wedding?.weddingDate
      ? new Date(wedding.weddingDate).toLocaleDateString("fr-FR", {
          day: "numeric",
          month: "long",
          year: "numeric",
        })
      : "Prochainement");
  const heroImage = wedding?.config?.media?.heroImage || "";
  const templateId = (wedding?.templateId as keyof typeof TEMPLATE_THEME) || "classic";
  const templateTheme = TEMPLATE_THEME[templateId] || TEMPLATE_THEME.classic;
  const buttonToneClass = getButtonClass(wedding?.config?.theme?.buttonStyle);
  const buttonRadiusClass = getButtonRadiusClass(wedding?.config?.theme?.buttonRadius);
  const cagnotteTitle = wedding?.config?.texts?.cagnotteTitle || "CAGNOTTE MARIAGE";
  const cagnotteDescription = wedding?.config?.texts?.cagnotteDescription || "Votre présence est notre plus beau cadeau. Si vous souhaitez contribuer à notre voyage de noces ou à notre nouveau départ, vous pouvez participer à notre cagnotte.";
  const cagnotteBackLabel = wedding?.config?.texts?.cagnotteBackLabel || "Retour";
  const suggestedAmounts =
    wedding?.config?.sections?.cagnotteSuggestedAmounts?.length
      ? wedding.config.sections.cagnotteSuggestedAmounts
      : [20, 50, 100, 150, 200];
  const countdownDate =
    wedding?.config?.sections?.countdownDate ||
    (wedding?.weddingDate ? new Date(wedding.weddingDate).toISOString() : "") ||
    new Date("2026-03-19T00:00:00").toISOString();
  const cagnotteEnabled =
    (wedding?.config?.navigation?.pages?.cagnotte ?? true) &&
    (wedding?.config?.features?.cagnotteEnabled ?? true);

  const contributionMethods: ContributionMethod[] = (wedding?.config?.payments?.contributionMethods || [])
    .filter((m: ContributionMethod) => m.enabled)
    .sort((a: ContributionMethod, b: ContributionMethod) => a.sortOrder - b.sortOrder);

  useEffect(() => {
    if (!slug) return;
    const es = new EventSource(`/api/live/stream?slug=${slug}`);
    es.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data);
        if (payload?.type === "joke_shown") {
          toast({ title: "Blague live", description: payload.payload?.content || "Nouvelle blague" });
        }
      } catch {}
    };
    return () => es.close();
  }, [slug, toast]);

  const form = useForm<DeclareFormValues>({
    resolver: zodResolver(declareFormSchema),
    defaultValues: { donorName: "", amount: "", message: "" },
  });

  const declareMutation = useMutation({
    mutationFn: async (data: { donorName: string; amount: number; message?: string }) => {
      const response = await apiRequest("POST", "/api/contributions/declare", data);
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Merci !", description: "Votre contribution a été enregistrée." });
      setDeclareOpen(false);
      form.reset();
      setSelectedAmount(null);
      queryClient.invalidateQueries({ queryKey: ["/api/contributions/confirmed", slug] });
    },
    onError: (error: any) => {
      toast({
        title: "Erreur",
        description: error.message || "Une erreur est survenue.",
        variant: "destructive",
      });
    },
  });

  const handleAmountSelect = (amount: number) => {
    setSelectedAmount(amount);
    form.setValue("amount", amount.toString());
  };

  const onSubmitDeclare = (values: DeclareFormValues) => {
    const amountInCents = Math.round(parseFloat(values.amount) * 100);
    declareMutation.mutate({
      donorName: values.donorName,
      amount: amountInCents,
      message: values.message || undefined,
    });
  };

  if (!cagnotteEnabled) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <Card className="p-8 max-w-lg text-center">
          <h2 className="text-2xl font-serif font-bold mb-3">Cagnotte indisponible</h2>
          <p className="text-muted-foreground mb-6">Cette page a été désactivée par les mariés.</p>
          <Link href={basePath}>
            <Button>Retour au site</Button>
          </Link>
        </Card>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${templateTheme.pageBg}`}>
      <div className="relative">
        <div className="absolute inset-0 h-[50vh] md:h-[60vh]">
          {heroImage ? (
            <img src={heroImage} alt={displayTitle} className="w-full h-full object-cover object-top" />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-primary/20 via-background to-secondary" />
          )}
          <div className={`absolute inset-0 bg-gradient-to-b ${templateTheme.heroOverlay}`} />
        </div>

        <div className="relative z-10 pt-6 px-6">
          <Link href={basePath}>
            <Button variant="ghost" className={`text-white hover:bg-white/20 ${buttonRadiusClass}`}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              {cagnotteBackLabel}
            </Button>
          </Link>
        </div>

        <div className="relative z-10 pt-24 md:pt-32 pb-8 px-6 text-center">
          <h1 className="text-4xl md:text-5xl font-serif font-light text-white tracking-wider mb-4 drop-shadow-lg">
            {displayTitle}
          </h1>
          <p className="text-white/90 font-sans text-lg">{displayDate}</p>
        </div>
      </div>

      <div className="relative z-10 px-6 -mt-8 md:-mt-12">
        <div className="max-w-2xl mx-auto">
          <Card className={`p-6 md:p-8 ${templateTheme.cardClass}`}>
            <div className="text-center mb-8">
              <Gift className="h-10 w-10 mx-auto mb-4 text-primary" />
              <h2 className="text-2xl md:text-3xl font-serif font-light mb-3 text-foreground tracking-wide">
                {cagnotteTitle}
              </h2>
              <p className="text-muted-foreground font-sans text-sm md:text-base max-w-md mx-auto">
                {cagnotteDescription}
              </p>
            </div>

            <div className="mb-8">
              <Countdown weddingDate={countdownDate} />
            </div>

            <AnimatedMessages messages={messages} />

            {contributionMethods.length > 0 && (
              <div className="space-y-3 mb-8">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground text-center mb-4">
                  Comment contribuer
                </h3>
                <div className="grid gap-3 sm:grid-cols-2">
                  {contributionMethods.map((method) => (
                    <MethodCard key={method.id} method={method} buttonRadiusClass={buttonRadiusClass} />
                  ))}
                </div>
              </div>
            )}

            {contributionMethods.length === 0 && (
              <div className="text-center py-6 text-muted-foreground text-sm">
                Les moyens de contribution seront bientôt disponibles.
              </div>
            )}

            <div className="border-t border-primary/10 pt-6 mt-6">
              <Button
                onClick={() => setDeclareOpen(true)}
                className={`w-full h-14 text-base font-sans tracking-wider uppercase ${buttonToneClass} ${buttonRadiusClass}`}
              >
                <Send className="h-5 w-5 mr-2" />
                J'ai contribué
              </Button>
              <p className="text-center text-xs text-muted-foreground mt-3">
                Vous avez déjà envoyé votre contribution ? Déclarez-la ici pour que les mariés la voient.
              </p>
            </div>
          </Card>
        </div>
      </div>

      <Dialog open={declareOpen} onOpenChange={setDeclareOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-serif text-xl">Déclarer ma contribution</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmitDeclare)} className="space-y-4">
              <FormField
                control={form.control}
                name="donorName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Votre nom *</FormLabel>
                    <FormControl>
                      <Input placeholder="Prénom Nom" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="space-y-2">
                <FormLabel>Montant *</FormLabel>
                <div className="flex flex-wrap gap-2">
                  {suggestedAmounts.map((amount) => (
                    <Button
                      key={amount}
                      type="button"
                      variant={selectedAmount === amount ? "default" : "outline"}
                      size="sm"
                      className="flex-1 min-w-[60px]"
                      onClick={() => handleAmountSelect(amount)}
                    >
                      {amount} €
                    </Button>
                  ))}
                </div>
                <FormField
                  control={form.control}
                  name="amount"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <div className="relative">
                          <Input
                            type="number"
                            min="1"
                            step="1"
                            placeholder="Montant personnalisé"
                            className="pr-12"
                            {...field}
                            onChange={(e) => {
                              field.onChange(e);
                              setSelectedAmount(null);
                            }}
                          />
                          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground">€</span>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="message"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Message (optionnel)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Un petit mot pour les mariés..."
                        className="min-h-[80px] resize-none"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setDeclareOpen(false)}>
                  Annuler
                </Button>
                <Button type="submit" disabled={declareMutation.isPending}>
                  {declareMutation.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Envoi...
                    </>
                  ) : (
                    <>
                      <Heart className="h-4 w-4 mr-2" />
                      Confirmer
                    </>
                  )}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <footer className="py-8 px-6 text-center mt-8">
        <p className="text-sm text-muted-foreground font-sans">
          {displayTitle} &middot; {displayDate}
        </p>
        <p className="text-xs text-muted-foreground/60 mt-2 font-sans">Avec tout notre amour</p>
      </footer>
    </div>
  );
}
