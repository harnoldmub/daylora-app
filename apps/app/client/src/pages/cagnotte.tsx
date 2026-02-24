import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Gift, Heart, CreditCard, Loader2, ArrowLeft, MessageCircle, ExternalLink } from "lucide-react";
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
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { z } from "zod";
import { Link, useParams } from "wouter";
import { type Contribution } from "@shared/schema";
import { useWedding } from "@/hooks/use-api";
import { getButtonClass } from "@/lib/design-presets";

const contributionFormSchema = z.object({
  donorName: z.string().min(1, "Veuillez entrer votre nom"),
  donorEmail: z.string().email("Email invalide").optional().or(z.literal("")),
  amount: z.string().min(1, "Veuillez entrer un montant").refine(
    (val) => {
      const num = parseFloat(val);
      return !isNaN(num) && num >= 1;
    },
    { message: "Le montant minimum est de 1 euro" }
  ),
  message: z.string().optional(),
});

type ContributionFormValues = z.infer<typeof contributionFormSchema>;

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
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  useEffect(() => {
    const targetDate = new Date(weddingDate);

    const timer = setInterval(() => {
      const now = new Date();
      const difference = targetDate.getTime() - now.getTime();

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
        { value: timeLeft.days, label: "Jours", testId: "countdown-days" },
        { value: timeLeft.hours, label: "Heures", testId: "countdown-hours" },
        { value: timeLeft.minutes, label: "Minutes", testId: "countdown-minutes" },
        { value: timeLeft.seconds, label: "Secondes", testId: "countdown-seconds" },
      ].map((item, idx) => (
        <div key={idx} className="flex flex-col items-center">
          <div className="w-14 h-14 md:w-16 md:h-16 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
            <span
              className="text-xl md:text-2xl font-serif font-bold text-primary"
              data-testid={item.testId}
            >
              {item.value.toString().padStart(2, "0")}
            </span>
          </div>
          <span className="text-xs text-muted-foreground mt-1 font-sans">
            {item.label}
          </span>
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
      <div
        className={`text-center transition-all duration-500 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
          }`}
      >
        <p className="text-lg md:text-xl font-serif italic text-foreground/90 leading-relaxed px-4">
          « {messages[currentIndex]} »
        </p>
      </div>
      {messages.length > 1 && (
        <div className="flex justify-center gap-1.5 mt-6">
          {messages.map((_, idx) => (
            <div
              key={idx}
              className={`h-1.5 rounded-full transition-all duration-300 ${idx === currentIndex
                ? 'bg-primary w-8'
                : 'bg-primary/20 w-1.5'
                }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function CagnottePage() {
  const { toast } = useToast();
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
    ?.map(c => c.message)
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
  const cagnotteSubmitLabel = wedding?.config?.texts?.cagnotteSubmitLabel || "Contribuer";
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
  const paymentMode = wedding?.config?.payments?.mode || (((wedding?.config?.sections as any)?.cagnotteExternalUrl || "") ? "external" : "stripe");
  const externalCagnotteUrl =
    wedding?.config?.payments?.externalUrl ||
    (wedding?.config?.sections as any)?.cagnotteExternalUrl ||
    "";

  useEffect(() => {
    if (!slug) return;
    const es = new EventSource(`/api/live/stream?slug=${slug}`);
    es.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data);
        if (payload?.type === "joke_shown") {
          toast({
            title: "Blague live",
            description: payload.payload?.content || "Nouvelle blague",
          });
        }
      } catch {
        // ignore
      }
    };
    return () => es.close();
  }, [slug, toast]);

  useEffect(() => {
    if (!slug) return;
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/jokes/next?slug=${slug}`);
        if (!res.ok) return;
        const data = await res.json();
        if (data?.joke?.content) {
          toast({
            title: "Blague live",
            description: data.joke.content,
          });
        }
      } catch {
        // ignore
      }
    }, 30000);
    return () => clearInterval(interval);
  }, [slug, toast]);

  const form = useForm<ContributionFormValues>({
    resolver: zodResolver(contributionFormSchema),
    defaultValues: {
      donorName: "",
      donorEmail: "",
      amount: "",
      message: "",
    },
  });

  const checkoutMutation = useMutation({
    mutationFn: async (data: { donorName: string; donorEmail?: string; amount: number; message?: string }) => {
      const response = await apiRequest("POST", "/api/create-checkout-session", data);
      return response.json();
    },
    onSuccess: (data) => {
      if (data.url) {
        window.location.href = data.url;
      }
    },
    onError: (error: any) => {
      toast({
        title: "Paiement indisponible",
        description: error.message || "Impossible de lancer la contribution.",
        variant: "destructive",
      });
    },
  });

  const handleAmountSelect = (amount: number) => {
    setSelectedAmount(amount);
    form.setValue("amount", amount.toString());
  };

  const onSubmit = (values: ContributionFormValues) => {
    const amountInCents = Math.round(parseFloat(values.amount) * 100);
    checkoutMutation.mutate({
      donorName: values.donorName,
      donorEmail: values.donorEmail || undefined,
      amount: amountInCents,
      message: values.message || undefined,
    });
  };

  return (
    !cagnotteEnabled ? (
              <div className="min-h-screen flex items-center justify-center p-6">
                <Card className="p-8 max-w-lg text-center">
                  <h2 className="text-2xl font-serif font-bold mb-3">Cagnotte indisponible</h2>
                  <p className="text-muted-foreground mb-6">Cette page a été désactivée par les mariés.</p>
                          <Link href={basePath}>
                            <Button>Retour au site</Button>
                          </Link>
                </Card>
              </div>
    ) : (
    <div className={`min-h-screen ${templateTheme.pageBg}`}>
      <div className="relative">
        <div className="absolute inset-0 h-[50vh] md:h-[60vh]">
          {heroImage ? (
            <img
              src={heroImage}
              alt={displayTitle}
              className="w-full h-full object-cover object-top"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-primary/20 via-background to-secondary" />
          )}
          <div className={`absolute inset-0 bg-gradient-to-b ${templateTheme.heroOverlay}`} />
        </div>

        <div className="relative z-10 pt-6 px-6">
                  <Link href={basePath}>
                    <Button variant="ghost" className={`text-white hover:bg-white/20 ${buttonRadiusClass}`} data-testid="button-back-home">
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
              {paymentMode === "external" ? (
                <div className="inline-flex items-center justify-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-4 py-1 text-[10px] font-semibold uppercase tracking-widest text-primary mb-4">
                  Paiement externe
                </div>
              ) : null}
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

            {paymentMode === "external" ? (
              <div className="space-y-6">
                <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 text-sm text-foreground">
                  Cette cagnotte utilise un lien externe. Cliquez sur le bouton ci-dessous pour contribuer.
                </div>
                {externalCagnotteUrl ? (
                  <Button
                    type="button"
                    asChild
                    className={`w-full h-14 text-base font-sans tracking-wider uppercase ${buttonToneClass} ${buttonRadiusClass}`}
                    data-testid="button-external-cagnotte"
                  >
                    <a href={externalCagnotteUrl} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="h-5 w-5 mr-2" />
                      {cagnotteSubmitLabel}
                    </a>
                  </Button>
                ) : (
                  <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
                    Le lien externe n'est pas encore configuré.
                  </div>
                )}
              </div>
            ) : (
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="donorName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-sans uppercase tracking-wider text-foreground">
                        Votre Nom *
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Entrez votre nom complet"
                          className="h-12 border-border/50 focus:border-primary bg-background/50"
                          data-testid="input-donor-name"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="donorEmail"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-sans uppercase tracking-wider text-foreground">
                        Votre Email (optionnel)
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="email"
                          placeholder="email@exemple.com"
                          className="h-12 border-border/50 focus:border-primary bg-background/50"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="space-y-3">
                  <FormLabel className="text-sm font-sans uppercase tracking-wider text-foreground block">
                    Montant de votre contribution *
                  </FormLabel>

                  <div className="flex flex-wrap gap-2">
                    {suggestedAmounts.map((amount) => (
                      <Button
                        key={amount}
                        type="button"
                        variant={selectedAmount === amount ? "default" : "outline"}
                        className="flex-1 min-w-[70px]"
                        onClick={() => handleAmountSelect(amount)}
                        data-testid={`button-amount-${amount}`}
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
                        <FormLabel className="text-xs text-muted-foreground">
                          Ou entrez un montant personnalisé (en euros)
                        </FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Input
                              type="number"
                              min="1"
                              step="1"
                              placeholder="Montant en euros"
                              className="h-12 border-border/50 focus:border-primary bg-background/50 pr-12"
                              data-testid="input-custom-amount"
                              {...field}
                              onChange={(e) => {
                                field.onChange(e);
                                setSelectedAmount(null);
                              }}
                            />
                            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground">
                              €
                            </span>
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
                      <FormLabel className="text-sm font-sans uppercase tracking-wider text-foreground">
                        Votre Message (optionnel)
                      </FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Laissez un petit mot pour les mariés..."
                          className="min-h-[100px] border-border/50 focus:border-primary bg-background/50 resize-none"
                          data-testid="input-message"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button
                  type="submit"
                  className={`w-full h-14 text-base font-sans tracking-wider uppercase ${buttonToneClass} ${buttonRadiusClass}`}
                  disabled={checkoutMutation.isPending}
                  data-testid="button-contribute"
                >
                  {checkoutMutation.isPending ? (
                    <>
                      <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                      Redirection vers Stripe...
                    </>
                  ) : (
                    <>
                      <CreditCard className="h-5 w-5 mr-2" />
                      {cagnotteSubmitLabel}
                    </>
                  )}
                </Button>

                <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
                  <Heart className="h-3 w-3" />
                  <span>Paiement sécurisé par Stripe</span>
                </div>
              </form>
            </Form>
            )}
          </Card>
        </div>
      </div>

      <footer className="py-8 px-6 text-center mt-8">
        <p className="text-sm text-muted-foreground font-sans">
          {displayTitle} &middot; {displayDate}
        </p>
        <p className="text-xs text-muted-foreground/60 mt-2 font-sans">
          Avec tout notre amour
        </p>
      </footer>
    </div>
    )
  );
}
