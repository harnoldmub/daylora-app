import { useMemo, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
  Gift,
  Plus,
  Trash2,
  Edit,
  Loader2,
  Euro,
  TrendingUp,
  ListChecks,
  Sparkles,
  RotateCcw,
  Link,
  ExternalLink,
  Image,
} from "lucide-react";
import { useParams } from "wouter";
import { Button } from "@/components/ui/button";
import { useWedding } from "@/hooks/use-api";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Gift as GiftType } from "@shared/schema";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { KpiCard } from "@/components/admin/KpiCard";
import { GuidedTour, useShouldShowTour } from "@/components/guided-tour";

type GiftForm = {
  name: string;
  description: string;
  imageUrl: string;
  sourceUrl: string;
  price: number | null;
};

const emptyForm: GiftForm = {
  name: "",
  description: "",
  imageUrl: "",
  sourceUrl: "",
  price: null,
};

const SUGGESTION_GIFTS: GiftForm[] = [
  { name: "Voyage de noces", description: "Contribuez à notre lune de miel de rêve.", imageUrl: "", sourceUrl: "", price: 500 },
  { name: "Appareil photo", description: "Pour immortaliser nos plus beaux souvenirs.", imageUrl: "", sourceUrl: "", price: 350 },
  { name: "Service de table", description: "Un beau service pour nos dîners en amoureux.", imageUrl: "", sourceUrl: "", price: 200 },
  { name: "Grille-pain", description: "Pour des petits-déjeuners gourmands.", imageUrl: "", sourceUrl: "", price: 60 },
  { name: "Robot cuisine", description: "Pour préparer de bons petits plats ensemble.", imageUrl: "", sourceUrl: "", price: 300 },
  { name: "Linge de maison", description: "Draps, serviettes et accessoires pour notre nid douillet.", imageUrl: "", sourceUrl: "", price: 150 },
  { name: "Expérience bien-être", description: "Un moment de détente en duo dans un spa.", imageUrl: "", sourceUrl: "", price: 180 },
  { name: "Cours de cuisine", description: "Un atelier culinaire pour apprendre à deux.", imageUrl: "", sourceUrl: "", price: 120 },
  { name: "Panier gourmet", description: "Une sélection de produits fins et délicieux.", imageUrl: "", sourceUrl: "", price: 80 },
  { name: "Cadre photo", description: "Pour encadrer nos plus belles photos de mariage.", imageUrl: "", sourceUrl: "", price: 50 },
];

export default function GiftsPage() {
  const { weddingId } = useParams<{ weddingId: string }>();
  const { toast } = useToast();
  const { data: wedding } = useWedding(weddingId);
  const showTour = useShouldShowTour("gifts");

  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [editingGift, setEditingGift] = useState<GiftType | null>(null);
  const [deletingGift, setDeletingGift] = useState<GiftType | null>(null);
  const [form, setForm] = useState<GiftForm>(emptyForm);

  const { data: gifts = [], isLoading } = useQuery<GiftType[]>({
    queryKey: ["/api/gifts", weddingId],
    enabled: !!weddingId,
  });

  const { data: totalData } = useQuery<{ total: number }>({
    queryKey: ["/api/contributions/total", weddingId],
    enabled: !!weddingId,
  });

  const [scraping, setScraping] = useState(false);

  const scrapeUrl = async (url: string) => {
    if (!url.trim()) return;
    setScraping(true);
    try {
      const response = await apiRequest("POST", "/api/gifts/scrape-url", { url: url.trim() });
      const data = await response.json();
      setForm((prev) => ({
        ...prev,
        name: prev.name || data.title || "",
        imageUrl: data.image || prev.imageUrl || "",
        description: prev.description || data.description || "",
        price: prev.price ?? data.price ?? null,
      }));
      toast({ title: "Informations récupérées", description: "Le nom et l'image du produit ont été importés." });
    } catch {
      toast({
        title: "Récupération impossible",
        description: "Impossible de récupérer les informations de cette page. Remplissez les champs manuellement.",
        variant: "destructive",
      });
    } finally {
      setScraping(false);
    }
  };

  const createGiftMutation = useMutation({
    mutationFn: async (data: GiftForm) => {
      const payload = {
        name: data.name,
        description: data.description || null,
        imageUrl: data.imageUrl || null,
        sourceUrl: data.sourceUrl || null,
        price: data.price,
      };
      const response = await apiRequest("POST", "/api/gifts", payload);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/gifts"] });
      toast({ title: "Cadeau ajouté", description: "L'élément est maintenant visible dans votre liste." });
      setCreateOpen(false);
      setForm(emptyForm);
    },
    onError: (error: Error) => {
      toast({
        title: "Ajout impossible",
        description: error.message || "Impossible d'ajouter ce cadeau.",
        variant: "destructive",
      });
    },
  });

  const updateGiftMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: GiftForm }) => {
      const payload = {
        name: data.name,
        description: data.description || null,
        imageUrl: data.imageUrl || null,
        sourceUrl: data.sourceUrl || null,
        price: data.price,
      };
      const response = await apiRequest("PATCH", `/api/gifts/${id}`, payload);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/gifts"] });
      toast({ title: "Cadeau mis à jour", description: "Les modifications ont bien été enregistrées." });
      setEditOpen(false);
      setEditingGift(null);
      setForm(emptyForm);
    },
    onError: (error: Error) => {
      toast({
        title: "Mise à jour impossible",
        description: error.message || "Impossible de modifier ce cadeau.",
        variant: "destructive",
      });
    },
  });

  const deleteGiftMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest("DELETE", `/api/gifts/${id}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/gifts"] });
      toast({ title: "Cadeau supprimé", description: "L'élément a été retiré de la liste." });
      setDeleteOpen(false);
      setDeletingGift(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Suppression impossible",
        description: error.message || "Impossible de supprimer ce cadeau.",
        variant: "destructive",
      });
    },
  });

  const unreserveGiftMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest("POST", `/api/gifts/${id}/unreserve`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/gifts"] });
      toast({ title: "Réservation annulée" });
    },
  });

  const addSuggestionsMutation = useMutation({
    mutationFn: async () => {
      const existingNames = new Set(gifts.map((g) => g.name.toLowerCase()));
      const newGifts = SUGGESTION_GIFTS.filter(
        (sg) => !existingNames.has(sg.name.toLowerCase())
      );
      if (newGifts.length === 0) {
        throw new Error("Toutes les suggestions existent déjà dans votre liste.");
      }
      for (const gift of newGifts) {
        const payload = {
          name: gift.name,
          description: gift.description || null,
          imageUrl: gift.imageUrl || null,
          sourceUrl: gift.sourceUrl || null,
          price: gift.price,
        };
        await apiRequest("POST", "/api/gifts", payload);
      }
      return newGifts.length;
    },
    onSuccess: (count) => {
      queryClient.invalidateQueries({ queryKey: ["/api/gifts"] });
      toast({
        title: "Suggestions ajoutées",
        description: `${count} idée${count > 1 ? "s" : ""} de cadeaux ${count > 1 ? "ont été ajoutées" : "a été ajoutée"} à votre liste.`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Impossible d'ajouter les suggestions",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const totalCollected = (totalData?.total || 0) / 100;
  const totalTarget = useMemo(
    () => gifts.reduce((sum, gift) => sum + (gift.price || 0), 0),
    [gifts]
  );
  const completionRate = totalTarget > 0 ? Math.min(100, Math.round((totalCollected / totalTarget) * 100)) : 0;

  const openEdit = (gift: GiftType) => {
    setEditingGift(gift);
    setForm({
      name: gift.name,
      description: gift.description || "",
      imageUrl: gift.imageUrl || "",
      sourceUrl: (gift as any).sourceUrl || "",
      price: gift.price ?? null,
    });
    setEditOpen(true);
  };

  const openDelete = (gift: GiftType) => {
    setDeletingGift(gift);
    setDeleteOpen(true);
  };

  const isPremium = wedding?.currentPlan === "premium";
  const maxGifts = isPremium ? Infinity : 2;
  const giftLimitReached = !isPremium && gifts.length >= maxGifts;

  const submitCreate = () => {
    if (!form.name.trim()) {
      toast({
        title: "Information manquante",
        description: "Veuillez saisir un nom pour le cadeau avant de l'ajouter.",
        variant: "destructive",
      });
      return;
    }
    if (giftLimitReached) {
      toast({
        title: "Limite atteinte",
        description: "Passez à Premium pour ajouter des cadeaux illimités.",
        variant: "destructive",
      });
      return;
    }
    createGiftMutation.mutate(form);
  };

  const submitEdit = () => {
    if (!editingGift) return;
    if (!form.name.trim()) {
      toast({
        title: "Information manquante",
        description: "Veuillez saisir un nom pour le cadeau avant d'enregistrer.",
        variant: "destructive",
      });
      return;
    }
    updateGiftMutation.mutate({ id: editingGift.id, data: form });
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <AdminPageHeader
        title="Cadeaux"
        description="Gérez votre liste de cadeaux et suivez sa progression."
        actions={
          <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => addSuggestionsMutation.mutate()}
            disabled={addSuggestionsMutation.isPending || giftLimitReached}
            data-tour="gifts-suggestions"
          >
            {addSuggestionsMutation.isPending ? (
              <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
            ) : (
              <Sparkles className="h-4 w-4 mr-1.5" />
            )}
            <span className="hidden sm:inline">Ajouter des </span>Suggestions
          </Button>
          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button size="sm" data-tour="gifts-add" disabled={giftLimitReached}>
              <Plus className="h-4 w-4 mr-1.5" />
              <span className="hidden sm:inline">Ajouter un </span>Cadeau
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-xl rounded-2xl p-0 gap-0 overflow-hidden">
            <div className="px-6 pt-6 pb-4 border-b bg-gradient-to-b from-amber-50/60 to-transparent">
              <div className="flex justify-center mb-3">
                <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center">
                  <Gift className="h-6 w-6 text-amber-600" />
                </div>
              </div>
              <DialogHeader>
                <DialogTitle className="text-center">Ajouter un cadeau</DialogTitle>
                <DialogDescription className="text-center">Créez un élément pour votre liste de mariage.</DialogDescription>
              </DialogHeader>
            </div>
            <div className="p-6 space-y-4">
              <div className="space-y-2">
                <Label className="flex items-center gap-1.5"><Link className="h-3.5 w-3.5" /> Lien du produit</Label>
                <div className="flex gap-2">
                  <Input
                    placeholder="https://www.amazon.fr/..."
                    value={form.sourceUrl}
                    onChange={(e) => setForm((prev) => ({ ...prev, sourceUrl: e.target.value }))}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="shrink-0"
                    disabled={!form.sourceUrl.trim() || scraping}
                    onClick={() => scrapeUrl(form.sourceUrl)}
                  >
                    {scraping ? <Loader2 className="h-4 w-4 animate-spin" /> : <ExternalLink className="h-4 w-4" />}
                  </Button>
                </div>
                <p className="text-[11px] text-muted-foreground">Collez un lien et le nom et l'image seront importés automatiquement</p>
              </div>
              <div className="relative py-2">
                <div className="absolute inset-0 flex items-center"><span className="w-full border-t" /></div>
                <div className="relative flex justify-center"><span className="bg-white px-3 text-xs text-muted-foreground">ou remplir manuellement</span></div>
              </div>
              <div className="space-y-2">
                <Label>Nom</Label>
                <Input placeholder="Ex : Voyage de noces à Bali" value={form.name} onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>Prix cible (EUR)</Label>
                <Input
                  type="number"
                  min={0}
                  value={form.price ?? ""}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      price: e.target.value ? Number(e.target.value) : null,
                    }))
                  }
                />
                <p className="text-[11px] text-muted-foreground">Laissez vide pour un montant libre</p>
              </div>
              <div className="space-y-2">
                <Label className="flex items-center gap-1.5"><Image className="h-3.5 w-3.5" /> Image (URL)</Label>
                <Input placeholder="https://..." value={form.imageUrl} onChange={(e) => setForm((prev) => ({ ...prev, imageUrl: e.target.value }))} />
                {form.imageUrl && (
                  <div className="mt-2 rounded-lg overflow-hidden border h-24 w-24">
                    <img src={form.imageUrl} alt="Aperçu" className="h-full w-full object-cover" onError={(e) => (e.currentTarget.style.display = "none")} />
                  </div>
                )}
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea
                  rows={3}
                  placeholder="Décrivez ce cadeau pour vos invités..."
                  value={form.description}
                  onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
                />
              </div>
            </div>
            <div className="px-6 py-4 border-t bg-muted/10 flex justify-end gap-2">
              <Button variant="outline" onClick={() => setCreateOpen(false)}>Annuler</Button>
              <Button onClick={submitCreate} disabled={createGiftMutation.isPending}>
                {createGiftMutation.isPending ? "Ajout..." : "Ajouter à ma liste"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
          </div>
        }
      />

      {giftLimitReached && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Gift className="h-5 w-5 text-amber-600" />
            <div>
              <div className="font-semibold text-sm text-amber-900">{gifts.length}/{maxGifts} cadeaux utilisés</div>
              <div className="text-xs text-amber-700">Passez à Premium pour des cadeaux illimités.</div>
            </div>
          </div>
          <a href={`/${weddingId}/billing`} className="text-sm font-semibold text-amber-700 hover:text-amber-900 underline">Passer à Premium</a>
        </div>
      )}

      <div className="grid md:grid-cols-3 gap-6">
        <KpiCard
          label="Total collecté"
          value={`${totalCollected.toLocaleString("fr-FR")} €`}
          hint={`Objectif: ${totalTarget.toLocaleString("fr-FR")} €`}
          icon={<Euro className="h-5 w-5" />}
        />
        <KpiCard
          label="Cadeaux"
          value={gifts.length}
          hint="Items actifs"
          icon={<ListChecks className="h-5 w-5" />}
        />
        <KpiCard
          label="Progression"
          value={`${completionRate}%`}
          hint="Objectif atteint"
          icon={<TrendingUp className="h-5 w-5" />}
        />
      </div>

      <Card className="p-6">
        {isLoading ? (
          <div className="flex justify-center p-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="rounded-xl border border-border overflow-hidden bg-white">
            <div className="md:hidden divide-y">
              {gifts.length === 0 ? (
                <div className="p-4 text-center py-12 text-muted-foreground">
                  Aucun cadeau pour le moment.
                </div>
              ) : (
                gifts.map((gift) => (
                  <div key={gift.id} className="p-4 space-y-3">
                    <div className="flex items-center gap-3">
                      {gift.imageUrl ? (
                        <div className="h-12 w-12 rounded-lg overflow-hidden border shrink-0">
                          <img src={gift.imageUrl} alt={gift.name} className="h-full w-full object-cover" />
                        </div>
                      ) : (
                        <div className="h-12 w-12 rounded-lg bg-amber-50 flex items-center justify-center shrink-0">
                          <Gift className="h-5 w-5 text-amber-600" />
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <span className="font-medium truncate">{gift.name}</span>
                          {(gift as any).sourceUrl && (
                            <a href={(gift as any).sourceUrl} target="_blank" rel="noopener noreferrer" className="shrink-0 text-muted-foreground hover:text-primary transition-colors">
                              <ExternalLink className="h-3.5 w-3.5" />
                            </a>
                          )}
                        </div>
                        {gift.description && (
                          <div className="text-xs text-muted-foreground line-clamp-1">{gift.description}</div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-medium">{gift.price ? `${gift.price.toLocaleString("fr-FR")} €` : "Libre"}</span>
                      {gift.isReserved ? (
                        <div className="flex items-center gap-1.5">
                          <span className="px-2 py-1 bg-amber-100 text-amber-700 rounded-full text-xs font-medium">
                            Réservé
                          </span>
                          {(gift as any).reservedBy && (
                            <span className="text-xs text-muted-foreground">par {(gift as any).reservedBy}</span>
                          )}
                        </div>
                      ) : (
                        <span className="px-2 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-medium">
                          Disponible
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {gift.isReserved && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="min-h-[44px] min-w-[44px]"
                          title="Annuler la réservation"
                          onClick={() => unreserveGiftMutation.mutate(gift.id)}
                          disabled={unreserveGiftMutation.isPending}
                        >
                          <RotateCcw className="h-4 w-4" />
                        </Button>
                      )}
                      <Button variant="ghost" size="icon" className="min-h-[44px] min-w-[44px]" onClick={() => openEdit(gift)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive min-h-[44px] min-w-[44px]"
                        onClick={() => openDelete(gift)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
            <div className="hidden md:block">
            <Table>
              <TableHeader className="bg-muted/40">
                <TableRow>
                  <TableHead>Cadeau</TableHead>
                  <TableHead>Prix cible</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {gifts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-12 text-muted-foreground">
                      Aucun cadeau pour le moment.
                    </TableCell>
                  </TableRow>
                ) : (
                  gifts.map((gift) => (
                    <TableRow key={gift.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-3">
                          {gift.imageUrl ? (
                            <div className="h-10 w-10 rounded-lg overflow-hidden border shrink-0">
                              <img src={gift.imageUrl} alt={gift.name} className="h-full w-full object-cover" />
                            </div>
                          ) : (
                            <div className="h-10 w-10 rounded-lg bg-amber-50 flex items-center justify-center shrink-0">
                              <Gift className="h-4 w-4 text-amber-600" />
                            </div>
                          )}
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="truncate">{gift.name}</span>
                              {(gift as any).sourceUrl && (
                                <a href={(gift as any).sourceUrl} target="_blank" rel="noopener noreferrer" className="shrink-0 text-muted-foreground hover:text-primary transition-colors">
                                  <ExternalLink className="h-3 w-3" />
                                </a>
                              )}
                            </div>
                            {gift.description ? (
                              <div className="text-xs text-muted-foreground line-clamp-1">{gift.description}</div>
                            ) : null}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{gift.price ? `${gift.price.toLocaleString("fr-FR")} €` : "Libre"}</TableCell>
                      <TableCell>
                        {gift.isReserved ? (
                          <div className="space-y-1">
                            <span className="px-2 py-1 bg-amber-100 text-amber-700 rounded-full text-xs font-medium">
                              Réservé
                            </span>
                            {(gift as any).reservedBy && (
                              <p className="text-xs text-muted-foreground">par {(gift as any).reservedBy}</p>
                            )}
                          </div>
                        ) : (
                          <span className="px-2 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-medium">
                            Disponible
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          {gift.isReserved && (
                            <Button
                              variant="ghost"
                              size="icon"
                              title="Annuler la réservation"
                              onClick={() => unreserveGiftMutation.mutate(gift.id)}
                              disabled={unreserveGiftMutation.isPending}
                            >
                              <RotateCcw className="h-4 w-4" />
                            </Button>
                          )}
                          <Button variant="ghost" size="icon" onClick={() => openEdit(gift)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-destructive"
                            onClick={() => openDelete(gift)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
            </div>
          </div>
        )}
      </Card>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-xl rounded-2xl p-0 gap-0 overflow-hidden">
          <div className="px-6 pt-6 pb-4 border-b bg-gradient-to-b from-amber-50/60 to-transparent">
            <div className="flex justify-center mb-3">
              <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center">
                <Edit className="h-6 w-6 text-amber-600" />
              </div>
            </div>
            <DialogHeader>
              <DialogTitle className="text-center">Modifier le cadeau</DialogTitle>
              <DialogDescription className="text-center">Modifiez les détails de ce cadeau.</DialogDescription>
            </DialogHeader>
          </div>
          <div className="p-6 space-y-4">
            <div className="space-y-2">
              <Label className="flex items-center gap-1.5"><Link className="h-3.5 w-3.5" /> Lien du produit</Label>
              <div className="flex gap-2">
                <Input
                  placeholder="https://www.amazon.fr/..."
                  value={form.sourceUrl}
                  onChange={(e) => setForm((prev) => ({ ...prev, sourceUrl: e.target.value }))}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="shrink-0"
                  disabled={!form.sourceUrl.trim() || scraping}
                  onClick={() => scrapeUrl(form.sourceUrl)}
                >
                  {scraping ? <Loader2 className="h-4 w-4 animate-spin" /> : <ExternalLink className="h-4 w-4" />}
                </Button>
              </div>
              <p className="text-[11px] text-muted-foreground">Collez un lien et le nom et l'image seront importés automatiquement</p>
            </div>
            <div className="relative py-2">
              <div className="absolute inset-0 flex items-center"><span className="w-full border-t" /></div>
              <div className="relative flex justify-center"><span className="bg-white px-3 text-xs text-muted-foreground">ou remplir manuellement</span></div>
            </div>
            <div className="space-y-2">
              <Label>Nom</Label>
              <Input placeholder="Ex : Voyage de noces à Bali" value={form.name} onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Prix cible (EUR)</Label>
              <Input
                type="number"
                min={0}
                value={form.price ?? ""}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    price: e.target.value ? Number(e.target.value) : null,
                  }))
                }
              />
              <p className="text-[11px] text-muted-foreground">Laissez vide pour un montant libre</p>
            </div>
            <div className="space-y-2">
              <Label className="flex items-center gap-1.5"><Image className="h-3.5 w-3.5" /> Image (URL)</Label>
              <Input placeholder="https://..." value={form.imageUrl} onChange={(e) => setForm((prev) => ({ ...prev, imageUrl: e.target.value }))} />
              {form.imageUrl && (
                <div className="mt-2 rounded-lg overflow-hidden border h-24 w-24">
                  <img src={form.imageUrl} alt="Aperçu" className="h-full w-full object-cover" onError={(e) => (e.currentTarget.style.display = "none")} />
                </div>
              )}
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                rows={3}
                placeholder="Décrivez ce cadeau pour vos invités..."
                value={form.description}
                onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
              />
            </div>
          </div>
          <div className="px-6 py-4 border-t bg-muted/10 flex justify-end gap-2">
            <Button variant="outline" onClick={() => setEditOpen(false)}>Annuler</Button>
            <Button onClick={submitEdit} disabled={updateGiftMutation.isPending}>
              {updateGiftMutation.isPending ? "Sauvegarde..." : "Enregistrer"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer ce cadeau ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible. Le cadeau "{deletingGift?.name}" sera supprimé définitivement.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (!deletingGift) return;
                deleteGiftMutation.mutate(deletingGift.id);
              }}
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {showTour && (
        <GuidedTour
          tourId="gifts"
          steps={[
            { target: "gifts-add", title: "Ajouter un cadeau", description: "Créez un élément pour votre liste de mariage. Vous pouvez coller un lien produit pour importer automatiquement les détails.", position: "bottom" },
            { target: "gifts-suggestions", title: "Suggestions rapides", description: "Ajoutez en un clic des idées de cadeaux populaires pour compléter votre liste.", position: "bottom" },
          ]}
        />
      )}
    </div>
  );
}
