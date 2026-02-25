import { Gift as GiftIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { InlineEditor } from "@/components/ui/inline-editor";
import type { CagnotteSectionProps } from "@/features/public-site/types";

export function CagnotteSection({
  tokens,
  cagnotteTitle,
  cagnotteDescription,
  cagnotteSubmitLabel,
  cagnotteCtaUrl,
  cagnotteMode,
  cagnotteExternalUrl,
  draftCagnotteExternalUrl,
  buttonToneClass,
  buttonRadiusClass,
  onSaveText,
  onSaveCagnotteExternalUrl,
  onSetDraftCagnotteExternalUrl,
  canEdit,
  editMode,
  order,
}: CagnotteSectionProps) {
  return (
    <section
      id="cagnotte"
      style={{ order }}
      className={`scroll-mt-24 py-24 px-6 ${tokens.cagnotte.section}`}
    >
      <div className="max-w-3xl mx-auto text-center space-y-6">
        <div className="w-16 h-16 mx-auto rounded-full flex items-center justify-center mb-6" style={{ backgroundColor: 'color-mix(in srgb, var(--wedding-primary) 10%, transparent)' }}>
          <GiftIcon className="h-8 w-8" style={{ color: 'var(--wedding-primary)' }} />
        </div>
        <h2 className="text-4xl md:text-5xl font-serif font-light mb-4 tracking-wide" style={{ color: 'var(--wedding-primary)' }}>
          <InlineEditor
            value={cagnotteTitle}
            onSave={(val) => onSaveText("cagnotteTitle", val)}
            canEdit={canEdit && editMode}
          />
        </h2>
        <div className="opacity-60 leading-relaxed max-w-2xl mx-auto text-base">
          <InlineEditor
            value={cagnotteDescription}
            onSave={(val) => onSaveText("cagnotteDescription", val)}
            canEdit={canEdit && editMode}
            isTextArea
          />
        </div>

        {canEdit && editMode ? (
          <div className="mt-10 max-w-md mx-auto animate-in fade-in zoom-in-[0.98] duration-200">
            <div className="rounded-2xl bg-white/70 backdrop-blur-xl border border-white/50 shadow-xl p-5 space-y-3 text-left">
              <div className="text-[10px] tracking-[0.2em] uppercase text-muted-foreground/70 font-medium">Lien de cagnotte</div>
              <Input
                value={draftCagnotteExternalUrl}
                onChange={(e) => onSetDraftCagnotteExternalUrl(e.target.value)}
                onBlur={(e) => onSaveCagnotteExternalUrl(e.target.value)}
                placeholder="https://leetchi.com/..."
                className="h-10 rounded-xl border-transparent bg-[#FAF8F5] shadow-inner focus:ring-2 focus:ring-primary/30 transition-all duration-200"
                inputMode="url"
              />
              <div className="text-[11px] text-muted-foreground/60">
                Leetchi, PayPal, Lydia, Stripe Payment Link, etc.
              </div>
            </div>
          </div>
        ) : null}

        {cagnotteCtaUrl ? (
          <div className="mt-10 flex justify-center">
            <a href={cagnotteCtaUrl} target={cagnotteMode === "external" ? "_blank" : undefined} rel={cagnotteMode === "external" ? "noopener noreferrer" : undefined}>
              <Button
                size="lg"
                className={`px-14 py-7 text-xs tracking-[0.3em] uppercase font-black shadow-2xl transition-all hover:scale-[1.02] ${buttonRadiusClass}`}
                style={{
                  backgroundColor: 'var(--wedding-primary)',
                  borderColor: 'var(--wedding-primary)',
                  color: '#FFFFFF',
                }}
              >
                {cagnotteSubmitLabel}
              </Button>
            </a>
          </div>
        ) : null}

        {cagnotteMode === "external" && cagnotteExternalUrl ? (
          <div className="mt-4 text-[10px] uppercase tracking-widest opacity-60">
            Paiement externe
          </div>
        ) : canEdit && editMode ? (
          <div className="mt-10 flex justify-center animate-in fade-in duration-200">
            <div className="text-xs text-muted-foreground/50 font-medium px-5 py-2.5 rounded-full border border-dashed border-muted-foreground/20">
              Ajoutez un lien ci-dessus pour activer la cagnotte
            </div>
          </div>
        ) : null}
      </div>
    </section>
  );
}
