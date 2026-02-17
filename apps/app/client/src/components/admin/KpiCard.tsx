import type { ReactNode } from "react";
import { Card } from "@/components/ui/card";

type KpiCardProps = {
  label: string;
  value: ReactNode;
  hint?: string;
  icon: ReactNode;
};

export function KpiCard({ label, value, hint, icon }: KpiCardProps) {
  return (
    <Card className="p-5 border bg-card shadow-sm">
      <div className="flex items-center gap-4">
        <div className="h-11 w-11 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
          {icon}
        </div>
        <div>
          <div className="text-xs uppercase tracking-widest text-muted-foreground">{label}</div>
          <div className="text-2xl font-semibold leading-tight">{value}</div>
          {hint ? <div className="text-xs text-muted-foreground">{hint}</div> : null}
        </div>
      </div>
    </Card>
  );
}

