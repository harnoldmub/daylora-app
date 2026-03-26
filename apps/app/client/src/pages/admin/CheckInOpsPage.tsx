import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Search, CheckCircle2, Users, Clock, ScanLine, Copy, ExternalLink } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useWedding } from "@/hooks/use-api";
import { useParams } from "wouter";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";

type CheckInItem = {
  id: number;
  firstName: string;
  lastName: string;
  publicToken?: string | null;
  checkedInAt?: string | null;
  invitationTypeId?: string | null;
  invitationTypeLabel?: string | null;
  assignedTable?: { name?: string; number?: number | null } | null;
  allowedSegments: Array<{ id: string; label: string }>;
};

export default function CheckInOpsPage() {
  const { weddingId } = useParams<{ weddingId: string }>();
  const { data: wedding } = useWedding(weddingId);
  const { toast } = useToast();
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const [invitationTypeId, setInvitationTypeId] = useState("");
  const [segmentId, setSegmentId] = useState("");
  const [selectedIds, setSelectedIds] = useState<number[]>([]);

  const invitationTypes = (((wedding?.config?.sections as any)?.guestExperience?.invitationTypes || []) as Array<{ id: string; label: string }>);
  const segments = (((wedding?.config?.sections as any)?.guestExperience?.eventSegments || []) as Array<{ id: string; label: string }>);
  const allowMassCheckIn = (((wedding?.config?.sections as any)?.guestExperience?.checkInSettings?.allowMassCheckIn ?? true) as boolean);
  const publicCheckInPath = wedding?.slug ? `/${wedding.slug}/checkin` : "/checkin";
  const publicCheckInUrl = typeof window !== "undefined" ? `${window.location.origin}${publicCheckInPath}` : publicCheckInPath;

  const { data, isLoading } = useQuery<{ items: CheckInItem[]; counts: { total: number; checkedIn: number; pending: number } }>({
    queryKey: ["/api/checkin/ops", query, status, invitationTypeId, segmentId],
    queryFn: async () => {
      const params = new URLSearchParams({
        q: query,
        status,
        invitationTypeId,
        segmentId,
      });
      const res = await apiRequest("GET", `/api/checkin/ops?${params.toString()}`);
      return res.json();
    },
  });

  const singleMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest("POST", `/api/checkin/${id}`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/checkin/ops"] });
      toast({ title: "Arrivée enregistrée" });
    },
  });

  const bulkMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/checkin/bulk", { ids: selectedIds });
      return res.json();
    },
    onSuccess: () => {
      setSelectedIds([]);
      queryClient.invalidateQueries({ queryKey: ["/api/checkin/ops"] });
      toast({ title: "Check-in de masse effectué" });
    },
  });

  const items = data?.items || [];
  const copyToClipboard = async (value: string, label: string) => {
    try {
      await navigator.clipboard.writeText(value);
      toast({ title: "Lien copié", description: `${label} copié dans le presse-papier.` });
    } catch {
      toast({ title: "Copie impossible", description: "Le navigateur a bloqué l'accès au presse-papier.", variant: "destructive" });
    }
  };

  return (
    <div className="space-y-8">
      <AdminPageHeader
        title="Check-in jour J"
        description="Recherche rapide, filtre par invitation ou segment, et validation mobile-first."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" onClick={() => window.open(publicCheckInPath, "_blank", "noopener,noreferrer")}>
              <ExternalLink className="h-4 w-4 mr-2" />
              Lien public
            </Button>
            <Button variant="outline" onClick={() => copyToClipboard(publicCheckInUrl, "Le lien public de check-in")}>
              <Copy className="h-4 w-4 mr-2" />
              Copier le lien
            </Button>
            {allowMassCheckIn ? <Button variant="outline" disabled={!selectedIds.length || bulkMutation.isPending} onClick={() => bulkMutation.mutate()}>{bulkMutation.isPending ? "Validation..." : `Check-in masse (${selectedIds.length})`}</Button> : null}
          </div>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-5"><div className="flex items-center gap-3"><Users className="h-5 w-5 text-primary" /><div><div className="text-sm text-muted-foreground">Total</div><div className="text-2xl font-semibold">{data?.counts.total ?? 0}</div></div></div></Card>
        <Card className="p-5"><div className="flex items-center gap-3"><CheckCircle2 className="h-5 w-5 text-green-600" /><div><div className="text-sm text-muted-foreground">Arrivés</div><div className="text-2xl font-semibold">{data?.counts.checkedIn ?? 0}</div></div></div></Card>
        <Card className="p-5"><div className="flex items-center gap-3"><Clock className="h-5 w-5 text-amber-600" /><div><div className="text-sm text-muted-foreground">En attente</div><div className="text-2xl font-semibold">{data?.counts.pending ?? 0}</div></div></div></Card>
      </div>

      <Card className="p-4 space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div className="relative">
            <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input className="pl-9" placeholder="Nom ou email" value={query} onChange={(e) => setQuery(e.target.value)} />
          </div>
          <select className="h-10 rounded-md border px-3 text-sm" value={invitationTypeId} onChange={(e) => setInvitationTypeId(e.target.value)}>
            <option value="">Tous les types</option>
            {invitationTypes.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}
          </select>
          <select className="h-10 rounded-md border px-3 text-sm" value={segmentId} onChange={(e) => setSegmentId(e.target.value)}>
            <option value="">Tous les segments</option>
            {segments.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}
          </select>
          <select className="h-10 rounded-md border px-3 text-sm" value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="all">Tous</option>
            <option value="pending">En attente</option>
            <option value="checked_in">Arrivés</option>
          </select>
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-3">
        {isLoading ? <Card className="p-8 text-center text-muted-foreground">Chargement...</Card> : items.map((guest) => (
          <Card key={guest.id} className="p-4">
            <div className="flex items-start gap-3">
              {allowMassCheckIn ? (
                <input
                  type="checkbox"
                  className="mt-1"
                  checked={selectedIds.includes(guest.id)}
                  onChange={(e) => setSelectedIds((prev) => e.target.checked ? [...prev, guest.id] : prev.filter((id) => id !== guest.id))}
                />
              ) : null}
              <div className="flex-1 space-y-2">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="font-semibold">{guest.firstName} {guest.lastName}</div>
                    <div className="text-sm text-muted-foreground">{guest.invitationTypeLabel || "Standard"} • {guest.assignedTable?.name || (guest.assignedTable?.number ? `Table ${guest.assignedTable.number}` : "Sans table")}</div>
                  </div>
                  <div className="flex flex-wrap items-center justify-end gap-2">
                    {guest.publicToken ? (
                      <>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => window.open(`${publicCheckInPath}?token=${guest.publicToken}`, "_blank", "noopener,noreferrer")}
                        >
                          <ExternalLink className="h-4 w-4 mr-2" />
                          Lien invité
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => copyToClipboard(`${window.location.origin}${publicCheckInPath}?token=${guest.publicToken}`, `Le lien check-in de ${guest.firstName}`)}
                        >
                          <Copy className="h-4 w-4 mr-2" />
                          Copier
                        </Button>
                      </>
                    ) : null}
                    {guest.checkedInAt ? (
                      <div className="rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-700">Arrivé</div>
                    ) : (
                      <Button size="sm" onClick={() => singleMutation.mutate(guest.id)} disabled={singleMutation.isPending}>
                        <ScanLine className="h-4 w-4 mr-2" />
                        Marquer arrivé
                      </Button>
                    )}
                  </div>
                </div>
                {guest.allowedSegments.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {guest.allowedSegments.map((segment) => (
                      <span key={segment.id} className="rounded-full bg-slate-100 px-2 py-1 text-xs text-slate-700">{segment.label}</span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
