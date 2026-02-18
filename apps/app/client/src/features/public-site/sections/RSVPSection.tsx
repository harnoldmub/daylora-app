import { useState, useEffect } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Check } from "lucide-react";
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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { InlineEditor } from "@/components/ui/inline-editor";
import {
  insertRsvpResponseSchema,
  type InsertRsvpResponse,
} from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import type { RSVPSectionProps } from "@/features/public-site/types";

export function RSVPSection({
  tokens,
  wedding,
  rsvpTitle,
  rsvpDescription,
  rsvpButton,
  buttonToneClass,
  buttonRadiusClass,
  onSaveText,
  canEdit,
  editMode,
  order,
}: RSVPSectionProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isSubmitted, setIsSubmitted] = useState(false);

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

  const watchedAvailability = useWatch({
    control: form.control,
    name: "availability",
  });

  useEffect(() => {
    if (watchedAvailability === "declined") form.setValue("partySize", 1, { shouldDirty: true, shouldValidate: true });
  }, [watchedAvailability, form]);

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

  return (
    <section
      id="rsvp"
      style={{ order: order ?? 0 }}
      className={`scroll-mt-24 py-32 px-6 ${tokens.rsvp.section}`}
    >
      <div className="max-w-3xl mx-auto">
        {!isSubmitted ? (
          <>
            <h1 className="text-4xl md:text-6xl font-serif font-light text-center mb-6 text-foreground tracking-tight">
              <InlineEditor
                value={rsvpTitle}
                onSave={(val) => onSaveText("rsvpTitle", val)}
                canEdit={canEdit && editMode}
              />
            </h1>
            <div className="text-center text-muted-foreground mb-16 max-w-xl mx-auto">
              <InlineEditor
                value={rsvpDescription}
                onSave={(val) => onSaveText("rsvpDescription", val)}
                canEdit={canEdit && editMode}
                isTextArea={true}
                className="text-center"
              />
            </div>

            <Card className={`relative overflow-hidden ${tokens.rsvp.card}`}>
              {canEdit && editMode ? (
                <div className="mb-10 p-6 rounded-3xl bg-primary/5 border border-primary/10">
                  <div className="text-[11px] uppercase tracking-widest text-primary font-bold mb-3">Texte du bouton RSVP</div>
                  <InlineEditor
                    value={rsvpButton}
                    onSave={(val) => onSaveText("rsvpButton", val)}
                    canEdit={canEdit && editMode}
                    placeholder="Je confirme ma présence"
                  />
                </div>
              ) : null}
              <Form {...form}>
                <form onSubmit={form.handleSubmit((d) => rsvpMutation.mutate(d))} className="space-y-10">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <FormField
                      control={form.control}
                      name="firstName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs uppercase tracking-widest font-bold opacity-60">Prénom *</FormLabel>
                          <FormControl><Input {...field} className="h-14 rounded-2xl bg-white/50 border-primary/10 focus:ring-primary/20" placeholder="Votre prénom" /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="lastName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs uppercase tracking-widest font-bold opacity-60">Nom *</FormLabel>
                          <FormControl><Input {...field} className="h-14 rounded-2xl bg-white/50 border-primary/10 focus:ring-primary/20" placeholder="Votre nom" /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs uppercase tracking-widest font-bold opacity-60">Adresse email *</FormLabel>
                          <FormControl><Input {...field} value={field.value ?? ""} type="email" className="h-14 rounded-2xl bg-white/50 border-primary/10 focus:ring-primary/20" placeholder="votre@email.com" /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="availability"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs uppercase tracking-widest font-bold opacity-60">Serez-vous présent ? *</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger className="h-14 rounded-2xl bg-white/50 border-primary/10 focus:ring-primary/20">
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
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <FormField
                      control={form.control}
                      name="partySize"
                      render={({ field }) => (
                        <FormItem className={watchedAvailability === "declined" ? "opacity-60" : ""}>
                          <FormLabel className="text-xs uppercase tracking-widest font-bold opacity-60">Vous venez *</FormLabel>
                          <FormControl>
                            <RadioGroup
                              className="grid grid-cols-2 gap-3"
                              value={String(field.value ?? 1)}
                              onValueChange={(v) => field.onChange(Number(v))}
                              disabled={watchedAvailability === "declined"}
                            >
                              <button
                                type="button"
                                className="text-left flex items-center gap-3 rounded-2xl border border-primary/10 bg-white/50 px-4 py-4 hover:bg-white/70 transition-colors"
                                onClick={() => field.onChange(1)}
                              >
                                <RadioGroupItem value="1" />
                                <div className="flex flex-col">
                                  <span className="text-sm font-semibold">Solo</span>
                                  <span className="text-xs text-muted-foreground">Je viens seul(e)</span>
                                </div>
                              </button>
                              <button
                                type="button"
                                className="text-left flex items-center gap-3 rounded-2xl border border-primary/10 bg-white/50 px-4 py-4 hover:bg-white/70 transition-colors"
                                onClick={() => field.onChange(2)}
                              >
                                <RadioGroupItem value="2" />
                                <div className="flex flex-col">
                                  <span className="text-sm font-semibold">Couple</span>
                                  <span className="text-xs text-muted-foreground">Je viens avec mon/ma partenaire</span>
                                </div>
                              </button>
                            </RadioGroup>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="hidden md:block" />
                  </div>
                  <Button type="submit" size="lg" className={`w-full h-16 rounded-2xl text-lg font-bold shadow-xl shadow-primary/20 ${buttonRadiusClass} ${buttonToneClass}`} disabled={rsvpMutation.isPending}>
                    {rsvpMutation.isPending ? "Envoi..." : rsvpButton}
                  </Button>
                </form>
              </Form>
            </Card>
          </>
        ) : (
          <div className="text-center py-20 bg-white/50 rounded-[4rem] border border-primary/10">
            <Check className="h-24 w-24 text-primary mx-auto mb-8 drop-shadow-xl" />
            <h3 className="text-4xl font-serif font-black mb-4">Merci !</h3>
            <p className="text-muted-foreground mb-10 text-lg">Nous avons bien reçu votre réponse.</p>
            <Button variant="outline" size="lg" className="rounded-full px-10" onClick={() => setIsSubmitted(false)}>Ajouter une autre réponse</Button>
          </div>
        )}
      </div>
    </section>
  );
}
