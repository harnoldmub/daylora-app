import { useWedding, useUpdateWedding } from "@/hooks/use-api";
import { useParams } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useEffect, useMemo, useState } from "react";
import { BUTTON_RADIUS_OPTIONS, BUTTON_STYLE_OPTIONS, COLOR_TONES } from "@/lib/design-presets";

const LOGO_GENERATOR_URL = "https://www.logo.com/";
const MAX_LOGO_DATA_URL_LENGTH = 220_000;
const MAX_IMAGE_DATA_URL_LENGTH = 3_000_000;

const TEMPLATES = [
  { id: "classic", name: "Classique" },
  { id: "modern", name: "Moderne" },
  { id: "minimal", name: "Minimal" },
];

const DEFAULT_LOCATION_ITEMS = [
  {
    title: "Cérémonie civile",
    address: "Mairie de Lille — 10 Rue Pierre Mauroy",
    description: "Rendez-vous à 14h30 pour accueillir les invités.",
  },
  {
    title: "Réception",
    address: "Château de la Verrière — Salle des Roses",
    description: "Cocktail et dîner à partir de 18h.",
  },
];

const DEFAULT_PROGRAM_ITEMS = [
  {
    time: "14:30",
    title: "Accueil des invités",
    description: "Installation et photos de famille.",
  },
  {
    time: "15:00",
    title: "Cérémonie",
    description: "Échange des vœux et sortie des mariés.",
  },
  {
    time: "18:30",
    title: "Cocktail & Dîner",
    description: "Apéritif, repas et animations.",
  },
];

const DEFAULT_STORY_BODY =
  "Leur histoire a commencé il y a quelques années, une rencontre simple qui s'est transformée en une belle aventure. Aujourd'hui, ils s'apprêtent à dire 'Oui' entourés de leurs proches.";

export default function DesignPage() {
  const { weddingId } = useParams();
  const { data: wedding, isLoading } = useWedding(weddingId);
  const updateWedding = useUpdateWedding();
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);
  const [isApplyingTemplate, setIsApplyingTemplate] = useState(false);
  const [previewToken, setPreviewToken] = useState<number>(Date.now());

  const [templateId, setTemplateId] = useState<string>("classic");

  const [texts, setTexts] = useState(() => ({
    siteTitle: "",
    heroTitle: "",
    heroSubtitle: "",
    weddingDate: "",
    heroCta: "",
    rsvpTitle: "",
    rsvpDescription: "",
    rsvpButton: "",
    navRsvp: "",
    navCagnotte: "",
    navLive: "",
    locationTitle: "",
    locationDescription: "",
    programTitle: "",
    programDescription: "",
    storyTitle: "",
    storyBody: "",
    cagnotteTitle: "",
    cagnotteDescription: "",
    cagnotteBackLabel: "",
    cagnotteSubmitLabel: "",
    liveTitle: "",
    liveSubtitle: "",
    liveDonorsTitle: "",
    liveQrCaption: "",
  }));

  const [theme, setTheme] = useState(() => ({
    primaryColor: "#C8A96A",
    secondaryColor: "#FFFFFF",
    fontFamily: "serif",
    toneId: "golden-ivory",
    buttonStyle: "solid",
    buttonRadius: "pill",
  }));

  const [media, setMedia] = useState(() => ({
    heroImage: "",
    couplePhoto: "",
  }));

  const [branding, setBranding] = useState(() => ({
    logoUrl: "",
    logoText: "",
  }));

  const [sections, setSections] = useState(() => ({
    countdownDate: "",
    cagnotteSuggestedAmounts: [20, 50, 100, 150, 200],
    locationItems: DEFAULT_LOCATION_ITEMS,
    programItems: DEFAULT_PROGRAM_ITEMS,
  }));

  useEffect(() => {
    if (!wedding) return;

    const config = wedding.config || ({} as any);
    const cfgTexts = config.texts || ({} as any);
    const cfgTheme = config.theme || ({} as any);
    const cfgMedia = config.media || ({} as any);
    const cfgBranding = config.branding || ({} as any);
    const cfgSections = config.sections || ({} as any);

    const formatWeddingDate = () => {
      const raw = (wedding as any).weddingDate;
      if (!raw) return "";
      const d = raw instanceof Date ? raw : new Date(raw);
      if (Number.isNaN(d.getTime())) return "";
      return d.toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
    };

    const toIso = (raw: unknown) => {
      if (!raw) return "";
      const d = raw instanceof Date ? raw : new Date(String(raw));
      if (Number.isNaN(d.getTime())) return "";
      return d.toISOString();
    };

    setTemplateId(wedding.templateId || "classic");
    setTexts({
      siteTitle: cfgTexts.siteTitle || wedding.title || "",
      heroTitle: cfgTexts.heroTitle || wedding.title || "",
      heroSubtitle: cfgTexts.heroSubtitle || "Le Mariage de",
      weddingDate: cfgTexts.weddingDate || formatWeddingDate() || "Prochainement",
      heroCta: cfgTexts.heroCta || "Confirmer votre présence",
      rsvpTitle: cfgTexts.rsvpTitle || "CONFIRMEZ VOTRE PRÉSENCE",
      rsvpDescription: cfgTexts.rsvpDescription || "Nous serions ravis de vous compter parmi nous",
      rsvpButton: cfgTexts.rsvpButton || "Je confirme ma présence",
      navRsvp: cfgTexts.navRsvp || "RSVP",
      navCagnotte: cfgTexts.navCagnotte || "Cagnotte",
      navLive: cfgTexts.navLive || "Live",
      locationTitle: cfgTexts.locationTitle || "LIEU & ACCÈS",
      locationDescription: cfgTexts.locationDescription || "Toutes les informations pour nous rejoindre",
      programTitle: cfgTexts.programTitle || "DÉROULEMENT",
      programDescription: cfgTexts.programDescription || "Le programme de notre journée",
      storyTitle: cfgTexts.storyTitle || "NOTRE HISTOIRE",
      storyBody: cfgTexts.storyBody || DEFAULT_STORY_BODY,
      cagnotteTitle: cfgTexts.cagnotteTitle || "CAGNOTTE MARIAGE",
      cagnotteDescription:
        cfgTexts.cagnotteDescription ||
        "Votre présence est notre plus beau cadeau. Si vous souhaitez contribuer à notre voyage de noces ou à notre nouveau départ, vous pouvez participer à notre cagnotte.",
      cagnotteBackLabel: cfgTexts.cagnotteBackLabel || "Retour",
      cagnotteSubmitLabel: cfgTexts.cagnotteSubmitLabel || "Contribuer",
      liveTitle: cfgTexts.liveTitle || "CAGNOTTE EN DIRECT",
      liveSubtitle: cfgTexts.liveSubtitle || "Merci pour votre générosité",
      liveDonorsTitle: cfgTexts.liveDonorsTitle || "NOS GÉNÉREUX DONATEURS",
      liveQrCaption: cfgTexts.liveQrCaption || "Scannez pour contribuer",
    });
    setTheme({
      primaryColor: cfgTheme.primaryColor || "#C8A96A",
      secondaryColor: cfgTheme.secondaryColor || "#FFFDF9",
      fontFamily: cfgTheme.fontFamily || "serif",
      toneId: cfgTheme.toneId || "golden-ivory",
      buttonStyle: cfgTheme.buttonStyle || "solid",
      buttonRadius: cfgTheme.buttonRadius || "pill",
    });
    setMedia({
      heroImage: cfgMedia?.heroImage ?? "",
      couplePhoto: cfgMedia?.couplePhoto ?? "",
    });
    setBranding({
      logoUrl: cfgBranding?.logoUrl || "",
      logoText: cfgBranding?.logoText || wedding.title || "",
    });
    setSections({
      countdownDate: cfgSections?.countdownDate || toIso((wedding as any).weddingDate),
      cagnotteSuggestedAmounts: cfgSections?.cagnotteSuggestedAmounts?.length
        ? cfgSections.cagnotteSuggestedAmounts
        : [20, 50, 100, 150, 200],
      locationItems: cfgSections?.locationItems?.length
        ? cfgSections.locationItems
        : DEFAULT_LOCATION_ITEMS,
      programItems: cfgSections?.programItems?.length
        ? cfgSections.programItems
        : DEFAULT_PROGRAM_ITEMS,
    });
  }, [wedding?.id, (wedding as any)?.updatedAt]);

  const toDateInputValue = (value: string) => {
    if (!value) return "";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "";
    const pad = (n: number) => n.toString().padStart(2, "0");
    const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
    return `${local.getFullYear()}-${pad(local.getMonth() + 1)}-${pad(local.getDate())}T${pad(local.getHours())}:${pad(local.getMinutes())}`;
  };

  const fromDateInputValue = (value: string) => {
    if (!value) return "";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "";
    return date.toISOString();
  };

  const previewUrl = useMemo(() => {
    const appBase = typeof window !== "undefined" ? window.location.origin : "http://localhost:5174";
    if (!wedding) return `${appBase}/preview/preview?t=${previewToken}`;
    const slug = wedding.slug || wedding.id;
    return `${appBase}/preview/${slug}?t=${previewToken}`;
  }, [wedding, previewToken]);

  if (isLoading || !wedding) return <div className="animate-pulse h-64 bg-muted rounded-xl" />;

  const saveDesign = async () => {
    setIsSaving(true);
    try {
      let safeBranding = { ...branding };
      if (safeBranding.logoUrl?.startsWith("data:image/")) {
        if (safeBranding.logoUrl.length > MAX_LOGO_DATA_URL_LENGTH) {
          toast({
            title: "Logo trop volumineux",
            description: "Le logo est trop lourd. Importez une image plus legere.",
            variant: "destructive",
          });
          setIsSaving(false);
          return;
        }
      }

      const dataUrlFields: Array<{ key: string; value: string; limit: number }> = [
        { key: "heroImage", value: media.heroImage || "", limit: MAX_IMAGE_DATA_URL_LENGTH },
        { key: "couplePhoto", value: media.couplePhoto || "", limit: MAX_IMAGE_DATA_URL_LENGTH },
      ];

      for (const field of dataUrlFields) {
        if (field.value.startsWith("data:image/") && field.value.length > field.limit) {
          toast({
            title: "Image trop volumineuse",
            description: `L'image "${field.key}" est trop lourde. Importez une image plus legere.`,
            variant: "destructive",
          });
          setIsSaving(false);
          return;
        }
      }

      await updateWedding.mutateAsync({
        id: wedding.id,
        config: {
          ...wedding.config,
          texts: {
            ...wedding.config.texts,
            ...texts,
          },
          navigation: {
            ...(wedding.config.navigation || {}),
            menuItems: (wedding.config.navigation?.menuItems || []).map((item) => {
              if (item.id === "rsvp") return { ...item, label: texts.navRsvp || item.label };
              if (item.id === "cagnotte") return { ...item, label: texts.navCagnotte || item.label };
              if (item.id === "live") return { ...item, label: texts.navLive || item.label };
              return item;
            }),
          },
          theme: {
            ...wedding.config.theme,
            ...theme,
          },
          media: {
            ...wedding.config.media,
            ...media,
          },
          branding: {
            ...wedding.config.branding,
            ...safeBranding,
          },
          sections: {
            ...wedding.config.sections,
            ...sections,
          },
        },
      });
      setPreviewToken(Date.now());
      toast({
        title: "Design mis à jour",
        description: "Vos modifications visuelles ont été enregistrées.",
      });
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error?.message || "Impossible de sauvegarder le design.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const applyTemplate = async () => {
    if (!templateId) return;
    setIsApplyingTemplate(true);
    try {
      await updateWedding.mutateAsync({
        id: wedding.id,
        templateId,
      });
      setPreviewToken(Date.now());
      toast({
        title: "Template appliqué",
        description: "Le style du template a été mis à jour.",
      });
    } catch (_error) {
      toast({
        title: "Erreur",
        description: "Impossible d'appliquer le template.",
        variant: "destructive",
      });
    } finally {
      setIsApplyingTemplate(false);
    }
  };

  const handleLogoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (file.size > 6 * 1024 * 1024) {
      toast({
        title: "Image trop lourde",
        description: "Le fichier doit faire moins de 6 Mo.",
        variant: "destructive",
      });
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === "string" ? reader.result : "";
      const img = new Image();
      img.onload = () => {
        const maxSize = 240;
        const scale = Math.min(1, maxSize / Math.max(img.width, img.height));
        const canvas = document.createElement("canvas");
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        const ctx = canvas.getContext("2d");
        if (!ctx) return;
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        const compressed = canvas.toDataURL("image/jpeg", 0.78);
        if (compressed.length > MAX_LOGO_DATA_URL_LENGTH) {
          toast({
            title: "Logo trop lourd",
            description: "Essayez un logo plus simple.",
            variant: "destructive",
          });
          return;
        }
        setBranding((prev) => ({ ...prev, logoUrl: compressed }));
      };
      img.src = result;
    };
    reader.readAsDataURL(file);
  };

  const compressImageFile = async (file: File, opts: { maxSize: number; quality: number; maxDataUrlLength: number }) => {
    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: "Image trop lourde",
        description: "Le fichier doit faire moins de 10 Mo.",
        variant: "destructive",
      });
      return null;
    }

    const readAsDataUrl = () =>
      new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(typeof reader.result === "string" ? reader.result : "");
        reader.onerror = () => reject(new Error("read_failed"));
        reader.readAsDataURL(file);
      });

    const dataUrl = await readAsDataUrl();
    if (!dataUrl) return null;

    const img = new Image();
    const loaded = new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () => reject(new Error("image_failed"));
    });
    img.src = dataUrl;
    await loaded;

    const scale = Math.min(1, opts.maxSize / Math.max(img.width, img.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(img.width * scale));
    canvas.height = Math.max(1, Math.round(img.height * scale));
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

    const compressed = canvas.toDataURL("image/jpeg", opts.quality);
    if (compressed.length > opts.maxDataUrlLength) {
      toast({
        title: "Image trop volumineuse",
        description: "Importez une image plus legere.",
        variant: "destructive",
      });
      return null;
    }
    return compressed;
  };

  const handleMediaUpload = (key: "heroImage" | "couplePhoto") => async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      const compressed = await compressImageFile(file, { maxSize: 1600, quality: 0.82, maxDataUrlLength: MAX_IMAGE_DATA_URL_LENGTH });
      if (!compressed) return;
      setMedia((prev) => ({ ...prev, [key]: compressed }));
    } catch {
      toast({
        title: "Erreur",
        description: "Impossible d'importer l'image.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="h-[calc(100vh-64px)] -mx-8 -mt-8 flex flex-col">
      <div className="px-8 pt-6 pb-4 border-b bg-background/80 backdrop-blur flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-serif font-bold text-foreground">Studio Design</h1>
          <p className="text-muted-foreground text-sm">Modifiez votre template et personnalisez chaque section.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" asChild>
            <a href={previewUrl} target="_blank" rel="noopener noreferrer">Ouvrir</a>
          </Button>
          <Button onClick={saveDesign} disabled={isSaving}>
            {isSaving ? "Sauvegarde..." : "Enregistrer"}
          </Button>
        </div>
      </div>

      <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-[380px_1fr]">
        <aside className="min-h-0 overflow-y-auto border-r bg-white">
          <div className="p-6 space-y-4">
            <div className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Sections</div>
            <Accordion type="multiple" defaultValue={["template", "branding", "colors", "hero"]} className="w-full">
              <AccordionItem value="template" className="border rounded-xl px-4 mb-4">
                <AccordionTrigger className="hover:no-underline">Template</AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-3">
                    <div className="text-xs text-muted-foreground">Choisissez un style global (couleurs + typo).</div>
                    <Select value={templateId} onValueChange={(value) => setTemplateId(value)}>
                      <SelectTrigger className="h-10">
                        <SelectValue placeholder="Sélectionner" />
                      </SelectTrigger>
                      <SelectContent>
                        {TEMPLATES.map((tmpl) => (
                          <SelectItem key={tmpl.id} value={tmpl.id}>{tmpl.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button onClick={applyTemplate} disabled={isApplyingTemplate} className="w-full">
                      {isApplyingTemplate ? "Application..." : "Appliquer le template"}
                    </Button>
                  </div>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="branding" className="border rounded-xl px-4 mb-4">
                <AccordionTrigger className="hover:no-underline">Logo</AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Button asChild variant="outline" size="sm">
                        <a href={LOGO_GENERATOR_URL} target="_blank" rel="noopener noreferrer">Générer un logo</a>
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setBranding((prev) => ({ ...prev, logoUrl: "" }))}
                        disabled={!branding.logoUrl}
                      >
                        Supprimer le logo
                      </Button>
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-medium">Importer un logo</label>
                      <Input type="file" accept="image/*" onChange={handleLogoUpload} />
                      {branding.logoUrl ? (
                        <div className="mt-2 flex items-center gap-3">
                          <img src={branding.logoUrl} alt="Logo" className="h-12 w-12 rounded-lg object-cover border" />
                          <span className="text-xs text-muted-foreground">Aperçu du logo</span>
                        </div>
                      ) : null}
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-medium">Texte fallback</label>
                      <Input value={branding.logoText} onChange={(e) => setBranding({ ...branding, logoText: e.target.value })} />
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="colors" className="border rounded-xl px-4 mb-4">
                <AccordionTrigger className="hover:no-underline">Couleurs & Typo</AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-xs font-medium">Ton de couleurs</label>
                      <div className="grid grid-cols-1 gap-2">
                        {COLOR_TONES.map((tone) => (
                          <button
                            type="button"
                            key={tone.id}
                            className={`w-full text-left border rounded-lg p-3 transition-all ${
                              theme.toneId === tone.id ? "border-primary bg-primary/5" : "border-border bg-white"
                            }`}
                            onClick={() =>
                              setTheme((prev) => ({
                                ...prev,
                                toneId: tone.id,
                                primaryColor: tone.primaryColor,
                                secondaryColor: tone.secondaryColor,
                              }))
                            }
                          >
                            <div className="flex items-center gap-2 mb-1">
                              <span className="h-3 w-3 rounded-full border" style={{ backgroundColor: tone.primaryColor }} />
                              <span className="h-3 w-3 rounded-full border" style={{ backgroundColor: tone.secondaryColor }} />
                              <span className="text-xs font-semibold">{tone.name}</span>
                            </div>
                            <div className="text-[11px] text-muted-foreground">{tone.description}</div>
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <label className="text-xs font-medium">Primaire</label>
                        <Input
                          type="color"
                          value={theme.primaryColor}
                          onChange={(e) => setTheme({ ...theme, toneId: "custom", primaryColor: e.target.value })}
                          className="h-10 p-1"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-medium">Secondaire</label>
                        <Input
                          type="color"
                          value={theme.secondaryColor}
                          onChange={(e) => setTheme({ ...theme, toneId: "custom", secondaryColor: e.target.value })}
                          className="h-10 p-1"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-medium">Typographie</label>
                      <select
                        className="h-10 rounded-md border border-border bg-background px-3 text-sm w-full"
                        value={theme.fontFamily}
                        onChange={(e) => setTheme({ ...theme, fontFamily: e.target.value })}
                      >
                        <option value="serif">Serif (élégant)</option>
                        <option value="sans">Sans (moderne)</option>
                      </select>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <label className="text-xs font-medium">Style de bouton</label>
                        <select
                          className="h-10 rounded-md border border-border bg-background px-3 text-sm w-full"
                          value={theme.buttonStyle}
                          onChange={(e) => setTheme({ ...theme, buttonStyle: e.target.value })}
                        >
                          {BUTTON_STYLE_OPTIONS.map((option) => (
                            <option key={option.id} value={option.id}>{option.label}</option>
                          ))}
                        </select>
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-medium">Forme de bouton</label>
                        <select
                          className="h-10 rounded-md border border-border bg-background px-3 text-sm w-full"
                          value={theme.buttonRadius}
                          onChange={(e) => setTheme({ ...theme, buttonRadius: e.target.value })}
                        >
                          {BUTTON_RADIUS_OPTIONS.map((option) => (
                            <option key={option.id} value={option.id}>{option.label}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="images" className="border rounded-xl px-4 mb-4">
                <AccordionTrigger className="hover:no-underline">Images</AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-3">
                    <div className="space-y-2">
                      <label className="text-xs font-medium">Image Hero</label>
                      <div className="flex items-center gap-2">
                        <Input type="file" accept="image/*" onChange={handleMediaUpload("heroImage")} />
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setMedia((prev) => ({ ...prev, heroImage: "" }))}
                          disabled={!media.heroImage}
                        >
                          Supprimer
                        </Button>
                      </div>
                      {media.heroImage ? (
                        <img
                          src={media.heroImage}
                          alt="Hero"
                          className="mt-2 h-20 w-full rounded-lg object-cover border"
                        />
                      ) : null}
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-medium">Photo du couple</label>
                      <div className="flex items-center gap-2">
                        <Input type="file" accept="image/*" onChange={handleMediaUpload("couplePhoto")} />
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setMedia((prev) => ({ ...prev, couplePhoto: "" }))}
                          disabled={!media.couplePhoto}
                        >
                          Supprimer
                        </Button>
                      </div>
                      {media.couplePhoto ? (
                        <img
                          src={media.couplePhoto}
                          alt="Couple"
                          className="mt-2 h-20 w-full rounded-lg object-cover border"
                        />
                      ) : null}
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="hero" className="border rounded-xl px-4 mb-4">
                <AccordionTrigger className="hover:no-underline">Hero</AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-3">
                    <div className="space-y-2">
                      <label className="text-xs font-medium">Titre du site</label>
                      <Input value={texts.siteTitle} onChange={(e) => setTexts({ ...texts, siteTitle: e.target.value })} />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-medium">Titre</label>
                      <Input value={texts.heroTitle} onChange={(e) => setTexts({ ...texts, heroTitle: e.target.value })} />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-medium">Sous‑titre</label>
                      <Input value={texts.heroSubtitle} onChange={(e) => setTexts({ ...texts, heroSubtitle: e.target.value })} />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-medium">Bouton hero</label>
                      <Input value={texts.heroCta} onChange={(e) => setTexts({ ...texts, heroCta: e.target.value })} />
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="dates" className="border rounded-xl px-4 mb-4">
                <AccordionTrigger className="hover:no-underline">Dates & Countdown</AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-3">
                    <div className="space-y-2">
                      <label className="text-xs font-medium">Texte des dates (affiché)</label>
                      <Input value={texts.weddingDate} onChange={(e) => setTexts({ ...texts, weddingDate: e.target.value })} />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-medium">Date du countdown</label>
                      <Input
                        type="datetime-local"
                        value={toDateInputValue(sections.countdownDate)}
                        onChange={(e) => setSections((prev) => ({ ...prev, countdownDate: fromDateInputValue(e.target.value) }))}
                      />
                      <p className="text-[11px] text-muted-foreground">Utilisée pour le compte à rebours.</p>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="menu" className="border rounded-xl px-4 mb-4">
                <AccordionTrigger className="hover:no-underline">Menu</AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-3">
                    <div className="space-y-2">
                      <label className="text-xs font-medium">Lien RSVP</label>
                      <Input value={texts.navRsvp} onChange={(e) => setTexts({ ...texts, navRsvp: e.target.value })} />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-medium">Lien Cagnotte</label>
                      <Input value={texts.navCagnotte} onChange={(e) => setTexts({ ...texts, navCagnotte: e.target.value })} />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-medium">Lien Live</label>
                      <Input value={texts.navLive} onChange={(e) => setTexts({ ...texts, navLive: e.target.value })} />
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="rsvp" className="border rounded-xl px-4 mb-4">
                <AccordionTrigger className="hover:no-underline">RSVP</AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-3">
                    <div className="space-y-2">
                      <label className="text-xs font-medium">Titre</label>
                      <Input value={texts.rsvpTitle} onChange={(e) => setTexts({ ...texts, rsvpTitle: e.target.value })} />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-medium">Description</label>
                      <Textarea rows={3} value={texts.rsvpDescription} onChange={(e) => setTexts({ ...texts, rsvpDescription: e.target.value })} />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-medium">Bouton RSVP</label>
                      <Input value={texts.rsvpButton} onChange={(e) => setTexts({ ...texts, rsvpButton: e.target.value })} />
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="cagnotte" className="border rounded-xl px-4 mb-4">
                <AccordionTrigger className="hover:no-underline">Cagnotte</AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-3">
                    <div className="space-y-2">
                      <label className="text-xs font-medium">Titre</label>
                      <Input value={texts.cagnotteTitle} onChange={(e) => setTexts({ ...texts, cagnotteTitle: e.target.value })} />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-medium">Description</label>
                      <Textarea rows={3} value={texts.cagnotteDescription} onChange={(e) => setTexts({ ...texts, cagnotteDescription: e.target.value })} />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <label className="text-xs font-medium">Bouton retour</label>
                        <Input value={texts.cagnotteBackLabel} onChange={(e) => setTexts({ ...texts, cagnotteBackLabel: e.target.value })} />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-medium">Bouton contribution</label>
                        <Input value={texts.cagnotteSubmitLabel} onChange={(e) => setTexts({ ...texts, cagnotteSubmitLabel: e.target.value })} />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-medium">Montants suggérés (CSV)</label>
                      <Input
                        value={sections.cagnotteSuggestedAmounts.join(", ")}
                        onChange={(e) => {
                          const parsed = e.target.value
                            .split(",")
                            .map((part) => Number(part.trim()))
                            .filter((amount) => Number.isFinite(amount) && amount > 0);
                          setSections((prev) => ({
                            ...prev,
                            cagnotteSuggestedAmounts: parsed.length ? parsed : [20, 50, 100, 150, 200],
                          }));
                        }}
                        placeholder="20, 50, 100, 150, 200"
                      />
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="live" className="border rounded-xl px-4 mb-4">
                <AccordionTrigger className="hover:no-underline">Live</AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-3">
                    <div className="space-y-2">
                      <label className="text-xs font-medium">Titre live</label>
                      <Input value={texts.liveTitle} onChange={(e) => setTexts({ ...texts, liveTitle: e.target.value })} />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-medium">Sous-titre</label>
                      <Input value={texts.liveSubtitle} onChange={(e) => setTexts({ ...texts, liveSubtitle: e.target.value })} />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-medium">Titre des donateurs</label>
                      <Input value={texts.liveDonorsTitle} onChange={(e) => setTexts({ ...texts, liveDonorsTitle: e.target.value })} />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-medium">Texte QR</label>
                      <Input value={texts.liveQrCaption} onChange={(e) => setTexts({ ...texts, liveQrCaption: e.target.value })} />
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="location" className="border rounded-xl px-4 mb-4">
                <AccordionTrigger className="hover:no-underline">Titres & Intro</AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-3">
                    <div className="space-y-2">
                      <label className="text-xs font-medium">Titre lieu</label>
                      <Input value={texts.locationTitle} onChange={(e) => setTexts({ ...texts, locationTitle: e.target.value })} />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-medium">Description lieu</label>
                      <Textarea rows={3} value={texts.locationDescription} onChange={(e) => setTexts({ ...texts, locationDescription: e.target.value })} />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-medium">Titre programme</label>
                      <Input value={texts.programTitle} onChange={(e) => setTexts({ ...texts, programTitle: e.target.value })} />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-medium">Description programme</label>
                      <Textarea rows={3} value={texts.programDescription} onChange={(e) => setTexts({ ...texts, programDescription: e.target.value })} />
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="location-items" className="border rounded-xl px-4 mb-4">
                <AccordionTrigger className="hover:no-underline">Lieux & Accès</AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-4">
                    {sections.locationItems.map((item, idx) => (
                      <div key={`${item.title}-${idx}`} className="rounded-lg border border-border p-3 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-semibold">Lieu {idx + 1}</span>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              setSections((prev) => ({
                                ...prev,
                                locationItems: prev.locationItems.filter((_, i) => i !== idx),
                              }))
                            }
                          >
                            Supprimer
                          </Button>
                        </div>
                        <Input
                          value={item.title}
                          onChange={(e) =>
                            setSections((prev) => {
                              const items = [...prev.locationItems];
                              items[idx] = { ...items[idx], title: e.target.value };
                              return { ...prev, locationItems: items };
                            })
                          }
                          placeholder="Titre du lieu"
                        />
                        <Input
                          value={item.address}
                          onChange={(e) =>
                            setSections((prev) => {
                              const items = [...prev.locationItems];
                              items[idx] = { ...items[idx], address: e.target.value };
                              return { ...prev, locationItems: items };
                            })
                          }
                          placeholder="Adresse"
                        />
                        <Textarea
                          rows={2}
                          value={item.description}
                          onChange={(e) =>
                            setSections((prev) => {
                              const items = [...prev.locationItems];
                              items[idx] = { ...items[idx], description: e.target.value };
                              return { ...prev, locationItems: items };
                            })
                          }
                          placeholder="Description"
                        />
                      </div>
                    ))}
                    <Button
                      variant="outline"
                      onClick={() =>
                        setSections((prev) => ({
                          ...prev,
                          locationItems: [
                            ...prev.locationItems,
                            { title: "Nouveau lieu", address: "", description: "" },
                          ],
                        }))
                      }
                    >
                      Ajouter un lieu
                    </Button>
                  </div>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="program-items" className="border rounded-xl px-4 mb-4">
                <AccordionTrigger className="hover:no-underline">Déroulé</AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-4">
                    {sections.programItems.map((item, idx) => (
                      <div key={`${item.title}-${idx}`} className="rounded-lg border border-border p-3 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-semibold">Étape {idx + 1}</span>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              setSections((prev) => ({
                                ...prev,
                                programItems: prev.programItems.filter((_, i) => i !== idx),
                              }))
                            }
                          >
                            Supprimer
                          </Button>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <Input
                            value={item.time}
                            onChange={(e) =>
                              setSections((prev) => {
                                const items = [...prev.programItems];
                                items[idx] = { ...items[idx], time: e.target.value };
                                return { ...prev, programItems: items };
                              })
                            }
                            placeholder="Horaire"
                          />
                          <Input
                            value={item.title}
                            onChange={(e) =>
                              setSections((prev) => {
                                const items = [...prev.programItems];
                                items[idx] = { ...items[idx], title: e.target.value };
                                return { ...prev, programItems: items };
                              })
                            }
                            placeholder="Titre"
                          />
                        </div>
                        <Textarea
                          rows={2}
                          value={item.description}
                          onChange={(e) =>
                            setSections((prev) => {
                              const items = [...prev.programItems];
                              items[idx] = { ...items[idx], description: e.target.value };
                              return { ...prev, programItems: items };
                            })
                          }
                          placeholder="Description"
                        />
                      </div>
                    ))}
                    <Button
                      variant="outline"
                      onClick={() =>
                        setSections((prev) => ({
                          ...prev,
                          programItems: [
                            ...prev.programItems,
                            { time: "12:00", title: "Nouvelle étape", description: "" },
                          ],
                        }))
                      }
                    >
                      Ajouter une étape
                    </Button>
                  </div>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="story" className="border rounded-xl px-4 mb-4">
                <AccordionTrigger className="hover:no-underline">Histoire</AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-3">
                    <div className="space-y-2">
                      <label className="text-xs font-medium">Titre</label>
                      <Input value={texts.storyTitle} onChange={(e) => setTexts({ ...texts, storyTitle: e.target.value })} />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-medium">Texte</label>
                      <Textarea rows={4} value={texts.storyBody} onChange={(e) => setTexts({ ...texts, storyBody: e.target.value })} />
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
        </aside>

        <main className="bg-[#F3F5F9] p-6 min-h-0">
          <div className="rounded-2xl border bg-white overflow-hidden shadow-sm h-full">
            <div className="bg-muted/40 px-4 py-2 text-xs text-muted-foreground flex items-center justify-between">
              <span className="truncate">{previewUrl}</span>
              <span>Preview</span>
            </div>
            <iframe
              src={previewUrl}
              title="Preview public"
              className="w-full h-[calc(100vh-180px)] border-0"
            />
          </div>
        </main>
      </div>
    </div>
  );
}
