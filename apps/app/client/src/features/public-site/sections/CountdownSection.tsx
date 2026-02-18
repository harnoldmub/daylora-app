import { useEffect, useState } from "react";
import { InlineEditor } from "@/components/ui/inline-editor";
import type { CountdownSectionProps } from "@/features/public-site/types";

function Countdown({ weddingDate }: { weddingDate: string }) {
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  useEffect(() => {
    const target = new Date(weddingDate);
    const timer = setInterval(() => {
      const now = new Date();
      const difference = target.getTime() - now.getTime();

      if (difference > 0) {
        setTimeLeft({
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
          minutes: Math.floor((difference / 1000 / 60) % 60),
          seconds: Math.floor((difference / 1000) % 60),
        });
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [weddingDate]);

  return (
    <div className="flex gap-4 md:gap-8 justify-center items-center flex-wrap">
      {[
        { value: timeLeft.days, label: "Jours" },
        { value: timeLeft.hours, label: "Heures" },
        { value: timeLeft.minutes, label: "Minutes" },
        { value: timeLeft.seconds, label: "Secondes" },
      ].map((item, idx) => (
        <div key={idx} className="flex flex-col items-center">
          <div className="w-16 h-16 md:w-20 md:h-20 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
            <span className="text-2xl md:text-3xl font-serif font-bold text-primary">
              {item.value.toString().padStart(2, "0")}
            </span>
          </div>
          <span className="text-xs md:text-sm text-muted-foreground mt-2 font-sans">
            {item.label}
          </span>
        </div>
      ))}
    </div>
  );
}

export function CountdownSection({
  weddingDate,
  countdownTitle,
  onSaveText,
  canEdit,
  editMode,
}: CountdownSectionProps) {
  return (
    <section id="countdown" className="scroll-mt-24 py-20 px-6 bg-background">
      <div className="max-w-3xl mx-auto text-center">
        <div className="text-xs uppercase tracking-[0.35em] text-muted-foreground mb-4">
          <InlineEditor
            value={countdownTitle}
            onSave={(val) => onSaveText("countdownTitle", val)}
            canEdit={canEdit && editMode}
            placeholder="Compte à rebours"
          />
        </div>
        <div className="flex justify-center">
          <Countdown weddingDate={weddingDate} />
        </div>
      </div>
    </section>
  );
}
