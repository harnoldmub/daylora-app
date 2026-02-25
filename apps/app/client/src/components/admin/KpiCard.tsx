import type { ReactNode } from "react";
import { Card } from "@/components/ui/card";

type KpiCardProps = {
  label: string;
  value: ReactNode;
  hint?: string;
  icon: ReactNode;
  max?: number;
};

export function KpiCard({ label, value, hint, icon, max }: KpiCardProps) {
  const numericValue = typeof value === "number" ? value : 0;
  const progress = max ? Math.min((numericValue / max) * 100, 100) : 0;

  return (
    <Card className="p-5 border bg-card shadow-md hover:shadow-lg transition-shadow rounded-2xl">
      <div className="flex items-center gap-4">
        <div className="h-12 w-12 rounded-xl bg-primary/15 text-primary flex items-center justify-center shrink-0">
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-xs uppercase tracking-widest text-muted-foreground">{label}</div>
          <div className="text-2xl font-semibold leading-tight">
            {max ? `${numericValue} / ${max}` : value}
          </div>
          {hint ? <div className="text-xs text-muted-foreground">{hint}</div> : null}
          {max ? (
            <div className="mt-2 h-1.5 w-full rounded-full bg-muted overflow-hidden">
              <div
                className="h-full rounded-full bg-primary transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
          ) : null}
        </div>
      </div>
    </Card>
  );
}
