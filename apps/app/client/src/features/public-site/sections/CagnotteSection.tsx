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
          <div className="mt-10 max-w-2xl mx-auto text-left space-y-3">
            <div className="text-xs uppercase tracking-widest font-bold opacity-60">Lien de cagnotte</div>
            <Input
              value={draftCagnotteExternalUrl}
              onChange={(e) => onSetDraftCagnotteExternalUrl(e.target.value)}
              onBlur={(e) => onSaveCagnotteExternalUrl(e.target.value)}
              placeholder="https://..."
              className="h-12 rounded-2xl bg-white/70 border-primary/10 focus:ring-primary/20"
              inputMode="url"
            />
            <div className="text-xs opacity-60">
              Le bouton redirigera vers ce lien (Leetchi, PayPal, Lydia, Stripe Payment Link, etc.).
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
          <div className="mt-10 flex justify-center">
            <Button size="lg" variant="outline" className="rounded-full px-12" disabled>
              Ajoutez un lien pour activer la cagnotte
            </Button>
          </div>
        ) : null}
      </div>
    </section>
  );
}
