import { useMemo } from "react";
import type { Wedding, Gift as GiftDb } from "@shared/schema";
import { getTokens, type TemplateTokens } from "@/design-system/tokens";
import { getTemplatePreset, getButtonClass } from "@/lib/design-presets";
import { resolveFontProfile } from "@/lib/font-profiles";
import { getSiteLanguagePack } from "@/lib/site-language";
import { usePublicEdit } from "@/contexts/public-edit";
import {
  HeroSection,
  CountdownSection,
  RSVPSection,
  StorySection,
  GallerySection,
  LocationsSection,
  ScheduleSection,
  GiftsSection,
  CagnotteSection,
  AccommodationsSection,
} from "@/features/public-site/sections";
import type {
  AccommodationItem,
  LocationItem,
  ProgramItem,
  SaveTextFn,
} from "@/features/public-site/types";

const DEFAULT_GALLERY_IMAGES = [
  "/defaults/gallery/01.jpg",
  "/defaults/gallery/02.jpg",
  "/defaults/gallery/03.jpg",
  "/defaults/gallery/04.jpg",
  "/defaults/gallery/05.jpg",
  "/defaults/gallery/06.jpg",
];

const DEFAULT_LOCATION_ITEMS: LocationItem[] = [
  {
    title: "Cérémonie & Réception",
    address: "Le Domaine de la Fontaine — 14 Route de l'Élégance",
    description: "Un havre de paix entouré de nature pour célébrer notre union.",
  },
  {
    title: "Hébergement",
    address: "Hôtel du Parc — 2 Rue Sadi Carnot",
    description: "Un bloc de chambres a été réservé pour nos invités.",
  },
];

const DEFAULT_PROGRAM_ITEMS: ProgramItem[] = [
  { time: "14:30", title: "Accueil des invités", description: "Installation et rafraîchissements au Château." },
  { time: "15:30", title: "Cérémonie Laïque", description: "Échange des vœux et rituels symboliques dans le jardin." },
  { time: "17:30", title: "Cocktail Dînatoire", description: "Jazz live, animations et dégustation de produits locaux." },
  { time: "20:00", title: "Dîner & Soirée", description: "Banquet sous les étoiles et ouverture de balle." },
];

const FAKE_DATA = {
  title: "Famille Lawson",
  date: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(),
  heroImage: "/defaults/lawson_couple.png",
  couplePhoto: "/defaults/lawson_reception.png",
  story: "Tout a commencé par une rencontre inattendue au cœur de Paris. Entre rires partagés et voyages mémorables, nous avons construit une complicité unique. Aujourd'hui, nous avons hâte de célébrer ce nouveau chapitre avec vous, entourés de ceux qui nous sont chers.",
};

const MAX_GALLERY_IMAGES = 10;

const getButtonRadiusClass = (buttonRadius?: string) => {
  if (buttonRadius === "square") return "rounded-md";
  if (buttonRadius === "rounded") return "rounded-xl";
  return "rounded-full";
};

interface TemplateRendererProps {
  wedding: Wedding;
  draftMedia: { heroImage: string; couplePhoto: string };
  isUploading: { heroImage: boolean; couplePhoto: boolean };
  ctaPath: string;
  gifts: GiftDb[];
  slug: string;
  basePath: string;
  onSaveText: SaveTextFn;
  onHeroCtaClick: () => void;
  onMediaUpload: (key: "heroImage" | "couplePhoto") => (event: React.ChangeEvent<HTMLInputElement>) => void;
  onUpdateMedia: (key: "heroImage" | "couplePhoto", value: string) => Promise<void>;
  onSaveCountdownDate: (value: string) => Promise<void>;
  onSaveCtaPath: (value: string) => Promise<void>;
  onUpdateLocationItem: (index: number, patch: Partial<LocationItem>) => Promise<void>;
  onDeleteLocationItem: (index: number) => Promise<void>;
  onAddLocationItem: () => Promise<void>;
  onUpdateProgramItem: (index: number, patch: Partial<ProgramItem>) => Promise<void>;
  onDeleteProgramItem: (index: number) => Promise<void>;
  onAddProgramItem: () => Promise<void>;
  onGalleryFilesSelected: (files: FileList | null) => Promise<void>;
  onRemoveGalleryImage: (index: number) => Promise<void>;
  onResetGallery: () => Promise<void>;
  onSetMainGalleryImage?: (index: number) => void;
  onCreateGift: () => void;
  onEditGift: (gift: GiftDb) => void;
  onDeleteGift: (gift: GiftDb) => void;
  onReserveGift?: (giftId: number, guestName: string) => void;
  toDateInputValue: (value: string) => string;
  fromDateInputValue: (value: string) => string;
}

function hexToHSL(hex: string): { h: number; s: number; l: number } {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0;
  const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
    else if (max === g) h = ((b - r) / d + 2) / 6;
    else h = ((r - g) / d + 4) / 6;
  }
  return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) };
}

export function TemplateRenderer(props: TemplateRendererProps) {
  const { wedding, draftMedia, gifts, slug } = props;
  const { canEdit, editMode } = usePublicEdit();

  const templateId = wedding.templateId || "classic";
  const languagePack = getSiteLanguagePack((wedding.config as any)?.language);
  const tokens = getTokens(templateId);
  const preset = getTemplatePreset(templateId);
  const activeFont = wedding.config?.theme?.fontFamily || preset.defaultFont;
  const fontClass = resolveFontProfile(activeFont).baseClass;

  const primaryColor = wedding.config?.theme?.primaryColor || "#C8A96A";
  const secondaryColor = wedding.config?.theme?.secondaryColor || "#FFFDF9";
  const primaryHSL = hexToHSL(primaryColor);
  const secondaryHSL = hexToHSL(secondaryColor);

  const darkL = Math.max(primaryHSL.l - 35, 10);
  const subtleL = Math.min(primaryHSL.l + 10, 55);

  const cssVars = {
    "--wedding-primary": primaryColor,
    "--wedding-secondary": secondaryColor,
    "--wedding-primary-h": String(primaryHSL.h),
    "--wedding-primary-s": `${primaryHSL.s}%`,
    "--wedding-primary-l": `${primaryHSL.l}%`,
    "--wedding-secondary-h": String(secondaryHSL.h),
    "--wedding-secondary-s": `${secondaryHSL.s}%`,
    "--wedding-secondary-l": `${secondaryHSL.l}%`,
    "--wedding-text-dark": `hsl(${primaryHSL.h}, ${Math.min(primaryHSL.s, 30)}%, ${darkL}%)`,
    "--wedding-text-subtle": `hsl(${primaryHSL.h}, ${Math.min(primaryHSL.s, 25)}%, ${subtleL}%)`,
  } as React.CSSProperties;

  const heroTitle = wedding.config?.texts?.heroTitle || wedding.title;
  const heroSubtitle = wedding.config?.texts?.heroSubtitle || languagePack.texts.heroSubtitle;
  const heroCta = wedding.config?.texts?.heroCta || languagePack.texts.heroCta;
  const heroDate = wedding.config?.texts?.weddingDate || (wedding.weddingDate ? new Date(wedding.weddingDate).toLocaleDateString(languagePack.locale, { day: "numeric", month: "long", year: "numeric" }) : "Prochainement");
  const rsvpTitle = wedding.config?.texts?.rsvpTitle || languagePack.texts.rsvpTitle;
  const rsvpDescription = wedding.config?.texts?.rsvpDescription || languagePack.texts.rsvpDescription;
  const rsvpButton = wedding.config?.texts?.rsvpButton || languagePack.texts.rsvpButton;
  const storyTitle = wedding.config?.texts?.storyTitle || languagePack.texts.storyTitle;
  const storyBody = wedding.config?.texts?.storyBody || FAKE_DATA.story;
  const locationTitle = wedding.config?.texts?.locationTitle || languagePack.texts.locationTitle;
  const locationDescription = wedding.config?.texts?.locationDescription || languagePack.texts.locationDescription;
  const programTitle = wedding.config?.texts?.programTitle || languagePack.texts.programTitle;
  const programDescription = wedding.config?.texts?.programDescription || languagePack.texts.programDescription;
  const accommodationTitle = (wedding.config?.texts as any)?.accommodationTitle || languagePack.texts.accommodationTitle;
  const accommodationDescription = (wedding.config?.texts as any)?.accommodationDescription || languagePack.texts.accommodationDescription;
  const galleryTitle = wedding.config?.texts?.galleryTitle || languagePack.texts.galleryTitle;
  const galleryDescription = wedding.config?.texts?.galleryDescription || languagePack.texts.galleryDescription;
  const giftsTitle = (wedding.config?.texts as any)?.giftsTitle || languagePack.texts.giftsTitle;
  const giftsDescription = (wedding.config?.texts as any)?.giftsDescription || languagePack.texts.giftsDescription;
  const cagnotteTitle = wedding.config?.texts?.cagnotteTitle || languagePack.texts.cagnotteTitle;
  const cagnotteDescription = wedding.config?.texts?.cagnotteDescription || languagePack.texts.cagnotteDescription;

  const countdownTitle = (wedding.config?.texts as any)?.countdownTitle || "Compte à rebours";

  const heroImage = draftMedia.heroImage || "";
  const couplePhoto = draftMedia.couplePhoto || "";
  const logoUrl = wedding.config?.branding?.logoUrl || "";
  const logoText = wedding.config?.branding?.logoText || wedding.title;
  const logoTextStyle = (wedding.config?.branding as any)?.logoTextStyle || "elegant";
  const countdownDateRaw = wedding.config?.sections?.countdownDate || wedding.weddingDate || FAKE_DATA.date;
  const countdownDate = countdownDateRaw instanceof Date ? countdownDateRaw.toISOString() : String(countdownDateRaw);

  const locationItems: LocationItem[] = (wedding.config?.sections?.locationItems?.length ? wedding.config.sections.locationItems : DEFAULT_LOCATION_ITEMS) as LocationItem[];
  const programItems: ProgramItem[] = (wedding.config?.sections?.programItems?.length ? wedding.config.sections.programItems : DEFAULT_PROGRAM_ITEMS) as ProgramItem[];
  const accommodationItems: AccommodationItem[] = (((wedding.config?.sections as any)?.accommodationItems || []) as AccommodationItem[]);
  const rawGallery = wedding.config?.sections?.galleryImages?.length
    ? wedding.config.sections.galleryImages
    : (wedding.config?.media as any)?.galleryImages?.length
      ? (wedding.config.media as any).galleryImages
      : DEFAULT_GALLERY_IMAGES;
  const galleryImages = (rawGallery as string[]).slice(0, MAX_GALLERY_IMAGES);

  const showRsvp = wedding.config?.navigation?.pages?.rsvp ?? true;
  const showStory = wedding.config?.navigation?.pages?.story ?? true;
  const showGallery = wedding.config?.navigation?.pages?.gallery ?? true;
  const showAccommodation = (((wedding.config?.navigation?.pages as any)?.accommodation ?? true) as boolean) && accommodationItems.length > 0;
  const showGifts =
    (((wedding.config?.navigation?.pages as any)?.gifts ?? true) as boolean) &&
    (wedding.config?.features?.giftsEnabled ?? true) &&
    (gifts.length > 0 || (canEdit && editMode));
  const showCagnotte = (wedding.config?.navigation?.pages?.cagnotte ?? true) && (wedding.config?.features?.cagnotteEnabled ?? true);
  const showLocation = wedding.config?.navigation?.pages?.location ?? true;
  const showProgram = wedding.config?.navigation?.pages?.program ?? true;

  const contributionMethods = wedding.config?.payments?.contributionMethods || [];

  const buttonToneClass = getButtonClass(wedding.config?.theme?.buttonStyle);
  const buttonRadiusClass = getButtonRadiusClass(wedding.config?.theme?.buttonRadius);

  const sectionOrder = useMemo(() => {
    const base = ["rsvp", "gifts", "cagnotte", "story", "gallery", "accommodation", "location", "program"] as const;
    const incoming = ((wedding.config?.navigation?.menuItems || []) as Array<{ path?: string }>).map((it) => String(it.path || "").trim());
    const ordered = [
      ...incoming.filter((p) => (base as readonly string[]).includes(p)),
      ...base.filter((p) => !incoming.includes(p)),
    ];
    const map: Record<string, number> = {};
    ordered.forEach((p, idx) => {
      map[p] = idx;
    });
    return map as Record<(typeof base)[number], number>;
  }, [wedding.config?.navigation?.menuItems]);

  const editProps = { canEdit, editMode };

  return (
    <div className={`min-h-screen relative group/page ${tokens.page.bg} ${fontClass}`} style={cssVars}>
      <HeroSection
        {...editProps}
        tokens={tokens}
        wedding={wedding}
        heroTitle={heroTitle}
        heroSubtitle={heroSubtitle}
        heroDate={heroDate}
        heroCta={heroCta}
        heroImage={heroImage}
        logoUrl={logoUrl}
        logoText={logoText}
        logoTextStyle={logoTextStyle}
        countdownDate={countdownDate}
        ctaPath={props.ctaPath}
        buttonToneClass={buttonToneClass}
        buttonRadiusClass={buttonRadiusClass}
        onSaveText={props.onSaveText}
        onHeroCtaClick={props.onHeroCtaClick}
        onMediaUpload={props.onMediaUpload}
        onUpdateMedia={props.onUpdateMedia}
        isUploading={props.isUploading}
        onSaveCountdownDate={props.onSaveCountdownDate}
        onSaveCtaPath={props.onSaveCtaPath}
        toDateInputValue={props.toDateInputValue}
        fromDateInputValue={props.fromDateInputValue}
      />

      <div className="flex flex-col">
        <CountdownSection
          {...editProps}
          tokens={tokens}
          weddingDate={countdownDate}
          countdownTitle={countdownTitle}
          onSaveText={props.onSaveText}
        />

        {showRsvp && (
          <RSVPSection
            {...editProps}
            tokens={tokens}
            wedding={wedding}
            rsvpTitle={rsvpTitle}
            rsvpDescription={rsvpDescription}
            rsvpButton={rsvpButton}
            buttonToneClass={buttonToneClass}
            buttonRadiusClass={buttonRadiusClass}
            onSaveText={props.onSaveText}
            order={sectionOrder.rsvp ?? 0}
          />
        )}

        {showGifts && (
          <GiftsSection
            {...editProps}
            tokens={tokens}
            giftsTitle={giftsTitle}
            giftsDescription={giftsDescription}
            gifts={gifts}
            onSaveText={props.onSaveText}
            onCreateGift={props.onCreateGift}
            onEditGift={props.onEditGift}
            onDeleteGift={props.onDeleteGift}
            onReserveGift={props.onReserveGift}
            order={sectionOrder.gifts ?? 1}
          />
        )}

        {showCagnotte && (
          <CagnotteSection
            {...editProps}
            tokens={tokens}
            cagnotteTitle={cagnotteTitle}
            cagnotteDescription={cagnotteDescription}
            contributionMethods={contributionMethods}
            buttonRadiusClass={buttonRadiusClass}
            onSaveText={props.onSaveText}
            order={sectionOrder.cagnotte ?? 2}
          />
        )}

        {showStory && (
          <StorySection
            {...editProps}
            tokens={tokens}
            storyTitle={storyTitle}
            storyBody={storyBody}
            couplePhoto={couplePhoto}
            onSaveText={props.onSaveText}
            onMediaUpload={props.onMediaUpload}
            onUpdateMedia={props.onUpdateMedia}
            isUploading={props.isUploading}
            order={sectionOrder.story ?? 3}
          />
        )}

        {showGallery && (
          <GallerySection
            {...editProps}
            tokens={tokens}
            galleryTitle={galleryTitle}
            galleryDescription={galleryDescription}
            galleryImages={galleryImages}
            onSaveText={props.onSaveText}
            onGalleryFilesSelected={props.onGalleryFilesSelected}
            onRemoveGalleryImage={props.onRemoveGalleryImage}
            onResetGallery={props.onResetGallery}
            onSetMainImage={props.onSetMainGalleryImage}
            maxImages={MAX_GALLERY_IMAGES}
            order={sectionOrder.gallery ?? 4}
          />
        )}

        {showAccommodation && (
          <AccommodationsSection
            {...editProps}
            tokens={tokens}
            accommodationTitle={accommodationTitle}
            accommodationDescription={accommodationDescription}
            accommodationItems={accommodationItems}
            onSaveText={props.onSaveText}
            order={sectionOrder.accommodation ?? 5}
          />
        )}

        {showLocation && (
          <LocationsSection
            {...editProps}
            tokens={tokens}
            locationTitle={locationTitle}
            locationDescription={locationDescription}
            locationItems={locationItems}
            onSaveText={props.onSaveText}
            onUpdateLocationItem={props.onUpdateLocationItem}
            onDeleteLocationItem={props.onDeleteLocationItem}
            onAddLocationItem={props.onAddLocationItem}
            order={sectionOrder.location ?? 6}
          />
        )}

        {showProgram && (
          <ScheduleSection
            {...editProps}
            tokens={tokens}
            programTitle={programTitle}
            programDescription={programDescription}
            programItems={programItems}
            onSaveText={props.onSaveText}
            onUpdateProgramItem={props.onUpdateProgramItem}
            onDeleteProgramItem={props.onDeleteProgramItem}
            onAddProgramItem={props.onAddProgramItem}
            order={sectionOrder.program ?? 7}
          />
        )}
      </div>
    </div>
  );
}
