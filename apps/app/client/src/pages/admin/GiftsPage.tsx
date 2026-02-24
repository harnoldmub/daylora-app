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
} from "lucide-react";
import { useParams } from "wouter";
import { Button } from "@/components/ui/button";
import { PremiumGate } from "@/components/admin/PremiumGate";
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

type GiftForm = {
  name: string;
  description: string;
  imageUrl: string;
  price: number | null;
};

const emptyForm: GiftForm = {
  name: "",
  description: "",
  imageUrl: "",
  price: null,
};

const SUGGESTION_GIFTS: GiftForm[] = [
  { name: "Voyage de noces", description: "Contribuez à notre lune de miel de rêve.", imageUrl: "", price: 500 },
  { name: "Appareil photo", description: "Pour immortaliser nos plus beaux souvenirs.", imageUrl: "", price: 350 },
  { name: "Service de table", description: "Un beau service pour nos dîners en amoureux.", imageUrl: "", price: 200 },
  { name: "Grille-pain", description: "Pour des petits-déjeuners gourmands.", imageUrl: "", price: 60 },
  { name: "Robot cuisine", description: "Pour préparer de bons petits plats ensemble.", imageUrl: "", price: 300 },
  { name: "Linge de maison", description: "Draps, serviettes et accessoires pour notre nid douillet.", imageUrl: "", price: 150 },
  { name: "Expérience bien-être", description: "Un moment de détente en duo dans un spa.", imageUrl: "", price: 180 },
  { name: "Cours de cuisine", description: "Un atelier culinaire pour apprendre à deux.", imageUrl: "", price: 120 },
  { name: "Panier gourmet", description: "Une sélection de produits fins et délicieux.", imageUrl: "", price: 80 },
  { name: "Cadre photo", description: "Pour encadrer nos plus belles photos de mariage.", imageUrl: "", price: 50 },
];

export default function GiftsPage() {
  const { weddingId } = useParams<{ weddingId: string }>();
  const { toast } = useToast();
  const { data: wedding } = useWedding(weddingId);

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

  const createGiftMutation = useMutation({
    mutationFn: async (data: GiftForm) => {
      const payload = {
        name: data.name,
        description: data.description || null,
        imageUrl: data.imageUrl || null,
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
      price: gift.price ?? null,
    });
    setEditOpen(true);
  };

  const openDelete = (gift: GiftType) => {
    setDeletingGift(gift);
    setDeleteOpen(true);
  };

  const submitCreate = () => {
    if (!form.name.trim()) {
      toast({
        title: "Nom requis",
        description: "Le nom du cadeau est requis.",
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
        title: "Nom requis",
        description: "Le nom du cadeau est requis.",
        variant: "destructive",
      });
      return;
    }
    updateGiftMutation.mutate({ id: editingGift.id, data: form });
  };

  return (
    <PremiumGate featureName="La liste de cadeaux" isPremium={wedding?.currentPlan === 'premium'}>
    <div className="space-y-8 animate-in fade-in duration-500">
      <AdminPageHeader
        title="Cadeaux"
        description="Gérez votre liste de cadeaux et suivez sa progression."
        actions={
          <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => addSuggestionsMutation.mutate()}
            disabled={addSuggestionsMutation.isPending}
          >
            {addSuggestionsMutation.isPending ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Sparkles className="h-4 w-4 mr-2" />
            )}
            Ajouter des suggestions
          </Button>
          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Ajouter un cadeau
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-xl">
            <DialogHeader>
              <DialogTitle>Nouveau cadeau</DialogTitle>
              <DialogDescription>Ajoutez un nouvel élément à votre liste de mariage.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Nom</Label>
                <Input value={form.name} onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))} />
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
              </div>
              <div className="space-y-2">
                <Label>Image (URL)</Label>
                <Input value={form.imageUrl} onChange={(e) => setForm((prev) => ({ ...prev, imageUrl: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea
                  rows={4}
                  value={form.description}
                  onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setCreateOpen(false)}>Annuler</Button>
                <Button onClick={submitCreate} disabled={createGiftMutation.isPending}>
                  {createGiftMutation.isPending ? "Ajout..." : "Ajouter le cadeau"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
          </div>
        }
      />

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
                          <Gift className="h-4 w-4 text-primary" />
                          <div>
                            <div>{gift.name}</div>
                            {gift.description ? (
                              <div className="text-xs text-muted-foreground line-clamp-1">{gift.description}</div>
                            ) : null}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{gift.price ? `${gift.price.toLocaleString("fr-FR")} €` : "Libre"}</TableCell>
                      <TableCell>
                        {gift.isReserved ? (
                          <span className="px-2 py-1 bg-amber-100 text-amber-700 rounded-full text-xs font-medium">
                            Réservé
                          </span>
                        ) : (
                          <span className="px-2 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-medium">
                            Disponible
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
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
        )}
      </Card>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Modifier le cadeau</DialogTitle>
            <DialogDescription>Mettez à jour les informations de ce cadeau.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Nom</Label>
              <Input value={form.name} onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))} />
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
            </div>
            <div className="space-y-2">
              <Label>Image (URL)</Label>
              <Input value={form.imageUrl} onChange={(e) => setForm((prev) => ({ ...prev, imageUrl: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                rows={4}
                value={form.description}
                onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setEditOpen(false)}>Annuler</Button>
              <Button onClick={submitEdit} disabled={updateGiftMutation.isPending}>
                {updateGiftMutation.isPending ? "Sauvegarde..." : "Enregistrer"}
              </Button>
            </div>
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
    </div>
    </PremiumGate>
  );
}
