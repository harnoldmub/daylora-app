import { useState } from "react";
import { Pencil, Trash2, Plus, Check, Gift } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
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
  onReserveGift,
  canEdit,
  editMode,
  order,
}: GiftsSectionProps) {
  const [showAll, setShowAll] = useState(false);
  const [reservingId, setReservingId] = useState<number | null>(null);
  const [reserveName, setReserveName] = useState("");
  const [reserveLoading, setReserveLoading] = useState(false);
  const visibleGifts = showAll ? gifts : gifts.slice(0, 3);

  const handleReserve = async (giftId: number) => {
    if (!reserveName.trim() || !onReserveGift) return;
    setReserveLoading(true);
    try {
      await onReserveGift(giftId, reserveName.trim());
      setReservingId(null);
      setReserveName("");
    } finally {
      setReserveLoading(false);
    }
  };

  return (
    <section
      id="gifts"
      style={{ order }}
      className={`scroll-mt-24 py-24 px-6 ${tokens.gifts.section}`}
    >
      <div className="max-w-6xl mx-auto">
        <div className="text-center max-w-3xl mx-auto">
          <h2 className={`text-3xl md:text-4xl font-serif font-light tracking-wide uppercase ${tokens.gifts.title}`} style={{ color: 'var(--wedding-primary)' }}>
            <InlineEditor
              value={giftsTitle}
              onSave={(val) => onSaveText("giftsTitle", val)}
              canEdit={canEdit && editMode}
            />
          </h2>
          <div className={`mt-4 leading-relaxed ${tokens.gifts.description}`}>
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
              const isReserving = reservingId === gift.id;
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
                    <div className="h-44 w-full bg-gradient-to-br from-primary/10 to-primary/0 flex items-center justify-center">
                      <Gift className="h-10 w-10 opacity-20" style={{ color: 'var(--wedding-primary)' }} />
                    </div>
                  )}
                  <div className="p-6 space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className={`font-semibold text-lg leading-tight truncate ${tokens.gifts.text}`}>{gift.name}</div>
                        {gift.description ? (
                          <div className={`text-sm mt-1 line-clamp-2 ${tokens.gifts.description}`}>{gift.description}</div>
                        ) : null}
                        {(gift as any).sourceUrl && (
                          <a
                            href={(gift as any).sourceUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-xs mt-1.5 opacity-60 hover:opacity-100 transition-opacity"
                            style={{ color: 'var(--wedding-primary)' }}
                          >
                            Voir le produit
                            <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
                          </a>
                        )}
                      </div>
                      {gift.isReserved ? (
                        <span className={`shrink-0 text-xs font-semibold rounded-full px-3 py-1 ${tokens.gifts.badge}`}>
                          <Check className="h-3 w-3 inline mr-1" />
                          Pris
                        </span>
                      ) : null}
                    </div>

                    {gift.isReserved && (gift as any).reservedBy ? (
                      <p className={`text-xs italic ${tokens.gifts.description}`}>
                        Pris en charge par {(gift as any).reservedBy}
                      </p>
                    ) : null}

                    {price > 0 ? (
                      <div className="pt-2">
                        <div className={`flex items-center justify-between text-xs mb-2 ${tokens.gifts.description}`}>
                          <span>
                            {contributed}€ / {price}€
                          </span>
                          <span>{pct}%</span>
                        </div>
                        <div className={`h-2 rounded-full overflow-hidden ${tokens.gifts.progressTrack}`}>
                          <div className={`h-full ${tokens.gifts.progress}`} style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    ) : null}

                    {!canEdit && !gift.isReserved && onReserveGift ? (
                      <div className="pt-3">
                        {isReserving ? (
                          <div className="space-y-2">
                            <Input
                              placeholder="Votre nom"
                              value={reserveName}
                              onChange={(e) => setReserveName(e.target.value)}
                              onKeyDown={(e) => { if (e.key === "Enter") handleReserve(gift.id); }}
                              className="text-sm"
                              autoFocus
                            />
                            <div className="flex gap-2">
                              <Button
                                type="button"
                                size="sm"
                                className="flex-1 rounded-full text-xs"
                                style={{ backgroundColor: 'var(--wedding-primary)', color: '#fff' }}
                                disabled={!reserveName.trim() || reserveLoading}
                                onClick={() => handleReserve(gift.id)}
                              >
                                {reserveLoading ? "..." : "Confirmer"}
                              </Button>
                              <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                className="rounded-full text-xs"
                                onClick={() => { setReservingId(null); setReserveName(""); }}
                              >
                                Annuler
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            className="w-full rounded-full text-xs"
                            style={{ borderColor: 'var(--wedding-primary)', color: 'var(--wedding-primary)' }}
                            onClick={() => setReservingId(gift.id)}
                          >
                            Je m'en occupe
                          </Button>
                        )}
                      </div>
                    ) : null}
                  </div>
                </Card>
              );
            })
          ) : (
            <div className={`md:col-span-3 text-center text-sm py-10 ${tokens.gifts.description}`}>
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
