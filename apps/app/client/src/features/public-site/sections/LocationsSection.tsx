import { Button } from "@/components/ui/button";
import { InlineEditor } from "@/components/ui/inline-editor";
import type { LocationsSectionProps } from "@/features/public-site/types";

export function LocationsSection({
  tokens,
  locationTitle,
  locationDescription,
  locationItems,
  onSaveText,
  onUpdateLocationItem,
  onDeleteLocationItem,
  onAddLocationItem,
  canEdit,
  editMode,
  order,
}: LocationsSectionProps) {
  return (
    <section
      id="location"
      style={{ order }}
      className={`scroll-mt-24 py-24 px-6 ${tokens.location.section}`}
    >
      <div className="max-w-4xl mx-auto text-center space-y-6">
        <h2 className={`text-3xl md:text-4xl font-serif font-light tracking-wide ${tokens.location.title}`}>
          <InlineEditor
            value={locationTitle}
            onSave={(val) => onSaveText("locationTitle", val)}
            canEdit={canEdit && editMode}
            className="uppercase"
          />
        </h2>
        <div className="opacity-60 leading-relaxed max-w-2xl mx-auto">
          <InlineEditor
            value={locationDescription}
            onSave={(val) => onSaveText("locationDescription", val)}
            canEdit={canEdit && editMode}
            isTextArea={true}
          />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 text-left">
          {locationItems.map((item, idx) => (
            <div key={`${item.title}-${idx}`} className={tokens.location.card}>
              <h3 className="text-lg font-serif font-semibold mb-1">
                <InlineEditor
                  value={item.title}
                  onSave={(val) => onUpdateLocationItem(idx, { title: val })}
                  canEdit={canEdit && editMode}
                  placeholder={`Lieu ${idx + 1}`}
                />
              </h3>
              {canEdit && editMode ? (
                <div className="mb-3">
                  <InlineEditor
                    value={item.address}
                    onSave={(val) => onUpdateLocationItem(idx, { address: val })}
                    canEdit={canEdit && editMode}
                    placeholder="Adresse"
                  />
                </div>
              ) : item.address ? (
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(item.address)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-primary hover:underline mb-3 inline-block"
                >
                  {item.address}
                </a>
              ) : null}
              <div className="text-sm opacity-60 leading-relaxed">
                <InlineEditor
                  value={item.description}
                  onSave={(val) => onUpdateLocationItem(idx, { description: val })}
                  canEdit={canEdit && editMode}
                  placeholder="Description"
                  isTextArea
                />
              </div>
              {canEdit && editMode ? (
                <div className="pt-4">
                  <Button type="button" variant="outline" size="sm" onClick={() => onDeleteLocationItem(idx)}>
                    Supprimer
                  </Button>
                </div>
              ) : null}
            </div>
          ))}
        </div>
        {canEdit && editMode ? (
          <div className="pt-6">
            <Button type="button" variant="outline" onClick={onAddLocationItem}>
              Ajouter un lieu
            </Button>
          </div>
        ) : null}
      </div>
    </section>
  );
}
