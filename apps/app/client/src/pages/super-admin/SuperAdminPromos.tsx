import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Pencil, Trash2, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface PromoCode {
  id: number;
  code: string;
  type: string;
  value: number;
  durationMonths: number | null;
  startDate: string;
  endDate: string | null;
  maxUses: number | null;
  maxUsesPerUser: number | null;
  currentUses: number;
  isActive: boolean;
  createdAt: string;
}

const emptyForm = {
  code: "",
  type: "percentage" as string,
  value: 0,
  durationMonths: null as number | null,
  maxUses: null as number | null,
  maxUsesPerUser: 1,
  startDate: new Date().toISOString().split("T")[0],
  endDate: "",
  isActive: true,
};

export default function SuperAdminPromos() {
  const { toast } = useToast();
  const [promos, setPromos] = useState<PromoCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const fetchPromos = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/super-admin/promos", { credentials: "include" });
      setPromos(await res.json());
    } catch {
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchPromos(); }, []);

  const openCreate = () => {
    setEditId(null);
    setForm(emptyForm);
    setDialogOpen(true);
  };

  const openEdit = (p: PromoCode) => {
    setEditId(p.id);
    setForm({
      code: p.code,
      type: p.type,
      value: p.value,
      durationMonths: p.durationMonths,
      maxUses: p.maxUses,
      maxUsesPerUser: p.maxUsesPerUser ?? 1,
      startDate: p.startDate ? new Date(p.startDate).toISOString().split("T")[0] : "",
      endDate: p.endDate ? new Date(p.endDate).toISOString().split("T")[0] : "",
      isActive: p.isActive,
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const body = {
        ...form,
        value: Number(form.value),
        durationMonths: form.durationMonths ? Number(form.durationMonths) : null,
        maxUses: form.maxUses ? Number(form.maxUses) : null,
        maxUsesPerUser: form.maxUsesPerUser ? Number(form.maxUsesPerUser) : null,
        endDate: form.endDate || null,
      };

      const url = editId ? `/api/super-admin/promos/${editId}` : "/api/super-admin/promos";
      const method = editId ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const err = await res.json();
        toast({ title: "Erreur", description: err.message, variant: "destructive" });
        return;
      }

      toast({ title: "Succès", description: editId ? "Code promo modifié." : "Code promo créé." });
      setDialogOpen(false);
      fetchPromos();
    } catch {
      toast({ title: "Erreur", description: "Erreur réseau.", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Désactiver ce code promo ?")) return;
    try {
      await fetch(`/api/super-admin/promos/${id}`, { method: "DELETE", credentials: "include" });
      toast({ title: "Succès", description: "Code promo désactivé." });
      fetchPromos();
    } catch {
      toast({ title: "Erreur", description: "Erreur réseau.", variant: "destructive" });
    }
  };

  const formatValue = (type: string, value: number) =>
    type === "percentage" ? `${value}%` : `${(value / 100).toFixed(2)} €`;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Codes promos</h1>
        <Button onClick={openCreate}>
          <Plus className="mr-2 h-4 w-4" /> Créer un code
        </Button>
      </div>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-slate-50">
                <th className="text-left p-3 font-medium text-slate-600">Code</th>
                <th className="text-left p-3 font-medium text-slate-600">Type</th>
                <th className="text-left p-3 font-medium text-slate-600">Valeur</th>
                <th className="text-left p-3 font-medium text-slate-600">Utilisations</th>
                <th className="text-left p-3 font-medium text-slate-600">Statut</th>
                <th className="text-left p-3 font-medium text-slate-600">Dates</th>
                <th className="text-left p-3 font-medium text-slate-600">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                [...Array(3)].map((_, i) => (
                  <tr key={i} className="border-b">
                    <td colSpan={7} className="p-3"><div className="h-5 bg-slate-100 rounded animate-pulse" /></td>
                  </tr>
                ))
              ) : promos.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-muted-foreground">Aucun code promo.</td>
                </tr>
              ) : (
                promos.map((p) => (
                  <tr key={p.id} className="border-b">
                    <td className="p-3 font-mono font-bold">{p.code}</td>
                    <td className="p-3">{p.type === "percentage" ? "Pourcentage" : "Montant"}</td>
                    <td className="p-3">{formatValue(p.type, p.value)}</td>
                    <td className="p-3">{p.currentUses}{p.maxUses ? ` / ${p.maxUses}` : ""}</td>
                    <td className="p-3">
                      <Badge variant={p.isActive ? "default" : "secondary"} className={p.isActive ? "bg-green-100 text-green-800" : ""}>
                        {p.isActive ? "Actif" : "Inactif"}
                      </Badge>
                    </td>
                    <td className="p-3 text-xs text-muted-foreground">
                      {p.startDate ? new Date(p.startDate).toLocaleDateString("fr-FR") : "—"}
                      {p.endDate ? ` → ${new Date(p.endDate).toLocaleDateString("fr-FR")}` : ""}
                    </td>
                    <td className="p-3">
                      <div className="flex gap-1">
                        <Button variant="ghost" size="sm" onClick={() => openEdit(p)}>
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleDelete(p.id)} className="text-red-600 hover:text-red-700">
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editId ? "Modifier le code promo" : "Nouveau code promo"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Code</Label>
              <Input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })} placeholder="DAYLORA10" disabled={!!editId} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Type</Label>
                <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percentage">Pourcentage</SelectItem>
                    <SelectItem value="amount">Montant fixe</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>{form.type === "percentage" ? "Pourcentage (%)" : "Montant (centimes)"}</Label>
                <Input type="number" value={form.value} onChange={(e) => setForm({ ...form, value: Number(e.target.value) })} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Max utilisations</Label>
                <Input type="number" value={form.maxUses ?? ""} onChange={(e) => setForm({ ...form, maxUses: e.target.value ? Number(e.target.value) : null })} placeholder="Illimité" />
              </div>
              <div className="space-y-2">
                <Label>Max par utilisateur</Label>
                <Input type="number" value={form.maxUsesPerUser ?? ""} onChange={(e) => setForm({ ...form, maxUsesPerUser: Number(e.target.value) || 1 })} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Date début</Label>
                <Input type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Date fin</Label>
                <Input type="date" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Annuler</Button>
            <Button onClick={handleSave} disabled={saving || !form.code}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {editId ? "Enregistrer" : "Créer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
