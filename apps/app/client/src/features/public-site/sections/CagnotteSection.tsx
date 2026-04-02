import { Gift as GiftIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { InlineEditor } from "@/components/ui/inline-editor";
import type { CagnotteSectionProps } from "@/features/public-site/types";

export function CagnotteSection({
  tokens,
  cagnotteTitle,
  cagnotteDescription,
  cagnotteSubmitLabel,
  cagnottePath,
  hasContributionMethods,
  contributionMethodsCount,
  buttonRadiusClass,
  onSaveText,
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

        {hasContributionMethods ? (
          <div className="mt-10 flex justify-center">
            <a href={cagnottePath}>
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

        {canEdit && editMode && (
          <div className="mt-10 flex justify-center animate-in fade-in duration-200">
            <div className="text-xs text-muted-foreground/50 font-medium px-5 py-2.5 rounded-full border border-dashed border-muted-foreground/20">
              {hasContributionMethods
                ? `${contributionMethodsCount} moyen${contributionMethodsCount > 1 ? "s" : ""} de contribution configuré${contributionMethodsCount > 1 ? "s" : ""}`
                : "Configurez vos moyens de contribution dans le design (section cagnotte)"}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
