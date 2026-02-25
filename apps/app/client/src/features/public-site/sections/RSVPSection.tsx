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

  const labelClass = tokens.rsvp.label;
  const inputClass = tokens.rsvp.input;

  return (
    <section
      id="rsvp"
      style={{ order: order ?? 0 }}
      className={`scroll-mt-24 px-6 ${tokens.rsvp.section}`}
    >
      <div className="max-w-3xl mx-auto">
        {!isSubmitted ? (
          <>
            <h1 className={`text-center mb-6 ${tokens.rsvp.title}`} style={{ color: 'var(--wedding-primary)' }}>
              <InlineEditor
                value={rsvpTitle}
                onSave={(val) => onSaveText("rsvpTitle", val)}
                canEdit={canEdit && editMode}
              />
            </h1>
            <div className={`text-center mb-16 max-w-xl mx-auto ${tokens.rsvp.description}`}>
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
                <div className="mb-10 p-5 rounded-2xl bg-white/70 backdrop-blur-xl border border-white/50 shadow-xl animate-in fade-in zoom-in-[0.98] duration-200">
                  <div className="text-[10px] tracking-[0.2em] uppercase text-muted-foreground/70 font-medium mb-2">Texte du bouton RSVP</div>
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
                          <FormLabel className={`${labelClass} text-[11px] tracking-wider uppercase font-medium opacity-70`}>Prénom *</FormLabel>
                          <FormControl><Input {...field} className={`${inputClass} transition-all duration-200`} placeholder="Marie" /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="lastName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className={`${labelClass} text-[11px] tracking-wider uppercase font-medium opacity-70`}>Nom *</FormLabel>
                          <FormControl><Input {...field} className={`${inputClass} transition-all duration-200`} placeholder="Dupont" /></FormControl>
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
                          <FormLabel className={`${labelClass} text-[11px] tracking-wider uppercase font-medium opacity-70`}>Adresse email *</FormLabel>
                          <FormControl><Input {...field} value={field.value ?? ""} type="email" className={`${inputClass} transition-all duration-200`} placeholder="marie@exemple.com" /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="availability"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className={`${labelClass} text-[11px] tracking-wider uppercase font-medium opacity-70`}>Serez-vous présent ? *</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger className={`${inputClass} transition-all duration-200`}>
                                <SelectValue placeholder="Choisissez votre réponse" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="confirmed">Oui, avec grand plaisir !</SelectItem>
                              <SelectItem value="declined">Non, malheureusement</SelectItem>
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
                        <FormItem className={`transition-all duration-300 ${watchedAvailability === "declined" ? "opacity-40 pointer-events-none" : ""}`}>
                          <FormLabel className={`${labelClass} text-[11px] tracking-wider uppercase font-medium opacity-70`}>Vous venez *</FormLabel>
                          <FormControl>
                            <RadioGroup
                              className="grid grid-cols-2 gap-3"
                              value={String(field.value ?? 1)}
                              onValueChange={(v) => field.onChange(Number(v))}
                              disabled={watchedAvailability === "declined"}
                            >
                              <label
                                className={`text-left flex items-center gap-3 px-4 py-4 cursor-pointer transition-all duration-200 ${tokens.rsvp.input} ${String(field.value) === "1" ? "ring-2 ring-primary/30 bg-primary/[0.04] scale-[1.01]" : "hover:bg-primary/[0.02]"}`}
                              >
                                <RadioGroupItem value="1" />
                                <div className="flex flex-col">
                                  <span className="text-sm font-semibold">Seul(e)</span>
                                  <span className="text-xs opacity-50">Je viens seul(e)</span>
                                </div>
                              </label>
                              <label
                                className={`text-left flex items-center gap-3 px-4 py-4 cursor-pointer transition-all duration-200 ${tokens.rsvp.input} ${String(field.value) === "2" ? "ring-2 ring-primary/30 bg-primary/[0.04] scale-[1.01]" : "hover:bg-primary/[0.02]"}`}
                              >
                                <RadioGroupItem value="2" />
                                <div className="flex flex-col">
                                  <span className="text-sm font-semibold">Accompagné(e)</span>
                                  <span className="text-xs opacity-50">Avec mon/ma partenaire</span>
                                </div>
                              </label>
                            </RadioGroup>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="hidden md:block" />
                  </div>
                  <Button type="submit" size="lg" className={`w-full h-16 text-lg font-bold shadow-xl transition-all duration-200 hover:shadow-2xl hover:scale-[1.01] ${buttonRadiusClass}`} style={{ backgroundColor: 'var(--wedding-primary)', borderColor: 'var(--wedding-primary)', color: '#fff' }} disabled={rsvpMutation.isPending}>
                    {rsvpMutation.isPending ? "Envoi..." : rsvpButton}
                  </Button>
                </form>
              </Form>
            </Card>
          </>
        ) : (
          <div className={`text-center py-20 rounded-3xl border ${tokens.rsvp.card}`}>
            <Check className="h-24 w-24 text-primary mx-auto mb-8 drop-shadow-xl" />
            <h3 className="text-4xl font-serif font-black mb-4">Merci !</h3>
            <p className="opacity-60 mb-10 text-lg">Nous avons bien reçu votre réponse.</p>
            <Button variant="outline" size="lg" className="rounded-full px-10" onClick={() => setIsSubmitted(false)}>Ajouter une autre réponse</Button>
          </div>
        )}
      </div>
    </section>
  );
}
