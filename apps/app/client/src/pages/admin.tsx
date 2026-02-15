import { useEffect, useState, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { LogOut, Search, Users, Table2, Download, Mail, Edit, Trash2, BarChart3, FileText, Plus, ArrowUp, ArrowDown, X, TrendingUp, ExternalLink, Eye, Send, RefreshCw, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import { DashboardWidgets } from "@/components/dashboard-widgets";
import type { RsvpResponse } from "@shared/schema";
import logoRA from "@assets/logo-ra.png";

// Wedding tables with poetic names - Golden Love theme
const WEDDING_TABLES = [
  { number: 1, name: "Table 1", subtitle: "Bienvenue" },
  { number: 2, name: "Table 2", subtitle: "Nous sommes ravis de vous voir" },
  { number: 3, name: "Table 3", subtitle: "Profitez de la soirée" },
  { number: 4, name: "Table 4", subtitle: "Merci d'être là" },
  { number: 5, name: "Table 5", subtitle: "Un moment inoubliable" },
];

// Helper function to get table info by number
const getTableInfo = (tableNumber: number) => {
  return WEDDING_TABLES.find(t => t.number === tableNumber);
};

const ImportGuestForm = ({ onSuccess }: { onSuccess: () => void }) => {
  const [text, setText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const parseAvailability = (value: string): string => {
    const lower = value.toLowerCase().trim();
    if (lower === 'confirmed' || lower === 'oui' || lower === 'présent') return 'confirmed';
    if (lower === 'declined' || lower === 'non' || lower === 'absent') return 'declined';
    return 'pending';
  };

  const handleSubmit = async () => {
    if (!text.trim()) return;

    setIsSubmitting(true);
    try {
      const rows = text.split(/\n/).map(row => row.trim()).filter(row => row);
      const guests = rows.map(row => {
        const parts = row.split(/\t/);

        const fullName = (parts[0] || "").trim();
        const email = (parts[1] || "").trim();
        const phone = (parts[2] || "").trim();
        const count = parseInt(parts[3]?.trim()) || 1;
        const availability = parseAvailability(parts[4] || "");
        const notes = (parts[5] || "").trim();

        const nameParts = fullName.split(" ");
        let firstName = fullName;
        let lastName = ".";

        if (nameParts.length > 1) {
          lastName = nameParts.pop() || "";
          firstName = nameParts.join(" ");
        }

        return {
          firstName,
          lastName,
          email: email || null,
          phone: phone || null,
          partySize: Math.min(Math.max(count, 1), 5),
          availability,
          notes: notes || null,
        };
      });

      const response = await fetch("/api/rsvp/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(guests),
      });

      const result = await response.json();

      if (result.failed > 0) {
        toast({
          title: "Import partiel",
          description: `${result.success} importés, ${result.failed} échoués.`,
          variant: "destructive",
        });
        console.error("Import errors:", result.errors);
      } else {
        toast({
          title: "Import réussi",
          description: `${result.success} invités ajoutés.`,
        });
      }
      onSuccess();
      setText("");
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Échec de l'import.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-4 py-4">
      <div className="space-y-2">
        <Label>Données Excel (Copier-Coller)</Label>
        <Textarea
          placeholder={`Nom\tEmail\tTéléphone\tNombre\tDisponibilité\tCommentaire\nJean Dupont\tjean@email.com\t+33612345678\t2\t21\tAllergies\nAlice Martin\talice@email.com\t\t1\t19-21\t`}
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={10}
          className="font-mono text-xs"
          data-testid="textarea-import"
        />
        <div className="text-xs text-muted-foreground space-y-1">
          <p className="font-medium">Colonnes (séparées par tabulation) :</p>
          <p>1. Nom Complet* | 2. Email | 3. Téléphone | 4. Nb personnes | 5. Disponibilité | 6. Commentaire</p>
          <p className="text-muted-foreground/70">Disponibilité: "oui", "non" ou vide (en attente)</p>
        </div>
      </div>
      <Button onClick={handleSubmit} disabled={isSubmitting} className="w-full" data-testid="button-import-submit">
        {isSubmitting ? "Importation..." : "Importer"}
      </Button>
    </div>
  );
};

export default function Admin() {
  const { toast } = useToast();
  const { user, isAuthenticated, isLoading } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [filterAvailability, setFilterAvailability] = useState<string>("all");
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteFirstName, setInviteFirstName] = useState("");
  const [inviteLastName, setInviteLastName] = useState("");
  const [inviteMessage, setInviteMessage] = useState("");

  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingResponse, setEditingResponse] = useState<RsvpResponse | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [invitationPreviewOpen, setInvitationPreviewOpen] = useState(false);
  const [previewingResponse, setPreviewingResponse] = useState<RsvpResponse | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Add guest dialog state
  const [addGuestDialogOpen, setAddGuestDialogOpen] = useState(false);
  const [newGuest, setNewGuest] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    partySize: 1,
    availability: "pending",
    notes: "",
  });

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: "Non autorisé",
        description: "Connexion requise. Redirection...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/login";
      }, 500);
    }
  }, [isAuthenticated, isLoading, toast]);

  const { data: responses = [], isLoading: responsesLoading } = useQuery<RsvpResponse[]>({
    queryKey: ["/api/rsvp"],
    enabled: isAuthenticated,
  });

  const updateTableMutation = useMutation({
    mutationFn: async ({ id, tableNumber }: { id: number; tableNumber: number | null }) => {
      return await apiRequest("PATCH", `/api/rsvp/${id}`, { tableNumber });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/rsvp"] });
      toast({
        title: "Succès",
        description: "Table mise à jour",
      });
    },
    onError: (error: Error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Non autorisé",
          description: "Vous êtes déconnecté. Reconnexion...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/login";
        }, 500);
        return;
      }
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour la table",
        variant: "destructive",
      });
    },
  });

  const sendInvitationMutation = useMutation({
    mutationFn: async (data: { email: string; firstName: string; lastName: string; message?: string }) => {
      return await apiRequest("POST", "/api/send-invitation", data);
    },
    onSuccess: () => {
      toast({
        title: "Invitation envoyée",
        description: "L'invitation a été envoyée avec succès",
      });
      setInviteDialogOpen(false);
      setInviteEmail("");
      setInviteFirstName("");
      setInviteLastName("");
      setInviteMessage("");
    },
    onError: (error: Error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Non autorisé",
          description: "Vous êtes déconnecté. Reconnexion...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/login";
        }, 500);
        return;
      }
      toast({
        title: "Erreur",
        description: "Impossible d'envoyer l'invitation",
        variant: "destructive",
      });
    },
  });

  const deleteRsvpMutation = useMutation({
    mutationFn: async (id: number) => {
      return await apiRequest("DELETE", `/api/rsvp/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/rsvp"] });
      toast({
        title: "Suppression réussie",
        description: "La réponse a été supprimée",
      });
      setDeleteDialogOpen(false);
      setDeletingId(null);
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Impossible de supprimer la réponse",
        variant: "destructive",
      });
    },
  });

  const updateRsvpMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<Omit<RsvpResponse, 'id' | 'createdAt'>> }) => {
      return await apiRequest("PUT", `/api/rsvp/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/rsvp"] });
      toast({
        title: "Modification réussie",
        description: "La réponse a été mise à jour",
      });
      setEditDialogOpen(false);
      setEditingResponse(null);
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Impossible de modifier la réponse",
        variant: "destructive",
      });
    },
  });

  const generateInvitationMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/invitation/generate/${id}`, {
        method: "POST",
        credentials: "include",
      });
      if (!response.ok) {
        const error = await response.text();
        throw new Error(error || "Failed to generate invitation");
      }
      return response.blob();
    },
    onSuccess: async (blob, id) => {
      try {
        const url = URL.createObjectURL(blob);
        setPreviewUrl(url);
        const resp = responses.find(r => r.id === id);
        if (resp) {
          setPreviewingResponse(resp);
          setInvitationPreviewOpen(true);
        }
      } catch (error) {
        console.error("Error displaying invitation:", error);
        toast({
          title: "Erreur",
          description: "Impossible d'afficher l'invitation",
          variant: "destructive",
        });
      }
    },
    onError: (error: any) => {
      console.error("Invitation error:", error);
      toast({
        title: "Erreur",
        description: error.message || "Impossible de générer l'invitation",
        variant: "destructive",
      });
    },
  });

  const bulkConfirmMutation = useMutation({
    mutationFn: async (ids: number[]) => {
      return await apiRequest("POST", "/api/rsvp/bulk-confirm", { ids });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/rsvp"] });
      toast({
        title: "Succès",
        description: "Les invités sélectionnés ont été confirmés.",
      });
      setSelectedIds([]);
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Échec de la confirmation groupée.",
        variant: "destructive",
      });
    },
  });

  const bulkSendInvitationMutation = useMutation({
    mutationFn: async (ids: number[]) => {
      const response = await apiRequest("POST", "/api/rsvp/bulk-send-invitation", { ids });
      return await response.json();
    },
    onSuccess: (data: { sent: number; failed: number }) => {
      queryClient.invalidateQueries({ queryKey: ["/api/rsvp"] });
      toast({
        title: "Invitations envoyées",
        description: `${data.sent} envoyées, ${data.failed} échouées`,
      });
      setSelectedIds([]);
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Échec de l'envoi groupé des invitations.",
        variant: "destructive",
      });
    },
  });

  const bulkResendConfirmationMutation = useMutation({
    mutationFn: async (ids: number[]) => {
      const response = await apiRequest("POST", "/api/rsvp/bulk-resend-confirmation", { ids });
      return await response.json();
    },
    onSuccess: (data: { sent: number; failed: number }) => {
      queryClient.invalidateQueries({ queryKey: ["/api/rsvp"] });
      toast({
        title: "Confirmations envoyées",
        description: `${data.sent} envoyées, ${data.failed} échouées`,
      });
      setSelectedIds([]);
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Échec de l'envoi groupé des confirmations.",
        variant: "destructive",
      });
    },
  });

  const whatsappMutation = useMutation({
    mutationFn: async (id: number) => {
      const [whatsappRes, configRes] = await Promise.all([
        apiRequest("POST", `/api/rsvp/${id}/whatsapp-log`),
        fetch("/api/site-config")
      ]);
      const whatsappData = await whatsappRes.json();
      const configData = await configRes.json();
      return { ...whatsappData, siteUrl: configData.siteUrl, guestId: id };
    },
    onSuccess: (data: { phone?: string; siteUrl: string; guestId: number }) => {
      if (!data.phone) {
        toast({
          title: "Numéro manquant",
          description: "Cet invité n'a pas de numéro de téléphone enregistré.",
          variant: "destructive"
        });
        return;
      }

      const message = `Bonjour,\nVous êtes invité à Golden Love 2026.\nVoici votre invitation et pass d'accès : ${data.siteUrl}/invitation/${data.guestId}`;
      const url = `https://wa.me/${data.phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(message)}`;
      window.open(url, '_blank');

      queryClient.invalidateQueries({ queryKey: ["/api/rsvp"] });
      toast({ title: "WhatsApp", description: "WhatsApp ouvert !" });
    },
    onError: () => {
      toast({ title: "Erreur", description: "Impossible de préparer WhatsApp", variant: "destructive" });
    }
  });

  const sendInvitationToGuestMutation = useMutation({
    mutationFn: async (id: number) => {
      return await apiRequest("POST", `/api/rsvp/${id}/send-invitation`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/rsvp"] });
      toast({
        title: "Invitation envoyée",
        description: "L'invitation personnalisée a été envoyée par email",
      });
    },
    onError: async (error: any) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Non autorisé",
          description: "Vous êtes déconnecté. Reconnexion...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/login";
        }, 500);
        return;
      }
      let errorMessage = "Impossible d'envoyer l'invitation";
      try {
        const errorData = await error.json?.();
        if (errorData?.message) errorMessage = errorData.message;
      } catch { }
      toast({
        title: "Erreur",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });

  const resendConfirmationMutation = useMutation({
    mutationFn: async (id: number) => {
      return await apiRequest("POST", `/api/rsvp/${id}/resend-confirmation`);
    },
    onSuccess: () => {
      toast({
        title: "Confirmation envoyée",
        description: "Le mail de confirmation a été renvoyé à l'invité",
      });
    },
    onError: async (error: any) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Non autorisé",
          description: "Vous êtes déconnecté. Reconnexion...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/login";
        }, 500);
        return;
      }
      let errorMessage = "Impossible de renvoyer la confirmation";
      try {
        const errorData = await error.json?.();
        if (errorData?.message) errorMessage = errorData.message;
      } catch { }
      toast({
        title: "Erreur",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });

  // Create new guest mutation
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
      setAddGuestDialogOpen(false);
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

  const [selectedIds, setSelectedIds] = useState<number[]>([]);

  const toggleSelectAll = () => {
    if (selectedIds.length === filteredResponses.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredResponses.map(r => r.id));
    }
  };

  const toggleSelect = (id: number) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter(i => i !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const handleExportCSV = () => {
    const params = new URLSearchParams();
    if (searchQuery) params.set('search', searchQuery);
    if (filterAvailability && filterAvailability !== 'all') params.set('availability', filterAvailability);
    const queryString = params.toString();
    window.open(`/api/rsvp/export/csv${queryString ? '?' + queryString : ''}`, '_blank');
  };

  const handleSendInvitation = () => {
    if (!inviteEmail || !inviteFirstName || !inviteLastName) {
      toast({
        title: "Champs manquants",
        description: "Veuillez remplir tous les champs requis",
        variant: "destructive",
      });
      return;
    }
    sendInvitationMutation.mutate({
      email: inviteEmail,
      firstName: inviteFirstName,
      lastName: inviteLastName,
      message: inviteMessage,
    });
  };

  const handleLogout = async () => {
    try {
      await fetch("/api/logout", { method: "POST" });
      window.location.href = "/login";
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de se déconnecter",
        variant: "destructive",
      });
    }
  };

  // Reset page when filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, filterAvailability]);

  // Filter responses
  const filteredResponses = responses.filter((response) => {
    const matchesSearch =
      searchQuery === "" ||
      `${response.firstName} ${response.lastName}`
        .toLowerCase()
        .includes(searchQuery.toLowerCase()) ||
      (response.email && response.email.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesAvailability =
      (filterAvailability === "confirmed" && response.availability === "confirmed") ||
      (filterAvailability === "declined" && response.availability === "declined");

    return matchesSearch && matchesAvailability;
  });

  // Pagination
  const totalPages = Math.ceil(filteredResponses.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;

  // Clamp current page when data changes (e.g., after deletion)
  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(totalPages);
    }
  }, [totalPages, currentPage]);

  // Stats
  const stats = {
    total: responses.length,
    confirmed: responses.filter(r => r.availability === 'confirmed').length,
    declined: responses.filter(r => r.availability === 'declined').length,
    pending: responses.filter(r => r.availability === 'pending').length,
    assigned: responses.filter(r => r.tableNumber !== null).length,
  };

  if (!isAuthenticated && !isLoading) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto flex h-16 items-center justify-between px-6">
          <div className="flex items-center gap-3">
            <img
              src={logoRA}
              alt="R&A Logo"
              className="h-10 w-auto"
            />
            <div>
              <h1 className="text-xl font-serif font-bold text-foreground">
                Espace Administrateur
              </h1>
              <p className="text-xs text-muted-foreground font-sans">
                Gestion des invités
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            onClick={handleLogout}
            data-testid="button-logout"
          >
            <LogOut className="h-4 w-4 mr-2" />
            Déconnexion
          </Button>
        </div>
      </header>

      <div className="container mx-auto px-6 py-8">
        {/* Dashboard Sections */}
        <div className="space-y-8">
          <DashboardWidgets responses={responses} onFilterChange={setFilterAvailability} />

          {/* Guest Management Section */}
          <Card className="flex flex-col">
            <div className="p-6 border-b bg-card">
              <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center mb-6">
                <div>
                  <h2 className="text-2xl font-serif font-bold">Gestion des invités</h2>
                  <p className="text-sm text-muted-foreground mt-1">Gérez votre liste d'invités, les réponses et les plans de table</p>
                </div>
                <div className="flex gap-2 w-full sm:w-auto flex-wrap">
                  <Dialog open={addGuestDialogOpen} onOpenChange={setAddGuestDialogOpen}>
                    <DialogTrigger asChild>
                      <Button variant="default" className="flex-1 sm:flex-none" data-testid="button-add-guest">
                        <Plus className="h-4 w-4 mr-2" />
                        Ajouter invité
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl">
                      <DialogHeader>
                        <DialogTitle>Ajouter un invité</DialogTitle>
                        <DialogDescription>
                          Remplissez les informations pour ajouter un nouvel invité.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4 py-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="add-firstname">Prénom *</Label>
                            <Input
                              id="add-firstname"
                              value={newGuest.firstName}
                              onChange={(e) => setNewGuest({ ...newGuest, firstName: e.target.value })}
                              placeholder="Prénom de l'invité"
                              data-testid="input-add-firstname"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="add-lastname">Nom *</Label>
                            <Input
                              id="add-lastname"
                              value={newGuest.lastName}
                              onChange={(e) => setNewGuest({ ...newGuest, lastName: e.target.value })}
                              placeholder="Nom de l'invité"
                              data-testid="input-add-lastname"
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="add-email">Email</Label>
                          <Input
                            id="add-email"
                            type="email"
                            value={newGuest.email}
                            onChange={(e) => setNewGuest({ ...newGuest, email: e.target.value })}
                            placeholder="email@exemple.com"
                            data-testid="input-add-email"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="add-phone">Téléphone (pour WhatsApp)</Label>
                          <Input
                            id="add-phone"
                            value={newGuest.phone}
                            onChange={(e) => setNewGuest({ ...newGuest, phone: e.target.value })}
                            placeholder="+33 6 12 34 56 78"
                            data-testid="input-add-phone"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="add-partysize">Nombre de personnes *</Label>
                            <Select
                              value={newGuest.partySize.toString()}
                              onValueChange={(value) => setNewGuest({ ...newGuest, partySize: parseInt(value) })}
                            >
                              <SelectTrigger data-testid="select-add-partysize">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="1">Solo (1 personne)</SelectItem>
                                <SelectItem value="2">Couple (2 personnes)</SelectItem>
                                <SelectItem value="3">Groupe (3 personnes)</SelectItem>
                                <SelectItem value="4">Groupe (4 personnes)</SelectItem>
                                <SelectItem value="5">Groupe (5 personnes)</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="add-availability">Disponibilité *</Label>
                            <Select
                              value={newGuest.availability}
                              onValueChange={(value) => setNewGuest({ ...newGuest, availability: value })}
                            >
                              <SelectTrigger data-testid="select-add-availability">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="confirmed">Confirmé</SelectItem>
                                <SelectItem value="declined">Absent</SelectItem>
                                <SelectItem value="pending">En attente</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="add-notes">Commentaire (optionnel)</Label>
                          <Textarea
                            id="add-notes"
                            placeholder="Régime alimentaire, allergies, besoins spéciaux..."
                            value={newGuest.notes}
                            onChange={(e) => setNewGuest({ ...newGuest, notes: e.target.value })}
                            data-testid="input-add-notes"
                            className="resize-none"
                            rows={3}
                          />
                        </div>
                      </div>
                      <DialogFooter>
                        <Button
                          variant="outline"
                          onClick={() => {
                            setAddGuestDialogOpen(false);
                            setNewGuest({
                              firstName: "",
                              lastName: "",
                              email: "",
                              phone: "",
                              partySize: 1,
                              availability: "confirmed",
                              notes: "",
                            });
                          }}
                          data-testid="button-cancel-add"
                        >
                          Annuler
                        </Button>
                        <Button
                          onClick={() => {
                            if (!newGuest.firstName || !newGuest.lastName) {
                              toast({
                                title: "Erreur",
                                description: "Le prénom et le nom sont requis",
                                variant: "destructive",
                              });
                              return;
                            }
                            createGuestMutation.mutate(newGuest);
                          }}
                          disabled={createGuestMutation.isPending}
                          data-testid="button-confirm-add"
                        >
                          {createGuestMutation.isPending ? "Ajout..." : "Ajouter l'invité"}
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>

                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="secondary" className="flex-1 sm:flex-none">
                        <Plus className="h-4 w-4 mr-2" />
                        Importer liste
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-xl">
                      <DialogHeader>
                        <DialogTitle>Importer une liste d'invités</DialogTitle>
                        <DialogDescription>
                          Copiez-collez vos invités depuis Excel. Format attendu : 2 colonnes (Nom complet, Nombre de personnes).
                        </DialogDescription>
                      </DialogHeader>
                      <ImportGuestForm onSuccess={() => {
                        queryClient.invalidateQueries({ queryKey: ["/api/rsvp"] });
                      }} />
                    </DialogContent>
                  </Dialog>

                  <Button
                    variant="outline"
                    onClick={handleExportCSV}
                    data-testid="button-export-csv"
                    className="flex-1 sm:flex-none"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Exporter CSV
                  </Button>

                  {selectedIds.length > 0 && (
                    <>
                      <Button
                        variant="default"
                        className="bg-green-600 hover:bg-green-700 text-white"
                        onClick={() => bulkConfirmMutation.mutate(selectedIds)}
                        disabled={bulkConfirmMutation.isPending}
                        data-testid="button-bulk-confirm"
                      >
                        <Users className="h-4 w-4 mr-2" />
                        Confirmer ({selectedIds.length})
                      </Button>
                      <Button
                        variant="default"
                        className="bg-blue-600 hover:bg-blue-700 text-white"
                        onClick={() => bulkSendInvitationMutation.mutate(selectedIds)}
                        disabled={bulkSendInvitationMutation.isPending}
                        data-testid="button-bulk-send-invitation"
                      >
                        <Send className="h-4 w-4 mr-2" />
                        {bulkSendInvitationMutation.isPending ? "Envoi..." : `Invitations (${selectedIds.length})`}
                      </Button>
                      <Button
                        variant="default"
                        className="bg-orange-600 hover:bg-orange-700 text-white"
                        onClick={() => bulkResendConfirmationMutation.mutate(selectedIds)}
                        disabled={bulkResendConfirmationMutation.isPending}
                        data-testid="button-bulk-resend-confirmation"
                      >
                        <RefreshCw className="h-4 w-4 mr-2" />
                        {bulkResendConfirmationMutation.isPending ? "Envoi..." : `Confirmations (${selectedIds.length})`}
                      </Button>
                    </>
                  )}

                  <Dialog open={inviteDialogOpen} onOpenChange={setInviteDialogOpen}>
                    <DialogTrigger asChild>
                      <Button data-testid="button-send-invitation" className="flex-1 sm:flex-none">
                        <Mail className="h-4 w-4 mr-2" />
                        Envoyer invitation
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Envoyer une invitation personnalisée</DialogTitle>
                        <DialogDescription>
                          Envoyez une invitation par email à un invité avec un message personnalisé.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4 py-4">
                        <div className="space-y-2">
                          <Label htmlFor="invite-email">Email *</Label>
                          <Input
                            id="invite-email"
                            type="email"
                            placeholder="exemple@email.com"
                            value={inviteEmail}
                            onChange={(e) => setInviteEmail(e.target.value)}
                            data-testid="input-invite-email"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="invite-firstname">Prénom *</Label>
                            <Input
                              id="invite-firstname"
                              placeholder="Jean"
                              value={inviteFirstName}
                              onChange={(e) => setInviteFirstName(e.target.value)}
                              data-testid="input-invite-firstname"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="invite-lastname">Nom *</Label>
                            <Input
                              id="invite-lastname"
                              placeholder="Dupont"
                              value={inviteLastName}
                              onChange={(e) => setInviteLastName(e.target.value)}
                              data-testid="input-invite-lastname"
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="invite-message">Message personnalisé (optionnel)</Label>
                          <Textarea
                            id="invite-message"
                            placeholder="Nous serions honorés de votre présence à notre mariage..."
                            value={inviteMessage}
                            onChange={(e) => setInviteMessage(e.target.value)}
                            rows={4}
                            data-testid="textarea-invite-message"
                          />
                        </div>
                      </div>
                      <DialogFooter>
                        <Button
                          variant="outline"
                          onClick={() => setInviteDialogOpen(false)}
                          data-testid="button-cancel-invitation"
                        >
                          Annuler
                        </Button>
                        <Button
                          onClick={handleSendInvitation}
                          disabled={sendInvitationMutation.isPending}
                          data-testid="button-confirm-send-invitation"
                        >
                          {sendInvitationMutation.isPending ? "Envoi..." : "Envoyer"}
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>

              <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Rechercher par nom, email..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                    data-testid="input-search-guest"
                  />
                </div>
                <Select value={filterAvailability} onValueChange={setFilterAvailability}>
                  <SelectTrigger className="w-full md:w-[240px]" data-testid="select-filter-availability">
                    <SelectValue placeholder="Filtrer par statut" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tout le monde</SelectItem>
                    <SelectItem value="pending">En attente (Non répondu)</SelectItem>
                    <SelectItem value="confirmed">Présents</SelectItem>
                    <SelectItem value="declined">Absents</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[50px]">
                      <input
                        type="checkbox"
                        checked={filteredResponses.length > 0 && selectedIds.length === filteredResponses.length}
                        onChange={toggleSelectAll}
                        className="translate-y-[2px]"
                      />
                    </TableHead>
                    <TableHead className="font-sans">Statut</TableHead>
                    <TableHead
                      className="font-sans cursor-pointer hover:bg-muted/50 transition-colors"
                      onClick={() => {
                        if (sortConfig?.key === 'firstName') {
                          setSortConfig({ key: 'firstName', direction: sortConfig.direction === 'asc' ? 'desc' : 'asc' });
                        } else {
                          setSortConfig({ key: 'firstName', direction: 'asc' });
                        }
                      }}
                    >
                      <div className="flex items-center gap-1">
                        Prénom
                        {sortConfig?.key === 'firstName' && (
                          sortConfig.direction === 'asc' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />
                        )}
                      </div>
                    </TableHead>
                    <TableHead
                      className="font-sans cursor-pointer hover:bg-muted/50 transition-colors"
                      onClick={() => {
                        if (sortConfig?.key === 'lastName') {
                          setSortConfig({ key: 'lastName', direction: sortConfig.direction === 'asc' ? 'desc' : 'asc' });
                        } else {
                          setSortConfig({ key: 'lastName', direction: 'asc' });
                        }
                      }}
                    >
                      <div className="flex items-center gap-1">
                        Nom
                        {sortConfig?.key === 'lastName' && (
                          sortConfig.direction === 'asc' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />
                        )}
                      </div>
                    </TableHead>
                    <TableHead
                      className="font-sans cursor-pointer hover:bg-muted/50 transition-colors"
                      onClick={() => {
                        if (sortConfig?.key === 'email') {
                          setSortConfig({ key: 'email', direction: sortConfig.direction === 'asc' ? 'desc' : 'asc' });
                        } else {
                          setSortConfig({ key: 'email', direction: 'asc' });
                        }
                      }}
                    >
                      <div className="flex items-center gap-1">
                        Email
                        {sortConfig?.key === 'email' && (
                          sortConfig.direction === 'asc' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />
                        )}
                      </div>
                    </TableHead>
                    <TableHead className="font-sans">Personnes</TableHead>
                    <TableHead className="font-sans">Disponibilité</TableHead>
                    <TableHead className="font-sans">Table attribuée</TableHead>
                    <TableHead className="font-sans">Commentaire</TableHead>
                    <TableHead
                      className="font-sans cursor-pointer hover:bg-muted/50 transition-colors"
                      onClick={() => {
                        if (sortConfig?.key === 'createdAt') {
                          setSortConfig({ key: 'createdAt', direction: sortConfig.direction === 'asc' ? 'desc' : 'asc' });
                        } else {
                          setSortConfig({ key: 'createdAt', direction: 'desc' });
                        }
                      }}
                    >
                      <div className="flex items-center gap-1">
                        Date de réponse
                        {sortConfig?.key === 'createdAt' && (
                          sortConfig.direction === 'asc' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />
                        )}
                      </div>
                    </TableHead>
                    <TableHead className="font-sans">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {responsesLoading ? (
                    <TableRow>
                      <TableCell colSpan={11} className="text-center py-8 text-muted-foreground">
                        Chargement...
                      </TableCell>
                    </TableRow>
                  ) : filteredResponses.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={11} className="text-center py-8 text-muted-foreground">
                        Aucun invité trouvé
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredResponses
                      .sort((a, b) => {
                        if (!sortConfig) return 0;

                        const key = sortConfig.key as keyof RsvpResponse;
                        const aValue = a[key];
                        const bValue = b[key];

                        if (aValue === bValue) return 0;

                        // Handle null values
                        if (aValue === null || aValue === undefined) return 1;
                        if (bValue === null || bValue === undefined) return -1;

                        const comparison = aValue > bValue ? 1 : -1;
                        return sortConfig.direction === 'asc' ? comparison : -comparison;
                      })
                      .slice(startIndex, endIndex)
                      .map((response) => (
                        <TableRow key={response.id} data-testid={`row-guest-${response.id}`} className={selectedIds.includes(response.id) ? "bg-muted/50" : ""}>
                          <TableCell>
                            <input
                              type="checkbox"
                              checked={selectedIds.includes(response.id)}
                              onChange={() => toggleSelect(response.id)}
                            />
                          </TableCell>
                          <TableCell>
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${response.status === 'confirmed'
                              ? 'bg-green-100 text-green-800 border-green-200'
                              : 'bg-gray-100 text-gray-800 border-gray-200'
                              }`}>
                              {response.status === 'confirmed' ? 'Confirmé' : 'En attente'}
                            </span>
                          </TableCell>
                          <TableCell className="font-sans font-medium">{response.firstName}</TableCell>
                          <TableCell className="font-sans font-medium">{response.lastName}</TableCell>
                          <TableCell className="font-sans text-sm text-muted-foreground" data-testid={`text-email-${response.id}`}>
                            {response.email}
                          </TableCell>
                          <TableCell className="font-sans">
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-muted">
                              {response.partySize === 1 ? 'Solo (1)' : 'Couple (2)'}
                            </span>
                          </TableCell>
                          <TableCell>
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-sans border ${response.availability === 'confirmed'
                              ? 'bg-green-50 text-green-700 border-green-200'
                              : response.availability === 'declined'
                                ? 'bg-slate-50 text-slate-500 border-slate-200'
                                : 'bg-yellow-50 text-yellow-700 border-yellow-200'
                              }`}>
                              {response.availability === 'confirmed' && 'Présent'}
                              {response.availability === 'declined' && 'Absent'}
                              {response.availability === 'pending' && 'En attente'}
                            </span>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {response.tableNumber ? (
                                <>
                                  <div className="flex flex-col gap-0.5 px-2 py-1 rounded-md bg-orange-50 text-orange-700 border border-orange-200">
                                    <div className="flex items-center gap-1.5">
                                      <Table2 className="h-3.5 w-3.5" />
                                      <span className="font-sans text-xs font-semibold" data-testid={`text-table-${response.id}`}>
                                        Table {response.tableNumber}
                                      </span>
                                    </div>
                                    {getTableInfo(response.tableNumber) && (
                                      <span className="text-[10px] text-orange-600 italic pl-5">
                                        {getTableInfo(response.tableNumber)?.name}
                                      </span>
                                    )}
                                  </div>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-6 w-6 p-0 hover:bg-orange-100 hover:text-orange-900 rounded-full"
                                    onClick={() => updateTableMutation.mutate({ id: response.id, tableNumber: null })}
                                    data-testid={`button-remove-table-${response.id}`}
                                  >
                                    <X className="h-3 w-3" />
                                  </Button>
                                </>
                              ) : (
                                <Dialog>
                                  <DialogTrigger asChild>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      className="h-7 text-xs"
                                      data-testid={`button-assign-table-${response.id}`}
                                    >
                                      <Plus className="h-3 w-3 mr-1" />
                                      Attribuer
                                    </Button>
                                  </DialogTrigger>
                                  <DialogContent className="max-w-md">
                                    <DialogHeader>
                                      <DialogTitle>Attribuer une table</DialogTitle>
                                      <DialogDescription>
                                        Choisissez une table pour {response.firstName} {response.lastName}
                                      </DialogDescription>
                                    </DialogHeader>
                                    <div className="space-y-4">
                                      <div>
                                        <Label>Sélectionner une table</Label>
                                        <Select
                                          onValueChange={(value) => {
                                            const tableNumber = parseInt(value);
                                            if (tableNumber > 0) {
                                              updateTableMutation.mutate({ id: response.id, tableNumber });
                                            }
                                          }}
                                        >
                                          <SelectTrigger
                                            className="w-full mt-2"
                                            data-testid={`select-table-${response.id}`}
                                          >
                                            <SelectValue placeholder="Choisir une table..." />
                                          </SelectTrigger>
                                          <SelectContent className="max-h-[300px]">
                                            {WEDDING_TABLES.map((table) => (
                                              <SelectItem
                                                key={table.number}
                                                value={table.number.toString()}
                                                data-testid={`option-table-${table.number}`}
                                              >
                                                <div className="flex flex-col py-1">
                                                  <span className="font-semibold">
                                                    Table {table.number} - {table.name}
                                                  </span>
                                                  <span className="text-xs text-muted-foreground italic">
                                                    {table.subtitle}
                                                  </span>
                                                </div>
                                              </SelectItem>
                                            ))}
                                          </SelectContent>
                                        </Select>
                                      </div>
                                    </div>
                                  </DialogContent>
                                </Dialog>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="max-w-[200px]">
                            {response.notes ? (
                              <span className="text-sm text-muted-foreground truncate block" title={response.notes}>
                                {response.notes.length > 50 ? `${response.notes.substring(0, 50)}...` : response.notes}
                              </span>
                            ) : (
                              <span className="text-xs text-muted-foreground/50">-</span>
                            )}
                          </TableCell>
                          <TableCell className="text-muted-foreground font-sans text-sm">
                            {new Date(response.createdAt!).toLocaleDateString('fr-FR', {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric',
                            })}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              {response.email && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => sendInvitationToGuestMutation.mutate(response.id)}
                                  disabled={sendInvitationToGuestMutation.isPending}
                                  className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                  title="Envoyer invitation par email"
                                  data-testid={`button-send-invitation-email-${response.id}`}
                                >
                                  <Send className="h-4 w-4" />
                                </Button>
                              )}
                              {response.email && response.availability && response.availability !== 'pending' && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => resendConfirmationMutation.mutate(response.id)}
                                  disabled={resendConfirmationMutation.isPending}
                                  className="text-orange-600 hover:text-orange-700 hover:bg-orange-50"
                                  title="Renvoyer confirmation RSVP"
                                  data-testid={`button-resend-confirmation-${response.id}`}
                                >
                                  <RefreshCw className="h-4 w-4" />
                                </Button>
                              )}
                              {response.phone && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => whatsappMutation.mutate(response.id)}
                                  className="text-green-600 hover:text-green-700 hover:bg-green-50"
                                  title="Envoyer WhatsApp"
                                >
                                  <ExternalLink className="h-4 w-4" />
                                </Button>
                              )}
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => window.open(`/guest/${response.id}`, '_blank')}
                                title="Voir les invitations"
                                data-testid={`button-view-invitation-${response.id}`}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setEditingResponse(response);
                                  setEditDialogOpen(true);
                                }}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-destructive hover:text-destructive"
                                onClick={() => {
                                  setDeletingId(response.id);
                                  setDeleteDialogOpen(true);
                                }}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                  )}
                </TableBody>
              </Table>
            </div>

            {/* Pagination Controls */}
            {filteredResponses.length > 0 && (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-6 py-4 border-t">
                <div className="flex items-center gap-4">
                  <span className="text-sm text-muted-foreground">
                    Affichage {startIndex + 1}-{Math.min(endIndex, filteredResponses.length)} sur {filteredResponses.length} invités
                  </span>
                  <Select value={itemsPerPage.toString()} onValueChange={(value) => { setItemsPerPage(parseInt(value)); setCurrentPage(1); }}>
                    <SelectTrigger className="w-[100px]" data-testid="select-items-per-page">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="10">10</SelectItem>
                      <SelectItem value="20">20</SelectItem>
                      <SelectItem value="50">50</SelectItem>
                      <SelectItem value="100">100</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    data-testid="button-prev-page"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Précédent
                  </Button>
                  <span className="text-sm text-muted-foreground px-2">
                    Page {currentPage} / {totalPages || 1}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage >= totalPages}
                    data-testid="button-next-page"
                  >
                    Suivant
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </Card>

          {/* Delete Dialog */}
          <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Confirmer la suppression</DialogTitle>
                <DialogDescription>
                  Êtes-vous sûr de vouloir supprimer cette réponse ? Cette action est irréversible.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => {
                    setDeleteDialogOpen(false);
                    setDeletingId(null);
                  }}
                  data-testid="button-cancel-delete"
                >
                  Annuler
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => {
                    if (deletingId) {
                      deleteRsvpMutation.mutate(deletingId);
                    }
                  }}
                  disabled={deleteRsvpMutation.isPending}
                  data-testid="button-confirm-delete"
                >
                  {deleteRsvpMutation.isPending ? "Suppression..." : "Supprimer"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Invitation Preview Dialog */}
          <Dialog open={invitationPreviewOpen} onOpenChange={setInvitationPreviewOpen}>
            <DialogContent className="max-w-4xl max-h-[90vh]">
              <DialogHeader>
                <DialogTitle>
                  Aperçu invitation - {previewingResponse?.firstName} {previewingResponse?.lastName}
                </DialogTitle>
              </DialogHeader>
              <div className="flex flex-col gap-4">
                {previewUrl && (
                  <object
                    data={previewUrl}
                    type="application/pdf"
                    className="w-full h-[600px] border rounded-lg"
                  >
                    <embed
                      src={previewUrl}
                      type="application/pdf"
                      className="w-full h-[600px]"
                    />
                  </object>
                )}
                <div className="flex gap-2 justify-end">
                  <Button
                    variant="outline"
                    onClick={() => setInvitationPreviewOpen(false)}
                    data-testid="button-close-preview"
                  >
                    Fermer
                  </Button>
                  <Button
                    onClick={() => {
                      if (previewUrl) {
                        const link = document.createElement("a");
                        link.href = previewUrl;
                        link.download = `invitation-${previewingResponse?.firstName}-${previewingResponse?.lastName}.pdf`;
                        link.click();
                      }
                    }}
                    data-testid="button-download-invitation"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Télécharger
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          {/* Edit Dialog */}
          <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Modifier la réponse</DialogTitle>
                <DialogDescription>
                  Modifiez les informations de l'invité.
                </DialogDescription>
              </DialogHeader>
              {editingResponse && (
                <div className="space-y-4 py-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="edit-firstname">Prénom *</Label>
                      <Input
                        id="edit-firstname"
                        value={editingResponse.firstName}
                        onChange={(e) => setEditingResponse({ ...editingResponse, firstName: e.target.value })}
                        data-testid="input-edit-firstname"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="edit-lastname">Nom *</Label>
                      <Input
                        id="edit-lastname"
                        value={editingResponse.lastName}
                        onChange={(e) => setEditingResponse({ ...editingResponse, lastName: e.target.value })}
                        data-testid="input-edit-lastname"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-email">Email *</Label>
                    <Input
                      id="edit-email"
                      type="email"
                      value={editingResponse.email ?? ''}
                      onChange={(e) => setEditingResponse({ ...editingResponse, email: e.target.value })}
                      data-testid="input-edit-email"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-partysize">Nombre de personnes *</Label>
                    <Select
                      value={editingResponse.partySize?.toString()}
                      onValueChange={(value) => setEditingResponse({ ...editingResponse, partySize: parseInt(value) })}
                    >
                      <SelectTrigger data-testid="select-edit-partysize">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">Solo (1 personne)</SelectItem>
                        <SelectItem value="2">Couple (2 personnes)</SelectItem>
                        <SelectItem value="3">Groupe (3 personnes)</SelectItem>
                        <SelectItem value="4">Groupe (4 personnes)</SelectItem>
                        <SelectItem value="5">Groupe (5 personnes)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-availability">Disponibilité *</Label>
                    <Select
                      value={editingResponse.availability}
                      onValueChange={(value) => setEditingResponse({ ...editingResponse, availability: value })}
                    >
                      <SelectTrigger data-testid="select-edit-availability">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="confirmed">Confirmé</SelectItem>
                        <SelectItem value="declined">Absent</SelectItem>
                        <SelectItem value="both">Les deux dates</SelectItem>
                        <SelectItem value="unavailable">Je ne serai pas disponible</SelectItem>
                        <SelectItem value="pending">En attente</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-phone">Téléphone (pour WhatsApp)</Label>
                    <Input
                      id="edit-phone"
                      placeholder="+33 6 12 34 56 78"
                      value={editingResponse.phone ?? ''}
                      onChange={(e) => setEditingResponse({ ...editingResponse, phone: e.target.value })}
                      data-testid="input-edit-phone"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-table">Numéro de table (optionnel)</Label>
                    <Input
                      id="edit-table"
                      type="number"
                      min="1"
                      placeholder="Attribuer un numéro de table"
                      value={editingResponse.tableNumber ?? ''}
                      onChange={(e) => {
                        const value = e.target.value === '' ? null : parseInt(e.target.value);
                        setEditingResponse({ ...editingResponse, tableNumber: value });
                      }}
                      data-testid="input-edit-table"
                    />
                  </div>
                  <div className="space-y-2 col-span-2">
                    <Label htmlFor="edit-notes">Commentaire (optionnel)</Label>
                    <Textarea
                      id="edit-notes"
                      placeholder="Régime alimentaire, allergies, besoins spéciaux..."
                      value={editingResponse.notes ?? ''}
                      onChange={(e) => setEditingResponse({ ...editingResponse, notes: e.target.value })}
                      data-testid="input-edit-notes"
                      className="resize-none"
                      rows={3}
                    />
                  </div>
                </div>
              )}
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => {
                    setEditDialogOpen(false);
                    setEditingResponse(null);
                  }}
                  data-testid="button-cancel-edit"
                >
                  Annuler
                </Button>
                <Button
                  onClick={() => {
                    if (editingResponse) {
                      // Create clean payload with only necessary fields
                      const payload = {
                        firstName: editingResponse.firstName,
                        lastName: editingResponse.lastName,
                        email: editingResponse.email ?? null,
                        phone: editingResponse.phone ?? null,
                        partySize: editingResponse.partySize,
                        availability: editingResponse.availability,
                        status: editingResponse.status ?? 'pending',
                        tableNumber: editingResponse.tableNumber ?? null,
                        notes: editingResponse.notes ?? null,
                      };
                      updateRsvpMutation.mutate({
                        id: editingResponse.id,
                        data: payload
                      });
                    }
                  }}
                  disabled={updateRsvpMutation.isPending}
                  data-testid="button-confirm-edit"
                >
                  {updateRsvpMutation.isPending ? "Enregistrement..." : "Enregistrer"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </div>
  );
}
