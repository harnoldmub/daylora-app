import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Star, Eye } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { Feedback } from "@shared/schema";

const STATUS_MAP: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  new: { label: "Nouveau", variant: "default" },
  in_progress: { label: "En cours", variant: "secondary" },
  done: { label: "Terminé", variant: "outline" },
};

function StatusBadge({ status }: { status: string }) {
  const info = STATUS_MAP[status] || { label: status, variant: "default" as const };
  return <Badge variant={info.variant}>{info.label}</Badge>;
}

function Stars({ count }: { count: number }) {
  return (
    <span className="inline-flex gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          className={`h-4 w-4 ${i <= count ? "fill-amber-400 text-amber-400" : "text-muted-foreground/30"}`}
        />
      ))}
    </span>
  );
}

export default function FeedbackPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState("all");
  const [selected, setSelected] = useState<Feedback | null>(null);

  const statusFilter = tab === "all" ? undefined : tab;

  const { data: feedbackList = [], isLoading } = useQuery<Feedback[]>({
    queryKey: ["/api/admin/feedback", statusFilter],
    queryFn: async () => {
      const url = statusFilter
        ? `/api/admin/feedback?status=${statusFilter}`
        : "/api/admin/feedback";
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch feedback");
      return res.json();
    },
  });

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      const res = await fetch(`/api/admin/feedback/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error("Failed to update status");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/feedback"] });
      toast({ title: "Statut mis à jour" });
    },
  });

  const handleStatusChange = (id: number, status: string) => {
    updateStatus.mutate({ id, status });
    if (selected && selected.id === id) {
      setSelected({ ...selected, status });
    }
  };

  return (
    <div className="space-y-6">
      <AdminPageHeader title="Avis utilisateurs" description="Consultez et gérez les retours de vos utilisateurs." />

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="all">Tous</TabsTrigger>
          <TabsTrigger value="new">Nouveau</TabsTrigger>
          <TabsTrigger value="in_progress">En cours</TabsTrigger>
          <TabsTrigger value="done">Terminé</TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="rounded-xl border bg-card shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Note</TableHead>
              <TableHead>Titre</TableHead>
              <TableHead className="max-w-[200px]">Message</TableHead>
              <TableHead>Statut</TableHead>
              <TableHead>Email</TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  Chargement…
                </TableCell>
              </TableRow>
            ) : feedbackList.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  Aucun avis pour le moment.
                </TableCell>
              </TableRow>
            ) : (
              feedbackList.map((fb) => (
                <TableRow key={fb.id}>
                  <TableCell className="whitespace-nowrap text-sm">
                    {fb.createdAt ? new Date(fb.createdAt).toLocaleDateString("fr-FR") : "—"}
                  </TableCell>
                  <TableCell>
                    <Stars count={fb.rating ?? 0} />
                  </TableCell>
                  <TableCell className="font-medium">{fb.title || "—"}</TableCell>
                  <TableCell className="max-w-[200px] truncate text-sm text-muted-foreground">
                    {fb.message}
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={fb.status ?? "new"} />
                  </TableCell>
                  <TableCell className="text-sm">{fb.email || "—"}</TableCell>
                  <TableCell>
                    <Button variant="ghost" size="icon" onClick={() => setSelected(fb)}>
                      <Eye className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={!!selected} onOpenChange={(open) => !open && setSelected(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Détail de l'avis</DialogTitle>
          </DialogHeader>
          {selected && (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Stars count={selected.rating ?? 0} />
                <span className="text-sm text-muted-foreground">
                  {selected.createdAt ? new Date(selected.createdAt).toLocaleDateString("fr-FR") : ""}
                </span>
              </div>
              {selected.title && (
                <h3 className="font-semibold text-lg">{selected.title}</h3>
              )}
              <p className="text-sm whitespace-pre-wrap">{selected.message}</p>
              {selected.email && (
                <p className="text-sm text-muted-foreground">
                  Contact : {selected.email}
                </p>
              )}
              {selected.page && (
                <p className="text-xs text-muted-foreground">
                  Page : {selected.page}
                </p>
              )}
              <div className="flex items-center gap-3 pt-2 border-t">
                <span className="text-sm font-medium">Statut :</span>
                <Select
                  value={selected.status ?? "new"}
                  onValueChange={(val) => handleStatusChange(selected.id, val)}
                >
                  <SelectTrigger className="w-[160px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="new">Nouveau</SelectItem>
                    <SelectItem value="in_progress">En cours</SelectItem>
                    <SelectItem value="done">Terminé</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
