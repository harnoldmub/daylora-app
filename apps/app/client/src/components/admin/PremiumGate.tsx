import { Crown, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useParams, useLocation } from "wouter";

interface PremiumGateProps {
  featureName: string;
  children: React.ReactNode;
  isPremium: boolean;
}

export function PremiumGate({ featureName, children, isPremium }: PremiumGateProps) {
  const { weddingId } = useParams<{ weddingId: string }>();
  const [, setLocation] = useLocation();

  if (isPremium) return <>{children}</>;

  return (
    <div className="relative">
      <div className="pointer-events-none opacity-30 blur-[1px] select-none">
        {children}
      </div>
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="bg-white/95 backdrop-blur-sm rounded-2xl border border-primary/20 shadow-lg p-8 max-w-md text-center">
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <Crown className="h-6 w-6 text-primary" />
          </div>
          <h3 className="text-lg font-bold mb-2">Fonctionnalité Premium</h3>
          <p className="text-sm text-muted-foreground mb-4">
            {featureName} est disponible avec le plan Premium. Passez à Premium pour débloquer cette fonctionnalité.
          </p>
          <Button onClick={() => setLocation(`/${weddingId}/billing`)} className="gap-2">
            Passer à Premium
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
