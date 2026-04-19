import { ReactNode } from "react";
import { Link } from "wouter";
import { Crown, Sparkles, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

interface PremiumAccessGateProps {
  children: ReactNode;
  isPremium: boolean;
  featureName: string;
  description: string;
}

export function PremiumAccessGate({ children, isPremium, featureName, description }: PremiumAccessGateProps) {
  if (isPremium) {
    return <>{children}</>;
  }

  return (
    <div className="relative overflow-hidden min-h-[600px] bg-slate-50/30 rounded-[3rem]">
      {/* Premium Mockup Background (Static illustration instead of blurred user data) */}
      <div className="absolute inset-0 opacity-[0.08] pointer-events-none select-none p-12">
         <div className="grid grid-cols-3 gap-8 h-full">
            {[1, 2, 3].map(col => (
               <div key={col} className="space-y-6">
                  <div className="h-4 w-32 bg-slate-900 rounded-full mb-8 opacity-20" />
                  {[1, 2, 3, 4].map(row => (
                     <div key={row} className="bg-white border-2 border-slate-200 rounded-3xl h-32 w-full shadow-sm" />
                  ))}
               </div>
            ))}
         </div>
      </div>

      {/* Premium Overlay Content */}
      <div className="relative z-50 flex items-center justify-center min-h-[600px] p-6">
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="max-w-md w-full bg-white/90 backdrop-blur-2xl border border-primary/20 p-8 md:p-12 rounded-[3.5rem] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.15)] text-center"
        >
          <div className="w-20 h-20 bg-primary/10 rounded-3xl flex items-center justify-center mx-auto mb-6">
            <Sparkles className="h-10 w-10 text-primary" />
          </div>
          
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/5 border border-primary/10 text-[10px] font-black uppercase tracking-widest text-primary mb-4">
            <Crown className="h-3 w-3 text-amber-500/70" />
            Feature Premium
          </div>
          
          <h3 className="text-2xl font-black tracking-tight mb-2">Débloquez {featureName}</h3>
          <p className="text-muted-foreground text-sm leading-relaxed mb-8">
            {description}
          </p>
          
          <div className="space-y-3">
            <Button asChild className="w-full h-14 rounded-2xl shadow-lg shadow-primary/20 text-md font-bold gap-2">
              <Link href="/billing">
                Passer au Premium
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">
              Essai gratuit illimité pour le reste de l'app
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
