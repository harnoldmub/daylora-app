import { useMemo, useState } from "react";
import { CheckCircle2, CircleDashed, Loader2, Plus, Sparkles, Trash2, FolderPlus, ListChecks } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { KpiCard } from "@/components/admin/KpiCard";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  useChecklist,
  useCreateChecklistCategory,
  useCreateChecklistItem,
  useDeleteChecklistItem,
  useUpdateChecklistItem,
} from "@/hooks/use-api";
import { useToast } from "@/hooks/use-toast";

const STATUS_OPTIONS = [
  { value: "todo", label: "À faire" },
  { value: "in_progress", label: "En cours" },
  { value: "done", label: "Terminé" },
];

export default function ChecklistPage() {
  const { toast } = useToast();
  const { data, isLoading } = useChecklist();
  const createCategory = useCreateChecklistCategory();
  const createItem = useCreateChecklistItem();
  const updateItem = useUpdateChecklistItem();
  const deleteItem = useDeleteChecklistItem();
  const [newCategoryLabel, setNewCategoryLabel] = useState("");
  const [draftTasks, setDraftTasks] = useState<Record<number, string>>({});

  const categories = data?.categories || [];
  const totals = data?.totals || { total: 0, done: 0, inProgress: 0 };
  const globalProgress = totals.total > 0 ? Math.round((totals.done / totals.total) * 100) : 0;

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
      toast({ title: "Catégorie ajoutée", description: "Votre nouvelle catégorie est prête." });
    } catch (error: any) {
      toast({ title: "Ajout impossible", description: error.message || "Réessayez dans un instant.", variant: "destructive" });
    }
  };

  const handleAddItem = async (categoryId: number, sortOrder: number) => {
    const title = (draftTasks[categoryId] || "").trim();
    if (!title) return;
    try {
      await createItem.mutateAsync({
        categoryId,
        title,
        description: null,
        status: "todo",
        isDefault: false,
        sortOrder,
        dueDate: null,
      });
      setDraftTasks((current) => ({ ...current, [categoryId]: "" }));
    } catch (error: any) {
      toast({ title: "Tâche non ajoutée", description: error.message || "Réessayez dans un instant.", variant: "destructive" });
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
        title="Checklist"
        description="Gardez une vue claire sur tout ce qu’il reste à préparer pour votre événement."
        actions={
          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
            <Input
              value={newCategoryLabel}
              onChange={(event) => setNewCategoryLabel(event.target.value)}
              placeholder="Ajouter une catégorie"
              className="sm:w-56"
            />
            <Button onClick={handleCreateCategory} disabled={createCategory.isPending}>
              <Plus className="mr-2 h-4 w-4" />
              Ajouter
            </Button>
          </div>
        }
      />

      <div className="grid gap-4 md:grid-cols-3">
        <KpiCard label="Progression globale" value={`${globalProgress}%`} hint="Checklist complétée" icon={<Sparkles className="h-5 w-5" />} />
        <KpiCard label="Tâches terminées" value={totals.done} hint={`${totals.total} tâches au total`} icon={<CheckCircle2 className="h-5 w-5" />} />
        <KpiCard label="En cours" value={totals.inProgress} hint="Tâches en cours de traitement" icon={<CircleDashed className="h-5 w-5" />} />
      </div>

      <Card className="rounded-2xl border-border/70 p-5">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold">Organisation générale</p>
            <p className="text-sm text-muted-foreground">Avancement cumulé de toutes vos catégories</p>
          </div>
          <span className="text-sm font-semibold text-primary">{globalProgress}%</span>
        </div>
        <Progress value={globalProgress} className="mt-4 h-2.5" />
      </Card>

      {categories.length === 0 ? (
        <Card className="rounded-[28px] border border-dashed border-border/70 bg-card/60 p-8 text-center shadow-sm">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <FolderPlus className="h-6 w-6" />
          </div>
          <h2 className="mt-4 text-xl font-semibold tracking-tight">Commencez votre organisation</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Ajoutez une première catégorie pour structurer vos préparatifs. La checklist est idéale pour avancer sans rien oublier.
          </p>
        </Card>
      ) : null}

      <div className="space-y-4">
        {categories.map((category) => (
          <Card key={category.id} className="rounded-[28px] border-border/70 p-5 shadow-sm">
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl font-semibold tracking-tight">{category.label}</h2>
                    <Badge variant="secondary" className="rounded-full bg-primary/10 text-primary hover:bg-primary/10">
                      {category.done}/{category.total}
                    </Badge>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {category.inProgress > 0
                      ? `${category.inProgress} tâche${category.inProgress > 1 ? "s" : ""} en cours`
                      : "Aucune tâche en cours pour l’instant"}
                  </p>
                </div>
                <div className="w-full md:max-w-xs">
                  <Progress value={category.progress} className="h-2.5" />
                  <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
                    <span>{category.total - category.done} restantes</span>
                    <span>{category.progress}%</span>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                {category.items.map((item) => (
                  <div key={item.id} className="rounded-2xl border border-border/70 bg-background/80 p-3.5 shadow-[0_1px_0_rgba(0,0,0,0.03)]">
                    <div className="flex flex-col gap-3 md:flex-row md:items-center">
                      <div className="flex items-start gap-3 flex-1 min-w-0">
                        <Checkbox
                          checked={item.status === "done"}
                          onCheckedChange={(checked) =>
                            updateItem.mutate({
                              id: item.id,
                              status: checked ? "done" : "todo",
                            })
                          }
                        />
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className={`font-medium ${item.status === "done" ? "text-muted-foreground line-through" : ""}`}>{item.title}</p>
                            {item.isDefault ? (
                              <Badge variant="outline" className="rounded-full text-[11px]">Suggestion Daylora</Badge>
                            ) : null}
                          </div>
                          {item.description ? <p className="mt-0.5 text-sm text-muted-foreground">{item.description}</p> : null}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Select
                          value={item.status}
                          onValueChange={(value) => updateItem.mutate({ id: item.id, status: value as "todo" | "in_progress" | "done" })}
                        >
                          <SelectTrigger className="w-[150px] rounded-xl">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {STATUS_OPTIONS.map((option) => (
                              <SelectItem key={option.value} value={option.value}>
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {!item.isDefault ? (
                          <Button variant="ghost" size="icon" onClick={() => deleteItem.mutate(item.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        ) : null}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="rounded-2xl border border-dashed border-border/70 bg-muted/20 p-3">
                <div className="mb-2 flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <ListChecks className="h-4 w-4" />
                  Ajouter une tâche personnalisée
                </div>
                <div className="flex flex-col gap-2 sm:flex-row">
                <Input
                  value={draftTasks[category.id] || ""}
                  onChange={(event) => setDraftTasks((current) => ({ ...current, [category.id]: event.target.value }))}
                  placeholder={`Ajouter une tâche dans ${category.label.toLowerCase()}`}
                />
                <Button
                  variant="outline"
                  onClick={() => handleAddItem(category.id, category.items.length)}
                  disabled={createItem.isPending}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Ajouter une tâche
                </Button>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
