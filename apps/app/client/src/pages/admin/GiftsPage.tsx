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
} from "lucide-react";
import { useParams } from "wouter";
import { Button } from "@/components/ui/button";
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

export default function GiftsPage() {
  const { weddingId } = useParams<{ weddingId: string }>();
  const { toast } = useToast();

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
      toast({ title: "Cadeau ajoute" });
      setCreateOpen(false);
      setForm(emptyForm);
    },
    onError: (error: Error) => {
      toast({
        title: "Erreur",
        description: error.message || "Impossible d'ajouter le cadeau",
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
      toast({ title: "Cadeau mis à jour" });
      setEditOpen(false);
      setEditingGift(null);
      setForm(emptyForm);
    },
    onError: (error: Error) => {
      toast({
        title: "Erreur",
        description: error.message || "Impossible de modifier le cadeau",
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
      toast({ title: "Cadeau supprime" });
      setDeleteOpen(false);
      setDeletingGift(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Erreur",
        description: error.message || "Impossible de supprimer le cadeau",
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
        title: "Champ requis",
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
        title: "Champ requis",
        description: "Le nom du cadeau est requis.",
        variant: "destructive",
      });
      return;
    }
    updateGiftMutation.mutate({ id: editingGift.id, data: form });
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-serif font-bold">Cadeaux</h1>
          <p className="text-muted-foreground mt-1">Gerez votre liste de cadeaux et son avancement</p>
        </div>
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
              <DialogDescription>Ajoutez un item a votre liste de mariage.</DialogDescription>
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
                  {createGiftMutation.isPending ? "Ajout..." : "Ajouter"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <Card className="p-6 flex items-center gap-4">
          <div className="h-11 w-11 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
            <Euro className="h-5 w-5" />
          </div>
          <div>
            <div className="text-xs uppercase tracking-widest text-muted-foreground">Total collecte</div>
            <div className="text-2xl font-semibold">{totalCollected.toLocaleString("fr-FR")} €</div>
            <div className="text-xs text-muted-foreground">Objectif: {totalTarget.toLocaleString("fr-FR")} €</div>
          </div>
        </Card>
        <Card className="p-6 flex items-center gap-4">
          <div className="h-11 w-11 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
            <ListChecks className="h-5 w-5" />
          </div>
          <div>
            <div className="text-xs uppercase tracking-widest text-muted-foreground">Cadeaux</div>
            <div className="text-2xl font-semibold">{gifts.length}</div>
            <div className="text-xs text-muted-foreground">Items actifs</div>
          </div>
        </Card>
        <Card className="p-6 flex items-center gap-4">
          <div className="h-11 w-11 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
            <TrendingUp className="h-5 w-5" />
          </div>
          <div>
            <div className="text-xs uppercase tracking-widest text-muted-foreground">Progression</div>
            <div className="text-2xl font-semibold">{completionRate}%</div>
            <div className="text-xs text-muted-foreground">Objectif atteint</div>
          </div>
        </Card>
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
                  <TableHead>Reserve</TableHead>
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
                            Reserve
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
            <DialogDescription>Ajustez les informations de cet item.</DialogDescription>
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
              Cette action supprimera definitivement "{deletingGift?.name}".
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
  );
}
