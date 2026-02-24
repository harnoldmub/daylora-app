import { Button } from "@/components/ui/button";
import { InlineEditor } from "@/components/ui/inline-editor";
import type { StorySectionProps } from "@/features/public-site/types";

export function StorySection({
  tokens,
  storyTitle,
  storyBody,
  couplePhoto,
  onSaveText,
  onMediaUpload,
  onUpdateMedia,
  isUploading,
  canEdit,
  editMode,
  order,
}: StorySectionProps) {
  return (
    <section
      id="story"
      style={{ order: order ?? 2 }}
      className="scroll-mt-24 py-32 px-6"
    >
      <div className={tokens.story.container}>
        <h2 className="text-4xl md:text-5xl font-serif font-light tracking-wide text-center mb-16" style={{ color: 'var(--wedding-primary)' }}>
          <InlineEditor
            value={storyTitle}
            onSave={(val) => onSaveText("storyTitle", val)}
            canEdit={canEdit && editMode}
          />
        </h2>
        <div className={tokens.story.layout}>
          <div className="relative group">
            <div className="absolute -inset-4 rounded-[4rem] blur-3xl opacity-0 group-hover:opacity-100 transition-opacity" style={{ backgroundColor: 'color-mix(in srgb, var(--wedding-primary) 10%, transparent)' }} />
            <img
              src={couplePhoto || "/defaults/couple_default.jpg"}
              alt="Le couple"
              className={`w-full h-full object-cover relative z-10 transition-transform duration-700 group-hover:scale-[1.02] ${tokens.story.image}`}
            />
            {canEdit && editMode ? (
              <div className="mt-4 rounded-2xl bg-white/80 border border-primary/10 px-4 py-3 shadow-sm relative z-20">
                <div className="text-[11px] uppercase tracking-widest text-muted-foreground mb-2">Photo du couple</div>
                <input type="file" accept="image/*" onChange={onMediaUpload("couplePhoto")} />
                <div className="mt-2 flex items-center gap-2">
                  <Button type="button" size="sm" variant="outline" onClick={() => onUpdateMedia("couplePhoto", "")} disabled={!couplePhoto || isUploading.couplePhoto}>
                    Supprimer
                  </Button>
                  {isUploading.couplePhoto ? <span className="text-xs text-muted-foreground">Import...</span> : null}
                </div>
              </div>
            ) : null}
          </div>
          <div className="space-y-8 flex flex-col justify-center">
            <div className="w-16 h-px mx-auto lg:mx-0" style={{ backgroundColor: 'color-mix(in srgb, var(--wedding-primary) 30%, transparent)' }} />
            <div className={`max-w-lg mx-auto lg:mx-0 ${tokens.story.body}`}>
              <InlineEditor
                value={storyBody}
                onSave={(val) => onSaveText("storyBody", val)}
                canEdit={canEdit && editMode}
                isTextArea
              />
            </div>
            <div className="w-16 h-px mx-auto lg:mx-0" style={{ backgroundColor: 'color-mix(in srgb, var(--wedding-primary) 30%, transparent)' }} />
          </div>
        </div>
      </div>
    </section>
  );
}
