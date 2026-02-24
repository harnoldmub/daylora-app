import { useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, Heart, Users, Clock, Gift, ExternalLink, QrCode, MapPin } from "lucide-react";
import { useWedding } from "@/hooks/use-api";
import { getButtonClass } from "@/lib/design-presets";
import QRCodeLib from "qrcode";

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
  const params = useParams();
  const slug = (params as any).slug || (params as any).weddingId || window.location.pathname.split("/")[1] || "";
  const guestId = (params as any).guestId;
  const { data: wedding } = useWedding(slug);
  const [qrDataUrl, setQrDataUrl] = useState<string>("");

  const { data: guest, isLoading, error } = useQuery<GuestData>({
    queryKey: ["/api/invitation/guest", guestId],
    queryFn: async () => {
      const res = await fetch(`/api/invitation/guest/${guestId}`);
      if (!res.ok) throw new Error("Invité non trouvé");
      return res.json();
    },
    enabled: !!guestId,
  });

  const primaryColor = wedding?.config?.theme?.primaryColor || "#1F2937";

  // Keep hooks order stable: this effect must run even while the page is loading.
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!guestId) return;
    const text = window.location.href;
    let cancelled = false;
    QRCodeLib.toDataURL(text, {
      margin: 1,
      width: 320,
      color: {
        dark: primaryColor,
        light: "#00000000",
      },
    })
      .then((url) => {
        if (!cancelled) setQrDataUrl(url);
      })
      .catch(() => {
        if (!cancelled) setQrDataUrl("");
      });
    return () => {
      cancelled = true;
    };
  }, [guestId, primaryColor]);

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
  const invitationTitle = (wedding?.config?.texts as any)?.invitationTitle || "Invitation";
  const invitationSubtitle = (wedding?.config?.texts as any)?.invitationSubtitle || "Vous êtes invité(e) à célébrer avec nous";
  const invitationBody = (wedding?.config?.texts as any)?.invitationBody || "Retrouvez ici toutes les informations utiles pour le jour J.";
  const invitationCtaRsvp = (wedding?.config?.texts as any)?.invitationCtaRsvp || "Répondre au RSVP";
  const invitationCtaCagnotte = (wedding?.config?.texts as any)?.invitationCtaCagnotte || "Accéder à la cagnotte";
  const invitationImage =
    (wedding?.config?.media as any)?.invitationImage ||
    wedding?.config?.media?.heroImage ||
    "";
  const showLocations = ((wedding?.config?.sections as any)?.invitationShowLocations ?? true) as boolean;
  const showCountdown = ((wedding?.config?.sections as any)?.invitationShowCountdown ?? true) as boolean;
  const locations = wedding?.config?.sections?.locationItems || [];
  const cagnotteExternalUrl = (
    wedding?.config?.payments?.externalUrl ||
    (wedding?.config?.sections as any)?.cagnotteExternalUrl ||
    ""
  ) as string;

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
  const basePath = slug ? `/${slug}` : "/";
  const rsvpHref = `${basePath}/rsvp`;
  const cagnotteMode = wedding?.config?.payments?.mode || (cagnotteExternalUrl ? "external" : "stripe");
  const cagnotteHref = cagnotteMode === "external" ? cagnotteExternalUrl : `${basePath}/cagnotte`;

  return (
    <div className="min-h-[calc(100vh-64px)] bg-background">
      <div className="relative h-[42vh] min-h-[320px] overflow-hidden">
        {invitationImage ? (
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url(${invitationImage})` }}
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-primary/25 via-background to-secondary" />
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-black/35 via-black/10 to-background" />
        <div
          className="absolute -left-40 -top-40 h-[520px] w-[520px] rounded-full blur-3xl opacity-35"
          style={{ background: `radial-gradient(circle, ${primaryColor} 0%, transparent 60%)` }}
        />
        <div
          className="absolute -right-40 -bottom-48 h-[560px] w-[560px] rounded-full blur-3xl opacity-25"
          style={{ background: `radial-gradient(circle, ${primaryColor} 0%, transparent 62%)` }}
        />

        <div className="relative z-10 h-full flex items-end">
          <div className="w-full max-w-5xl mx-auto px-6 pb-10">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                {logoUrl ? (
                  <img src={logoUrl} alt={logoText} className="h-10 w-auto object-contain" />
                ) : (
                  <div className="h-10 w-10 rounded-2xl bg-white/15 flex items-center justify-center border border-white/20">
                    <Heart className="h-5 w-5 text-white" />
                  </div>
                )}
                <div className="text-white">
                  <div className="text-[10px] uppercase tracking-[0.4em] text-white/70">
                    {invitationTitle}
                  </div>
                  <div className="text-2xl md:text-3xl font-serif font-bold">{title}</div>
                </div>
              </div>
              {isAllowed ? (
                <a href={rsvpHref} className="hidden md:inline-block">
                  <Button className={`${buttonToneClass} ${buttonRadiusClass}`}>
                    {invitationCtaRsvp}
                    <ExternalLink className="h-4 w-4 ml-2" />
                  </Button>
                </a>
              ) : null}
            </div>

            <div className="mt-8 text-white max-w-2xl">
              <div className="text-sm md:text-base text-white/85">{invitationSubtitle}</div>
              <div className="mt-2 text-xs md:text-sm text-white/70 leading-relaxed">{invitationBody}</div>
            </div>
          </div>
        </div>
      </div>

      <div className="px-6 py-10">
        <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-[1.1fr_0.9fr] gap-6">
          <div className="rounded-3xl border bg-card shadow-sm overflow-hidden">
            <div className="p-8">
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

            {showCountdown ? (
              <div className="px-8 pb-8">
                <div className="text-xs uppercase tracking-widest text-muted-foreground mb-3 flex items-center justify-center gap-2">
                  <Clock className="h-4 w-4" />
                  Compte à rebours
                  <span className="text-primary">{countdownLabel}</span>
                </div>
                <Countdown targetDate={countdownDate} />
              </div>
            ) : null}

            <div className="px-8 pb-8 space-y-3">
              {isAllowed ? (
                <a href={rsvpHref} className="block">
                  <Button className={`w-full h-12 ${buttonToneClass} ${buttonRadiusClass}`}>
                    {invitationCtaRsvp}
                    <ExternalLink className="h-4 w-4 ml-2" />
                  </Button>
                </a>
              ) : (
                <div className="rounded-2xl border bg-muted/10 p-4 text-sm text-muted-foreground">
                  Invitation non disponible ou participation déclinée.
                </div>
              )}

              {cagnotteHref ? (
                <a
                  href={cagnotteHref}
                  className="block"
                  target={cagnotteMode === "external" ? "_blank" : undefined}
                  rel={cagnotteMode === "external" ? "noopener noreferrer" : undefined}
                  data-testid="link-cagnotte"
                >
                  <Button variant="outline" className={`w-full h-12 ${buttonRadiusClass}`}>
                    <Gift className="h-4 w-4 mr-2 text-primary" />
                    {invitationCtaCagnotte}
                    <ExternalLink className="h-4 w-4 ml-2 text-muted-foreground" />
                  </Button>
                  {cagnotteMode === "external" ? (
                    <div className="mt-2 text-[10px] uppercase tracking-widest text-primary/80 text-center">
                      Paiement externe
                    </div>
                  ) : null}
                </a>
              ) : null}
            </div>

            <div className="px-8 pb-8">
              <p className="text-xs text-muted-foreground">
                Besoin d'aide ? Contactez les mariés ou revenez plus tard.
              </p>
            </div>
          </div>

          <div className="rounded-3xl border bg-card shadow-sm overflow-hidden">
            <div className="p-8 space-y-6">
              <div className="flex items-center justify-between gap-3">
                <div className="text-sm font-semibold">Informations</div>
                {qrDataUrl ? (
                  <div className="inline-flex items-center gap-2 text-xs text-muted-foreground">
                    <QrCode className="h-4 w-4" />
                    QR Code
                  </div>
                ) : null}
              </div>

              {showLocations ? (
                <div className="space-y-4">
                  {locations.length ? (
                    locations.map((l, idx) => (
                      <div key={`${l.title}-${idx}`} className="rounded-2xl border bg-muted/10 p-4">
                        <div className="font-medium flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-primary" />
                          {l.title}
                        </div>
                        {l.address ? (
                          <a
                            className="text-sm text-primary hover:underline"
                            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(l.address)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            {l.address}
                          </a>
                        ) : null}
                        {l.description ? (
                          <div className="text-sm text-muted-foreground mt-2">{l.description}</div>
                        ) : null}
                      </div>
                    ))
                  ) : (
                    <div className="text-sm text-muted-foreground">
                      Les lieux seront indiqués prochainement.
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-sm text-muted-foreground">
                  Les informations pratiques sont disponibles sur la page d'accueil.
                </div>
              )}

              {qrDataUrl ? (
                <div className="pt-2">
                  <div className="rounded-3xl border bg-background/60 p-5 flex items-center gap-4">
                    <div className="h-24 w-24 rounded-2xl bg-white flex items-center justify-center border shadow-sm overflow-hidden">
                      <img src={qrDataUrl} alt="QR code invitation" className="h-full w-full object-contain" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm font-semibold">Scannez pour ouvrir votre invitation</div>
                      <div className="text-xs text-muted-foreground mt-1">
                        Vous pouvez partager ce QR code à l'entrée ou avec vos proches.
                      </div>
                    </div>
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
