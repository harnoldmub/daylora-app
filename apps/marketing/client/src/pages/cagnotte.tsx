import { useState, useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Gift, Heart, CreditCard, Loader2, ArrowLeft, MessageCircle } from "lucide-react";
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
import { Link } from "wouter";
import { type Contribution } from "@shared/schema";
import couplePhoto from "@assets/DSC_8913_1766077508558.jpg";

const contributionFormSchema = z.object({
  donorName: z.string().min(1, "Veuillez entrer votre nom"),
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

const suggestedAmounts = [20, 50, 100, 150, 200];

function Countdown() {
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  useEffect(() => {
    const weddingDate = new Date("2026-03-19T00:00:00");

    const timer = setInterval(() => {
      const now = new Date();
      const difference = weddingDate.getTime() - now.getTime();

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
  }, []);

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

  const { data: contributions } = useQuery<Contribution[]>({
    queryKey: ["/api/contributions/confirmed"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/contributions/confirmed");
      return response.json();
    },
  });

  const messages = contributions
    ?.map(c => c.message)
    .filter((m): m is string => !!m && m.length > 0) || [];

  const form = useForm<ContributionFormValues>({
    resolver: zodResolver(contributionFormSchema),
    defaultValues: {
      donorName: "",
      amount: "",
      message: "",
    },
  });

  const checkoutMutation = useMutation({
    mutationFn: async (data: { donorName: string; amount: number; message?: string }) => {
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
        title: "Erreur",
        description: error.message || "Impossible de créer la session de paiement",
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
      amount: amountInCents,
      message: values.message || undefined,
    });
  };

  const formatAmount = (cents: number) => {
    return new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: "EUR",
    }).format(cents / 100);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="relative">
        <div className="absolute inset-0 h-[50vh] md:h-[60vh]">
          <img
            src={couplePhoto}
            alt="Les Mariés"
            className="w-full h-full object-cover object-top"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/30 to-background" />
        </div>

        <div className="relative z-10 pt-6 px-6">
          <Link href="/">
            <Button variant="ghost" className="text-white hover:bg-white/20" data-testid="button-back-home">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Retour
            </Button>
          </Link>
        </div>

        <div className="relative z-10 pt-24 md:pt-32 pb-8 px-6 text-center">
          <h1 className="text-4xl md:text-5xl font-serif font-light text-white tracking-wider mb-4 drop-shadow-lg">
            Les Mariés
          </h1>
          <p className="text-white/90 font-sans text-lg">19 & 21 Mars 2026</p>
        </div>
      </div>

      <div className="relative z-10 px-6 -mt-8 md:-mt-12">
        <div className="max-w-2xl mx-auto">
          <Card className="p-6 md:p-8 shadow-lg">
            <div className="text-center mb-8">
              <Gift className="h-10 w-10 mx-auto mb-4 text-primary" />
              <h2 className="text-2xl md:text-3xl font-serif font-light mb-3 text-foreground tracking-wide">
                CAGNOTTE MARIAGE
              </h2>
              <p className="text-muted-foreground font-sans text-sm md:text-base max-w-md mx-auto">
                Votre présence est notre plus beau cadeau. Si vous souhaitez contribuer à notre voyage de noces ou à notre nouveau départ, vous pouvez participer à notre cagnotte.
              </p>
            </div>

            <div className="mb-8">
              <Countdown />
            </div>

            <AnimatedMessages messages={messages} />

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
                  className="w-full h-14 text-base font-sans tracking-wider uppercase"
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
                      Contribuer
                    </>
                  )}
                </Button>

                <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
                  <Heart className="h-3 w-3" />
                  <span>Paiement sécurisé par Stripe</span>
                </div>
              </form>
            </Form>
          </Card>
        </div>
      </div>

      <footer className="py-8 px-6 text-center mt-8">
        <p className="text-sm text-muted-foreground font-sans">
          Les Mariés &middot; 19 & 21 Mars 2026
        </p>
        <p className="text-xs text-muted-foreground/60 mt-2 font-sans">
          Avec tout notre amour
        </p>
      </footer>
    </div>
  );
}
