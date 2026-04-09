import { useMemo } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import type { Wedding } from "@shared/schema";
import { PublicEditProvider } from "@/contexts/public-edit";
import { TemplateRenderer } from "@/features/public-site/templates/TemplateRenderer";
import { AvantGardeTemplateRenderer } from "@/features/public-site/templates/AvantGardeTemplateRenderer";
import { ThemeProvider } from "@/components/ThemeProvider";
import { resolveTone, getTemplatePreset } from "@/lib/design-presets";
import { WhatsAppSupportButton } from "@/components/support/WhatsAppSupportButton";
import { getSiteLanguagePack } from "@/lib/site-language";

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

  const languagePack = getSiteLanguagePack(data?.language);
  const isEnglish = languagePack.language === "en";

  if (!data) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 p-8 text-center">
        <h1 className="text-2xl font-serif font-bold">{isEnglish ? "Preview unavailable" : "Aperçu non disponible"}</h1>
        <p className="text-muted-foreground">{isEnglish ? "Go back to the setup assistant to generate a preview." : "Retournez à l'assistant de création pour générer un aperçu."}</p>
        <Button onClick={() => setLocation("/onboarding")} className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          {isEnglish ? "Back" : "Retour"}
        </Button>
      </div>
    );
  }

  const tone = resolveTone(data.toneId);
  const preset = getTemplatePreset(data.templateId);

  const wedding: Wedding = {
    id: "preview",
    ownerId: "preview",
    title: data.title || (isEnglish ? "My Wedding" : "Mon Mariage"),
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
        heroTitle: data.title || (isEnglish ? "My Wedding" : "Mon Mariage"),
        heroSubtitle: languagePack.texts.heroSubtitle,
        weddingDate: data.weddingDate || "",
        heroCta: languagePack.texts.heroCta,
        rsvpTitle: languagePack.texts.rsvpTitle,
        rsvpSubtitle: languagePack.texts.rsvpDescription,
        rsvpButton: languagePack.texts.rsvpButton,
        storyTitle: languagePack.texts.storyTitle,
        storyBody: data.storyBody || "",
        galleryTitle: languagePack.texts.galleryTitle,
        locationTitle: languagePack.texts.locationTitle,
        scheduleTitle: languagePack.texts.programTitle,
        giftsTitle: languagePack.texts.giftsTitle,
        giftsSubtitle: languagePack.texts.giftsDescription,
        cagnotteTitle: languagePack.texts.cagnotteTitle,
        cagnotteDescription: languagePack.texts.cagnotteDescription,
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
          { id: "home", path: "home", label: languagePack.menuLabels.home, enabled: true },
          { id: "rsvp", path: "rsvp", label: "RSVP", enabled: true },
          { id: "gifts", path: "gifts", label: languagePack.menuLabels.gifts, enabled: data.features?.giftsEnabled ?? true },
          { id: "story", path: "story", label: languagePack.menuLabels.story, enabled: true },
          { id: "gallery", path: "gallery", label: languagePack.menuLabels.gallery, enabled: true },
          { id: "accommodation", path: "accommodation", label: languagePack.menuLabels.accommodation, enabled: false },
          { id: "location", path: "location", label: languagePack.menuLabels.location, enabled: true },
          { id: "program", path: "program", label: languagePack.menuLabels.program, enabled: true },
          { id: "cagnotte", path: "cagnotte", label: languagePack.texts.navCagnotte, enabled: data.features?.cagnotteEnabled ?? true },
        ],
        pages: {
          rsvp: true,
          cagnotte: data.features?.cagnotteEnabled ?? true,
          gifts: data.features?.giftsEnabled ?? true,
          live: data.features?.liveEnabled ?? true,
          story: true,
          gallery: true,
          accommodation: false,
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
            onClick={() => { window.close(); setTimeout(() => setLocation("/onboarding"), 100); }}
          >
            <ArrowLeft className="h-4 w-4" />
            {isEnglish ? "Close preview" : "Fermer l'aperçu"}
          </Button>
        </div>

        {data.templateId === "avantgarde" ? (
          <AvantGardeTemplateRenderer
            wedding={wedding}
            draftMedia={{ heroImage: data.heroImage || "", couplePhoto: data.couplePhoto || "" }}
            isUploading={{ heroImage: false, couplePhoto: false }}
            ctaPath="rsvp"
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
            toDateInputValue={(v: any) => v}
            fromDateInputValue={(v: any) => v}
          />
        ) : (
          <TemplateRenderer
            wedding={wedding}
            draftMedia={{ heroImage: data.heroImage || "", couplePhoto: data.couplePhoto || "" }}
            isUploading={{ heroImage: false, couplePhoto: false }}
            ctaPath="rsvp"
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
            toDateInputValue={(v: any) => v}
            fromDateInputValue={(v: any) => v}
          />
        )}
        <WhatsAppSupportButton
          pageLabel={isEnglish ? "Onboarding preview" : "Aperçu onboarding"}
          weddingName={data.title || null}
          weddingSlug={data.slug || null}
          showHint
          className="bottom-5 right-5"
        />
      </ThemeProvider>
    </PublicEditProvider>
  );
}
