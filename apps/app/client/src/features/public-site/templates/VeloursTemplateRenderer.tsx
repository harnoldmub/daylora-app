import React, { useEffect, useState } from "react";
import { resolveFontProfile } from "@/lib/font-profiles";
import { getSiteLanguagePack } from "@/lib/site-language";
import { usePublicEdit } from "@/contexts/public-edit";
import { getTokens } from "@/design-system/tokens";
import { motion, useScroll, useTransform } from "framer-motion";
import { MapPin, ChevronDown, Menu, X } from "lucide-react";
import type { LocationItem, ProgramItem } from "@/features/public-site/types";
import { InlineEditor } from "@/components/ui/inline-editor";
import { RSVPSection, GiftsSection, CagnotteSection } from "@/features/public-site/sections";

export function VeloursTemplateRenderer(props: any) {
  const { wedding, draftMedia, gifts, slug, basePath = "" } = props;
  const { canEdit, editMode } = usePublicEdit();

  const languagePack = getSiteLanguagePack((wedding.config as any)?.language);
  const activeFont = wedding.config?.theme?.fontFamily || "serif";
  const fontClass = resolveFontProfile(activeFont).baseClass;

  const tokens = getTokens("classic");
  const primaryColor = wedding.config?.theme?.primaryColor || "#C8A96A";
  const secondaryColor = wedding.config?.theme?.secondaryColor || "#0D0B09";

  const cssVars = {
    "--wedding-primary": primaryColor,
    "--wedding-secondary": secondaryColor,
    "--v-gold": primaryColor,
    "--v-bg": secondaryColor,
  } as React.CSSProperties;

  const heroTitle = wedding.config?.texts?.heroTitle || wedding.title || "CAMILLE & JULIEN";
  const heroSubtitle = wedding.config?.texts?.heroSubtitle || languagePack.texts.heroSubtitle;
  const heroCta = wedding.config?.texts?.heroCta || "Confirmer ma présence";
  const heroDate = wedding.config?.texts?.weddingDate || "14 Juin 2027";
  const storyTitle = wedding.config?.texts?.storyTitle || "Notre histoire";
  const storyBody = wedding.config?.texts?.storyBody || "Tout a commencé par un regard, puis un rire, et enfin une évidence. Nous avons hâte de vivre ce jour exceptionnel entourés de vous.";
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

  const heroImage = draftMedia?.heroImage || wedding.config?.media?.heroImage || "https://images.unsplash.com/photo-1519741497674-611481863552?w=1600&q=80";
  const couplePhoto = draftMedia?.couplePhoto || wedding.config?.media?.couplePhoto || "https://images.unsplash.com/photo-1511285560929-80b456fea0bc?w=1200&q=80";

  const rawGallery = wedding.config?.sections?.galleryImages?.length ? wedding.config.sections.galleryImages : [];
  const galleryImages: string[] = rawGallery.length > 0 ? rawGallery : [
    "https://images.unsplash.com/photo-1606800052052-a08af7148866?w=800&q=80",
    "https://images.unsplash.com/photo-1519225421980-715cb0215aed?w=800&q=80",
    "https://images.unsplash.com/photo-1511285560929-80b456fea0bc?w=800&q=80",
    "https://images.unsplash.com/photo-1519741497674-611481863552?w=800&q=80",
    "https://images.unsplash.com/photo-1532712938310-34cb3982ef74?w=800&q=80",
    "https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?w=800&q=80",
  ];

  const rawLocationItems = (wedding.config?.sections?.locationItems?.length ? wedding.config.sections.locationItems : []) as LocationItem[];
  const locationItems = rawLocationItems.length > 0 ? rawLocationItems : [
    { title: "Cérémonie Laïque", address: "Château de Vaux-le-Vicomte", description: "Dans le grand salon du château." },
    { title: "Soirée & Réception", address: "Le Domaine des Roses", description: "Dîner gastronomique et soirée dansante." },
  ];

  const rawProgramItems = (wedding.config?.sections?.programItems?.length ? wedding.config.sections.programItems : []) as ProgramItem[];
  const programItems = rawProgramItems.length > 0 ? rawProgramItems : [
    { time: "15:00", title: "Accueil", description: "Coupe de bienvenue et déambulation" },
    { time: "16:00", title: "Cérémonie", description: "Échange des vœux" },
    { time: "18:00", title: "Cocktail", description: "Animations et canapés raffinés" },
    { time: "20:00", title: "Dîner", description: "Menu gastronomique sous les étoiles" },
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
    const handleScroll = () => setIsScrolled(window.scrollY > 60);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const { scrollYProgress } = useScroll();
  const heroImageY = useTransform(scrollYProgress, [0, 0.3], ["0%", "18%"]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.2], [1, 0]);

  const goldStyle = { color: primaryColor };
  const goldBorder = { borderColor: primaryColor };
  const goldBg = { backgroundColor: primaryColor };

  const navItems = [
    { id: "story", label: "Notre Histoire", show: pageVisibility.story },
    { id: "program", label: "Programme", show: pageVisibility.program },
    { id: "location", label: "Lieux", show: pageVisibility.location },
    { id: "gallery", label: galleryTitle, show: pageVisibility.gallery },
    ...(pageVisibility.gifts && (wedding.config?.features?.giftsEnabled ?? true) ? [{ id: "gifts", label: "Liste de cadeaux", show: true }] : []),
    ...(pageVisibility.cagnotte ? [{ id: "cagnotte", label: "Cagnotte", show: true }] : []),
    { id: "rsvp", label: "RSVP", show: pageVisibility.rsvp },
  ].filter(i => i.show);

  return (
    <div
      className={`min-h-screen overflow-x-hidden ${fontClass}`}
      style={{ ...cssVars, backgroundColor: secondaryColor, color: "#F5EFE0" }}
    >
      {/* HEADER */}
      <header
        className="fixed top-0 left-0 right-0 z-50 transition-all duration-500"
        style={{
          backgroundColor: isScrolled ? `${secondaryColor}f0` : "transparent",
          backdropFilter: isScrolled ? "blur(20px)" : "none",
          borderBottom: isScrolled ? `1px solid ${primaryColor}30` : "none",
          paddingTop: isScrolled ? "1rem" : "2rem",
          paddingBottom: isScrolled ? "1rem" : "2rem",
        }}
      >
        <div className="max-w-7xl mx-auto px-6 md:px-12 flex items-center justify-between">
          <a href={`${basePath}#hero`}>
            {logoUrl ? (
              <img src={logoUrl} alt={logoText} className="h-10 w-auto object-contain" />
            ) : (
              <span className="font-semibold tracking-[0.18em] uppercase text-sm" style={goldStyle}>
                {logoText}
              </span>
            )}
          </a>

          <nav className="hidden md:flex items-center gap-8">
            {navItems.map((item) => (
              <a
                key={item.id}
                href={`${basePath}#${item.id}`}
                className="text-xs tracking-[0.15em] uppercase transition-colors"
                style={{ color: "#F5EFE080" }}
                onMouseEnter={e => (e.currentTarget.style.color = primaryColor)}
                onMouseLeave={e => (e.currentTarget.style.color = "#F5EFE080")}
              >
                {item.label}
              </a>
            ))}
          </nav>

          <button
            className="md:hidden p-2"
            style={goldStyle}
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="md:hidden px-6 pb-6 space-y-4"
            style={{ backgroundColor: secondaryColor }}
          >
            {navItems.map((item) => (
              <a
                key={item.id}
                href={`${basePath}#${item.id}`}
                onClick={() => setMobileMenuOpen(false)}
                className="block text-xs tracking-[0.15em] uppercase py-2"
                style={goldStyle}
              >
                {item.label}
              </a>
            ))}
          </motion.div>
        )}
      </header>

      {/* HERO */}
      <section id="hero" className="relative h-screen overflow-hidden">
        <motion.div
          className="absolute inset-0"
          style={{ y: heroImageY }}
        >
          <img
            src={heroImage}
            alt="Hero"
            className="w-full h-[120%] object-cover"
            style={{ filter: "brightness(0.35)" }}
          />
        </motion.div>

        {/* Subtle vignette */}
        <div
          className="absolute inset-0"
          style={{
            background: `radial-gradient(ellipse at center, transparent 30%, ${secondaryColor}90 100%)`,
          }}
        />

        {/* Gold horizontal rule */}
        <div className="absolute left-1/2 top-[42%] -translate-x-1/2 -translate-y-1/2 w-full px-6 md:px-0 text-center">
          <motion.div style={{ opacity: heroOpacity }}>
            <div className="flex items-center justify-center gap-4 mb-8">
              <div className="h-px w-16 md:w-32" style={goldBg} />
              <span className="text-xs tracking-[0.3em] uppercase" style={goldStyle}>
                {heroDate}
              </span>
              <div className="h-px w-16 md:w-32" style={goldBg} />
            </div>

            <h1 className="text-4xl md:text-7xl lg:text-8xl font-light tracking-[0.06em] uppercase mb-6 text-white">
              {canEdit && editMode ? (
                <InlineEditor value={heroTitle} onSave={(v) => props.onSaveText?.("heroTitle", v)} />
              ) : heroTitle}
            </h1>

            <p className="text-sm md:text-base tracking-[0.2em] uppercase mb-16" style={{ color: "#F5EFE099" }}>
              {canEdit && editMode ? (
                <InlineEditor value={heroSubtitle} onSave={(v) => props.onSaveText?.("heroSubtitle", v)} />
              ) : heroSubtitle}
            </p>

            {pageVisibility.rsvp && (
              <a
                href={`${basePath}#rsvp`}
                className="inline-flex items-center gap-3 px-8 py-3 text-xs tracking-[0.2em] uppercase transition-all duration-300"
                style={{
                  border: `1px solid ${primaryColor}`,
                  color: primaryColor,
                }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLElement).style.backgroundColor = primaryColor;
                  (e.currentTarget as HTMLElement).style.color = secondaryColor;
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLElement).style.backgroundColor = "transparent";
                  (e.currentTarget as HTMLElement).style.color = primaryColor;
                }}
              >
                {heroCta}
              </a>
            )}
          </motion.div>
        </div>

        {/* Scroll indicator */}
        <motion.div
          className="absolute bottom-10 left-1/2 -translate-x-1/2"
          animate={{ y: [0, 8, 0] }}
          transition={{ repeat: Infinity, duration: 2 }}
          style={goldStyle}
        >
          <ChevronDown className="h-5 w-5" />
        </motion.div>
      </section>

      {/* STORY */}
      {pageVisibility.story && (
        <section id="story" className="py-24 md:py-40">
          <div className="max-w-6xl mx-auto px-6 md:px-12 grid md:grid-cols-2 gap-16 md:gap-24 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.9 }}
              className="space-y-8"
            >
              <div className="flex items-center gap-4">
                <div className="h-px w-12" style={goldBg} />
                <span className="text-xs tracking-[0.25em] uppercase" style={goldStyle}>
                  {storyTitle}
                </span>
              </div>
              <p className="text-lg leading-relaxed" style={{ color: "#F5EFE0BB" }}>
                {canEdit && editMode ? (
                  <InlineEditor value={storyBody} multiline onSave={(v) => props.onSaveText?.("storyBody", v)} />
                ) : storyBody}
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.9, delay: 0.15 }}
              className="relative"
            >
              <div
                className="absolute -inset-4 rounded-none"
                style={{ border: `1px solid ${primaryColor}30` }}
              />
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
        <section id="program" className="py-24" style={{ borderTop: `1px solid ${primaryColor}20` }}>
          <div className="max-w-3xl mx-auto px-6 md:px-12">
            <div className="flex items-center gap-4 mb-16">
              <div className="h-px w-12" style={goldBg} />
              <span className="text-xs tracking-[0.25em] uppercase" style={goldStyle}>
                {programTitle}
              </span>
            </div>

            <div className="space-y-0">
              {programItems.map((item, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="grid grid-cols-[80px_1fr] gap-6 py-6"
                  style={{ borderBottom: `1px solid ${primaryColor}15` }}
                >
                  <span className="text-sm font-mono" style={goldStyle}>
                    {item.time}
                  </span>
                  <div>
                    <p className="text-sm font-semibold tracking-wider uppercase text-white mb-1">{item.title}</p>
                    {item.description && (
                      <p className="text-sm" style={{ color: "#F5EFE066" }}>{item.description}</p>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* LOCATION */}
      {pageVisibility.location && (
        <section id="location" className="py-24" style={{ borderTop: `1px solid ${primaryColor}20` }}>
          <div className="max-w-5xl mx-auto px-6 md:px-12">
            <div className="flex items-center gap-4 mb-16">
              <div className="h-px w-12" style={goldBg} />
              <span className="text-xs tracking-[0.25em] uppercase" style={goldStyle}>
                {locationTitle}
              </span>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
              {locationItems.map((item, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.15 }}
                  className="p-8 space-y-3"
                  style={{ border: `1px solid ${primaryColor}25`, backgroundColor: `${primaryColor}06` }}
                >
                  <p className="text-xs tracking-[0.2em] uppercase" style={goldStyle}>{item.title}</p>
                  <div className="flex items-start gap-2">
                    <MapPin className="h-4 w-4 mt-0.5 shrink-0" style={goldStyle} />
                    <p className="text-sm text-white">{item.address}</p>
                  </div>
                  {item.description && (
                    <p className="text-sm" style={{ color: "#F5EFE066" }}>{item.description}</p>
                  )}
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* GALLERY */}
      {pageVisibility.gallery && galleryImages.length > 0 && (
        <section id="gallery" className="py-24" style={{ borderTop: `1px solid ${primaryColor}20` }}>
          <div className="max-w-7xl mx-auto px-6 md:px-12">
            <div className="flex items-center gap-4 mb-16">
              <div className="h-px w-12" style={goldBg} />
              <span className="text-xs tracking-[0.25em] uppercase" style={goldStyle}>
                {galleryTitle}
              </span>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {galleryImages.slice(0, 6).map((src, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, scale: 0.97 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.07 }}
                  className={`relative overflow-hidden ${i === 0 ? "md:col-span-2 md:row-span-2 aspect-square" : "aspect-square"}`}
                >
                  <img src={src} alt="" className="w-full h-full object-cover transition-transform duration-700 hover:scale-105" />
                  <div
                    className="absolute inset-0 opacity-0 hover:opacity-100 transition-opacity duration-300"
                    style={{ backgroundColor: `${primaryColor}20` }}
                  />
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* RSVP */}
      {pageVisibility.rsvp && (
        <section id="rsvp" className="py-24" style={{ borderTop: `1px solid ${primaryColor}20` }}>
          <div className="max-w-2xl mx-auto px-6 md:px-12">
            <div className="flex items-center gap-4 mb-12">
              <div className="h-px w-12" style={goldBg} />
              <span className="text-xs tracking-[0.25em] uppercase" style={goldStyle}>
                {rsvpTitle}
              </span>
            </div>
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
        </section>
      )}

      {/* GIFTS */}
      {pageVisibility.gifts && (wedding.config?.features?.giftsEnabled ?? true) && (giftsData.length > 0 || (canEdit && editMode)) && (
        <section id="gifts" className="py-24" style={{ borderTop: `1px solid ${primaryColor}20` }}>
          <div className="max-w-5xl mx-auto px-6 md:px-12">
            <div className="flex items-center gap-4 mb-12">
              <div className="h-px w-12" style={goldBg} />
              <span className="text-xs tracking-[0.25em] uppercase" style={goldStyle}>
                {giftsTitle}
              </span>
            </div>
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
        <section id="cagnotte" className="py-24" style={{ borderTop: `1px solid ${primaryColor}20` }}>
          <div className="max-w-2xl mx-auto px-6 md:px-12">
            <div className="flex items-center gap-4 mb-12">
              <div className="h-px w-12" style={goldBg} />
              <span className="text-xs tracking-[0.25em] uppercase" style={goldStyle}>
                {cagnotteTitle}
              </span>
            </div>
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
      <footer className="py-16 text-center" style={{ borderTop: `1px solid ${primaryColor}20` }}>
        <div className="flex items-center justify-center gap-4 mb-6">
          <div className="h-px w-16" style={goldBg} />
          <span className="text-2xl font-light tracking-[0.12em] uppercase text-white">{wedding.title}</span>
          <div className="h-px w-16" style={goldBg} />
        </div>
        <p className="text-xs tracking-[0.2em] uppercase" style={goldStyle}>{heroDate}</p>
        <p className="mt-4 text-xs" style={{ color: "#F5EFE040" }}>
          Créé avec Daylora
        </p>
      </footer>
    </div>
  );
}
