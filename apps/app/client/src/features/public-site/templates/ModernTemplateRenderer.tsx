import React, { useMemo, useEffect, useState } from "react";
import type { Wedding } from "@shared/schema";
import { getTokens } from "@/design-system/tokens";
import { resolveFontProfile } from "@/lib/font-profiles";
import { getSiteLanguagePack } from "@/lib/site-language";
import { usePublicEdit } from "@/contexts/public-edit";
import { motion, useScroll, useTransform } from "framer-motion";
import { ArrowRight, MapPin, Clock, Camera, Trash2, Plus, Phone, User, Users } from "lucide-react";
import type { AccommodationItem, LocationItem, ProgramItem } from "@/features/public-site/types";
import { InlineEditor } from "@/components/ui/inline-editor";
import { RSVPSection, GiftsSection, CagnotteSection } from "@/features/public-site/sections";

export function ModernTemplateRenderer(props: any) {
  const { wedding, draftMedia, gifts, slug } = props;
  const { canEdit, editMode } = usePublicEdit();

  const languagePack = getSiteLanguagePack((wedding.config as any)?.language);
  const activeFont = wedding.config?.theme?.fontFamily || "sans";
  const fontClass = resolveFontProfile(activeFont).baseClass;

  const primaryColor = wedding.config?.theme?.primaryColor || "#1A1A1A";
  const secondaryColor = wedding.config?.theme?.secondaryColor || "#F5F3EF";
  const headerLayout = wedding.config?.theme?.headerLayout || "balanced";
  const headerSpacing = wedding.config?.theme?.headerSpacing || "comfortable";
  
  const cssVars = {
    "--wedding-primary": primaryColor,
    "--wedding-secondary": secondaryColor,
  } as React.CSSProperties;

  // Demo Fallbacks
  const heroTitle = wedding.config?.texts?.heroTitle || "MARIE & ALEXANDRE";
  const heroSubtitle = wedding.config?.texts?.heroSubtitle || "NOTRE MARIAGE • 2026";
  const heroCta = wedding.config?.texts?.heroCta || "RÉPONDRE À L'INVITATION";
  const heroDate = wedding.config?.texts?.weddingDate || "12 JUIN 2026";
  
  const storyTitle = wedding.config?.texts?.storyTitle || "NOTRE HISTOIRE";
  const storyBody = wedding.config?.texts?.storyBody || "Tout a commencé par un regard, puis un rire, et enfin une évidence. Aujourd'hui, nous tournons une nouvelle page de notre vie et nous sommes honorés de vous avoir à nos côtés.";
  
  const rsvpTitle = wedding.config?.texts?.rsvpTitle || "VOTRE PRÉSENCE";
  const rsvpDescription = wedding.config?.texts?.rsvpDescription || "Merci de nous confirmer votre venue avant le 1er Mai.";
  const rsvpButton = wedding.config?.texts?.rsvpButton || "ENVOYER MA RÉPONSE";

  const rawLocationItems = (wedding.config?.sections?.locationItems?.length ? wedding.config.sections.locationItems : []) as LocationItem[];
  const locationItems = rawLocationItems.length > 0 ? rawLocationItems : [
      { title: "CÉRÉMONIE CIVILE", address: "Hôtel de Ville de Paris", description: "La célébration officielle de notre union." },
      { title: "RÉCEPTION & DÎNER", address: "Le Grand Domaine, 77000", description: "Festivités, dîner et soirée dansante jusqu'à l'aube." }
  ];
  
  const rawProgramItems = (wedding.config?.sections?.programItems?.length ? wedding.config.sections.programItems : []) as ProgramItem[];
  const programItems = rawProgramItems.length > 0 ? rawProgramItems : [
      { time: "15:30", title: "ACCUEIL", description: "Installation des invités" },
      { time: "16:00", title: "ÉCHANGE DES VŒUX", description: "Cérémonie solennelle" },
      { time: "19:00", title: "COCKTAIL", description: "Raîchissements en terrasse" }
  ];

  const heroImage = draftMedia.heroImage || "https://images.unsplash.com/photo-1519741497674-611481863552?w=1600&q=80";
  const couplePhoto = draftMedia.couplePhoto || "https://images.unsplash.com/photo-1511285560929-80b456fea0bc?w=1200&q=80";
  
  const rawGallery = wedding.config?.sections?.galleryImages?.length ? wedding.config.sections.galleryImages : [];
  const galleryImages = rawGallery.length > 0 ? rawGallery : [
      "https://images.unsplash.com/photo-1606800052052-a08af7148866?w=800&q=80",
      "https://images.unsplash.com/photo-1519225421980-715cb0215aed?w=800&q=80",
      "https://images.unsplash.com/photo-1511285560929-80b456fea0bc?w=800&q=80"
  ];

  const { scrollYProgress } = useScroll();
  const yParallax = useTransform(scrollYProgress, [0, 1], [0, 200]);

  const [presence, setPresence] = useState<boolean | null>(true);
  const [isCouple, setIsCouple] = useState<boolean>(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const headerPaddingClass =
    headerSpacing === "compact"
      ? isScrolled ? "py-3 md:py-4" : "py-5 md:py-7"
      : headerSpacing === "airy"
        ? isScrolled ? "py-5 md:py-7" : "py-10 md:py-14"
        : isScrolled ? "py-4 md:py-6" : "py-8 md:py-12";
  const heroTopPaddingClass =
    headerSpacing === "compact"
      ? "pt-24 md:pt-28"
      : headerSpacing === "airy"
        ? "pt-40 md:pt-48"
        : "pt-32 md:pt-40";

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className={`min-h-screen bg-[var(--wedding-secondary)] text-[var(--wedding-primary)] ${fontClass} selection:bg-black selection:text-white pb-20`} style={cssVars}>
      
      {/* Modern Header */}
      <header className={`fixed top-0 w-full z-50 transition-all duration-500 overflow-hidden ${headerPaddingClass} ${isScrolled ? "bg-white/90 backdrop-blur-md shadow-sm text-black" : "bg-transparent text-white mix-blend-difference"}`}>
        <div className={`max-w-[1800px] mx-auto px-6 md:px-12 ${headerLayout === "centered" ? "flex flex-col items-center gap-4" : "flex justify-between items-center"}`}>
          <span className="text-xl font-black tracking-tighter uppercase">{wedding.title}</span>
          <nav className={`hidden md:flex text-[10px] font-black uppercase tracking-[0.3em] ${headerLayout === "centered" ? "gap-8 justify-center" : "gap-10"}`}>
             <a href="#story" className="hover:opacity-50 transition-opacity">Story</a>
             <a href="#program" className="hover:opacity-50 transition-opacity">Agenda</a>
             <a href="#gallery" className="hover:opacity-50 transition-opacity">Galerie</a>
             <a href="#rsvp" className={`px-4 py-2 transition-all duration-500 ${isScrolled ? "bg-black text-white" : "bg-white text-black"}`}>RSVP</a>
          </nav>
        </div>
      </header>

      {/* Modern Hero - Editorial Split */}
      <section className="relative min-h-screen w-full flex flex-col md:flex-row overflow-hidden">
        <div className={`flex-1 flex flex-col justify-end p-8 md:p-16 z-20 pb-20 md:pb-32 ${heroTopPaddingClass} order-2 md:order-1`}>
          <motion.div initial={{ opacity: 0, x: -50 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 1 }}>
            <h2 className="text-xs tracking-[0.5em] font-black opacity-40 mb-4">
                <InlineEditor value={heroSubtitle} onSave={(val) => props.onSaveText("heroSubtitle", val)} canEdit={canEdit && editMode} />
            </h2>
            <h1 className="text-6xl md:text-[8vw] font-black leading-[0.8] tracking-tighter mb-8 max-w-[10ch]">
                <InlineEditor value={heroTitle} onSave={(val) => props.onSaveText("heroTitle", val)} canEdit={canEdit && editMode} />
            </h1>
            <div className="flex flex-col md:flex-row md:items-center gap-8 md:gap-16">
                <div className="text-2xl md:text-3xl font-bold tracking-tighter border-l-4 border-current pl-6 py-2">
                    <InlineEditor value={heroDate} onSave={(val) => props.onSaveText("weddingDate", val)} canEdit={canEdit && editMode} />
                </div>
                <button onClick={props.onHeroCtaClick} className="w-max bg-current text-[var(--wedding-secondary)] px-8 py-4 text-xs font-black tracking-widest uppercase hover:opacity-90 transition-opacity">
                    <InlineEditor value={heroCta} onSave={(val) => props.onSaveText("heroCta", val)} canEdit={canEdit && editMode} />
                </button>
            </div>
          </motion.div>
        </div>
        
        <div className="flex-1 relative min-h-[50vh] md:min-h-screen order-1 md:order-2">
          <motion.img 
            style={{ y: yParallax }}
            src={heroImage} alt="Hero" className="absolute inset-0 w-full h-[120%] object-cover contrast-110" 
          />
          <div className="absolute inset-0 bg-black/10" />
          {canEdit && editMode && (
             <label className="absolute top-10 right-10 bg-white/90 backdrop-blur shadow-xl rounded-full p-4 cursor-pointer border border-black/10 hover:bg-white transition-all z-30">
                <Camera className="w-6 h-6" />
                <input type="file" className="hidden" accept="image/*" onChange={props.onMediaUpload("heroImage")} />
             </label>
          )}
        </div>
      </section>

      {/* Story Section - Modern Grid */}
      <section id="story" className="py-32 px-6 md:px-20 max-w-7xl mx-auto border-t border-black/5">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-16 items-center">
            <div className="md:col-span-7 space-y-12">
                <h2 className="text-7xl md:text-[9vw] font-black tracking-tighter leading-none text-current/10 select-none absolute -translate-y-20 hidden md:block">
                    STORY
                </h2>
                <h3 className="text-4xl md:text-6xl font-black tracking-tighter relative z-10">
                    <InlineEditor value={storyTitle} onSave={(val) => props.onSaveText("storyTitle", val)} canEdit={canEdit && editMode} />
                </h3>
                <p className="text-xl md:text-2xl font-light leading-relaxed opacity-80 whitespace-pre-wrap max-w-2xl">
                    <InlineEditor value={storyBody} onSave={(val) => props.onSaveText("storyBody", val)} canEdit={canEdit && editMode} />
                </p>
            </div>
            <div className="md:col-span-5 relative group">
                <div className="aspect-[4/5] bg-current/5 overflow-hidden">
                    <motion.img 
                        initial={{ scale: 1.1 }} whileInView={{ scale: 1 }} transition={{ duration: 1.5 }}
                        src={couplePhoto} alt="Couple" className="w-full h-full object-cover grayscale hover:grayscale-0 transition-all duration-1000" 
                    />
                </div>
                {canEdit && editMode && (
                    <label className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer text-white flex-col gap-2">
                        <Camera className="w-8 h-8" />
                        <span className="text-xs font-bold uppercase tracking-widest">Modifier l'image</span>
                        <input type="file" className="hidden" accept="image/*" onChange={props.onMediaUpload("couplePhoto")} />
                    </label>
                )}
            </div>
        </div>
      </section>

      {/* Program & Places - Bold Dark Interface */}
      <section id="program" className="bg-black text-white py-32 rounded-[3rem] mx-4 md:mx-10 shadow-[0_50px_100px_rgba(0,0,0,0.4)]">
        <div className="max-w-7xl mx-auto px-6 md:px-20">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-32">
                <div className="space-y-16">
                    <div className="flex items-center justify-between">
                         <h2 className="text-5xl font-black tracking-tighter uppercase border-b-8 border-white/20 pb-2">Agenda</h2>
                         {canEdit && editMode && (
                            <button onClick={props.onAddProgramItem} className="bg-white/10 p-3 rounded-full hover:bg-white/20 transition-colors">
                                <Plus className="w-5 h-5" />
                            </button>
                         )}
                    </div>
                    <div className="space-y-10">
                        {programItems.map((item, idx) => (
                            <div key={idx} className="flex gap-10 group relative border-l-2 border-white/10 pl-10 hover:border-white transition-colors">
                                <div className="text-3xl font-black opacity-30 group-hover:opacity-100 transition-opacity w-24">
                                    <InlineEditor value={item.time} onSave={(val) => props.onUpdateProgramItem(idx.toString(), { time: val })} canEdit={canEdit && editMode} />
                                </div>
                                <div className="flex-1">
                                    <h4 className="text-xl font-bold mb-2">
                                        <InlineEditor value={item.title} onSave={(val) => props.onUpdateProgramItem(idx.toString(), { title: val })} canEdit={canEdit && editMode} />
                                    </h4>
                                    <p className="text-sm opacity-50 font-light max-w-sm">
                                        <InlineEditor value={item.description} onSave={(val) => props.onUpdateProgramItem(idx.toString(), { description: val })} canEdit={canEdit && editMode} />
                                    </p>
                                </div>
                                {canEdit && editMode && (
                                    <button onClick={() => props.onDeleteProgramItem(idx.toString())} className="opacity-0 group-hover:opacity-100 text-red-500 transition-opacity"><Trash2 className="w-4 h-4"/></button>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
                
                <div className="space-y-16">
                    <div className="flex items-center justify-between">
                         <h2 className="text-5xl font-black tracking-tighter uppercase border-b-8 border-white/20 pb-2">Lieux</h2>
                         {canEdit && editMode && (
                            <button onClick={props.onAddLocationItem} className="bg-white/10 p-3 rounded-full hover:bg-white/20 transition-colors">
                                <Plus className="w-5 h-5" />
                            </button>
                         )}
                    </div>
                    <div className="grid grid-cols-1 gap-8">
                        {locationItems.map((item, idx) => (
                            <div key={idx} className="bg-white/5 border border-white/10 p-10 group relative hover:bg-white/10 transition-colors">
                                <h4 className="text-2xl font-black mb-4">
                                    <InlineEditor value={item.title} onSave={(val) => props.onUpdateLocationItem(idx.toString(), { title: val })} canEdit={canEdit && editMode} />
                                </h4>
                                <div className="flex gap-3 text-xs font-bold tracking-widest text-white/40 mb-6 bg-white/5 w-max p-2 px-4 uppercase">
                                    <MapPin className="w-4 h-4" />
                                    <InlineEditor value={item.address} onSave={(val) => props.onUpdateLocationItem(idx.toString(), { address: val })} canEdit={canEdit && editMode} />
                                </div>
                                <p className="text-sm opacity-50 leading-relaxed font-light">
                                    <InlineEditor value={item.description} onSave={(val) => props.onUpdateLocationItem(idx.toString(), { description: val })} canEdit={canEdit && editMode} />
                                </p>
                                {canEdit && editMode && (
                                    <button onClick={() => props.onDeleteLocationItem(idx.toString())} className="absolute top-10 right-10 opacity-0 group-hover:opacity-100 text-red-500 transition-opacity"><Trash2 className="w-5 h-5"/></button>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
      </section>

      {/* Gallery - Grid Mosaic */}
      <section id="gallery" className="py-32 px-6 md:px-20 max-w-7xl mx-auto">
        <div className="flex justify-between items-end mb-16">
            <h2 className="text-6xl font-black tracking-tighter uppercase">Galerie</h2>
            {canEdit && editMode && (
                <label className="flex gap-2 items-center text-[10px] font-black uppercase tracking-widest bg-black text-white px-6 py-3 cursor-pointer hover:bg-black/80 transition-colors">
                    <Camera className="w-4 h-4" /> Ajouter des photos
                    <input type="file" multiple className="hidden" accept="image/*" onChange={props.onGalleryFilesSelected} />
                </label>
            )}
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {galleryImages.map((src: any, idx: any) => (
                <div key={idx} className={`relative group overflow-hidden ${idx === 0 ? 'md:col-span-2 md:row-span-2 aspect-square' : 'aspect-square'}`}>
                    <img src={typeof src === 'string' ? src : src.url} alt="Gallery" className="w-full h-full object-cover grayscale hover:grayscale-0 transition-all duration-700" />
                    {canEdit && editMode && (
                        <button onClick={() => props.onRemoveGalleryImage(idx)} className="absolute top-4 right-4 bg-red-500 text-white p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Trash2 className="w-4 h-4" />
                        </button>
                    )}
                </div>
            ))}
        </div>
      </section>

      {/* RSVP Section - Integrated & Minimal */}
      <section id="rsvp" className="py-32 px-6 md:px-20 bg-[var(--wedding-primary)] text-[var(--wedding-secondary)] mx-4 md:mx-10 rounded-[3rem]">
        <div className="max-w-4xl mx-auto flex flex-col md:flex-row gap-20 items-center">
            <div className="flex-1 text-center md:text-left space-y-6">
                <h2 className="text-5xl md:text-7xl font-black tracking-tighter uppercase leading-none">
                    <InlineEditor value={rsvpTitle} onSave={(val) => props.onSaveText("rsvpTitle", val)} canEdit={canEdit && editMode} />
                </h2>
                <p className="text-xl md:text-2xl font-light opacity-60">
                    <InlineEditor value={rsvpDescription} onSave={(val) => props.onSaveText("rsvpDescription", val)} canEdit={canEdit && editMode} />
                </p>
            </div>
            <div className="flex-1 w-full space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest opacity-40">Prénom</label>
                        <input type="text" className="w-full bg-transparent border-b-2 border-white/20 py-3 outline-none focus:border-white transition-colors text-white" />
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest opacity-40">Nom</label>
                        <input type="text" className="w-full bg-transparent border-b-2 border-white/20 py-3 outline-none focus:border-white transition-colors text-white" />
                    </div>
                </div>
                <div className="space-y-6">
                    <div className="flex flex-wrap gap-8">
                        <button onClick={() => setPresence(true)} className={`flex items-center gap-4 transition-all ${presence === true ? 'opacity-100 scale-105' : 'opacity-30'}`}>
                            <div className={`w-6 h-6 border-2 border-white rounded-full flex items-center justify-center p-1`}>
                                {presence === true && <div className="w-full h-full bg-white rounded-full" />}
                            </div>
                            <span className="font-black text-xs uppercase tracking-widest">Sera Présent</span>
                        </button>
                        <button onClick={() => setPresence(false)} className={`flex items-center gap-4 transition-all ${presence === false ? 'opacity-100 scale-105' : 'opacity-30'}`}>
                            <div className={`w-6 h-6 border-2 border-white rounded-full flex items-center justify-center p-1`}>
                                {presence === false && <div className="w-full h-full bg-white rounded-full" />}
                            </div>
                            <span className="font-black text-xs uppercase tracking-widest">Ne Sera Pas</span>
                        </button>
                    </div>
                    
                    {presence && (
                      <div className="flex flex-wrap gap-8 border-t border-white/10 pt-8 mt-8 animate-in fade-in slide-in-from-top-2 duration-500">
                        <button onClick={() => setIsCouple(false)} className={`flex items-center gap-4 transition-all ${!isCouple ? 'opacity-100 scale-105' : 'opacity-30'}`}>
                            <User className="w-5 h-5"/>
                            <span className="font-black text-xs uppercase tracking-widest text-left">Seul(e)</span>
                        </button>
                        <button onClick={() => setIsCouple(true)} className={`flex items-center gap-4 transition-all ${isCouple ? 'opacity-100 scale-105' : 'opacity-30'}`}>
                            <Users className="w-5 h-5"/>
                            <span className="font-black text-xs uppercase tracking-widest text-left">En couple</span>
                        </button>
                      </div>
                    )}
                </div>
                <button className="w-full bg-white text-black py-6 text-xs font-black tracking-widest uppercase hover:bg-white/90 transition-all flex items-center justify-center gap-4 group">
                    <InlineEditor value={rsvpButton} onSave={(val) => props.onSaveText("rsvpButton", val)} canEdit={canEdit && editMode} />
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-2 transition-transform" />
                </button>
            </div>
        </div>
      </section>

      {/* Gifts & Funds Section */}
      <section className="py-32 px-6 md:px-20 max-w-5xl mx-auto">
         {((wedding?.config?.navigation?.pages as any)?.gifts ?? true) && (
            <div id="gifts" className="mb-24">
               <h3 className="text-4xl font-black mb-12 tracking-tighter uppercase border-l-8 border-current pl-6">Liste de cadeaux</h3>
               <GiftsSection {...props} tokens={getTokens("modern")} giftsTitle={""} giftsDescription={""} gifts={gifts} order={1} />
            </div>
         )}
         
         {((wedding?.config?.navigation?.pages as any)?.cagnotte ?? true) && (
            <div id="cagnotte">
               <h3 className="text-4xl font-black mb-12 tracking-tighter uppercase border-l-8 border-current pl-6">Cagnotte</h3>
               <CagnotteSection {...props} tokens={getTokens("modern")} cagnotteTitle={""} cagnotteDescription={""} contributionMethods={wedding.config?.payments?.contributionMethods || []} buttonRadiusClass="rounded-none" order={2} />
            </div>
         )}
      </section>

      {/* Footer */}
      <footer className="py-32 text-center border-t border-black/5 bg-black text-white rounded-t-[3rem] -mt-10 relative z-20">
         <h4 className="text-4xl font-black tracking-tighter mb-4 uppercase">{wedding.title}</h4>
         <p className="text-sm font-bold tracking-[0.5em] mb-12 opacity-50">{heroDate}</p>
         <div className="w-16 h-1 bg-white/20 mx-auto mb-12" />
         <div className="text-[11px] uppercase tracking-[0.3em] font-black opacity-60">
            Propulsé avec élégance par <a href="https://daylora.app" target="_blank" rel="noopener noreferrer" className="underline hover:opacity-100 transition-opacity">Daylora</a>
         </div>
      </footer>

    </div>
  );
}
