import React, { useEffect, useState } from "react";
import { resolveFontProfile } from "@/lib/font-profiles";
import { getSiteLanguagePack } from "@/lib/site-language";
import { usePublicEdit } from "@/contexts/public-edit";
import { getTokens } from "@/design-system/tokens";
import { motion, useScroll, useTransform } from "framer-motion";
import { MapPin, Menu, X } from "lucide-react";
import type { LocationItem, ProgramItem } from "@/features/public-site/types";
import { InlineEditor } from "@/components/ui/inline-editor";
import { RSVPSection, GiftsSection, CagnotteSection } from "@/features/public-site/sections";

export function GraphikTemplateRenderer(props: any) {
  const { wedding, draftMedia, gifts, slug, basePath = "" } = props;
  const { canEdit, editMode } = usePublicEdit();

  const languagePack = getSiteLanguagePack((wedding.config as any)?.language);
  const activeFont = wedding.config?.theme?.fontFamily || "sans";
  const fontClass = resolveFontProfile(activeFont).baseClass;

  const tokens = getTokens("classic");
  const primaryColor = wedding.config?.theme?.primaryColor || "#0A0A0A";
  const accentColor = wedding.config?.theme?.secondaryColor || "#E8E0D5";

  const cssVars = {
    "--wedding-primary": primaryColor,
    "--wedding-secondary": accentColor,
  } as React.CSSProperties;

  const heroTitle = wedding.config?.texts?.heroTitle || wedding.title || "ELENA & MARC";
  const heroSubtitle = wedding.config?.texts?.heroSubtitle || languagePack.texts.heroSubtitle;
  const heroCta = wedding.config?.texts?.heroCta || "Répondre à l'invitation";
  const heroDate = wedding.config?.texts?.weddingDate || "05.07.2026";
  const storyTitle = wedding.config?.texts?.storyTitle || "Notre histoire";
  const storyBody = wedding.config?.texts?.storyBody || "Nous nous sommes rencontrés un soir de printemps à Paris. De cette rencontre est née une évidence : nos chemins ne feraient plus qu'un. Rejoignez-nous pour le plus beau jour de notre vie.";
  const locationTitle = wedding.config?.texts?.locationTitle || languagePack.texts.locationTitle;
  const programTitle = wedding.config?.texts?.programTitle || languagePack.texts.programTitle;
  const galleryTitle = wedding.config?.texts?.galleryTitle || languagePack.texts.galleryTitle;
  const rsvpTitle = wedding.config?.texts?.rsvpTitle || languagePack.texts.rsvpTitle;
  const rsvpDescription = wedding.config?.texts?.rsvpDescription || languagePack.texts.rsvpDescription;
  const rsvpButton = wedding.config?.texts?.rsvpButton || languagePack.texts.rsvpButton;
  const giftsTitle = (wedding.config?.texts as any)?.giftsTitle || languagePack.texts.giftsTitle;
  const giftsDescription = (wedding.config?.texts as any)?.giftsDescription || languagePack.texts.giftsDescription;
  const cagnotteTitle = wedding.config?.texts?.cagnotteTitle || languagePack.texts.cagnotteTitle;
  const cagnotteDescription = wedding.config?.texts?.cagnotteDescription || languagePack.texts.cagnotteDescription;

  const heroImage = draftMedia?.heroImage || wedding.config?.media?.heroImage || "https://images.unsplash.com/photo-1519225421980-715cb0215aed?w=1600&q=80";
  const couplePhoto = draftMedia?.couplePhoto || wedding.config?.media?.couplePhoto || "https://images.unsplash.com/photo-1606800052052-a08af7148866?w=1200&q=80";

  const rawGallery = wedding.config?.sections?.galleryImages?.length ? wedding.config.sections.galleryImages : [];
  const galleryImages: string[] = rawGallery.length > 0 ? rawGallery : [
    "https://images.unsplash.com/photo-1606800052052-a08af7148866?w=800&q=80",
    "https://images.unsplash.com/photo-1519225421980-715cb0215aed?w=800&q=80",
    "https://images.unsplash.com/photo-1511285560929-80b456fea0bc?w=800&q=80",
    "https://images.unsplash.com/photo-1519741497674-611481863552?w=800&q=80",
    "https://images.unsplash.com/photo-1532712938310-34cb3982ef74?w=800&q=80",
  ];

  const rawLocationItems = (wedding.config?.sections?.locationItems?.length ? wedding.config.sections.locationItems : []) as LocationItem[];
  const locationItems = rawLocationItems.length > 0 ? rawLocationItems : [
    { title: "Cérémonie", address: "Église Saint-Sulpice, Paris", description: "Cérémonie religieuse." },
    { title: "Réception", address: "Palais Brongniart, Paris", description: "Dîner et soirée." },
  ];

  const rawProgramItems = (wedding.config?.sections?.programItems?.length ? wedding.config.sections.programItems : []) as ProgramItem[];
  const programItems = rawProgramItems.length > 0 ? rawProgramItems : [
    { time: "15h00", title: "Accueil", description: "" },
    { time: "16h00", title: "Cérémonie", description: "" },
    { time: "18h00", title: "Cocktail", description: "" },
    { time: "20h00", title: "Dîner & Soirée", description: "" },
  ];

  const pageVisibility = {
    rsvp: wedding.config?.navigation?.pages?.rsvp ?? true,
    cagnotte: wedding.config?.navigation?.pages?.cagnotte ?? true,
    gifts: (wedding.config?.navigation?.pages as any)?.gifts ?? true,
    story: wedding.config?.navigation?.pages?.story ?? true,
    gallery: wedding.config?.navigation?.pages?.gallery ?? true,
    location: wedding.config?.navigation?.pages?.location ?? true,
    program: wedding.config?.navigation?.pages?.program ?? true,
  };

  const giftsData = (gifts && gifts.length > 0) ? gifts : [];
  const contributionMethods = wedding.config?.payments?.contributionMethods || [];
  const logoUrl = wedding.config?.branding?.logoUrl || "";
  const logoText = wedding.config?.branding?.logoText || wedding.title;

  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const { scrollYProgress } = useScroll();
  const heroY = useTransform(scrollYProgress, [0, 0.3], ["0%", "15%"]);

  const navItems = [
    { id: "story", label: "Histoire", show: pageVisibility.story },
    { id: "program", label: "Programme", show: pageVisibility.program },
    { id: "location", label: "Lieux", show: pageVisibility.location },
    { id: "gallery", label: "Galerie", show: pageVisibility.gallery },
    ...(pageVisibility.gifts && (wedding.config?.features?.giftsEnabled ?? true) ? [{ id: "gifts", label: "Cadeaux", show: true }] : []),
    ...(pageVisibility.cagnotte ? [{ id: "cagnotte", label: "Cagnotte", show: true }] : []),
    { id: "rsvp", label: "RSVP", show: pageVisibility.rsvp },
  ].filter(i => i.show);

  return (
    <div
      className={`min-h-screen overflow-x-hidden ${fontClass}`}
      style={{ ...cssVars, backgroundColor: "#FAFAFA", color: primaryColor }}
    >
      {/* HEADER */}
      <header
        className="fixed top-0 left-0 right-0 z-50 transition-all duration-400"
        style={{
          backgroundColor: isScrolled ? `color-mix(in srgb, ${accentColor} 5%, #FAFAFA)` : "transparent",
          backdropFilter: isScrolled ? "blur(16px)" : "none",
          borderBottom: isScrolled ? `1px solid ${primaryColor}15` : "none",
          padding: isScrolled ? "1rem 0" : "1.75rem 0",
          mixBlendMode: isScrolled ? "normal" : undefined,
        }}
      >
        <div className="max-w-7xl mx-auto px-6 md:px-14 flex items-center justify-between">
          <a href={`${basePath}#hero`} className="font-black text-sm tracking-tighter uppercase" style={{ color: isScrolled ? primaryColor : "#fff" }}>
            {logoUrl ? (
              <img src={logoUrl} alt={logoText} className="h-8 w-auto object-contain" />
            ) : logoText}
          </a>

          <nav className="hidden md:flex items-center gap-8">
            {navItems.map((item) => (
              <a
                key={item.id}
                href={`${basePath}#${item.id}`}
                className="text-xs font-semibold tracking-widest uppercase transition-opacity hover:opacity-100"
                style={{ color: isScrolled ? primaryColor : "#fff", opacity: 0.7 }}
              >
                {item.label}
              </a>
            ))}
          </nav>

          <button
            className="md:hidden"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            style={{ color: isScrolled ? primaryColor : "#fff" }}
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="md:hidden px-6 pb-6 space-y-3 mt-3 shadow-xl"
            style={{ backgroundColor: "#FAFAFA" }}
          >
            {navItems.map((item) => (
              <a
                key={item.id}
                href={`${basePath}#${item.id}`}
                onClick={() => setMobileMenuOpen(false)}
                className="block text-sm font-semibold uppercase tracking-wider py-1"
                style={{ color: primaryColor }}
              >
                {item.label}
              </a>
            ))}
          </motion.div>
        )}
      </header>

      {/* HERO — full bleed with large type overlay */}
      <section id="hero" className="relative h-screen overflow-hidden">
        <motion.div className="absolute inset-0" style={{ y: heroY }}>
          <img
            src={heroImage}
            alt="Hero"
            className="w-full h-[115%] object-cover"
          />
          <div className="absolute inset-0" style={{ background: "linear-gradient(to bottom, rgba(0,0,0,0.45) 0%, rgba(0,0,0,0.15) 50%, rgba(0,0,0,0.65) 100%)" }} />
        </motion.div>

        {/* Big bottom-anchored typography */}
        <div className="absolute inset-x-0 bottom-0 px-6 md:px-14 pb-14 md:pb-20">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.1, ease: "easeOut" }}
          >
            {/* Date — small tag */}
            <div className="mb-6">
              <span
                className="inline-block px-3 py-1 text-xs font-mono tracking-widest uppercase"
                style={{ backgroundColor: "rgba(255,255,255,0.12)", color: "#fff", backdropFilter: "blur(6px)" }}
              >
                {heroDate}
              </span>
            </div>

            <h1 className="text-[clamp(2.5rem,9vw,8rem)] font-black leading-none tracking-tight text-white uppercase">
              {canEdit && editMode ? (
                <InlineEditor value={heroTitle} onSave={(v) => props.onSaveText?.("heroTitle", v)} />
              ) : heroTitle}
            </h1>

            <div className="mt-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
              <p className="text-sm font-light tracking-wide text-white/70 max-w-xs">
                {canEdit && editMode ? (
                  <InlineEditor value={heroSubtitle} onSave={(v) => props.onSaveText?.("heroSubtitle", v)} />
                ) : heroSubtitle}
              </p>

              {pageVisibility.rsvp && (
                <a
                  href={`${basePath}#rsvp`}
                  className="shrink-0 px-6 py-3 text-xs font-bold tracking-widest uppercase transition-all duration-300 hover:invert"
                  style={{ backgroundColor: "#fff", color: primaryColor }}
                >
                  {heroCta}
                </a>
              )}
            </div>
          </motion.div>
        </div>
      </section>

      {/* STORY — asymmetric */}
      {pageVisibility.story && (
        <section id="story" className="py-24 md:py-36">
          <div className="max-w-7xl mx-auto px-6 md:px-14 grid md:grid-cols-[1.4fr_1fr] gap-12 md:gap-20 items-start">
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.9 }}
            >
              <p className="text-xs font-black tracking-[0.3em] uppercase mb-6" style={{ color: `${primaryColor}50` }}>
                01 / {storyTitle}
              </p>
              <p className="text-2xl md:text-3xl font-light leading-relaxed" style={{ color: primaryColor }}>
                {canEdit && editMode ? (
                  <InlineEditor value={storyBody} multiline onSave={(v) => props.onSaveText?.("storyBody", v)} />
                ) : storyBody}
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 32 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.9, delay: 0.15 }}
              className="mt-0 md:mt-16"
            >
              <img
                src={couplePhoto}
                alt="Couple"
                className="w-full aspect-[3/4] object-cover"
              />
            </motion.div>
          </div>
        </section>
      )}

      {/* PROGRAM */}
      {pageVisibility.program && (
        <section id="program" className="py-24" style={{ backgroundColor: primaryColor }}>
          <div className="max-w-7xl mx-auto px-6 md:px-14">
            <p className="text-xs font-black tracking-[0.3em] uppercase mb-12" style={{ color: `${accentColor}60` }}>
              02 / {programTitle}
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-0 divide-x" style={{ borderColor: `${accentColor}20` }}>
              {programItems.map((item, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="px-6 py-8 space-y-2"
                  style={{ borderColor: `${accentColor}20` }}
                >
                  <p className="text-3xl font-black font-mono" style={{ color: accentColor }}>
                    {item.time}
                  </p>
                  <p className="text-xs font-semibold tracking-widest uppercase" style={{ color: `${accentColor}80` }}>
                    {item.title}
                  </p>
                  {item.description && (
                    <p className="text-xs leading-relaxed" style={{ color: `${accentColor}50` }}>
                      {item.description}
                    </p>
                  )}
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* LOCATION */}
      {pageVisibility.location && (
        <section id="location" className="py-24 md:py-36">
          <div className="max-w-7xl mx-auto px-6 md:px-14">
            <p className="text-xs font-black tracking-[0.3em] uppercase mb-12" style={{ color: `${primaryColor}40` }}>
              03 / {locationTitle}
            </p>
            <div className="grid md:grid-cols-2 gap-6">
              {locationItems.map((item, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: i === 0 ? -20 : 20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.8, delay: i * 0.1 }}
                  className="group relative overflow-hidden p-8 md:p-10"
                  style={{ backgroundColor: accentColor }}
                >
                  <p className="text-xs font-black tracking-[0.3em] uppercase mb-4" style={{ color: `${primaryColor}50` }}>
                    {i === 0 ? "01" : "02"}
                  </p>
                  <h3 className="text-2xl font-black tracking-tight mb-3" style={{ color: primaryColor }}>
                    {item.title}
                  </h3>
                  <div className="flex items-start gap-2 mb-2">
                    <MapPin className="h-4 w-4 mt-0.5 shrink-0" style={{ color: `${primaryColor}70` }} />
                    <p className="text-sm" style={{ color: `${primaryColor}80` }}>{item.address}</p>
                  </div>
                  {item.description && (
                    <p className="text-sm mt-1" style={{ color: `${primaryColor}60` }}>{item.description}</p>
                  )}
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* GALLERY — edge-to-edge masonry-style */}
      {pageVisibility.gallery && galleryImages.length > 0 && (
        <section id="gallery" className="py-24" style={{ backgroundColor: primaryColor }}>
          <div className="max-w-7xl mx-auto px-6 md:px-14 mb-12">
            <p className="text-xs font-black tracking-[0.3em] uppercase" style={{ color: `${accentColor}50` }}>
              04 / {galleryTitle}
            </p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-1 px-1">
            {galleryImages.slice(0, 5).map((src, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                className={`overflow-hidden ${i === 2 ? "md:col-span-2 md:row-span-2" : ""} aspect-square`}
              >
                <img
                  src={src}
                  alt=""
                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-700 saturate-0 hover:saturate-100"
                />
              </motion.div>
            ))}
          </div>
        </section>
      )}

      {/* RSVP */}
      {pageVisibility.rsvp && (
        <section id="rsvp" className="py-24 md:py-36">
          <div className="max-w-7xl mx-auto px-6 md:px-14 grid md:grid-cols-2 gap-16 items-start">
            <div>
              <p className="text-xs font-black tracking-[0.3em] uppercase mb-6" style={{ color: `${primaryColor}40` }}>
                05 / {rsvpTitle}
              </p>
              <h2 className="text-4xl md:text-6xl font-black leading-tight" style={{ color: primaryColor }}>
                {rsvpTitle}
              </h2>
            </div>
            <div>
              <RSVPSection
                canEdit={canEdit}
                editMode={editMode}
                tokens={tokens}
                wedding={wedding}
                rsvpTitle=""
                rsvpDescription={rsvpDescription}
                rsvpButton={rsvpButton}
                buttonToneClass=""
                buttonRadiusClass="rounded-none"
                onSaveText={props.onSaveText}
                order={0}
              />
            </div>
          </div>
        </section>
      )}

      {/* GIFTS */}
      {pageVisibility.gifts && (wedding.config?.features?.giftsEnabled ?? true) && (giftsData.length > 0 || (canEdit && editMode)) && (
        <section id="gifts" className="py-24 md:py-32" style={{ backgroundColor: accentColor }}>
          <div className="max-w-7xl mx-auto px-6 md:px-14">
            <p className="text-xs font-black tracking-[0.3em] uppercase mb-12" style={{ color: `${primaryColor}40` }}>
              06 / {giftsTitle}
            </p>
            <GiftsSection
              canEdit={canEdit}
              editMode={editMode}
              tokens={tokens}
              giftsTitle=""
              giftsDescription={giftsDescription}
              gifts={giftsData}
              onSaveText={props.onSaveText}
              onCreateGift={props.onCreateGift}
              onEditGift={props.onEditGift}
              onDeleteGift={props.onDeleteGift}
              onReserveGift={props.onReserveGift}
              order={0}
            />
          </div>
        </section>
      )}

      {/* CAGNOTTE */}
      {pageVisibility.cagnotte && (wedding.config?.features?.cagnotteEnabled ?? true) && (
        <section id="cagnotte" className="py-24 md:py-32">
          <div className="max-w-xl mx-auto px-6 md:px-14">
            <p className="text-xs font-black tracking-[0.3em] uppercase mb-12 text-center" style={{ color: `${primaryColor}40` }}>
              {cagnotteTitle}
            </p>
            <CagnotteSection
              canEdit={canEdit}
              editMode={editMode}
              tokens={tokens}
              wedding={wedding}
              cagnotteTitle=""
              cagnotteDescription={cagnotteDescription}
              contributionMethods={contributionMethods}
              onSaveText={props.onSaveText}
              order={0}
            />
          </div>
        </section>
      )}

      {/* FOOTER */}
      <footer className="py-12 px-6 md:px-14 flex flex-col md:flex-row items-center justify-between gap-6" style={{ backgroundColor: primaryColor }}>
        <p className="text-2xl font-black tracking-tight uppercase" style={{ color: accentColor }}>
          {wedding.title}
        </p>
        <p className="text-xs font-mono tracking-widest" style={{ color: `${accentColor}50` }}>
          {heroDate} &nbsp;·&nbsp; Créé avec Daylora
        </p>
      </footer>
    </div>
  );
}
