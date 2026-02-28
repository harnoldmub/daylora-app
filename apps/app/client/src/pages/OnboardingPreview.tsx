import { useMemo } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import type { Wedding } from "@shared/schema";
import { PublicEditProvider } from "@/contexts/public-edit";
import { TemplateRenderer } from "@/features/public-site/templates/TemplateRenderer";
import { ThemeProvider } from "@/components/ThemeProvider";
import { resolveTone, getTemplatePreset } from "@/lib/design-presets";

const noop = () => {};
const noopAsync = async () => {};
const noopStr = async (_v: string) => {};
const noopSave = async (_k: string, _v: string) => {};

export default function OnboardingPreview() {
  const [, setLocation] = useLocation();

  const data = useMemo(() => {
    try {
      const raw = localStorage.getItem("daylora_onboarding_preview");
      if (!raw) return null;
      return JSON.parse(raw);
    } catch { return null; }
  }, []);

  if (!data) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 p-8 text-center">
        <h1 className="text-2xl font-serif font-bold">Aperçu non disponible</h1>
        <p className="text-muted-foreground">Retournez à l'assistant de création pour générer un aperçu.</p>
        <Button onClick={() => setLocation("/onboarding")} className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          Retour
        </Button>
      </div>
    );
  }

  const tone = resolveTone(data.toneId);
  const preset = getTemplatePreset(data.templateId);

  const wedding: Wedding = {
    id: "preview",
    ownerId: "preview",
    title: data.title || "Mon Mariage",
    slug: data.slug || "preview",
    weddingDate: data.weddingDate || null,
    templateId: data.templateId || "classic",
    currentPlan: "premium",
    createdAt: new Date(),
    updatedAt: new Date(),
    stripeConnectedAccountId: null,
    stripeOnboardingComplete: false,
    config: {
      texts: {
        heroTitle: data.title || "Mon Mariage",
        heroSubtitle: "Le mariage de",
        weddingDate: data.weddingDate || "",
        heroCta: "Confirmer votre présence",
        rsvpTitle: "Confirmez votre présence",
        rsvpSubtitle: "Nous serions ravis de vous compter parmi nous",
        rsvpButton: "Je confirme ma présence",
        storyTitle: "Notre Histoire",
        storyBody: data.storyBody || "",
        galleryTitle: "Galerie Photos",
        locationTitle: "Lieux",
        scheduleTitle: "Programme",
        giftsTitle: "Liste de Cadeaux",
        giftsSubtitle: "Faites plaisir aux mariés",
        cagnotteTitle: "Cagnotte",
        cagnotteDescription: "Votre présence est notre plus beau cadeau.",
      },
      media: {
        heroImage: data.heroImage || "",
        couplePhoto: data.couplePhoto || "",
        galleryImages: data.galleryImages || [],
      },
      theme: {
        toneId: tone.id,
        primaryColor: tone.primaryColor,
        secondaryColor: tone.secondaryColor,
        fontFamily: preset.defaultFont,
        buttonStyle: preset.defaultButtonStyle,
        buttonRadius: preset.defaultButtonRadius,
      },
      features: {
        rsvpEnabled: true,
        giftsEnabled: data.features?.giftsEnabled ?? true,
        cagnotteEnabled: data.features?.cagnotteEnabled ?? true,
        liveEnabled: data.features?.liveEnabled ?? true,
        storyEnabled: true,
        galleryEnabled: true,
        locationEnabled: true,
        scheduleEnabled: true,
      },
      navigation: {
        menuItems: [
          { id: "home", path: "home", label: "Accueil", enabled: true },
          { id: "rsvp", path: "rsvp", label: "RSVP", enabled: true },
          { id: "gifts", path: "gifts", label: "Cadeaux", enabled: data.features?.giftsEnabled ?? true },
          { id: "story", path: "story", label: "Histoire", enabled: true },
          { id: "gallery", path: "gallery", label: "Photos", enabled: true },
          { id: "location", path: "location", label: "Lieux", enabled: true },
          { id: "program", path: "program", label: "Programme", enabled: true },
          { id: "cagnotte", path: "cagnotte", label: "Cagnotte", enabled: data.features?.cagnotteEnabled ?? true },
        ],
        pages: {
          rsvp: true,
          cagnotte: data.features?.cagnotteEnabled ?? true,
          gifts: data.features?.giftsEnabled ?? true,
          live: data.features?.liveEnabled ?? true,
          story: true,
          gallery: true,
          location: true,
          program: true,
        },
      },
      locations: [],
      schedule: [],
    },
  } as any;

  const editValue = { canEdit: false, editMode: false, setEditMode: noop };

  const handleScrollTo = () => {
    const el = document.getElementById("rsvp");
    if (el) el.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <PublicEditProvider value={editValue}>
      <ThemeProvider wedding={wedding}>
        <div className="fixed top-4 left-4 z-[100]">
          <Button
            size="sm"
            variant="secondary"
            className="gap-2 shadow-lg"
            onClick={() => setLocation("/onboarding")}
          >
            <ArrowLeft className="h-4 w-4" />
            Retour à l'inscription
          </Button>
        </div>

        <TemplateRenderer
          wedding={wedding}
          draftMedia={{ heroImage: data.heroImage || "", couplePhoto: data.couplePhoto || "" }}
          isUploading={{ heroImage: false, couplePhoto: false }}
          ctaPath="rsvp"
          draftCagnotteExternalUrl=""
          gifts={[]}
          slug={data.slug || "preview"}
          basePath=""
          onSaveText={noopSave}
          onHeroCtaClick={handleScrollTo}
          onMediaUpload={() => () => {}}
          onUpdateMedia={noopStr as any}
          onSaveCountdownDate={noopStr}
          onSaveCtaPath={noopStr}
          onUpdateLocationItem={noopAsync as any}
          onDeleteLocationItem={noopAsync as any}
          onAddLocationItem={noopAsync}
          onUpdateProgramItem={noopAsync as any}
          onDeleteProgramItem={noopAsync as any}
          onAddProgramItem={noopAsync}
          onGalleryFilesSelected={noopAsync as any}
          onRemoveGalleryImage={noopAsync as any}
          onResetGallery={noopAsync}
          onCreateGift={noop}
          onEditGift={noop}
          onDeleteGift={noop}
          onSaveCagnotteExternalUrl={noopStr}
          onSetDraftCagnotteExternalUrl={noop}
          toDateInputValue={(v) => v}
          fromDateInputValue={(v) => v}
        />
      </ThemeProvider>
    </PublicEditProvider>
  );
}
