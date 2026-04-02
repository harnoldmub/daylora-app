import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Plus, Trash2, GripVertical, CreditCard, Phone, Link2, Building2 } from "lucide-react";
import type { ContributionMethod } from "@shared/schema";

const METHOD_TYPES = [
  { value: "paypal", label: "PayPal", icon: CreditCard },
  { value: "phone", label: "Téléphone / Mobile Money", icon: Phone },
  { value: "link", label: "Lien externe", icon: Link2 },
  { value: "bank", label: "Virement bancaire", icon: Building2 },
] as const;

type MethodType = ContributionMethod["type"];

function getMethodIcon(type: MethodType) {
  const found = METHOD_TYPES.find((m) => m.value === type);
  return found ? found.icon : CreditCard;
}

function getMethodLabel(type: MethodType) {
  const found = METHOD_TYPES.find((m) => m.value === type);
  return found?.label || type;
}

function getMethodSummary(method: ContributionMethod): string {
  switch (method.type) {
    case "paypal":
      return method.paypalUrl || "Lien PayPal non renseigné";
    case "phone":
      return `${method.label} — ${method.number || "Non renseigné"}`;
    case "link":
      return method.serviceName || "Lien non renseigné";
    case "bank":
      return `${method.bankName || "Banque"} — ${method.accountHolder || ""}`;
  }
}

const emptyMethod = (type: MethodType, sortOrder: number): ContributionMethod => {
  const id = `cm_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
  const base = { id, enabled: true, sortOrder };
  switch (type) {
    case "paypal":
      return { ...base, type: "paypal", paypalUrl: "" };
    case "phone":
      return { ...base, type: "phone", number: "", label: "Mobile Money" };
    case "link":
      return { ...base, type: "link", url: "", serviceName: "" };
    case "bank":
      return { ...base, type: "bank", accountHolder: "", bankName: "", iban: "", bic: "", accountNumber: "" };
  }
};

interface Props {
  methods: ContributionMethod[];
  onChange: (methods: ContributionMethod[]) => void;
}

export default function ContributionMethodsEditor({ methods, onChange }: Props) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingMethod, setEditingMethod] = useState<ContributionMethod | null>(null);
  const [newType, setNewType] = useState<MethodType>("paypal");
  const [dragIdx, setDragIdx] = useState<number | null>(null);

  const sorted = [...methods].sort((a, b) => a.sortOrder - b.sortOrder);

  const openNew = () => {
    setEditingMethod(emptyMethod(newType, methods.length));
    setDialogOpen(true);
  };

  const openEdit = (method: ContributionMethod) => {
    setEditingMethod({ ...method });
    setDialogOpen(true);
  };

  const saveMethod = () => {
    if (!editingMethod) return;
    const existing = methods.find((m) => m.id === editingMethod.id);
    if (existing) {
      onChange(methods.map((m) => (m.id === editingMethod.id ? editingMethod : m)));
    } else {
      onChange([...methods, editingMethod]);
    }
    setDialogOpen(false);
    setEditingMethod(null);
  };

  const removeMethod = (id: string) => {
    onChange(methods.filter((m) => m.id !== id));
  };

  const toggleMethod = (id: string) => {
    onChange(methods.map((m) => (m.id === id ? { ...m, enabled: !m.enabled } : m)));
  };

  const handleDragStart = (idx: number) => setDragIdx(idx);
  const handleDragOver = (e: React.DragEvent, idx: number) => {
    e.preventDefault();
    if (dragIdx === null || dragIdx === idx) return;
    const reordered = [...sorted];
    const [moved] = reordered.splice(dragIdx, 1);
    reordered.splice(idx, 0, moved);
    onChange(reordered.map((m, i) => ({ ...m, sortOrder: i })));
    setDragIdx(idx);
  };
  const handleDragEnd = () => setDragIdx(null);

  const updateField = (key: string, value: string) => {
    if (!editingMethod) return;
    setEditingMethod({ ...editingMethod, [key]: value } as ContributionMethod);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Moyens de contribution</label>
      </div>

      {sorted.length === 0 && (
        <p className="text-xs text-muted-foreground py-2">Aucun moyen configuré. Ajoutez vos moyens de contribution pour permettre à vos invités de participer.</p>
      )}

      <div className="space-y-2">
        {sorted.map((method, idx) => {
          const Icon = getMethodIcon(method.type);
          return (
            <Card
              key={method.id}
              className={`p-3 flex items-center gap-3 cursor-grab ${!method.enabled ? "opacity-50" : ""}`}
              draggable
              onDragStart={() => handleDragStart(idx)}
              onDragOver={(e) => handleDragOver(e, idx)}
              onDragEnd={handleDragEnd}
            >
              <GripVertical className="h-4 w-4 text-muted-foreground shrink-0" />
              <Icon className="h-4 w-4 shrink-0" />
              <div className="flex-1 min-w-0 cursor-pointer" onClick={() => openEdit(method)}>
                <div className="text-sm font-medium truncate">{getMethodLabel(method.type)}</div>
                <div className="text-xs text-muted-foreground truncate">{getMethodSummary(method)}</div>
              </div>
              <Switch checked={method.enabled} onCheckedChange={() => toggleMethod(method.id)} />
              <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => removeMethod(method.id)}>
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </Card>
          );
        })}
      </div>

      <div className="flex gap-2">
        <Select value={newType} onValueChange={(v) => setNewType(v as MethodType)}>
          <SelectTrigger className="flex-1 h-9 text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {METHOD_TYPES.map((t) => (
              <SelectItem key={t.value} value={t.value}>
                {t.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button size="sm" variant="outline" onClick={openNew}>
          <Plus className="h-3.5 w-3.5 mr-1" />
          Ajouter
        </Button>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingMethod && methods.find((m) => m.id === editingMethod.id) ? "Modifier" : "Ajouter"} — {editingMethod ? getMethodLabel(editingMethod.type) : ""}
            </DialogTitle>
          </DialogHeader>

          {editingMethod && (
            <div className="space-y-4 py-2">
              {editingMethod.type === "paypal" && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">Lien PayPal.me</label>
                  <Input
                    type="url"
                    placeholder="https://paypal.me/votrenom"
                    value={(editingMethod as any).paypalUrl || ""}
                    onChange={(e) => updateField("paypalUrl", e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">Collez votre lien PayPal.me complet</p>
                </div>
              )}

              {editingMethod.type === "phone" && (
                <>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Service</label>
                    <Input
                      placeholder="Wave, Orange Money, Moov..."
                      value={(editingMethod as any).label || ""}
                      onChange={(e) => updateField("label", e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Numéro de téléphone</label>
                    <Input
                      type="tel"
                      placeholder="+33 6 XX XX XX XX"
                      value={(editingMethod as any).number || ""}
                      onChange={(e) => updateField("number", e.target.value)}
                    />
                  </div>
                </>
              )}

              {editingMethod.type === "link" && (
                <>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Nom du service</label>
                    <Input
                      placeholder="Leetchi, GoFundMe..."
                      value={(editingMethod as any).serviceName || ""}
                      onChange={(e) => updateField("serviceName", e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">URL</label>
                    <Input
                      type="url"
                      placeholder="https://..."
                      value={(editingMethod as any).url || ""}
                      onChange={(e) => updateField("url", e.target.value)}
                    />
                  </div>
                </>
              )}

              {editingMethod.type === "bank" && (
                <>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Titulaire du compte</label>
                    <Input
                      placeholder="Prénom Nom"
                      value={(editingMethod as any).accountHolder || ""}
                      onChange={(e) => updateField("accountHolder", e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Banque</label>
                    <Input
                      placeholder="Nom de la banque"
                      value={(editingMethod as any).bankName || ""}
                      onChange={(e) => updateField("bankName", e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Numéro de compte (optionnel)</label>
                    <Input
                      placeholder="Ex: 01234 56789 01234567890 12"
                      value={(editingMethod as any).accountNumber || ""}
                      onChange={(e) => updateField("accountNumber", e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">IBAN (optionnel)</label>
                    <Input
                      placeholder="FR76 XXXX XXXX XXXX XXXX XXXX XXX"
                      value={(editingMethod as any).iban || ""}
                      onChange={(e) => updateField("iban", e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">BIC (optionnel)</label>
                    <Input
                      placeholder="BNPAFRPP"
                      value={(editingMethod as any).bic || ""}
                      onChange={(e) => updateField("bic", e.target.value)}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">Renseignez un numéro de compte ou un IBAN selon votre pays.</p>
                </>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Annuler
            </Button>
            <Button onClick={saveMethod}>Enregistrer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
