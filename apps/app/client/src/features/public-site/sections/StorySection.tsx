import { Button } from "@/components/ui/button";
import { InlineEditor } from "@/components/ui/inline-editor";
import type { StorySectionProps } from "@/features/public-site/types";

const FloralDecoration = () => (
  <svg viewBox="0 0 100 100" className="w-16 h-16 mx-auto mb-6 text-black/10 transition-transform hover:scale-110 duration-700" fill="currentColor">
    <path d="M50,10 C60,30 90,40 50,90 C10,40 40,30 50,10 Z" />
    <path d="M50,40 C70,50 80,80 50,90 C20,80 30,50 50,40 Z" opacity="0.5" />
  </svg>
);

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
        <h2 className={`${tokens.story.title} mb-12`}>
          <InlineEditor
            value={storyTitle}
            onSave={(val) => onSaveText("storyTitle", val)}
            canEdit={canEdit && editMode}
          />
        </h2>
        <div className={tokens.story.layout}>
          <div className="relative group">
            <div className="absolute -inset-4 bg-primary/10 rounded-[4rem] blur-3xl opacity-0 group-hover:opacity-100 transition-opacity" />
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
            {tokens.hero.decoration === "floral" && <FloralDecoration />}
            <div className="text-lg md:text-xl text-muted-foreground leading-relaxed font-light italic text-[#7A6B5E] max-w-lg mx-auto lg:mx-0">
              <InlineEditor
                value={storyBody}
                onSave={(val) => onSaveText("storyBody", val)}
                canEdit={canEdit && editMode}
                isTextArea
              />
            </div>
            {tokens.hero.decoration === "serif-border" && (
              <div className="h-px w-24 bg-primary/30 mx-auto lg:mx-0" />
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
