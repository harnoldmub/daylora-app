import { useMemo, useState } from "react";
import { CalendarClock, CheckCircle2, Clock3, Loader2, Plus, Trash2, TimerReset } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { KpiCard } from "@/components/admin/KpiCard";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCreatePlanningItem, useDeletePlanningItem, usePlanning, useUpdatePlanningItem } from "@/hooks/use-api";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";

const STATUS_OPTIONS = [
  { value: "todo", label: "À faire" },
  { value: "in_progress", label: "En cours" },
  { value: "done", label: "Terminé" },
];

const KIND_OPTIONS = [
  { value: "milestone", label: "Étape clé" },
  { value: "reminder", label: "Rappel" },
  { value: "appointment", label: "Rendez-vous" },
];

function formatDate(value?: string | Date | null) {
  if (!value) return "Sans date";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Sans date";
  return new Intl.DateTimeFormat("fr-BE", { day: "2-digit", month: "short", year: "numeric" }).format(date);
}

export default function PlanningPage() {
  const { toast } = useToast();
  const { data, isLoading } = usePlanning();
  const createItem = useCreatePlanningItem();
  const updateItem = useUpdatePlanningItem();
  const deleteItem = useDeletePlanningItem();

  const [draft, setDraft] = useState({
    title: "",
    description: "",
    kind: "milestone",
    dueAt: "",
  });

  const items = data?.items || [];
  const now = new Date();
  const overdue = items.filter((item) => item.status !== "done" && item.dueAt && new Date(item.dueAt).getTime() < now.getTime()).length;
  const done = items.filter((item) => item.status === "done").length;
  const upcoming = items.filter((item) => item.status !== "done").length;

  const sortedItems = useMemo(
    () =>
      [...items].sort((a, b) => {
        const aTime = a.dueAt ? new Date(a.dueAt).getTime() : Number.MAX_SAFE_INTEGER;
        const bTime = b.dueAt ? new Date(b.dueAt).getTime() : Number.MAX_SAFE_INTEGER;
        return aTime - bTime;
      }),
    [items],
  );

  const handleCreate = async (payload?: { title: string; description?: string | null; kind?: string; dueAt?: string | Date | null }) => {
    const title = (payload?.title ?? draft.title).trim();
    if (!title) return;
    try {
      await createItem.mutateAsync({
        title,
        description: payload?.description ?? draft.description || null,
        kind: payload?.kind ?? draft.kind,
        status: "todo",
        dueAt: payload?.dueAt ? new Date(payload.dueAt) : draft.dueAt ? new Date(draft.dueAt) : null,
        startsAt: null,
        sortOrder: sortedItems.length,
      });
      setDraft({ title: "", description: "", kind: "milestone", dueAt: "" });
    } catch (error: any) {
      toast({ title: "Ajout impossible", description: error.message || "Réessayez dans un instant.", variant: "destructive" });
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
        title="Planning"
        description="Visualisez les étapes clés de votre organisation jusqu’au jour J."
      />

      <div className="grid gap-4 md:grid-cols-3">
        <KpiCard label="À venir" value={upcoming} hint="Étapes encore ouvertes" icon={<CalendarClock className="h-5 w-5" />} />
        <KpiCard label="Terminées" value={done} hint="Étapes déjà validées" icon={<CheckCircle2 className="h-5 w-5" />} />
        <KpiCard label="En retard" value={overdue} hint="Échéances dépassées" icon={<Clock3 className="h-5 w-5" />} />
      </div>

      <Card className="rounded-2xl border-border/70 p-5">
        <div className="grid gap-3 md:grid-cols-[1.4fr_1fr_1fr_auto]">
          <Input
            value={draft.title}
            onChange={(event) => setDraft((current) => ({ ...current, title: event.target.value }))}
            placeholder="Ajouter une étape"
          />
          <Input
            type="date"
            value={draft.dueAt}
            onChange={(event) => setDraft((current) => ({ ...current, dueAt: event.target.value }))}
          />
          <Select value={draft.kind} onValueChange={(value) => setDraft((current) => ({ ...current, kind: value }))}>
            <SelectTrigger className="rounded-xl">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {KIND_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button onClick={() => handleCreate()} disabled={createItem.isPending}>
            <Plus className="mr-2 h-4 w-4" />
            Ajouter
          </Button>
        </div>
        <Textarea
          className="mt-3"
          rows={3}
          value={draft.description}
          onChange={(event) => setDraft((current) => ({ ...current, description: event.target.value }))}
          placeholder="Description ou notes pour cette étape (optionnel)"
        />
      </Card>

      <Card className="rounded-[28px] border-border/70 bg-card/70 p-5 shadow-sm">
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-semibold">Vue d’ensemble</p>
            <p className="text-sm text-muted-foreground">Votre planning reste volontairement simple : liste claire, dates visibles, statuts faciles à mettre à jour.</p>
          </div>
          <Badge variant="outline" className="w-fit rounded-full px-3 py-1 text-xs">
            Mobile-friendly
          </Badge>
        </div>
      </Card>

      {items.length === 0 && data?.suggestedItems?.length ? (
        <Card className="rounded-[28px] border-border/70 p-5">
          <h2 className="text-lg font-semibold">Suggestions pour démarrer</h2>
          <p className="mt-1 text-sm text-muted-foreground">Ajoutez rapidement les grandes étapes recommandées avant le jour J.</p>
          <div className="mt-4 grid gap-3">
            {data.suggestedItems.map((item, index) => (
              <div key={`${item.title}-${index}`} className="rounded-xl border border-border/70 p-4">
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="font-medium">{item.title}</p>
                    {item.description ? <p className="mt-1 text-sm text-muted-foreground">{item.description}</p> : null}
                    <p className="mt-2 text-xs uppercase tracking-[0.18em] text-muted-foreground/60">
                      {formatDate(item.dueAt)} · {KIND_OPTIONS.find((option) => option.value === item.kind)?.label || "Étape"}
                    </p>
                  </div>
                  <Button variant="outline" onClick={() => handleCreate(item)}>
                    Ajouter
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      ) : null}

      <div className="space-y-3">
        {sortedItems.map((item) => (
          <Card key={item.id} className="rounded-[28px] border-border/70 p-4 shadow-sm">
            <div className="flex flex-col gap-3 md:flex-row md:items-start">
              <div className="flex items-start gap-4 flex-1 min-w-0">
                <div className={`mt-0.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${
                  item.status === "done"
                    ? "bg-emerald-500/10 text-emerald-600"
                    : item.dueAt && new Date(item.dueAt).getTime() < now.getTime()
                      ? "bg-amber-500/10 text-amber-700"
                      : "bg-primary/10 text-primary"
                }`}>
                  {item.status === "done" ? <CheckCircle2 className="h-5 w-5" /> : item.dueAt && new Date(item.dueAt).getTime() < now.getTime() ? <TimerReset className="h-5 w-5" /> : <CalendarClock className="h-5 w-5" />}
                </div>
                <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-semibold tracking-tight">{item.title}</p>
                  <span className="rounded-full bg-muted px-2.5 py-1 text-xs text-muted-foreground">
                    {KIND_OPTIONS.find((option) => option.value === item.kind)?.label || "Étape"}
                  </span>
                  <span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">
                    {formatDate(item.dueAt)}
                  </span>
                  {item.dueAt && item.status !== "done" && new Date(item.dueAt).getTime() < now.getTime() ? (
                    <Badge className="rounded-full bg-amber-500/10 text-amber-700 hover:bg-amber-500/10">En retard</Badge>
                  ) : null}
                </div>
                {item.description ? <p className="mt-1.5 text-sm text-muted-foreground">{item.description}</p> : null}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Select value={item.status} onValueChange={(value) => updateItem.mutate({ id: item.id, status: value as "todo" | "in_progress" | "done" })}>
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
                <Button variant="ghost" size="icon" onClick={() => deleteItem.mutate(item.id)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
