import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Star, Eye, Bug, Lightbulb, Rocket, HelpCircle, ImageIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { ProductFeedback } from "@shared/schema";

const TYPE_CONFIG: Record<string, { icon: typeof Bug; label: string; color: string }> = {
  bug: { icon: Bug, label: "Bug", color: "text-red-500" },
  suggestion: { icon: Lightbulb, label: "Suggestion", color: "text-amber-500" },
  improvement: { icon: Rocket, label: "Amélioration", color: "text-blue-500" },
  other: { icon: HelpCircle, label: "Autre", color: "text-gray-500" },
};

const STATUS_MAP: Record<string, { label: string; variant: "default" | "secondary" | "outline" }> = {
  new: { label: "Nouveau", variant: "default" },
  reviewed: { label: "Consulté", variant: "secondary" },
  resolved: { label: "Résolu", variant: "outline" },
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
  const [selected, setSelected] = useState<ProductFeedback | null>(null);

  const statusFilter = tab === "all" ? undefined : tab;

  const { data: feedbackList = [], isLoading } = useQuery<ProductFeedback[]>({
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
      <AdminPageHeader title="Feedbacks produit" description="Retours, bugs et suggestions des utilisateurs." />

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="all">Tous</TabsTrigger>
          <TabsTrigger value="new">Nouveau</TabsTrigger>
          <TabsTrigger value="reviewed">Consulté</TabsTrigger>
          <TabsTrigger value="resolved">Résolu</TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="rounded-xl border bg-card shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Note</TableHead>
              <TableHead className="max-w-[250px]">Message</TableHead>
              <TableHead>URL</TableHead>
              <TableHead>Statut</TableHead>
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
                  Aucun feedback pour le moment.
                </TableCell>
              </TableRow>
            ) : (
              feedbackList.map((fb) => {
                const typeInfo = TYPE_CONFIG[fb.type] || TYPE_CONFIG.other;
                const Icon = typeInfo.icon;
                return (
                  <TableRow key={fb.id}>
                    <TableCell className="whitespace-nowrap text-sm">
                      {fb.createdAt ? new Date(fb.createdAt).toLocaleDateString("fr-FR") : "—"}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5">
                        <Icon className={`h-4 w-4 ${typeInfo.color}`} />
                        <span className="text-sm">{typeInfo.label}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {fb.rating ? <Stars count={fb.rating} /> : <span className="text-muted-foreground text-sm">—</span>}
                    </TableCell>
                    <TableCell className="max-w-[250px] truncate text-sm text-muted-foreground">
                      {fb.message}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground max-w-[120px] truncate">
                      {fb.currentUrl || "—"}
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={fb.status ?? "new"} />
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="icon" onClick={() => setSelected(fb)}>
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={!!selected} onOpenChange={(open) => !open && setSelected(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Détail du feedback</DialogTitle>
          </DialogHeader>
          {selected && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 flex-wrap">
                {(() => {
                  const typeInfo = TYPE_CONFIG[selected.type] || TYPE_CONFIG.other;
                  const Icon = typeInfo.icon;
                  return (
                    <div className="flex items-center gap-1.5">
                      <Icon className={`h-4 w-4 ${typeInfo.color}`} />
                      <span className="text-sm font-medium">{typeInfo.label}</span>
                    </div>
                  );
                })()}
                {selected.rating && <Stars count={selected.rating} />}
                <span className="text-sm text-muted-foreground ml-auto">
                  {selected.createdAt ? new Date(selected.createdAt).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" }) : ""}
                </span>
              </div>

              <div className="bg-muted/50 rounded-lg p-3">
                <p className="text-sm whitespace-pre-wrap">{selected.message}</p>
              </div>

              {selected.screenshotUrl && (
                <div className="rounded-lg border overflow-hidden">
                  <div className="flex items-center gap-1.5 px-3 py-1.5 bg-muted/50 text-xs text-muted-foreground">
                    <ImageIcon className="h-3 w-3" />
                    Capture d'écran
                  </div>
                  <img src={selected.screenshotUrl} alt="Screenshot" className="w-full max-h-48 object-contain bg-white" />
                </div>
              )}

              {selected.currentUrl && (
                <p className="text-xs text-muted-foreground">
                  Page : {selected.currentUrl}
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
                    <SelectItem value="reviewed">Consulté</SelectItem>
                    <SelectItem value="resolved">Résolu</SelectItem>
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
