import React, { useEffect, useState } from "react";
import { resolveFontProfile } from "@/lib/font-profiles";
import { getSiteLanguagePack } from "@/lib/site-language";
import { usePublicEdit } from "@/contexts/public-edit";
import { getTokens } from "@/design-system/tokens";
import { motion } from "framer-motion";
import { MapPin, Menu, X, ArrowRight } from "lucide-react";
import type { LocationItem, ProgramItem } from "@/features/public-site/types";
import { InlineEditor } from "@/components/ui/inline-editor";
import { RSVPSection, GiftsSection, CagnotteSection } from "@/features/public-site/sections";

export function SoleilTemplateRenderer(props: any) {
  const { wedding, draftMedia, gifts, slug, basePath = "" } = props;
  const { canEdit, editMode } = usePublicEdit();

  const languagePack = getSiteLanguagePack((wedding.config as any)?.language);
  const activeFont = wedding.config?.theme?.fontFamily || "sans";
  const fontClass = resolveFontProfile(activeFont).baseClass;

  const tokens = getTokens("classic");
  const primaryColor = wedding.config?.theme?.primaryColor || "#2D4A3E";
  const secondaryColor = wedding.config?.theme?.secondaryColor || "#F9F6F1";

  const cssVars = {
    "--wedding-primary": primaryColor,
    "--wedding-secondary": secondaryColor,
  } as React.CSSProperties;

  const heroTitle = wedding.config?.texts?.heroTitle || wedding.title || "SOPHIE & THOMAS";
  const heroSubtitle = wedding.config?.texts?.heroSubtitle || languagePack.texts.heroSubtitle;
  const heroCta = wedding.config?.texts?.heroCta || "Nous rejoindre";
  const heroDate = wedding.config?.texts?.weddingDate || "21 Septembre 2026";
  const storyTitle = wedding.config?.texts?.storyTitle || "Notre histoire";
  const storyBody = wedding.config?.texts?.storyBody || "Deux vies qui se croisent, deux regards qui se reconnaissent. Notre histoire est celle d'une amitié devenue amour, d'instants partagés devenus une vie entière à construire ensemble.";
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

  const heroImage = draftMedia?.heroImage || wedding.config?.media?.heroImage || "https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?w=1600&q=80";
  const couplePhoto = draftMedia?.couplePhoto || wedding.config?.media?.couplePhoto || "https://images.unsplash.com/photo-1532712938310-34cb3982ef74?w=1200&q=80";

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
    { title: "Cérémonie", address: "Jardins de la Bastide, Lyon", description: "Célébration en plein air dans un cadre bucolique." },
    { title: "Réception", address: "Domaine Les Sources, Annecy", description: "Dîner en terrasse, vue sur le lac." },
  ];

  const rawProgramItems = (wedding.config?.sections?.programItems?.length ? wedding.config.sections.programItems : []) as ProgramItem[];
  const programItems = rawProgramItems.length > 0 ? rawProgramItems : [
    { time: "14:30", title: "Arrivée des invités", description: "Champagne & vin d'honneur" },
    { time: "15:30", title: "Cérémonie", description: "Échange des vœux en extérieur" },
    { time: "17:30", title: "Cocktail", description: "Live music & animations" },
    { time: "20:00", title: "Dîner", description: "Repas de gala sous les étoiles" },
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
    const handleScroll = () => setIsScrolled(window.scrollY > 40);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const pStyle = { color: primaryColor };
  const sStyle = { color: secondaryColor };
  const pBg = { backgroundColor: primaryColor };
  const sBg = { backgroundColor: secondaryColor };

  const navItems = [
    { id: "story", label: "Notre histoire", show: pageVisibility.story },
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
      style={{ ...cssVars, backgroundColor: secondaryColor, color: primaryColor }}
    >
      {/* HEADER */}
      <header
        className="fixed top-0 left-0 right-0 z-50 transition-all duration-500"
        style={{
          backgroundColor: isScrolled ? `${secondaryColor}f5` : "transparent",
          backdropFilter: isScrolled ? "blur(12px)" : "none",
          boxShadow: isScrolled ? `0 1px 0 ${primaryColor}12` : "none",
          padding: isScrolled ? "1rem 0" : "1.5rem 0",
        }}
      >
        <div className="max-w-7xl mx-auto px-6 md:px-12 flex items-center justify-between">
          <a href={`${basePath}#hero`} className="flex items-center gap-2" style={pStyle}>
            {logoUrl ? (
              <img src={logoUrl} alt={logoText} className="h-9 w-auto object-contain" />
            ) : (
              <span className="font-medium tracking-widest text-sm uppercase">{logoText}</span>
            )}
          </a>

          <nav className="hidden md:flex items-center gap-7">
            {navItems.map((item) => (
              <a
                key={item.id}
                href={`${basePath}#${item.id}`}
                className="text-xs tracking-widest uppercase hover:opacity-100 transition-opacity"
                style={{ ...pStyle, opacity: 0.55 }}
                onMouseEnter={e => (e.currentTarget.style.opacity = "1")}
                onMouseLeave={e => (e.currentTarget.style.opacity = "0.55")}
              >
                {item.label}
              </a>
            ))}
          </nav>

          <button className="md:hidden" onClick={() => setMobileMenuOpen(!mobileMenuOpen)} style={pStyle}>
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="md:hidden px-6 pb-6 space-y-3 mt-3"
            style={sBg}
          >
            {navItems.map((item) => (
              <a
                key={item.id}
                href={`${basePath}#${item.id}`}
                onClick={() => setMobileMenuOpen(false)}
                className="block text-sm py-1"
                style={pStyle}
              >
                {item.label}
              </a>
            ))}
          </motion.div>
        )}
      </header>

      {/* HERO — split layout */}
      <section id="hero" className="min-h-screen grid md:grid-cols-2">
        {/* Left: text */}
        <div className="flex flex-col justify-center px-8 md:px-16 lg:px-24 pt-32 pb-16 md:pt-0">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1 }}
            className="space-y-8"
          >
            <div
              className="inline-block px-4 py-1.5 text-xs tracking-[0.2em] uppercase rounded-full"
              style={{ backgroundColor: `${primaryColor}12`, ...pStyle }}
            >
              {heroDate}
            </div>

            <h1 className="text-4xl md:text-6xl xl:text-7xl font-light leading-tight" style={pStyle}>
              {canEdit && editMode ? (
                <InlineEditor value={heroTitle} onSave={(v) => props.onSaveText?.("heroTitle", v)} />
              ) : heroTitle}
            </h1>

            <p className="text-base md:text-lg" style={{ ...pStyle, opacity: 0.65 }}>
              {canEdit && editMode ? (
                <InlineEditor value={heroSubtitle} onSave={(v) => props.onSaveText?.("heroSubtitle", v)} />
              ) : heroSubtitle}
            </p>

            {pageVisibility.rsvp && (
              <a
                href={`${basePath}#rsvp`}
                className="inline-flex items-center gap-3 px-7 py-3.5 text-sm font-medium tracking-wide rounded-full transition-all duration-300 hover:gap-5"
                style={{ ...pBg, ...sStyle }}
              >
                {heroCta}
                <ArrowRight className="h-4 w-4" />
              </a>
            )}
          </motion.div>
        </div>

        {/* Right: photo */}
        <motion.div
          initial={{ opacity: 0, scale: 1.04 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.2 }}
          className="relative h-[50vh] md:h-screen overflow-hidden"
        >
          <img
            src={heroImage}
            alt="Hero"
            className="w-full h-full object-cover"
          />
          {/* Subtle corner ornament */}
          <div
            className="absolute bottom-8 left-8 w-16 h-16"
            style={{
              borderLeft: `2px solid ${secondaryColor}`,
              borderBottom: `2px solid ${secondaryColor}`,
            }}
          />
        </motion.div>
      </section>

      {/* STORY */}
      {pageVisibility.story && (
        <section id="story" className="py-24 md:py-32" style={{ backgroundColor: `${primaryColor}07` }}>
          <div className="max-w-5xl mx-auto px-6 md:px-12 grid md:grid-cols-[1fr_1.2fr] gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
            >
              <img
                src={couplePhoto}
                alt="Couple"
                className="w-full aspect-[4/5] object-cover rounded-2xl"
              />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.1 }}
              className="space-y-6"
            >
              <h2 className="text-3xl md:text-4xl font-light" style={pStyle}>
                {storyTitle}
              </h2>
              <div className="w-10 h-0.5" style={pBg} />
              <p className="text-base leading-relaxed" style={{ ...pStyle, opacity: 0.7 }}>
                {canEdit && editMode ? (
                  <InlineEditor value={storyBody} multiline onSave={(v) => props.onSaveText?.("storyBody", v)} />
                ) : storyBody}
              </p>
            </motion.div>
          </div>
        </section>
      )}

      {/* PROGRAM */}
      {pageVisibility.program && (
        <section id="program" className="py-24 md:py-32">
          <div className="max-w-4xl mx-auto px-6 md:px-12">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-16 space-y-3"
            >
              <h2 className="text-3xl md:text-4xl font-light" style={pStyle}>{programTitle}</h2>
              <div className="w-10 h-0.5 mx-auto" style={pBg} />
            </motion.div>

            <div className="grid md:grid-cols-2 gap-4">
              {programItems.map((item, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="flex gap-5 p-6 rounded-2xl"
                  style={{ backgroundColor: `${primaryColor}06`, border: `1px solid ${primaryColor}12` }}
                >
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 text-xs font-mono font-bold"
                    style={{ backgroundColor: `${primaryColor}12`, ...pStyle }}
                  >
                    {item.time}
                  </div>
                  <div>
                    <p className="font-semibold text-sm" style={pStyle}>{item.title}</p>
                    {item.description && (
                      <p className="text-sm mt-1" style={{ ...pStyle, opacity: 0.6 }}>{item.description}</p>
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
        <section id="location" className="py-24 md:py-32" style={{ backgroundColor: `${primaryColor}07` }}>
          <div className="max-w-4xl mx-auto px-6 md:px-12">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-16 space-y-3"
            >
              <h2 className="text-3xl md:text-4xl font-light" style={pStyle}>{locationTitle}</h2>
              <div className="w-10 h-0.5 mx-auto" style={pBg} />
            </motion.div>

            <div className="grid md:grid-cols-2 gap-6">
              {locationItems.map((item, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.12 }}
                  className="rounded-2xl overflow-hidden"
                  style={{ backgroundColor: secondaryColor, boxShadow: `0 4px 24px ${primaryColor}12` }}
                >
                  <div className="p-7 space-y-3">
                    <p className="text-xs uppercase tracking-widest font-medium" style={{ ...pStyle, opacity: 0.5 }}>
                      {i === 0 ? "01" : "02"}
                    </p>
                    <h3 className="text-xl font-medium" style={pStyle}>{item.title}</h3>
                    <div className="flex items-start gap-2">
                      <MapPin className="h-4 w-4 mt-0.5 shrink-0" style={{ ...pStyle, opacity: 0.7 }} />
                      <p className="text-sm" style={{ ...pStyle, opacity: 0.75 }}>{item.address}</p>
                    </div>
                    {item.description && (
                      <p className="text-sm" style={{ ...pStyle, opacity: 0.55 }}>{item.description}</p>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* GALLERY */}
      {pageVisibility.gallery && galleryImages.length > 0 && (
        <section id="gallery" className="py-24 md:py-32">
          <div className="max-w-6xl mx-auto px-6 md:px-12">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-16 space-y-3"
            >
              <h2 className="text-3xl md:text-4xl font-light" style={pStyle}>{galleryTitle}</h2>
              <div className="w-10 h-0.5 mx-auto" style={pBg} />
            </motion.div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {galleryImages.slice(0, 6).map((src, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.07 }}
                  className={`overflow-hidden rounded-2xl ${i === 0 ? "md:col-span-2 aspect-video" : "aspect-square"}`}
                >
                  <img src={src} alt="" className="w-full h-full object-cover hover:scale-105 transition-transform duration-700" />
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* RSVP */}
      {pageVisibility.rsvp && (
        <section id="rsvp" className="py-24 md:py-32" style={{ backgroundColor: `${primaryColor}07` }}>
          <div className="max-w-xl mx-auto px-6 md:px-12">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-12 space-y-3"
            >
              <h2 className="text-3xl md:text-4xl font-light" style={pStyle}>{rsvpTitle}</h2>
              <div className="w-10 h-0.5 mx-auto" style={pBg} />
            </motion.div>
            <RSVPSection
              canEdit={canEdit}
              editMode={editMode}
              tokens={tokens}
              wedding={wedding}
              rsvpTitle=""
              rsvpDescription={rsvpDescription}
              rsvpButton={rsvpButton}
              buttonToneClass=""
              buttonRadiusClass="rounded-full"
              onSaveText={props.onSaveText}
              order={0}
            />
          </div>
        </section>
      )}

      {/* GIFTS */}
      {pageVisibility.gifts && (wedding.config?.features?.giftsEnabled ?? true) && (giftsData.length > 0 || (canEdit && editMode)) && (
        <section id="gifts" className="py-24 md:py-32">
          <div className="max-w-5xl mx-auto px-6 md:px-12">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-12 space-y-3"
            >
              <h2 className="text-3xl md:text-4xl font-light" style={pStyle}>{giftsTitle}</h2>
              <div className="w-10 h-0.5 mx-auto" style={pBg} />
            </motion.div>
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
        <section id="cagnotte" className="py-24 md:py-32" style={{ backgroundColor: `${primaryColor}07` }}>
          <div className="max-w-xl mx-auto px-6 md:px-12">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-12 space-y-3"
            >
              <h2 className="text-3xl md:text-4xl font-light" style={pStyle}>{cagnotteTitle}</h2>
              <div className="w-10 h-0.5 mx-auto" style={pBg} />
            </motion.div>
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
      <footer className="py-12 text-center" style={{ borderTop: `1px solid ${primaryColor}15` }}>
        <p className="text-xl font-light tracking-widest uppercase" style={pStyle}>{wedding.title}</p>
        <p className="mt-2 text-sm" style={{ ...pStyle, opacity: 0.45 }}>{heroDate}</p>
        <p className="mt-4 text-xs" style={{ ...pStyle, opacity: 0.3 }}>Créé avec Daylora</p>
      </footer>
    </div>
  );
}
