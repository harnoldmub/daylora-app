import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation, Link } from "wouter";
import { Heart, CheckCircle, ArrowLeft, Gift } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import logoRA from "@assets/logo-ra.png";

export default function ContributionMerci() {
  const [location] = useLocation();
  const [sessionId, setSessionId] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const session = params.get("session_id");
    if (session) {
      setSessionId(session);
    }
  }, []);

  const { data: verifyData, isLoading: isVerifying } = useQuery({
    queryKey: ["/api/contribution/verify", sessionId],
    queryFn: async () => {
      const response = await fetch(`/api/contribution/verify?session_id=${sessionId}`);
      return response.json();
    },
    enabled: !!sessionId,
  });

  const { data: totalData } = useQuery<{ total: number; currency: string }>({
    queryKey: ["/api/contributions/total"],
  });

  const formatAmount = (cents: number) => {
    return new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: "EUR",
    }).format(cents / 100);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6 py-12">
      <div className="max-w-lg w-full text-center space-y-8">
        <Link href="/">
          <img
            src={logoRA}
            alt="R&A Logo"
            className="h-20 w-auto mx-auto cursor-pointer hover:opacity-80 transition-opacity"
          />
        </Link>

        {isVerifying ? (
          <Card className="p-8 space-y-6">
            <div className="h-16 w-16 mx-auto animate-spin rounded-full border-4 border-primary border-r-transparent" />
            <p className="text-muted-foreground font-sans">
              Vérification de votre paiement...
            </p>
          </Card>
        ) : verifyData?.success ? (
          <Card className="p-8 md:p-12 space-y-8">
            <div className="relative">
              <CheckCircle className="h-20 w-20 mx-auto text-green-500" />
              <Heart className="h-8 w-8 absolute top-0 right-1/3 text-primary animate-pulse" />
            </div>

            <div className="space-y-4">
              <h1 className="text-3xl md:text-4xl font-serif font-light text-foreground tracking-wide">
                MERCI {verifyData.donorName?.toUpperCase()}
              </h1>
              <p className="text-muted-foreground font-sans">
                Votre généreuse contribution a été reçue avec succès !
              </p>
            </div>

            {verifyData.amount && (
              <div className="py-6 border-y border-border">
                <p className="text-sm text-muted-foreground uppercase tracking-wider mb-2">
                  Votre contribution
                </p>
                <p className="text-4xl font-serif text-primary">
                  {formatAmount(verifyData.amount)}
                </p>
              </div>
            )}

            <p className="text-muted-foreground font-sans text-sm italic">
              Les Mariés vous remercient du fond du cœur pour votre générosité.
              Votre geste contribue à rendre notre union encore plus spéciale.
            </p>

            {totalData && totalData.total > 0 && (
              <div className="pt-6 border-t border-border/50">
                <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground mb-2">
                  <Gift className="h-4 w-4" />
                  <span>Total collecté</span>
                </div>
                <p className="text-2xl font-serif text-foreground">
                  {formatAmount(totalData.total)}
                </p>
              </div>
            )}
          </Card>
        ) : (
          <Card className="p-8 space-y-6">
            <div className="h-16 w-16 mx-auto rounded-full bg-yellow-100 flex items-center justify-center">
              <Gift className="h-8 w-8 text-yellow-600" />
            </div>
            <div className="space-y-2">
              <h1 className="text-2xl font-serif text-foreground">
                Paiement en cours de vérification
              </h1>
              <p className="text-muted-foreground font-sans text-sm">
                Votre paiement est en cours de traitement. Si vous avez terminé le paiement,
                il sera confirmé sous peu.
              </p>
            </div>
          </Card>
        )}

        <Button
          asChild
          variant="outline"
          className="mt-8"
          data-testid="button-back-home"
        >
          <Link href="/">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour au site
          </Link>
        </Button>

        <p className="text-xs text-muted-foreground">
          © 2026 Les Mariés. Tous droits réservés.
        </p>
      </div>
    </div>
  );
}
