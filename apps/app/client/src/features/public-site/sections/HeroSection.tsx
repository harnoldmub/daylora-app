import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { InlineEditor } from "@/components/ui/inline-editor";
import type { HeroSectionProps } from "@/features/public-site/types";

const FloralDecoration = () => (
  <svg viewBox="0 0 100 100" className="w-16 h-16 mx-auto mb-6 text-black/10 transition-transform hover:scale-110 duration-700" fill="currentColor">
    <path d="M50,10 C60,30 90,40 50,90 C10,40 40,30 50,10 Z" />
    <path d="M50,40 C70,50 80,80 50,90 C20,80 30,50 50,40 Z" opacity="0.5" />
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
  const isLeft = tokens.hero.alignment === "left";

  return (
    <section id="hero" className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {heroImage ? (
        <motion.div
          className={`absolute inset-0 bg-cover bg-center ${tokens.hero.imageOpacity}`}
          style={{ backgroundImage: `url(${heroImage})` }}
          initial={{ scale: 1 }}
          animate={{ scale: 1.08 }}
          transition={{ duration: 20, repeat: Infinity, repeatType: "reverse", ease: "easeInOut" }}
        />
      ) : (
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-background to-secondary" />
          <div
            className="absolute inset-0 opacity-60"
            style={{
              backgroundImage:
                "radial-gradient(ellipse at 20% 15%, rgba(255,255,255,0.55), transparent 55%), radial-gradient(ellipse at 80% 80%, rgba(0,0,0,0.08), transparent 60%)",
            }}
          />
        </div>
      )}
      <div className={`absolute inset-0 bg-gradient-to-b ${tokens.hero.overlay}`} />

      <div className={`relative z-10 mx-auto ${tokens.hero.wrapper}`}>
        <div>
          {tokens.hero.decoration === "floral" && <FloralDecoration />}

          <div className={`flex items-center mb-10 ${isLeft ? "justify-start" : "justify-center"}`}>
            {logoUrl ? (
              <img
                src={logoUrl}
                alt={logoText}
                className="h-16 md:h-20 object-contain drop-shadow-xl"
              />
            ) : (
              <div className={`text-xs font-black uppercase tracking-[0.4em] ${isLeft ? "text-white/70" : "text-muted-foreground"}`}>
                {logoText || "L'Union"}
              </div>
            )}
          </div>

          <motion.div
            className={`mb-6 flex ${isLeft ? "justify-start" : "justify-center"} ${tokens.hero.subtitle}`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <InlineEditor
              value={heroSubtitle}
              onSave={(val) => onSaveText("heroSubtitle", val)}
              canEdit={canEdit && editMode}
              placeholder="Le Mariage de"
            />
          </motion.div>

          <h1 className={`${tokens.hero.title} mb-8 drop-shadow-2xl`}>
            <InlineEditor
              value={heroTitle}
              onSave={(val) => onSaveText("heroTitle", val)}
              canEdit={canEdit && editMode}
              placeholder={wedding.title}
              className={isLeft ? "text-left" : "text-center"}
            />
          </h1>

          <div className="mb-12">
            <div className={`${tokens.hero.date} ${isLeft ? "justify-start" : "justify-center"}`}>
              <InlineEditor
                value={heroDate}
                onSave={(val) => onSaveText("weddingDate", val)}
                canEdit={canEdit && editMode}
                placeholder="19 & 21 mars 2026"
              />
            </div>
          </div>

          <div className={`flex ${isLeft ? "justify-start" : "justify-center"}`}>
            <Button
              size="lg"
              className={`${tokens.hero.button} ${buttonToneClass} ${buttonRadiusClass}`}
              onClick={onHeroCtaClick}
            >
              {heroCta}
            </Button>
          </div>

          {canEdit && editMode ? (
            <div className={`mt-10 ${isLeft ? "text-left" : "text-center"}`}>
              <div className="rounded-2xl bg-white/80 border border-primary/10 px-4 py-3 shadow-sm inline-block text-left">
                <div className="text-[11px] uppercase tracking-widest text-muted-foreground mb-2">Action du bouton</div>
                <select
                  className="h-10 rounded-md border border-border bg-background px-3 text-sm w-full"
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

              <div className="mt-4 text-sm text-muted-foreground">
                <span className="font-medium text-foreground">Texte du bouton:</span>{" "}
                <InlineEditor
                  value={heroCta}
                  onSave={(val) => onSaveText("heroCta", val)}
                  canEdit={canEdit && editMode}
                  placeholder="Confirmer votre présence"
                />
              </div>

              <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="rounded-2xl bg-white/80 border border-primary/10 px-4 py-3 shadow-sm">
                  <div className="text-[11px] uppercase tracking-widest text-muted-foreground mb-2">Image de couverture</div>
                  <input type="file" accept="image/*" onChange={onMediaUpload("heroImage")} />
                  <div className="mt-2 flex items-center gap-2">
                    <Button type="button" size="sm" variant="outline" onClick={() => onUpdateMedia("heroImage", "")} disabled={!heroImage || isUploading.heroImage}>
                      Supprimer
                    </Button>
                    {isUploading.heroImage ? <span className="text-xs text-muted-foreground">Import...</span> : null}
                  </div>
                </div>
                <div className="rounded-2xl bg-white/80 border border-primary/10 px-4 py-3 shadow-sm">
                  <div className="text-[11px] uppercase tracking-widest text-muted-foreground mb-2">Countdown</div>
                  <input
                    type="datetime-local"
                    className="h-10 rounded-md border border-border bg-background px-3 text-sm w-full"
                    value={toDateInputValue(countdownDate)}
                    onChange={(e) => onSaveCountdownDate(fromDateInputValue(e.target.value))}
                  />
                  <div className="mt-2 text-xs text-muted-foreground">Change la date du compte à rebours.</div>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}
