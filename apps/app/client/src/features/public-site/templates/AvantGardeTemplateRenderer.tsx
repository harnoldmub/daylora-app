import React, { useMemo, useEffect, useState } from "react";
import type { Wedding } from "@shared/schema";
import { getTokens } from "@/design-system/tokens";
import { resolveFontProfile } from "@/lib/font-profiles";
import { getSiteLanguagePack } from "@/lib/site-language";
import { usePublicEdit } from "@/contexts/public-edit";
import { motion, useScroll, useTransform, AnimatePresence } from "framer-motion";
import { ArrowRight, MapPin, Clock, Heart, Camera, Settings2, Trash2, Plus, Menu } from "lucide-react";
import type { AccommodationItem, LocationItem, ProgramItem, SaveTextFn } from "@/features/public-site/types";
import { InlineEditor } from "@/components/ui/inline-editor";
import { useForm, useWatch } from "react-hook-form";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";

import { RSVPSection, GiftsSection, CagnotteSection } from "@/features/public-site/sections";

export function AvantGardeTemplateRenderer(props: any) {
  const { wedding, draftMedia, gifts, slug } = props;
  const { canEdit, editMode } = usePublicEdit();
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const languagePack = getSiteLanguagePack((wedding.config as any)?.language);
  const activeFont = wedding.config?.theme?.fontFamily || "serif";
  const fontClass = resolveFontProfile(activeFont).baseClass;

  const primaryColor = wedding.config?.theme?.primaryColor || "#333333";
  const secondaryColor = wedding.config?.theme?.secondaryColor || "#F8F8F8";
  
  const cssVars = {
    "--wedding-primary": primaryColor,
    "--wedding-secondary": secondaryColor,
  } as React.CSSProperties;

  const heroTitle = wedding.config?.texts?.heroTitle || (languagePack.language === "en" ? "My Wedding" : "Mon Mariage");
  const heroSubtitle = wedding.config?.texts?.heroSubtitle || languagePack.texts.heroSubtitle;
  const heroCta = wedding.config?.texts?.heroCta || languagePack.texts.heroCta;
  const heroDate = wedding.config?.texts?.weddingDate || "21.03.2026";
  
  const storyTitle = wedding.config?.texts?.storyTitle || languagePack.texts.storyTitle;
  const storyBody = wedding.config?.texts?.storyBody || "Bienvenue dans notre histoire. Nous sommes si heureux de partager ces moments avec vous.";
  
  const cagnotteTitle = wedding.config?.texts?.cagnotteTitle || languagePack.texts.cagnotteTitle;
  const cagnotteDescription = wedding.config?.texts?.cagnotteDescription || languagePack.texts.cagnotteDescription;
  
  const rawContributionMethods = wedding.config?.payments?.contributionMethods || [];
  const contributionMethods = rawContributionMethods.length > 0 ? rawContributionMethods : [
      { id: "demo1", type: "bank", enabled: true, title: "Virement Bancaire", details: "BE40 0000 0000 0000\nBIC: ABXXCDYY", sortOrder: 0, accountHolder: "Marie & Alex", accountNumber: "BE40...", iban: "BE40...", bic: "ABXXCDYY" },
      { id: "demo2", type: "phone", enabled: true, title: "Payconiq / Mobile", details: "+32 400 00 00 00", sortOrder: 1, number: "+32 400 00 00 00", label: "Mobile" }
  ];
  
  const giftsTitle = (wedding.config?.texts as any)?.giftsTitle || languagePack.texts.giftsTitle;
  const giftsDescription = (wedding.config?.texts as any)?.giftsDescription || languagePack.texts.giftsDescription;
  
  const giftsData = (gifts && gifts.length > 0) ? gifts : [
      { id: "demo1", title: "Nuit de noces à Bali", description: "Aidez-nous à réserver la villa de nos rêves sur l'eau.", price: 250, currentAmount: 0, url: "", imageUrl: "https://images.unsplash.com/photo-1544365558-35aa4afcf11f?w=800&q=80", isDemo: true },
      { id: "demo2", title: "Service en Porcelaine", description: "Pour nos futurs dîners de famille.", price: 150, currentAmount: 0, url: "", imageUrl: "https://images.unsplash.com/photo-1610484826917-0f101a7beb19?w=800&q=80", isDemo: true },
  ];
  
  const rsvpTitle = wedding.config?.texts?.rsvpTitle || languagePack.texts.rsvpTitle;
  const rsvpDescription = wedding.config?.texts?.rsvpDescription || languagePack.texts.rsvpDescription;
  const rsvpButton = wedding.config?.texts?.rsvpButton || languagePack.texts.rsvpButton;

  const headerModel = wedding.config?.theme?.headerModel || "model1";
  const footerModel = wedding.config?.theme?.footerModel || "model1";
  const rsvpModel = wedding.config?.theme?.rsvpModel || "model1";

  const rawLocationItems = (wedding.config?.sections?.locationItems?.length ? wedding.config.sections.locationItems : []) as LocationItem[];
  const locationItems = rawLocationItems.length > 0 ? rawLocationItems : [
      { title: "Cérémonie Civile", address: "Mairie Centrale", description: "Rejoignez-nous pour célébrer notre union" } as LocationItem,
      { title: "Réception", address: "Domaine des Arts", description: "Cocktail et dîner dansant" } as LocationItem
  ];
  
  const rawProgramItems = (wedding.config?.sections?.programItems?.length ? wedding.config.sections.programItems : []) as ProgramItem[];
  const programItems = rawProgramItems.length > 0 ? rawProgramItems : [
      { time: "16:00", title: "Cérémonie", description: "Mairie" } as ProgramItem,
      { time: "18:00", title: "Cocktail", description: "Jardins du Domaine" } as ProgramItem,
      { time: "20:00", title: "Dîner", description: "Salle Principale" } as ProgramItem
  ];

  const rawGallery = wedding.config?.sections?.galleryImages?.length ? wedding.config.sections.galleryImages : ((wedding.config?.media as any)?.galleryImages?.length ? (wedding.config.media as any).galleryImages : []);
  const galleryImages = rawGallery.length > 0 ? rawGallery : [
      "https://images.unsplash.com/photo-1519741497674-611481863552?w=800&q=80",
      "https://images.unsplash.com/photo-1511285560929-80b456fea0bc?w=800&q=80",
      "https://images.unsplash.com/photo-1606800052052-a08af7148866?w=800&q=80",
      "https://images.unsplash.com/photo-1519225421980-715cb0215aed?w=800&q=80"
  ];

  const heroImage = draftMedia.heroImage || "https://images.unsplash.com/photo-1606800052052-a08af7148866?w=1600&q=80";
  const couplePhoto = draftMedia.couplePhoto || "https://images.unsplash.com/photo-1606800052052-a08af7148866?w=800&q=80";

  const { scrollYProgress } = useScroll();
  const yHeroText = useTransform(scrollYProgress, [0, 1], [0, 300]);
  const yHeroImg = useTransform(scrollYProgress, [0, 1], [0, 100]);

  const renderHeader = () => {
     if (headerModel === "model1") {
         return (
            <header className={`fixed top-0 w-full z-50 transition-all duration-500 ${isScrolled ? "py-4 md:py-6 bg-white/80 backdrop-blur-md shadow-sm" : "py-8 md:py-12 bg-transparent"}`}>
                <div className="max-w-[1800px] mx-auto px-6 md:px-12 flex justify-between items-center">
                  <span className={`text-xl font-black tracking-tighter uppercase transition-colors duration-500 ${isScrolled ? "text-black" : "text-white"}`}>
                    {wedding.title}
                  </span>
                  <nav className={`hidden md:flex gap-10 text-[10px] font-black uppercase tracking-[0.3em] transition-colors duration-500 ${isScrolled ? "text-black" : "text-white"}`}>
                    <a href="#story" className="hover:opacity-50 transition-opacity">Histoire</a>
                    <a href="#program" className="hover:opacity-50 transition-opacity">Agenda</a>
                    <a href="#gallery" className="hover:opacity-50 transition-opacity">Galerie</a>
                    <a href="#rsvp" className={`px-4 py-2 transition-all duration-500 ${isScrolled ? "bg-black text-white" : "bg-white text-black"}`}>RSVP</a>
                  </nav>
                </div>
            </header>
         );
     }
     if (headerModel === "model2") {
         return (
            <header className="absolute top-0 w-full z-50 p-6 md:px-12 md:py-8 flex text-white justify-between items-center mix-blend-difference">
                <nav className="flex gap-8 text-[10px] md:text-sm uppercase tracking-[0.2em]">
                   <a href="#story" className="hover:italic">Histoire</a>
                   <a href="#program" className="hover:italic">Programme</a>
                </nav>
                <div className="absolute left-1/2 -translate-x-1/2 text-2xl font-serif italic text-center leading-none">
                    {wedding.title}
                </div>
                <nav className="flex gap-8 text-[10px] md:text-sm uppercase tracking-[0.2em] text-right">
                   <a href="#gallery" className="hover:italic">Galerie</a>
                   <a href="#rsvp" className="hover:italic font-bold">RSVP</a>
                </nav>
            </header>
         );
     }
     return (
         <header className="absolute top-0 left-0 h-full z-50 p-8 flex flex-col justify-between py-12 mix-blend-difference text-white">
             <div className="vertical-text text-sm uppercase tracking-[0.4em] origin-top-left -rotate-90 translate-y-24 font-bold">{wedding.title}</div>
             <a href="#rsvp" className="vertical-text text-xs uppercase tracking-[0.2em] origin-bottom-left -rotate-90 -translate-y-20 border-b pb-2 hover:border-transparent">RSVP NOUVELLE</a>
         </header>
     );
  };

  const renderRSVP = () => {
      const [presence, setPresence] = useState<boolean | null>(true);
      const [isCouple, setIsCouple] = useState<boolean>(false);

      useEffect(() => {
          if (presence !== true) {
              setIsCouple(false);
          }
      }, [presence]);

      const bespokeRSVPForm = (
          <div className="w-full max-w-xl mx-auto space-y-6 text-left">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <input type="text" placeholder="Prénom" className="w-full bg-transparent border-b border-current/30 px-0 py-3 outline-none focus:border-current transition-colors placeholder:text-current/30 text-sm font-light uppercase tracking-widest" />
                 <input type="text" placeholder="Nom" className="w-full bg-transparent border-b border-current/30 px-0 py-3 outline-none focus:border-current transition-colors placeholder:text-current/30 text-sm font-light uppercase tracking-widest" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <input type="email" placeholder="Adresse Email" className="w-full bg-transparent border-b border-current/30 px-0 py-3 outline-none focus:border-current transition-colors placeholder:text-current/30 text-sm font-light uppercase tracking-widest" />
                 <input type="tel" placeholder="Téléphone (Optionnel)" className="w-full bg-transparent border-b border-current/30 px-0 py-3 outline-none focus:border-current transition-colors placeholder:text-current/30 text-sm font-light uppercase tracking-widest" />
              </div>
              
              <div className="space-y-8 py-4">
                 <div className="flex flex-wrap gap-8 items-center">
                    <span className="text-[10px] uppercase font-bold opacity-30 w-full md:w-auto">Présence</span>
                    <div className="flex gap-6">
                        <button type="button" onClick={() => setPresence(true)} className="flex items-center gap-3 cursor-pointer group">
                            <div className={`w-5 h-5 border border-current rounded-full flex items-center justify-center transition-all ${presence === true ? 'bg-current' : ''}`}>
                                {presence === true && <div className="w-1.5 h-1.5 bg-[var(--wedding-secondary)] rounded-full" />}
                            </div>
                            <span className={`text-xs uppercase tracking-widest font-bold ${presence === true ? 'opacity-100' : 'opacity-40'}`}>Sera Présent</span>
                        </button>
                        <button type="button" onClick={() => setPresence(false)} className="flex items-center gap-3 cursor-pointer group">
                            <div className={`w-5 h-5 border border-current rounded-full flex items-center justify-center transition-all ${presence === false ? 'bg-current' : ''}`}>
                                {presence === false && <div className="w-1.5 h-1.5 bg-[var(--wedding-secondary)] rounded-full" />}
                            </div>
                            <span className={`text-xs uppercase tracking-widest font-bold ${presence === false ? 'opacity-100' : 'opacity-40'}`}>Ne Sera Pas</span>
                        </button>
                    </div>
                 </div>

                 {presence === true && (
                  <div className="animate-in fade-in slide-in-from-top-2 duration-500">
                    <p className="text-[10px] uppercase tracking-widest font-bold opacity-30 mb-4">Accompagnement</p>
                    <div className="flex gap-6">
                        <button type="button" onClick={() => setIsCouple(false)} className="flex items-center gap-3 cursor-pointer group">
                            <div className={`w-5 h-5 border border-current rounded-full flex items-center justify-center transition-all ${!isCouple ? 'bg-current' : ''}`}>
                                {!isCouple && <div className="w-1.5 h-1.5 bg-[var(--wedding-secondary)] rounded-full" />}
                            </div>
                            <span className={`text-xs uppercase tracking-widest font-bold ${!isCouple ? 'opacity-100' : 'opacity-40'}`}>Seul(e)</span>
                        </button>
                        <button type="button" onClick={() => setIsCouple(true)} className="flex items-center gap-3 cursor-pointer group">
                            <div className={`w-5 h-5 border border-current rounded-full flex items-center justify-center transition-all ${isCouple ? 'bg-current' : ''}`}>
                                {isCouple && <div className="w-1.5 h-1.5 bg-[var(--wedding-secondary)] rounded-full" />}
                            </div>
                            <span className={`text-xs uppercase tracking-widest font-bold ${isCouple ? 'opacity-100' : 'opacity-40'}`}>En couple</span>
                        </button>
                    </div>
                  </div>
                 )}
              </div>

              <textarea placeholder="Allergies ou un petit mot pour nous ?" className="w-full bg-transparent border-b border-current/30 px-0 py-3 min-h-[100px] outline-none focus:border-current transition-colors placeholder:text-current/30 text-sm font-light resize-none"></textarea>
              <button className="w-full mt-8 bg-current text-[var(--wedding-secondary)] py-4 text-xs uppercase tracking-[0.2em] font-bold hover:opacity-80 transition-opacity flex items-center justify-center gap-4 group">
                  <InlineEditor value={rsvpButton} onSave={(val) => props.onSaveText("rsvpButton", val)} canEdit={canEdit && editMode} />
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-2 transition-transform" />
              </button>
          </div>
      );

      if (rsvpModel === "model1") {
          return (
             <div id="rsvp" className="mb-24 mx-4 md:mx-auto max-w-5xl relative z-10 text-center">
                <div className="mb-12">
                   <h2 className="text-4xl md:text-6xl font-serif italic mb-6"><InlineEditor value={rsvpTitle} onSave={(val) => props.onSaveText("rsvpTitle", val)} canEdit={canEdit && editMode} /></h2>
                   <p className="opacity-60 max-w-lg mx-auto font-light"><InlineEditor value={rsvpDescription} onSave={(val) => props.onSaveText("rsvpDescription", val)} canEdit={canEdit && editMode} /></p>
                </div>
                {bespokeRSVPForm}
             </div>
          );
      }
      if (rsvpModel === "model2") {
          return (
             <div id="rsvp" className="mb-24 px-4 w-full">
                 <div className="max-w-4xl mx-auto flex flex-col md:flex-row gap-16 items-center">
                    <div className="flex-1 text-left space-y-6">
                        <div className="w-16 h-px bg-current mb-8" />
                        <h2 className="text-5xl font-bold tracking-tighter uppercase mb-4"><InlineEditor value={rsvpTitle} onSave={(val) => props.onSaveText("rsvpTitle", val)} canEdit={canEdit && editMode} /></h2>
                        <p className="opacity-60 max-w-md font-light"><InlineEditor value={rsvpDescription} onSave={(val) => props.onSaveText("rsvpDescription", val)} canEdit={canEdit && editMode} /></p>
                    </div>
                    <div className="flex-1 w-full bg-[var(--wedding-primary)] text-[var(--wedding-secondary)] p-12 shadow-2xl">
                        {bespokeRSVPForm}
                    </div>
                 </div>
             </div>
          );
      }
      return (
         <div id="rsvp" className="bg-black text-white py-32 mb-16 px-6">
             <div className="max-w-5xl mx-auto flex flex-col md:flex-row gap-20 items-center">
                 <div className="flex-1 text-left space-y-8 order-last md:order-first w-full">
                     {bespokeRSVPForm}
                 </div>
                 <div className="flex-1 text-right space-y-6">
                     <h2 className="text-6xl md:text-8xl font-serif italic text-white/90 leading-none"><InlineEditor value={rsvpTitle} onSave={(val) => props.onSaveText("rsvpTitle", val)} canEdit={canEdit && editMode} /></h2>
                     <p className="text-white/50 font-light ml-auto max-w-sm"><InlineEditor value={rsvpDescription} onSave={(val) => props.onSaveText("rsvpDescription", val)} canEdit={canEdit && editMode} /></p>
                 </div>
             </div>
         </div>
      );
  };

  const renderFooter = () => {
      if (footerModel === "model1") {
          return (
             <footer className="py-24 border-t border-[var(--wedding-primary)]/10 text-center bg-[var(--wedding-secondary)]">
                <span className="text-base uppercase tracking-[0.5em] font-bold block mb-4">{wedding.title}</span>
                <span className="text-sm tracking-widest uppercase block mb-12">{heroDate}</span>
                <div className="text-xs font-medium">Fait avec amour sur <a href="https://daylora.app" target="_blank" rel="noopener noreferrer" className="font-bold hover:underline">Daylora</a></div>
             </footer>
          );
      }
      if (footerModel === "model2") {
          return (
             <footer className="relative py-32 bg-[var(--wedding-primary)] text-[var(--wedding-secondary)] flex flex-col items-center justify-center">
                 <div className="text-8xl md:text-[150px] font-serif italic leading-none opacity-20 mb-8 select-none">
                     {wedding.title.split(' ').map((w: string) => w[0]).join('&')}
                 </div>
                 <div className="text-base uppercase tracking-[0.4em] font-light z-10 mb-12">{heroDate}</div>
                 <div className="absolute bottom-8 left-1/2 -translate-x-1/2 w-full text-center text-xs font-medium uppercase tracking-widest">Fait avec amour sur <a href="https://daylora.app" target="_blank" rel="noopener noreferrer" className="font-bold hover:underline">Daylora</a></div>
             </footer>
          );
      }
      return (
          <footer className="min-h-[50vh] flex flex-col justify-between bg-black text-white p-12">
              <div className="text-3xl md:text-6xl max-w-3xl font-bold leading-tight">Merci de faire partie de notre incroyable aventure.</div>
              <div className="flex justify-between items-end mt-20 border-t border-white/20 pt-8 flex-wrap gap-4">
                  <div className="flex flex-col gap-3">
                      <span className="text-base tracking-widest font-serif italic text-white/90">{wedding.title}</span>
                      <div className="text-xs font-medium text-white/90">Fait avec amour sur <a href="https://daylora.app" target="_blank" rel="noopener noreferrer" className="font-bold text-white hover:underline">Daylora</a></div>
                  </div>
                  <span className="text-sm uppercase tracking-[0.2em] font-bold">À Très Vite</span>
              </div>
          </footer>
      );
  };

  return (
    <div className={`min-h-screen bg-[var(--wedding-secondary)] text-[var(--wedding-primary)] ${fontClass} selection:bg-black selection:text-white`} style={cssVars}>
      
      {renderHeader()}

      <section className="relative h-screen w-full flex flex-col md:flex-row overflow-hidden border-b border-[var(--wedding-primary)]/10">
        <motion.div style={{ y: yHeroText }} className="flex-1 flex flex-col justify-center p-8 md:p-20 z-10 bg-gradient-to-r from-[var(--wedding-secondary)] via-[var(--wedding-secondary)] to-transparent">
          <motion.div initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1, ease: "easeOut" }}>
            <h2 className="text-sm tracking-[0.3em] uppercase opacity-60 mb-6">
                <InlineEditor value={heroSubtitle} onSave={(val) => props.onSaveText("heroSubtitle", val)} canEdit={canEdit && editMode} />
            </h2>
            <h1 className="text-6xl md:text-8xl lg:text-9xl font-bold italic leading-[0.8] tracking-tighter mb-8 max-w-[20ch]">
                <InlineEditor value={heroTitle} onSave={(val) => props.onSaveText("heroTitle", val)} canEdit={canEdit && editMode} />
            </h1>
            <p className="text-xl md:text-2xl font-light mb-12 opacity-80 inline-block border-b border-current pb-2">
                <InlineEditor value={heroDate} onSave={(val) => props.onSaveText("weddingDate", val)} canEdit={canEdit && editMode} />
            </p>
            <button onClick={props.onHeroCtaClick} className="group mt-12 bg-current text-[var(--wedding-secondary)] px-10 py-5 text-[10px] md:text-xs font-black tracking-[0.4em] uppercase hover:opacity-90 transition-all flex items-center gap-6 shadow-2xl">
                <InlineEditor value={heroCta} onSave={(val) => props.onSaveText("heroCta", val)} canEdit={canEdit && editMode} />
                <ArrowRight className="w-5 h-5 group-hover:translate-x-2 transition-transform shrink-0" />
            </button>
          </motion.div>
        </motion.div>
        <motion.div style={{ y: yHeroImg }} className="absolute md:relative inset-0 md:inset-auto md:flex-1 h-full w-full">
          <img src={heroImage} alt="Hero" className="w-full h-full object-cover object-center grayscale hover:grayscale-0 transition-all duration-1000" />
          <div className="absolute inset-0 bg-black/20 md:hidden" />
          
          {canEdit && editMode && (
             <label className="absolute inset-x-0 bottom-10 mx-auto w-max z-50 bg-black/50 backdrop-blur-md rounded-full px-6 py-3 cursor-pointer border border-white/20 text-white flex items-center gap-3 hover:bg-black/70 transition-all text-sm uppercase tracking-widest font-bold shadow-2xl">
                <Camera className="w-5 h-5" /> Modifier l'image Principale
                <input type="file" className="hidden" accept="image/*" onChange={props.onMediaUpload("heroImage")} />
             </label>
          )}
        </motion.div>
      </section>

      <section id="story" className="py-32 px-6 md:px-20 max-w-7xl mx-auto flex flex-col md:flex-row items-center gap-16 relative">
        <div className="flex-1 relative w-full">
           <div className="aspect-[3/4] w-full max-w-md mx-auto md:mr-auto overflow-hidden relative group shadow-2xl">
             <motion.img 
                  initial={{ scale: 1.1 }} whileInView={{ scale: 1 }} transition={{ duration: 1.5 }}
                  src={couplePhoto} alt="Couple" className="w-full h-full object-cover" 
             />
             {canEdit && editMode && (
                 <label className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer text-white flex-col gap-2 shadow-inner">
                     <Camera className="w-8 h-8" />
                     <span className="text-xs uppercase tracking-widest">Image du Couple</span>
                     <input type="file" className="hidden" accept="image/*" onChange={props.onMediaUpload("couplePhoto")} />
                 </label>
             )}
           </div>
           <div className="absolute -bottom-8 -right-8 w-48 aspect-square bg-[var(--wedding-primary)] text-[var(--wedding-secondary)] p-8 rounded-full items-center justify-center text-center hidden xl:flex animate-[spin_20s_linear_infinite] shadow-2xl">
             <span className="text-xs uppercase tracking-[0.25em] font-bold">Notre Amour • Notre Histoire • </span>
           </div>
        </div>
        <div className="flex-1 space-y-8 text-center md:text-left">
          <h2 className="text-5xl md:text-7xl italic font-serif">
              <InlineEditor value={storyTitle} onSave={(val) => props.onSaveText("storyTitle", val)} canEdit={canEdit && editMode} />
          </h2>
          <p className="text-lg md:text-xl leading-relaxed opacity-80 whitespace-pre-wrap font-light">
              <InlineEditor value={storyBody} onSave={(val) => props.onSaveText("storyBody", val)} canEdit={canEdit && editMode} />
          </p>
        </div>
      </section>

      <section id="program" className="py-32 bg-[var(--wedding-primary)] text-[var(--wedding-secondary)] px-6 md:px-20">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-24">
          <div className="space-y-16">
            <div className="flex items-end justify-between border-b border-current/20 pb-8">
               <h2 className="text-5xl md:text-7xl font-bold tracking-tighter">Agenda.</h2>
               {canEdit && editMode && (
                   <button onClick={props.onAddProgramItem} className="flex gap-2 items-center text-xs uppercase tracking-widest hover:opacity-100 opacity-50 bg-white/10 px-4 py-2 rounded-full">
                       <Plus className="w-4 h-4" /> Ajouter
                   </button>
               )}
            </div>
            <div className="space-y-12">
              {programItems.map((item, idx) => (
                <div key={idx} className="flex gap-8 group relative">
                  <div className="text-2xl md:text-3xl font-light opacity-50 w-24 shrink-0">
                      <InlineEditor value={item.time} onSave={(val) => props.onUpdateProgramItem(idx.toString(), { time: val })} canEdit={canEdit && editMode} />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl md:text-2xl font-bold mb-2">
                        <InlineEditor value={item.title} onSave={(val) => props.onUpdateProgramItem(idx.toString(), { title: val })} canEdit={canEdit && editMode} />
                    </h3>
                    <p className="opacity-70 leading-relaxed font-light">
                        <InlineEditor value={item.description} onSave={(val) => props.onUpdateProgramItem(idx.toString(), { description: val })} canEdit={canEdit && editMode} />
                    </p>
                  </div>
                  {canEdit && editMode && (
                      <button onClick={() => props.onDeleteProgramItem(idx.toString())} className="absolute right-0 top-0 opacity-0 group-hover:opacity-100 transition-opacity text-red-400 p-2 hover:bg-white/5 rounded-full">
                          <Trash2 className="w-5 h-5" />
                      </button>
                  )}
                </div>
              ))}
            </div>
          </div>
          <div className="space-y-16">
            <div className="flex items-end justify-between border-b border-current/20 pb-8">
               <h2 className="text-5xl md:text-7xl font-bold tracking-tighter italic">Lieux.</h2>
               {canEdit && editMode && (
                   <button onClick={props.onAddLocationItem} className="flex gap-2 items-center text-xs uppercase tracking-widest hover:opacity-100 opacity-50 bg-white/10 px-4 py-2 rounded-full">
                       <Plus className="w-4 h-4" /> Ajouter
                   </button>
               )}
            </div>
            <div className="space-y-12">
              {locationItems.map((item, idx) => (
                <div key={idx} className="border-b border-current/10 pb-12 mb-12 group relative">
                  <h3 className="text-2xl md:text-3xl font-bold mb-4">
                      <InlineEditor value={item.title} onSave={(val) => props.onUpdateLocationItem(idx.toString(), { title: val })} canEdit={canEdit && editMode} />
                  </h3>
                  <p className="font-mono text-xs uppercase tracking-[0.2em] opacity-80 mb-6 flex items-start gap-3 bg-white/5 px-4 py-2 rounded">
                    <MapPin className="h-4 w-4 shrink-0 mt-1" />
                    <span className="flex-1 leading-relaxed">
                        <InlineEditor value={item.address} onSave={(val) => props.onUpdateLocationItem(idx.toString(), { address: val })} canEdit={canEdit && editMode} />
                    </span>
                  </p>
                  <p className="opacity-70 leading-relaxed font-light">
                      <InlineEditor value={item.description} onSave={(val) => props.onUpdateLocationItem(idx.toString(), { description: val })} canEdit={canEdit && editMode} />
                  </p>
                  {canEdit && editMode && (
                      <button onClick={() => props.onDeleteLocationItem(idx.toString())} className="absolute right-0 top-0 opacity-0 group-hover:opacity-100 transition-opacity text-red-400 p-2 hover:bg-white/5 rounded-full">
                          <Trash2 className="w-5 h-5" />
                      </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="gallery" className="py-40 bg-[#0A0A0A] overflow-hidden relative">
        <div className="px-6 md:px-20 mb-20 flex justify-between items-end text-white max-w-7xl mx-auto">
          <h2 className="text-5xl md:text-8xl font-bold tracking-tighter">Galerie.</h2>
          {canEdit && editMode && (
             <label className="flex gap-2 items-center text-xs uppercase tracking-widest hover:opacity-100 opacity-80 bg-white/10 px-6 py-3 rounded-full cursor-pointer hover:bg-white/20 transition-colors border border-white/20">
                 <Camera className="w-4 h-4" /> Ajouter des images
                 <input type="file" multiple className="hidden" accept="image/*" onChange={props.onGalleryFilesSelected} />
             </label>
          )}
        </div>
        
        {galleryImages.length === 0 ? (
           <div className="px-6 md:px-20 text-center text-white/50 py-20 font-light italic">
               Ajoutez des photos pour donner vie à cette section vibrante.
           </div>
        ) : (
           <div className="flex gap-4 md:gap-8 px-6 md:px-20 overflow-x-auto snap-x snap-mandatory pb-12 hide-scrollbar">
             {galleryImages.map((src: any, idx: any) => (
               <motion.div 
                  key={idx} 
                  initial={{ opacity: 0, scale: 0.9 }} whileInView={{ opacity: 1, scale: 1 }} transition={{ delay: idx * 0.1 }}
                  className={`snap-center shrink-0 w-[80vw] md:w-[40vw] ${idx % 2 === 0 ? 'aspect-[4/3]' : 'aspect-square'} overflow-hidden grayscale hover:grayscale-0 transition-all duration-700 relative group`}
               >
                 <img src={typeof src === 'string' ? src : src.url} alt="Gallery" className="w-full h-full object-cover" />
                 {canEdit && editMode && (
                     <button onClick={() => props.onRemoveGalleryImage(idx)} className="absolute top-4 right-4 bg-red-500 text-white p-3 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600 shadow-xl">
                         <Trash2 className="w-5 h-5" />
                     </button>
                 )}
               </motion.div>
             ))}
           </div>
        )}
      </section>

      {/* RSVP & Gifts Wrapper */}
      <section className="pt-16 pb-12 px-6 md:px-20 w-full relative z-10 overflow-hidden">
         {renderRSVP()}
         
         {((wedding?.config?.navigation?.pages as any)?.gifts ?? true) && (
           <div id="gifts" className="bg-transparent mb-16 mx-4 md:mx-auto max-w-4xl relative">
              <h3 className="text-2xl uppercase tracking-widest text-center mb-12">Liste de cadeaux</h3>
              <GiftsSection {...props} tokens={getTokens("minimal")} giftsTitle={giftsTitle} giftsDescription={giftsDescription} gifts={giftsData} order={1} />
           </div>
         )}
         
         {((wedding?.config?.navigation?.pages as any)?.cagnotte ?? true) && (
           <div id="cagnotte" className="bg-transparent mb-16 mx-4 md:mx-auto max-w-4xl relative">
              <h3 className="text-2xl uppercase tracking-widest text-center mb-12">Cagnotte</h3>
              <CagnotteSection {...props} tokens={getTokens("minimal")} cagnotteTitle={cagnotteTitle} cagnotteDescription={cagnotteDescription} contributionMethods={contributionMethods} buttonRadiusClass="-sm" order={2} />
           </div>
         )}
      </section>
      
      {/* Avant-garde Footer */}
      {renderFooter()}

      <style dangerouslySetInnerHTML={{__html: `
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        .vertical-text { writing-mode: vertical-rl; }
      `}} />
    </div>
  );
}
