import { useQuery } from "@tanstack/react-query";
import { Star, Bug, Lightbulb, Rocket, HelpCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { ProductFeedback } from "@shared/schema";

const TYPE_CONFIG: Record<string, { icon: typeof Bug; label: string }> = {
  bug: { icon: Bug, label: "Bug" },
  suggestion: { icon: Lightbulb, label: "Suggestion" },
  improvement: { icon: Rocket, label: "Amélioration" },
  other: { icon: HelpCircle, label: "Autre" },
};

const STATUS_CONFIG: Record<string, { label: string; variant: "default" | "secondary" | "outline" }> = {
  new: { label: "Nouveau", variant: "default" },
  reviewed: { label: "Consulté", variant: "secondary" },
  resolved: { label: "Résolu", variant: "outline" },
};

export function FeedbackHistory({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const { data: feedbacks = [], isLoading } = useQuery<ProductFeedback[]>({
    queryKey: ["/api/feedback/mine"],
    queryFn: async () => {
      const res = await fetch("/api/feedback/mine", { credentials: "include" });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    enabled: open,
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Mes feedbacks</DialogTitle>
        </DialogHeader>
        <div className="flex-1 overflow-y-auto space-y-3 pr-1">
          {isLoading ? (
            <p className="text-sm text-muted-foreground text-center py-8">Chargement…</p>
          ) : feedbacks.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">Aucun feedback envoyé pour le moment.</p>
          ) : (
            feedbacks.map((fb) => {
              const typeInfo = TYPE_CONFIG[fb.type] || TYPE_CONFIG.other;
              const statusInfo = STATUS_CONFIG[fb.status] || STATUS_CONFIG.new;
              const Icon = typeInfo.icon;
              return (
                <div key={fb.id} className="rounded-lg border p-3 space-y-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Icon className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">{typeInfo.label}</span>
                      {fb.rating && (
                        <span className="inline-flex gap-0.5 ml-1">
                          {[1, 2, 3, 4, 5].map((i) => (
                            <Star key={i} className={`h-3 w-3 ${i <= fb.rating! ? "fill-amber-400 text-amber-400" : "text-muted-foreground/30"}`} />
                          ))}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={statusInfo.variant} className="text-xs">{statusInfo.label}</Badge>
                      <span className="text-xs text-muted-foreground">
                        {fb.createdAt ? new Date(fb.createdAt).toLocaleDateString("fr-FR") : ""}
                      </span>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground line-clamp-3">{fb.message}</p>
                </div>
              );
            })
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
