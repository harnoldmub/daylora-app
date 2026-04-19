import React, { useEffect, useState, useRef } from "react";
import type { Wedding } from "@shared/schema";
import { getTokens } from "@/design-system/tokens";
import { resolveFontProfile } from "@/lib/font-profiles";
import { getSiteLanguagePack } from "@/lib/site-language";
import { usePublicEdit } from "@/contexts/public-edit";
import { motion, useScroll, useTransform, useSpring } from "framer-motion";
import { MapPin, Camera, Trash2, Plus, ChevronDown, Menu, X } from "lucide-react";
import type { LocationItem, ProgramItem } from "@/features/public-site/types";
import { InlineEditor } from "@/components/ui/inline-editor";
import { RSVPSection, GiftsSection, CagnotteSection } from "@/features/public-site/sections";

export function ParallaxTemplateRenderer(props: any) {
  const { wedding, draftMedia, gifts, slug, basePath = "" } = props;
  const { canEdit, editMode } = usePublicEdit();

  const languagePack = getSiteLanguagePack((wedding.config as any)?.language);
  const activeFont = wedding.config?.theme?.fontFamily || "sans";
  const fontClass = resolveFontProfile(activeFont).baseClass;

  // Theme colors from admin settings — default to warm deep stone (no blue tint)
  const primaryColor = wedding.config?.theme?.primaryColor || "#1C1917";
  const secondaryColor = wedding.config?.theme?.secondaryColor || "#F9F7F4";
  const logoTextStyle = (wedding.config?.branding as any)?.logoTextStyle || "elegant";

  // Card text colors — dynamic based on background brightness
  const isDarkBg = (hex: string) => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return (r * 299 + g * 587 + b * 114) / 1000 < 128;
  };

  const isMainDark = isDarkBg(secondaryColor);
  
  // Dynamic text colors — always adopting the hue of primaryColor
  const CARD_TEXT = isMainDark 
    ? `color-mix(in srgb, ${primaryColor} 10%, white)` 
    : `color-mix(in srgb, ${primaryColor} 85%, black)`;
  
  const CARD_SUB = isMainDark 
    ? `color-mix(in srgb, ${primaryColor} 25%, white)` 
    : `color-mix(in srgb, ${primaryColor} 65%, black)`;
    
  const CARD_MUTE = isMainDark 
    ? `color-mix(in srgb, ${primaryColor} 40%, white)` 
    : `color-mix(in srgb, ${primaryColor} 45%, black)`;

  const sectionBg = isMainDark 
    ? `color-mix(in srgb, ${primaryColor} 20%, ${secondaryColor})`
    : `color-mix(in srgb, ${primaryColor} 8%, ${secondaryColor})`;
    
  const cardBg = isMainDark
    ? `color-mix(in srgb, ${primaryColor} 12%, ${secondaryColor})`
    : "#FFFFFF";
    
  const cardBorder = isMainDark
    ? `${primaryColor}30`
    : `color-mix(in srgb, ${primaryColor} 15%, transparent)`;

  const cssVars = {
    "--wedding-primary": primaryColor,
    "--wedding-secondary": secondaryColor,
    "--wedding-text-dark": primaryColor,
  } as React.CSSProperties;

  const tokens = getTokens("echo");

  // ── Texts ──────────────────────────────────────────────
  const siteTitle = wedding.config?.texts?.siteTitle || wedding.title;
  const heroTitle = wedding.config?.texts?.heroTitle || wedding.title || "LÉONIE & HUGO";
  const heroSubtitle = wedding.config?.texts?.heroSubtitle || languagePack.texts.heroSubtitle;
  const heroCta = wedding.config?.texts?.heroCta || languagePack.texts.heroCta;
  const heroDate = wedding.config?.texts?.weddingDate || "14 Juin 2027";

  const storyTitle = wedding.config?.texts?.storyTitle || languagePack.texts.storyTitle;
  const storyBody = wedding.config?.texts?.storyBody || "Tout a commencé par un regard, puis un rire, et enfin une évidence. Aujourd'hui, nous tournons une nouvelle page et sommes honorés de vous avoir à nos côtés.";

  const rsvpTitle = wedding.config?.texts?.rsvpTitle || languagePack.texts.rsvpTitle;
  const rsvpDescription = wedding.config?.texts?.rsvpDescription || languagePack.texts.rsvpDescription;
  const rsvpButton = wedding.config?.texts?.rsvpButton || languagePack.texts.rsvpButton;

  const giftsTitle = (wedding.config?.texts as any)?.giftsTitle || languagePack.texts.giftsTitle;
  const giftsDescription = (wedding.config?.texts as any)?.giftsDescription || languagePack.texts.giftsDescription;
  const cagnotteTitle = wedding.config?.texts?.cagnotteTitle || languagePack.texts.cagnotteTitle;
  const cagnotteDescription = wedding.config?.texts?.cagnotteDescription || languagePack.texts.cagnotteDescription;

  const footerTitle = (wedding.config?.texts as any)?.footerTitle || "On a hâte de vous voir";
  const footerSubtitle = (wedding.config?.texts as any)?.footerSubtitle || "Merci de faire partie de cette aventure.";
  const footerCopyright = (wedding.config?.texts as any)?.footerCopyright || "© 2026. Tous droits réservés.";

  const galleryTitle = wedding.config?.texts?.galleryTitle || languagePack.texts.galleryTitle;
  const programTitle = wedding.config?.texts?.programTitle || languagePack.texts.programTitle;
  const locationTitle = wedding.config?.texts?.locationTitle || languagePack.texts.locationTitle;

  // ── Media ──────────────────────────────────────────────
  const heroImage = draftMedia?.heroImage || wedding.config?.media?.heroImage || "/templates/echo/hero-echo.jpg";
  const couplePhoto = draftMedia?.couplePhoto || wedding.config?.media?.couplePhoto || "https://images.unsplash.com/photo-1511285560929-80b456fea0bc?w=1200&q=85";

  const rawGallery = wedding.config?.sections?.galleryImages?.length
    ? wedding.config.sections.galleryImages
    : (wedding.config?.media as any)?.galleryImages?.length
    ? (wedding.config.media as any).galleryImages
    : [];
  const galleryImages = rawGallery.length > 0 ? rawGallery : [
    "https://images.unsplash.com/photo-1606800052052-a08af7148866?w=800&q=80",
    "https://images.unsplash.com/photo-1519225421980-715cb0215aed?w=800&q=80",
    "https://images.unsplash.com/photo-1511285560929-80b456fea0bc?w=800&q=80",
    "https://images.unsplash.com/photo-1519741497674-611481863552?w=800&q=80",
  ];

  // ── Sections data ──────────────────────────────────────
  const rawLocationItems = (wedding.config?.sections?.locationItems?.length ? wedding.config.sections.locationItems : []) as LocationItem[];
  const locationItems = rawLocationItems.length > 0 ? rawLocationItems : [
    { title: "Cérémonie", address: "Mairie centrale", description: "La célébration officielle de notre union." } as LocationItem,
    { title: "Réception", address: "Le Grand Domaine", description: "Cocktail, dîner et soirée dansante." } as LocationItem,
  ];

  const rawProgramItems = (wedding.config?.sections?.programItems?.length ? wedding.config.sections.programItems : []) as ProgramItem[];
  const programItems = rawProgramItems.length > 0 ? rawProgramItems : [
    { time: "15:30", title: "Accueil", description: "Verre de bienvenue" } as ProgramItem,
    { time: "16:00", title: "Cérémonie laïque", description: "Échange des vœux" } as ProgramItem,
    { time: "19:00", title: "Cocktail", description: "Buffet et musique live" } as ProgramItem,
  ];

  // Gifts & cagnotte
  const giftsData = (gifts && gifts.length > 0) ? gifts : [
    {
      id: "demo1",
      title: "Lune de miel à Santorini",
      description: "Aidez-nous à financer notre voyage de noces en Grèce — une semaine dans une villa avec vue sur la caldeira.",
      price: 300,
      currentAmount: 0,
      url: "",
      imageUrl: "https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?w=800&q=85",
      isDemo: true
    },
    {
      id: "demo2",
      title: "Dîner gastronomique",
      description: "Offrez-nous une soirée inoubliable dans un restaurant étoilé pour célébrer notre premier anniversaire.",
      price: 180,
      currentAmount: 0,
      url: "",
      imageUrl: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800&q=85",
      isDemo: true
    },
    {
      id: "demo3",
      title: "Service de table en porcelaine",
      description: "Pour habiller notre table lors de nos futurs dîners en famille. Un investissement pour toute une vie.",
      price: 220,
      currentAmount: 0,
      url: "",
      imageUrl: "https://images.unsplash.com/photo-1604999333679-b86d54738315?w=800&q=85",
      isDemo: true
    },
    {
      id: "demo4",
      title: "Week-end spa en amoureux",
      description: "Un séjour bien-être dans un hôtel 5 étoiles pour décompresser après toute l'organisation du mariage.",
      price: 250,
      currentAmount: 0,
      url: "",
      imageUrl: "https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=800&q=85",
      isDemo: true
    },
  ];

  const rawContributionMethods = wedding.config?.payments?.contributionMethods || [];
  const contributionMethods = rawContributionMethods.length > 0 ? rawContributionMethods : [
    { id: "demo1", type: "bank", enabled: true, title: "Virement Bancaire", details: "FR76 0000 0000 0000 0000 0000 000\nBIC: BNPAFRPP", sortOrder: 0, accountHolder: wedding.title, iban: "FR76 0000 0000 0000 0000 0000 000", bic: "BNPAFRPP" },
    { id: "demo2", type: "phone", enabled: true, title: "Lydia / Paylib", details: "+33 6 00 00 00 00", sortOrder: 1, number: "+33 6 00 00 00 00", label: "Mobile" },
  ];

  // ── Navigation ─────────────────────────────────────────
  const pageVisibility = {
    rsvp: wedding.config?.navigation?.pages?.rsvp ?? true,
    cagnotte: wedding.config?.navigation?.pages?.cagnotte ?? true,
    gifts: (wedding.config?.navigation?.pages as any)?.gifts ?? true,
    story: wedding.config?.navigation?.pages?.story ?? true,
    gallery: wedding.config?.navigation?.pages?.gallery ?? true,
    location: wedding.config?.navigation?.pages?.location ?? true,
    program: wedding.config?.navigation?.pages?.program ?? true,
  };

  const navItems = [
    { id: "story", label: languagePack.menuLabels.story, show: pageVisibility.story },
    { id: "program", label: languagePack.menuLabels.program, show: pageVisibility.program },
    { id: "gallery", label: galleryTitle, show: pageVisibility.gallery },
    { id: "location", label: languagePack.menuLabels.location, show: pageVisibility.location },
    ...(pageVisibility.gifts && (wedding.config?.features?.giftsEnabled ?? true) ? [{ id: "gifts", label: languagePack.menuLabels.gifts, show: true }] : []),
    ...(pageVisibility.cagnotte ? [{ id: "cagnotte", label: languagePack.texts.navCagnotte, show: true }] : []),
    { id: "rsvp", label: "RSVP", show: pageVisibility.rsvp },
  ].filter(i => i.show);

  // ── Branding ───────────────────────────────────────────
  const logoUrl = wedding.config?.branding?.logoUrl || "";
  const logoText = wedding.config?.branding?.logoText || wedding.title;

  // ── State ──────────────────────────────────────────────
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 60);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // ── Parallax ───────────────────────────────────────────
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll();
  const smoothY = useSpring(scrollYProgress, { damping: 25, mass: 0.5, stiffness: 80 });

  const heroImageY = useTransform(smoothY, [0, 0.25], ["0%", "20%"]);
  const heroTextY  = useTransform(smoothY, [0, 0.2],  ["0%", "-25%"]);
  const heroOpacity = useTransform(smoothY, [0, 0.18], [1, 0]);
  const storyImageY = useTransform(smoothY, [0.1, 0.35], ["8%", "-8%"]);
  const colOneY = useTransform(smoothY, [0.45, 0.75], ["6%", "-4%"]);
  const colTwoY = useTransform(smoothY, [0.45, 0.75], ["-4%", "6%"]);

  // ── Save helpers (footer) ──────────────────────────────
  const saveFooterField = (key: string, value: string) => {
    props.onSaveText && props.onSaveText(key, value);
  };

  return (
    <div
      ref={containerRef}
      className={`min-h-screen overflow-x-hidden ${fontClass}`}
      style={{ ...cssVars, backgroundColor: secondaryColor, color: primaryColor }}
    >

      {/* ── HEADER ── */}
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-700 ${
          isScrolled
            ? "py-4 shadow-sm border-b"
            : "py-8 bg-transparent"
        }`}
        style={{
          backgroundColor: isScrolled ? `${secondaryColor}ee` : "transparent",
          backdropFilter: isScrolled ? "blur(16px)" : "none",
          borderColor: isScrolled ? `${primaryColor}15` : "transparent",
        }}
      >
        <div className="max-w-[1800px] mx-auto px-8 md:px-14 flex items-center justify-between gap-6">
          {/* Logo — elegant typographic branding */}
          <a href={`${basePath}#hero`} className="flex items-center gap-3 shrink-0">
            {logoUrl ? (
              <img src={logoUrl} alt={logoText} className="h-9 w-auto object-contain" />
            ) : (
              <div className="flex items-center gap-0 leading-none" style={{ color: primaryColor }}>
                <span
                  className="font-semibold tracking-[0.08em] uppercase"
                  style={{ fontSize: "0.9rem", letterSpacing: "0.12em" }}
                >
                  {(logoText || wedding.title).split(" ").slice(0, 1).join(" ")}
                </span>
                <span
                  className="font-extralight tracking-[0.06em] uppercase ml-1.5"
                  style={{ fontSize: "0.9rem", letterSpacing: "0.1em", opacity: 0.55 }}
                >
                  {(logoText || wedding.title).split(" ").slice(1).join(" ")}
                </span>
              </div>
            )}
          </a>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-8">
            {navItems.map((item) => (
              <a
                key={item.id}
                href={`${basePath}#${item.id}`}
                className={`text-xs font-semibold uppercase tracking-[0.2em] transition-all duration-300 ${
                  item.id === "rsvp"
                    ? "rounded-full px-5 py-2.5 border hover:opacity-80"
                    : "hover:opacity-50"
                }`}
                style={{
                  color: primaryColor,
                  ...(item.id === "rsvp" ? { borderColor: `${primaryColor}40` } : {}),
                }}
              >
                {item.label}
              </a>
            ))}
          </nav>

          {/* Mobile burger */}
          <button
            className="md:hidden p-2 rounded-full transition-colors"
            style={{ color: primaryColor }}
            onClick={() => setMobileMenuOpen(v => !v)}
            aria-label="Menu"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile nav drawer */}
        {mobileMenuOpen && (
          <div
            className="md:hidden absolute top-full left-0 right-0 border-t py-6 px-8 flex flex-col gap-5"
            style={{
              backgroundColor: secondaryColor,
              borderColor: `${primaryColor}15`,
            }}
          >
            {navItems.map((item) => (
              <a
                key={item.id}
                href={`${basePath}#${item.id}`}
                className="text-sm font-semibold uppercase tracking-[0.18em] hover:opacity-50 transition-opacity"
                style={{ color: primaryColor }}
                onClick={() => setMobileMenuOpen(false)}
              >
                {item.label}
              </a>
            ))}
          </div>
        )}
      </header>

      {/* ── HERO PARALLAX ── */}
      <section id="hero" className="relative h-screen w-full flex items-center justify-center overflow-hidden">
        {/* Parallax bg image */}
        <motion.div
          style={{ y: heroImageY }}
          className="absolute inset-0 w-full h-[125%] -top-[12.5%]"
        >
          <img src={heroImage} alt="Hero" className="w-full h-full object-cover" />
          {/* Subtle overlay to ensure text readability */}
          <div className="absolute inset-0" style={{ background: `linear-gradient(to bottom, ${secondaryColor}55 0%, transparent 30%, transparent 60%, ${secondaryColor}88 100%)` }} />
        </motion.div>

        {/* Upload button (edit mode) */}
        {canEdit && editMode && (
          <label className="absolute top-28 right-10 bg-white/90 backdrop-blur shadow-xl rounded-full p-4 cursor-pointer border border-black/10 hover:bg-white transition-all z-30">
            <Camera className="w-5 h-5" style={{ color: primaryColor }} />
            <input type="file" className="hidden" accept="image/*" onChange={props.onMediaUpload?.("heroImage")} />
          </label>
        )}

        {/* Hero text - floating up on scroll */}
        <motion.div
          style={{ y: heroTextY, opacity: heroOpacity }}
          className="relative z-20 flex flex-col items-center text-center px-6 mt-20"
        >
          {/* Eyebrow */}
          <div className="text-xs md:text-sm font-semibold tracking-[0.5em] uppercase mb-10 opacity-70" style={{ color: primaryColor }}>
            <InlineEditor
              value={heroSubtitle}
              onSave={(val) => props.onSaveText?.("heroSubtitle", val)}
              canEdit={canEdit && editMode}
              placeholder="Sous-titre"
            />
          </div>

          {/* Main title — giant, light weight */}
          <h1
            className="font-light leading-[0.82] tracking-tighter mb-10"
            style={{
              color: primaryColor,
              fontSize: "clamp(3.5rem, 12vw, 13rem)",
            }}
          >
            <InlineEditor
              value={heroTitle}
              onSave={(val) => props.onSaveText?.("heroTitle", val)}
              canEdit={canEdit && editMode}
              placeholder={wedding.title}
            />
          </h1>

          {/* Date + venue — the missing luxury detail */}
          <div className="flex flex-col items-center gap-5 mt-10">
            {/* Thin ornament line */}
            <div className="flex items-center gap-4 w-full max-w-xs opacity-30" style={{ color: primaryColor }}>
              <div className="flex-1 h-px" style={{ backgroundColor: primaryColor }} />
              <span className="text-[10px] tracking-[0.4em] font-light">✦</span>
              <div className="flex-1 h-px" style={{ backgroundColor: primaryColor }} />
            </div>

            {/* Date prominently */}
            <div
              className="text-lg md:text-2xl font-light tracking-[0.35em] uppercase"
              style={{ color: primaryColor }}
            >
              <InlineEditor
                value={heroDate}
                onSave={(val) => props.onSaveText?.("weddingDate", val)}
                canEdit={canEdit && editMode}
                placeholder="14 Juin 2027"
              />
            </div>

            {/* Venue — pulled from first location item if available */}
            {locationItems[0]?.address && (
              <div
                className="text-[11px] md:text-xs font-semibold tracking-[0.45em] uppercase opacity-45"
                style={{ color: primaryColor }}
              >
                {locationItems[0].address}
              </div>
            )}
          </div>
        </motion.div>

        {/* Scroll CTA button */}
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-30 flex flex-col items-center gap-4">
          <button
            onClick={props.onHeroCtaClick}
            className="px-10 py-5 text-xs font-semibold tracking-widest uppercase rounded-full shadow-2xl transition-all hover:scale-105 active:scale-95"
            style={{ backgroundColor: primaryColor, color: secondaryColor }}
          >
            <InlineEditor
              value={heroCta}
              onSave={(val) => props.onSaveText?.("heroCta", val)}
              canEdit={canEdit && editMode}
              placeholder="CTA"
            />
          </button>
          <ChevronDown className="w-5 h-5 animate-bounce opacity-40" style={{ color: primaryColor }} />
        </div>
      </section>

      {/* ── STORY ── */}
      {pageVisibility.story && (
        <section
          id="story"
          className="relative py-36 px-6 md:px-14 max-w-[1400px] mx-auto z-10"
          style={{ backgroundColor: secondaryColor }}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-16 md:gap-28 items-center">
            {/* Text */}
            <div className="space-y-10 order-2 md:order-1">
              <h2
                className="font-light tracking-tight leading-tight"
                style={{ color: primaryColor, fontSize: "clamp(2.5rem, 5vw, 5rem)" }}
              >
                <InlineEditor
                  value={storyTitle}
                  onSave={(val) => props.onSaveText?.("storyTitle", val)}
                  canEdit={canEdit && editMode}
                />
              </h2>
              <p className="text-lg md:text-xl font-light leading-relaxed opacity-65" style={{ color: primaryColor }}>
                <InlineEditor
                  value={storyBody}
                  onSave={(val) => props.onSaveText?.("storyBody", val)}
                  canEdit={canEdit && editMode}
                  isTextArea
                />
              </p>
              <div className="w-20 h-px opacity-25" style={{ backgroundColor: primaryColor }} />
            </div>

            {/* Photo with parallax */}
            <motion.div
              style={{ y: storyImageY }}
              className="relative h-[70vh] md:h-[80vh] order-1 md:order-2 overflow-hidden rounded-[2rem] shadow-2xl group"
            >
              <img src={couplePhoto} alt="Couple" className="w-full h-full object-cover" />
              {canEdit && editMode && (
                <label className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer text-white flex-col gap-2">
                  <Camera className="w-8 h-8" />
                  <span className="text-xs font-bold uppercase tracking-widest">Modifier</span>
                  <input type="file" className="hidden" accept="image/*" onChange={props.onMediaUpload?.("couplePhoto")} />
                </label>
              )}
            </motion.div>
          </div>
        </section>
      )}

      {/* ── PROGRAMME & LIEUX ── */}
      {(pageVisibility.program || pageVisibility.location) && (
        <section
          id="program"
          className="py-36 mx-4 md:mx-8 my-16 rounded-[3rem]"
          style={{ backgroundColor: sectionBg }}
        >
          <div className="max-w-7xl mx-auto px-6 md:px-16 grid grid-cols-1 lg:grid-cols-2 gap-24">

            {/* Programme */}
            {pageVisibility.program && (
              <div className="space-y-12">
                <div className="flex items-center justify-between pb-6" style={{ borderBottom: `1px solid ${primaryColor}20` }}>
                  <h2 className="text-4xl font-light tracking-tight" style={{ color: primaryColor }}>
                    <InlineEditor value={programTitle} onSave={(val) => props.onSaveText?.("programTitle", val)} canEdit={canEdit && editMode} />
                  </h2>
                  {canEdit && editMode && (
                    <button onClick={props.onAddProgramItem} className="p-2 rounded-full transition-colors opacity-50 hover:opacity-100" style={{ color: primaryColor }}>
                      <Plus className="w-6 h-6" />
                    </button>
                  )}
                </div>
                <div className="space-y-6">
                  {programItems.map((item, idx) => (
                    <div
                      key={idx}
                      className="flex gap-8 p-7 rounded-2xl border group relative transition-all hover:-translate-y-0.5 shadow-sm"
                      style={{ backgroundColor: cardBg, borderColor: cardBorder }}
                    >
                      <div className="text-lg font-light w-16 shrink-0" style={{ color: CARD_MUTE }}>
                        <InlineEditor value={item.time || ""} onSave={(val) => props.onUpdateProgramItem?.(idx.toString(), { time: val })} canEdit={canEdit && editMode} />
                      </div>
                      <div className="flex-1">
                        <h4 className="text-xl font-medium mb-2" style={{ color: CARD_TEXT }}>
                          <InlineEditor value={item.title} onSave={(val) => props.onUpdateProgramItem?.(idx.toString(), { title: val })} canEdit={canEdit && editMode} />
                        </h4>
                        <p className="text-sm leading-relaxed" style={{ color: CARD_SUB }}>
                          <InlineEditor value={item.description || ""} onSave={(val) => props.onUpdateProgramItem?.(idx.toString(), { description: val })} canEdit={canEdit && editMode} />
                        </p>
                      </div>
                      {canEdit && editMode && (
                        <button onClick={() => props.onDeleteProgramItem?.(idx.toString())} className="absolute right-5 top-5 opacity-0 group-hover:opacity-100 text-red-400 transition-opacity">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Lieux */}
            {pageVisibility.location && (
              <div id="location" className="space-y-12">
                <div className="flex items-center justify-between pb-6" style={{ borderBottom: `1px solid ${primaryColor}20` }}>
                  <h2 className="text-4xl font-light tracking-tight" style={{ color: primaryColor }}>
                    <InlineEditor value={locationTitle} onSave={(val) => props.onSaveText?.("locationTitle", val)} canEdit={canEdit && editMode} />
                  </h2>
                  {canEdit && editMode && (
                    <button onClick={props.onAddLocationItem} className="p-2 rounded-full opacity-50 hover:opacity-100" style={{ color: primaryColor }}>
                      <Plus className="w-6 h-6" />
                    </button>
                  )}
                </div>
                <div className="space-y-6">
                  {locationItems.map((item, idx) => (
                    <div
                      key={idx}
                      className="p-8 rounded-2xl border group relative transition-all hover:-translate-y-0.5 shadow-sm"
                      style={{ backgroundColor: cardBg, borderColor: cardBorder }}
                    >
                      <h4 className="text-xl font-medium mb-4" style={{ color: CARD_TEXT }}>
                        <InlineEditor value={item.title} onSave={(val) => props.onUpdateLocationItem?.(idx.toString(), { title: val })} canEdit={canEdit && editMode} />
                      </h4>
                      <div className="flex gap-3 items-start text-sm mb-3" style={{ color: CARD_MUTE }}>
                        <MapPin className="w-4 h-4 mt-0.5 shrink-0" />
                        <InlineEditor value={item.address} onSave={(val) => props.onUpdateLocationItem?.(idx.toString(), { address: val })} canEdit={canEdit && editMode} />
                      </div>
                      <p className="text-sm leading-relaxed" style={{ color: CARD_SUB }}>
                        <InlineEditor value={item.description || ""} onSave={(val) => props.onUpdateLocationItem?.(idx.toString(), { description: val })} canEdit={canEdit && editMode} />
                      </p>
                      {canEdit && editMode && (
                        <button onClick={() => props.onDeleteLocationItem?.(idx.toString())} className="absolute top-6 right-6 opacity-0 group-hover:opacity-100 text-red-400 transition-opacity">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </section>
      )}

      {/* ── GALLERY ── */}
      {pageVisibility.gallery && (
        <section id="gallery" className="py-36 px-6 md:px-14 overflow-hidden max-w-[1600px] mx-auto">
          <div className="flex justify-between items-end mb-20">
            <h2
              className="font-light tracking-tighter"
              style={{ color: primaryColor, fontSize: "clamp(3rem, 7vw, 7rem)" }}
            >
              {galleryTitle}
            </h2>
            {canEdit && editMode && (
              <label
                className="flex gap-3 items-center text-xs font-semibold uppercase tracking-widest px-8 py-4 rounded-full cursor-pointer hover:opacity-80 transition-opacity shadow-xl"
                style={{ backgroundColor: primaryColor, color: secondaryColor }}
              >
                <Camera className="w-4 h-4" /> Ajouter
                <input type="file" multiple className="hidden" accept="image/*" onChange={props.onGalleryFilesSelected} />
              </label>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 items-start">
            <motion.div style={{ y: colOneY }} className="grid gap-8 md:gap-12">
              {galleryImages.filter((_: any, i: number) => i % 2 === 0).map((src: any, idx: number) => (
                <div key={idx} className="relative group overflow-hidden rounded-[2rem] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.12)]">
                  <img src={typeof src === "string" ? src : src.url} alt="Galerie" className="w-full object-cover transition-transform duration-700 group-hover:scale-105" />
                  {canEdit && editMode && (
                    <button onClick={() => props.onRemoveGalleryImage?.(idx * 2)} className="absolute top-5 right-5 bg-red-500 text-white p-3 rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-lg">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </motion.div>
            <motion.div style={{ y: colTwoY }} className="grid gap-8 md:gap-12 md:mt-32">
              {galleryImages.filter((_: any, i: number) => i % 2 !== 0).map((src: any, idx: number) => (
                <div key={idx} className="relative group overflow-hidden rounded-[2rem] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.12)]">
                  <img src={typeof src === "string" ? src : src.url} alt="Galerie" className="w-full object-cover transition-transform duration-700 group-hover:scale-105" />
                  {canEdit && editMode && (
                    <button onClick={() => props.onRemoveGalleryImage?.(idx * 2 + 1)} className="absolute top-5 right-5 bg-red-500 text-white p-3 rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-lg">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </motion.div>
          </div>
        </section>
      )}

      {/* ── RSVP ── */}
      {pageVisibility.rsvp && (
        <section id="rsvp" className="py-28 px-6 md:px-14 max-w-[1300px] mx-auto">
          <div className="mb-14 text-center">
            <h2
              className="font-light tracking-tight mb-4"
              style={{ color: primaryColor, fontSize: "clamp(2.5rem, 5vw, 5rem)" }}
            >
              <InlineEditor value={rsvpTitle} onSave={(val) => props.onSaveText?.("rsvpTitle", val)} canEdit={canEdit && editMode} />
            </h2>
            <p className="text-lg font-light opacity-55" style={{ color: primaryColor }}>
              <InlineEditor value={rsvpDescription} onSave={(val) => props.onSaveText?.("rsvpDescription", val)} canEdit={canEdit && editMode} />
            </p>
          </div>
          <RSVPSection
            {...props}
            tokens={tokens}
            rsvpTitle=""
            rsvpSubtitle=""
            rsvpButton={rsvpButton}
            buttonRadiusClass="rounded-full"
            order={0}
          />
        </section>
      )}

      {/* ── GIFTS ── */}
      {pageVisibility.gifts && (wedding.config?.features?.giftsEnabled ?? true) && (
        <GiftsSection
          {...props}
          tokens={tokens}
          giftsTitle={giftsTitle}
          giftsDescription={giftsDescription}
          gifts={giftsData}
          buttonRadiusClass="rounded-full"
          order={1}
        />
      )}

      {/* ── CAGNOTTE ── */}
      {pageVisibility.cagnotte && (
        <CagnotteSection
          {...props}
          tokens={tokens}
          cagnotteTitle={cagnotteTitle}
          cagnotteDescription={cagnotteDescription}
          contributionMethods={contributionMethods}
          buttonRadiusClass="rounded-full"
          order={2}
        />
      )}

      {/* ── FOOTER ── */}
      <footer
        className="py-20 text-center relative z-10 border-t"
        style={{ borderColor: `${primaryColor}12`, backgroundColor: secondaryColor }}
      >
        <div className="max-w-2xl mx-auto px-6">
          {/* Title */}
          <div
            className="text-3xl font-light tracking-widest uppercase mb-3"
            style={{ color: primaryColor }}
          >
            {siteTitle}
          </div>
          {heroDate && (
            <div className="text-xs font-semibold tracking-[0.4em] uppercase opacity-35 mb-10" style={{ color: primaryColor }}>
              {heroDate}
            </div>
          )}

          {/* Editable footer content */}
          <div className="font-medium text-base mb-2 opacity-75" style={{ color: primaryColor }}>
            <InlineEditor
              value={footerTitle}
              onSave={(v) => saveFooterField("footerTitle", v)}
              canEdit={canEdit && editMode}
              placeholder="On a hâte de vous voir"
            />
          </div>
          <div className="text-sm font-light opacity-45 mb-10" style={{ color: primaryColor }}>
            <InlineEditor
              value={footerSubtitle}
              onSave={(v) => saveFooterField("footerSubtitle", v)}
              canEdit={canEdit && editMode}
              placeholder="Merci de faire partie de cette aventure."
              isTextArea
            />
          </div>

          <div className="text-xs opacity-30 mb-2" style={{ color: primaryColor }}>
            <InlineEditor
              value={footerCopyright}
              onSave={(v) => saveFooterField("footerCopyright", v)}
              canEdit={canEdit && editMode}
              placeholder="© 2026. Tous droits réservés."
            />
          </div>
          <div className="text-[11px] uppercase tracking-[0.25em] font-semibold opacity-25" style={{ color: primaryColor }}>
            Propulsé par{" "}
            <a
              href="https://daylora.app"
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:opacity-100 transition-opacity"
            >
              Daylora
            </a>
          </div>
        </div>
      </footer>

    </div>
  );
}
