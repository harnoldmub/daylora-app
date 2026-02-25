import { type ReactNode, useEffect, useRef, useState } from "react";
import { Card } from "@/components/ui/card";

type KpiCardProps = {
  label: string;
  value: ReactNode;
  hint?: string;
  icon: ReactNode;
  max?: number;
};

function AnimatedNumber({ target }: { target: number }) {
  const [display, setDisplay] = useState(0);
  const ref = useRef<number>(0);

  useEffect(() => {
    if (target === 0) { setDisplay(0); return; }
    const duration = 600;
    const start = performance.now();
    const from = ref.current;
    const animate = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(from + (target - from) * eased);
      setDisplay(current);
      if (progress < 1) requestAnimationFrame(animate);
      else ref.current = target;
    };
    requestAnimationFrame(animate);
  }, [target]);

  return <>{display}</>;
}

export function KpiCard({ label, value, hint, icon, max }: KpiCardProps) {
  const numericValue = typeof value === "number" ? value : 0;
  const progress = max ? Math.min((numericValue / max) * 100, 100) : 0;
  const isNumeric = typeof value === "number";

  return (
    <Card className="p-5 border-0 bg-card shadow-sm hover:shadow-md transition-all duration-300 rounded-2xl group">
      <div className="flex items-center gap-4">
        <div className="h-11 w-11 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0 transition-transform duration-300 group-hover:scale-105">
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-[11px] uppercase tracking-widest text-muted-foreground/70 font-medium">{label}</div>
          <div className="text-2xl font-semibold leading-tight mt-0.5">
            {max ? (
              <><AnimatedNumber target={numericValue} /> <span className="text-base font-normal text-muted-foreground">/ {max}</span></>
            ) : isNumeric ? (
              <AnimatedNumber target={numericValue} />
            ) : value}
          </div>
          {hint ? <div className="text-[11px] text-muted-foreground/60 mt-0.5">{hint}</div> : null}
          {max ? (
            <div className="mt-2 h-1 w-full rounded-full bg-primary/8 overflow-hidden">
              <div
                className="h-full rounded-full bg-primary/60 transition-all duration-700 ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>
          ) : null}
        </div>
      </div>
    </Card>
  );
}
