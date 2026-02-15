import { useQuery } from "@tanstack/react-query";
import { useParams } from "wouter";
import { type EmailLog } from "@shared/schema";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, MailCheck, MailWarning } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

export default function EmailLogsPage() {
    const { weddingId } = useParams();

    const { data: logs, isLoading } = useQuery<EmailLog[]>({
        queryKey: [`/api/admin/email-logs`],
    });

    if (isLoading) {
        return (
            <div className="flex items-center justify-center p-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Historique des Emails</h1>
                <p className="text-muted-foreground text-lg">
                    Suivez tous les messages envoyés à vos invités et donateurs.
                </p>
            </div>

            <Card className="border-gold/20 shadow-lg">
                <CardHeader className="bg-muted/30">
                    <CardTitle className="flex items-center gap-2">
                        Journal d'envoi
                    </CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Date</TableHead>
                                <TableHead>Destinataire</TableHead>
                                <TableHead>Sujet</TableHead>
                                <TableHead>Type</TableHead>
                                <TableHead>Statut</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {logs?.map((log) => (
                                <TableRow key={log.id} className="hover:bg-muted/50 transition-colors">
                                    <TableCell className="font-medium text-muted-foreground">
                                        {log.createdAt ? format(new Date(log.createdAt), "PPp", { locale: fr }) : "-"}
                                    </TableCell>
                                    <TableCell className="font-semibold">{log.to}</TableCell>
                                    <TableCell className="max-w-[300px] truncate" title={log.subject || ""}>
                                        {log.subject}
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="secondary" className="bg-blue-50 text-blue-700 border-blue-100 font-medium capitalize">
                                            {log.type.replace(/_/g, " ")}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        {log.status === "sent" ? (
                                            <Badge className="bg-emerald-50 text-emerald-700 hover:bg-emerald-50 border-emerald-100 flex w-fit items-center gap-1.5 py-1 px-3">
                                                <MailCheck className="h-3.5 w-3.5" />
                                                Envoyé
                                            </Badge>
                                        ) : (
                                            <Badge variant="destructive" className="flex w-fit items-center gap-1.5 py-1 px-3">
                                                <MailWarning className="h-3.5 w-3.5" />
                                                Échec
                                            </Badge>
                                        )}
                                    </TableCell>
                                </TableRow>
                            ))}
                            {logs?.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center py-20 text-muted-foreground italic">
                                        Aucun email envoyé pour le moment.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
