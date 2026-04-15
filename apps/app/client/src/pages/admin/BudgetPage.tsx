import { Fragment, useState, useEffect } from "react";
import { Loader2, Plus, Receipt, Sparkles, Trash2, Wallet, WalletCards } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useBudget, useCreateBudgetCategory, useCreateBudgetItem, useDeleteBudgetItem, useUpdateBudgetItem } from "@/hooks/use-api";
import { useToast } from "@/hooks/use-toast";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { PremiumAccessGate } from "@/components/admin/PremiumAccessGate";
import { useWedding } from "@/hooks/use-api";
import { useParams } from "wouter";

function formatCurrency(cents: number) {
  return new Intl.NumberFormat("fr-BE", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format((cents || 0) / 100);
}

function parseEuroInput(value: string) {
  const normalized = value.replace(",", ".").replace(/[^\d.]/g, "");
  const num = parseFloat(normalized);
  if (isNaN(num)) return 0;
  return Math.max(0, Math.round(num * 100));
}

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  planned: { label: "Prévu", color: "bg-muted/50 text-muted-foreground" },
  booked: { label: "Réservé", color: "bg-blue-500/10 text-blue-600 border-blue-200" },
  paid: { label: "Payé", color: "bg-emerald-500/10 text-emerald-600 border-emerald-200" },
  cancelled: { label: "Annulé", color: "bg-destructive/10 text-destructive border-destructive-200" },
};

function EditableInput({ 
  initialValue, 
  onSave, 
  className, 
  type = "text",
  isCurrency = false
}: { 
  initialValue: string | number; 
  onSave: (val: string) => void;
  className?: string;
  type?: string;
  isCurrency?: boolean;
}) {
  const [localValue, setLocalValue] = useState(String(initialValue));

  useEffect(() => {
    setLocalValue(String(initialValue));
  }, [initialValue]);

  const handleBlur = () => {
    if (String(localValue) !== String(initialValue)) {
      onSave(localValue);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      (e.target as HTMLInputElement).blur();
    }
  };

  return (
    <div className="relative w-full">
      <Input
        type={type}
        value={localValue}
        onChange={(e) => setLocalValue(e.target.value)}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        className={className}
      />
      {isCurrency && (
         <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-muted-foreground/30 pointer-events-none">€</span>
      )}
    </div>
  );
}

export default function BudgetPage() {
  const { weddingId } = useParams<{ weddingId: string }>();
  const { data: wedding } = useWedding(weddingId);
  const isPremium = wedding?.currentPlan === "premium";
  const { toast } = useToast();
  const { data, isLoading } = useBudget();
  const createCategory = useCreateBudgetCategory();
  const createItem = useCreateBudgetItem();
  const updateItem = useUpdateBudgetItem();
  const deleteItem = useDeleteBudgetItem();

  const [newCategoryLabel, setNewCategoryLabel] = useState("");
  const [quickAddDraft, setQuickAddDraft] = useState({
    label: "",
    categoryId: "",
    planned: "",
  });

  const categories = data?.categories || [];
  const totals = data?.totals || { plannedAmountCents: 0, actualAmountCents: 0, remainingAmountCents: 0 };
  const usagePercent = totals.plannedAmountCents > 0 ? Math.min(100, Math.round((totals.actualAmountCents / totals.plannedAmountCents) * 100)) : 0;

  useEffect(() => {
    if (categories.length > 0 && !quickAddDraft.categoryId) {
      setQuickAddDraft(p => ({ ...p, categoryId: String(categories[0].id) }));
    }
  }, [categories, quickAddDraft.categoryId]);

  const handleCreateCategory = async () => {
    const label = newCategoryLabel.trim();
    if (!label) return;
    try {
      await createCategory.mutateAsync({
        label,
        key: null,
        sortOrder: categories.length,
        isDefault: false,
      });
      setNewCategoryLabel("");
      toast({ title: "Catégorie créée" });
    } catch (error: any) {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    }
  };

  const handleQuickAdd = async () => {
    const label = quickAddDraft.label.trim();
    const categoryId = Number(quickAddDraft.categoryId);
    if (!label || !categoryId) {
      toast({ title: "Champs requis", description: "Nom et catégorie obligatoires.", variant: "destructive" });
      return;
    }
    try {
      await createItem.mutateAsync({
        categoryId,
        label,
        plannedAmountCents: parseEuroInput(quickAddDraft.planned),
        actualAmountCents: 0,
        status: "planned",
        vendorName: null,
        notes: null,
        paymentDueAt: null,
      });
      setQuickAddDraft(p => ({ ...p, label: "", planned: "" }));
      toast({ title: "Ligne ajoutée" });
    } catch (error: any) {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary/40" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Budget"
        description="Gérez vos dépenses et suivez vos paiements."
        icon={<Wallet className="h-6 w-6 text-primary" />}
        actions={
          <div className="flex gap-3">
            <Input
              value={newCategoryLabel}
              onChange={(e) => setNewCategoryLabel(e.target.value)}
              placeholder="Nouvelle catégorie..."
              className="w-48 h-11 bg-white/50 border-white/20 rounded-xl"
            />
            <Button onClick={handleCreateCategory} className="h-11 px-6 rounded-xl">
              <Plus className="mr-2 h-4 w-4" />
              Créer
            </Button>
          </div>
        }
      />

      <section className="grid grid-cols-1 md:grid-cols-3 gap-6 px-2">
        <Card className="relative overflow-hidden p-8 rounded-[2.5rem] border-none bg-gradient-to-br from-primary/10 to-primary/5">
           <div className="relative z-10">
              <p className="text-[11px] font-black uppercase tracking-[0.2em] text-primary/70 mb-2">Total Estimé</p>
              <p className="text-4xl font-black tracking-tighter">{formatCurrency(totals.plannedAmountCents)}</p>
           </div>
           <Sparkles className="absolute -right-4 -bottom-4 w-32 h-32 text-primary/5 rotate-12" />
        </Card>

        <Card className="relative overflow-hidden p-8 rounded-[2.5rem] border-none bg-gradient-to-br from-emerald-500/10 to-emerald-500/5">
           <div className="relative z-10">
              <p className="text-[11px] font-black uppercase tracking-[0.2em] text-emerald-600/70 mb-2">Total Payé</p>
              <p className="text-4xl font-black tracking-tighter">{formatCurrency(totals.actualAmountCents)}</p>
              <div className="mt-4">
                 <Progress value={usagePercent} className="h-1.5 bg-emerald-500/10" />
                 <p className="text-[10px] text-emerald-600/60 font-bold mt-2 uppercase tracking-widest">{usagePercent}% CONSOMMÉ</p>
              </div>
           </div>
        </Card>

        <Card className="relative overflow-hidden p-8 rounded-[2.5rem] border-none bg-gradient-to-br from-amber-500/10 to-amber-500/5">
           <div className="relative z-10">
              <p className="text-[11px] font-black uppercase tracking-[0.2em] text-amber-700/70 mb-2">Somme Restante</p>
              <p className="text-4xl font-black tracking-tighter">{formatCurrency(totals.remainingAmountCents)}</p>
           </div>
           <WalletCards className="absolute -right-4 -bottom-4 w-32 h-32 text-amber-500/5 -rotate-12" />
        </Card>
      </section>

      <PremiumAccessGate 
        isPremium={isPremium} 
        featureName="la gestion du budget" 
        description="Suivez chaque dépense, gérez les acomptes et gardez le contrôle total sur vos finances de mariage."
      >
        <Card className="rounded-[2.5rem] border-border/40 bg-white shadow-xl overflow-hidden mx-2">
          <div className="p-8 border-b border-border/40 bg-white flex items-center justify-between">
             <h3 className="text-xl font-black tracking-tight flex items-center gap-3">
               <Receipt className="h-5 w-5 text-primary" />
               Détail des dépenses
             </h3>
             {categories.length === 0 && (
               <Badge variant="outline" className="border-amber-200 bg-amber-50 text-amber-700 font-bold px-4 py-1 animate-subtle-pulse">
                 Action requise : Créez une catégorie
               </Badge>
             )}
          </div>

          <div className="p-6 bg-primary/[0.01] border-b border-border/10">
             {/* Shared Grid: [Dépense] [Catégorie/Espacement] [Prévu] [Réel] [Statut] [Action] */}
             <div className="grid grid-cols-[2fr_1fr_1fr_1fr_140px_100px] gap-4 items-center px-4 md:px-8">
                <Input
                  value={quickAddDraft.label}
                  onChange={(e) => setQuickAddDraft(p => ({ ...p, label: e.target.value }))}
                  placeholder="Ex: Photographe, Robe..."
                  className="h-12 rounded-2xl border-border/40 bg-white focus:ring-primary/20"
                />
                <div className="relative h-12">
                  <Select
                    value={quickAddDraft.categoryId}
                    onValueChange={(v) => setQuickAddDraft(p => ({ ...p, categoryId: v }))}
                    disabled={categories.length === 0}
                  >
                    <SelectTrigger className="h-12 rounded-2xl border-border/40 bg-white ring-offset-0 focus:ring-0">
                      <SelectValue placeholder="Catégorie" />
                    </SelectTrigger>
                    <SelectContent className="rounded-[1.2rem] border-border/30 shadow-2xl">
                      {categories.map(c => <SelectItem key={c.id} value={String(c.id)} className="rounded-xl">{c.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="relative">
                  <Input
                    value={quickAddDraft.planned}
                    onChange={(e) => setQuickAddDraft(p => ({ ...p, planned: e.target.value }))}
                    placeholder="Prévu"
                    className="h-12 rounded-2xl border-border/40 bg-white pr-8 text-right"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground/40 font-bold text-xs">€</span>
                </div>
                <div className="hidden md:block" /> {/* Gap for 'Réel' column */}
                <div className="hidden md:block" /> {/* Gap for 'Statut' column */}
                <Button onClick={handleQuickAdd} disabled={categories.length === 0} className="h-12 w-full rounded-2xl shadow-lg shadow-primary/10 hover:shadow-primary/20 transition-all font-bold uppercase tracking-widest text-[10px]">
                  Ajouter
                </Button>
             </div>
          </div>

          <div className="overflow-x-auto">
             <div className="min-w-[900px]">
                <div className="bg-muted/30 grid grid-cols-[2fr_1fr_1fr_1fr_140px_100px] gap-4 py-4 px-8 border-b border-border/10">
                   <div className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">Dépense</div>
                   <div className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 opacity-0 px-2" aria-hidden="true">Catégorie</div>
                   <div className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 text-right pr-4">Estimation</div>
                   <div className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 text-right pr-4">Payé</div>
                   <div className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 text-center">Statut</div>
                   <div className="w-10" />
                </div>
                <div className="divide-y divide-border/10">
                   {categories.map(category => (
                      <Fragment key={category.id}>
                         <div className="bg-muted/5 py-3 px-8">
                            <div className="flex items-center gap-3">
                               <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">{category.label}</span>
                               <div className="h-px flex-1 bg-primary/10" />
                            </div>
                         </div>
                         {category.items.map(item => (
                            <div key={item.id} className="group hover:bg-primary/[0.01] transition-colors grid grid-cols-[2fr_1fr_1fr_1fr_140px_100px] gap-4 py-4 px-8 items-center">
                               <div>
                                  <EditableInput
                                    initialValue={item.label}
                                    onSave={(val) => updateItem.mutate({ id: item.id, label: val })}
                                    className="h-10 border-none bg-transparent hover:bg-muted/30 focus:bg-white focus:ring-primary/20 font-bold text-[15px] p-2 rounded-lg transition-all"
                                  />
                               </div>
                               <div aria-hidden="true" /> {/* Category column gap */}
                               <div className="text-right">
                                  <EditableInput
                                    type="text"
                                    isCurrency
                                    initialValue={Math.round((item.plannedAmountCents || 0) / 100)}
                                    onSave={(val) => updateItem.mutate({ id: item.id, plannedAmountCents: parseEuroInput(val) })}
                                    className="h-10 w-full border-none bg-transparent hover:bg-muted/30 focus:bg-white focus:ring-primary/20 text-right font-black text-[15px] p-2 pr-8 rounded-lg"
                                  />
                               </div>
                               <div className="text-right">
                                  <EditableInput
                                    type="text"
                                    isCurrency
                                    initialValue={Math.round((item.actualAmountCents || 0) / 100)}
                                    onSave={(val) => updateItem.mutate({ id: item.id, actualAmountCents: parseEuroInput(val) })}
                                    className="h-10 w-full border-none bg-transparent hover:bg-muted/30 focus:bg-white focus:ring-primary/20 text-right font-black text-[15px] p-2 pr-8 rounded-lg"
                                  />
                               </div>
                               <div className="flex justify-center">
                                  <Select
                                    value={item.status}
                                    onValueChange={(v) => updateItem.mutate({ id: item.id, status: v as any })}
                                  >
                                    <SelectTrigger className={`h-8 w-28 rounded-full text-[9px] font-black uppercase tracking-widest border-none ${STATUS_CONFIG[item.status].color}`}>
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent className="rounded-2xl border-border/30">
                                      {Object.entries(STATUS_CONFIG).map(([k, v]) => (
                                        <SelectItem key={k} value={k} className="text-[10px] font-bold rounded-xl">{v.label}</SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                               </div>
                               <div className="text-right opacity-0 group-hover:opacity-100 transition-opacity">
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => deleteItem.mutate(item.id)}
                                    className="h-9 w-9 rounded-xl text-muted-foreground hover:text-destructive hover:bg-destructive/5"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                               </div>
                            </div>
                         ))}
                      </Fragment>
                   ))}
                   {categories.length === 0 && (
                      <div className="py-32 text-center space-y-4">
                         <div className="w-16 h-16 bg-muted/20 rounded-full flex items-center justify-center mx-auto mb-4">
                           <Receipt className="h-8 w-8 text-muted-foreground/30" />
                         </div>
                         <p className="text-muted-foreground font-bold uppercase tracking-widest text-xs">Aucune dépense enregistrée</p>
                         <p className="text-muted-foreground/60 text-sm max-w-[280px] mx-auto italic">Créez d'abord une catégorie en haut de page pour organiser votre budget.</p>
                      </div>
                   )}
                </div>
             </div>
          </div>
        </Card>
      </PremiumAccessGate>
    </div>
  );
}
