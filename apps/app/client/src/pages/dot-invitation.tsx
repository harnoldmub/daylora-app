import { useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { Loader2, MapPin, Gift, ExternalLink, Bed, ChevronDown } from "lucide-react";
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
    <div className="flex items-center justify-center gap-3 py-4">
      <div className="w-16 h-px" style={{ backgroundColor: color, opacity: 0.25 }} />
      <div className="w-2 h-2 rotate-45" style={{ backgroundColor: color, opacity: 0.5 }} />
      <div className="w-16 h-px" style={{ backgroundColor: color, opacity: 0.25 }} />
    </div>
  );
}

function Diamond({ color, size = 8 }: { color: string; size?: number }) {
  return (
    <div
      className="rotate-45 shrink-0"
      style={{ width: size, height: size, backgroundColor: color }}
    />
  );
}

function DecorDot({ color, className }: { color: string; className?: string }) {
  return (
    <div
      className={`w-2 h-2 rounded-full absolute ${className || ""}`}
      style={{ backgroundColor: color, opacity: 0.12 }}
    />
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
  const bgTint = `color-mix(in srgb, ${primaryColor} 3%, #FAFAF6)`;
  const cardBg = `color-mix(in srgb, ${primaryColor} 5%, #F5F4F0)`;
  const borderLight = `color-mix(in srgb, ${primaryColor} 15%, transparent)`;

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

  const title = wedding?.title || "Notre mariage";
  const heroTitle = wedding?.config?.texts?.heroTitle || title;
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

  const dressCode = (wedding?.config?.texts as any)?.dressCode || "";

  const dateObj = wedding?.weddingDate ? new Date(wedding.weddingDate) : null;
  const dayName = dateObj ? dateObj.toLocaleDateString("fr-FR", { weekday: "long" }).toUpperCase() : "";
  const dayNum = dateObj ? dateObj.getDate() : "";
  const monthYear = dateObj ? dateObj.toLocaleDateString("fr-FR", { month: "long", year: "numeric" }).toUpperCase() : "";

  const coupleNames = heroTitle.includes(" et ") ? heroTitle.split(" et ") : [heroTitle, ""];

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: bgTint }}>
        <Loader2 className="h-8 w-8 animate-spin" style={{ color: primaryColor }} />
      </div>
    );
  }

  if (error || !guest) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6" style={{ backgroundColor: bgTint }}>
        <div className="text-center space-y-3">
          <p className="text-lg font-serif" style={{ color: textDark }}>Invitation non trouvée</p>
          <p className="text-sm" style={{ color: textSubtle }}>Vérifiez le lien ou contactez les mariés.</p>
        </div>
      </div>
    );
  }

  const isCouple = guest.partySize >= 2;
  const guestDisplayName = isCouple
    ? `${guest.firstName} ${guest.lastName}`
    : guest.firstName;

  return (
    <div className="min-h-screen relative overflow-hidden" style={{ backgroundColor: bgTint, color: textDark }}>

      <DecorDot color={primaryColor} className="top-20 left-[10%]" />
      <DecorDot color={primaryColor} className="top-[40%] right-[8%]" />
      <DecorDot color={primaryColor} className="top-[60%] left-[5%]" />
      <DecorDot color={primaryColor} className="top-[80%] right-[12%]" />

      <section className="min-h-screen flex flex-col items-center justify-center px-6 py-20 relative">
        <div className="w-full max-w-lg mx-auto text-center space-y-6">

          <h2
            className="text-3xl md:text-4xl italic font-light"
            style={{ fontFamily: "'Playfair Display', serif", color: textDark }}
          >
            {guestDisplayName}
          </h2>

          <p className="text-[10px] tracking-[0.35em] uppercase" style={{ color: textSubtle }}>
            vous êtes cordialement invité{isCouple ? "(e)s" : "(e)"}
          </p>

          <p className="text-sm italic font-serif" style={{ color: textSubtle }}>
            au mariage de
          </p>

          <div className="py-2">
            {coupleNames[1] ? (
              <h1 className="leading-[1.1]" style={{ color: textDark }}>
                <span className="text-5xl md:text-7xl font-serif font-bold tracking-tight">{coupleNames[0]}</span>
                <span className="text-4xl md:text-5xl font-serif font-light italic mx-3" style={{ color: primaryColor }}>&</span>
                <span className="text-5xl md:text-7xl font-serif font-bold tracking-tight">{coupleNames[1]}</span>
              </h1>
            ) : (
              <h1 className="text-5xl md:text-7xl font-serif font-bold tracking-tight" style={{ color: textDark }}>
                {heroTitle}
              </h1>
            )}
          </div>

          <Diamond color={primaryColor} size={6} />

          {storyBody && (
            <p className="text-sm md:text-base font-serif leading-relaxed max-w-md mx-auto" style={{ color: textDark }}>
              {storyBody.length > 150 ? storyBody.slice(0, 150) + "…" : storyBody}
            </p>
          )}

          <p className="text-sm font-serif" style={{ color: textSubtle }}>
            Nous vous invitons à partager la célébration de notre mariage.
          </p>

          {dateObj && (
            <div className="pt-8 space-y-2">
              <p className="text-xs tracking-[0.3em] uppercase" style={{ color: primaryColor }}>
                {dayName}
              </p>
              <p className="text-7xl md:text-8xl font-serif font-light leading-none" style={{ color: primaryColor }}>
                {dayNum}
              </p>
              <p className="text-xs tracking-[0.2em] uppercase" style={{ color: primaryColor }}>
                {monthYear}
              </p>
            </div>
          )}

          <div className="pt-8">
            <ChevronDown className="h-6 w-6 mx-auto animate-bounce" style={{ color: textSubtle, opacity: 0.4 }} />
          </div>
        </div>
      </section>

      {programItems.length > 0 && (
        <section className="py-20 px-6 relative">
          <div className="max-w-lg mx-auto">
            <div className="text-center mb-14 space-y-2">
              <h2 className="text-4xl md:text-5xl font-serif font-bold italic" style={{ color: textDark }}>
                Programme
              </h2>
              <p className="text-xs tracking-[0.3em] uppercase" style={{ color: primaryColor }}>
                de la journée
              </p>
            </div>

            <div className="relative">
              <div className="absolute left-1/2 top-0 bottom-0 w-px -translate-x-1/2" style={{ backgroundColor: `color-mix(in srgb, ${primaryColor} 20%, transparent)` }} />

              <div className="space-y-16">
                {programItems.map((item: any, idx: number) => (
                  <div key={idx} className="relative text-center">
                    <div className="absolute left-1/2 -translate-x-1/2 -top-2 z-10">
                      <Diamond color={primaryColor} size={10} />
                    </div>
                    <div className="pt-6 space-y-2">
                      <p className="text-2xl md:text-3xl font-serif font-light" style={{ color: primaryColor }}>
                        {(item.time || "").replace(":", "h")}
                      </p>
                      <h3 className="text-sm tracking-[0.2em] uppercase font-bold" style={{ color: textDark }}>
                        {item.title}
                      </h3>
                      {item.description && (
                        <p className="text-sm font-serif" style={{ color: textSubtle }}>
                          {item.description}
                        </p>
                      )}
                      {item.location && (
                        <p className="text-sm font-serif" style={{ color: textSubtle }}>
                          {item.location}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {locations.length > 0 && programItems.length === 0 && (
        <section className="py-20 px-6 relative">
          <div className="max-w-lg mx-auto">
            <div className="text-center mb-14 space-y-2">
              <h2 className="text-4xl md:text-5xl font-serif font-bold italic" style={{ color: textDark }}>
                Lieux
              </h2>
            </div>
            <div className="relative">
              <div className="absolute left-1/2 top-0 bottom-0 w-px -translate-x-1/2" style={{ backgroundColor: `color-mix(in srgb, ${primaryColor} 20%, transparent)` }} />
              <div className="space-y-16">
                {locations.map((loc: any, idx: number) => (
                  <div key={idx} className="relative text-center">
                    <div className="absolute left-1/2 -translate-x-1/2 -top-2 z-10">
                      <Diamond color={primaryColor} size={10} />
                    </div>
                    <div className="pt-6 space-y-2">
                      <h3 className="text-sm tracking-[0.2em] uppercase font-bold" style={{ color: textDark }}>
                        {loc.title}
                      </h3>
                      {loc.address && (
                        <p className="text-sm font-serif" style={{ color: textSubtle }}>
                          {loc.address}
                        </p>
                      )}
                      {loc.description && (
                        <p className="text-sm font-serif" style={{ color: textSubtle }}>
                          {loc.description}
                        </p>
                      )}
                      {loc.address && (
                        <a
                          href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(loc.address)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 text-[10px] tracking-[0.2em] uppercase font-semibold hover:opacity-80"
                          style={{ color: primaryColor }}
                        >
                          <MapPin className="h-3 w-3" />
                          Voir sur Google Maps
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {programItems.length > 0 && locations.length > 0 && (
        <section className="py-10 px-6">
          <div className="max-w-lg mx-auto space-y-6">
            {locations.map((loc: any, idx: number) => (
              <div key={idx} className="text-center space-y-2">
                <h3 className="text-sm tracking-[0.2em] uppercase font-bold" style={{ color: textDark }}>
                  {loc.title}
                </h3>
                {loc.address && (
                  <p className="text-sm font-serif" style={{ color: textSubtle }}>{loc.address}</p>
                )}
                {loc.address && (
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(loc.address)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-[10px] tracking-[0.2em] uppercase font-semibold hover:opacity-80"
                    style={{ color: primaryColor }}
                  >
                    <MapPin className="h-3 w-3" />
                    Voir sur Google Maps
                  </a>
                )}

                {loc.accommodations && loc.accommodations.length > 0 && (
                  <div className="pt-2 space-y-1">
                    <div className="flex items-center justify-center gap-1.5">
                      <Bed className="h-3 w-3" style={{ color: primaryColor }} />
                      <span className="text-[10px] tracking-[0.15em] uppercase font-semibold" style={{ color: textSubtle }}>Hébergement</span>
                    </div>
                    {loc.accommodations.map((acc: any, accIdx: number) => (
                      <p key={accIdx} className="text-xs font-serif" style={{ color: textSubtle }}>
                        {acc.name}{acc.address ? ` — ${acc.address}` : ""}
                        {acc.url && (
                          <a href={acc.url} target="_blank" rel="noopener noreferrer" className="ml-1" style={{ color: primaryColor }}>
                            <ExternalLink className="h-2.5 w-2.5 inline" />
                          </a>
                        )}
                      </p>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="py-16 px-6 text-center relative">
        <OrnamentDivider color={primaryColor} />
        <div className="max-w-md mx-auto space-y-3 py-4">
          <p className="text-base md:text-lg font-serif italic leading-relaxed" style={{ color: textDark }}>
            Nous nous réjouissons de partager ce moment avec vous.
          </p>
          <p className="text-sm font-serif italic" style={{ color: textSubtle }}>
            Apportez votre bonne humeur, préparez vos plus beaux pas de danse.
          </p>
        </div>
        <OrnamentDivider color={primaryColor} />
      </section>

      {dressCode && (
        <section className="py-10 px-6">
          <div className="max-w-md mx-auto">
            <div
              className="rounded-xl p-8 text-center space-y-3"
              style={{ backgroundColor: cardBg, border: `1px solid ${borderLight}` }}
            >
              <h3 className="text-2xl md:text-3xl font-serif font-bold" style={{ color: textDark }}>
                Dress Code
              </h3>
              <p className="text-xs tracking-[0.2em] uppercase" style={{ color: primaryColor }}>
                Tenue exigée
              </p>
              <p className="text-sm font-serif" style={{ color: textDark }}>
                Tenue : {dressCode}
              </p>
            </div>
          </div>
        </section>
      )}

      {cagnotteHref && (
        <section className="py-16 px-6">
          <div className="max-w-md mx-auto text-center space-y-6">
            <h2 className="text-3xl md:text-4xl font-serif font-bold italic" style={{ color: textDark }}>
              {cagnotteTitle}
            </h2>
            <p className="text-xs tracking-[0.2em] uppercase" style={{ color: primaryColor }}>
              Notre cagnotte
            </p>
            <p className="text-sm font-serif leading-relaxed" style={{ color: textSubtle }}>
              {cagnotteDescription}
            </p>
            <a
              href={cagnotteHref}
              target={cagnotteMode === "external" ? "_blank" : undefined}
              rel={cagnotteMode === "external" ? "noopener noreferrer" : undefined}
              className="inline-flex items-center gap-2 px-10 py-3.5 text-[10px] tracking-[0.25em] uppercase font-bold text-white transition-all hover:opacity-90 rounded-sm"
              style={{ backgroundColor: primaryColor }}
            >
              <Gift className="h-3.5 w-3.5" />
              Participer
            </a>
          </div>
        </section>
      )}

      <OrnamentDivider color={primaryColor} />

      <section className="py-10 px-6 text-center">
        <p className="text-sm font-serif" style={{ color: textSubtle }}>
          Pour des raisons d'organisation, nous vous remercions de ne pas inviter de personnes supplémentaires.
        </p>
      </section>

      <OrnamentDivider color={primaryColor} />

      {couplePhoto && (
        <section className="py-10 px-6 flex justify-center">
          <img
            src={couplePhoto}
            alt={heroTitle}
            className="max-w-xs w-full rounded-2xl object-cover shadow-lg"
            style={{ border: `1px solid ${borderLight}` }}
          />
        </section>
      )}

      {qrDataUrl && (
        <section className="py-10 px-6">
          <div className="max-w-md mx-auto text-center space-y-3">
            <div className="inline-block p-5 rounded-xl" style={{ backgroundColor: cardBg, border: `1px solid ${borderLight}` }}>
              <img src={qrDataUrl} alt="QR code invitation" className="h-24 w-24 mx-auto" />
            </div>
            <p className="text-[10px] tracking-[0.15em] uppercase" style={{ color: textSubtle }}>
              Scannez pour ouvrir votre invitation
            </p>
          </div>
        </section>
      )}

      <footer className="py-8 px-6 text-center">
        <p className="text-[10px] tracking-[0.12em] uppercase" style={{ color: textSubtle, opacity: 0.5 }}>
          {heroTitle}
        </p>
      </footer>
    </div>
  );
}
