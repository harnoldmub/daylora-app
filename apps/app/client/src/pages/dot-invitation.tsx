import { useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState, useRef } from "react";
import { Loader2, MapPin, Gift, ExternalLink, Bed, ChevronDown, Heart, Sparkles } from "lucide-react";
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

function MonogramSeal({ names, color }: { names: string[]; color: string }) {
  const initials = names.map(n => n.trim().charAt(0).toUpperCase()).filter(Boolean).join("&");
  return (
    <div className="relative mx-auto w-20 h-20">
      <svg viewBox="0 0 80 80" className="w-full h-full">
        <circle cx="40" cy="40" r="38" fill="none" stroke={color} strokeWidth="1" opacity="0.3" />
        <circle cx="40" cy="40" r="34" fill="none" stroke={color} strokeWidth="0.5" opacity="0.2" />
        <text
          x="40" y="43"
          textAnchor="middle"
          dominantBaseline="middle"
          fill={color}
          fontSize="16"
          fontFamily="'Playfair Display', serif"
          fontWeight="400"
          fontStyle="italic"
        >
          {initials}
        </text>
      </svg>
    </div>
  );
}

function FloralDivider({ color }: { color: string }) {
  return (
    <div className="flex items-center justify-center gap-4 py-6">
      <svg width="60" height="2" viewBox="0 0 60 2">
        <line x1="0" y1="1" x2="60" y2="1" stroke={color} strokeWidth="0.5" opacity="0.3" />
      </svg>
      <svg width="12" height="12" viewBox="0 0 12 12">
        <path d="M6 0 L8 4 L12 6 L8 8 L6 12 L4 8 L0 6 L4 4 Z" fill={color} opacity="0.4" />
      </svg>
      <svg width="60" height="2" viewBox="0 0 60 2">
        <line x1="0" y1="1" x2="60" y2="1" stroke={color} strokeWidth="0.5" opacity="0.3" />
      </svg>
    </div>
  );
}

function CornerOrnament({ color, position }: { color: string; position: "tl" | "tr" | "bl" | "br" }) {
  const transforms: Record<string, string> = {
    tl: "",
    tr: "scale(-1,1)",
    bl: "scale(1,-1)",
    br: "scale(-1,-1)",
  };
  return (
    <svg
      width="40" height="40" viewBox="0 0 40 40"
      className={`absolute ${position === "tl" || position === "bl" ? "left-4" : "right-4"} ${position === "tl" || position === "tr" ? "top-4" : "bottom-4"}`}
      style={{ opacity: 0.2 }}
    >
      <g transform={`translate(20,20) ${transforms[position]} translate(-20,-20)`}>
        <path d="M2 2 Q20 2 20 20" fill="none" stroke={color} strokeWidth="1" />
        <path d="M6 2 Q14 6 14 14" fill="none" stroke={color} strokeWidth="0.5" />
        <circle cx="2" cy="2" r="1.5" fill={color} />
      </g>
    </svg>
  );
}

function useInView(ref: React.RefObject<HTMLElement | null>) {
  const [isInView, setIsInView] = useState(false);
  useEffect(() => {
    if (!ref.current) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setIsInView(true); },
      { threshold: 0.15 }
    );
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, [ref]);
  return isInView;
}

function AnimatedSection({ children, className, style, delay = 0 }: {
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
        transform: isInView ? "translateY(0)" : "translateY(24px)",
        transition: `opacity 0.8s ease ${delay}s, transform 0.8s ease ${delay}s`,
      }}
    >
      {children}
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

  const { data: wedding } = useQuery({
    queryKey: ["/api/invitation/guest", guestId, "wedding"],
    queryFn: async () => {
      const res = await fetch(`/api/invitation/guest/${guestId}/wedding`);
      if (!res.ok) throw new Error("Mariage non trouvé");
      return res.json();
    },
    enabled: !!guestId && !!guest,
  });

  const primaryColor = wedding?.config?.theme?.primaryColor || "#C8A96A";
  const secondaryColor = wedding?.config?.theme?.secondaryColor || "#FFFDF9";
  const primaryHSL = hexToHSL(primaryColor);
  const darkL = Math.max(primaryHSL.l - 35, 10);
  const subtleL = Math.min(primaryHSL.l + 10, 55);
  const textDark = `hsl(${primaryHSL.h}, ${Math.min(primaryHSL.s, 30)}%, ${darkL}%)`;
  const textSubtle = `hsl(${primaryHSL.h}, ${Math.min(primaryHSL.s, 25)}%, ${subtleL}%)`;
  const bgBase = `color-mix(in srgb, ${primaryColor} 2%, #FDFCFA)`;
  const cardBg = `color-mix(in srgb, ${primaryColor} 4%, #F8F6F2)`;
  const borderLight = `color-mix(in srgb, ${primaryColor} 12%, transparent)`;
  const borderMedium = `color-mix(in srgb, ${primaryColor} 20%, transparent)`;

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
  const galleryImages = wedding?.config?.sections?.galleryImages || [];

  const dateObj = wedding?.weddingDate ? new Date(wedding.weddingDate) : null;
  const dayName = dateObj ? dateObj.toLocaleDateString("fr-FR", { weekday: "long" }) : "";
  const dayNum = dateObj ? dateObj.getDate() : "";
  const monthName = dateObj ? dateObj.toLocaleDateString("fr-FR", { month: "long" }) : "";
  const yearNum = dateObj ? dateObj.getFullYear() : "";

  const coupleNames = heroTitle.includes(" et ") ? heroTitle.split(" et ") : heroTitle.includes(" & ") ? heroTitle.split(" & ") : [heroTitle, ""];

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: bgBase }}>
        <div className="text-center space-y-4">
          <div className="relative mx-auto w-12 h-12">
            <div className="absolute inset-0 rounded-full border" style={{ borderColor: borderLight }} />
            <Loader2 className="h-6 w-6 animate-spin absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" style={{ color: primaryColor }} />
          </div>
          <p className="text-xs tracking-[0.2em] uppercase" style={{ color: textSubtle }}>Chargement...</p>
        </div>
      </div>
    );
  }

  if (error || !guest) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6" style={{ backgroundColor: bgBase }}>
        <div className="text-center space-y-4">
          <div className="w-16 h-16 mx-auto rounded-full flex items-center justify-center" style={{ backgroundColor: cardBg, border: `1px solid ${borderLight}` }}>
            <Heart className="h-6 w-6" style={{ color: primaryColor }} />
          </div>
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
    <div className="min-h-screen relative" style={{ backgroundColor: bgBase, color: textDark }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,500;0,600;0,700;1,400;1,500&family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;1,300;1,400&display=swap');
        .inv-serif { font-family: 'Cormorant Garamond', 'Playfair Display', Georgia, serif; }
        .inv-display { font-family: 'Playfair Display', Georgia, serif; }
        @keyframes inv-fade-up {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .inv-animate { animation: inv-fade-up 1s ease forwards; }
        .inv-animate-d1 { animation: inv-fade-up 1s ease 0.2s forwards; opacity: 0; }
        .inv-animate-d2 { animation: inv-fade-up 1s ease 0.4s forwards; opacity: 0; }
        .inv-animate-d3 { animation: inv-fade-up 1s ease 0.6s forwards; opacity: 0; }
        .inv-animate-d4 { animation: inv-fade-up 1s ease 0.8s forwards; opacity: 0; }
        .inv-animate-d5 { animation: inv-fade-up 1s ease 1s forwards; opacity: 0; }
        @keyframes inv-pulse-ring {
          0%, 100% { transform: scale(1); opacity: 0.15; }
          50% { transform: scale(1.05); opacity: 0.25; }
        }
        .inv-pulse-ring { animation: inv-pulse-ring 4s ease-in-out infinite; }
        @keyframes inv-float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-6px); }
        }
        .inv-float { animation: inv-float 3s ease-in-out infinite; }
      `}</style>

      <section className="min-h-[100dvh] flex flex-col items-center justify-center px-6 py-16 relative overflow-hidden">
        <CornerOrnament color={primaryColor} position="tl" />
        <CornerOrnament color={primaryColor} position="tr" />
        <CornerOrnament color={primaryColor} position="bl" />
        <CornerOrnament color={primaryColor} position="br" />

        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-[15%] left-[8%] w-1 h-1 rounded-full inv-pulse-ring" style={{ backgroundColor: primaryColor }} />
          <div className="absolute top-[25%] right-[12%] w-1.5 h-1.5 rounded-full inv-pulse-ring" style={{ backgroundColor: primaryColor, animationDelay: "1s" }} />
          <div className="absolute bottom-[30%] left-[15%] w-1 h-1 rounded-full inv-pulse-ring" style={{ backgroundColor: primaryColor, animationDelay: "2s" }} />
          <div className="absolute bottom-[20%] right-[10%] w-1 h-1 rounded-full inv-pulse-ring" style={{ backgroundColor: primaryColor, animationDelay: "3s" }} />
        </div>

        <div className="w-full max-w-md mx-auto text-center space-y-8 relative z-10">
          <div className="inv-animate">
            <MonogramSeal names={coupleNames} color={primaryColor} />
          </div>

          <div className="inv-animate-d1 space-y-3">
            <p className="text-[10px] tracking-[0.4em] uppercase inv-serif" style={{ color: textSubtle }}>
              vous êtes cordialement invité{isCouple ? "(e)s" : "(e)"}
            </p>
            <h2 className="text-2xl md:text-3xl inv-display italic font-light" style={{ color: textDark }}>
              {guestDisplayName}
            </h2>
          </div>

          <div className="inv-animate-d2">
            <p className="text-[10px] tracking-[0.3em] uppercase inv-serif" style={{ color: textSubtle }}>
              au mariage de
            </p>
          </div>

          <div className="inv-animate-d3 py-2">
            {coupleNames[1] ? (
              <div className="space-y-1">
                <h1 className="text-4xl sm:text-5xl md:text-6xl inv-display font-medium tracking-wide" style={{ color: textDark }}>
                  {coupleNames[0].trim()}
                </h1>
                <div className="flex items-center justify-center gap-4 py-1">
                  <div className="w-10 h-px" style={{ backgroundColor: primaryColor, opacity: 0.3 }} />
                  <span className="text-3xl md:text-4xl inv-display italic font-light" style={{ color: primaryColor }}>&</span>
                  <div className="w-10 h-px" style={{ backgroundColor: primaryColor, opacity: 0.3 }} />
                </div>
                <h1 className="text-4xl sm:text-5xl md:text-6xl inv-display font-medium tracking-wide" style={{ color: textDark }}>
                  {coupleNames[1].trim()}
                </h1>
              </div>
            ) : (
              <h1 className="text-4xl sm:text-5xl md:text-6xl inv-display font-medium tracking-wide" style={{ color: textDark }}>
                {heroTitle}
              </h1>
            )}
          </div>

          {dateObj && (
            <div className="inv-animate-d4">
              <div className="inline-block relative">
                <div className="absolute -inset-3 rounded-full inv-pulse-ring" style={{ border: `1px solid ${borderLight}` }} />
                <div
                  className="px-10 py-6 rounded-full relative"
                  style={{ border: `1px solid ${borderMedium}` }}
                >
                  <p className="text-[10px] tracking-[0.35em] uppercase inv-serif" style={{ color: primaryColor }}>
                    {dayName}
                  </p>
                  <p className="text-5xl md:text-6xl inv-display font-light leading-none my-1" style={{ color: primaryColor }}>
                    {dayNum}
                  </p>
                  <p className="text-[10px] tracking-[0.3em] uppercase inv-serif" style={{ color: primaryColor }}>
                    {monthName} {yearNum}
                  </p>
                </div>
              </div>
            </div>
          )}

          {storyBody && (
            <div className="inv-animate-d5">
              <p className="text-sm inv-serif leading-relaxed max-w-sm mx-auto italic" style={{ color: textSubtle }}>
                {storyBody.length > 180 ? storyBody.slice(0, 180) + "…" : storyBody}
              </p>
            </div>
          )}

          <div className="inv-animate-d5 pt-6">
            <ChevronDown className="h-5 w-5 mx-auto inv-float" style={{ color: textSubtle, opacity: 0.4 }} />
          </div>
        </div>
      </section>

      {couplePhoto && (
        <AnimatedSection className="px-6 pb-16 flex justify-center">
          <div className="relative max-w-sm w-full">
            <div className="absolute -inset-2 rounded-2xl" style={{ border: `1px solid ${borderLight}` }} />
            <img
              src={couplePhoto}
              alt={heroTitle}
              className="w-full aspect-[4/5] object-cover rounded-xl"
              style={{ border: `1px solid ${borderMedium}` }}
            />
          </div>
        </AnimatedSection>
      )}

      {programItems.length > 0 && (
        <section className="py-20 px-6">
          <AnimatedSection className="max-w-lg mx-auto">
            <div className="text-center mb-16 space-y-3">
              <p className="text-[10px] tracking-[0.4em] uppercase inv-serif" style={{ color: primaryColor }}>
                Le déroulement
              </p>
              <h2 className="text-4xl md:text-5xl inv-display font-medium italic" style={{ color: textDark }}>
                Programme
              </h2>
            </div>

            <div className="relative">
              <div
                className="absolute left-6 md:left-1/2 top-0 bottom-0 w-px md:-translate-x-px"
                style={{ background: `linear-gradient(to bottom, transparent, ${primaryColor}33, ${primaryColor}33, transparent)` }}
              />

              <div className="space-y-0">
                {programItems.map((item: any, idx: number) => {
                  const isRight = idx % 2 === 1;
                  return (
                    <AnimatedSection key={idx} delay={idx * 0.1}>
                      <div className={`relative flex items-start gap-6 py-8 ${isRight ? "md:flex-row-reverse" : ""}`}>
                        <div className="absolute left-6 md:left-1/2 top-1/2 -translate-y-1/2 -translate-x-1/2 z-10">
                          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: bgBase, border: `2px solid ${primaryColor}` }} />
                        </div>

                        <div className="w-0 md:w-[calc(50%-20px)]" />

                        <div className={`flex-1 pl-10 md:pl-0 ${isRight ? "md:pr-10 md:text-right" : "md:pl-10"}`}>
                          <div className="space-y-1.5">
                            <p className="text-lg md:text-xl inv-display font-light" style={{ color: primaryColor }}>
                              {(item.time || "").replace(":", "h")}
                            </p>
                            <h3 className="text-xs tracking-[0.2em] uppercase font-bold" style={{ color: textDark }}>
                              {item.title}
                            </h3>
                            {item.description && (
                              <p className="text-sm inv-serif" style={{ color: textSubtle }}>
                                {item.description}
                              </p>
                            )}
                            {item.location && (
                              <p className="text-xs inv-serif italic" style={{ color: textSubtle }}>
                                {item.location}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    </AnimatedSection>
                  );
                })}
              </div>
            </div>
          </AnimatedSection>
        </section>
      )}

      {locations.length > 0 && (
        <section className="py-20 px-6" style={{ backgroundColor: cardBg }}>
          <AnimatedSection className="max-w-lg mx-auto">
            <div className="text-center mb-14 space-y-3">
              <p className="text-[10px] tracking-[0.4em] uppercase inv-serif" style={{ color: primaryColor }}>
                Où nous retrouver
              </p>
              <h2 className="text-4xl md:text-5xl inv-display font-medium italic" style={{ color: textDark }}>
                Lieux
              </h2>
            </div>

            <div className="space-y-10">
              {locations.map((loc: any, idx: number) => (
                <AnimatedSection key={idx} delay={idx * 0.15}>
                  <div
                    className="rounded-xl p-8 text-center space-y-4 relative overflow-hidden"
                    style={{ backgroundColor: bgBase, border: `1px solid ${borderLight}` }}
                  >
                    <div className="w-10 h-10 mx-auto rounded-full flex items-center justify-center" style={{ backgroundColor: cardBg, border: `1px solid ${borderLight}` }}>
                      <MapPin className="h-4 w-4" style={{ color: primaryColor }} />
                    </div>
                    <h3 className="text-xs tracking-[0.2em] uppercase font-bold" style={{ color: textDark }}>
                      {loc.title}
                    </h3>
                    {loc.address && (
                      <p className="text-sm inv-serif" style={{ color: textSubtle }}>{loc.address}</p>
                    )}
                    {loc.description && (
                      <p className="text-sm inv-serif italic" style={{ color: textSubtle }}>{loc.description}</p>
                    )}
                    {loc.address && (
                      <a
                        href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(loc.address)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 text-[10px] tracking-[0.2em] uppercase font-semibold hover:opacity-70 transition-opacity"
                        style={{ color: primaryColor }}
                      >
                        <MapPin className="h-3 w-3" />
                        Itinéraire
                        <ExternalLink className="h-2.5 w-2.5" />
                      </a>
                    )}

                    {loc.accommodations && loc.accommodations.length > 0 && (
                      <div className="pt-4 mt-4 space-y-2" style={{ borderTop: `1px solid ${borderLight}` }}>
                        <div className="flex items-center justify-center gap-2">
                          <Bed className="h-3.5 w-3.5" style={{ color: primaryColor }} />
                          <span className="text-[10px] tracking-[0.2em] uppercase font-semibold" style={{ color: textSubtle }}>Hébergements</span>
                        </div>
                        {loc.accommodations.map((acc: any, accIdx: number) => (
                          <div key={accIdx} className="text-xs inv-serif" style={{ color: textSubtle }}>
                            <span className="font-medium" style={{ color: textDark }}>{acc.name}</span>
                            {acc.address && <span> — {acc.address}</span>}
                            {acc.url && (
                              <a href={acc.url} target="_blank" rel="noopener noreferrer" className="ml-1.5 inline-flex items-center hover:opacity-70 transition-opacity" style={{ color: primaryColor }}>
                                <ExternalLink className="h-2.5 w-2.5" />
                              </a>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </AnimatedSection>
              ))}
            </div>
          </AnimatedSection>
        </section>
      )}

      <AnimatedSection className="py-20 px-6 text-center">
        <FloralDivider color={primaryColor} />
        <div className="max-w-sm mx-auto space-y-4 py-4">
          <p className="text-lg md:text-xl inv-serif italic leading-relaxed" style={{ color: textDark }}>
            Nous nous réjouissons de partager ce moment avec vous.
          </p>
          <p className="text-sm inv-serif" style={{ color: textSubtle }}>
            Apportez votre bonne humeur, préparez vos plus beaux pas de danse.
          </p>
        </div>
        <FloralDivider color={primaryColor} />
      </AnimatedSection>

      {dressCode && (
        <AnimatedSection className="py-6 px-6">
          <div className="max-w-sm mx-auto">
            <div
              className="rounded-xl p-8 text-center space-y-4 relative"
              style={{ backgroundColor: cardBg, border: `1px solid ${borderLight}` }}
            >
              <Sparkles className="h-5 w-5 mx-auto" style={{ color: primaryColor }} />
              <h3 className="text-xs tracking-[0.2em] uppercase font-bold" style={{ color: textDark }}>
                Dress Code
              </h3>
              <p className="text-sm inv-serif" style={{ color: textDark }}>
                {dressCode}
              </p>
            </div>
          </div>
        </AnimatedSection>
      )}

      {cagnotteHref && (
        <AnimatedSection className="py-20 px-6">
          <div className="max-w-sm mx-auto text-center space-y-6">
            <div className="w-14 h-14 mx-auto rounded-full flex items-center justify-center" style={{ backgroundColor: cardBg, border: `1px solid ${borderLight}` }}>
              <Gift className="h-6 w-6" style={{ color: primaryColor }} />
            </div>
            <div className="space-y-3">
              <p className="text-[10px] tracking-[0.4em] uppercase inv-serif" style={{ color: primaryColor }}>
                Notre cagnotte
              </p>
              <h2 className="text-3xl md:text-4xl inv-display font-medium italic" style={{ color: textDark }}>
                {cagnotteTitle}
              </h2>
            </div>
            <p className="text-sm inv-serif leading-relaxed" style={{ color: textSubtle }}>
              {cagnotteDescription}
            </p>
            <a
              href={cagnotteHref}
              target={cagnotteMode === "external" ? "_blank" : undefined}
              rel={cagnotteMode === "external" ? "noopener noreferrer" : undefined}
              className="inline-flex items-center gap-2.5 px-10 py-3.5 text-[10px] tracking-[0.3em] uppercase font-bold text-white transition-all hover:opacity-90 hover:shadow-lg rounded-full"
              style={{ backgroundColor: primaryColor }}
            >
              <Gift className="h-3.5 w-3.5" />
              Participer
            </a>
          </div>
        </AnimatedSection>
      )}

      {galleryImages.length > 0 && (
        <AnimatedSection className="py-16 px-6">
          <div className="max-w-lg mx-auto">
            <div className="text-center mb-10 space-y-2">
              <p className="text-[10px] tracking-[0.4em] uppercase inv-serif" style={{ color: primaryColor }}>
                Quelques souvenirs
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {galleryImages.slice(0, 4).map((img: string, idx: number) => (
                <AnimatedSection key={idx} delay={idx * 0.1}>
                  <div className="aspect-square rounded-lg overflow-hidden" style={{ border: `1px solid ${borderLight}` }}>
                    <img src={img} alt="" className="w-full h-full object-cover" />
                  </div>
                </AnimatedSection>
              ))}
            </div>
          </div>
        </AnimatedSection>
      )}

      <AnimatedSection className="py-6 px-6 text-center">
        <FloralDivider color={primaryColor} />
        <p className="text-xs inv-serif pt-2" style={{ color: textSubtle }}>
          Pour des raisons d'organisation, nous vous remercions de ne pas inviter de personnes supplémentaires.
        </p>
      </AnimatedSection>

      {qrDataUrl && (
        <AnimatedSection className="py-16 px-6">
          <div className="max-w-sm mx-auto text-center space-y-4">
            <div
              className="inline-block p-6 rounded-2xl relative"
              style={{ backgroundColor: cardBg, border: `1px solid ${borderLight}` }}
            >
              <div className="absolute -inset-1 rounded-2xl" style={{ border: `1px solid ${borderLight}`, opacity: 0.5 }} />
              <img src={qrDataUrl} alt="QR code invitation" className="h-28 w-28 mx-auto relative" />
            </div>
            <p className="text-[10px] tracking-[0.2em] uppercase inv-serif" style={{ color: textSubtle }}>
              Scannez pour ouvrir votre invitation
            </p>
          </div>
        </AnimatedSection>
      )}

      <footer className="py-12 px-6 text-center space-y-4">
        <MonogramSeal names={coupleNames} color={primaryColor} />
        <p className="text-[10px] tracking-[0.15em] uppercase inv-serif" style={{ color: textSubtle, opacity: 0.5 }}>
          {heroTitle}
        </p>
      </footer>
    </div>
  );
}
