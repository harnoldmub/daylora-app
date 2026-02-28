import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import {
  hasConsented,
  hasNonNecessaryCategories,
  acceptAll,
  rejectAll,
  setConsent,
  type CookieCategory,
} from "@/lib/cookie-consent";

const CATEGORY_LABELS: Record<CookieCategory, { label: string; description: string }> = {
  necessary: {
    label: "Cookies nécessaires",
    description: "Indispensables au fonctionnement du site (session, sécurité). Toujours activés.",
  },
  analytics: {
    label: "Cookies analytiques",
    description: "Nous aident à comprendre comment vous utilisez le site pour l'améliorer.",
  },
  marketing: {
    label: "Cookies marketing",
    description: "Permettent d'afficher des publicités pertinentes et de mesurer leur efficacité.",
  },
};

export function CookieBanner() {
  const [visible, setVisible] = useState(() => !hasConsented() && hasNonNecessaryCategories());
  const [showPrefs, setShowPrefs] = useState(false);
  const [prefs, setPrefs] = useState<Record<CookieCategory, boolean>>({
    necessary: true,
    analytics: false,
    marketing: false,
  });

  if (!visible) return null;

  const handleAcceptAll = () => {
    acceptAll();
    setVisible(false);
  };

  const handleRejectAll = () => {
    rejectAll();
    setVisible(false);
  };

  const handleSavePrefs = () => {
    setConsent(prefs);
    setShowPrefs(false);
    setVisible(false);
  };

  return (
    <>
      <div className="fixed bottom-0 left-0 right-0 z-[9999] border-t bg-white p-4 shadow-lg md:p-6">
        <div className="mx-auto flex max-w-4xl flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex-1">
            <p className="text-sm text-gray-700">
              Nous utilisons des cookies pour améliorer votre expérience. Vous pouvez personnaliser vos préférences
              ou accepter l'ensemble des cookies.
            </p>
          </div>
          <div className="flex flex-shrink-0 flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={() => setShowPrefs(true)}>
              Personnaliser
            </Button>
            <Button variant="outline" size="sm" onClick={handleRejectAll}>
              Refuser
            </Button>
            <Button size="sm" onClick={handleAcceptAll}>
              Accepter tout
            </Button>
          </div>
        </div>
      </div>

      <Dialog open={showPrefs} onOpenChange={setShowPrefs}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Préférences de cookies</DialogTitle>
            <DialogDescription>
              Choisissez les catégories de cookies que vous souhaitez autoriser.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {(Object.keys(CATEGORY_LABELS) as CookieCategory[]).map((cat) => {
              const info = CATEGORY_LABELS[cat];
              const isNecessary = cat === "necessary";
              return (
                <div key={cat} className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <p className="text-sm font-medium">{info.label}</p>
                    <p className="text-xs text-muted-foreground">{info.description}</p>
                  </div>
                  <Switch
                    checked={isNecessary ? true : prefs[cat]}
                    disabled={isNecessary}
                    onCheckedChange={(val) =>
                      setPrefs((prev) => ({ ...prev, [cat]: val }))
                    }
                  />
                </div>
              );
            })}
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" size="sm" onClick={() => setShowPrefs(false)}>
              Annuler
            </Button>
            <Button size="sm" onClick={handleSavePrefs}>
              Enregistrer
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
