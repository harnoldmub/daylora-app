import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import {
    Gift,
    Plus,
    Trash2,
    Edit,
    Loader2,
    Euro,
    ExternalLink
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
import type { Gift as GiftType } from "@shared/schema";
import { useParams } from "wouter";

export default function GiftsPage() {
    const { weddingId } = useParams<{ weddingId: string }>();
    const { toast } = useToast();

    const { data: gifts = [], isLoading } = useQuery<GiftType[]>({
        queryKey: [`/api/gifts`],
        enabled: !!weddingId,
    });

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex justify-between items-end">
                <div>
                    <h1 className="text-3xl font-serif font-bold">Liste de cadeaux</h1>
                    <p className="text-muted-foreground mt-1">Gérez votre liste de mariage et les contributions</p>
                </div>
                <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Ajouter un cadeau
                </Button>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
                <Card className="p-6 bg-primary/5 border-primary/20">
                    <div className="flex items-center gap-3 mb-4 text-primary">
                        <Euro className="h-5 w-5" />
                        <h3 className="font-bold">Total Cagnotte</h3>
                    </div>
                    <p className="text-3xl font-bold font-serif">0.00 €</p>
                    <p className="text-sm text-muted-foreground mt-1 text-primary/60">Contributeurs : 0</p>
                </Card>
            </div>

            <Card className="p-6">
                {isLoading ? (
                    <div className="flex justify-center p-12">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                ) : (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Cadeau</TableHead>
                                <TableHead>Prix / Cible</TableHead>
                                <TableHead>Collecté</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {gifts.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center py-12 text-muted-foreground">
                                        Aucun cadeau pour le moment. Commencez par en ajouter un !
                                    </TableCell>
                                </TableRow>
                            ) : (
                                gifts.map((gift) => (
                                    <TableRow key={gift.id}>
                                        <TableCell className="font-medium">
                                            <div className="flex items-center gap-3">
                                                <Gift className="h-4 w-4 text-primary" />
                                                {gift.name}
                                            </div>
                                        </TableCell>
                                        <TableCell>{gift.price ? `${gift.price} €` : "Cagnotte libre"}</TableCell>
                                        <TableCell>0.00 €</TableCell>
                                        <TableCell>
                                            <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                                                Actif
                                            </span>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-2">
                                                <Button variant="ghost" size="icon"><Edit className="h-4 w-4" /></Button>
                                                <Button variant="ghost" size="icon" className="text-destructive"><Trash2 className="h-4 w-4" /></Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                )}
            </Card>
        </div>
    );
}
