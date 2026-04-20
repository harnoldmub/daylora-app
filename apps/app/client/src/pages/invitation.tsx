import { useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState, useRef } from "react";
import { Loader2, MapPin, Gift, ExternalLink, Bed, ChevronDown, Heart, Sparkles, Clock, CheckCircle2, Users, ArrowRight } from "lucide-react";
import QRCodeLib from "qrcode";
import { getSiteLanguagePack } from "@/lib/site-language";

type GuestData = {
  id: number;
  weddingId: string;
  firstName: string;
  lastName: string;
  availability: string;
  partySize: number;
  tableNumber?: number | null;
  invitationTypeId?: string | null;
  assignedTableId?: string | null;
  allowedOptionIds?: string[];
  confirmedAt?: string | null;
  status?: string;
  resolvedContext?: {
    invitationType?: { id: string; label: string } | null;
    allowedSegments?: Array<{ id: string; label: string; time?: string; venueLabel?: string; venueAddress?: string; description?: string }>;
    allowedOptions?: Array<{ id: string; label: string; time?: string; venueLabel?: string; venueAddress?: string; priceCents?: number | null }>;
    assignedTable?: { id?: string | null; name?: string; number?: number | null; category?: string | null } | null;
  } | null;
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

function useInView(ref: React.RefObject<HTMLElement | null>) {
  const [isInView, setIsInView] = useState(false);
  useEffect(() => {
    if (!ref.current) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setIsInView(true); },
      { threshold: 0.1 }
    );
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, [ref]);
  return isInView;
}

function FadeIn({ children, className, style, delay = 0 }: {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  delay?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref);
  return (
    <div
      ref={ref}
      className={className}
      style={{
        ...style,
        opacity: isInView ? 1 : 0,
        transform: isInView ? "translateY(0)" : "translateY(20px)",
        transition: `opacity 0.8s ease ${delay}s, transform 0.8s ease ${delay}s`,
      }}
    >
      {children}
    </div>
  );
}

// ─── Shared data shape ────────────────────────────────────────────────────────

type InvitationProps = {
  guest: GuestData;
  wedding: any;
  primaryColor: string;
  secondaryColor: string;
  qrDataUrl: string;
  basePath: string;
  checkInHref: string;
  ui: Record<string, string>;
  languagePack: ReturnType<typeof getSiteLanguagePack>;
  texts: any;
  sections: any;
  media: any;
  payments: any;
  brandingConfig: any;
};

function InvitationRomantic({ guest, wedding, primaryColor, secondaryColor, qrDataUrl, basePath, checkInHref, ui, languagePack, texts, sections, media, payments, brandingConfig }: InvitationProps) {
  const primaryHSL = hexToHSL(primaryColor);
  const darkL = Math.max(primaryHSL.l - 35, 10);
  const subtleL = Math.min(primaryHSL.l + 10, 55);
  // Use secondaryColor from props
  const secondaryHSL = hexToHSL(secondaryColor);
  const isDarkBg = secondaryHSL.l < 50;

  const textDark = isDarkBg 
    ? `hsl(${primaryHSL.h}, ${Math.min(primaryHSL.s, 20)}%, 95%)`
    : `hsl(${primaryHSL.h}, ${Math.min(primaryHSL.s, 30)}%, ${darkL}%)`;
  const textSubtle = isDarkBg
    ? `hsl(${primaryHSL.h}, ${Math.min(primaryHSL.s, 15)}%, 80%)`
    : `hsl(${primaryHSL.h}, ${Math.min(primaryHSL.s, 25)}%, ${subtleL}%)`;
  const bgBase = `color-mix(in srgb, ${primaryColor} 4%, ${secondaryColor})`;
  const cardBg = `color-mix(in srgb, ${primaryColor} 10%, ${secondaryColor})`;
  const borderLight = `color-mix(in srgb, ${primaryColor} 18%, transparent)`;
  const borderMedium = `color-mix(in srgb, ${primaryColor} 30%, transparent)`;

  const heroTitle = texts.heroTitle || wedding.title || "";
  const logoUrl = brandingConfig.logoUrl || "";
  const couplePhoto = media.invitationImage || media.couplePhoto || "";
  const storyBody = texts.storyBody || "";
  const guestContext = ((wedding as any)?.guestContext || guest?.resolvedContext || {}) as any;
  const programItems = (guestContext.allowedSegments?.length ? guestContext.allowedSegments : sections.programItems || []) as any[];
  const locations = sections.locationItems || [];
  const allowedOptions = (guestContext.allowedOptions || []) as any[];
  const assignedTable = guestContext.assignedTable || null;
  const invitationTypeLabel = guestContext.invitationType?.label || null;
  const cagnotteExternalUrl = (payments.externalUrl || sections.cagnotteExternalUrl || "") as string;
  const cagnotteMode = payments.mode || (cagnotteExternalUrl ? "external" : "stripe");
  const cagnotteHref = cagnotteMode === "external" && cagnotteExternalUrl ? cagnotteExternalUrl : `${basePath}#cagnotte`;

  const invGreeting = texts.invitationGreeting || languagePack.texts.invitationGreeting;
  const invPrelude = texts.invitationPrelude || languagePack.texts.invitationPrelude;
  const invMessage = texts.invitationMessage || languagePack.texts.invitationMessage;
  const invSubmessage = texts.invitationSubmessage || languagePack.texts.invitationSubmessage;
  const invCagnotteTitle = texts.invitationCagnotteTitle || texts.cagnotteTitle || languagePack.texts.invitationCagnotteTitle;
  const invCagnotteDesc = texts.invitationCagnotteDescription || texts.cagnotteDescription || languagePack.texts.invitationCagnotteDescription;
  const invCagnotteButton = texts.invitationCagnotteButton || languagePack.texts.invitationCagnotteButton;
  const invDressCode = texts.invitationDressCode || texts.dressCode || "";

  const invBtnShadow = `color-mix(in srgb, ${primaryColor} 40%, transparent)`;

  const showProgramme = sections.invitationShowProgramme ?? true;
  const showLocations = sections.invitationShowLocations ?? true;
  const showDressCode = sections.invitationShowDressCode ?? true;
  const showCagnotte = sections.invitationShowCagnotte ?? true;
  const showQrCode = sections.invitationShowQrCode ?? true;

  const dateObj = wedding?.weddingDate ? new Date(wedding.weddingDate) : null;
  const dayName = dateObj ? dateObj.toLocaleDateString(languagePack.locale, { weekday: "long" }) : "";
  const dayNum = dateObj ? dateObj.getDate() : "";
  const monthName = dateObj ? dateObj.toLocaleDateString(languagePack.locale, { month: "long" }) : "";
  const yearNum = dateObj ? dateObj.getFullYear() : "";
  const coupleNames = heroTitle.includes(" et ") ? heroTitle.split(" et ") : heroTitle.includes(" & ") ? heroTitle.split(" & ") : [heroTitle, ""];
  const isConfirmed = guest.availability === "confirmed" || guest.status === "confirmed";
  const isDeclined = guest.availability === "declined" || guest.status === "declined";
  const isCouple = guest.partySize >= 2;
  const guestDisplayName = isCouple ? `${guest.firstName} ${guest.lastName}` : guest.firstName;

  const weddingSlug = (wedding as any)?.slug || "";

  // Helper for ornamental foliage
  const FoliageOrnament = ({ className, style }: { className?: string; style?: React.CSSProperties }) => (
    <svg width="120" height="120" viewBox="0 0 120 120" fill="none" className={className} style={style}>
      <path d="M10 110Q30 90 30 50T70 10" stroke={primaryColor} strokeWidth="0.5" strokeOpacity="0.4" />
      <path d="M30 70Q40 65 45 55" stroke={primaryColor} strokeWidth="0.5" strokeOpacity="0.3" />
      <path d="M30 70C25 60 20 65 15 55" stroke={primaryColor} strokeWidth="0.5" strokeOpacity="0.3" />
      <path d="M45 40Q55 35 60 25" stroke={primaryColor} strokeWidth="0.5" strokeOpacity="0.3" />
      <circle cx="30" cy="50" r="1.5" fill={primaryColor} fillOpacity="0.2" />
      <circle cx="70" cy="10" r="1" fill={primaryColor} fillOpacity="0.2" />
    </svg>
  );

  return (
    <div className="min-h-screen relative" style={{ backgroundColor: bgBase, color: textDark }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;1,300;1,400&family=Playfair+Display:ital,wght@0,400;0,500;1,400&family=Birthstone&display=swap');
        .inv-serif { font-family: 'Cormorant Garamond', Georgia, serif; }
        .inv-display { font-family: 'Playfair Display', 'Cormorant Garamond', Georgia, serif; }
        .inv-script { font-family: 'Birthstone', cursive; }
        @keyframes inv-fade { from { opacity:0; transform:translateY(18px); } to { opacity:1; transform:translateY(0); } }
        .ia0 { animation: inv-fade 1.2s ease forwards; }
        .ia1 { animation: inv-fade 1.2s ease 0.2s forwards; opacity:0; }
        .ia2 { animation: inv-fade 1.2s ease 0.4s forwards; opacity:0; }
        .ia3 { animation: inv-fade 1.2s ease 0.6s forwards; opacity:0; }
        .ia4 { animation: inv-fade 1.2s ease 0.8s forwards; opacity:0; }
        .ia5 { animation: inv-fade 1.2s ease 1s forwards; opacity:0; }
        @keyframes inv-float { 0%,100%{transform:translateY(0) rotate(0deg)} 50%{transform:translateY(-8px) rotate(1deg)} }
        .inv-float { animation: inv-float 5s ease-in-out infinite; }
        @keyframes ornament-float { 0%,100%{opacity:0.6; transform:scale(1)} 50%{opacity:0.8; transform:scale(1.05)} }
        .ornament-anim { animation: ornament-float 6s ease-in-out infinite; }
      `}</style>

      {/* Hero */}
      <section className="min-h-[100dvh] flex flex-col items-center justify-center px-6 py-20 relative overflow-hidden">
        {/* Corner Ornaments */}
        <FoliageOrnament className="absolute top-0 left-0 ornament-anim" style={{ transform: "none" }} />
        <FoliageOrnament className="absolute top-0 right-0 ornament-anim" style={{ transform: "scaleX(-1)" }} />
        <FoliageOrnament className="absolute bottom-0 left-0 ornament-anim" style={{ transform: "scaleY(-1)" }} />
        <FoliageOrnament className="absolute bottom-0 right-0 ornament-anim" style={{ transform: "scale(-1, -1)" }} />

        <div className="w-full max-w-lg mx-auto text-center space-y-12 relative z-10">
          {logoUrl && (
            <div className="ia0">
              <img src={logoUrl} alt="" className="mx-auto h-24 w-24 object-contain rounded-full backdrop-blur-sm p-4 shadow-sm" style={{ backgroundColor: `color-mix(in srgb, ${secondaryColor} 30%, white)` }} />
            </div>
          )}

          <div className="ia1 space-y-3">
            <p className="text-[11px] tracking-[0.5em] uppercase inv-serif font-medium" style={{ color: textSubtle }}>
              {invGreeting}{isCouple ? "s" : ""}
            </p>
            <h2 className="text-3xl md:text-5xl inv-script" style={{ color: primaryColor }}>
              {guestDisplayName}
            </h2>
            {isCouple && guest.partySize > 1 && (
              <p className="text-xs inv-serif tracking-[0.2em] flex items-center justify-center gap-2" style={{ color: textSubtle, opacity: 0.7 }}>
                <span className="w-8 h-px bg-current opacity-20" />
                {guest.partySize} {guest.partySize > 1 ? languagePack.invitation.people : languagePack.invitation.person}
                <span className="w-8 h-px bg-current opacity-20" />
              </p>
            )}
          </div>

          <div className="ia2 py-2">
            <p className="text-sm tracking-[0.4em] uppercase inv-serif italic" style={{ color: textSubtle }}>
              {invPrelude}
            </p>
          </div>

          <div className="ia3 py-4 flex flex-col items-center">
            {coupleNames[1] ? (
              <div className="space-y-4">
                <h1 className="text-5xl sm:text-7xl inv-display font-light tracking-tight" style={{ color: textDark }}>{coupleNames[0].trim()}</h1>
                <div className="flex items-center justify-center gap-6 py-2">
                  <div className="w-16 h-px" style={{ backgroundColor: primaryColor, opacity: 0.2 }} />
                  <span className="text-4xl inv-script italic leading-none" style={{ color: primaryColor }}>&</span>
                  <div className="w-16 h-px" style={{ backgroundColor: primaryColor, opacity: 0.2 }} />
                </div>
                <h1 className="text-5xl sm:text-7xl inv-display font-light tracking-tight" style={{ color: textDark }}>{coupleNames[1].trim()}</h1>
              </div>
            ) : (
              <h1 className="text-5xl sm:text-7xl inv-display font-light" style={{ color: textDark }}>{heroTitle}</h1>
            )}
          </div>

          {dateObj && (
            <div className="ia4 pt-6">
              <div className="inline-block relative">
                <div className="absolute -inset-6 rounded-full border border-dashed animate-spin-slow" style={{ animationDuration: "20s", borderColor: `color-mix(in srgb, ${primaryColor} 10%, transparent)` }} />
                <div className="px-12 py-10 rounded-full relative flex flex-col items-center justify-center space-y-1" style={{ border: `1px solid ${borderMedium}`, background: `color-mix(in srgb, ${secondaryColor} 20%, transparent)` }}>
                  <p className="text-[10px] tracking-[0.5em] uppercase inv-serif font-bold" style={{ color: primaryColor }}>{dayName}</p>
                  <p className="text-6xl inv-display font-extra-light leading-none" style={{ color: primaryColor }}>{dayNum}</p>
                  <p className="text-[10px] tracking-[0.4em] uppercase inv-serif font-bold" style={{ color: primaryColor }}>{monthName} {yearNum}</p>
                </div>
              </div>
            </div>
          )}

          <div className="ia5 pt-8">
            <ChevronDown className="h-6 w-6 mx-auto inv-float stroke-[1.5px]" style={{ color: primaryColor, opacity: 0.5 }} />
          </div>
        </div>
      </section>

      {/* Message & Photo Section */}
      <section className="py-24 px-6 relative">
      {couplePhoto && (
        <FadeIn className="mb-20 flex justify-center">
          <div className="relative max-w-md w-full">
            <div className="absolute -inset-4 rounded-3xl" style={{ border: `1px solid ${borderLight}` }} />
            <div className="absolute -top-6 -right-6 w-24 h-24 opacity-30">
               <FoliageOrnament className="w-full h-full" style={{ transform: "rotate(45deg)" }} />
            </div>
            <img src={couplePhoto} alt={heroTitle} className="w-full aspect-[4/5] object-cover rounded-2xl shadow-xl relative z-10" style={{ border: `1px solid ${borderMedium}` }} />
            <div className="absolute -bottom-6 -left-6 w-24 h-24 opacity-30 transform scale-x-[-1]">
               <FoliageOrnament className="w-full h-full" style={{ transform: "rotate(-45deg)" }} />
            </div>
          </div>
        </FadeIn>
      )}

      <FadeIn className="text-center max-w-2xl mx-auto space-y-8">
        <div className="flex items-center justify-center gap-8">
          <div className="h-px flex-1" style={{ backgroundColor: `color-mix(in srgb, ${primaryColor} 15%, transparent)` }} />
          <Heart className="h-5 w-5" style={{ color: primaryColor, fill: `color-mix(in srgb, ${primaryColor} 10%, transparent)` }} />
          <div className="h-px flex-1" style={{ backgroundColor: `color-mix(in srgb, ${primaryColor} 15%, transparent)` }} />
        </div>
        <div className="space-y-6">
          <p className="text-2xl md:text-3xl inv-serif italic font-light leading-relaxed px-4" style={{ color: textDark }}>
            “ {invMessage} ”
          </p>
          {invSubmessage && (
            <p className="text-base inv-serif tracking-wide px-8 opacity-80" style={{ color: textSubtle }}>
              {invSubmessage}
            </p>
          )}
        </div>
        <div className="flex items-center justify-center gap-8">
          <div className="h-px flex-1" style={{ backgroundColor: `color-mix(in srgb, ${primaryColor} 15%, transparent)` }} />
          <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: `color-mix(in srgb, ${primaryColor} 30%, transparent)` }} />
          <div className="h-px flex-1" style={{ backgroundColor: `color-mix(in srgb, ${primaryColor} 15%, transparent)` }} />
        </div>
      </FadeIn>
      </section>

      {/* Programme */}
      {showProgramme && programItems.length > 0 && (
        <section className="py-24 px-6" style={{ backgroundColor: cardBg }}>
          <FadeIn className="max-w-xl mx-auto">
            <div className="text-center mb-16 space-y-4">
              <p className="text-[11px] tracking-[0.6em] uppercase inv-serif font-bold" style={{ color: primaryColor }}>{ui.scheduleIntro}</p>
              <h2 className="text-5xl inv-script" style={{ color: textDark }}>{ui.scheduleTitle}</h2>
              <div className="w-12 h-0.5 mx-auto rounded-full" style={{ backgroundColor: `${primaryColor}30` }} />

            </div>
            <div className="relative">
              <div className="absolute left-[23px] md:left-1/2 top-0 bottom-0 w-px -translate-x-px" style={{ background: `linear-gradient(to bottom, transparent, color-mix(in srgb, ${primaryColor} 40%, transparent), color-mix(in srgb, ${primaryColor} 40%, transparent), transparent)` }} />
              <div className="space-y-4">
                {programItems.map((item: any, idx: number) => {
                  const isRight = idx % 2 === 1;
                  return (
                    <FadeIn key={idx} delay={idx * 0.1}>
                      <div className={`relative flex items-start gap-10 py-8 ${isRight ? "md:flex-row-reverse" : ""}`}>
                        <div className="absolute left-[23px] md:left-1/2 top-10 -translate-x-1/2 z-10">
                          <div className="w-12 h-12 rounded-full flex items-center justify-center shadow-sm" style={{ backgroundColor: bgBase, border: `1px solid ${borderMedium}` }}>
                            <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: primaryColor }} />
                          </div>
                        </div>
                        <div className="hidden md:block md:w-[calc(50%-24px)]" />
                        <div className={`flex-1 pl-16 md:pl-0 ${isRight ? "md:pr-12 md:text-right" : "md:pl-12"}`}>
                          <p className="text-2xl inv-display font-light mb-1" style={{ color: primaryColor }}>{(item.time || "").replace(":", "h")}</p>
                          <h3 className="text-[13px] tracking-[0.2em] uppercase font-bold mb-2" style={{ color: textDark }}>{item.title}</h3>
                          {item.description && <p className="text-sm inv-serif leading-relaxed" style={{ color: textSubtle }}>{item.description}</p>}
                          {(item.location || item.venueLabel) && (
                            <p className="text-xs inv-serif italic mt-3 flex items-center gap-2" style={{ color: textSubtle, ...(isRight ? { justifyContent: "flex-end" } : {}) }}>
                              <MapPin className="h-3 w-3 shrink-0" style={{ color: primaryColor }} />{item.location || item.venueLabel}
                            </p>
                          )}
                        </div>
                      </div>
                    </FadeIn>
                  );
                })}
              </div>
            </div>
          </FadeIn>
        </section>
      )}

      {/* Options & Lieux Combined logic for better layout */}
      <section className="py-24 px-6 space-y-24">
        {/* Lieux */}
        {showLocations && locations.length > 0 && (
          <div className="max-w-4xl mx-auto">
            <FadeIn className="text-center mb-16 space-y-4">
               <p className="text-[11px] tracking-[0.6em] uppercase inv-serif font-bold" style={{ color: primaryColor }}>{ui.locationsIntro}</p>
               <h2 className="text-5xl inv-script" style={{ color: textDark }}>{ui.locationsTitle}</h2>
            </FadeIn>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {locations.map((loc: any, idx: number) => (
                <FadeIn key={idx} delay={idx * 0.15}>
                  <div className="h-full rounded-2xl p-10 text-center space-y-4 relative overflow-hidden transition-all hover:translate-y-[-4px]" style={{ backgroundColor: cardBg, border: `1px solid ${borderMedium}`, boxShadow: `0 10px 30px -10px color-mix(in srgb, ${primaryColor} 5%, transparent)` }}>
                    <div className="w-12 h-12 mx-auto rounded-full flex items-center justify-center backdrop-blur-sm" style={{ backgroundColor: `color-mix(in srgb, ${secondaryColor} 50%, white)`, border: `1px solid ${borderMedium}` }}>
                      <MapPin className="h-5 w-5" style={{ color: primaryColor }} />
                    </div>
                    <h3 className="text-sm tracking-[0.25em] uppercase font-bold" style={{ color: textDark }}>{loc.title}</h3>
                    {loc.address && <p className="text-sm inv-serif leading-relaxed" style={{ color: textSubtle }}>{loc.address}</p>}
                    {loc.description && <p className="text-sm inv-serif italic opacity-80" style={{ color: textSubtle }}>{loc.description}</p>}
                    {loc.address && (
                      <div className="pt-2">
                        <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(loc.address)}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-6 py-2 text-[10px] tracking-[0.2em] uppercase font-bold rounded-full transition-all hover:bg-primary/5" style={{ color: primaryColor, border: `1px solid ${borderMedium}` }}>
                          {ui.directions} <ExternalLink className="h-3 w-3" />
                        </a>
                      </div>
                    )}
                    {loc.accommodations?.length > 0 && (
                      <div className="pt-6 mt-6 space-y-3" style={{ borderTop: `1px solid ${borderMedium}`, borderTopStyle: "dashed" }}>
                        <p className="flex items-center justify-center gap-2 text-[11px] tracking-[0.2em] uppercase font-bold" style={{ color: textSubtle }}>
                          <Bed className="h-4 w-4" style={{ color: primaryColor }} /> {ui.stay}
                        </p>
                        {loc.accommodations.map((acc: any, i: number) => (
                          <p key={i} className="text-xs inv-serif" style={{ color: textSubtle }}>
                            <span className="font-bold" style={{ color: textDark }}>{acc.name}</span>
                            {acc.address && <span> — {acc.address}</span>}
                            {acc.url && <a href={acc.url} target="_blank" rel="noopener noreferrer" className="ml-2 inline-flex items-center text-primary hover:opacity-70"><ExternalLink className="h-3 w-3" /></a>}
                          </p>
                        ))}
                      </div>
                    )}
                  </div>
                </FadeIn>
              ))}
            </div>
          </div>
        )}

        {/* Options */}
        {allowedOptions.length > 0 && (
          <div className="max-w-2xl mx-auto">
            <FadeIn className="text-center mb-12 space-y-4">
              <p className="text-[11px] tracking-[0.6em] uppercase inv-serif font-bold" style={{ color: primaryColor }}>{ui.optionsIntro}</p>
              <h2 className="text-5xl inv-script" style={{ color: textDark }}>{ui.optionsTitle}</h2>
            </FadeIn>
            <div className="space-y-4">
              {allowedOptions.map((option: any, i) => (
                <FadeIn key={option.id} delay={i * 0.1}>
                  <div className="rounded-2xl p-6 text-center space-y-2 border backdrop-blur-sm transition-colors hover:bg-primary/5" style={{ borderColor: `color-mix(in srgb, ${primaryColor} 10%, transparent)`, backgroundColor: `color-mix(in srgb, ${secondaryColor} 10%, transparent)` }}>
                    <p className="text-sm tracking-[0.25em] uppercase font-bold" style={{ color: primaryColor }}>{option.label}</p>
                    <p className="text-[13px] inv-serif italic opacity-70" style={{ color: textSubtle }}>{[option.time, option.venueLabel].filter(Boolean).join(" • ")}</p>
                    {typeof option.priceCents === "number" && <p className="text-xs font-bold inv-serif" style={{ color: textSubtle }}>{(option.priceCents / 100).toFixed(2)} EUR / {languagePack.invitation.person}</p>}
                  </div>
                </FadeIn>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* Dress code & Cagnotte */}
      <section className="py-24 px-6 relative overflow-hidden" style={{ backgroundColor: cardBg }}>
        <FoliageOrnament className="absolute -top-10 left-1/2 -translate-x-1/2 opacity-[0.05] w-64 h-64" style={{ transformOrigin: "center" }} />
        
        <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-16 relative z-10">
          {showDressCode && invDressCode && (
            <FadeIn className="text-center space-y-6 flex flex-col items-center justify-center">
              <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{ backgroundColor: `color-mix(in srgb, ${secondaryColor} 50%, white)`, border: `1px solid ${borderMedium}` }}>
                 <Sparkles className="h-6 w-6" style={{ color: primaryColor }} />
              </div>
              <h3 className="text-xs tracking-[0.3em] uppercase font-bold" style={{ color: textDark }}>{languagePack.language === "en" ? "Dress code" : "Dress Code"}</h3>
              <p className="text-lg inv-serif italic leading-relaxed" style={{ color: textDark }}>{invDressCode}</p>
            </FadeIn>
          )}

          {showCagnotte && cagnotteHref && (
            <FadeIn className="text-center space-y-6 flex flex-col items-center justify-center">
              <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{ backgroundColor: `color-mix(in srgb, ${secondaryColor} 50%, white)`, border: `1px solid ${borderMedium}` }}>
                 <Gift className="h-6 w-6" style={{ color: primaryColor }} />
              </div>
              <h3 className="text-xs tracking-[0.3em] uppercase font-bold" style={{ color: textDark }}>{invCagnotteTitle}</h3>
              <p className="text-sm inv-serif leading-relaxed max-w-sm" style={{ color: textSubtle }}>{invCagnotteDesc}</p>
              <a href={cagnotteHref} target={cagnotteMode === "external" && cagnotteExternalUrl ? "_blank" : undefined} rel={cagnotteMode === "external" && cagnotteExternalUrl ? "noopener noreferrer" : undefined} className="inline-flex items-center gap-3 px-10 py-4 text-[11px] tracking-[0.3em] uppercase font-bold rounded-full transition-all hover:scale-105 active:scale-95 shadow-lg" style={{ backgroundColor: primaryColor, color: secondaryColor, boxShadow: `0 10px 20px -5px ${invBtnShadow}` }}>
                <Gift className="h-4 w-4" /> {invCagnotteButton}
              </a>
            </FadeIn>
          )}
        </div>
      </section>

      {/* Footer / QR */}
      <footer className="py-24 px-6 text-center space-y-12">

        {showQrCode && qrDataUrl && (
          <FadeIn className="space-y-6">
            <div className="inline-block p-8 rounded-[40px] relative transition-transform hover:scale-105" style={{ backgroundColor: "white", border: `1px solid ${borderMedium}`, boxShadow: `0 20px 40px -15px color-mix(in srgb, ${primaryColor} 8%, transparent)` }}>
              <img src={qrDataUrl} alt="QR check-in" className="h-32 w-32 mx-auto mix-blend-multiply" />
              <div className="absolute -inset-2 border-2 rounded-[48px] pointer-events-none" style={{ borderColor: `color-mix(in srgb, ${primaryColor} 5%, transparent)` }} />
            </div>
            <p className="text-[11px] tracking-[0.3em] uppercase inv-serif font-bold" style={{ color: textSubtle }}>
              {languagePack.language === "en" ? "Scan for day-of check-in" : "Scannez pour votre check-in jour J"}
            </p>
          </FadeIn>
        )}

        <div className="pt-16 space-y-6">
          {logoUrl && <img src={logoUrl} alt="" className="mx-auto h-16 w-16 object-contain opacity-50 filter grayscale transition-all hover:grayscale-0 hover:opacity-100" />}
          <p className="text-[11px] tracking-[0.4em] uppercase inv-serif font-bold opacity-30" style={{ color: textSubtle }}>{heroTitle}</p>
        </div>
      </footer>
    </div>
  );
}

// ─── Template B: Modern / Editorial ──────────────────────────────────────────
// Used for: modern, avantgarde, graphik

function InvitationModern({ guest, wedding, primaryColor, secondaryColor, qrDataUrl, basePath, checkInHref, ui, languagePack, texts, sections, media, payments, brandingConfig }: InvitationProps) {
  // Use secondaryColor from props
  const bg = `color-mix(in srgb, ${primaryColor} 2%, ${secondaryColor})`;
  const cardBg = `color-mix(in srgb, ${primaryColor} 6%, ${secondaryColor})`;
  const accent = primaryColor;
  
  const secondaryHSL = hexToHSL(secondaryColor);
  const isDarkBg = secondaryHSL.l < 50;
  const textBase = isDarkBg ? "rgba(255,255,255,0.95)" : "#0A0A0A";
  const textMuted = isDarkBg ? "rgba(255,255,255,0.65)" : "#0A0A0A80";
  const textSubtle = isDarkBg ? "rgba(255,255,255,0.50)" : "#0A0A0A60";

  const heroTitle = texts.heroTitle || wedding.title || "";
  const logoUrl = brandingConfig.logoUrl || "";
  const couplePhoto = media.invitationImage || media.couplePhoto || "";
  const storyBody = texts.storyBody || "";
  const guestContext = ((wedding as any)?.guestContext || guest?.resolvedContext || {}) as any;
  const programItems = (guestContext.allowedSegments?.length ? guestContext.allowedSegments : sections.programItems || []) as any[];
  const locations = sections.locationItems || [];
  const allowedOptions = (guestContext.allowedOptions || []) as any[];
  const assignedTable = guestContext.assignedTable || null;
  const invitationTypeLabel = guestContext.invitationType?.label || null;
  const cagnotteExternalUrl = (payments.externalUrl || sections.cagnotteExternalUrl || "") as string;
  const cagnotteMode = payments.mode || (cagnotteExternalUrl ? "external" : "stripe");
  const cagnotteHref = cagnotteMode === "external" && cagnotteExternalUrl ? cagnotteExternalUrl : `${basePath}#cagnotte`;

  const invGreeting = texts.invitationGreeting || languagePack.texts.invitationGreeting;
  const invPrelude = texts.invitationPrelude || languagePack.texts.invitationPrelude;
  const invMessage = texts.invitationMessage || languagePack.texts.invitationMessage;
  const invSubmessage = texts.invitationSubmessage || languagePack.texts.invitationSubmessage;
  const invCagnotteTitle = texts.invitationCagnotteTitle || texts.cagnotteTitle || languagePack.texts.invitationCagnotteTitle;
  const invCagnotteDesc = texts.invitationCagnotteDescription || texts.cagnotteDescription || languagePack.texts.invitationCagnotteDescription;
  const invCagnotteButton = texts.invitationCagnotteButton || languagePack.texts.invitationCagnotteButton;
  const invDressCode = texts.invitationDressCode || texts.dressCode || "";

  const showProgramme = sections.invitationShowProgramme ?? true;
  const showLocations = sections.invitationShowLocations ?? true;
  const showDressCode = sections.invitationShowDressCode ?? true;
  const showCagnotte = sections.invitationShowCagnotte ?? true;
  const showQrCode = sections.invitationShowQrCode ?? true;

  const dateObj = wedding?.weddingDate ? new Date(wedding.weddingDate) : null;
  const dayName = dateObj ? dateObj.toLocaleDateString(languagePack.locale, { weekday: "long" }) : "";
  const dayNum = dateObj ? String(dateObj.getDate()).padStart(2, "0") : "";
  const monthName = dateObj ? dateObj.toLocaleDateString(languagePack.locale, { month: "long" }) : "";
  const yearNum = dateObj ? dateObj.getFullYear() : "";
  const coupleNames = heroTitle.includes(" et ") ? heroTitle.split(" et ") : heroTitle.includes(" & ") ? heroTitle.split(" & ") : [heroTitle, ""];
  const isConfirmed = guest.availability === "confirmed" || guest.status === "confirmed";
  const isDeclined = guest.availability === "declined" || guest.status === "declined";
  const isCouple = guest.partySize >= 2;
  const guestDisplayName = isCouple ? `${guest.firstName} ${guest.lastName}` : guest.firstName;
  const weddingSlug = (wedding as any)?.slug || "";

  return (
    <div className="min-h-screen font-sans" style={{ backgroundColor: bg, color: textBase }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,wght@0,300;0,400;0,500;0,700;1,300&family=DM+Serif+Display:ital@0;1&display=swap');
        .im-sans { font-family: 'DM Sans', system-ui, sans-serif; }
        .im-display { font-family: 'DM Serif Display', Georgia, serif; }
        @keyframes im-fade { from { opacity:0; transform:translateY(16px); } to { opacity:1; transform:translateY(0); } }
        .im0 { animation: im-fade 0.9s ease forwards; }
        .im1 { animation: im-fade 0.9s ease 0.15s forwards; opacity:0; }
        .im2 { animation: im-fade 0.9s ease 0.3s forwards; opacity:0; }
        .im3 { animation: im-fade 0.9s ease 0.45s forwards; opacity:0; }
        .im4 { animation: im-fade 0.9s ease 0.6s forwards; opacity:0; }
        .im5 { animation: im-fade 0.9s ease 0.75s forwards; opacity:0; }
      `}</style>

      {/* Hero — full width, photo top half, text below */}
      <section className="relative min-h-[100dvh] flex flex-col">
        {/* Top: photo or gradient */}
        <div className="relative h-[45vh] overflow-hidden" style={{ backgroundColor: `${accent}18` }}>
          {couplePhoto ? (
            <img src={couplePhoto} alt={heroTitle} className="w-full h-full object-cover" style={{ filter: "brightness(0.92)" }} />
          ) : (
            <div className="w-full h-full" style={{ background: `linear-gradient(135deg, color-mix(in srgb, ${accent} 20%, transparent) 0%, color-mix(in srgb, ${accent} 8%, transparent) 100%)` }} />
          )}
          {/* Greeting badge */}
          <div className="absolute bottom-6 left-6 right-6">
            <div className="im0 inline-flex items-center gap-2.5 px-4 py-2 rounded-full" style={{ backgroundColor: isDarkBg ? "rgba(255,255,255,0.1)" : "rgba(255,255,255,0.92)", backdropFilter: "blur(12px)", border: `1px solid ${isDarkBg ? "rgba(255,255,255,0.1)" : "transparent"}` }}>
              <span className="text-xs font-medium im-sans" style={{ color: textBase }}>
                {invGreeting}{isCouple ? "s" : ""} &nbsp;
              </span>
              <span className="text-sm font-bold im-sans" style={{ color: accent }}>
                {guestDisplayName}
              </span>
              {isCouple && guest.partySize > 1 && (
                <span className="text-[10px] im-sans px-2 py-0.5 rounded-full" style={{ backgroundColor: `${accent}15`, color: accent }}>
                  × {guest.partySize}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Bottom: names & date */}
        <div className="flex-1 flex flex-col justify-center px-6 py-10 space-y-8">
          {logoUrl && (
            <div className="im1 flex justify-center">
              <img src={logoUrl} alt="" className="h-12 w-12 object-contain" />
            </div>
          )}

          <div className="im2 text-center space-y-1">
            <p className="text-[10px] tracking-[0.4em] uppercase im-sans" style={{ color: `${accent}99` }}>{invPrelude}</p>
          </div>

          <div className="im3 text-center">
            {coupleNames[1] ? (
              <div className="space-y-1">
                <h1 className="text-4xl sm:text-5xl im-display" style={{ color: textBase }}>{coupleNames[0].trim()}</h1>
                <p className="text-2xl im-display italic" style={{ color: accent }}>&amp;</p>
                <h1 className="text-4xl sm:text-5xl im-display" style={{ color: textBase }}>{coupleNames[1].trim()}</h1>
              </div>
            ) : (
              <h1 className="text-4xl sm:text-5xl im-display" style={{ color: textBase }}>{heroTitle}</h1>
            )}
          </div>

          {dateObj && (
            <div className="im4 text-center">
              <div className="inline-grid grid-cols-3 divide-x text-center" style={{ border: `1px solid color-mix(in srgb, ${accent} 20%, transparent)`, borderRadius: "12px", overflow: "hidden", divideColor: `color-mix(in srgb, ${accent} 20%, transparent)` }}>
                <div className="px-6 py-4">
                  <p className="text-[10px] uppercase tracking-widest im-sans mb-1" style={{ color: `color-mix(in srgb, ${accent} 80%, transparent)` }}>{dayName}</p>
                  <p className="text-3xl font-bold im-sans" style={{ color: textBase }}>{dayNum}</p>
                </div>
                <div className="px-6 py-4" style={{ backgroundColor: accent }}>
                  <p className="text-[10px] uppercase tracking-widest im-sans mb-1" style={{ color: `color-mix(in srgb, ${secondaryColor} 80%, white)` }}>{monthName}</p>
                  <p className="text-3xl font-bold im-sans" style={{ color: secondaryColor }}>{yearNum}</p>
                </div>
                <div className="px-6 py-4">
                  <p className="text-[10px] uppercase tracking-widest im-sans mb-1" style={{ color: `color-mix(in srgb, ${accent} 80%, transparent)` }}>{languagePack.language === "en" ? "Day" : "Jour"}</p>
                  <p className="text-3xl font-bold im-sans" style={{ color: textBase }}>J</p>
                </div>
              </div>
            </div>
          )}

          {storyBody && (
            <div className="im5 text-center max-w-sm mx-auto">
              <p className="text-sm leading-relaxed im-sans" style={{ color: textMuted }}>
                {storyBody.length > 160 ? storyBody.slice(0, 160) + "…" : storyBody}
              </p>
            </div>
          )}

          <div className="im5 pt-2 text-center">
            <ChevronDown className="h-5 w-5 mx-auto" style={{ color: `color-mix(in srgb, ${accent} 50%, transparent)` }} />
          </div>
        </div>
      </section>

      {/* Message */}
      <FadeIn className="py-16 px-6" style={{ backgroundColor: `color-mix(in srgb, ${accent} 8%, transparent)` }}>
        <div className="max-w-sm mx-auto text-center space-y-4">
          <div className="w-10 h-0.5 mx-auto" style={{ backgroundColor: accent }} />
          <p className="text-lg leading-relaxed im-display italic" style={{ color: textBase }}>{invMessage}</p>
          <p className="text-sm im-sans" style={{ color: textMuted }}>{invSubmessage}</p>
        </div>
      </FadeIn>

      {/* Programme */}
      {showProgramme && programItems.length > 0 && (
        <section className="py-16 px-6">
          <FadeIn className="max-w-lg mx-auto">
            <div className="flex items-center gap-3 mb-10">
              <div className="w-8 h-0.5" style={{ backgroundColor: accent }} />
              <h2 className="text-2xl im-display">{ui.scheduleTitle}</h2>
            </div>
            <div className="space-y-3">
              {programItems.map((item: any, i: number) => (
                <FadeIn key={i} delay={i * 0.08}>
                  <div className="flex gap-4 p-5 rounded-xl" style={{ backgroundColor: cardBg }}>
                    <div className="w-14 text-center">
                      <p className="text-base font-mono font-bold" style={{ color: accent }}>{(item.time || "").replace(":", "h")}</p>
                    </div>
                    <div>
                      <p className="font-semibold text-sm im-sans">{item.title}</p>
                      {item.description && <p className="text-xs mt-0.5 im-sans" style={{ color: textMuted }}>{item.description}</p>}
                      {(item.location || item.venueLabel) && (
                        <p className="text-xs mt-1 flex items-center gap-1 im-sans" style={{ color: textSubtle }}>
                          <MapPin className="h-3 w-3" style={{ color: accent }} />{item.location || item.venueLabel}
                        </p>
                      )}
                    </div>
                  </div>
                </FadeIn>
              ))}
            </div>
          </FadeIn>
        </section>
      )}

      {/* Options */}
      {allowedOptions.length > 0 && (
        <section className="py-14 px-6" style={{ backgroundColor: `${accent}08` }}>
          <FadeIn className="max-w-lg mx-auto">
            <div className="flex items-center gap-3 mb-10">
              <div className="w-8 h-0.5" style={{ backgroundColor: accent }} />
              <h2 className="text-2xl im-display">{ui.optionsTitle}</h2>
            </div>
            <div className="space-y-3">
              {allowedOptions.map((option: any) => (
                <div key={option.id} className="p-5 rounded-xl space-y-1" style={{ backgroundColor: bg, border: `1px solid color-mix(in srgb, ${accent} 20%, transparent)` }}>
                  <p className="font-semibold text-sm im-sans" style={{ color: accent }}>{option.label}</p>
                  <p className="text-xs im-sans" style={{ color: textMuted }}>{[option.time, option.venueLabel].filter(Boolean).join(" · ")}</p>
                  {typeof option.priceCents === "number" && <p className="text-xs im-sans" style={{ color: textSubtle }}>{(option.priceCents / 100).toFixed(2)} EUR / {languagePack.invitation.person}</p>}
                </div>
              ))}
            </div>
          </FadeIn>
        </section>
      )}

      {/* Lieux */}
      {showLocations && locations.length > 0 && (
        <section className="py-16 px-6">
          <FadeIn className="max-w-lg mx-auto">
            <div className="flex items-center gap-3 mb-10">
              <div className="w-8 h-0.5" style={{ backgroundColor: accent }} />
              <h2 className="text-2xl im-display">{ui.locationsTitle}</h2>
            </div>
            <div className="space-y-4">
              {locations.map((loc: any, idx: number) => (
                <FadeIn key={idx} delay={idx * 0.1}>
                  <div className="p-6 rounded-2xl space-y-3" style={{ backgroundColor: cardBg }}>
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-bold text-sm im-sans">{loc.title}</p>
                        {loc.address && <p className="text-xs mt-1 im-sans" style={{ color: textMuted }}>{loc.address}</p>}
                        {loc.description && <p className="text-xs mt-1 im-sans" style={{ color: textSubtle }}>{loc.description}</p>}
                      </div>
                      {loc.address && (
                        <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(loc.address)}`} target="_blank" rel="noopener noreferrer" className="shrink-0 w-9 h-9 rounded-lg flex items-center justify-center transition-opacity hover:opacity-80" style={{ backgroundColor: accent }}>
                          <MapPin className="h-4 w-4" style={{ color: secondaryColor }} />
                        </a>
                      )}
                    </div>
                  </div>
                </FadeIn>
              ))}
            </div>
          </FadeIn>
        </section>
      )}

      {/* Dress code */}
      {showDressCode && invDressCode && (
        <FadeIn className="py-12 px-6">
          <div className="max-w-sm mx-auto p-6 rounded-2xl text-center space-y-3" style={{ backgroundColor: `color-mix(in srgb, ${accent} 8%, transparent)`, border: `1px solid color-mix(in srgb, ${accent} 20%, transparent)` }}>
            <Sparkles className="h-5 w-5 mx-auto" style={{ color: accent }} />
            <p className="text-xs font-bold uppercase tracking-widest im-sans" style={{ color: accent }}>Dress Code</p>
            <p className="text-sm im-sans">{invDressCode}</p>
          </div>
        </FadeIn>
      )}

      {/* Cagnotte */}
      {showCagnotte && cagnotteHref && (
        <FadeIn className="py-16 px-6" style={{ backgroundColor: `color-mix(in srgb, ${accent} 8%, transparent)` }}>
          <div className="max-w-sm mx-auto text-center space-y-5">
            <div className="w-12 h-12 mx-auto rounded-full flex items-center justify-center" style={{ backgroundColor: accent }}>
              <Gift className="h-5 w-5" style={{ color: secondaryColor }} />
            </div>
            <h2 className="text-2xl im-display">{invCagnotteTitle}</h2>
            <p className="text-sm im-sans leading-relaxed" style={{ color: textMuted }}>{invCagnotteDesc}</p>
            <a href={cagnotteHref} target={cagnotteMode === "external" && cagnotteExternalUrl ? "_blank" : undefined} rel={cagnotteMode === "external" && cagnotteExternalUrl ? "noopener noreferrer" : undefined} className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl text-sm font-bold im-sans hover:opacity-90 transition-opacity" style={{ backgroundColor: accent, color: secondaryColor }}>
              <Gift className="h-4 w-4" /> {invCagnotteButton}
            </a>
          </div>
        </FadeIn>
      )}

      {showQrCode && qrDataUrl && (
        <FadeIn className="py-14 px-6 text-center" style={{ backgroundColor: cardBg }}>
          <div className="inline-block p-5 rounded-2xl bg-white shadow-sm">
            <img src={qrDataUrl} alt="QR check-in" className="h-28 w-28 mx-auto" />
          </div>
          <p className="mt-4 text-[10px] uppercase tracking-widest im-sans" style={{ color: textSubtle }}>
            {languagePack.language === "en" ? "Scan for day-of check-in" : "Check-in jour J"}
          </p>
        </FadeIn>
      )}

      <footer className="py-10 px-6 flex items-center justify-between" style={{ borderTop: `1px solid ${isDarkBg ? "rgba(255,255,255,0.1)" : "#E5E5E5"}` }}>
        {logoUrl ? <img src={logoUrl} alt="" className="h-10 w-10 object-contain" /> : <span />}
        <p className="text-xs font-bold uppercase tracking-widest im-sans" style={{ color: textSubtle }}>{heroTitle}</p>
      </footer>
    </div>
  );
}

// ─── Template C: Noir / Dark Luxury ──────────────────────────────────────────
// Used for: velours, echo

function InvitationNoir({ guest, wedding, primaryColor, secondaryColor, qrDataUrl, basePath, checkInHref, ui, languagePack, texts, sections, media, payments, brandingConfig }: InvitationProps) {
  // Use secondaryColor from props
  const bg = `color-mix(in srgb, ${primaryColor} 6%, ${secondaryColor})`;
  const gold = primaryColor;

  const heroTitle = texts.heroTitle || wedding.title || "";
  const logoUrl = brandingConfig.logoUrl || "";
  const couplePhoto = media.invitationImage || media.couplePhoto || "";
  const storyBody = texts.storyBody || "";
  const guestContext = ((wedding as any)?.guestContext || guest?.resolvedContext || {}) as any;
  const programItems = (guestContext.allowedSegments?.length ? guestContext.allowedSegments : sections.programItems || []) as any[];
  const locations = sections.locationItems || [];
  const allowedOptions = (guestContext.allowedOptions || []) as any[];
  const assignedTable = guestContext.assignedTable || null;
  const invitationTypeLabel = guestContext.invitationType?.label || null;
  const cagnotteExternalUrl = (payments.externalUrl || sections.cagnotteExternalUrl || "") as string;
  const cagnotteMode = payments.mode || (cagnotteExternalUrl ? "external" : "stripe");
  const cagnotteHref = cagnotteMode === "external" && cagnotteExternalUrl ? cagnotteExternalUrl : `${basePath}#cagnotte`;

  const invGreeting = texts.invitationGreeting || languagePack.texts.invitationGreeting;
  const invPrelude = texts.invitationPrelude || languagePack.texts.invitationPrelude;
  const invMessage = texts.invitationMessage || languagePack.texts.invitationMessage;
  const invSubmessage = texts.invitationSubmessage || languagePack.texts.invitationSubmessage;
  const invCagnotteTitle = texts.invitationCagnotteTitle || texts.cagnotteTitle || languagePack.texts.invitationCagnotteTitle;
  const invCagnotteDesc = texts.invitationCagnotteDescription || texts.cagnotteDescription || languagePack.texts.invitationCagnotteDescription;
  const invCagnotteButton = texts.invitationCagnotteButton || languagePack.texts.invitationCagnotteButton;
  const invDressCode = texts.invitationDressCode || texts.dressCode || "";

  const showProgramme = sections.invitationShowProgramme ?? true;
  const showLocations = sections.invitationShowLocations ?? true;
  const showDressCode = sections.invitationShowDressCode ?? true;
  const showCagnotte = sections.invitationShowCagnotte ?? true;
  const showQrCode = sections.invitationShowQrCode ?? true;

  const dateObj = wedding?.weddingDate ? new Date(wedding.weddingDate) : null;
  const dayNum = dateObj ? String(dateObj.getDate()).padStart(2, "0") : "";
  const monthName = dateObj ? dateObj.toLocaleDateString(languagePack.locale, { month: "long" }) : "";
  const yearNum = dateObj ? dateObj.getFullYear() : "";
  const dayName = dateObj ? dateObj.toLocaleDateString(languagePack.locale, { weekday: "long" }) : "";
  const coupleNames = heroTitle.includes(" et ") ? heroTitle.split(" et ") : heroTitle.includes(" & ") ? heroTitle.split(" & ") : [heroTitle, ""];
  const isConfirmed = guest.availability === "confirmed" || guest.status === "confirmed";
  const isDeclined = guest.availability === "declined" || guest.status === "declined";
  const isCouple = guest.partySize >= 2;
  const guestDisplayName = isCouple ? `${guest.firstName} ${guest.lastName}` : guest.firstName;
  const weddingSlug = (wedding as any)?.slug || "";

  const cream = `color-mix(in srgb, ${secondaryColor} 10%, white)`;
  const muted = `color-mix(in srgb, ${secondaryColor} 40%, white)`;
  const cardBg = `color-mix(in srgb, ${gold} 12%, ${secondaryColor})`;
  const border = `color-mix(in srgb, ${gold} 22%, transparent)`;

  return (
    <div className="min-h-screen" style={{ backgroundColor: bg, color: cream }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;1,300;1,400&family=Josefin+Sans:wght@300;400;600&display=swap');
        .in-serif { font-family: 'Cormorant Garamond', Georgia, serif; }
        .in-sans { font-family: 'Josefin Sans', sans-serif; }
        @keyframes in-fade { from { opacity:0; transform:translateY(16px); } to { opacity:1; transform:translateY(0); } }
        .in0 { animation: in-fade 1.1s ease forwards; }
        .in1 { animation: in-fade 1.1s ease 0.2s forwards; opacity:0; }
        .in2 { animation: in-fade 1.1s ease 0.4s forwards; opacity:0; }
        .in3 { animation: in-fade 1.1s ease 0.6s forwards; opacity:0; }
        .in4 { animation: in-fade 1.1s ease 0.8s forwards; opacity:0; }
        .in5 { animation: in-fade 1.1s ease 1s forwards; opacity:0; }
        @keyframes in-float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-5px)} }
        .in-float { animation: in-float 4s ease-in-out infinite; }
      `}</style>

      {/* Hero */}
      <section className="min-h-[100dvh] flex flex-col items-center justify-center px-6 py-20 relative overflow-hidden">
        {/* Subtle radial glow */}
        <div className="absolute inset-0 pointer-events-none" style={{ background: `radial-gradient(ellipse at center top, ${gold}12 0%, transparent 60%)` }} />

        <div className="w-full max-w-sm mx-auto text-center space-y-10 relative z-10">
          {logoUrl && (
            <div className="in0">
              <img src={logoUrl} alt="" className="mx-auto h-16 w-16 object-contain" />
            </div>
          )}

          {/* Guest greeting */}
          <div className="in1 space-y-2">
            <p className="text-[9px] tracking-[0.5em] uppercase in-sans" style={{ color: muted }}>
              {invGreeting}{isCouple ? "s" : ""}
            </p>
            <p className="text-2xl in-serif italic font-light" style={{ color: cream }}>
              {guestDisplayName}
            </p>
            {isCouple && guest.partySize > 1 && (
              <p className="text-[9px] tracking-[0.3em] uppercase in-sans" style={{ color: muted }}>
                {guest.partySize} {languagePack.invitation.people}
              </p>
            )}
          </div>

          {/* Gold rule */}
          <div className="in2 flex items-center justify-center gap-4">
            <div className="h-px w-14" style={{ backgroundColor: `color-mix(in srgb, ${gold} 35%, transparent)` }} />
            <div className="w-1 h-1 rounded-full" style={{ backgroundColor: `color-mix(in srgb, ${gold} 50%, transparent)` }} />
            <div className="h-px w-14" style={{ backgroundColor: `color-mix(in srgb, ${gold} 35%, transparent)` }} />
          </div>

          {/* Prelude */}
          <div className="in2">
            <p className="text-[9px] tracking-[0.4em] uppercase in-sans" style={{ color: muted }}>{invPrelude}</p>
          </div>

          {/* Names */}
          <div className="in3">
            {coupleNames[1] ? (
              <div className="space-y-2">
                <h1 className="text-5xl sm:text-6xl in-serif font-light tracking-wide" style={{ color: cream }}>{coupleNames[0].trim()}</h1>
                <p className="text-2xl in-serif italic" style={{ color: gold }}>&amp;</p>
                <h1 className="text-5xl sm:text-6xl in-serif font-light tracking-wide" style={{ color: cream }}>{coupleNames[1].trim()}</h1>
              </div>
            ) : (
              <h1 className="text-5xl sm:text-6xl in-serif font-light" style={{ color: cream }}>{heroTitle}</h1>
            )}
          </div>

          {/* Date */}
          {dateObj && (
            <div className="in4">
              <div className="inline-flex flex-col items-center gap-1 px-8 py-5" style={{ border: `1px solid ${gold}35` }}>
                <p className="text-[9px] tracking-[0.35em] uppercase in-sans" style={{ color: muted }}>{dayName}</p>
                <p className="text-5xl in-serif font-light" style={{ color: gold }}>{dayNum}</p>
                <p className="text-[9px] tracking-[0.25em] uppercase in-sans" style={{ color: muted }}>{monthName} {yearNum}</p>
              </div>
            </div>
          )}

          {storyBody && (
            <div className="in5">
              <p className="text-sm in-serif italic leading-relaxed" style={{ color: muted }}>
                {storyBody.length > 160 ? storyBody.slice(0, 160) + "…" : storyBody}
              </p>
            </div>
          )}

          <div className="in5">
            <ChevronDown className="h-4 w-4 mx-auto in-float" style={{ color: `color-mix(in srgb, ${gold} 50%, transparent)` }} />
          </div>
        </div>
      </section>

      {/* Photo */}
      {couplePhoto && (
        <FadeIn className="px-6 pb-16 flex justify-center">
          <div className="relative max-w-xs w-full">
            <div className="absolute -inset-1" style={{ border: `1px solid ${gold}25` }} />
            <img src={couplePhoto} alt={heroTitle} className="w-full aspect-[3/4] object-cover" />
          </div>
        </FadeIn>
      )}

      {/* Message */}
      <FadeIn className="py-16 px-6 text-center" style={{ borderTop: `1px solid color-mix(in srgb, ${gold} 15%, transparent)`, borderBottom: `1px solid color-mix(in srgb, ${gold} 15%, transparent)` }}>
        <div className="max-w-sm mx-auto space-y-4">
          <p className="text-xl in-serif italic leading-relaxed" style={{ color: cream }}>{invMessage}</p>
          <p className="text-sm in-serif" style={{ color: muted }}>{invSubmessage}</p>
        </div>
      </FadeIn>

      {/* Programme */}
      {showProgramme && programItems.length > 0 && (
        <section className="py-16 px-6" style={{ borderTop: `1px solid color-mix(in srgb, ${gold} 15%, transparent)` }}>
          <FadeIn className="max-w-md mx-auto">
            <div className="flex items-center gap-4 mb-12">
              <div className="h-px flex-1" style={{ backgroundColor: `color-mix(in srgb, ${gold} 25%, transparent)` }} />
              <h2 className="text-[9px] tracking-[0.4em] uppercase in-sans" style={{ color: gold }}>{ui.scheduleTitle}</h2>
              <div className="h-px flex-1" style={{ backgroundColor: `color-mix(in srgb, ${gold} 25%, transparent)` }} />
            </div>
            <div className="space-y-0">
              {programItems.map((item: any, i: number) => (
                <FadeIn key={i} delay={i * 0.08}>
                  <div className="grid grid-cols-[64px_1fr] gap-4 py-5" style={{ borderBottom: `1px solid color-mix(in srgb, ${gold} 10%, transparent)` }}>
                    <p className="text-sm font-mono" style={{ color: gold }}>{(item.time || "").replace(":", "h")}</p>
                    <div>
                      <p className="text-xs tracking-widest uppercase in-sans font-semibold" style={{ color: cream }}>{item.title}</p>
                      {item.description && <p className="text-xs in-serif mt-0.5" style={{ color: muted }}>{item.description}</p>}
                      {(item.location || item.venueLabel) && (
                        <p className="text-xs in-serif italic mt-1 flex items-center gap-1" style={{ color: muted }}>
                          <MapPin className="h-2.5 w-2.5" style={{ color: gold }} />{item.location || item.venueLabel}
                        </p>
                      )}
                    </div>
                  </div>
                </FadeIn>
              ))}
            </div>
          </FadeIn>
        </section>
      )}

      {/* Options */}
      {allowedOptions.length > 0 && (
        <section className="py-14 px-6" style={{ borderTop: `1px solid ${gold}15` }}>
          <FadeIn className="max-w-md mx-auto">
            <div className="flex items-center gap-4 mb-10">
              <div className="h-px flex-1" style={{ backgroundColor: `${gold}25` }} />
              <h2 className="text-[9px] tracking-[0.4em] uppercase in-sans" style={{ color: gold }}>{ui.optionsTitle}</h2>
              <div className="h-px flex-1" style={{ backgroundColor: `${gold}25` }} />
            </div>
            <div className="space-y-3">
              {allowedOptions.map((option: any) => (
                <div key={option.id} className="p-5 space-y-1" style={{ backgroundColor: cardBg, border: `1px solid ${gold}20` }}>
                  <p className="text-xs uppercase tracking-widest in-sans" style={{ color: gold }}>{option.label}</p>
                  <p className="text-sm in-serif" style={{ color: muted }}>{[option.time, option.venueLabel].filter(Boolean).join(" · ")}</p>
                  {typeof option.priceCents === "number" && <p className="text-xs in-serif" style={{ color: muted }}>{(option.priceCents / 100).toFixed(2)} EUR / {languagePack.invitation.person}</p>}
                </div>
              ))}
            </div>
          </FadeIn>
        </section>
      )}

      {/* Lieux */}
      {showLocations && locations.length > 0 && (
        <section className="py-16 px-6" style={{ borderTop: `1px solid ${gold}15` }}>
          <FadeIn className="max-w-md mx-auto">
            <div className="flex items-center gap-4 mb-12">
              <div className="h-px flex-1" style={{ backgroundColor: `${gold}25` }} />
              <h2 className="text-[9px] tracking-[0.4em] uppercase in-sans" style={{ color: gold }}>{ui.locationsTitle}</h2>
              <div className="h-px flex-1" style={{ backgroundColor: `${gold}25` }} />
            </div>
            <div className="space-y-4">
              {locations.map((loc: any, i: number) => (
                <FadeIn key={i} delay={i * 0.12}>
                  <div className="p-6 space-y-3" style={{ backgroundColor: cardBg, border: `1px solid ${gold}18` }}>
                    <p className="text-[9px] uppercase tracking-widest in-sans" style={{ color: gold }}>{loc.title}</p>
                    {loc.address && (
                      <div className="flex items-start gap-2">
                        <MapPin className="h-3.5 w-3.5 mt-0.5 shrink-0" style={{ color: gold, opacity: 0.7 }} />
                        <p className="text-sm in-serif" style={{ color: cream }}>{loc.address}</p>
                      </div>
                    )}
                    {loc.description && <p className="text-xs in-serif" style={{ color: muted }}>{loc.description}</p>}
                    {loc.address && (
                      <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(loc.address)}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-[9px] tracking-[0.2em] uppercase in-sans hover:opacity-70 transition-opacity" style={{ color: gold }}>
                        {ui.directions} <ExternalLink className="h-2.5 w-2.5" />
                      </a>
                    )}
                  </div>
                </FadeIn>
              ))}
            </div>
          </FadeIn>
        </section>
      )}

      {/* Dress code */}
      {showDressCode && invDressCode && (
        <FadeIn className="py-12 px-6" style={{ borderTop: `1px solid color-mix(in srgb, ${gold} 15%, transparent)` }}>
          <div className="max-w-sm mx-auto p-7 text-center space-y-3" style={{ backgroundColor: cardBg, border: `1px solid color-mix(in srgb, ${gold} 25%, transparent)` }}>
            <Sparkles className="h-4 w-4 mx-auto" style={{ color: gold }} />
            <p className="text-[9px] uppercase tracking-widest in-sans" style={{ color: gold }}>Dress Code</p>
            <p className="text-sm in-serif" style={{ color: cream }}>{invDressCode}</p>
          </div>
        </FadeIn>
      )}

      {/* Cagnotte */}
      {showCagnotte && cagnotteHref && (
        <FadeIn className="py-16 px-6 text-center" style={{ borderTop: `1px solid ${gold}15` }}>
          <div className="max-w-sm mx-auto space-y-6">
            <div className="flex items-center justify-center gap-4">
              <div className="h-px w-12" style={{ backgroundColor: `color-mix(in srgb, ${gold} 30%, transparent)` }} />
              <Gift className="h-5 w-5" style={{ color: gold }} />
              <div className="h-px w-12" style={{ backgroundColor: `color-mix(in srgb, ${gold} 30%, transparent)` }} />
            </div>
            <p className="text-[9px] uppercase tracking-widest in-sans" style={{ color: gold }}>{ui.fundIntro}</p>
            <h2 className="text-2xl in-serif italic" style={{ color: cream }}>{invCagnotteTitle}</h2>
            <p className="text-sm in-serif leading-relaxed" style={{ color: muted }}>{invCagnotteDesc}</p>
            <a href={cagnotteHref} target={cagnotteMode === "external" && cagnotteExternalUrl ? "_blank" : undefined} rel={cagnotteMode === "external" && cagnotteExternalUrl ? "noopener noreferrer" : undefined} className="inline-flex items-center gap-2.5 px-9 py-3.5 text-[9px] tracking-[0.3em] uppercase in-sans font-semibold transition-opacity hover:opacity-80" style={{ border: `1px solid ${gold}`, color: gold }}>
              <Gift className="h-3.5 w-3.5" /> {invCagnotteButton}
            </a>
          </div>
        </FadeIn>
      )}

      {showQrCode && qrDataUrl && (
        <FadeIn className="py-14 px-6 text-center" style={{ borderTop: `1px solid color-mix(in srgb, ${gold} 15%, transparent)` }}>
          <div className="inline-block p-5" style={{ border: `1px solid color-mix(in srgb, ${gold} 25%, transparent)` }}>
            <img src={qrDataUrl} alt="QR check-in" className="h-28 w-28 mx-auto" />
          </div>
          <p className="mt-4 text-[9px] uppercase tracking-widest in-sans" style={{ color: muted }}>
            {languagePack.language === "en" ? "Scan for day-of check-in" : "Check-in jour J"}
          </p>
        </FadeIn>
      )}

      <footer className="py-12 px-6 text-center" style={{ borderTop: `1px solid color-mix(in srgb, ${gold} 15%, transparent)` }}>
        {logoUrl && <img src={logoUrl} alt="" className="mx-auto h-12 w-12 object-contain mb-4" />}
        <div className="flex items-center justify-center gap-4">
          <div className="h-px w-10" style={{ backgroundColor: `color-mix(in srgb, ${gold} 30%, transparent)` }} />
          <p className="text-[9px] tracking-[0.3em] uppercase in-sans" style={{ color: muted }}>{heroTitle}</p>
          <div className="h-px w-10" style={{ backgroundColor: `color-mix(in srgb, ${gold} 30%, transparent)` }} />
        </div>
      </footer>
    </div>
  );
}

// ─── Main export ──────────────────────────────────────────────────────────────

const DARK_TEMPLATES = new Set(["velours", "echo"]);
const MODERN_TEMPLATES = new Set(["modern", "avantgarde", "graphik"]);

export default function InvitationPage() {
  const params = useParams();
  const guestId = (params as any).guestId;
  const [qrDataUrl, setQrDataUrl] = useState<string>("");
  // Real-time preview override from admin panel (postMessage)
  const [previewOverride, setPreviewOverride] = useState<{
    texts?: Record<string, any>;
    sections?: Record<string, any>;
    media?: Record<string, any>;
    theme?: Record<string, any>;
  } | null>(null);

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === "INVITATION_PREVIEW_OVERRIDE") {
        setPreviewOverride(event.data.payload ?? null);
      }
    };
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []);

  const { data: guest, isLoading, error } = useQuery<GuestData>({
    queryKey: ["/api/invitation/guest", guestId],
    queryFn: async () => {
      const res = await fetch(`/api/invitation/guest/${guestId}`);
      if (!res.ok) throw new Error("Invité non trouvé");
      return res.json();
    },
    enabled: !!guestId,
  });

  const { data: wedding, isLoading: isWeddingLoading } = useQuery({
    queryKey: ["/api/invitation/guest", guestId, "wedding"],
    queryFn: async () => {
      const res = await fetch(`/api/invitation/guest/${guestId}/wedding`);
      if (!res.ok) throw new Error("Mariage non trouvé");
      return res.json();
    },
    enabled: !!guestId && !!guest,
  });

  const primaryColor = previewOverride?.theme?.invitationPrimaryColor || wedding?.config?.theme?.invitationPrimaryColor || wedding?.config?.theme?.primaryColor || "#C8A96A";
  const secondaryColor = previewOverride?.theme?.invitationSecondaryColor || wedding?.config?.theme?.invitationSecondaryColor || wedding?.config?.theme?.secondaryColor || (DARK_TEMPLATES.has(wedding?.templateId) ? "#0C0B09" : "#FDFCFA");

  const languagePack = getSiteLanguagePack((wedding?.config as any)?.language);
  const weddingSlug = (wedding as any)?.slug || "";
  const basePath = weddingSlug ? `/${weddingSlug}` : "/";
  const checkInHref = `${basePath}/checkin?token=${guestId}`;

  const ui: Record<string, string> = languagePack.language === "en"
    ? {
        loading: "Loading...", confirmed: "Attendance confirmed", confirmedDesc: "Thank you for confirming. We can't wait to celebrate with you.",
        declined: "Noted with love", declinedDesc: "We understand and send you our warmest thoughts. We will miss you.",
        pending: "Please confirm your attendance", pendingDesc: "Visit our website to confirm and discover all the details.",
        reply: "Reply", viewSite: "View our website", scheduleIntro: "The day", scheduleTitle: "Schedule",
        optionsIntro: "Your options", optionsTitle: "Extras", locationsIntro: "Where to find us", locationsTitle: "Venues",
        directions: "Directions", stay: "Places to stay", fundIntro: "Our fund",
      }
    : {
        loading: "Chargement...", confirmed: "Présence confirmée", confirmedDesc: "Merci d'avoir confirmé. Nous avons hâte de vous retrouver !",
        declined: "Absence notée", declinedDesc: "Nous comprenons et vous souhaitons le meilleur. Vous nous manquerez !",
        pending: "Confirmez votre présence", pendingDesc: "Rendez-vous sur notre site pour confirmer votre venue.",
        reply: "Répondre", viewSite: "Voir notre site", scheduleIntro: "Le déroulement", scheduleTitle: "Programme",
        optionsIntro: "Vos options", optionsTitle: "Compléments", locationsIntro: "Où nous retrouver", locationsTitle: "Lieux",
        directions: "Itinéraire", stay: "Hébergements", fundIntro: "Notre cagnotte",
      };

  useEffect(() => {
    if (!wedding) return;
    const wTitle = wedding.config?.texts?.heroTitle || wedding.title;
    document.title = wTitle ? `${wTitle} — ${languagePack.invitation.pageTitle}` : languagePack.invitation.pageTitle;
    return () => { document.title = languagePack.language === "en" ? "Daylora — Create your wedding website" : "Daylora — Créez votre site de mariage"; };
  }, [wedding?.id, languagePack]);

  useEffect(() => {
    if (typeof window === "undefined" || !guestId) return;
    let cancelled = false;
    QRCodeLib.toDataURL(`${window.location.origin}${checkInHref}`, {
      margin: 1, width: 320,
      color: { dark: primaryColor, light: "#00000000" },
    })
      .then((url) => { if (!cancelled) setQrDataUrl(url); })
      .catch(() => { if (!cancelled) setQrDataUrl(""); });
    return () => { cancelled = true; };
  }, [guestId, primaryColor, checkInHref]);

  const texts = { ...(wedding?.config?.texts || {}), ...(previewOverride?.texts || {}) } as any;
  const sections = { ...(wedding?.config?.sections || {}), ...(previewOverride?.sections || {}) } as any;
  const media = { ...(wedding?.config?.media || {}), ...(previewOverride?.media || {}) } as any;
  const payments = (wedding?.config?.payments || {}) as any;
  const brandingConfig = (wedding?.config?.branding || {}) as any;

  // Loading state
  if (isLoading || isWeddingLoading || (!!guest && !wedding)) {
    const bg = DARK_TEMPLATES.has(wedding?.templateId) ? "#0C0B09" : "#FDFCFA";
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: bg }}>
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto" style={{ color: primaryColor }} />
          <p className="text-xs tracking-widest uppercase" style={{ color: primaryColor, opacity: 0.6 }}>{ui.loading}</p>
        </div>
      </div>
    );
  }

  if (error || !guest) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6" style={{ backgroundColor: "#FDFCFA" }}>
        <div className="text-center space-y-3">
          <Heart className="h-10 w-10 mx-auto" style={{ color: primaryColor, opacity: 0.5 }} />
          <p className="text-base font-medium">{languagePack.invitation.notFoundTitle}</p>
          <p className="text-sm" style={{ opacity: 0.6 }}>{languagePack.invitation.notFoundDescription}</p>
        </div>
      </div>
    );
  }

  const sharedProps: InvitationProps = {
    guest, wedding, primaryColor, secondaryColor, qrDataUrl, basePath, checkInHref, ui, languagePack,

    texts, sections, media, payments, brandingConfig,
  };

  const templateId = wedding?.templateId || "classic";
  const invStyle = (sections.invitationStyle || "") as string;

  if (invStyle === "noir" || (!invStyle && DARK_TEMPLATES.has(templateId))) {
    return <InvitationNoir {...sharedProps} />;
  }
  if (invStyle === "modern" || (!invStyle && MODERN_TEMPLATES.has(templateId))) {
    return <InvitationModern {...sharedProps} />;
  }
  return <InvitationRomantic {...sharedProps} />;
}
