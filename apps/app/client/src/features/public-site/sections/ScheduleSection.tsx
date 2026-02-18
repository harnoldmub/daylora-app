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
      <div className="max-w-4xl mx-auto text-center space-y-6">
        <h2 className="text-3xl md:text-4xl font-serif font-light tracking-wide">
          <InlineEditor
            value={programTitle}
            onSave={(val) => onSaveText("programTitle", val)}
            canEdit={canEdit && editMode}
            className="uppercase"
          />
        </h2>
        <div className="text-muted-foreground leading-relaxed max-w-2xl mx-auto">
          <InlineEditor
            value={programDescription}
            onSave={(val) => onSaveText("programDescription", val)}
            canEdit={canEdit && editMode}
            isTextArea={true}
          />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 text-left">
          {programItems.map((item, idx) => (
            <div key={`${item.title}-${idx}`} className={tokens.schedule.card}>
              <div className="text-xs uppercase tracking-widest text-primary mb-2">
                <InlineEditor
                  value={item.time}
                  onSave={(val) => onUpdateProgramItem(idx, { time: val })}
                  canEdit={canEdit && editMode}
                  placeholder="00:00"
                />
              </div>
              <h3 className="text-lg font-serif font-semibold text-foreground mb-2">
                <InlineEditor
                  value={item.title}
                  onSave={(val) => onUpdateProgramItem(idx, { title: val })}
                  canEdit={canEdit && editMode}
                  placeholder={`Étape ${idx + 1}`}
                />
              </h3>
              <div className="text-sm text-muted-foreground leading-relaxed">
                <InlineEditor
                  value={item.description}
                  onSave={(val) => onUpdateProgramItem(idx, { description: val })}
                  canEdit={canEdit && editMode}
                  placeholder="Description"
                  isTextArea
                />
              </div>
              {canEdit && editMode ? (
                <div className="pt-4">
                  <Button type="button" variant="outline" size="sm" onClick={() => onDeleteProgramItem(idx)}>
                    Supprimer
                  </Button>
                </div>
              ) : null}
            </div>
          ))}
        </div>
        {canEdit && editMode ? (
          <div className="pt-6">
            <Button type="button" variant="outline" onClick={onAddProgramItem}>
              Ajouter une étape
            </Button>
          </div>
        ) : null}
      </div>
    </section>
  );
}
