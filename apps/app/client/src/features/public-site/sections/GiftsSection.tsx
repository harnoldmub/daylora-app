import { useState } from "react";
import { Pencil, Trash2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { InlineEditor } from "@/components/ui/inline-editor";
import type { GiftsSectionProps } from "@/features/public-site/types";

export function GiftsSection({
  tokens,
  giftsTitle,
  giftsDescription,
  gifts,
  onSaveText,
  onCreateGift,
  onEditGift,
  onDeleteGift,
  canEdit,
  editMode,
  order,
}: GiftsSectionProps) {
  const [showAll, setShowAll] = useState(false);
  const visibleGifts = showAll ? gifts : gifts.slice(0, 3);

  return (
    <section
      id="gifts"
      style={{ order }}
      className={`scroll-mt-24 py-24 px-6 ${tokens.gifts.section}`}
    >
      <div className="max-w-6xl mx-auto">
        <div className="text-center max-w-3xl mx-auto">
          <h2 className={`text-3xl md:text-4xl font-serif font-light tracking-wide uppercase ${tokens.gifts.title}`}>
            <InlineEditor
              value={giftsTitle}
              onSave={(val) => onSaveText("giftsTitle", val)}
              canEdit={canEdit && editMode}
            />
          </h2>
          <div className="mt-4 opacity-60 leading-relaxed">
            <InlineEditor
              value={giftsDescription}
              onSave={(val) => onSaveText("giftsDescription", val)}
              canEdit={canEdit && editMode}
              isTextArea
            />
          </div>
        </div>

        {canEdit && editMode ? (
          <div className="mt-10 rounded-3xl bg-white/80 border border-primary/10 p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div className="text-sm text-muted-foreground">
              Gérez votre liste de cadeaux (visible sur le site).
            </div>
            <Button type="button" size="sm" onClick={onCreateGift} className="rounded-full px-5">
              <Plus className="h-4 w-4 mr-2" />
              Ajouter un cadeau
            </Button>
          </div>
        ) : null}

        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
          {visibleGifts.length > 0 ? (
            visibleGifts.map((gift) => {
              const price = typeof gift.price === "number" ? gift.price : 0;
              const contributed = typeof gift.contributedAmount === "number" ? gift.contributedAmount : 0;
              const pct = price > 0 ? Math.min(100, Math.round((contributed / price) * 100)) : 0;
              return (
                <Card key={gift.id} className={`relative overflow-hidden ${tokens.gifts.card}`}>
                  {canEdit && editMode ? (
                    <div className="absolute right-3 top-3 z-10 flex gap-2">
                      <Button type="button" size="icon" variant="secondary" className="h-9 w-9 rounded-full" onClick={() => onEditGift(gift)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button type="button" size="icon" variant="secondary" className="h-9 w-9 rounded-full" onClick={() => onDeleteGift(gift)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : null}

                  {gift.imageUrl ? (
                    <div className="h-44 w-full overflow-hidden">
                      <img src={gift.imageUrl} alt={gift.name} className="h-full w-full object-cover" />
                    </div>
                  ) : (
                    <div className="h-44 w-full bg-gradient-to-br from-primary/10 to-primary/0" />
                  )}
                  <div className="p-6 space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="font-semibold text-lg leading-tight truncate">{gift.name}</div>
                        {gift.description ? (
                          <div className="text-sm opacity-60 mt-1 line-clamp-2">{gift.description}</div>
                        ) : null}
                      </div>
                      {gift.isReserved ? (
                        <span className="shrink-0 text-xs font-semibold rounded-full px-3 py-1 bg-muted text-muted-foreground">
                          Réservé
                        </span>
                      ) : null}
                    </div>

                    {price > 0 ? (
                      <div className="pt-2">
                        <div className="flex items-center justify-between text-xs opacity-60 mb-2">
                          <span>
                            {contributed}€ / {price}€
                          </span>
                          <span>{pct}%</span>
                        </div>
                        <div className="h-2 rounded-full bg-muted overflow-hidden">
                          <div className="h-full bg-primary" style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    ) : null}
                  </div>
                </Card>
              );
            })
          ) : (
            <div className="md:col-span-3 text-center text-sm opacity-60 py-10">
              Aucun cadeau pour le moment.
            </div>
          )}
        </div>

        {gifts.length > 3 ? (
          <div className="mt-10 flex justify-center">
            <Button
              type="button"
              size="lg"
              variant="outline"
              className="rounded-full px-10"
              onClick={() => setShowAll((v) => !v)}
            >
              {showAll ? "Voir moins" : "Voir plus"}
            </Button>
          </div>
        ) : null}
      </div>
    </section>
  );
}
