import { useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { Loader2, MapPin, Gift, ExternalLink, Bed } from "lucide-react";
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
    <svg viewBox="0 0 200 24" className="w-28 h-5 mx-auto" fill="none" stroke={color} strokeWidth="1" opacity={0.4}>
      <line x1="0" y1="12" x2="80" y2="12" />
      <circle cx="100" cy="12" r="3" fill={color} />
      <line x1="120" y1="12" x2="200" y2="12" />
    </svg>
  );
}

function WineGlasses({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 48 48" className="w-10 h-10 mx-auto" fill="none" stroke={color} strokeWidth="1.2" opacity={0.35}>
      <path d="M16 8 C16 8 12 18 12 22 C12 26 16 28 18 28 L18 38" />
      <path d="M32 8 C32 8 36 18 36 22 C36 26 32 28 30 28 L30 38" />
      <line x1="14" y1="38" x2="22" y2="38" />
      <line x1="26" y1="38" x2="34" y2="38" />
      <path d="M18 24 Q24 30 30 24" strokeDasharray="2 2" />
    </svg>
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
  const bgTint = `color-mix(in srgb, ${primaryColor} 3%, white)`;
  const cardBg = `color-mix(in srgb, ${primaryColor} 4%, #FAFAF8)`;
  const borderLight = `color-mix(in srgb, ${primaryColor} 12%, transparent)`;

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
  const heroTitle = wedding?.config?.texts?.heroTitle || title;
  const couplePhoto = wedding?.config?.media?.couplePhoto || "";
  const logoUrl = wedding?.config?.branding?.logoUrl || "";
  const programItems = wedding?.config?.sections?.programItems || [];
  const locations = wedding?.config?.sections?.locationItems || [];
  const cagnotteExternalUrl = (wedding?.config?.payments?.externalUrl || (wedding?.config?.sections as any)?.cagnotteExternalUrl || "") as string;
  const cagnotteTitle = (wedding?.config?.texts as any)?.cagnotteTitle || "Cadeau de Mariage";
  const cagnotteDescription = (wedding?.config?.texts as any)?.cagnotteDescription || "Votre présence est notre plus beau cadeau. Si vous souhaitez nous gâter, nous préférons une participation à notre cagnotte.";
  const cagnotteMode = wedding?.config?.payments?.mode || (cagnotteExternalUrl ? "external" : "stripe");
  const weddingSlug = (wedding as any)?.slug || "";
  const basePath = weddingSlug ? `/${weddingSlug}` : "/";
  const cagnotteHref = cagnotteMode === "external" ? cagnotteExternalUrl : `${basePath}#cagnotte`;

  const dateObj = wedding?.weddingDate ? new Date(wedding.weddingDate) : null;
  const monthName = dateObj ? dateObj.toLocaleDateString("fr-FR", { month: "long" }).toUpperCase() : "";
  const dayName = dateObj ? dateObj.toLocaleDateString("fr-FR", { weekday: "long" }).toUpperCase() : "";
  const dayNum = dateObj ? dateObj.getDate() : "";
  const yearStr = dateObj ? dateObj.getFullYear().toString() : "";
  const timeStr = dateObj && (dateObj.getHours() > 0 || dateObj.getMinutes() > 0)
    ? `À ${dateObj.getHours()}H${dateObj.getMinutes() > 0 ? String(dateObj.getMinutes()).padStart(2, "0") : "00"}`
    : "";

  const firstLocation = locations[0];
  const venueText = firstLocation?.title || "";
  const venueAddress = firstLocation?.address || "";

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

  return (
    <div className="min-h-screen" style={{ backgroundColor: bgTint, color: textDark }}>

      <section className="min-h-screen flex flex-col items-center justify-center px-6 py-16 relative">
        <div className="w-full max-w-md mx-auto text-center space-y-6">

          {logoUrl || couplePhoto ? (
            <div className="flex justify-center mb-2">
              <div className="w-20 h-20 rounded-full overflow-hidden border-2 shadow-sm" style={{ borderColor: borderLight }}>
                <img src={logoUrl || couplePhoto} alt="" className="w-full h-full object-cover" />
              </div>
            </div>
          ) : null}

          <p className="text-[11px] tracking-[0.35em] uppercase font-light" style={{ color: textSubtle }}>
            Pour célébrer le mariage de
          </p>

          <h1 className="font-serif font-bold tracking-tight leading-[0.95]" style={{
            color: textDark,
            fontSize: "clamp(2.5rem, 10vw, 4.5rem)",
          }}>
            {heroTitle.split(" et ").length === 2 ? (
              <>
                {heroTitle.split(" et ")[0]}
                <span className="block text-[0.45em] font-light tracking-[0.15em] my-2" style={{ color: textSubtle }}>&</span>
                {heroTitle.split(" et ")[1]}
              </>
            ) : heroTitle}
          </h1>

          <OrnamentDivider color={primaryColor} />

          <p className="text-[10px] tracking-[0.3em] uppercase" style={{ color: textSubtle }}>
            Vous invitent à célébrer
          </p>

          <h2 className="text-5xl md:text-6xl font-serif font-light tracking-[0.08em] uppercase" style={{ color: primaryColor }}>
            Mariage
          </h2>

          <p className="text-sm italic font-serif" style={{ color: textSubtle }}>
            deux cœurs, un amour, un jour inoubliable
          </p>

          {dateObj && (
            <div className="pt-6 space-y-3">
              <p className="text-lg md:text-xl font-serif font-bold tracking-[0.15em] uppercase" style={{ color: textDark }}>
                {monthName}
              </p>

              <div className="flex items-center justify-center gap-6">
                <div className="text-right flex-1">
                  <p className="text-xs tracking-[0.2em] uppercase" style={{ color: textSubtle }}>{dayName}</p>
                </div>
                <div className="relative">
                  <span className="text-7xl md:text-8xl font-serif font-light leading-none" style={{ color: primaryColor }}>
                    {dayNum}
                  </span>
                </div>
                <div className="text-left flex-1">
                  <p className="text-xs tracking-[0.2em] uppercase" style={{ color: textSubtle }}>{timeStr || yearStr}</p>
                </div>
              </div>

              <p className="text-sm tracking-[0.15em] uppercase" style={{ color: textDark }}>
                {yearStr}
              </p>
            </div>
          )}

          {venueText && (
            <div className="pt-4 space-y-1">
              <p className="text-sm font-serif font-semibold tracking-wide uppercase" style={{ color: textDark }}>
                {venueText}
              </p>
              {venueAddress && (
                <p className="text-xs tracking-wide uppercase" style={{ color: textSubtle }}>
                  {venueAddress}
                </p>
              )}
            </div>
          )}

          <div className="pt-6">
            <WineGlasses color={primaryColor} />
          </div>
        </div>
      </section>

      <section className="py-10 px-6">
        <div className="max-w-md mx-auto text-center space-y-2">
          <p className="text-[10px] tracking-[0.3em] uppercase" style={{ color: textSubtle }}>
            {guest.firstName}, nous vous invitons
          </p>
          <OrnamentDivider color={primaryColor} />
        </div>
      </section>

      {locations.length > 0 && (
        <section className="py-10 px-6">
          <div className="max-w-md mx-auto space-y-6">
            {locations.map((loc: any, idx: number) => (
              <div
                key={idx}
                className="rounded-xl p-6 text-center space-y-3"
                style={{
                  backgroundColor: cardBg,
                  border: `1px solid ${borderLight}`,
                }}
              >
                <h3 className="text-xs tracking-[0.3em] uppercase font-bold" style={{ color: textDark }}>
                  {loc.title}
                </h3>
                <div className="w-8 h-px mx-auto" style={{ backgroundColor: primaryColor, opacity: 0.3 }} />
                {loc.description && (
                  <p className="text-xs leading-relaxed uppercase tracking-wide" style={{ color: textSubtle }}>
                    {loc.description}
                  </p>
                )}
                {loc.address && (
                  <p className="text-xs uppercase tracking-wide" style={{ color: textSubtle }}>
                    {loc.address}
                  </p>
                )}
                {loc.address && (
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(loc.address)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-[10px] tracking-[0.2em] uppercase font-semibold hover:opacity-80 transition-opacity"
                    style={{ color: primaryColor }}
                  >
                    <MapPin className="h-3 w-3" />
                    Itinéraire
                  </a>
                )}

                {loc.accommodations && loc.accommodations.length > 0 && (
                  <div className="pt-3 border-t space-y-2" style={{ borderColor: borderLight }}>
                    <div className="flex items-center justify-center gap-1.5">
                      <Bed className="h-3 w-3" style={{ color: primaryColor }} />
                      <span className="text-[10px] tracking-[0.2em] uppercase font-semibold" style={{ color: textDark }}>Hébergement</span>
                    </div>
                    {loc.accommodations.map((acc: any, accIdx: number) => (
                      <div key={accIdx} className="text-xs" style={{ color: textSubtle }}>
                        <span className="font-medium" style={{ color: textDark }}>{acc.name}</span>
                        {acc.address && <span> — {acc.address}</span>}
                        {acc.url && (
                          <a
                            href={acc.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="ml-1 inline-flex items-center gap-0.5 hover:opacity-80"
                            style={{ color: primaryColor }}
                          >
                            <ExternalLink className="h-2.5 w-2.5" />
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {programItems.length > 0 && (
        <section className="py-10 px-6">
          <div className="max-w-md mx-auto">
            <div
              className="rounded-xl p-6 space-y-4"
              style={{
                backgroundColor: cardBg,
                border: `1px solid ${borderLight}`,
              }}
            >
              <h3 className="text-xs tracking-[0.3em] uppercase font-bold text-center" style={{ color: textDark }}>
                Programme
              </h3>
              <div className="w-8 h-px mx-auto" style={{ backgroundColor: primaryColor, opacity: 0.3 }} />

              <div className="space-y-4">
                {programItems.map((item: any, idx: number) => (
                  <div key={idx} className="flex items-start gap-4">
                    <span className="text-sm font-serif font-semibold shrink-0 w-14 text-right" style={{ color: primaryColor }}>
                      {item.time}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs uppercase tracking-wide font-semibold" style={{ color: textDark }}>
                        {item.title}
                      </p>
                      {item.description && (
                        <p className="text-xs mt-0.5" style={{ color: textSubtle }}>{item.description}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {cagnotteHref && (
        <section className="py-10 px-6">
          <div className="max-w-md mx-auto">
            <div
              className="rounded-xl p-6 text-center space-y-4"
              style={{
                backgroundColor: cardBg,
                border: `1px solid ${borderLight}`,
              }}
            >
              <div className="w-12 h-12 mx-auto rounded-full flex items-center justify-center" style={{ backgroundColor: `color-mix(in srgb, ${primaryColor} 10%, transparent)` }}>
                <Gift className="h-5 w-5" style={{ color: primaryColor }} />
              </div>
              <h3 className="text-xs tracking-[0.3em] uppercase font-bold" style={{ color: textDark }}>
                {cagnotteTitle}
              </h3>
              <div className="w-8 h-px mx-auto" style={{ backgroundColor: primaryColor, opacity: 0.3 }} />
              <p className="text-xs leading-relaxed uppercase tracking-wide" style={{ color: textSubtle }}>
                {cagnotteDescription}
              </p>
              <a
                href={cagnotteHref}
                target={cagnotteMode === "external" ? "_blank" : undefined}
                rel={cagnotteMode === "external" ? "noopener noreferrer" : undefined}
                className="inline-block px-8 py-3 text-[10px] tracking-[0.25em] uppercase font-bold text-white transition-all hover:opacity-90 rounded-sm"
                style={{ backgroundColor: primaryColor }}
              >
                Cagnotte
              </a>
            </div>
          </div>
        </section>
      )}

      {qrDataUrl && (
        <section className="py-10 px-6">
          <div className="max-w-md mx-auto text-center space-y-3">
            <div className="inline-block p-5 rounded-xl" style={{ backgroundColor: cardBg, border: `1px solid ${borderLight}` }}>
              <img src={qrDataUrl} alt="QR code invitation" className="h-28 w-28 mx-auto" />
            </div>
            <p className="text-[10px] tracking-[0.15em] uppercase" style={{ color: textSubtle }}>
              Scannez pour ouvrir votre invitation
            </p>
          </div>
        </section>
      )}

      <section className="py-10 px-6 text-center">
        <div className="max-w-sm mx-auto space-y-4">
          <OrnamentDivider color={primaryColor} />
          <p className="text-sm font-serif italic leading-relaxed" style={{ color: textDark }}>
            Nous nous réjouissons de partager ce jour avec vous.
          </p>
          <p className="text-[10px] tracking-[0.2em] uppercase" style={{ color: textSubtle }}>
            Avec tout notre amour
          </p>
          <OrnamentDivider color={primaryColor} />
        </div>
      </section>

      <footer className="py-8 px-6 text-center">
        <p className="text-[10px] tracking-[0.15em] uppercase" style={{ color: textSubtle, opacity: 0.5 }}>
          {heroTitle}
        </p>
      </footer>
    </div>
  );
}
