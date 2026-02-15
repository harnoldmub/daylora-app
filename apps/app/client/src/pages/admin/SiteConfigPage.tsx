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

type MenuItem = {
  id: string;
  label: string;
  path: string;
  enabled: boolean;
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
    { id: "rsvp", label: "RSVP", path: "rsvp", enabled: true },
    { id: "gifts", label: "Cadeaux", path: "gifts", enabled: true },
    { id: "story", label: "Histoire", path: "story", enabled: true },
    { id: "gallery", label: "Photos", path: "gallery", enabled: true },
    { id: "location", label: "Lieux", path: "location", enabled: true },
    { id: "program", label: "Programme", path: "program", enabled: true },
    { id: "cagnotte", label: "Cagnotte", path: "cagnotte", enabled: true },
    { id: "live", label: "Live", path: "live", enabled: true },
  ],
  customPages: [],
};

const recommendedCustomPages: CustomPage[] = [
  {
    id: "custom-infos-pratiques",
    title: "Infos pratiques",
    slug: "infos-pratiques",
    content: "Partagez ici les hotels conseilles, parkings, transports et consignes utiles.",
    enabled: true,
    showInMenu: true,
  },
  {
    id: "custom-faq",
    title: "FAQ",
    slug: "faq",
    content: "Ajoutez ici les reponses aux questions frequentes de vos invites.",
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
  const mergedDefaults = defaultNavigation.menuItems.map((base) => {
    const found = incoming.find((item) => item.id === base.id);
    return found ? { ...base, ...found } : base;
  });
  const customIncoming = incoming.filter(
    (item) => !defaultNavigation.menuItems.some((base) => base.id === item.id)
  );
  return [...mergedDefaults, ...customIncoming];
};

export default function SiteConfigPage() {
  const { weddingId } = useParams<{ weddingId: string }>();
  const { data: wedding, isLoading } = useWedding(weddingId);
  const updateWedding = useUpdateWedding();
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);

  const [navigation, setNavigation] = useState<NavigationConfig>(defaultNavigation);

  useEffect(() => {
    if (!wedding) return;
    setNavigation({
      pages: {
        ...defaultNavigation.pages,
        ...(wedding.config?.navigation?.pages || {}),
      },
      menuItems: mergeMenuItems(wedding.config?.navigation?.menuItems),
      customPages: wedding.config?.navigation?.customPages || [],
    });
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
        enabled: item.id === "rsvp",
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
          navigation,
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
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-serif font-bold">Configuration avancée</h1>
          <p className="text-muted-foreground mt-1">Contrôlez les pages, la navigation et le contenu personnalisé.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={applySimpleConfig}>
            <Settings2 className="h-4 w-4 mr-2" />
            Config simple
          </Button>
          <Button onClick={applyMaxConfig}>
            <Wand2 className="h-4 w-4 mr-2" />
            Configuration maximale
          </Button>
        </div>
      </div>

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
        <h2 className="text-lg font-medium">Menu principal</h2>
        <div className="space-y-3">
          {navigation.menuItems.map((item, index) => (
            <div key={item.id} className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-3 rounded-xl border p-3">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
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
                <Button variant="outline" size="icon" onClick={() => moveMenuItem(index, -1)}>
                  <ArrowUp className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="icon" onClick={() => moveMenuItem(index, 1)}>
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
            {navigation.customPages.map((page) => (
              <div key={page.id} className="rounded-xl border p-4 space-y-3">
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
