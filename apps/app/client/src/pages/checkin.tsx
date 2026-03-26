import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useMutation, useQuery } from "@tanstack/react-query";
import { CheckCircle2, ChevronDown, ChevronUp, Clock3, Loader2, Search, SquareMenu, Users, X } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

type PublicCheckInItem = {
  id: number;
  firstName: string;
  lastName: string;
  partySize: number;
  publicToken?: string | null;
  checkedInAt?: string | null;
  invitationTypeId?: string | null;
  invitationTypeLabel?: string | null;
  assignedTable?: { name?: string; number?: number | null } | null;
  allowedSegments: Array<{ id: string; label: string }>;
};

type PublicCheckInResponse = {
  wedding: {
    id: string;
    slug: string;
    title: string;
    weddingDate?: string | null;
    config?: any;
  };
  items: PublicCheckInItem[];
  counts: {
    total: number;
    checkedIn: number;
    pending: number;
  };
};

function getSlugFromPath(pathname: string) {
  const parts = pathname.split("/").filter(Boolean);
  if (parts.length >= 2 && parts[1] === "checkin") return parts[0];
  return "";
}

function formatEventDate(value?: string | null) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("fr-FR", { day: "numeric", month: "long" });
}

function getGuestName(guest: PublicCheckInItem) {
  return `${guest.firstName || ""} ${guest.lastName || ""}`.trim() || "Invité sans nom";
}

function getTableLabel(guest: PublicCheckInItem) {
  if (guest.assignedTable?.number && guest.assignedTable?.name) {
    return `Table ${guest.assignedTable.number} - ${guest.assignedTable.name}`;
  }
  if (guest.assignedTable?.name) return guest.assignedTable.name;
  if (guest.assignedTable?.number) return `Table ${guest.assignedTable.number}`;
  return "Sans table";
}

function FilterTab({
  active,
  label,
  value,
  onClick,
}: {
  active: boolean;
  label: string;
  value: string;
  onClick: (value: string) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onClick(value)}
      className={cn(
        "h-9 rounded-xl border px-3 text-xs font-medium transition-colors sm:h-10 sm:text-sm",
        active ? "border-[#b89c4f] bg-[#b89c4f] text-white" : "border-[#ece5d9] bg-white text-slate-500 hover:bg-[#faf7f1]",
      )}
    >
      {label}
    </button>
  );
}

export default function CheckIn() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const searchParams = new URLSearchParams(window.location.search);
  const token = searchParams.get("token") || "";
  const slug = getSlugFromPath(window.location.pathname);

  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const [selectedGuestId, setSelectedGuestId] = useState<number | null>(null);

  const { data, isLoading, refetch } = useQuery<PublicCheckInResponse>({
    queryKey: ["/api/checkin/public", slug, query, status, token],
    queryFn: async () => {
      if (!slug) throw new Error("Slug manquant");
      const params = new URLSearchParams({
        q: query,
        status,
      });
      if (token) params.set("token", token);
      const res = await fetch(`/api/checkin/public/${slug}?${params.toString()}`);
      if (!res.ok) throw new Error("Impossible de charger le check-in");
      return res.json();
    },
    enabled: !!slug,
  });

  useEffect(() => {
    if (!data?.items?.length) return;
    if (token) {
      setSelectedGuestId(data.items[0].id);
      return;
    }
    setSelectedGuestId((current) => current ?? data.items[0]?.id ?? null);
  }, [data?.items, token]);

  const checkInMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/checkin/${id}`, { method: "POST" });
      if (!res.ok) throw new Error("Failed to check in");
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Succès",
        description: "Invité marqué comme présent",
        className: "bg-green-600 text-white border-none",
      });
      refetch();
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Impossible de valider l'entrée",
        variant: "destructive",
      });
    },
  });

  const resetCheckInMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/checkin/${id}/reset`, { method: "POST" });
      if (!res.ok) throw new Error("Failed to reset check-in");
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Succès",
        description: "Arrivée supprimée",
      });
      refetch();
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Impossible de supprimer l'arrivée",
        variant: "destructive",
      });
    },
  });

  const counts = data?.counts || { total: 0, checkedIn: 0, pending: 0 };
  const wedding = data?.wedding;
  const eventDate = formatEventDate(wedding?.weddingDate);
  const clearToken = () => {
    if (slug) {
      setLocation(`/${slug}/checkin`);
    } else {
      setLocation("/checkin");
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#f7f2ea] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#b89c4f]" />
      </div>
    );
  }

  if (!slug || !data) {
    return (
      <div className="min-h-screen bg-[#f7f2ea] flex items-center justify-center p-6">
        <Card className="max-w-md rounded-[28px] border-[#ece5d9] p-8 text-center text-slate-600">
          Impossible de charger l'accueil invités.
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f7f2ea] px-3 py-3 sm:px-4">
      <div className="mx-auto max-w-3xl space-y-3">
        <section className="rounded-[24px] border border-[#ece5d9] bg-transparent p-1">
          <div className="rounded-[20px] bg-[#f7f2ea] p-3 sm:p-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full border border-[#e5d9c6] bg-white text-[#8e7c57]">
                  <span className="font-serif text-xs">
                    {wedding?.title?.trim()?.charAt(0)?.toUpperCase() || "A"}
                  </span>
                </div>
                <div>
                  <h1 className="font-serif text-xl text-slate-900 sm:text-[1.7rem]">Accueil Invités</h1>
                  <p className="mt-0.5 text-xs text-slate-500 sm:text-sm">{eventDate || "Jour J"}</p>
                </div>
              </div>

              <div className="pt-1 text-right">
                <div className="text-lg font-semibold text-slate-900 sm:text-xl">{counts.checkedIn} présents</div>
              </div>
            </div>

            <div className="mt-3">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Rechercher un invité..."
                  className="h-10 rounded-xl border-[#ece5d9] bg-white pl-10 pr-3 text-sm shadow-sm placeholder:text-slate-400"
                />
              </div>
            </div>

            <div className="mt-3 grid grid-cols-1 gap-2 md:grid-cols-3">
              <FilterTab active={status === "all"} value="all" label={`Tous (${counts.total})`} onClick={setStatus} />
              <FilterTab active={status === "pending"} value="pending" label={`Attendus (${counts.pending})`} onClick={setStatus} />
              <FilterTab active={status === "checked_in"} value="checked_in" label={`Arrivés (${counts.checkedIn})`} onClick={setStatus} />
            </div>

            {token ? (
              <div className="mt-4 flex flex-wrap items-center gap-3">
                <div className="rounded-full bg-white px-3 py-1.5 text-xs text-slate-600 shadow-sm">
                  Mode invitation ciblée
                </div>
                <Button variant="outline" className="h-9 rounded-xl border-[#e7ddce] bg-white px-3 text-xs" onClick={clearToken}>
                  Voir toute la liste
                </Button>
              </div>
            ) : null}
          </div>
        </section>

        <section className="space-y-3">
          {data.items.length === 0 ? (
            <Card className="rounded-[20px] border-[#ece5d9] p-6 text-center text-sm text-slate-500">
              Aucun invité trouvé.
            </Card>
          ) : (
            data.items.map((guest) => {
              const isCheckedIn = Boolean(guest.checkedInAt);
              const isActive = selectedGuestId === guest.id;

              return (
                <button
                  key={guest.id}
                  type="button"
                  onClick={() => setSelectedGuestId((current) => (current === guest.id ? null : guest.id))}
                  className={cn(
                    "w-full text-left rounded-[18px] border bg-white p-3.5 shadow-sm transition-colors",
                    isCheckedIn ? "border-[#b9efc5]" : "border-[#ece5d9]",
                    isActive ? "ring-1 ring-[#d9efdd]" : "",
                  )}
                >
                  <div className="flex flex-col gap-2.5 md:flex-row md:items-center md:justify-between">
                    <div className="flex items-start gap-3">
                      <div
                        className={cn(
                          "mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2",
                          isCheckedIn ? "border-[#59c36a] text-[#59c36a]" : "border-[#d8cfbf] text-[#8f815f]",
                        )}
                      >
                        {isCheckedIn ? <CheckCircle2 className="h-4 w-4" /> : <Clock3 className="h-3.5 w-3.5" />}
                      </div>

                      <div>
                        <div className={cn("text-lg leading-none font-medium sm:text-[1.35rem]", isCheckedIn ? "text-[#3f9f52]" : "text-slate-900")}>
                          {getGuestName(guest)}
                        </div>
                        <div className="mt-1 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs text-slate-500 sm:text-sm">
                          <span className="inline-flex items-center gap-2">
                            <SquareMenu className="h-3 w-3" />
                            {getTableLabel(guest)}
                          </span>
                          {guest.invitationTypeLabel ? <span>{guest.invitationTypeLabel}</span> : null}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-end gap-2">
                      <div
                        className={cn(
                          "inline-flex items-center gap-2 rounded-xl border px-2.5 py-1 text-xs font-semibold",
                          isCheckedIn
                            ? "border-[#d7eedc] bg-[#eefaf1] text-[#4ba95b]"
                            : "border-[#efe5cf] bg-[#fff8e6] text-[#9b8747]",
                        )}
                      >
                        {isCheckedIn ? "Arrivé" : "Attendu"}
                      </div>
                      {isActive ? <ChevronUp className="h-4 w-4 text-slate-500" /> : <ChevronDown className="h-4 w-4 text-slate-500" />}
                    </div>
                  </div>

                  {isActive ? (
                    <div className="mt-3 border-t border-[#eef2ea] pt-3">
                      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                        <div className="space-y-1 text-sm text-slate-600">
                          <div className="flex items-center gap-2">
                            <Users className="h-3.5 w-3.5 text-slate-400" />
                            <span>Groupe : {guest.partySize > 1 ? `${guest.partySize} personnes` : "1 personne"}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Clock3 className="h-3.5 w-3.5 text-slate-400" />
                            <span>
                              {guest.checkedInAt
                                ? `Arrivée : ${new Date(guest.checkedInAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`
                                : "En attente d'arrivée"}
                            </span>
                          </div>
                        </div>

                        {guest.checkedInAt ? (
                          <Button
                            variant="outline"
                            className="h-10 rounded-xl border-[#efd9d4] bg-white px-4 text-sm text-[#ef6257] hover:bg-[#fff8f7]"
                            onClick={(event) => {
                              event.stopPropagation();
                              resetCheckInMutation.mutate(guest.id);
                            }}
                            disabled={resetCheckInMutation.isPending}
                          >
                            <X className="mr-2 h-4 w-4" />
                            Supprimer l'arrivée
                          </Button>
                        ) : (
                          <Button
                            className="h-10 rounded-xl bg-[#59c36a] px-4 text-sm font-semibold text-white hover:bg-[#48ad58]"
                            onClick={(event) => {
                              event.stopPropagation();
                              checkInMutation.mutate(guest.id);
                            }}
                            disabled={checkInMutation.isPending}
                          >
                            Valider l'arrivée
                          </Button>
                        )}
                      </div>
                    </div>
                  ) : null}
                </button>
              );
            })
          )}
        </section>
      </div>
    </div>
  );
}
