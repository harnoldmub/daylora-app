import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import {
    Users,
    Search,
    Plus,
    Download,
    Edit,
    Trash2,
    Mail,
    ExternalLink,
    MessageCircle,
    Loader2,
    CheckCircle2,
    XCircle,
    Clock,
    Filter,
    Tag,
    RefreshCw
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { RsvpResponse } from "@shared/schema";
import { useParams } from "wouter";

export default function GuestsPage() {
    const { weddingId } = useParams<{ weddingId: string }>();
    const { toast } = useToast();
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedIds, setSelectedIds] = useState<number[]>([]);
    const [statusFilter, setStatusFilter] = useState<string>("all");
    const [filtersOpen, setFiltersOpen] = useState(false);
    const [hasEmail, setHasEmail] = useState(false);
    const [hasPhone, setHasPhone] = useState(false);
    const [groupFilter, setGroupFilter] = useState<"all" | "solo" | "couple">("all");
    const [addGuestOpen, setAddGuestOpen] = useState(false);
    const [editGuestOpen, setEditGuestOpen] = useState(false);
    const [editGuestId, setEditGuestId] = useState<number | null>(null);
    const [deleteGuestOpen, setDeleteGuestOpen] = useState(false);
    const [deleteGuestTarget, setDeleteGuestTarget] = useState<RsvpResponse | null>(null);
    const [newGuest, setNewGuest] = useState({
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
        partySize: 1,
        availability: "pending",
        notes: "",
    });
    const [editGuest, setEditGuest] = useState({
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
        partySize: 1,
        availability: "pending",
        notes: "",
    });

    const { data: responses = [], isLoading, refetch, isFetching } = useQuery<RsvpResponse[]>({
        queryKey: ["/api/rsvp", weddingId],
        enabled: !!weddingId,
    });

    const filteredResponses = responses
        .filter((response) =>
            `${response.firstName} ${response.lastName}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (response.email && response.email.toLowerCase().includes(searchQuery.toLowerCase()))
        )
        .filter((response) => (statusFilter === "all" ? true : response.availability === statusFilter))
        .filter((response) => (!hasEmail ? true : !!response.email))
        .filter((response) => (!hasPhone ? true : !!response.phone))
        .filter((response) => {
            if (groupFilter === "solo") return (response.partySize || 1) === 1;
            if (groupFilter === "couple") return (response.partySize || 1) >= 2;
            return true;
        });

    const total = responses.length;
    const confirmed = responses.filter((r) => r.availability === "confirmed").length;
    const declined = responses.filter((r) => r.availability === "declined").length;
    const pending = total - confirmed - declined;

    const createGuestMutation = useMutation({
        mutationFn: async (data: typeof newGuest) => {
            return await apiRequest("POST", "/api/rsvp", {
                ...data,
                email: data.email || null,
                phone: data.phone || null,
                notes: data.notes || null,
            });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/rsvp"] });
            toast({
                title: "Succès",
                description: "Invité ajouté avec succès",
            });
            setAddGuestOpen(false);
            setNewGuest({
                firstName: "",
                lastName: "",
                email: "",
                phone: "",
                partySize: 1,
                availability: "pending",
                notes: "",
            });
        },
        onError: (error: Error) => {
            toast({
                title: "Erreur",
                description: error.message || "Impossible d'ajouter l'invité",
                variant: "destructive",
            });
        },
    });

    const updateGuestMutation = useMutation({
        mutationFn: async (data: typeof editGuest & { id: number }) => {
            return await apiRequest("PATCH", `/api/rsvp/${data.id}`, {
                firstName: data.firstName,
                lastName: data.lastName,
                email: data.email || null,
                phone: data.phone || null,
                partySize: data.partySize,
                availability: data.availability,
                notes: data.notes || null,
            });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/rsvp"] });
            toast({
                title: "Succès",
                description: "Invité mis à jour",
            });
            setEditGuestOpen(false);
        },
        onError: (error: Error) => {
            toast({
                title: "Erreur",
                description: error.message || "Impossible de mettre à jour l'invité",
                variant: "destructive",
            });
        },
    });

    const deleteGuestMutation = useMutation({
        mutationFn: async (id: number) => {
            return await apiRequest("DELETE", `/api/rsvp/${id}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/rsvp"] });
            toast({
                title: "Supprimé",
                description: "Invité supprimé",
            });
        },
        onError: (error: Error) => {
            toast({
                title: "Erreur",
                description: error.message || "Impossible de supprimer l'invité",
                variant: "destructive",
            });
        },
    });

    const handleExportCSV = () => {
        const data = filteredResponses;
        const headers = ["Prénom", "Nom", "Email", "Téléphone", "Nombre", "Disponibilité", "Notes"];
        const escapeCSV = (value: unknown) => {
            const str = String(value ?? "");
            if (/[",\n]/.test(str)) {
                return `"${str.replace(/"/g, '""')}"`;
            }
            return str;
        };
        const rows = data.map((row) => [
            escapeCSV(row.firstName),
            escapeCSV(row.lastName),
            escapeCSV(row.email),
            escapeCSV(row.phone),
            escapeCSV(row.partySize),
            escapeCSV(row.availability),
            escapeCSV(row.notes),
        ]);
        const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
        const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = "invites.csv";
        link.click();
        URL.revokeObjectURL(url);
    };

    const handleAddGuest = () => {
        if (!newGuest.firstName || !newGuest.lastName) {
            toast({
                title: "Champs manquants",
                description: "Merci de renseigner le prénom et le nom.",
                variant: "destructive",
            });
            return;
        }
        createGuestMutation.mutate(newGuest);
    };

    const openEditGuest = (guest: RsvpResponse) => {
        setEditGuestId(guest.id);
        setEditGuest({
            firstName: guest.firstName || "",
            lastName: guest.lastName || "",
            email: guest.email || "",
            phone: guest.phone || "",
            partySize: guest.partySize || 1,
            availability: guest.availability || "pending",
            notes: guest.notes || "",
        });
        setEditGuestOpen(true);
    };

    const handleUpdateGuest = () => {
        if (!editGuestId) return;
        if (!editGuest.firstName || !editGuest.lastName) {
            toast({
                title: "Champs manquants",
                description: "Merci de renseigner le prénom et le nom.",
                variant: "destructive",
            });
            return;
        }
        updateGuestMutation.mutate({ ...editGuest, id: editGuestId });
    };

    const handleDeleteGuest = (guest: RsvpResponse) => {
        setDeleteGuestTarget(guest);
        setDeleteGuestOpen(true);
    };

    const selectedGuests = responses.filter((g) => selectedIds.includes(g.id));

    const handleBulkEmail = () => {
        const emails = selectedGuests.map((g) => g.email).filter((e): e is string => !!e && e.length > 0);
        if (emails.length === 0) {
            toast({ title: "Aucun email", description: "Les invités sélectionnés n'ont pas d'email.", variant: "destructive" });
            return;
        }
        const href = `mailto:?bcc=${encodeURIComponent(emails.join(","))}`;
        window.location.href = href;
    };

    const handleBulkWhatsApp = () => {
        const phones = selectedGuests.map((g) => g.phone).filter((p): p is string => !!p && p.length > 0);
        if (phones.length === 0) {
            toast({ title: "Aucun numéro", description: "Les invités sélectionnés n'ont pas de téléphone.", variant: "destructive" });
            return;
        }
        const phone = phones[0].replace(/\\s+/g, "");
        window.open(`https://wa.me/${phone}`, "_blank");
        if (phones.length > 1) {
            toast({
                title: "WhatsApp",
                description: `Ouverture du premier contact. ${phones.length - 1} autre(s) numéro(s) restent à contacter.`,
            });
        }
    };

    const handleBulkDelete = async () => {
        if (selectedIds.length === 0) return;
        try {
            for (const id of selectedIds) {
                await apiRequest("DELETE", `/api/rsvp/${id}`);
            }
            setSelectedIds([]);
            queryClient.invalidateQueries({ queryKey: ["/api/rsvp"] });
            toast({ title: "Supprimé", description: "Les invités sélectionnés ont été supprimés." });
        } catch (error: any) {
            toast({ title: "Erreur", description: error?.message || "Impossible de supprimer la sélection.", variant: "destructive" });
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-serif font-bold">Invités</h1>
                    <p className="text-muted-foreground mt-1">Gérez votre liste et suivez les réponses</p>
                </div>
                <div className="flex gap-3">
                    <Button variant="outline" onClick={handleExportCSV}>
                        <Download className="h-4 w-4 mr-2" />
                        Exporter CSV
                    </Button>
                    <Dialog open={addGuestOpen} onOpenChange={setAddGuestOpen}>
                        <DialogTrigger asChild>
                            <Button>
                                <Plus className="h-4 w-4 mr-2" />
                                Ajouter un invité
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl">
                            <DialogHeader>
                                <DialogTitle>Ajouter un invité</DialogTitle>
                                <DialogDescription>Complétez les informations pour créer un invité.</DialogDescription>
                            </DialogHeader>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Prénom *</Label>
                                    <Input value={newGuest.firstName} onChange={(e) => setNewGuest({ ...newGuest, firstName: e.target.value })} />
                                </div>
                                <div className="space-y-2">
                                    <Label>Nom *</Label>
                                    <Input value={newGuest.lastName} onChange={(e) => setNewGuest({ ...newGuest, lastName: e.target.value })} />
                                </div>
                                <div className="space-y-2">
                                    <Label>Email</Label>
                                    <Input type="email" value={newGuest.email} onChange={(e) => setNewGuest({ ...newGuest, email: e.target.value })} />
                                </div>
                                <div className="space-y-2">
                                    <Label>Téléphone</Label>
                                    <Input value={newGuest.phone} onChange={(e) => setNewGuest({ ...newGuest, phone: e.target.value })} />
                                </div>
                                <div className="space-y-2">
                                    <Label>Nombre d'invités</Label>
                                    <Input type="number" min={1} value={newGuest.partySize} onChange={(e) => setNewGuest({ ...newGuest, partySize: Number(e.target.value || 1) })} />
                                </div>
                                <div className="space-y-2">
                                    <Label>Disponibilité</Label>
                                    <select
                                        className="h-10 rounded-md border border-border bg-background px-3 text-sm w-full"
                                        value={newGuest.availability}
                                        onChange={(e) => setNewGuest({ ...newGuest, availability: e.target.value })}
                                    >
                                        <option value="pending">En attente</option>
                                        <option value="confirmed">Confirmé</option>
                                        <option value="declined">Refusé</option>
                                    </select>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label>Notes</Label>
                                <Textarea rows={3} value={newGuest.notes} onChange={(e) => setNewGuest({ ...newGuest, notes: e.target.value })} />
                            </div>
                            <div className="flex justify-end gap-2">
                                <Button variant="outline" onClick={() => setAddGuestOpen(false)}>Annuler</Button>
                                <Button onClick={handleAddGuest} disabled={createGuestMutation.isPending}>
                                    {createGuestMutation.isPending ? "Ajout..." : "Ajouter"}
                                </Button>
                            </div>
                        </DialogContent>
                    </Dialog>
                    <Dialog open={editGuestOpen} onOpenChange={setEditGuestOpen}>
                        <DialogContent className="max-w-2xl">
                            <DialogHeader>
                                <DialogTitle>Modifier l'invité</DialogTitle>
                                <DialogDescription>Mettre à jour les informations de l'invité.</DialogDescription>
                            </DialogHeader>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Prénom *</Label>
                                    <Input value={editGuest.firstName} onChange={(e) => setEditGuest({ ...editGuest, firstName: e.target.value })} />
                                </div>
                                <div className="space-y-2">
                                    <Label>Nom *</Label>
                                    <Input value={editGuest.lastName} onChange={(e) => setEditGuest({ ...editGuest, lastName: e.target.value })} />
                                </div>
                                <div className="space-y-2">
                                    <Label>Email</Label>
                                    <Input type="email" value={editGuest.email} onChange={(e) => setEditGuest({ ...editGuest, email: e.target.value })} />
                                </div>
                                <div className="space-y-2">
                                    <Label>Téléphone</Label>
                                    <Input value={editGuest.phone} onChange={(e) => setEditGuest({ ...editGuest, phone: e.target.value })} />
                                </div>
                                <div className="space-y-2">
                                    <Label>Nombre d'invités</Label>
                                    <Input type="number" min={1} value={editGuest.partySize} onChange={(e) => setEditGuest({ ...editGuest, partySize: Number(e.target.value || 1) })} />
                                </div>
                                <div className="space-y-2">
                                    <Label>Disponibilité</Label>
                                    <select
                                        className="h-10 rounded-md border border-border bg-background px-3 text-sm w-full"
                                        value={editGuest.availability}
                                        onChange={(e) => setEditGuest({ ...editGuest, availability: e.target.value })}
                                    >
                                        <option value="pending">En attente</option>
                                        <option value="confirmed">Confirmé</option>
                                        <option value="declined">Refusé</option>
                                    </select>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label>Notes</Label>
                                <Textarea rows={3} value={editGuest.notes} onChange={(e) => setEditGuest({ ...editGuest, notes: e.target.value })} />
                            </div>
                            <div className="flex justify-end gap-2">
                                <Button variant="outline" onClick={() => setEditGuestOpen(false)}>Annuler</Button>
                                <Button onClick={handleUpdateGuest} disabled={updateGuestMutation.isPending}>
                                    {updateGuestMutation.isPending ? "Sauvegarde..." : "Enregistrer"}
                                </Button>
                            </div>
                        </DialogContent>
                    </Dialog>
                    <AlertDialog open={deleteGuestOpen} onOpenChange={setDeleteGuestOpen}>
                        <AlertDialogContent className="max-w-md">
                            <AlertDialogHeader>
                                <AlertDialogTitle>Supprimer l'invité</AlertDialogTitle>
                                <AlertDialogDescription>
                                    Cette action est irréversible. Voulez-vous supprimer{" "}
                                    <span className="font-semibold text-foreground">
                                        {deleteGuestTarget ? `${deleteGuestTarget.firstName} ${deleteGuestTarget.lastName}` : "cet invité"}
                                    </span>
                                    ?
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel>Annuler</AlertDialogCancel>
                                <AlertDialogAction
                                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                    onClick={() => {
                                        if (!deleteGuestTarget) return;
                                        deleteGuestMutation.mutate(deleteGuestTarget.id);
                                        setDeleteGuestOpen(false);
                                    }}
                                >
                                    Supprimer
                                </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                    { label: "Invités", value: total, icon: Users },
                    { label: "Confirmés", value: confirmed, icon: CheckCircle2 },
                    { label: "En attente", value: pending, icon: Clock },
                    { label: "Refusés", value: declined, icon: XCircle },
                ].map((item) => (
                    <Card key={item.label} className="p-5 flex items-center gap-4">
                        <div className="h-11 w-11 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                            <item.icon className="h-5 w-5" />
                        </div>
                        <div>
                            <div className="text-xs uppercase tracking-widest text-muted-foreground">{item.label}</div>
                            <div className="text-2xl font-semibold">{item.value}</div>
                        </div>
                    </Card>
                ))}
            </div>

            <Card className="p-6">
                <div className="flex flex-col gap-4 mb-6">
                    <div className="flex flex-col md:flex-row md:items-center gap-3">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Rechercher un invité..."
                                className="pl-10"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                        <div className="flex items-center gap-2">
                            <Button variant="outline" size="sm" onClick={() => setFiltersOpen(true)}>
                                <Filter className="h-4 w-4 mr-2" />
                                Filtres
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => setFiltersOpen(true)}>
                                <Tag className="h-4 w-4 mr-2" />
                                Tags
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isFetching}>
                                <RefreshCw className={`h-4 w-4 mr-2 ${isFetching ? "animate-spin" : ""}`} />
                                Rafraîchir
                            </Button>
                        </div>
                    </div>

                    {(hasEmail || hasPhone || groupFilter !== "all") && (
                        <div className="flex flex-wrap gap-2">
                            {hasEmail && (
                                <button
                                    type="button"
                                    className="px-3 py-1 rounded-full text-xs font-semibold border bg-primary/10 text-primary border-primary/20"
                                    onClick={() => setHasEmail(false)}
                                >
                                    Avec email
                                </button>
                            )}
                            {hasPhone && (
                                <button
                                    type="button"
                                    className="px-3 py-1 rounded-full text-xs font-semibold border bg-primary/10 text-primary border-primary/20"
                                    onClick={() => setHasPhone(false)}
                                >
                                    Avec téléphone
                                </button>
                            )}
                            {groupFilter !== "all" && (
                                <button
                                    type="button"
                                    className="px-3 py-1 rounded-full text-xs font-semibold border bg-primary/10 text-primary border-primary/20"
                                    onClick={() => setGroupFilter("all")}
                                >
                                    {groupFilter === "solo" ? "Solo" : "Couple"}
                                </button>
                            )}
                            <button
                                type="button"
                                className="px-3 py-1 rounded-full text-xs font-semibold border bg-white text-muted-foreground border-border hover:border-primary/40"
                                onClick={() => {
                                    setHasEmail(false);
                                    setHasPhone(false);
                                    setGroupFilter("all");
                                }}
                            >
                                Réinitialiser
                            </button>
                        </div>
                    )}

                    <div className="flex flex-wrap gap-2">
                        {[
                            { key: "all", label: "Tous" },
                            { key: "confirmed", label: "Confirmés" },
                            { key: "pending", label: "En attente" },
                            { key: "declined", label: "Refusés" },
                        ].map((item) => (
                            <button
                                key={item.key}
                                onClick={() => setStatusFilter(item.key)}
                                className={`px-3 py-1 rounded-full text-xs font-semibold border ${statusFilter === item.key
                                    ? "bg-primary/10 text-primary border-primary/20"
                                    : "bg-white text-muted-foreground border-border"
                                    }`}
                            >
                                {item.label}
                            </button>
                        ))}
                    </div>

                    <Dialog open={filtersOpen} onOpenChange={setFiltersOpen}>
                        <DialogContent className="max-w-lg">
                            <DialogHeader>
                                <DialogTitle>Filtres</DialogTitle>
                                <DialogDescription>Affinez la liste d'invités (sans modifier les données).</DialogDescription>
                            </DialogHeader>
                            <div className="space-y-5">
                                <div className="space-y-2">
                                    <div className="text-sm font-medium">Groupe</div>
                                    <div className="flex flex-wrap gap-2">
                                        {[
                                            { key: "all", label: "Tous" },
                                            { key: "solo", label: "Solo" },
                                            { key: "couple", label: "Couple" },
                                        ].map((item) => (
                                            <button
                                                key={item.key}
                                                type="button"
                                                className={`px-3 py-1 rounded-full text-xs font-semibold border ${
                                                    groupFilter === item.key
                                                        ? "bg-primary/10 text-primary border-primary/20"
                                                        : "bg-white text-muted-foreground border-border hover:border-primary/40"
                                                }`}
                                                onClick={() => setGroupFilter(item.key as any)}
                                            >
                                                {item.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <div className="text-sm font-medium">Coordonnées</div>
                                    <div className="flex items-center gap-4">
                                        <label className="flex items-center gap-2 text-sm">
                                            <Checkbox checked={hasEmail} onCheckedChange={(v) => setHasEmail(!!v)} />
                                            Avec email
                                        </label>
                                        <label className="flex items-center gap-2 text-sm">
                                            <Checkbox checked={hasPhone} onCheckedChange={(v) => setHasPhone(!!v)} />
                                            Avec téléphone
                                        </label>
                                    </div>
                                </div>
                            </div>
                            <div className="flex justify-end gap-2">
                                <Button
                                    variant="outline"
                                    onClick={() => {
                                        setHasEmail(false);
                                        setHasPhone(false);
                                        setGroupFilter("all");
                                    }}
                                >
                                    Réinitialiser
                                </Button>
                                <Button onClick={() => setFiltersOpen(false)}>Appliquer</Button>
                            </div>
                        </DialogContent>
                    </Dialog>

                    {selectedIds.length > 0 && (
                        <div className="flex items-center justify-between rounded-lg border border-border bg-muted/20 px-4 py-3">
                            <div className="text-sm text-muted-foreground">
                                {selectedIds.length} invité(s) sélectionné(s)
                            </div>
                            <div className="flex items-center gap-2">
                                <Button size="sm" variant="outline" onClick={handleBulkEmail}>Envoyer email</Button>
                                <Button size="sm" variant="outline" onClick={handleBulkWhatsApp}>WhatsApp</Button>
                                <Button size="sm" variant="destructive" onClick={handleBulkDelete}>Supprimer</Button>
                            </div>
                        </div>
                    )}
                </div>

                {isLoading ? (
                    <div className="flex justify-center p-12">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                ) : (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-[40px]">
                                    <input
                                        type="checkbox"
                                        checked={selectedIds.length > 0 && selectedIds.length === filteredResponses.length}
                                        onChange={(e) => {
                                            if (e.target.checked) {
                                                setSelectedIds(filteredResponses.map((g) => g.id));
                                            } else {
                                                setSelectedIds([]);
                                            }
                                        }}
                                    />
                                </TableHead>
                                <TableHead>Invité</TableHead>
                                <TableHead>Email / Tél</TableHead>
                                <TableHead>Nb.</TableHead>
                                <TableHead>Disponibilité</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredResponses.map((guest) => (
                                <TableRow key={guest.id}>
                                    <TableCell>
                                        <input
                                            type="checkbox"
                                            checked={selectedIds.includes(guest.id)}
                                            onChange={(e) => {
                                                if (e.target.checked) {
                                                    setSelectedIds([...selectedIds, guest.id]);
                                                } else {
                                                    setSelectedIds(selectedIds.filter((id) => id !== guest.id));
                                                }
                                            }}
                                        />
                                    </TableCell>
                                    <TableCell className="font-medium">
                                        {guest.firstName} {guest.lastName}
                                    </TableCell>
                                    <TableCell className="text-sm text-muted-foreground">
                                        {guest.email || "-"}<br />
                                        {guest.phone || "-"}
                                    </TableCell>
                                    <TableCell>{guest.partySize}</TableCell>
                                    <TableCell>
                                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${guest.availability === 'confirmed' ? 'bg-green-100 text-green-700' :
                                                guest.availability === 'declined' ? 'bg-red-100 text-red-700' :
                                                    'bg-amber-100 text-amber-700'
                                            }`}>
                                            {guest.availability}
                                        </span>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end gap-2">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => {
                                                    if (!guest.email) {
                                                        toast({ title: "Email manquant", description: "Cet invité n'a pas d'email.", variant: "destructive" });
                                                        return;
                                                    }
                                                    window.location.href = `mailto:${guest.email}`;
                                                }}
                                            >
                                                <Mail className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => {
                                                    if (!guest.phone) {
                                                        toast({ title: "Téléphone manquant", description: "Cet invité n'a pas de numéro.", variant: "destructive" });
                                                        return;
                                                    }
                                                    const phone = guest.phone.replace(/\\s+/g, "");
                                                    window.open(`https://wa.me/${phone}`, "_blank");
                                                }}
                                            >
                                                <MessageCircle className="h-4 w-4" />
                                            </Button>
                                            <Button variant="ghost" size="icon" onClick={() => openEditGuest(guest)}>
                                                <Edit className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="text-destructive"
                                                onClick={() => handleDeleteGuest(guest)}
                                                disabled={deleteGuestMutation.isPending}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                )}
            </Card>
        </div>
    );
}
