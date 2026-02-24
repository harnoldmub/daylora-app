import { MapPin, Bed, ExternalLink } from "lucide-react";
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
      <div className="max-w-3xl mx-auto">
        <div className="text-center space-y-4 mb-16">
          <h2 className="text-3xl md:text-5xl font-serif font-light tracking-wide" style={{ color: 'var(--wedding-primary)' }}>
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
        </div>

        <div className="space-y-8">
          {locationItems.map((item, idx) => (
            <div
              key={`${item.title}-${idx}`}
              className="relative flex gap-6 items-start"
            >
              <div className="flex flex-col items-center shrink-0">
                <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: 'color-mix(in srgb, var(--wedding-primary) 12%, transparent)' }}>
                  <MapPin className="h-5 w-5" style={{ color: 'var(--wedding-primary)' }} />
                </div>
                {idx < locationItems.length - 1 && (
                  <div className="w-px flex-1 mt-2 min-h-[2rem]" style={{ backgroundColor: 'color-mix(in srgb, var(--wedding-primary) 15%, transparent)' }} />
                )}
              </div>

              <div className="flex-1 pb-2">
                <h3 className="text-xl font-serif font-semibold mb-1">
                  <InlineEditor
                    value={item.title}
                    onSave={(val) => onUpdateLocationItem(idx, { title: val })}
                    canEdit={canEdit && editMode}
                    placeholder={`Lieu ${idx + 1}`}
                  />
                </h3>
                {canEdit && editMode ? (
                  <div className="mb-2">
                    <InlineEditor
                      value={item.address}
                      onSave={(val) => onUpdateLocationItem(idx, { address: val })}
                      canEdit={canEdit && editMode}
                      placeholder="Adresse complète"
                    />
                  </div>
                ) : item.address ? (
                  <p className="text-sm opacity-70 mb-2">{item.address}</p>
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
                {!canEdit && item.address && (
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(item.address)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 mt-3 text-xs font-medium tracking-wide hover:underline transition-colors"
                    style={{ color: 'var(--wedding-primary)' }}
                  >
                    <MapPin className="h-3.5 w-3.5" />
                    Voir sur Google Maps
                  </a>
                )}
                {!canEdit && item.accommodations && item.accommodations.length > 0 && (
                  <div className="mt-4 pt-3 border-t" style={{ borderColor: 'color-mix(in srgb, var(--wedding-primary) 10%, transparent)' }}>
                    <div className="flex items-center gap-2 mb-2">
                      <Bed className="h-3.5 w-3.5" style={{ color: 'var(--wedding-primary)' }} />
                      <span className="text-xs font-medium uppercase tracking-wider opacity-60">Hébergements</span>
                    </div>
                    <div className="space-y-2">
                      {item.accommodations.map((acc, accIdx) => (
                        <div key={accIdx} className="text-sm">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{acc.name}</span>
                            {acc.url && (
                              <a
                                href={acc.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 hover:underline"
                                style={{ color: 'var(--wedding-primary)' }}
                              >
                                <ExternalLink className="h-3 w-3" />
                              </a>
                            )}
                          </div>
                          {acc.address && <p className="text-xs opacity-50">{acc.address}</p>}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {canEdit && editMode ? (
                  <div className="pt-3">
                    <Button type="button" variant="outline" size="sm" onClick={() => onDeleteLocationItem(idx)}>
                      Supprimer
                    </Button>
                  </div>
                ) : null}
              </div>
            </div>
          ))}
        </div>

        {canEdit && editMode ? (
          <div className="pt-10 text-center">
            <Button type="button" variant="outline" onClick={onAddLocationItem}>
              Ajouter un lieu
            </Button>
          </div>
        ) : null}
      </div>
    </section>
  );
}
