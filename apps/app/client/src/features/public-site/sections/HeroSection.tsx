import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { InlineEditor } from "@/components/ui/inline-editor";
import type { HeroSectionProps } from "@/features/public-site/types";

const OrnamentDivider = () => (
  <svg viewBox="0 0 200 24" className="w-32 md:w-48 h-6 mx-auto opacity-40" fill="none" stroke="currentColor" strokeWidth="1">
    <line x1="0" y1="12" x2="80" y2="12" />
    <circle cx="100" cy="12" r="4" fill="currentColor" />
    <line x1="120" y1="12" x2="200" y2="12" />
  </svg>
);

export function HeroSection({
  tokens,
  wedding,
  heroTitle,
  heroSubtitle,
  heroDate,
  heroCta,
  heroImage,
  logoUrl,
  logoText,
  countdownDate,
  ctaPath,
  buttonToneClass,
  buttonRadiusClass,
  onSaveText,
  onHeroCtaClick,
  onMediaUpload,
  onUpdateMedia,
  isUploading,
  onSaveCountdownDate,
  onSaveCtaPath,
  toDateInputValue,
  fromDateInputValue,
  canEdit,
  editMode,
}: HeroSectionProps) {
  return (
    <section id="hero" className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {heroImage ? (
        <motion.div
          className={`absolute inset-0 bg-cover bg-center ${tokens.hero.imageOpacity}`}
          style={{ backgroundImage: `url(${heroImage})` }}
          initial={{ scale: 1 }}
          animate={{ scale: 1.06 }}
          transition={{ duration: 25, repeat: Infinity, repeatType: "reverse", ease: "easeInOut" }}
        />
      ) : (
        <div className="absolute inset-0" style={{ background: `linear-gradient(135deg, var(--wedding-secondary) 0%, color-mix(in srgb, var(--wedding-primary) 8%, var(--wedding-secondary)) 50%, var(--wedding-secondary) 100%)` }} />
      )}
      <div className="absolute inset-0" style={{ background: heroImage ? 'linear-gradient(to bottom, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.3) 50%, rgba(0,0,0,0.6) 100%)' : 'transparent' }} />

      <div className="relative z-10 mx-auto text-center max-w-4xl px-6 py-20 space-y-8">
        {logoUrl ? (
          <motion.div
            className="flex justify-center mb-4"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <img src={logoUrl} alt={logoText} className="h-16 md:h-20 object-contain drop-shadow-xl" />
          </motion.div>
        ) : null}

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="space-y-6"
        >
          <div className={heroImage ? "text-white/80" : ""} style={!heroImage ? { color: 'var(--wedding-primary)', opacity: 0.7 } : undefined}>
            <OrnamentDivider />
          </div>

          <p className="text-sm md:text-base tracking-[0.3em] uppercase font-light" style={{ color: heroImage ? 'rgba(255,255,255,0.85)' : 'var(--wedding-text-subtle)' }}>
            <InlineEditor
              value={heroSubtitle}
              onSave={(val) => onSaveText("heroSubtitle", val)}
              canEdit={canEdit && editMode}
              placeholder="Vous êtes cordialement invité(e)"
            />
          </p>

          <p className="text-xs md:text-sm tracking-[0.2em] uppercase font-light" style={{ color: heroImage ? 'rgba(255,255,255,0.6)' : 'var(--wedding-text-subtle)' }}>
            au mariage de
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1, delay: 0.5 }}
        >
          <h1 className="text-5xl md:text-8xl lg:text-9xl font-serif font-bold leading-[0.95] tracking-tight" style={{
            color: heroImage ? '#FFFFFF' : 'var(--wedding-text-dark)',
            textShadow: heroImage ? '0 4px 30px rgba(0,0,0,0.4)' : 'none'
          }}>
            <InlineEditor
              value={heroTitle}
              onSave={(val) => onSaveText("heroTitle", val)}
              canEdit={canEdit && editMode}
              placeholder={wedding.title}
              className="text-center"
            />
          </h1>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.8 }}
          className="space-y-6"
        >
          <div className={heroImage ? "text-white/80" : ""} style={!heroImage ? { color: 'var(--wedding-primary)', opacity: 0.7 } : undefined}>
            <OrnamentDivider />
          </div>

          <div className="inline-flex flex-col items-center gap-1 py-4 px-10 border-y" style={{ borderColor: heroImage ? 'rgba(255,255,255,0.25)' : 'color-mix(in srgb, var(--wedding-primary) 30%, transparent)' }}>
            <span className="text-lg md:text-2xl font-serif tracking-widest" style={{ color: heroImage ? 'rgba(255,255,255,0.9)' : 'var(--wedding-text-dark)' }}>
              <InlineEditor
                value={heroDate}
                onSave={(val) => onSaveText("weddingDate", val)}
                canEdit={canEdit && editMode}
                placeholder="21 Mars 2026"
              />
            </span>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 1.1 }}
          className="pt-4"
        >
          <Button
            size="lg"
            className={`px-14 py-7 text-xs tracking-[0.3em] uppercase font-bold shadow-2xl transition-all hover:scale-105 ${buttonToneClass} ${buttonRadiusClass}`}
            onClick={onHeroCtaClick}
            style={{
              backgroundColor: 'var(--wedding-primary)',
              borderColor: 'var(--wedding-primary)',
              color: '#FFFFFF',
            }}
          >
            {heroCta}
          </Button>
        </motion.div>

        {canEdit && editMode ? (
          <div className="mt-10 text-center animate-in fade-in zoom-in-[0.98] duration-200">
            <div className="inline-block max-w-lg w-full">
              <div className="rounded-2xl bg-white/70 backdrop-blur-xl border border-white/50 shadow-xl p-5 space-y-4 text-left">
                <div className="space-y-2">
                  <div className="text-[10px] tracking-[0.2em] uppercase text-muted-foreground/70 font-medium">Action du bouton</div>
                  <select
                    className="h-9 rounded-xl border-transparent bg-[#FAF8F5] shadow-inner px-3 text-sm w-full focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all duration-200"
                    value={ctaPath}
                    onChange={(e) => onSaveCtaPath(e.target.value)}
                  >
                    <option value="rsvp">Aller vers RSVP</option>
                    <option value="story">Aller vers Histoire</option>
                    <option value="gallery">Aller vers Galerie</option>
                    <option value="gifts">Aller vers Cadeaux</option>
                    <option value="location">Aller vers Lieu</option>
                    <option value="program">Aller vers Programme</option>
                    <option value="cagnotte">Aller vers Cagnotte</option>
                    <option value="live">Aller vers Live</option>
                    {(wedding.config?.navigation?.customPages || [])
                      .filter((p: any) => p.enabled && p.slug)
                      .map((p: any) => (
                        <option key={p.id} value={`page:${p.slug}`}>
                          Page: {p.title}
                        </option>
                      ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <div className="text-[10px] tracking-[0.2em] uppercase text-muted-foreground/70 font-medium">Texte du bouton</div>
                  <InlineEditor
                    value={heroCta}
                    onSave={(val) => onSaveText("heroCta", val)}
                    canEdit={canEdit && editMode}
                    placeholder="Confirmer votre présence"
                  />
                </div>

                <div className="w-full h-px bg-border/50" />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <div className="text-[10px] tracking-[0.2em] uppercase text-muted-foreground/70 font-medium">Image de couverture</div>
                    <label className="flex items-center justify-center gap-2 h-9 px-3 rounded-xl bg-[#FAF8F5] border border-transparent hover:border-primary/15 cursor-pointer transition-all duration-200 text-xs text-muted-foreground">
                      {isUploading.heroImage ? "Import en cours..." : "Choisir une image"}
                      <input type="file" accept="image/*" className="hidden" onChange={onMediaUpload("heroImage")} />
                    </label>
                    {heroImage && (
                      <button type="button" className="text-[10px] text-muted-foreground hover:text-destructive transition-colors" onClick={() => onUpdateMedia("heroImage", "")}>
                        Supprimer l'image
                      </button>
                    )}
                  </div>
                  <div className="space-y-2">
                    <div className="text-[10px] tracking-[0.2em] uppercase text-muted-foreground/70 font-medium">Compte à rebours</div>
                    <input
                      type="datetime-local"
                      className="h-9 rounded-xl border-transparent bg-[#FAF8F5] shadow-inner px-3 text-sm w-full focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all duration-200"
                      value={toDateInputValue(countdownDate)}
                      onChange={(e) => onSaveCountdownDate(fromDateInputValue(e.target.value))}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </section>
  );
}
