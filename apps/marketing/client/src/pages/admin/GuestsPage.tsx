import { useState, useRef } from "react";
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
    Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { RsvpResponse } from "@shared/schema";
import { useParams } from "wouter";

export default function GuestsPage() {
    const { weddingId } = useParams<{ weddingId: string }>();
    const { toast } = useToast();
    const [searchQuery, setSearchQuery] = useState("");

    const { data: responses = [], isLoading } = useQuery<RsvpResponse[]>({
        queryKey: ["/api/rsvp"],
        enabled: !!weddingId,
    });

    const filteredResponses = responses.filter((response) =>
        `${response.firstName} ${response.lastName}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (response.email && response.email.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex justify-between items-end">
                <div>
                    <h1 className="text-3xl font-serif font-bold">Gestion des invités</h1>
                    <p className="text-muted-foreground mt-1">Gérez votre liste d'invités et les réponses RSVP</p>
                </div>
                <div className="flex gap-3">
                    <Button variant="outline">
                        <Download className="h-4 w-4 mr-2" />
                        Exporter CSV
                    </Button>
                    <Button>
                        <Plus className="h-4 w-4 mr-2" />
                        Ajouter un invité
                    </Button>
                </div>
            </div>

            <Card className="p-6">
                <div className="flex items-center gap-4 mb-6">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Rechercher un invité..."
                            className="pl-10"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>

                {isLoading ? (
                    <div className="flex justify-center p-12">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                ) : (
                    <Table>
                        <TableHeader>
                            <TableRow>
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
                                    <TableCell className="font-medium">
                                        {guest.firstName} {guest.lastName}
                                    </TableCell>
                                    <TableCell className="text-sm text-muted-foreground">
                                        {guest.email || "-"}<br />
                                        {guest.phone || "-"}
                                    </TableCell>
                                    <TableCell>{guest.partySize}</TableCell>
                                    <TableCell>
                                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${guest.availability === 'both' ? 'bg-green-100 text-green-700' :
                                                guest.availability === 'unavailable' ? 'bg-red-100 text-red-700' :
                                                    'bg-orange-100 text-orange-700'
                                            }`}>
                                            {guest.availability}
                                        </span>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end gap-2">
                                            <Button variant="ghost" size="icon"><Mail className="h-4 w-4" /></Button>
                                            <Button variant="ghost" size="icon"><MessageCircle className="h-4 w-4" /></Button>
                                            <Button variant="ghost" size="icon"><Edit className="h-4 w-4" /></Button>
                                            <Button variant="ghost" size="icon" className="text-destructive"><Trash2 className="h-4 w-4" /></Button>
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
