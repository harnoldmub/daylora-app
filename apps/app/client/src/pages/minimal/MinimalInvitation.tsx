import { useWedding, useCreateRsvp } from "@/hooks/use-api";
import { useParams } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertRsvpResponseSchema } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function MinimalInvitation() {
    const { slug } = useParams();
    const { data: wedding, isLoading } = useWedding(slug);
    const rsvpMutation = useCreateRsvp();

    const form = useForm({
        resolver: zodResolver(insertRsvpResponseSchema),
        defaultValues: {
            firstName: "",
            lastName: "",
            email: "",
            phone: "",
            partySize: 1,
            availability: "pending" as const,
            notes: "",
        },
    });

    if (isLoading) return <div>Chargement...</div>;
    if (!wedding) return <div>Mariage non trouvé</div>;

    return (
        <div className="min-h-screen bg-background p-8 flex items-center justify-center">
            <Card className="w-full max-w-md shadow-xl border-t-4" style={{ borderTopColor: wedding.config.theme.primaryColor }}>
                <CardHeader>
                    <CardTitle className="text-3xl font-serif text-center">
                        {wedding.title}
                    </CardTitle>
                    <p className="text-center text-muted-foreground mt-2">
                        Nous avons le plaisir de vous inviter à célébrer notre union.
                    </p>
                </CardHeader>
                <CardContent>
                    <form onSubmit={form.handleSubmit((data) => rsvpMutation.mutate(data))} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <Input {...form.register("firstName")} placeholder="Prénom" />
                            <Input {...form.register("lastName")} placeholder="Nom" />
                        </div>
                        <Input {...form.register("email")} placeholder="Email" type="email" />
                        <Button
                            type="submit"
                            className="w-full"
                            style={{ backgroundColor: wedding.config.theme.primaryColor }}
                            disabled={rsvpMutation.isPending}
                        >
                            {rsvpMutation.isPending ? "Envoi..." : "Confirmer ma présence"}
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
