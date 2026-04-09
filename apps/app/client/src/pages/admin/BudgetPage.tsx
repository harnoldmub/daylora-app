import { useMemo, useState } from "react";
import { Loader2, Plus, Receipt, Wallet, WalletCards } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { KpiCard } from "@/components/admin/KpiCard";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useBudget, useCreateBudgetCategory, useCreateBudgetItem, useUpdateBudgetItem } from "@/hooks/use-api";
import { useToast } from "@/hooks/use-toast";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";

function formatCurrency(cents: number) {
  return new Intl.NumberFormat("fr-BE", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format((cents || 0) / 100);
}

export default function BudgetPage() {
  const { toast } = useToast();
  const { data, isLoading } = useBudget();
  const createCategory = useCreateBudgetCategory();
  const createItem = useCreateBudgetItem();
  const updateItem = useUpdateBudgetItem();

  const [newCategoryLabel, setNewCategoryLabel] = useState("");
  const [drafts, setDrafts] = useState<Record<number, { label: string; planned: string; actual: string }>>({});

  const categories = data?.categories || [];
  const totals = data?.totals || { plannedAmountCents: 0, actualAmountCents: 0, remainingAmountCents: 0 };
  const usagePercent = totals.plannedAmountCents > 0 ? Math.min(100, Math.round((totals.actualAmountCents / totals.plannedAmountCents) * 100)) : 0;

  const nextCategoryOrder = useMemo(
    () => categories.reduce((max, category) => Math.max(max, category.sortOrder || 0), -1) + 1,
    [categories],
  );

  const handleCreateCategory = async () => {
    const label = newCategoryLabel.trim();
    if (!label) return;
    try {
      await createCategory.mutateAsync({
        label,
        key: null,
        sortOrder: nextCategoryOrder,
        isDefault: false,
      });
      setNewCategoryLabel("");
    } catch (error: any) {
      toast({ title: "Catégorie non ajoutée", description: error.message || "Réessayez dans un instant.", variant: "destructive" });
    }
  };

  const handleCreateItem = async (categoryId: number) => {
    const draft = drafts[categoryId] || { label: "", planned: "", actual: "" };
    const label = draft.label.trim();
    if (!label) return;
    try {
      await createItem.mutateAsync({
        categoryId,
        label,
        plannedAmountCents: Math.max(0, Math.round(Number(draft.planned || 0) * 100)),
        actualAmountCents: Math.max(0, Math.round(Number(draft.actual || 0) * 100)),
        status: "planned",
        vendorName: null,
        notes: null,
        paymentDueAt: null,
      });
      setDrafts((current) => ({ ...current, [categoryId]: { label: "", planned: "", actual: "" } }));
    } catch (error: any) {
      toast({ title: "Ligne non ajoutée", description: error.message || "Réessayez dans un instant.", variant: "destructive" });
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-[320px] items-center justify-center">
        <Loader2 className="h-7 w-7 animate-spin text-primary/50" />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-8">
      <AdminPageHeader
        title="Budget"
        description="Suivez simplement ce que vous prévoyez, ce que vous avez déjà dépensé et ce qu’il reste."
        actions={
          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
            <Input
              value={newCategoryLabel}
              onChange={(event) => setNewCategoryLabel(event.target.value)}
              placeholder="Ajouter une catégorie"
              className="sm:w-56"
            />
            <Button onClick={handleCreateCategory}>
              <Plus className="mr-2 h-4 w-4" />
              Ajouter
            </Button>
          </div>
        }
      />

      <div className="grid gap-4 md:grid-cols-3">
        <KpiCard label="Prévu" value={formatCurrency(totals.plannedAmountCents)} hint="Budget total prévu" icon={<Wallet className="h-5 w-5" />} />
        <KpiCard label="Dépensé" value={formatCurrency(totals.actualAmountCents)} hint="Montant déjà engagé" icon={<Receipt className="h-5 w-5" />} />
        <KpiCard label="Reste" value={formatCurrency(totals.remainingAmountCents)} hint="Budget encore disponible" icon={<WalletCards className="h-5 w-5" />} />
      </div>

      <Card className="rounded-[28px] border-border/70 p-5 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-semibold">Lecture rapide du budget</p>
            <p className="text-sm text-muted-foreground">Suivez l’équilibre entre ce que vous aviez prévu et ce qui est déjà engagé.</p>
          </div>
          <Badge variant="outline" className="w-fit rounded-full px-3 py-1">
            {usagePercent}% consommé
          </Badge>
        </div>
        <Progress value={usagePercent} className="mt-4 h-2.5" />
      </Card>

      {categories.length === 0 ? (
        <Card className="rounded-[28px] border border-dashed border-border/70 bg-card/60 p-8 text-center shadow-sm">
          <h2 className="text-xl font-semibold tracking-tight">Commencez votre budget</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Ajoutez une catégorie puis quelques lignes de dépenses pour suivre votre prévu, votre dépensé et votre reste.
          </p>
        </Card>
      ) : null}

      <div className="space-y-4">
        {categories.map((category) => (
          <Card key={category.id} className="rounded-[28px] border-border/70 p-5 shadow-sm">
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                <div>
                  <h2 className="text-xl font-semibold tracking-tight">{category.label}</h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Prévu {formatCurrency(category.plannedAmountCents)} · Dépensé {formatCurrency(category.actualAmountCents)} · Reste {formatCurrency(category.remainingAmountCents)}
                  </p>
                </div>
                <div className="min-w-[180px]">
                  <Progress
                    value={category.plannedAmountCents > 0 ? Math.min(100, Math.round((category.actualAmountCents / category.plannedAmountCents) * 100)) : 0}
                    className="h-2.5"
                  />
                </div>
              </div>

              <div className="space-y-3">
                {category.items.map((item) => (
                  <div key={item.id} className="grid gap-3 rounded-2xl border border-border/70 bg-background/80 p-3 md:grid-cols-[1.4fr_0.7fr_0.7fr_0.9fr]">
                    <Input
                      value={item.label}
                      onChange={(event) => updateItem.mutate({ id: item.id, label: event.target.value })}
                    />
                    <Input
                      type="number"
                      min="0"
                      step="1"
                      value={Math.round((item.plannedAmountCents || 0) / 100)}
                      onChange={(event) =>
                        updateItem.mutate({
                          id: item.id,
                          plannedAmountCents: Math.max(0, Math.round(Number(event.target.value || 0) * 100)),
                        })
                      }
                    />
                    <Input
                      type="number"
                      min="0"
                      step="1"
                      value={Math.round((item.actualAmountCents || 0) / 100)}
                      onChange={(event) =>
                        updateItem.mutate({
                          id: item.id,
                          actualAmountCents: Math.max(0, Math.round(Number(event.target.value || 0) * 100)),
                        })
                      }
                    />
                    <Select
                      value={item.status}
                      onValueChange={(value) => updateItem.mutate({ id: item.id, status: value as "planned" | "booked" | "paid" | "cancelled" })}
                    >
                      <SelectTrigger className="rounded-xl">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="planned">Prévu</SelectItem>
                        <SelectItem value="booked">Réservé</SelectItem>
                        <SelectItem value="paid">Payé</SelectItem>
                        <SelectItem value="cancelled">Annulé</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                ))}
              </div>

              <div className="grid gap-3 rounded-2xl border border-dashed border-border/70 bg-muted/20 p-3 md:grid-cols-[1.4fr_0.7fr_0.7fr_auto]">
                <Input
                  value={drafts[category.id]?.label || ""}
                  onChange={(event) =>
                    setDrafts((current) => ({
                      ...current,
                      [category.id]: { ...(current[category.id] || { planned: "", actual: "" }), label: event.target.value },
                    }))
                  }
                  placeholder="Nouvelle dépense"
                />
                <Input
                  type="number"
                  min="0"
                  step="1"
                  value={drafts[category.id]?.planned || ""}
                  onChange={(event) =>
                    setDrafts((current) => ({
                      ...current,
                      [category.id]: { ...(current[category.id] || { label: "", actual: "" }), planned: event.target.value },
                    }))
                  }
                  placeholder="Prévu"
                />
                <Input
                  type="number"
                  min="0"
                  step="1"
                  value={drafts[category.id]?.actual || ""}
                  onChange={(event) =>
                    setDrafts((current) => ({
                      ...current,
                      [category.id]: { ...(current[category.id] || { label: "", planned: "" }), actual: event.target.value },
                    }))
                  }
                  placeholder="Dépensé"
                />
                <Button variant="outline" onClick={() => handleCreateItem(category.id)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Ajouter
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
