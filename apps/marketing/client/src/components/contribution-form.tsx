import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { Gift, Heart, CreditCard, Loader2 } from "lucide-react";
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
import { useToast } from "@/hooks/use-toast";
import { insertContributionSchema } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { z } from "zod";

const contributionFormSchema = z.object({
  donorName: z.string().min(1, "Veuillez entrer votre nom"),
  amount: z.string().min(1, "Veuillez entrer un montant").refine(
    (val) => {
      const num = parseFloat(val);
      return !isNaN(num) && num >= 1;
    },
    { message: "Le montant minimum est de 1 euro" }
  ),
});

type ContributionFormValues = z.infer<typeof contributionFormSchema>;

const suggestedAmounts = [20, 50, 100, 150, 200];

export function ContributionForm() {
  const { toast } = useToast();
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null);

  const form = useForm<ContributionFormValues>({
    resolver: zodResolver(contributionFormSchema),
    defaultValues: {
      donorName: "",
      amount: "",
    },
  });

  const checkoutMutation = useMutation({
    mutationFn: async (data: { donorName: string; amount: number }) => {
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
    });
  };

  return (
    <section id="cagnotte" className="py-24 md:py-32 px-6 bg-muted/30">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-12">
          <Gift className="h-12 w-12 mx-auto mb-6 text-primary" />
          <h2 className="text-3xl md:text-4xl font-serif font-light mb-4 text-foreground tracking-wide">
            CAGNOTTE MARIAGE
          </h2>
          <p className="text-muted-foreground font-sans max-w-xl mx-auto">
            Votre présence est notre plus beau cadeau. Si vous souhaitez contribuer à notre voyage de noces ou à notre nouveau départ, vous pouvez participer à notre cagnotte.
          </p>
        </div>

        <Card className="p-8 md:p-10 bg-card/80 backdrop-blur-sm">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
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

              <div className="space-y-4">
                <FormLabel className="text-sm font-sans uppercase tracking-wider text-foreground block">
                  Montant de votre contribution *
                </FormLabel>
                
                <div className="flex flex-wrap gap-3">
                  {suggestedAmounts.map((amount) => (
                    <Button
                      key={amount}
                      type="button"
                      variant={selectedAmount === amount ? "default" : "outline"}
                      className="flex-1 min-w-[80px]"
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
    </section>
  );
}
