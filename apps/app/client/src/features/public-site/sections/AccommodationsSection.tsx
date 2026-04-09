import { MapPin, ExternalLink } from "lucide-react";
import { InlineEditor } from "@/components/ui/inline-editor";
import type { AccommodationsSectionProps } from "@/features/public-site/types";

export function AccommodationsSection({
  tokens,
  accommodationTitle,
  accommodationDescription,
  accommodationItems,
  onSaveText,
  canEdit,
  editMode,
  order,
}: AccommodationsSectionProps) {
  if (!accommodationItems.length && !canEdit) return null;

  return (
    <section
      id="accommodation"
      style={{ order }}
      className={`scroll-mt-24 py-24 px-6 ${tokens.location.section}`}
    >
      <div className="max-w-6xl mx-auto">
        <div className="text-center max-w-3xl mx-auto">
          <h2 className="text-3xl md:text-5xl font-serif font-light tracking-wide" style={{ color: "var(--wedding-primary)" }}>
            <InlineEditor
              value={accommodationTitle}
              onSave={(val) => onSaveText("accommodationTitle", val)}
              canEdit={canEdit && editMode}
              className="uppercase"
            />
          </h2>
          <div className="mt-4 opacity-60 leading-relaxed">
            <InlineEditor
              value={accommodationDescription}
              onSave={(val) => onSaveText("accommodationDescription", val)}
              canEdit={canEdit && editMode}
              isTextArea
            />
          </div>
        </div>

        <div className="mt-12 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {accommodationItems.map((item, idx) => (
            <div key={`${item.name}-${idx}`} className="rounded-2xl border bg-white/80 backdrop-blur-sm p-6 shadow-sm">
              <h3 className="text-xl font-serif font-semibold text-foreground">{item.name || `Adresse ${idx + 1}`}</h3>
              <div className="mt-3 flex items-start gap-2 text-sm opacity-70">
                <MapPin className="h-4 w-4 shrink-0 mt-0.5" style={{ color: "var(--wedding-primary)" }} />
                <span>{item.address || "Adresse à compléter"}</span>
              </div>
              {item.url ? (
                <a
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-5 inline-flex items-center gap-2 text-sm font-medium hover:underline"
                  style={{ color: "var(--wedding-primary)" }}
                >
                  <ExternalLink className="h-4 w-4" />
                  Voir l'adresse
                </a>
              ) : null}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
