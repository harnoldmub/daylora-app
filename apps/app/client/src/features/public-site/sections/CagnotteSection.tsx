import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Gift as GiftIcon, ExternalLink, Phone, Building2, CreditCard, Copy, Check, Send, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { InlineEditor } from "@/components/ui/inline-editor";
import type { CagnotteSectionProps } from "@/features/public-site/types";
import type { ContributionMethod } from "@shared/schema";
import { z } from "zod";

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
              {method.accountNumber && (
                <div className="flex items-center gap-2 bg-muted/50 rounded-lg px-3 py-2">
                  <div className="flex-1">
                    <div className="text-[10px] uppercase tracking-wider text-muted-foreground">N° de compte</div>
                    <div className="font-mono text-xs break-all">{method.accountNumber}</div>
                  </div>
                  <CopyButton text={method.accountNumber} label="Copier" />
                </div>
              )}
              {method.iban && (
                <div className="flex items-center gap-2 bg-muted/50 rounded-lg px-3 py-2">
                  <div className="flex-1">
                    <div className="text-[10px] uppercase tracking-wider text-muted-foreground">IBAN</div>
                    <div className="font-mono text-xs break-all">{method.iban}</div>
                  </div>
                  <CopyButton text={method.iban} label="Copier" />
                </div>
              )}
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

export function CagnotteSection({
  tokens,
  cagnotteTitle,
  cagnotteDescription,
  cagnotteSubmitLabel,
  contributionMethods,
  suggestedAmounts,
  slug,
  buttonRadiusClass,
  onSaveText,
  canEdit,
  editMode,
  order,
}: CagnotteSectionProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [declareOpen, setDeclareOpen] = useState(false);
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null);

  const enabledMethods = contributionMethods.filter((m) => m.enabled).sort((a, b) => a.sortOrder - b.sortOrder);

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

  return (
    <section
      id="cagnotte"
      style={{ order }}
      className={`scroll-mt-24 py-24 px-6 ${tokens.cagnotte.section}`}
    >
      <div className="max-w-3xl mx-auto text-center space-y-6">
        <div className="w-16 h-16 mx-auto rounded-full flex items-center justify-center mb-6" style={{ backgroundColor: 'color-mix(in srgb, var(--wedding-primary) 10%, transparent)' }}>
          <GiftIcon className="h-8 w-8" style={{ color: 'var(--wedding-primary)' }} />
        </div>
        <h2 className="text-4xl md:text-5xl font-serif font-light mb-4 tracking-wide" style={{ color: 'var(--wedding-primary)' }}>
          <InlineEditor
            value={cagnotteTitle}
            onSave={(val) => onSaveText("cagnotteTitle", val)}
            canEdit={canEdit && editMode}
          />
        </h2>
        <div className="opacity-60 leading-relaxed max-w-2xl mx-auto text-base">
          <InlineEditor
            value={cagnotteDescription}
            onSave={(val) => onSaveText("cagnotteDescription", val)}
            canEdit={canEdit && editMode}
            isTextArea
          />
        </div>

        {enabledMethods.length > 0 && (
          <div className="mt-10 space-y-4">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-4">
              Comment contribuer
            </h3>
            <div className="grid gap-3 sm:grid-cols-2 text-left">
              {enabledMethods.map((method) => (
                <MethodCard key={method.id} method={method} buttonRadiusClass={buttonRadiusClass} />
              ))}
            </div>
          </div>
        )}

        {enabledMethods.length > 0 && (
          <div className="mt-8">
            <Button
              onClick={() => setDeclareOpen(true)}
              variant="outline"
              className={`px-10 py-6 text-xs tracking-[0.2em] uppercase font-semibold ${buttonRadiusClass}`}
              style={{
                borderColor: 'var(--wedding-primary)',
                color: 'var(--wedding-primary)',
              }}
            >
              <Send className="h-4 w-4 mr-2" />
              <InlineEditor
                value={cagnotteSubmitLabel}
                onSave={(val) => onSaveText("cagnotteSubmitLabel", val)}
                canEdit={canEdit && editMode}
              />
            </Button>
            <p className="text-center text-xs text-muted-foreground mt-2">
              Vous avez déjà envoyé votre contribution ? Déclarez-la ici.
            </p>
          </div>
        )}

        {enabledMethods.length === 0 && canEdit && editMode && (
          <div className="mt-10 flex justify-center animate-in fade-in duration-200">
            <div className="text-xs text-muted-foreground/50 font-medium px-5 py-2.5 rounded-full border border-dashed border-muted-foreground/20">
              Configurez vos moyens de contribution dans le design (section cagnotte)
            </div>
          </div>
        )}
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
                    "Envoyer"
                  )}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </section>
  );
}
