import { useState, useEffect, useCallback } from "react";
import { useMutation } from "@tanstack/react-query";
import { useLocation, useParams } from "wouter";
import {
  Crown,
  Users,
  Palette,
  Sparkles,
  Radio,
  Headphones,
  CalendarDays,
  X,
  Loader2,
} from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { type User, type Wedding } from "@shared/schema";
import { Badge } from "@/components/ui/badge";

const FEATURES = [
  { icon: Users, label: "Invités illimités" },
  { icon: Palette, label: "Templates premium" },
  { icon: Sparkles, label: "Personnalisation avancée" },
  { icon: Radio, label: "Accès live" },
  { icon: Headphones, label: "Support prioritaire" },
  { icon: CalendarDays, label: "12 mois complets" },
];

export function PremiumUpsellModal({
  user,
  wedding,
}: {
  user: User;
  wedding: Wedding | null;
}) {
  const [open, setOpen] = useState(false);
  const [, setLocation] = useLocation();
  const params = useParams<{ weddingId: string }>();
  const weddingId = params.weddingId || wedding?.id || "";

  useEffect(() => {
    if (
      user &&
      !user.hasSeenPremiumOffer &&
      wedding?.currentPlan !== "premium"
    ) {
      const timer = setTimeout(() => setOpen(true), 800);
      return () => clearTimeout(timer);
    }
  }, [user, wedding]);

  const markSeenMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/auth/premium-offer-seen");
    },
    onSuccess: () => {
      queryClient.setQueryData(["/api/auth/me"], (prev: any) =>
        prev ? { ...prev, hasSeenPremiumOffer: true } : prev
      );
    },
  });

  const checkoutMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/billing/checkout", {
        type: "one_time",
      });
      return await res.json();
    },
    onSuccess: (data: any) => {
      if (data.url) window.location.href = data.url;
    },
  });

  const handleDismiss = () => {
    setOpen(false);
    markSeenMutation.mutate();
  };

  const handleCheckout = () => {
    markSeenMutation.mutate();
    checkoutMutation.mutate();
  };

  if (!open) return null;

  return (
    <Dialog open={open} onOpenChange={(val) => { if (!val) handleDismiss(); }}>
      <DialogContent className="sm:max-w-lg p-0 gap-0 overflow-hidden border-primary/20">
        <button
          onClick={handleDismiss}
          className="absolute right-4 top-4 z-10 rounded-full p-1 hover:bg-muted transition-colors"
        >
          <X className="h-4 w-4 text-muted-foreground" />
        </button>

        <div className="bg-gradient-to-br from-primary/5 via-primary/10 to-primary/5 px-8 pt-10 pb-8 text-center">
          <div className="mx-auto w-14 h-14 rounded-2xl bg-primary/15 flex items-center justify-center mb-5">
            <Crown className="h-7 w-7 text-primary" />
          </div>
          <h2 className="text-2xl font-serif font-bold tracking-tight">
            Organisez votre mariage sereinement
          </h2>
          <p className="text-sm text-muted-foreground mt-3 max-w-sm mx-auto leading-relaxed">
            Débloquez toutes les fonctionnalités premium de Daylora pour une
            organisation complète et sans limite. Un seul paiement de 149€, sans
            abonnement automatique.
          </p>
        </div>

        <div className="px-8 py-6 space-y-6">
          <div className="grid grid-cols-2 gap-3">
            {FEATURES.map(({ icon: Icon, label }) => (
              <div
                key={label}
                className="flex items-center gap-2.5 text-sm py-2"
              >
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <Icon className="h-4 w-4 text-primary" />
                </div>
                <span className="font-medium">{label}</span>
              </div>
            ))}
          </div>

          <div className="space-y-2.5">
            <Button
              className="w-full h-12 text-base font-bold shadow-md bg-primary hover:bg-primary/90"
              disabled={checkoutMutation.isPending}
              onClick={handleCheckout}
            >
              {checkoutMutation.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Crown className="mr-2 h-4 w-4" />
              )}
              Débloquer Premium – 149€
            </Button>
            <Button
              variant="ghost"
              className="w-full text-muted-foreground hover:text-foreground"
              onClick={handleDismiss}
            >
              Continuer en version gratuite
            </Button>
          </div>

          <p className="text-center text-[11px] text-muted-foreground/70">
            Paiement unique • 12 mois d'accès • Aucun renouvellement automatique
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function PremiumTemplateUpsell({
  open,
  onClose,
  templateName,
}: {
  open: boolean;
  onClose: () => void;
  templateName: string;
}) {
  const checkoutMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/billing/checkout", {
        type: "one_time",
      });
      return await res.json();
    },
    onSuccess: (data: any) => {
      if (data.url) window.location.href = data.url;
    },
  });

  return (
    <Dialog open={open} onOpenChange={(val) => { if (!val) onClose(); }}>
      <DialogContent className="sm:max-w-md p-0 gap-0 overflow-hidden border-primary/20">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 z-10 rounded-full p-1 hover:bg-muted transition-colors"
        >
          <X className="h-4 w-4 text-muted-foreground" />
        </button>

        <div className="bg-gradient-to-br from-primary/5 via-primary/10 to-primary/5 px-8 pt-8 pb-6 text-center">
          <div className="mx-auto w-12 h-12 rounded-2xl bg-primary/15 flex items-center justify-center mb-4">
            <Palette className="h-6 w-6 text-primary" />
          </div>
          <Badge className="mb-3 bg-primary/10 text-primary border-primary/20 hover:bg-primary/10">
            Recommandé
          </Badge>
          <h2 className="text-xl font-serif font-bold tracking-tight">
            Le template « {templateName} » est Premium
          </h2>
          <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
            Débloquez tous les templates et fonctionnalités avancées avec un
            paiement unique de 149€.
          </p>
        </div>

        <div className="px-8 py-5 space-y-4">
          <div className="grid grid-cols-2 gap-2 text-sm">
            {FEATURES.map(({ icon: Icon, label }) => (
              <div key={label} className="flex items-center gap-2 py-1.5">
                <Icon className="h-3.5 w-3.5 text-primary" />
                <span>{label}</span>
              </div>
            ))}
          </div>

          <div className="space-y-2">
            <Button
              className="w-full h-11 font-bold shadow-md bg-primary hover:bg-primary/90"
              disabled={checkoutMutation.isPending}
              onClick={() => checkoutMutation.mutate()}
            >
              {checkoutMutation.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Crown className="mr-2 h-4 w-4" />
              )}
              Débloquer Premium – 149€
            </Button>
            <Button
              variant="ghost"
              className="w-full text-muted-foreground hover:text-foreground text-sm"
              onClick={onClose}
            >
              Rester en version gratuite
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
