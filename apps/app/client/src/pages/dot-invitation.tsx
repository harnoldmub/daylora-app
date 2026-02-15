import { useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, Download, Heart, Users, Clock, Gift, ExternalLink } from "lucide-react";
import { useWedding } from "@/hooks/use-api";
import { getButtonClass } from "@/lib/design-presets";

type GuestData = {
  id: number;
  weddingId: string;
  firstName: string;
  lastName: string;
  availability: string;
  partySize: number;
  tableNumber?: number | null;
};

const getButtonRadiusClass = (buttonRadius?: string) => {
  if (buttonRadius === "square") return "rounded-md";
  if (buttonRadius === "rounded") return "rounded-xl";
  return "rounded-full";
};

function Countdown({ targetDate }: { targetDate: Date }) {
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  useEffect(() => {
    const tick = () => {
      const now = new Date();
      const diff = targetDate.getTime() - now.getTime();
      if (diff <= 0) return;

      setTimeLeft({
        days: Math.floor(diff / (1000 * 60 * 60 * 24)),
        hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((diff / 1000 / 60) % 60),
        seconds: Math.floor((diff / 1000) % 60),
      });
    };

    tick();
    const timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
  }, [targetDate]);

  return (
    <div className="flex gap-3 md:gap-6 justify-center items-center flex-wrap">
      {[
        { value: timeLeft.days, label: "Jours" },
        { value: timeLeft.hours, label: "Heures" },
        { value: timeLeft.minutes, label: "Minutes" },
        { value: timeLeft.seconds, label: "Secondes" },
      ].map((item) => (
        <div key={item.label} className="flex flex-col items-center">
          <div className="w-14 h-14 md:w-16 md:h-16 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
            <span className="text-xl md:text-2xl font-serif font-bold text-primary">
              {item.value.toString().padStart(2, "0")}
            </span>
          </div>
          <span className="text-xs text-muted-foreground mt-1 font-sans">{item.label}</span>
        </div>
      ))}
    </div>
  );
}

export default function GuestInvitationPage() {
  const params = useParams<{ slug: string; guestId: string }>();
  const slug = params.slug || window.location.pathname.split("/")[1] || "";
  const guestId = params.guestId;
  const { data: wedding } = useWedding(slug);

  const { data: guest, isLoading, error } = useQuery<GuestData>({
    queryKey: ["/api/invitation/guest", guestId],
    queryFn: async () => {
      const res = await fetch(`/api/invitation/guest/${guestId}`);
      if (!res.ok) throw new Error("Invité non trouvé");
      return res.json();
    },
    enabled: !!guestId,
  });

  const countdownDate = useMemo(() => {
    const raw = wedding?.config?.sections?.countdownDate || wedding?.weddingDate || "2026-03-21T00:00:00";
    const date = new Date(raw);
    return Number.isNaN(date.getTime()) ? new Date("2026-03-21T00:00:00") : date;
  }, [wedding?.config?.sections?.countdownDate, wedding?.weddingDate]);

  const countdownLabel =
    wedding?.config?.texts?.weddingDate ||
    (wedding?.weddingDate
      ? new Date(wedding.weddingDate).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })
      : "Prochainement");

  const title = wedding?.title || "Notre mariage";
  const logoUrl = wedding?.config?.branding?.logoUrl || "";
  const logoText = wedding?.config?.branding?.logoText || title;
  const buttonToneClass = getButtonClass(wedding?.config?.theme?.buttonStyle);
  const buttonRadiusClass = getButtonRadiusClass(wedding?.config?.theme?.buttonRadius);

  if (isLoading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !guest) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center p-6">
        <div className="text-center space-y-2">
          <p className="text-lg font-semibold">Invitation non trouvée</p>
          <p className="text-sm text-muted-foreground">Vérifiez le lien ou contactez les mariés.</p>
        </div>
      </div>
    );
  }

  const isCouple = guest.partySize >= 2;
  const isAllowed = guest.availability === "confirmed" || guest.availability === "pending";
  const downloadHref = `/api/invitation/pdf/${guestId}`;
  const cagnotteHref = slug ? `/${slug}/cagnotte` : "/cagnotte";

  return (
    <div className="min-h-[calc(100vh-64px)] flex items-center justify-center p-6 bg-background">
      <div className="w-full max-w-lg">
        <div className="rounded-3xl border bg-card shadow-sm overflow-hidden">
          <div className="p-8 text-center">
            <div className="flex items-center justify-center gap-3 mb-6">
              {logoUrl ? (
                <img src={logoUrl} alt={logoText} className="h-12 w-auto object-contain" />
              ) : (
                <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center border border-primary/20">
                  <Heart className="h-6 w-6 text-primary" />
                </div>
              )}
              <div className="text-left">
                <div className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Invitation</div>
                <div className="text-2xl font-serif font-bold">{title}</div>
              </div>
            </div>

            <div className="rounded-2xl border bg-muted/10 p-6">
              <div className="flex items-center justify-center gap-2 text-xs uppercase tracking-widest text-muted-foreground mb-3">
                {isCouple ? <Users className="h-4 w-4 text-primary" /> : <Heart className="h-4 w-4 text-primary" />}
                {isCouple ? "Invitation Couple" : "Invitation Personnelle"}
              </div>
              <div className="text-2xl font-serif font-semibold">
                {guest.firstName} {guest.lastName}
              </div>
              {typeof guest.tableNumber === "number" ? (
                <div className="text-sm text-muted-foreground mt-1">Table {guest.tableNumber}</div>
              ) : (
                <div className="text-sm text-muted-foreground mt-1">
                  {isCouple ? "2 personnes" : "1 personne"}
                </div>
              )}
            </div>

            <div className="mt-6">
              <div className="text-xs uppercase tracking-widest text-muted-foreground mb-3 flex items-center justify-center gap-2">
                <Clock className="h-4 w-4" />
                Compte à rebours
                <span className="text-primary">{countdownLabel}</span>
              </div>
              <Countdown targetDate={countdownDate} />
            </div>

            <div className="mt-8 space-y-3">
              {isAllowed ? (
                <a href={downloadHref} target="_blank" rel="noopener noreferrer" className="block">
                  <Button className={`w-full h-12 ${buttonToneClass} ${buttonRadiusClass}`}>
                    <Download className="h-4 w-4 mr-2" />
                    Télécharger mon invitation (PDF)
                  </Button>
                </a>
              ) : (
                <div className="rounded-2xl border bg-muted/10 p-4 text-sm text-muted-foreground">
                  Invitation non disponible ou participation déclinée.
                </div>
              )}

              <a href={cagnotteHref} className="block" data-testid="link-cagnotte">
                <Button variant="outline" className={`w-full h-12 ${buttonRadiusClass}`}>
                  <Gift className="h-4 w-4 mr-2 text-primary" />
                  Accéder à la cagnotte
                  <ExternalLink className="h-4 w-4 ml-2 text-muted-foreground" />
                </Button>
              </a>
            </div>

            <p className="mt-8 text-xs text-muted-foreground">
              Besoin d'aide ? Contactez les mariés ou revenez plus tard.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

