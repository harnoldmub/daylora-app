import { useEffect, useMemo, useState } from "react";
import { useParams } from "wouter";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { useUpdateWedding, useWedding } from "@/hooks/use-api";
import { ArrowDown, ArrowUp, Plus, Settings2, Wand2 } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";

type MenuItem = {
  id: string;
  label: string;
  path: string;
  enabled: boolean;
  linkType?: "anchor" | "external";
  anchorId?: string;
  externalUrl?: string;
};

type CustomPage = {
  id: string;
  title: string;
  slug: string;
  content: string;
  enabled: boolean;
  showInMenu: boolean;
};

type NavigationConfig = {
  pages: {
    rsvp: boolean;
    cagnotte: boolean;
    gifts: boolean;
    live: boolean;
    story: boolean;
    gallery: boolean;
    location: boolean;
    program: boolean;
  };
  menuItems: MenuItem[];
  customPages: CustomPage[];
};

const defaultNavigation: NavigationConfig = {
  pages: {
    rsvp: true,
    cagnotte: true,
    gifts: true,
    live: true,
    story: true,
    gallery: true,
    location: true,
    program: true,
  },
  menuItems: [
    { id: "home", label: "Accueil", path: "home", enabled: true, linkType: "anchor", anchorId: "hero" },
    { id: "rsvp", label: "RSVP", path: "rsvp", enabled: true, linkType: "anchor", anchorId: "rsvp" },
    { id: "gifts", label: "Cadeaux", path: "gifts", enabled: true, linkType: "anchor", anchorId: "gifts" },
    { id: "story", label: "Histoire", path: "story", enabled: true, linkType: "anchor", anchorId: "story" },
    { id: "gallery", label: "Photos", path: "gallery", enabled: true, linkType: "anchor", anchorId: "gallery" },
    { id: "location", label: "Lieux", path: "location", enabled: true, linkType: "anchor", anchorId: "location" },
    { id: "program", label: "Programme", path: "program", enabled: true, linkType: "anchor", anchorId: "program" },
    { id: "cagnotte", label: "Cagnotte", path: "cagnotte", enabled: true, linkType: "anchor", anchorId: "cagnotte" },
  ],
  customPages: [],
};

const recommendedCustomPages: CustomPage[] = [
  {
    id: "custom-infos-pratiques",
    title: "Infos pratiques",
    slug: "infos-pratiques",
    content: "Partagez ici les hôtels conseillés, parkings, transports et consignes utiles.",
    enabled: true,
    showInMenu: true,
  },
  {
    id: "custom-faq",
    title: "FAQ",
    slug: "faq",
    content: "Ajoutez ici les réponses aux questions fréquentes de vos invités.",
    enabled: true,
    showInMenu: true,
  },
];

const normalizeSlug = (value: string) =>
  value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]/g, "-")
    .replace(/-+/g, "-")
    .replace(/(^-|-$)/g, "");

const mergeMenuItems = (items: MenuItem[] | undefined): MenuItem[] => {
  const incoming = items || [];
  const baseById = new Map(defaultNavigation.menuItems.map((m) => [m.id, m]));

  // Preserve user's order (incoming) and only fill missing default items at the end.
  const merged: MenuItem[] = incoming.map((item) => {
    const base = baseById.get(item.id);
    return base ? { ...base, ...item } : item;
  });

  const mergedIds = new Set(merged.map((m) => m.id));
  defaultNavigation.menuItems.forEach((base) => {
    if (!mergedIds.has(base.id)) merged.push(base);
  });

  return merged;
};

const ensureHomeFirst = (items: MenuItem[]): MenuItem[] => {
  const list = [...items];
  const homeIndex = list.findIndex((i) => i.id === "home");
  const homeItem: MenuItem =
    homeIndex >= 0
      ? { ...list[homeIndex], linkType: list[homeIndex].linkType || "anchor", anchorId: list[homeIndex].anchorId || "hero" }
      : { id: "home", label: "Accueil", path: "home", enabled: true, linkType: "anchor", anchorId: "hero" };
  const withoutHome = list.filter((i) => i.id !== "home");
  return [homeItem, ...withoutHome];
};

export default function SiteConfigPage() {
  const { weddingId } = useParams<{ weddingId: string }>();
  const { data: wedding, isLoading } = useWedding(weddingId);
  const updateWedding = useUpdateWedding();
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);
  const [paymentModeDraft, setPaymentModeDraft] = useState<"stripe" | "external">("stripe");
  const [externalProviderDraft, setExternalProviderDraft] = useState("other");
  const [externalUrlDraft, setExternalUrlDraft] = useState("");

  const [navigation, setNavigation] = useState<NavigationConfig>(defaultNavigation);

  useEffect(() => {
    if (!wedding) return;
    setNavigation({
      pages: {
        ...defaultNavigation.pages,
        ...(wedding.config?.navigation?.pages || {}),
      },
      menuItems: ensureHomeFirst(mergeMenuItems(wedding.config?.navigation?.menuItems)),
      customPages: wedding.config?.navigation?.customPages || [],
    });
    const mode = wedding.config?.payments?.mode === "external" ? "external" : "stripe";
    setPaymentModeDraft(mode);
    setExternalProviderDraft(wedding.config?.payments?.externalProvider || "other");
    setExternalUrlDraft(wedding.config?.payments?.externalUrl || ((wedding.config?.sections as any)?.cagnotteExternalUrl || ""));
  }, [wedding]);

  const menuById = useMemo(() => {
    const map = new Map<string, MenuItem>();
    navigation.menuItems.forEach((item) => map.set(item.id, item));
    return map;
  }, [navigation.menuItems]);

  if (isLoading || !wedding) {
    return <div className="animate-pulse h-64 bg-muted rounded-xl" />;
  }

  const applyMaxConfig = () => {
    setNavigation((prev) => ({
      ...prev,
      pages: {
        rsvp: true,
        cagnotte: true,
        gifts: true,
        live: true,
        story: true,
        gallery: true,
        location: true,
        program: true,
      },
      menuItems: prev.menuItems.map((item) => ({ ...item, enabled: true })),
      customPages: prev.customPages.length
        ? prev.customPages.map((page) => ({ ...page, enabled: true, showInMenu: true }))
        : recommendedCustomPages,
    }));
  };

  const applySimpleConfig = () => {
    setNavigation((prev) => ({
      ...prev,
      pages: {
        rsvp: true,
        cagnotte: false,
        gifts: true,
        live: false,
        story: true,
        gallery: true,
        location: true,
        program: false,
      },
      menuItems: prev.menuItems.map((item) => ({
        ...item,
        enabled: item.id === "home" || item.id === "rsvp",
      })),
      customPages: prev.customPages.map((page) => ({ ...page, showInMenu: false })),
    }));
  };

  const moveMenuItem = (index: number, dir: -1 | 1) => {
    setNavigation((prev) => {
      const next = [...prev.menuItems];
      const target = index + dir;
      if (target < 0 || target >= next.length) return prev;
      const tmp = next[index];
      next[index] = next[target];
      next[target] = tmp;
      return { ...prev, menuItems: next };
    });
  };

  const moveCustomPage = (index: number, dir: -1 | 1) => {
    setNavigation((prev) => {
      const next = [...prev.customPages];
      const target = index + dir;
      if (target < 0 || target >= next.length) return prev;
      const tmp = next[index];
      next[index] = next[target];
      next[target] = tmp;
      return { ...prev, customPages: next };
    });
  };

  const addCustomPage = () => {
    const id = `custom-${Date.now()}`;
    setNavigation((prev) => ({
      ...prev,
      customPages: [
        ...prev.customPages,
        {
          id,
          title: "Nouvelle page",
          slug: `nouvelle-page-${prev.customPages.length + 1}`,
          content: "Ajoutez ici le contenu de votre page personnalisée.",
          enabled: true,
          showInMenu: true,
        },
      ],
    }));
  };

  const saveConfig = async () => {
    setIsSaving(true);
    try {
      const normalizedMenuItems = ensureHomeFirst(navigation.menuItems);
      const rsvpLabel = menuById.get("rsvp")?.label || "RSVP";
      const cagnotteLabel = menuById.get("cagnotte")?.label || "Cagnotte";
      const liveLabel = menuById.get("live")?.label || "Live";

      await updateWedding.mutateAsync({
        id: wedding.id,
        config: {
          ...wedding.config,
          features: {
            ...wedding.config.features,
            cagnotteEnabled: navigation.pages.cagnotte,
            liveEnabled: navigation.pages.live,
          },
          texts: {
            ...wedding.config.texts,
            navRsvp: rsvpLabel,
            navCagnotte: cagnotteLabel,
            navLive: liveLabel,
          },
          payments: {
            ...(wedding.config.payments || {}),
            mode: paymentModeDraft,
            externalProvider: externalProviderDraft,
            externalUrl: externalUrlDraft.trim(),
          },
          sections: {
            ...(wedding.config.sections || {}),
            cagnotteExternalUrl: externalUrlDraft.trim(),
          } as any,
          navigation: {
            ...navigation,
            menuItems: normalizedMenuItems,
          },
        },
      });

      toast({
        title: "Configuration enregistrée",
        description: "Pages, menus et contenu personnalisé sont à jour.",
      });
    } catch (_error) {
      toast({
        title: "Erreur",
        description: "Impossible d'enregistrer la configuration.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-8">
      <AdminPageHeader
        title="Configuration avancée"
        description="Contrôlez les pages, la navigation et le contenu personnalisé."
        actions={
          <>
            <Button variant="outline" onClick={applySimpleConfig}>
              <Settings2 className="h-4 w-4 mr-2" />
              Config simple
            </Button>
            <Button onClick={applyMaxConfig}>
              <Wand2 className="h-4 w-4 mr-2" />
              Configuration maximale
            </Button>
          </>
        }
      />

      <Card className="p-6 space-y-4">
          <h2 className="text-lg font-medium">Pages publiques</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            { key: "rsvp", label: "Page RSVP" },
            { key: "cagnotte", label: "Page Cagnotte" },
            { key: "gifts", label: "Section Cadeaux" },
            { key: "live", label: "Page Live" },
            { key: "story", label: "Section Histoire" },
            { key: "gallery", label: "Section Galerie" },
            { key: "location", label: "Section Lieux & accès" },
            { key: "program", label: "Section Déroulé" },
          ].map((item) => (
              <div key={item.key} className="flex items-center justify-between rounded-xl border px-4 py-3">
                <span className="text-sm font-medium">{item.label}</span>
              <Switch
                checked={navigation.pages[item.key as keyof NavigationConfig["pages"]]}
                onCheckedChange={(value) =>
                  setNavigation((prev) => ({
                    ...prev,
                    pages: { ...prev.pages, [item.key]: value },
                  }))
                }
              />
            </div>
          ))}
        </div>
      </Card>

      <Card className="p-6 space-y-4">
        <h2 className="text-lg font-medium">Cagnotte (lien)</h2>
        <p className="text-sm text-muted-foreground">
          Choisissez Stripe intégré ou lien externe. Le mode externe redirige vos invités vers votre cagnotte (Leetchi, PayPal, Lydia, Stripe Payment Link...).
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="text-xs uppercase tracking-widest font-bold opacity-60">Mode de paiement</div>
            <select
              className="h-12 rounded-xl border border-border bg-background px-3 text-sm w-full"
              value={paymentModeDraft}
              onChange={(e) => {
                const mode = e.target.value as "stripe" | "external";
                setPaymentModeDraft(mode);
                updateWedding.mutate({
                  id: wedding.id,
                  config: {
                    ...wedding.config,
                    payments: {
                      ...(wedding.config.payments || {}),
                      mode,
                    },
                  },
                });
              }}
            >
              <option value="stripe">Stripe intégré</option>
              <option value="external">Lien externe</option>
            </select>
          </div>
          {paymentModeDraft === "external" ? (
            <div className="space-y-2">
              <div className="text-xs uppercase tracking-widest font-bold opacity-60">Fournisseur</div>
              <select
                className="h-12 rounded-xl border border-border bg-background px-3 text-sm w-full"
                value={externalProviderDraft}
                onChange={(e) => {
                  const provider = e.target.value;
                  setExternalProviderDraft(provider);
                  updateWedding.mutate({
                    id: wedding.id,
                    config: {
                      ...wedding.config,
                      payments: {
                        ...(wedding.config.payments || {}),
                        externalProvider: provider,
                      },
                    },
                  });
                }}
              >
                <option value="leetchi">Leetchi</option>
                <option value="paypal">PayPal</option>
                <option value="lydia">Lydia</option>
                <option value="stripe_payment_link">Stripe Payment Link</option>
                <option value="other">Autre</option>
              </select>
            </div>
          ) : null}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="text-xs uppercase tracking-widest font-bold opacity-60">URL de la cagnotte</div>
            <Input
              value={externalUrlDraft}
              onChange={(e) => setExternalUrlDraft(e.target.value)}
              onBlur={(e) =>
                updateWedding.mutate({
                  id: wedding.id,
                  config: {
                    ...wedding.config,
                    payments: {
                      ...(wedding.config.payments || {}),
                      externalUrl: e.target.value.trim(),
                    },
                    sections: {
                      ...(wedding.config.sections || {}),
                      cagnotteExternalUrl: e.target.value.trim(),
                    } as any,
                  },
                })
              }
              placeholder="https://..."
              className="h-12 rounded-xl"
              inputMode="url"
            />
          </div>
          <div className="space-y-2">
            <div className="text-xs uppercase tracking-widest font-bold opacity-60">Label du bouton</div>
            <Input
              defaultValue={wedding.config?.texts?.cagnotteSubmitLabel || "Contribuer"}
              onBlur={(e) =>
                updateWedding.mutate({
                  id: wedding.id,
                  config: {
                    ...wedding.config,
                    texts: {
                      ...(wedding.config.texts || {}),
                      cagnotteSubmitLabel: e.target.value.trim() || "Contribuer",
                    },
                  },
                })
              }
              placeholder="Ex: Participer à la cagnotte"
              className="h-12 rounded-xl"
            />
          </div>
        </div>
      </Card>

      <Card className="p-6 space-y-4">
        <h2 className="text-lg font-medium">Menu principal</h2>
        <p className="text-sm text-muted-foreground">
          Chaque onglet peut être une ancre one-page ou un lien externe. Par défaut, "Accueil" pointe sur l'ancre hero.
        </p>
        <div className="space-y-3">
          {navigation.menuItems.map((item, index) => (
            <div key={item.id} className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-3 rounded-xl border p-3">
              <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                <Input
                  value={item.label}
                  onChange={(e) =>
                    setNavigation((prev) => ({
                      ...prev,
                      menuItems: prev.menuItems.map((m) => (m.id === item.id ? { ...m, label: e.target.value } : m)),
                    }))
                  }
                  placeholder="Label"
                />
                <Input value={item.path} disabled />
                <select
                  className="h-10 rounded-md border border-border bg-background px-3 text-sm"
                  value={item.linkType || "anchor"}
                  onChange={(e) =>
                    setNavigation((prev) => ({
                      ...prev,
                      menuItems: prev.menuItems.map((m) =>
                        m.id === item.id
                          ? {
                              ...m,
                              linkType: e.target.value as "anchor" | "external",
                              anchorId: e.target.value === "anchor" ? m.anchorId || (m.path === "home" ? "hero" : m.path) : "",
                              externalUrl: e.target.value === "external" ? m.externalUrl || "" : "",
                            }
                          : m
                      ),
                    }))
                  }
                >
                  <option value="anchor">Ancre</option>
                  <option value="external">Lien externe</option>
                </select>
                {(item.linkType || "anchor") === "anchor" ? (
                  <Input
                    value={item.anchorId || (item.path === "home" ? "hero" : item.path)}
                    onChange={(e) =>
                      setNavigation((prev) => ({
                        ...prev,
                        menuItems: prev.menuItems.map((m) =>
                          m.id === item.id ? { ...m, anchorId: normalizeSlug(e.target.value) || "hero", externalUrl: "" } : m
                        ),
                      }))
                    }
                    placeholder="hero, rsvp, gallery..."
                  />
                ) : (
                  <Input
                    value={item.externalUrl || ""}
                    onChange={(e) =>
                      setNavigation((prev) => ({
                        ...prev,
                        menuItems: prev.menuItems.map((m) =>
                          m.id === item.id ? { ...m, externalUrl: e.target.value, anchorId: "" } : m
                        ),
                      }))
                    }
                    placeholder="https://..."
                  />
                )}
                <div className="flex items-center justify-between rounded-md border px-3">
                  <span className="text-sm text-muted-foreground">Visible</span>
                  <Switch
                    checked={item.enabled}
                    onCheckedChange={(value) =>
                      setNavigation((prev) => ({
                        ...prev,
                        menuItems: prev.menuItems.map((m) => (m.id === item.id ? { ...m, enabled: value } : m)),
                      }))
                    }
                  />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="icon" onClick={() => moveMenuItem(index, -1)} disabled={item.id === "home" || index === 0}>
                  <ArrowUp className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="icon" onClick={() => moveMenuItem(index, 1)} disabled={item.id === "home"}>
                  <ArrowDown className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Card className="p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-medium">Pages personnalisées</h2>
          <Button variant="outline" onClick={addCustomPage}>
            <Plus className="h-4 w-4 mr-2" />
            Ajouter une page
          </Button>
        </div>

        {navigation.customPages.length === 0 ? (
          <p className="text-sm text-muted-foreground">Aucune page personnalisée. Ajoutez une page libre (infos pratiques, hébergements, FAQ etc.).</p>
        ) : (
          <div className="space-y-4">
            {navigation.customPages.map((page, index) => (
              <div key={page.id} className="rounded-xl border p-4 space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="text-sm font-medium text-foreground">Ordre dans le menu</div>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="icon" onClick={() => moveCustomPage(index, -1)}>
                      <ArrowUp className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="icon" onClick={() => moveCustomPage(index, 1)}>
                      <ArrowDown className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <Input
                    value={page.title}
                    onChange={(e) =>
                      setNavigation((prev) => ({
                        ...prev,
                        customPages: prev.customPages.map((p) => (p.id === page.id ? { ...p, title: e.target.value } : p)),
                      }))
                    }
                    placeholder="Titre"
                  />
                  <Input
                    value={page.slug}
                    onChange={(e) =>
                      setNavigation((prev) => ({
                        ...prev,
                        customPages: prev.customPages.map((p) => (p.id === page.id ? { ...p, slug: normalizeSlug(e.target.value) } : p)),
                      }))
                    }
                    placeholder="slug-page"
                  />
                </div>
                <Textarea
                  rows={4}
                  value={page.content}
                  onChange={(e) =>
                    setNavigation((prev) => ({
                      ...prev,
                      customPages: prev.customPages.map((p) => (p.id === page.id ? { ...p, content: e.target.value } : p)),
                    }))
                  }
                  placeholder="Contenu de la page"
                />
                <div className="flex flex-wrap items-center gap-4">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">Active</span>
                    <Switch
                      checked={page.enabled}
                      onCheckedChange={(value) =>
                        setNavigation((prev) => ({
                          ...prev,
                          customPages: prev.customPages.map((p) => (p.id === page.id ? { ...p, enabled: value } : p)),
                        }))
                      }
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">Afficher au menu</span>
                    <Switch
                      checked={page.showInMenu}
                      onCheckedChange={(value) =>
                        setNavigation((prev) => ({
                          ...prev,
                          customPages: prev.customPages.map((p) => (p.id === page.id ? { ...p, showInMenu: value } : p)),
                        }))
                      }
                    />
                  </div>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() =>
                      setNavigation((prev) => ({
                        ...prev,
                        customPages: prev.customPages.filter((p) => p.id !== page.id),
                      }))
                    }
                  >
                    Supprimer
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      <div className="flex justify-end">
        <Button onClick={saveConfig} disabled={isSaving}>
          {isSaving ? "Enregistrement..." : "Enregistrer la configuration"}
        </Button>
      </div>
    </div>
  );
}
