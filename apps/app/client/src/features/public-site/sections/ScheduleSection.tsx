import { MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { InlineEditor } from "@/components/ui/inline-editor";
import type { ScheduleSectionProps } from "@/features/public-site/types";

export function ScheduleSection({
  tokens,
  programTitle,
  programDescription,
  programItems,
  onSaveText,
  onUpdateProgramItem,
  onDeleteProgramItem,
  onAddProgramItem,
  canEdit,
  editMode,
  order,
}: ScheduleSectionProps) {
  return (
    <section
      id="program"
      style={{ order }}
      className={`scroll-mt-24 py-24 px-6 ${tokens.schedule.section}`}
    >
      <div className="max-w-3xl mx-auto">
        <div className="text-center space-y-4 mb-16">
          <h2 className="text-3xl md:text-5xl font-serif font-light tracking-wide" style={{ color: 'var(--wedding-primary)' }}>
            <InlineEditor
              value={programTitle}
              onSave={(val) => onSaveText("programTitle", val)}
              canEdit={canEdit && editMode}
              className="uppercase"
            />
          </h2>
          <div className="opacity-60 leading-relaxed max-w-2xl mx-auto">
            <InlineEditor
              value={programDescription}
              onSave={(val) => onSaveText("programDescription", val)}
              canEdit={canEdit && editMode}
              isTextArea={true}
            />
          </div>
        </div>

        <div className="relative">
          <div className="absolute left-6 md:left-1/2 top-0 bottom-0 w-px" style={{ backgroundColor: 'color-mix(in srgb, var(--wedding-primary) 20%, transparent)' }} />

          <div className="space-y-12">
            {programItems.map((item, idx) => {
              const isEven = idx % 2 === 0;
              return (
                <div key={`${item.title}-${idx}`} className="relative flex items-start">
                  <div className="absolute left-6 md:left-1/2 -translate-x-1/2 w-4 h-4 rounded-full border-2 z-10" style={{ borderColor: 'var(--wedding-primary)', backgroundColor: 'var(--wedding-secondary, #fff)' }} />

                  <div className={`ml-14 md:ml-0 md:w-1/2 ${isEven ? 'md:pr-12 md:text-right' : 'md:pl-12 md:ml-auto md:text-left'}`}>
                    <div className="text-sm font-bold tracking-widest uppercase mb-1" style={{ color: 'var(--wedding-primary)' }}>
                      <InlineEditor
                        value={item.time}
                        onSave={(val) => onUpdateProgramItem(idx, { time: val })}
                        canEdit={canEdit && editMode}
                        placeholder="00:00"
                      />
                    </div>
                    <h3 className="text-xl font-serif font-semibold mb-2">
                      <InlineEditor
                        value={item.title}
                        onSave={(val) => onUpdateProgramItem(idx, { title: val })}
                        canEdit={canEdit && editMode}
                        placeholder={`Étape ${idx + 1}`}
                      />
                    </h3>
                    <div className="text-sm opacity-60 leading-relaxed">
                      <InlineEditor
                        value={item.description}
                        onSave={(val) => onUpdateProgramItem(idx, { description: val })}
                        canEdit={canEdit && editMode}
                        placeholder="Description et adresse"
                        isTextArea
                      />
                    </div>
                    {!canEdit && item.description && (
                      <a
                        href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(item.description)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 mt-3 text-xs font-medium tracking-wide hover:underline transition-colors"
                        style={{ color: 'var(--wedding-primary)' }}
                      >
                        <MapPin className="h-3.5 w-3.5" />
                        Voir sur Google Maps
                      </a>
                    )}
                    {canEdit && editMode ? (
                      <div className="pt-3">
                        <Button type="button" variant="outline" size="sm" onClick={() => onDeleteProgramItem(idx)}>
                          Supprimer
                        </Button>
                      </div>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {canEdit && editMode ? (
          <div className="pt-10 text-center">
            <Button type="button" variant="outline" onClick={onAddProgramItem}>
              Ajouter une étape
            </Button>
          </div>
        ) : null}
      </div>
    </section>
  );
}
