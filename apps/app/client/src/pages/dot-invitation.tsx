import { useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { Loader2, MapPin, Gift, ExternalLink, Calendar } from "lucide-react";
import { useWedding } from "@/hooks/use-api";
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

function hexToHSL(hex: string): { h: number; s: number; l: number } {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0;
  const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
    else if (max === g) h = ((b - r) / d + 2) / 6;
    else h = ((r - g) / d + 4) / 6;
  }
  return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) };
}

function OrnamentDivider({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 200 24" className="w-32 md:w-40 h-6 mx-auto" fill="none" stroke={color} strokeWidth="1" opacity={0.5}>
      <line x1="0" y1="12" x2="80" y2="12" />
      <circle cx="100" cy="12" r="4" fill={color} />
      <line x1="120" y1="12" x2="200" y2="12" />
    </svg>
  );
}

function Countdown({ targetDate, primaryColor, textDark }: { targetDate: Date; primaryColor: string; textDark: string }) {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    const tick = () => {
      const diff = targetDate.getTime() - Date.now();
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
    <div className="flex gap-6 md:gap-10 justify-center items-center">
      {[
        { value: timeLeft.days, label: "Jours" },
        { value: timeLeft.hours, label: "Heures" },
        { value: timeLeft.minutes, label: "Min" },
        { value: timeLeft.seconds, label: "Sec" },
      ].map((item) => (
        <div key={item.label} className="flex flex-col items-center gap-2">
          <span className="text-4xl md:text-5xl font-serif font-light" style={{ color: primaryColor }}>
            {String(item.value).padStart(2, "0")}
          </span>
          <span className="text-[10px] uppercase tracking-[0.2em]" style={{ color: textDark, opacity: 0.4 }}>
            {item.label}
          </span>
        </div>
      ))}
    </div>
  );
}

export default function GuestInvitationPage() {
  const params = useParams();
  const guestId = (params as any).guestId;
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

  const { data: wedding } = useWedding(guest?.weddingId || "");

  const primaryColor = wedding?.config?.theme?.primaryColor || "#C8A96A";
  const secondaryColor = wedding?.config?.theme?.secondaryColor || "#FFFDF9";
  const primaryHSL = hexToHSL(primaryColor);
  const darkL = Math.max(primaryHSL.l - 35, 10);
  const subtleL = Math.min(primaryHSL.l + 10, 55);
  const textDark = `hsl(${primaryHSL.h}, ${Math.min(primaryHSL.s, 30)}%, ${darkL}%)`;
  const textSubtle = `hsl(${primaryHSL.h}, ${Math.min(primaryHSL.s, 25)}%, ${subtleL}%)`;

  useEffect(() => {
    if (typeof window === "undefined" || !guestId) return;
    let cancelled = false;
    QRCodeLib.toDataURL(window.location.href, {
      margin: 1,
      width: 320,
      color: { dark: primaryColor, light: "#00000000" },
    })
      .then((url) => { if (!cancelled) setQrDataUrl(url); })
      .catch(() => { if (!cancelled) setQrDataUrl(""); });
    return () => { cancelled = true; };
  }, [guestId, primaryColor]);

  const countdownDate = useMemo(() => {
    const raw = wedding?.config?.sections?.countdownDate || wedding?.weddingDate || "2026-03-21T00:00:00";
    const date = new Date(raw);
    return Number.isNaN(date.getTime()) ? new Date("2026-03-21T00:00:00") : date;
  }, [wedding?.config?.sections?.countdownDate, wedding?.weddingDate]);

  const title = wedding?.title || "Notre mariage";
  const heroSubtitle = wedding?.config?.texts?.heroSubtitle || "Le Mariage de";
  const heroTitle = wedding?.config?.texts?.heroTitle || title;
  const heroImage = wedding?.config?.media?.heroImage || "";
  const couplePhoto = wedding?.config?.media?.couplePhoto || "";
  const storyBody = wedding?.config?.texts?.storyBody || "";
  const programItems = wedding?.config?.sections?.programItems || [];
  const locations = wedding?.config?.sections?.locationItems || [];
  const cagnotteExternalUrl = (wedding?.config?.payments?.externalUrl || (wedding?.config?.sections as any)?.cagnotteExternalUrl || "") as string;
  const cagnotteTitle = (wedding?.config?.texts as any)?.cagnotteTitle || "Cadeau de Mariage";
  const cagnotteDescription = (wedding?.config?.texts as any)?.cagnotteDescription || "Votre présence est notre plus beau cadeau. Si vous souhaitez nous gâter, nous préférons une participation à notre cagnotte.";
  const cagnotteMode = wedding?.config?.payments?.mode || (cagnotteExternalUrl ? "external" : "stripe");
  const weddingSlug = (wedding as any)?.slug || "";
  const basePath = weddingSlug ? `/${weddingSlug}` : "/";
  const cagnotteHref = cagnotteMode === "external" ? cagnotteExternalUrl : `${basePath}#cagnotte`;
  const rsvpHref = `${basePath}#rsvp`;

  const weddingDateStr = wedding?.config?.texts?.weddingDate ||
    (wedding?.weddingDate
      ? new Date(wedding.weddingDate).toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric" })
      : "");

  const dateObj = wedding?.weddingDate ? new Date(wedding.weddingDate) : null;
  const dayName = dateObj ? dateObj.toLocaleDateString("fr-FR", { weekday: "long" }) : "";
  const dayNum = dateObj ? dateObj.getDate() : "";
  const monthYear = dateObj ? dateObj.toLocaleDateString("fr-FR", { month: "long", year: "numeric" }) : "";

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: secondaryColor }}>
        <Loader2 className="h-8 w-8 animate-spin" style={{ color: primaryColor }} />
      </div>
    );
  }

  if (error || !guest) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6" style={{ backgroundColor: secondaryColor }}>
        <div className="text-center space-y-3">
          <p className="text-lg font-serif" style={{ color: textDark }}>Invitation non trouvée</p>
          <p className="text-sm" style={{ color: textSubtle }}>Vérifiez le lien ou contactez les mariés.</p>
        </div>
      </div>
    );
  }

  const isCouple = guest.partySize >= 2;
  const guestGreeting = isCouple ? `${guest.firstName} ${guest.lastName}` : guest.firstName;

  return (
    <div className="min-h-screen font-serif" style={{ backgroundColor: secondaryColor, color: textDark }}>

      {/* HERO */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {heroImage ? (
          <>
            <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${heroImage})` }} />
            <div className="absolute inset-0 bg-black/40" />
          </>
        ) : (
          <div className="absolute inset-0" style={{ background: `linear-gradient(180deg, ${secondaryColor} 0%, color-mix(in srgb, ${primaryColor} 5%, ${secondaryColor}) 100%)` }} />
        )}

        <div className="relative z-10 text-center max-w-3xl mx-auto px-6 py-20 space-y-8">
          <OrnamentDivider color={heroImage ? "#FFFFFF" : primaryColor} />

          <p className="text-xs md:text-sm tracking-[0.3em] uppercase font-light" style={{ color: heroImage ? "rgba(255,255,255,0.7)" : textSubtle }}>
            {guest.firstName}, vous êtes cordialement invité{isCouple ? "(e)s" : "(e)"}
          </p>

          <p className="text-xs tracking-[0.2em] uppercase font-light" style={{ color: heroImage ? "rgba(255,255,255,0.5)" : textSubtle }}>
            au mariage de
          </p>

          <h1 className="text-5xl md:text-7xl lg:text-8xl font-serif font-bold leading-[0.95] tracking-tight" style={{
            color: heroImage ? "#FFFFFF" : textDark,
            textShadow: heroImage ? "0 4px 30px rgba(0,0,0,0.4)" : "none",
          }}>
            {heroTitle}
          </h1>

          {storyBody ? (
            <p className="text-sm md:text-base italic max-w-xl mx-auto leading-relaxed" style={{ color: heroImage ? "rgba(255,255,255,0.8)" : textSubtle }}>
              {storyBody.length > 120 ? storyBody.slice(0, 120) + "…" : storyBody}
            </p>
          ) : null}

          <p className="text-sm max-w-md mx-auto" style={{ color: heroImage ? "rgba(255,255,255,0.7)" : textSubtle }}>
            Nous vous invitons à partager la célébration de notre mariage.
          </p>

          <OrnamentDivider color={heroImage ? "#FFFFFF" : primaryColor} />

          {dateObj ? (
            <div className="pt-4 space-y-1">
              <p className="text-sm tracking-[0.2em] uppercase font-light capitalize" style={{ color: heroImage ? "rgba(255,255,255,0.6)" : textSubtle }}>
                {dayName}
              </p>
              <p className="text-6xl md:text-7xl font-serif font-light" style={{ color: heroImage ? "#FFFFFF" : primaryColor }}>
                {dayNum}
              </p>
              <p className="text-sm tracking-[0.2em] uppercase font-light capitalize" style={{ color: heroImage ? "rgba(255,255,255,0.6)" : textSubtle }}>
                {monthYear}
              </p>
            </div>
          ) : weddingDateStr ? (
            <div className="inline-flex flex-col items-center gap-1 py-4 px-10 border-y" style={{ borderColor: heroImage ? "rgba(255,255,255,0.25)" : `color-mix(in srgb, ${primaryColor} 30%, transparent)` }}>
              <span className="text-lg md:text-2xl font-serif tracking-widest" style={{ color: heroImage ? "rgba(255,255,255,0.9)" : textDark }}>
                {weddingDateStr}
              </span>
            </div>
          ) : null}
        </div>
      </section>

      {/* COUNTDOWN */}
      <section className="py-16 px-6" style={{ borderTop: `1px solid color-mix(in srgb, ${primaryColor} 15%, transparent)` }}>
        <Countdown targetDate={countdownDate} primaryColor={primaryColor} textDark={textDark} />
      </section>

      {/* PROGRAMME */}
      {programItems.length > 0 ? (
        <section className="py-20 px-6">
          <div className="max-w-2xl mx-auto">
            <div className="text-center mb-16 space-y-3">
              <h2 className="text-3xl md:text-4xl font-serif font-light tracking-wide" style={{ color: primaryColor }}>
                Programme
              </h2>
              <p className="text-sm" style={{ color: textSubtle }}>de la journée</p>
            </div>

            <div className="relative">
              <div className="absolute left-6 md:left-8 top-0 bottom-0 w-px" style={{ backgroundColor: `color-mix(in srgb, ${primaryColor} 20%, transparent)` }} />

              <div className="space-y-12">
                {programItems.map((item: any, idx: number) => (
                  <div key={idx} className="relative flex items-start gap-6 md:gap-8 pl-0">
                    <div className="relative z-10 flex-shrink-0 w-12 md:w-16 text-right">
                      <span className="text-lg md:text-xl font-serif font-light" style={{ color: primaryColor }}>
                        {item.time || ""}
                      </span>
                    </div>
                    <div className="absolute left-6 md:left-8 top-2 w-3 h-3 rounded-full border-2 -translate-x-1/2" style={{ borderColor: primaryColor, backgroundColor: secondaryColor }} />
                    <div className="flex-1 pt-0 min-w-0">
                      <h3 className="text-base md:text-lg font-serif font-medium" style={{ color: textDark }}>
                        {item.title || ""}
                      </h3>
                      {item.description ? (
                        <p className="text-sm mt-1" style={{ color: textSubtle }}>{item.description}</p>
                      ) : null}
                      {item.location ? (
                        <a
                          href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(item.location)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 mt-2 text-xs font-sans hover:underline"
                          style={{ color: primaryColor }}
                        >
                          <MapPin className="h-3 w-3" />
                          Voir sur Google Maps
                        </a>
                      ) : null}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      ) : locations.length > 0 ? (
        <section className="py-20 px-6">
          <div className="max-w-2xl mx-auto">
            <div className="text-center mb-16 space-y-3">
              <h2 className="text-3xl md:text-4xl font-serif font-light tracking-wide" style={{ color: primaryColor }}>
                Lieux
              </h2>
            </div>
            <div className="relative">
              <div className="absolute left-6 md:left-8 top-0 bottom-0 w-px" style={{ backgroundColor: `color-mix(in srgb, ${primaryColor} 20%, transparent)` }} />
              <div className="space-y-12">
                {locations.map((loc: any, idx: number) => (
                  <div key={idx} className="relative flex items-start gap-6 md:gap-8 pl-0">
                    <div className="relative z-10 flex-shrink-0 w-12 md:w-16 flex justify-center">
                      <MapPin className="h-5 w-5" style={{ color: primaryColor }} />
                    </div>
                    <div className="absolute left-6 md:left-8 top-2 w-3 h-3 rounded-full border-2 -translate-x-1/2" style={{ borderColor: primaryColor, backgroundColor: secondaryColor }} />
                    <div className="flex-1 pt-0 min-w-0">
                      <h3 className="text-base md:text-lg font-serif font-medium" style={{ color: textDark }}>{loc.title}</h3>
                      {loc.address ? (
                        <>
                          <p className="text-sm mt-1" style={{ color: textSubtle }}>{loc.address}</p>
                          <a
                            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(loc.address)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 mt-2 text-xs font-sans hover:underline"
                            style={{ color: primaryColor }}
                          >
                            Voir sur Google Maps
                          </a>
                        </>
                      ) : null}
                      {loc.description ? <p className="text-sm mt-1" style={{ color: textSubtle }}>{loc.description}</p> : null}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      ) : null}

      {/* MESSAGE */}
      <section className="py-16 px-6 text-center" style={{ borderTop: `1px solid color-mix(in srgb, ${primaryColor} 10%, transparent)` }}>
        <div className="max-w-lg mx-auto space-y-4">
          <p className="text-base md:text-lg font-serif italic leading-relaxed" style={{ color: textDark }}>
            Nous nous réjouissons de partager ce moment avec vous.
          </p>
          <p className="text-sm" style={{ color: textSubtle }}>
            Apportez votre bonne humeur, préparez vos plus beaux pas de danse.
          </p>
        </div>
      </section>

      {/* CAGNOTTE */}
      {cagnotteHref ? (
        <section className="py-20 px-6" style={{ borderTop: `1px solid color-mix(in srgb, ${primaryColor} 10%, transparent)` }}>
          <div className="max-w-lg mx-auto text-center space-y-6">
            <div className="w-14 h-14 mx-auto rounded-full flex items-center justify-center" style={{ backgroundColor: `color-mix(in srgb, ${primaryColor} 10%, transparent)` }}>
              <Gift className="h-7 w-7" style={{ color: primaryColor }} />
            </div>
            <h2 className="text-3xl md:text-4xl font-serif font-light" style={{ color: primaryColor }}>
              {cagnotteTitle}
            </h2>
            <p className="text-sm leading-relaxed" style={{ color: textSubtle }}>
              {cagnotteDescription}
            </p>
            <a
              href={cagnotteHref}
              target={cagnotteMode === "external" ? "_blank" : undefined}
              rel={cagnotteMode === "external" ? "noopener noreferrer" : undefined}
              className="inline-flex items-center gap-2 px-10 py-4 text-xs tracking-[0.2em] uppercase font-bold text-white transition-all hover:opacity-90"
              style={{ backgroundColor: primaryColor }}
            >
              Participer
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </div>
        </section>
      ) : null}

      {/* QR CODE */}
      {qrDataUrl ? (
        <section className="py-16 px-6" style={{ borderTop: `1px solid color-mix(in srgb, ${primaryColor} 10%, transparent)` }}>
          <div className="max-w-sm mx-auto text-center space-y-4">
            <div className="rounded-2xl p-6 inline-block" style={{ backgroundColor: `color-mix(in srgb, ${primaryColor} 5%, ${secondaryColor})`, border: `1px solid color-mix(in srgb, ${primaryColor} 15%, transparent)` }}>
              <img src={qrDataUrl} alt="QR code invitation" className="h-32 w-32 mx-auto" />
            </div>
            <p className="text-xs" style={{ color: textSubtle }}>
              Scannez ce code pour ouvrir votre invitation
            </p>
          </div>
        </section>
      ) : null}

      {/* FOOTER NOTE */}
      <section className="py-12 px-6 text-center" style={{ borderTop: `1px solid color-mix(in srgb, ${primaryColor} 10%, transparent)` }}>
        <p className="text-xs max-w-md mx-auto" style={{ color: textSubtle }}>
          Pour des raisons d'organisation, nous vous remercions de ne pas inviter de personnes supplémentaires.
        </p>
      </section>

      {/* COUPLE PHOTO */}
      {couplePhoto ? (
        <section className="pb-8 px-6 flex justify-center">
          <img
            src={couplePhoto}
            alt={heroTitle}
            className="max-w-xs w-full rounded-2xl object-cover shadow-lg"
            style={{ border: `1px solid color-mix(in srgb, ${primaryColor} 20%, transparent)` }}
          />
        </section>
      ) : null}

      {/* RSVP FLOATING BUTTON */}
      {(guest.availability === "confirmed" || guest.availability === "pending") ? (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
          <a
            href={rsvpHref}
            className="flex items-center gap-2 px-8 py-4 text-xs tracking-[0.2em] uppercase font-bold text-white shadow-2xl transition-all hover:scale-105"
            style={{ backgroundColor: primaryColor, borderRadius: "9999px" }}
          >
            <Calendar className="h-4 w-4" />
            Confirmer ma présence
          </a>
        </div>
      ) : null}
    </div>
  );
}
