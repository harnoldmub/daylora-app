import { useState } from "react";
import { Star, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { InlineEditor } from "@/components/ui/inline-editor";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import type { GallerySectionProps } from "@/features/public-site/types";

export function GallerySection({
  tokens,
  galleryTitle,
  galleryDescription,
  galleryImages,
  onSaveText,
  onGalleryFilesSelected,
  onRemoveGalleryImage,
  onResetGallery,
  onSetMainImage,
  maxImages,
  canEdit,
  editMode,
  order,
}: GallerySectionProps) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  return (
    <section
      id="gallery"
      style={{ order: order ?? 3 }}
      className={`scroll-mt-24 py-28 px-6 ${tokens.gallery.section}`}
    >
      <div className="max-w-6xl mx-auto">
        <div className="text-center max-w-3xl mx-auto">
          <h2 className={`text-3xl md:text-4xl font-serif font-light tracking-wide ${tokens.gallery.title}`} style={{ color: 'var(--wedding-primary)' }}>
            <InlineEditor
              value={galleryTitle}
              onSave={(val) => onSaveText("galleryTitle", val)}
              canEdit={canEdit && editMode}
              className="uppercase"
            />
          </h2>
          <div className="mt-4 opacity-60 leading-relaxed">
            <InlineEditor
              value={galleryDescription}
              onSave={(val) => onSaveText("galleryDescription", val)}
              canEdit={canEdit && editMode}
              isTextArea
            />
          </div>
        </div>

        {canEdit && editMode ? (
          <div className="mt-10 rounded-3xl bg-white/80 border border-primary/10 p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div className="text-sm text-muted-foreground">
              {galleryImages.length}/{maxImages} photos
            </div>
            <div className="flex items-center gap-3">
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={async (e) => {
                  await onGalleryFilesSelected(e.target.files);
                  e.target.value = "";
                }}
              />
              <Button type="button" size="sm" variant="outline" onClick={onResetGallery}>
                Remettre par defaut
              </Button>
            </div>
          </div>
        ) : null}

        <div className="mt-10 grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
          {galleryImages.map((src, idx) => (
            <div key={`${src}-${idx}`} className="relative group animate-in fade-in duration-500">
              <button
                type="button"
                className="block w-full"
                onClick={() => setLightboxIndex(idx)}
              >
                <div className={`aspect-square overflow-hidden ${tokens.gallery.imageRadius} border border-primary/10 bg-muted shadow-sm`}>
                  <img
                    src={src}
                    alt={`Photo ${idx + 1}`}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    loading="lazy"
                  />
                </div>
              </button>
              {canEdit && editMode ? (
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 rounded-inherit pointer-events-none">
                  <Button
                    type="button"
                    size="sm"
                    className="pointer-events-auto bg-white text-black hover:bg-white/90 rounded-lg text-xs gap-1 shadow-md"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      onSetMainImage?.(idx);
                    }}
                  >
                    <Star className="h-3.5 w-3.5" />
                    Principale
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    className="pointer-events-auto bg-white text-black hover:bg-white/90 rounded-lg text-xs gap-1 shadow-md"
                    onClick={async (e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      await onRemoveGalleryImage(idx);
                    }}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Supprimer
                  </Button>
                </div>
              ) : null}
            </div>
          ))}
        </div>
      </div>

      <Dialog
        open={lightboxIndex !== null}
        onOpenChange={(open) => {
          if (!open) setLightboxIndex(null);
        }}
      >
        <DialogContent className="max-w-6xl p-0 overflow-hidden bg-black border-black">
          {lightboxIndex !== null ? (
            <div className="relative">
              <img
                src={galleryImages[lightboxIndex] || ""}
                alt=""
                className="w-full h-[80vh] object-contain bg-black"
              />
              {galleryImages.length > 1 ? (
                <div className="absolute left-4 top-4 flex gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant="secondary"
                    onClick={() =>
                      setLightboxIndex((idx) =>
                        idx === null
                          ? 0
                          : (idx - 1 + galleryImages.length) % galleryImages.length
                      )
                    }
                  >
                    Précédent
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="secondary"
                    onClick={() =>
                      setLightboxIndex((idx) =>
                        idx === null ? 0 : (idx + 1) % galleryImages.length
                      )
                    }
                  >
                    Suivant
                  </Button>
                </div>
              ) : null}
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </section>
  );
}
