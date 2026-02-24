import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams } from "wouter";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useWedding, useUpdateWedding } from "@/hooks/use-api";
import type { LiveJoke } from "@shared/schema";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { PremiumGate } from "@/components/admin/PremiumGate";

export default function LiveJokesPage() {
  const { weddingId } = useParams<{ weddingId: string }>();
  const { toast } = useToast();
  const { data: wedding } = useWedding(weddingId);
  const updateWedding = useUpdateWedding();

  const [content, setContent] = useState("");
  const [tone, setTone] = useState<"safe" | "fun" | "second-degree">("safe");
  const [frequency, setFrequency] = useState(30);
  const [manualDonorName, setManualDonorName] = useState("");
  const [manualAmount, setManualAmount] = useState(50);
  const [manualMessage, setManualMessage] = useState("");

  const { data: jokes = [] } = useQuery<LiveJoke[]>({
    queryKey: ["/api/jokes", weddingId],
    queryFn: async () => {
      if (!weddingId) return [];
      const res = await apiRequest("GET", "/api/jokes");
      return res.json();
    },
    enabled: !!weddingId,
  });

  const createJoke = useMutation({
    mutationFn: async () => {
      if (!weddingId) {
        throw new Error("Mariage introuvable");
      }
      const res = await apiRequest("POST", "/api/jokes", {
        content,
        tone,
        frequency,
      });
      return res.json();
    },
    onSuccess: () => {
      setContent("");
      queryClient.invalidateQueries({ queryKey: ["/api/jokes", weddingId] });
      toast({ title: "Blague ajoutée", description: "Elle est maintenant active pour le live." });
    },
    onError: (error: Error) => {
      toast({
        title: "Ajout impossible",
        description: error.message || "Impossible d'ajouter cette blague.",
        variant: "destructive",
      });
    },
  });

  const deleteJoke = useMutation({
    mutationFn: async (id: number) => {
      if (!weddingId) {
        throw new Error("Mariage introuvable");
      }
      const res = await apiRequest("DELETE", `/api/jokes/${id}`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/jokes", weddingId] });
      toast({ title: "Blague supprimée", description: "Elle ne sera plus diffusée dans le live." });
    },
    onError: (error: Error) => {
      toast({
        title: "Suppression impossible",
        description: error.message || "Impossible de supprimer cette blague.",
        variant: "destructive",
      });
    },
  });

  const createManualContribution = useMutation({
    mutationFn: async () => {
      if (!weddingId) {
        throw new Error("Mariage introuvable");
      }
      const amount = Math.round(Math.max(1, Number(manualAmount || 0)) * 100);
      const res = await apiRequest("POST", "/api/contributions/manual", {
        donorName: manualDonorName,
        amount,
        message: manualMessage || null,
      });
      return res.json();
    },
    onSuccess: () => {
      setManualDonorName("");
      setManualAmount(50);
      setManualMessage("");
      queryClient.invalidateQueries({ queryKey: ["/api/contributions/live", weddingId] });
      toast({ title: "Contribution ajoutée", description: "Le live public a été mis à jour." });
    },
    onError: (error: Error) => {
      toast({
        title: "Ajout impossible",
        description: error.message || "Impossible d'ajouter la contribution manuelle.",
        variant: "destructive",
      });
    },
  });

  const toggleJokes = async (enabled: boolean) => {
    if (!wedding) return;
    try {
      await updateWedding.mutateAsync({
        id: wedding.id,
        config: {
          ...wedding.config,
          features: {
            ...wedding.config.features,
            jokesEnabled: enabled,
          },
        },
      });
      toast({
        title: enabled ? "Module activé" : "Module désactivé",
        description: enabled
          ? "Les blagues peuvent être diffusées sur le live."
          : "Les blagues sont mises en pause.",
      });
    } catch (error: any) {
      toast({
        title: "Mise à jour impossible",
        description: error?.message || "Impossible de modifier l'état du module.",
        variant: "destructive",
      });
    }
  };

  return (
    <PremiumGate featureName="Les blagues live" isPremium={wedding?.currentPlan === 'premium'}>
    <div className="space-y-8">
      <AdminPageHeader
        title="Blagues Live"
        description="Activez le module et gérez vos blagues pour l'affichage en direct."
        actions={
          <div className="flex items-center gap-3">
            {wedding?.slug && (
              <Button variant="outline" size="sm" asChild>
                <a href={`/${wedding.slug}/live`} target="_blank" rel="noopener noreferrer">
                  Voir la page live
                </a>
              </Button>
            )}
            <span className="text-sm text-muted-foreground">Activer</span>
            <Switch
              checked={!!wedding?.config?.features?.jokesEnabled}
              onCheckedChange={toggleJokes}
            />
          </div>
        }
      />

      <Card className="p-6 space-y-4">
        <h2 className="text-lg font-medium">Ajouter une blague</h2>
        <Textarea
          placeholder="Écrivez une blague courte et élégante..."
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={3}
        />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Ton</label>
            <select
              className="w-full border border-border rounded-md h-10 px-3 bg-background"
              value={tone}
              onChange={(e) => setTone(e.target.value as any)}
            >
              <option value="safe">Safe</option>
              <option value="fun">Fun</option>
              <option value="second-degree">Second degré</option>
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Fréquence (sec)</label>
            <Input
              type="number"
              min={5}
              value={frequency}
              onChange={(e) => setFrequency(parseInt(e.target.value || "30", 10))}
            />
          </div>
          <div className="flex items-end">
            <Button
              onClick={() => createJoke.mutate()}
              disabled={!content.trim()}
              className="w-full"
            >
              Ajouter au live
            </Button>
          </div>
        </div>
      </Card>

      <Card className="p-6 space-y-4">
        <h2 className="text-lg font-medium">Contribution manuelle (live)</h2>
        <p className="text-sm text-muted-foreground">
          À utiliser quand la cagnotte est externe (Leetchi, PayPal...) pour alimenter le live à la main.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Donateur</label>
            <Input
              value={manualDonorName}
              onChange={(e) => setManualDonorName(e.target.value)}
              placeholder="Ex: Famille Dupont"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Montant (€)</label>
            <Input
              type="number"
              min={1}
              value={manualAmount}
              onChange={(e) => setManualAmount(parseInt(e.target.value || "0", 10))}
            />
          </div>
          <div className="flex items-end">
            <Button
              onClick={() => createManualContribution.mutate()}
              disabled={!manualDonorName.trim() || createManualContribution.isPending || wedding?.config?.payments?.allowManualLiveContributions === false}
              className="w-full"
            >
              {createManualContribution.isPending ? "Ajout..." : "Ajouter au live"}
            </Button>
          </div>
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Message (optionnel)</label>
          <Textarea
            value={manualMessage}
            onChange={(e) => setManualMessage(e.target.value)}
            rows={2}
            placeholder="Un mot à afficher avec la contribution."
          />
        </div>
        {wedding?.config?.payments?.allowManualLiveContributions === false ? (
          <p className="text-xs text-destructive">
            Les contributions manuelles sont désactivées dans les paramètres du projet.
          </p>
        ) : null}
      </Card>

      <Card className="p-6 space-y-4">
        <h2 className="text-lg font-medium">Blagues actives</h2>
        {jokes.length === 0 ? (
          <p className="text-muted-foreground text-sm">Aucune blague active pour le moment.</p>
        ) : (
          <div className="space-y-3">
            {jokes.map((joke) => (
              <div key={joke.id} className="flex items-center justify-between border rounded-md p-3">
                <div>
                  <p className="font-medium">{joke.content}</p>
                  <p className="text-xs text-muted-foreground">Ton: {joke.tone} • {joke.frequency || 30}s</p>
                </div>
                <Button variant="outline" size="sm" onClick={() => deleteJoke.mutate(joke.id)}>
                  Supprimer
                </Button>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
    </PremiumGate>
  );
}
