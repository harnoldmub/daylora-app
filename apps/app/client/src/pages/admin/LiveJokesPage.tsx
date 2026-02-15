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

export default function LiveJokesPage() {
  const { weddingId } = useParams<{ weddingId: string }>();
  const { toast } = useToast();
  const { data: wedding } = useWedding(weddingId);
  const updateWedding = useUpdateWedding();

  const [content, setContent] = useState("");
  const [tone, setTone] = useState<"safe" | "fun" | "second-degree">("safe");
  const [frequency, setFrequency] = useState(30);

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
      toast({ title: "Blague ajoutée" });
    },
    onError: (error: Error) => {
      toast({
        title: "Erreur",
        description: error.message || "Impossible d'ajouter la blague",
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
      toast({ title: "Blague supprimée" });
    },
  });

  const toggleJokes = async (enabled: boolean) => {
    if (!wedding) return;
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
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-serif font-bold">Blagues Live</h1>
          <p className="text-muted-foreground mt-1">Activez le module et gérez vos blagues personnalisées.</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-muted-foreground">Activer</span>
          <Switch
            checked={!!wedding?.config?.features?.jokesEnabled}
            onCheckedChange={toggleJokes}
          />
        </div>
      </div>

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
              Ajouter
            </Button>
          </div>
        </div>
      </Card>

      <Card className="p-6 space-y-4">
        <h2 className="text-lg font-medium">Blagues actives</h2>
        {jokes.length === 0 ? (
          <p className="text-muted-foreground text-sm">Aucune blague enregistrée.</p>
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
  );
}
