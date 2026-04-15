import { useWedding, useUpdateWedding } from "@/hooks/use-api";
import { useParams, Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { useCallback, useEffect, useMemo, useState } from "react";
import { BUTTON_RADIUS_OPTIONS, BUTTON_STYLE_OPTIONS, COLOR_TONES } from "@/lib/design-presets";
import { GuidedTour, useShouldShowTour } from "@/components/guided-tour";
import ContributionMethodsEditor from "@/components/admin/ContributionMethodsEditor";
import type { ContributionMethod } from "@shared/schema";
import { LOGO_TEXT_STYLE_OPTIONS, getLogoTextClassName, getLogoTextWrapperClassName } from "@/lib/logo-styles";
import { FONT_PROFILE_OPTIONS, resolveFontProfile } from "@/lib/font-profiles";
import { getSiteLanguagePack, type SiteLanguage } from "@/lib/site-language";
import { getAppNls } from "@/lib/nls";
import { PremiumAccessGate } from "@/components/admin/PremiumAccessGate";

const MAX_LOGO_DATA_URL_LENGTH = 220_000;
const MAX_IMAGE_DATA_URL_LENGTH = 3_000_000;
const MAX_GALLERY_IMAGE_DATA_URL_LENGTH = 1_200_000;
const MAX_GALLERY_IMAGES = 10;

const TEMPLATES = [
  { id: "classic", name: "Éclat de Tradition", premium: false },
  { id: "modern", name: "Horizon Minimaliste", premium: true },
  { id: "boho", name: "Bohème Sauvage", premium: true },
  { id: "avantgarde", name: "Studio Couture", premium: true },
];

const DEFAULT_LOCATION_ITEMS = [
  {
    title: "Cérémonie civile",
    address: "Mairie de Lille — 10 Rue Pierre Mauroy",
    description: "Rendez-vous à 14h30 pour accueillir les invités.",
    accommodations: [] as Array<{ name: string; address: string; url: string }>,
  },
  {
    title: "Réception",
    address: "Château de la Verrière — Salle des Roses",
    description: "Cocktail et dîner à partir de 18h.",
    accommodations: [] as Array<{ name: string; address: string; url: string }>,
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

type AccommodationItem = {
  name: string;
  address: string;
  url: string;
};

type DesignLocationItem = {
  title: string;
  address: string;
  description: string;
  accommodations: AccommodationItem[];
};

type DesignProgramItem = {
  time: string;
  title: string;
  description: string;
};

type DesignTextsState = {
  siteTitle: string;
  heroTitle: string;
  heroSubtitle: string;
  weddingDate: string;
  heroCta: string;
  rsvpTitle: string;
  rsvpDescription: string;
  rsvpButton: string;
  navRsvp: string;
  navCagnotte: string;
  locationTitle: string;
  locationDescription: string;
  accommodationTitle: string;
  accommodationDescription: string;
  galleryTitle: string;
  galleryDescription: string;
  programTitle: string;
  programDescription: string;
  storyTitle: string;
  storyBody: string;
  giftsTitle: string;
  giftsDescription: string;
  cagnotteTitle: string;
  cagnotteDescription: string;
  cagnotteBackLabel: string;
  cagnotteSubmitLabel: string;
  dressCode: string;
  invitationGreeting: string;
  invitationPrelude: string;
  invitationMessage: string;
  invitationSubmessage: string;
  invitationCagnotteTitle: string;
  invitationCagnotteDescription: string;
  invitationCagnotteButton: string;
  invitationDressCode: string;
  invitationFooterNote: string;
};

type DesignThemeState = {
  primaryColor: string;
  secondaryColor: string;
  fontFamily: string;
  toneId: string;
  buttonStyle: string;
  buttonRadius: string;
  headerLayout: string;
  headerSpacing: string;
  headerModel: string;
  footerModel: string;
  rsvpModel: string;
};

type DesignMediaState = {
  heroImage: string;
  couplePhoto: string;
};

type DesignBrandingState = {
  logoUrl: string;
  logoText: string;
  logoTextStyle: string;
};

type DesignSectionsState = {
  countdownDate: string;
  cagnotteSuggestedAmounts: number[];
  invitationShowDressCode: boolean;
  locationItems: DesignLocationItem[];
  programItems: DesignProgramItem[];
  accommodationItems: AccommodationItem[];
  galleryImages: string[];
};

type PageVisibilityState = {
  rsvp: boolean;
  gifts: boolean;
  cagnotte: boolean;
  story: boolean;
  gallery: boolean;
  accommodation: boolean;
  location: boolean;
  program: boolean;
};

export default function DesignPage() {
  const { weddingId } = useParams();
  const { data: wedding, isLoading } = useWedding(weddingId);
  const updateWedding = useUpdateWedding();
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);
  const [isApplyingTemplate, setIsApplyingTemplate] = useState(false);
  const showTour = useShouldShowTour("design");
  const [previewToken, setPreviewToken] = useState<number>(Date.now());
  const [language, setLanguage] = useState<SiteLanguage>("fr");

  const [templateId, setTemplateId] = useState<string>("classic");

  const [texts, setTexts] = useState<DesignTextsState>(() => ({
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
    locationTitle: "",
    locationDescription: "",
    accommodationTitle: "",
    accommodationDescription: "",
    galleryTitle: "",
    galleryDescription: "",
    programTitle: "",
    programDescription: "",
    storyTitle: "",
    storyBody: "",
    giftsTitle: "",
    giftsDescription: "",
    cagnotteTitle: "",
    cagnotteDescription: "",
    cagnotteBackLabel: "",
    cagnotteSubmitLabel: "",
    dressCode: "",
    invitationGreeting: "",
    invitationPrelude: "",
    invitationMessage: "",
    invitationSubmessage: "",
    invitationCagnotteTitle: "",
    invitationCagnotteDescription: "",
    invitationCagnotteButton: "",
    invitationDressCode: "",
    invitationFooterNote: "",
  }));

  const [theme, setTheme] = useState<DesignThemeState>(() => ({
    primaryColor: "#C8A96A",
    secondaryColor: "#FFFFFF",
    fontFamily: "serif",
    toneId: "golden-ivory",
    buttonStyle: "solid",
    buttonRadius: "pill",
    headerLayout: "balanced",
    headerSpacing: "comfortable",
    headerModel: "model1",
    footerModel: "model1",
    rsvpModel: "model1",
  }));

  const [media, setMedia] = useState<DesignMediaState>(() => ({
    heroImage: "",
    couplePhoto: "",
  }));

  const [branding, setBranding] = useState<DesignBrandingState>(() => ({
    logoUrl: "",
    logoText: "",
    logoTextStyle: "elegant",
  }));

  const [sections, setSections] = useState<DesignSectionsState>(() => ({
    countdownDate: "",
    cagnotteSuggestedAmounts: [20, 50, 100, 150, 200],
    invitationShowDressCode: true,
    locationItems: DEFAULT_LOCATION_ITEMS,
    programItems: DEFAULT_PROGRAM_ITEMS,
    accommodationItems: [],
    galleryImages: [],
  }));
  const [pageVisibility, setPageVisibility] = useState<PageVisibilityState>(() => ({
    rsvp: true,
    gifts: true,
    cagnotte: true,
    story: true,
    gallery: true,
    accommodation: true,
    location: true,
    program: true,
  }));
  const [contributionMethods, setContributionMethods] = useState<ContributionMethod[]>([]);
  const appNls = getAppNls(language);
  const ui = appNls.designPage;
  const templateLabels = useMemo<Record<string, string>>(
    () => ({
      classic: language === "en" ? "Classic Elegance" : "Éclat de Tradition",
      modern: language === "en" ? "Minimal Horizon" : "Horizon Minimaliste",
      boho: language === "en" ? "Wild Boho" : "Bohème Sauvage",
      "avantgarde": language === "en" ? "Studio Couture" : "Studio Couture",
    }),
    [language]
  );
  const buttonStyleLabels = useMemo<Record<string, string>>(
    () => ({
      solid: language === "en" ? "Solid" : "Plein",
      soft: "Soft",
      outline: language === "en" ? "Outline" : "Contour",
    }),
    [language]
  );
  const buttonRadiusLabels = useMemo<Record<string, string>>(
    () => ({
      pill: "Pill",
      rounded: language === "en" ? "Rounded" : "Arrondi",
      square: language === "en" ? "Structured" : "Structure",
    }),
    [language]
  );
  const logoStyleLabels = useMemo<Record<string, string>>(
    () => ({
      elegant: language === "en" ? "Classic elegant" : "Elegant classique",
      signature: "Signature",
      monogram: language === "en" ? "Monogram" : "Monogramme",
      modern: "Modern chic",
    }),
    [language]
  );
  const headerLayoutLabels = useMemo<Record<string, string>>(
    () => ({
      balanced: language === "en" ? "Logo on the left, menu on the right" : "Logo à gauche, menu à droite",
      centered: language === "en" ? "Everything centered" : "Tout centré",
    }),
    [language]
  );
  const headerSpacingLabels = useMemo<Record<string, string>>(
    () => ({
      compact: language === "en" ? "Compact" : "Compact",
      comfortable: language === "en" ? "Comfortable" : "Confortable",
      airy: language === "en" ? "Airy" : "Aéré",
    }),
    [language]
  );
  const componentLabels = useMemo(
    () => ({
      componentsSection: language === "en" ? "Customize this style" : "Personnaliser ce modèle",
      componentsSectionDesc:
        language === "en"
          ? "Choose the style of the top of the page, the reply form and the bottom of the page."
          : "Choisissez le style du haut de page, du formulaire de réponse et du bas de page.",
      headerStyle: language === "en" ? "Top of the page" : "Style du haut de page",
      headerStyleHint:
        language === "en"
          ? "This changes the area with the logo and menu."
          : "Cela change la zone avec le logo et le menu.",
      rsvpStyle: language === "en" ? "Reply form" : "Style du formulaire de réponse",
      rsvpStyleHint:
        language === "en"
          ? "This changes how guests send their reply."
          : "Cela change la façon dont les invités envoient leur réponse.",
      footerStyle: language === "en" ? "Bottom of the page" : "Style du bas de page",
      footerStyleHint:
        language === "en"
          ? "This changes the final block at the bottom of the website."
          : "Cela change le dernier bloc affiché en bas du site.",
      headerModel1: language === "en" ? "Simple menu" : "Menu simple",
      headerModel2: language === "en" ? "Split menu" : "Menu séparé",
      headerModel3: language === "en" ? "Vertical menu" : "Menu vertical",
      rsvpModel1: language === "en" ? "Simple form" : "Formulaire simple",
      rsvpModel2: language === "en" ? "Reply card" : "Carte de réponse",
      rsvpModel3: language === "en" ? "Large reply section" : "Grande zone de réponse",
      footerModel1: language === "en" ? "Simple footer" : "Bas de page simple",
      footerModel2: language === "en" ? "Footer with initials" : "Bas de page avec initiales",
      footerModel3: language === "en" ? "Dark footer" : "Bas de page foncé",
    }),
    [language]
  );

  useEffect(() => {
    if (!wedding) return;

    const config = wedding.config || ({} as any);
    const resolvedLanguage: SiteLanguage = config.language === "en" ? "en" : "fr";
    const pack = getSiteLanguagePack(resolvedLanguage);
    const packTexts: any = pack.texts || {};
    const packSections: any = pack.sections || {};
    const cfgTexts: any = config.texts || {};
    const cfgTheme: any = config.theme || {};
    const cfgMedia: any = config.media || {};
    const cfgBranding: any = config.branding || {};
    const cfgSections: any = config.sections || {};
    const cfgPages: any = config.navigation?.pages || {};

    const formatWeddingDate = () => {
      const raw = (wedding as any).weddingDate;
      if (!raw) return "";
      const d = raw instanceof Date ? raw : new Date(raw);
      if (Number.isNaN(d.getTime())) return "";
      return d.toLocaleDateString(pack.locale, { day: "numeric", month: "long", year: "numeric" });
    };

    const toIso = (raw: unknown) => {
      if (!raw) return "";
      const d = raw instanceof Date ? raw : new Date(String(raw));
      if (Number.isNaN(d.getTime())) return "";
      return d.toISOString();
    };

    setLanguage(resolvedLanguage);
    setTemplateId(wedding.templateId || "classic");
    setTexts({
      siteTitle: cfgTexts.siteTitle || wedding.title || "",
      heroTitle: cfgTexts.heroTitle || wedding.title || "",
      heroSubtitle: cfgTexts.heroSubtitle || packTexts.heroSubtitle,
      weddingDate: cfgTexts.weddingDate || formatWeddingDate() || "Prochainement",
      heroCta: cfgTexts.heroCta || pack.texts.heroCta,
      rsvpTitle: cfgTexts.rsvpTitle || packTexts.rsvpTitle,
      rsvpDescription: cfgTexts.rsvpDescription || packTexts.rsvpDescription,
      rsvpButton: cfgTexts.rsvpButton || packTexts.rsvpButton,
      navRsvp: cfgTexts.navRsvp || packTexts.navRsvp,
      navCagnotte: cfgTexts.navCagnotte || packTexts.navCagnotte,
      locationTitle: cfgTexts.locationTitle || packTexts.locationTitle,
      locationDescription: cfgTexts.locationDescription || packTexts.locationDescription,
      accommodationTitle: cfgTexts.accommodationTitle || packTexts.accommodationTitle || "",
      accommodationDescription: cfgTexts.accommodationDescription || packTexts.accommodationDescription || "",
      galleryTitle: cfgTexts.galleryTitle || packTexts.galleryTitle,
      galleryDescription: cfgTexts.galleryDescription || packTexts.galleryDescription,
      programTitle: cfgTexts.programTitle || packTexts.programTitle,
      programDescription: cfgTexts.programDescription || packTexts.programDescription,
      storyTitle: cfgTexts.storyTitle || packTexts.storyTitle,
      storyBody: cfgTexts.storyBody || packTexts.storyBody,
      giftsTitle: cfgTexts.giftsTitle || packTexts.giftsTitle,
      giftsDescription: cfgTexts.giftsDescription || packTexts.giftsDescription,
      cagnotteTitle: cfgTexts.cagnotteTitle || packTexts.cagnotteTitle,
      cagnotteDescription: cfgTexts.cagnotteDescription || packTexts.cagnotteDescription,
      cagnotteBackLabel: cfgTexts.cagnotteBackLabel || packTexts.cagnotteBackLabel,
      cagnotteSubmitLabel: cfgTexts.cagnotteSubmitLabel || packTexts.cagnotteSubmitLabel,
      dressCode: cfgTexts.dressCode || "",
      invitationGreeting: cfgTexts.invitationGreeting || packTexts.invitationGreeting || "",
      invitationPrelude: cfgTexts.invitationPrelude || packTexts.invitationPrelude || "",
      invitationMessage: cfgTexts.invitationMessage || packTexts.invitationMessage || "",
      invitationSubmessage: cfgTexts.invitationSubmessage || packTexts.invitationSubmessage || "",
      invitationCagnotteTitle: cfgTexts.invitationCagnotteTitle || packTexts.invitationCagnotteTitle || "",
      invitationCagnotteDescription: cfgTexts.invitationCagnotteDescription || packTexts.invitationCagnotteDescription || "",
      invitationCagnotteButton: cfgTexts.invitationCagnotteButton || packTexts.invitationCagnotteButton || "",
      invitationDressCode: cfgTexts.invitationDressCode || "",
      invitationFooterNote: cfgTexts.invitationFooterNote || packTexts.invitationFooterNote || "",
    });
    setTheme({
      primaryColor: cfgTheme.primaryColor || "#C8A96A",
      secondaryColor: cfgTheme.secondaryColor || "#FFFDF9",
      fontFamily: cfgTheme.fontFamily || "serif",
      toneId: cfgTheme.toneId || "golden-ivory",
      buttonStyle: cfgTheme.buttonStyle || "solid",
      buttonRadius: cfgTheme.buttonRadius || "pill",
      headerLayout: cfgTheme.headerLayout || "balanced",
      headerSpacing: cfgTheme.headerSpacing || "comfortable",
      headerModel: cfgTheme.headerModel || "model1",
      footerModel: cfgTheme.footerModel || "model1",
      rsvpModel: cfgTheme.rsvpModel || "model1",
    });
    setMedia({
      heroImage: cfgMedia?.heroImage ?? "",
      couplePhoto: cfgMedia?.couplePhoto ?? "",
    });
    setBranding({
      logoUrl: cfgBranding?.logoUrl || "",
      logoText: cfgBranding?.logoText || wedding.title || "",
      logoTextStyle: cfgBranding?.logoTextStyle || "elegant",
    });
    setSections({
      countdownDate: cfgSections?.countdownDate || toIso((wedding as any).weddingDate),
      cagnotteSuggestedAmounts: cfgSections?.cagnotteSuggestedAmounts?.length
        ? cfgSections.cagnotteSuggestedAmounts
        : [20, 50, 100, 150, 200],
      invitationShowDressCode: cfgSections?.invitationShowDressCode ?? true,
      locationItems: cfgSections?.locationItems?.length
        ? cfgSections.locationItems
        : (packSections.locationItems || []).map((item: any) => ({ ...item, accommodations: item.accommodations || [] })),
      programItems: cfgSections?.programItems?.length
        ? cfgSections.programItems
        : (packSections.programItems || []),
      accommodationItems: cfgSections?.accommodationItems?.length
        ? cfgSections.accommodationItems
        : [],
      galleryImages: cfgSections?.galleryImages?.length
        ? cfgSections.galleryImages
        : (cfgMedia?.galleryImages?.length ? cfgMedia.galleryImages : []),
    });
    setPageVisibility({
      rsvp: cfgPages?.rsvp ?? true,
      gifts: cfgPages?.gifts ?? true,
      cagnotte: cfgPages?.cagnotte ?? true,
      story: cfgPages?.story ?? true,
      gallery: cfgPages?.gallery ?? true,
      accommodation: (cfgPages as any)?.accommodation ?? true,
      location: cfgPages?.location ?? true,
      program: cfgPages?.program ?? true,
    });
    const cfgPayments = config.payments || ({} as any);
    setContributionMethods(Array.isArray(cfgPayments.contributionMethods) ? cfgPayments.contributionMethods : []);
  }, [wedding?.id, (wedding as any)?.updatedAt]);

  const translateIfDefault = (current: string, fromDefault: string, toDefault: string) => {
    if (!current || current.trim() === "" || current === fromDefault) return toDefault;
    return current;
  };

  const sameJson = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);

  const applyLanguageChange = (nextLanguage: SiteLanguage) => {
    const previousPack = getSiteLanguagePack(language);
    const nextPack = getSiteLanguagePack(nextLanguage);
    setLanguage(nextLanguage);
    setTexts((prev) => ({
      ...prev,
      heroSubtitle: translateIfDefault(prev.heroSubtitle, previousPack.texts.heroSubtitle, nextPack.texts.heroSubtitle),
      heroCta: translateIfDefault(prev.heroCta, previousPack.texts.heroCta, nextPack.texts.heroCta),
      rsvpTitle: translateIfDefault(prev.rsvpTitle, previousPack.texts.rsvpTitle, nextPack.texts.rsvpTitle),
      rsvpDescription: translateIfDefault(prev.rsvpDescription, previousPack.texts.rsvpDescription, nextPack.texts.rsvpDescription),
      rsvpButton: translateIfDefault(prev.rsvpButton, previousPack.texts.rsvpButton, nextPack.texts.rsvpButton),
      navRsvp: translateIfDefault(prev.navRsvp, previousPack.texts.navRsvp, nextPack.texts.navRsvp),
      navCagnotte: translateIfDefault(prev.navCagnotte, previousPack.texts.navCagnotte, nextPack.texts.navCagnotte),
      locationTitle: translateIfDefault(prev.locationTitle, previousPack.texts.locationTitle, nextPack.texts.locationTitle),
      locationDescription: translateIfDefault(prev.locationDescription, previousPack.texts.locationDescription, nextPack.texts.locationDescription),
      accommodationTitle: translateIfDefault(prev.accommodationTitle, previousPack.texts.accommodationTitle, nextPack.texts.accommodationTitle),
      accommodationDescription: translateIfDefault(prev.accommodationDescription, previousPack.texts.accommodationDescription, nextPack.texts.accommodationDescription),
      galleryTitle: translateIfDefault(prev.galleryTitle, previousPack.texts.galleryTitle, nextPack.texts.galleryTitle),
      galleryDescription: translateIfDefault(prev.galleryDescription, previousPack.texts.galleryDescription, nextPack.texts.galleryDescription),
      programTitle: translateIfDefault(prev.programTitle, previousPack.texts.programTitle, nextPack.texts.programTitle),
      programDescription: translateIfDefault(prev.programDescription, previousPack.texts.programDescription, nextPack.texts.programDescription),
      storyTitle: translateIfDefault(prev.storyTitle, previousPack.texts.storyTitle, nextPack.texts.storyTitle),
      storyBody: translateIfDefault(prev.storyBody, previousPack.texts.storyBody, nextPack.texts.storyBody),
      giftsTitle: translateIfDefault(prev.giftsTitle, previousPack.texts.giftsTitle, nextPack.texts.giftsTitle),
      giftsDescription: translateIfDefault(prev.giftsDescription, previousPack.texts.giftsDescription, nextPack.texts.giftsDescription),
      cagnotteTitle: translateIfDefault(prev.cagnotteTitle, previousPack.texts.cagnotteTitle, nextPack.texts.cagnotteTitle),
      cagnotteDescription: translateIfDefault(prev.cagnotteDescription, previousPack.texts.cagnotteDescription, nextPack.texts.cagnotteDescription),
      cagnotteBackLabel: translateIfDefault(prev.cagnotteBackLabel, previousPack.texts.cagnotteBackLabel, nextPack.texts.cagnotteBackLabel),
      cagnotteSubmitLabel: translateIfDefault(prev.cagnotteSubmitLabel, previousPack.texts.cagnotteSubmitLabel, nextPack.texts.cagnotteSubmitLabel),
      invitationGreeting: translateIfDefault(prev.invitationGreeting, previousPack.texts.invitationGreeting, nextPack.texts.invitationGreeting),
      invitationPrelude: translateIfDefault(prev.invitationPrelude, previousPack.texts.invitationPrelude, nextPack.texts.invitationPrelude),
      invitationMessage: translateIfDefault(prev.invitationMessage, previousPack.texts.invitationMessage, nextPack.texts.invitationMessage),
      invitationSubmessage: translateIfDefault(prev.invitationSubmessage, previousPack.texts.invitationSubmessage, nextPack.texts.invitationSubmessage),
      invitationCagnotteTitle: translateIfDefault(prev.invitationCagnotteTitle, previousPack.texts.invitationCagnotteTitle, nextPack.texts.invitationCagnotteTitle),
      invitationCagnotteDescription: translateIfDefault(prev.invitationCagnotteDescription, previousPack.texts.invitationCagnotteDescription, nextPack.texts.invitationCagnotteDescription),
      invitationCagnotteButton: translateIfDefault(prev.invitationCagnotteButton, previousPack.texts.invitationCagnotteButton, nextPack.texts.invitationCagnotteButton),
      invitationFooterNote: translateIfDefault(prev.invitationFooterNote, previousPack.texts.invitationFooterNote, nextPack.texts.invitationFooterNote),
    }));
    setSections((prev) => ({
      ...prev,
      locationItems: sameJson(prev.locationItems, (previousPack.sections as any).locationItems)
        ? (((nextPack.sections as any).locationItems || []) as any[]).map((item) => ({ ...item, accommodations: item.accommodations || [] }))
        : prev.locationItems,
      programItems: sameJson(prev.programItems, (previousPack.sections as any).programItems)
        ? (((nextPack.sections as any).programItems || []) as DesignProgramItem[])
        : prev.programItems,
    }));
  };

  const saveLanguageSelection = async (nextLanguage: SiteLanguage) => {
    if (!wedding) return;
    applyLanguageChange(nextLanguage);
    try {
      await updateWedding.mutateAsync({
        id: wedding.id,
        config: {
          ...wedding.config,
          language: nextLanguage,
        },
      });
      setPreviewToken(Date.now());
    } catch (error: any) {
      toast({
        title: nextLanguage === "en" ? "Language not changed" : "Langue non modifiée",
        description:
          error?.message ||
          (nextLanguage === "en"
            ? "We could not update the site language right now."
            : "Impossible de mettre à jour la langue du site pour le moment."),
        variant: "destructive",
      });
    }
  };

  const saveThemePatch = async (patch: Record<string, string>) => {
    if (!wedding) return;
    const nextTheme = { ...theme, ...patch };
    setTheme(nextTheme);
    try {
      await updateWedding.mutateAsync({
        id: wedding.id,
        config: {
          ...wedding.config,
          theme: {
            ...wedding.config.theme,
            ...nextTheme,
          },
        },
      });
      setPreviewToken(Date.now());
    } catch (error: any) {
      toast({
        title: language === "en" ? "Change not saved" : "Changement non enregistré",
        description:
          error?.message ||
          (language === "en"
            ? "We could not save this option right now."
            : "Impossible d'enregistrer ce réglage pour le moment."),
        variant: "destructive",
      });
    }
  };

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
    const appBase = typeof window !== "undefined" ? window.location.origin : "https://daylora.app";
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
            title: language === "en" ? "Logo too large" : "Logo trop volumineux",
            description: language === "en" ? "The logo is too heavy. Upload a lighter image." : "Le logo est trop lourd. Importez une image plus légère.",
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
            title: language === "en" ? "Image too large" : "Image trop volumineuse",
            description: language === "en" ? `The "${field.key}" image is too heavy. Upload a lighter image.` : `L'image "${field.key}" est trop lourde. Importez une image plus légère.`,
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
          language,
          texts: {
            ...wedding.config.texts,
            ...texts,
          },
          navigation: {
            ...(wedding.config.navigation || {}),
            pages: {
              ...(wedding.config.navigation?.pages || {}),
              ...pageVisibility,
            },
            menuItems: (wedding.config.navigation?.menuItems || []).filter((item) => item.id !== "live"),
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
          payments: {
            ...wedding.config.payments,
            contributionMethods,
          },
        },
      });
      setPreviewToken(Date.now());
      toast({
        title: language === "en" ? "Design updated" : "Design mis à jour",
        description: language === "en" ? "Your changes are saved and visible in the preview." : "Les modifications sont enregistrées et visibles dans l'aperçu.",
      });
    } catch (error: any) {
      toast({
        title: language === "en" ? "Could not save" : "Enregistrement impossible",
        description: error?.message || (language === "en" ? "We could not save your design right now." : "Impossible d'enregistrer le design pour le moment."),
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const applyTemplate = async (nextTemplateId?: string) => {
    const selectedTemplateId = nextTemplateId || templateId;
    if (!selectedTemplateId) return;
    setIsApplyingTemplate(true);
    try {
      await updateWedding.mutateAsync({
        id: wedding.id,
        templateId: selectedTemplateId,
      });
      setPreviewToken(Date.now());
      toast({
        title: language === "en" ? "Style updated" : "Modèle mis à jour",
        description: language === "en" ? "The visual style has been updated." : "Le style visuel a bien été mis à jour.",
      });
    } catch (_error) {
      toast({
        title: language === "en" ? "Action unavailable" : "Action impossible",
        description: language === "en" ? "The template could not be applied." : "Impossible d'appliquer le template.",
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
        title: language === "en" ? "Image too large" : "Image trop lourde",
        description: language === "en" ? "The file must be under 6 MB." : "Le fichier doit faire moins de 6 Mo.",
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
            title: language === "en" ? "Logo too large" : "Logo trop lourd",
            description: language === "en" ? "Try a lighter logo." : "Essayez un logo plus simple.",
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
        title: language === "en" ? "Image too large" : "Image trop lourde",
        description: language === "en" ? "The file must be under 10 MB." : "Le fichier doit faire moins de 10 Mo.",
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
        title: language === "en" ? "Image too large" : "Image trop volumineuse",
        description: language === "en" ? "Upload a lighter image." : "Importez une image plus légère.",
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
        title: language === "en" ? "Upload failed" : "Import impossible",
        description: language === "en" ? "The image could not be uploaded." : "Impossible d'importer l'image.",
        variant: "destructive",
      });
    }
  };

  const handleGalleryUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (!files.length) return;

    const remaining = Math.max(0, MAX_GALLERY_IMAGES - sections.galleryImages.length);
    if (remaining <= 0) {
      toast({
        title: language === "en" ? "Gallery full" : "Galerie complète",
        description: language === "en" ? `You can add up to ${MAX_GALLERY_IMAGES} photos.` : `Vous pouvez ajouter jusqu'à ${MAX_GALLERY_IMAGES} photos.`,
        variant: "destructive",
      });
      return;
    }

    try {
      const selected = files.slice(0, remaining);
      const nextImages: string[] = [];

      for (const file of selected) {
        const compressed = await compressImageFile(file, {
          maxSize: 1200,
          quality: 0.82,
          maxDataUrlLength: MAX_GALLERY_IMAGE_DATA_URL_LENGTH,
        });
        if (compressed) nextImages.push(compressed);
      }

      if (nextImages.length) {
        setSections((prev) => ({
          ...prev,
          galleryImages: [...prev.galleryImages, ...nextImages].slice(0, MAX_GALLERY_IMAGES),
        }));
      }
    } catch {
      toast({
        title: language === "en" ? "Upload failed" : "Import impossible",
        description: language === "en" ? "These photos could not be added to the gallery." : "Impossible d'ajouter ces photos à la galerie.",
        variant: "destructive",
      });
    } finally {
      event.target.value = "";
    }
  };

  return (
    <div className="h-[calc(100vh-64px)] w-full flex flex-col">
      <div className="px-4 md:px-8 pt-4 md:pt-6 pb-3 md:pb-4 border-b bg-background/80 backdrop-blur flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-xl md:text-2xl font-serif font-bold text-foreground">{ui.title}</h1>
          <p className="text-muted-foreground text-xs md:text-sm">{ui.description}</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Button variant="outline" size="sm" asChild>
            <Link href={`~/${weddingId}/dashboard`}>{ui.back}</Link>
          </Button>
          <Button variant="outline" size="sm" asChild data-tour="design-preview">
            <a href={previewUrl} target="_blank" rel="noopener noreferrer">{ui.preview}</a>
          </Button>
        </div>
      </div>

      <div className="flex-1 min-h-0 grid grid-cols-1 xl:grid-cols-[460px_1fr]">
        <aside className="min-h-0 overflow-y-auto border-r bg-white" data-tour="design-edit-panel">
          <div className="p-6 space-y-4">
            <div className="text-xs uppercase tracking-[0.3em] text-muted-foreground">{ui.siteSettings}</div>
            <Accordion type="multiple" defaultValue={["template", "branding", "colors", "hero"]} className="w-full">
              <AccordionItem value="language" className="border rounded-xl px-4 mb-4">
                <AccordionTrigger className="hover:no-underline">{ui.siteLanguage}</AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-3">
                    <div className="text-xs text-muted-foreground">
                      {ui.siteLanguageDesc}
                    </div>
                    <Select
                      value={language}
                      onValueChange={(value) => {
                        void saveLanguageSelection((value === "en" ? "en" : "fr") as SiteLanguage);
                      }}
                    >
                      <SelectTrigger className="h-10 rounded-xl border-border/70 bg-white/90 text-sm shadow-sm">
                        <SelectValue placeholder={ui.siteLanguage} />
                      </SelectTrigger>
                      <SelectContent className="rounded-2xl border-border/70 bg-white/95 p-2 shadow-2xl backdrop-blur-sm">
                        <SelectItem value="fr" className="rounded-xl text-sm font-medium">
                          Français
                        </SelectItem>
                        <SelectItem value="en" className="rounded-xl text-sm font-medium">
                          English
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="template" className="border rounded-xl px-4 mb-4">
                <AccordionTrigger className="hover:no-underline">{ui.template}</AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-3">
                    <div className="text-xs text-muted-foreground">{ui.templateDesc}</div>
                    <Select value={templateId} onValueChange={(value) => {
                      const tmpl = TEMPLATES.find(t => t.id === value);
                      if (tmpl?.premium && wedding.currentPlan !== "premium") return;
                      setTemplateId(value);
                      void applyTemplate(value);
                    }}>
                      <SelectTrigger className="h-10">
                        <SelectValue placeholder={ui.chooseTemplate} />
                      </SelectTrigger>
                      <SelectContent>
                        {TEMPLATES.map((tmpl) => {
                          const locked = tmpl.premium && wedding.currentPlan !== "premium";
                          return (
                            <SelectItem key={tmpl.id} value={tmpl.id} disabled={locked}>
                              {templateLabels[tmpl.id] || tmpl.name}{locked ? ` 🔒 ${ui.premiumSuffix}` : ""}
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                    <p className="text-[11px] text-muted-foreground">
                      {language === "en"
                        ? "The new template is applied as soon as you choose it."
                        : "Le nouveau template est appliqué dès que vous le choisissez."}
                    </p>
                  </div>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="header" className="border rounded-xl px-4 mb-4">
                <AccordionTrigger className="hover:no-underline">
                  {language === "en" ? "Top of the page" : "Haut de page"}
                </AccordionTrigger>
                <AccordionContent>
                  <PremiumAccessGate
                    isPremium={wedding.currentPlan === "premium"}
                    featureName={language === "en" ? "top-of-page customization" : "la personnalisation du haut de page"}
                    description={
                      language === "en"
                        ? "Adjust the top menu and the space before the main content for a more polished premium look."
                        : "Ajustez le menu du haut et l'espace avant le contenu principal pour un rendu plus élégant."
                    }
                  >
                    <div className="space-y-4">
                      <div className="text-xs text-muted-foreground">
                        {language === "en"
                          ? "Use these settings if the top of the page feels too tight or if you want a different layout."
                          : "Utilisez ces réglages si le haut du site paraît trop serré ou si vous voulez une autre présentation."}
                      </div>

                      {(templateId === "classic" || templateId === "minimal" || templateId === "modern") && (
                        <div className="space-y-2">
                          <label className="text-xs font-medium">
                            {language === "en" ? "Top area layout" : "Organisation du haut de page"}
                          </label>
                          <Select
                            value={theme.headerLayout}
                            onValueChange={(value) => {
                              void saveThemePatch({ headerLayout: value });
                            }}
                          >
                            <SelectTrigger className="h-10 rounded-xl border-border/70 bg-white/90 text-sm shadow-sm">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="rounded-2xl border-border/70 bg-white/95 p-2 shadow-2xl backdrop-blur-sm">
                              <SelectItem value="balanced" className="rounded-xl text-sm font-medium">
                                {headerLayoutLabels.balanced}
                              </SelectItem>
                              <SelectItem value="centered" className="rounded-xl text-sm font-medium">
                                {headerLayoutLabels.centered}
                              </SelectItem>
                            </SelectContent>
                          </Select>
                          <p className="text-[11px] text-muted-foreground">
                            {language === "en"
                              ? "Choose how the logo and menu are placed at the top of the page."
                              : "Choisissez comment le logo et le menu sont placés en haut de la page."}
                          </p>
                        </div>
                      )}

                      <div className="space-y-2">
                        <label className="text-xs font-medium">
                          {language === "en" ? "Space before the content" : "Espace avant le contenu"}
                        </label>
                        <Select
                          value={theme.headerSpacing}
                          onValueChange={(value) => {
                            void saveThemePatch({ headerSpacing: value });
                          }}
                        >
                          <SelectTrigger className="h-10 rounded-xl border-border/70 bg-white/90 text-sm shadow-sm">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="rounded-2xl border-border/70 bg-white/95 p-2 shadow-2xl backdrop-blur-sm">
                            <SelectItem value="compact" className="rounded-xl text-sm font-medium">
                              {headerSpacingLabels.compact}
                            </SelectItem>
                            <SelectItem value="comfortable" className="rounded-xl text-sm font-medium">
                              {headerSpacingLabels.comfortable}
                            </SelectItem>
                            <SelectItem value="airy" className="rounded-xl text-sm font-medium">
                              {headerSpacingLabels.airy}
                            </SelectItem>
                          </SelectContent>
                        </Select>
                        <p className="text-[11px] text-muted-foreground">
                          {language === "en"
                            ? "Increase this if the first block starts too close to the top menu."
                            : "Augmentez cet espace si le premier bloc démarre trop près du menu du haut."}
                        </p>
                      </div>
                    </div>
                  </PremiumAccessGate>
                </AccordionContent>
              </AccordionItem>

              {templateId === "avantgarde" && (
                <AccordionItem value="models" className="border rounded-xl px-4 mb-4">
                  <AccordionTrigger className="hover:no-underline">{componentLabels.componentsSection}</AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-4">
                      <div className="text-xs text-muted-foreground">{componentLabels.componentsSectionDesc}</div>
                      
                      <div className="space-y-2">
                         <label className="text-xs font-medium">{componentLabels.headerStyle}</label>
                         <Select value={theme.headerModel} onValueChange={(v) => { void saveThemePatch({ headerModel: v }); }}>
                            <SelectTrigger className="h-10 rounded-xl border-border/70"><SelectValue /></SelectTrigger>
                            <SelectContent className="rounded-2xl border-border/70">
                               <SelectItem value="model1" className="rounded-xl">{componentLabels.headerModel1}</SelectItem>
                               <SelectItem value="model2" className="rounded-xl">{componentLabels.headerModel2}</SelectItem>
                               <SelectItem value="model3" className="rounded-xl">{componentLabels.headerModel3}</SelectItem>
                            </SelectContent>
                         </Select>
                         <p className="text-[11px] text-muted-foreground">{componentLabels.headerStyleHint}</p>
                      </div>

                      <div className="space-y-2">
                         <label className="text-xs font-medium">{componentLabels.rsvpStyle}</label>
                         <Select value={theme.rsvpModel} onValueChange={(v) => { void saveThemePatch({ rsvpModel: v }); }}>
                            <SelectTrigger className="h-10 rounded-xl border-border/70"><SelectValue /></SelectTrigger>
                            <SelectContent className="rounded-2xl border-border/70">
                               <SelectItem value="model1" className="rounded-xl">{componentLabels.rsvpModel1}</SelectItem>
                               <SelectItem value="model2" className="rounded-xl">{componentLabels.rsvpModel2}</SelectItem>
                               <SelectItem value="model3" className="rounded-xl">{componentLabels.rsvpModel3}</SelectItem>
                            </SelectContent>
                         </Select>
                         <p className="text-[11px] text-muted-foreground">{componentLabels.rsvpStyleHint}</p>
                      </div>

                      <div className="space-y-2">
                         <label className="text-xs font-medium">{componentLabels.footerStyle}</label>
                         <Select value={theme.footerModel} onValueChange={(v) => { void saveThemePatch({ footerModel: v }); }}>
                            <SelectTrigger className="h-10 rounded-xl border-border/70"><SelectValue /></SelectTrigger>
                            <SelectContent className="rounded-2xl border-border/70">
                               <SelectItem value="model1" className="rounded-xl">{componentLabels.footerModel1}</SelectItem>
                               <SelectItem value="model2" className="rounded-xl">{componentLabels.footerModel2}</SelectItem>
                               <SelectItem value="model3" className="rounded-xl">{componentLabels.footerModel3}</SelectItem>
                            </SelectContent>
                         </Select>
                         <p className="text-[11px] text-muted-foreground">{componentLabels.footerStyleHint}</p>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              )}

              <AccordionItem value="branding" className="border rounded-xl px-4 mb-4">
                <AccordionTrigger className="hover:no-underline">{ui.logo}</AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-3">
                    <div className="text-xs text-muted-foreground">{ui.logoDesc}</div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setBranding((prev) => ({ ...prev, logoUrl: "" }))}
                        disabled={!branding.logoUrl}
                      >
                        {ui.removeLogo}
                      </Button>
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-medium">{ui.uploadLogo}</label>
                      <Input type="file" accept="image/*" onChange={handleLogoUpload} />
                      {branding.logoUrl ? (
                        <div className="mt-2 flex items-center gap-3">
                          <img src={branding.logoUrl} alt={ui.logo} className="h-12 w-12 rounded-lg object-cover border" />
                          <span className="text-xs text-muted-foreground">{ui.logoPreview}</span>
                        </div>
                      ) : null}
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-medium">{ui.logoFallback}</label>
                      <Input
                        value={branding.logoText}
                        onChange={(e) => setBranding({ ...branding, logoText: e.target.value })}
                        placeholder={ui.logoFallbackPlaceholder}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-medium">{ui.logoStyle}</label>
                      <Select
                        value={branding.logoTextStyle}
                        onValueChange={(value) => setBranding((prev) => ({ ...prev, logoTextStyle: value }))}
                      >
                        <SelectTrigger className="h-10 rounded-xl border-border/70 bg-white/90 text-sm shadow-sm">
                          <SelectValue placeholder={ui.logoStyle} />
                        </SelectTrigger>
                        <SelectContent className="rounded-2xl border-border/70 bg-white/95 p-2 shadow-2xl backdrop-blur-sm">
                          {LOGO_TEXT_STYLE_OPTIONS.map((option) => (
                            <SelectItem
                              key={option.id}
                              value={option.id}
                              className="rounded-xl text-sm font-medium"
                            >
                              {logoStyleLabels[option.id] || option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="rounded-xl border bg-card px-4 py-3">
                      <div className="text-xs font-medium text-muted-foreground mb-1">{ui.previewCard}</div>
                      <div className={getLogoTextWrapperClassName(branding.logoTextStyle)} style={{ color: "var(--wedding-text-dark)" }}>
                        <div className={getLogoTextClassName(branding.logoTextStyle)}>{branding.logoText || "A & M"}</div>
                      </div>
                    </div>
                    <Button onClick={saveDesign} disabled={isSaving} size="sm" className="w-full mt-2">
                      {isSaving ? ui.saving : ui.save}
                    </Button>
                  </div>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="colors" className="border rounded-xl px-4 mb-4">
                <AccordionTrigger className="hover:no-underline">{ui.colors}</AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-4">
                    <div className="text-xs text-muted-foreground">{ui.colorsDesc}</div>
                    <div className="space-y-2">
                      <label className="text-xs font-medium">{ui.colorPalette}</label>
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
                              <span className="text-xs font-semibold">{(language === "en"
                                ? {
                                    "daylora-signature": "Daylora Signature",
                                    "golden-ivory": "Gold & Ivory",
                                    "rose-sunset": "Rose Sunset",
                                    "sage-olive": "Sage & Olive",
                                    "ocean-pearl": "Ocean Pearl",
                                  }[tone.id]
                                : tone.name) || tone.name}</span>
                            </div>
                            <div className="text-[11px] text-muted-foreground">{(language === "en"
                              ? {
                                  "daylora-signature": "Premium, timeless and warm.",
                                  "golden-ivory": "Elegant, bright and timeless.",
                                  "rose-sunset": "Romantic and warm.",
                                  "sage-olive": "Natural and refined.",
                                  "ocean-pearl": "Modern, fresh and premium.",
                                }[tone.id]
                              : tone.description) || tone.description}</div>
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <label className="text-xs font-medium">{ui.primary}</label>
                        <Input
                          type="color"
                          value={theme.primaryColor}
                          onChange={(e) => setTheme({ ...theme, toneId: "custom", primaryColor: e.target.value })}
                          className="h-10 p-1"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-medium">{ui.secondary}</label>
                        <Input
                          type="color"
                          value={theme.secondaryColor}
                          onChange={(e) => setTheme({ ...theme, toneId: "custom", secondaryColor: e.target.value })}
                          className="h-10 p-1"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-medium">{ui.fontFamily}</label>
                      <Select
                        value={theme.fontFamily}
                        onValueChange={(value) => setTheme({ ...theme, fontFamily: value })}
                      >
                        <SelectTrigger className="h-10 rounded-xl border-border/70 bg-white/90 text-sm shadow-sm">
                          <SelectValue placeholder={ui.fontFamily} />
                        </SelectTrigger>
                        <SelectContent className="rounded-2xl border-border/70 bg-white/95 p-2 shadow-2xl backdrop-blur-sm">
                          {FONT_PROFILE_OPTIONS.map((option) => (
                            <SelectItem
                              key={option.id}
                              value={option.id}
                              className="rounded-xl text-sm font-medium"
                            >
                              {language === "en"
                                ? {
                                    serif: "Playfair & Manrope",
                                    sans: "Modern Manrope",
                                    editorial: "Editorial chic",
                                    romantic: "Romantic",
                                    contemporary: "Contemporary",
                                  }[option.id] || option.label
                                : option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <p className="text-[11px] text-muted-foreground">
                        {language === "en"
                          ? {
                              serif: "Elegant and timeless",
                              sans: "Clean and simple",
                              editorial: "Refined and premium",
                              romantic: "Soft and ceremonial",
                              contemporary: "Editorial and dynamic",
                            }[theme.fontFamily] || resolveFontProfile(theme.fontFamily).description
                          : resolveFontProfile(theme.fontFamily).description}
                      </p>
                      <div className="rounded-xl border bg-card px-4 py-3 space-y-1">
                        <div className={`text-xl ${resolveFontProfile(theme.fontFamily).baseClass}`}>Marie & Antoine</div>
                        <div className="text-sm text-muted-foreground">{ui.fontPreview}</div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-2">
                      <label className="text-xs font-medium">{ui.buttonStyle}</label>
                        <Select
                          value={theme.buttonStyle}
                          onValueChange={(value) => setTheme({ ...theme, buttonStyle: value })}
                        >
                          <SelectTrigger className="h-10 rounded-xl border-border/70 bg-white/90 text-sm shadow-sm">
                            <SelectValue placeholder={ui.buttonStyle} />
                          </SelectTrigger>
                          <SelectContent className="rounded-2xl border-border/70 bg-white/95 p-2 shadow-2xl backdrop-blur-sm">
                            {BUTTON_STYLE_OPTIONS.map((option) => (
                              <SelectItem
                                key={option.id}
                                value={option.id}
                                className="rounded-xl text-sm font-medium"
                              >
                                {buttonStyleLabels[option.id] || option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                      <label className="text-xs font-medium">{ui.buttonShape}</label>
                        <Select
                          value={theme.buttonRadius}
                          onValueChange={(value) => setTheme({ ...theme, buttonRadius: value })}
                        >
                          <SelectTrigger className="h-10 rounded-xl border-border/70 bg-white/90 text-sm shadow-sm">
                            <SelectValue placeholder={ui.buttonShape} />
                          </SelectTrigger>
                          <SelectContent className="rounded-2xl border-border/70 bg-white/95 p-2 shadow-2xl backdrop-blur-sm">
                            {BUTTON_RADIUS_OPTIONS.map((option) => (
                              <SelectItem
                                key={option.id}
                                value={option.id}
                                className="rounded-xl text-sm font-medium"
                              >
                                {buttonRadiusLabels[option.id] || option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <Button onClick={saveDesign} disabled={isSaving} size="sm" className="w-full mt-2">
                      {isSaving ? ui.saving : ui.save}
                    </Button>
                  </div>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="images" className="border rounded-xl px-4 mb-4">
                <AccordionTrigger className="hover:no-underline">{ui.photos}</AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-3">
                    <div className="space-y-2">
                      <label className="text-xs font-medium">{ui.homePhoto}</label>
                      <div className="flex items-center gap-2">
                        <Input type="file" accept="image/*" onChange={handleMediaUpload("heroImage")} />
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setMedia((prev) => ({ ...prev, heroImage: "" }))}
                          disabled={!media.heroImage}
                        >
                          {ui.remove}
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
                      <label className="text-xs font-medium">{ui.couplePhoto}</label>
                      <div className="flex items-center gap-2">
                        <Input type="file" accept="image/*" onChange={handleMediaUpload("couplePhoto")} />
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setMedia((prev) => ({ ...prev, couplePhoto: "" }))}
                          disabled={!media.couplePhoto}
                        >
                          {ui.remove}
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
                    <Button onClick={saveDesign} disabled={isSaving} size="sm" className="w-full mt-2">
                      {isSaving ? ui.saving : ui.save}
                    </Button>
                  </div>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="hero" className="border rounded-xl px-4 mb-4">
                <AccordionTrigger className="hover:no-underline">{ui.home}</AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-3">
                    <div className="text-xs text-muted-foreground">{ui.homeDesc}</div>
                    <div className="space-y-2">
                      <label className="text-xs font-medium">{ui.siteTitle}</label>
                      <Input value={texts.siteTitle} onChange={(e) => setTexts({ ...texts, siteTitle: e.target.value })} />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-medium">{ui.titleLabel}</label>
                      <Input value={texts.heroTitle} onChange={(e) => setTexts({ ...texts, heroTitle: e.target.value })} />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-medium">{ui.subtitle}</label>
                      <Input value={texts.heroSubtitle} onChange={(e) => setTexts({ ...texts, heroSubtitle: e.target.value })} />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-medium">{ui.heroButton}</label>
                      <Input value={texts.heroCta} onChange={(e) => setTexts({ ...texts, heroCta: e.target.value })} />
                    </div>
                    <Button onClick={saveDesign} disabled={isSaving} size="sm" className="w-full mt-2">
                      {isSaving ? ui.saving : ui.save}
                    </Button>
                  </div>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="dates" className="border rounded-xl px-4 mb-4">
                <AccordionTrigger className="hover:no-underline">{ui.dateCountdown}</AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-3">
                    <div className="space-y-2">
                      <label className="text-xs font-medium">{ui.displayedDateText}</label>
                      <Input value={texts.weddingDate} onChange={(e) => setTexts({ ...texts, weddingDate: e.target.value })} />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-medium">{ui.countdownDate}</label>
                      <Input
                        type="datetime-local"
                        value={toDateInputValue(sections.countdownDate)}
                        onChange={(e) => setSections((prev) => ({ ...prev, countdownDate: fromDateInputValue(e.target.value) }))}
                      />
                      <p className="text-[11px] text-muted-foreground">{ui.countdownHint}</p>
                    </div>
                    <Button onClick={saveDesign} disabled={isSaving} size="sm" className="w-full mt-2">
                      {isSaving ? ui.saving : ui.save}
                    </Button>
                  </div>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="rsvp" className="border rounded-xl px-4 mb-4">
                <AccordionTrigger className="hover:no-underline">RSVP</AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between rounded-xl border bg-card px-3 py-2">
                      <div>
                        <div className="text-sm font-medium">{ui.showSection}</div>
                        <p className="text-xs text-muted-foreground">{ui.rsvpVisibility}</p>
                      </div>
                      <Switch
                        checked={pageVisibility.rsvp}
                        onCheckedChange={(checked) => setPageVisibility((prev) => ({ ...prev, rsvp: checked }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-medium">{ui.titleLabel}</label>
                      <Input value={texts.rsvpTitle} onChange={(e) => setTexts({ ...texts, rsvpTitle: e.target.value })} />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-medium">{ui.descriptionLabel}</label>
                      <Textarea rows={3} value={texts.rsvpDescription} onChange={(e) => setTexts({ ...texts, rsvpDescription: e.target.value })} />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-medium">{ui.rsvpButton}</label>
                      <Input value={texts.rsvpButton} onChange={(e) => setTexts({ ...texts, rsvpButton: e.target.value })} />
                    </div>
                    <Button onClick={saveDesign} disabled={isSaving} size="sm" className="w-full mt-2">
                      {isSaving ? ui.saving : ui.save}
                    </Button>
                  </div>
                </AccordionContent>
              </AccordionItem>

              <div className="pt-2">
                <div className="border-t border-border/70 pt-4 text-xs uppercase tracking-[0.3em] text-muted-foreground">
                  {ui.siteBlocks}
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  {ui.siteBlocksDesc}
                </p>
              </div>

              <AccordionItem value="gifts" className="border rounded-xl px-4 mb-4">
                <AccordionTrigger className="hover:no-underline">{ui.gifts}</AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between rounded-xl border bg-card px-3 py-2">
                      <div>
                        <div className="text-sm font-medium">{ui.showSection}</div>
                        <p className="text-xs text-muted-foreground">{ui.giftsVisibility}</p>
                      </div>
                      <Switch
                        checked={pageVisibility.gifts}
                        onCheckedChange={(checked) => setPageVisibility((prev) => ({ ...prev, gifts: checked }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-medium">{ui.titleLabel}</label>
                      <Input value={texts.giftsTitle} onChange={(e) => setTexts({ ...texts, giftsTitle: e.target.value })} />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-medium">{ui.introText}</label>
                      <Textarea rows={3} value={texts.giftsDescription} onChange={(e) => setTexts({ ...texts, giftsDescription: e.target.value })} />
                    </div>
                    <div className="rounded-xl border bg-card p-4 space-y-2">
                      <div className="text-sm font-medium">{ui.giftList}</div>
                      <p className="text-xs text-muted-foreground">
                        {ui.giftsManagedElsewhere}
                      </p>
                      <Button variant="outline" size="sm" asChild>
                        <Link href="/gifts">{ui.openGiftsPage}</Link>
                      </Button>
                    </div>
                    <Button onClick={saveDesign} disabled={isSaving} size="sm" className="w-full mt-2">
                      {isSaving ? ui.saving : ui.save}
                    </Button>
                  </div>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="story" className="border rounded-xl px-4 mb-4">
                <AccordionTrigger className="hover:no-underline">{ui.story}</AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between rounded-xl border bg-card px-3 py-2">
                      <div>
                        <div className="text-sm font-medium">{ui.showSection}</div>
                        <p className="text-xs text-muted-foreground">{ui.storyVisibility}</p>
                      </div>
                      <Switch
                        checked={pageVisibility.story}
                        onCheckedChange={(checked) => setPageVisibility((prev) => ({ ...prev, story: checked }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-medium">{ui.titleLabel}</label>
                      <Input value={texts.storyTitle} onChange={(e) => setTexts({ ...texts, storyTitle: e.target.value })} />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-medium">{ui.textLabel}</label>
                      <Textarea rows={4} value={texts.storyBody} onChange={(e) => setTexts({ ...texts, storyBody: e.target.value })} />
                    </div>
                    <Button onClick={saveDesign} disabled={isSaving} size="sm" className="w-full mt-2">
                      {isSaving ? ui.saving : ui.save}
                    </Button>
                  </div>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="gallery" className="border rounded-xl px-4 mb-4">
                <AccordionTrigger className="hover:no-underline">{ui.gallery}</AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between rounded-xl border bg-card px-3 py-2">
                      <div>
                        <div className="text-sm font-medium">{ui.showSection}</div>
                        <p className="text-xs text-muted-foreground">{ui.galleryVisibility}</p>
                      </div>
                      <Switch
                        checked={pageVisibility.gallery}
                        onCheckedChange={(checked) => setPageVisibility((prev) => ({ ...prev, gallery: checked }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-medium">{ui.titleLabel}</label>
                      <Input value={texts.galleryTitle} onChange={(e) => setTexts({ ...texts, galleryTitle: e.target.value })} />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-medium">{ui.introText}</label>
                      <Textarea rows={3} value={texts.galleryDescription} onChange={(e) => setTexts({ ...texts, galleryDescription: e.target.value })} />
                    </div>
                    <div className="rounded-xl border bg-card p-4 space-y-3">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <div className="text-sm font-medium">{ui.galleryPhotos}</div>
                          <p className="text-xs text-muted-foreground">
                            {ui.galleryPhotosHint.replace("{count}", String(MAX_GALLERY_IMAGES))}
                          </p>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {sections.galleryImages.length}/{MAX_GALLERY_IMAGES}
                        </div>
                      </div>
                      <Input type="file" accept="image/*" multiple onChange={handleGalleryUpload} />
                      {sections.galleryImages.length > 0 ? (
                        <div className="grid grid-cols-2 gap-3">
                          {sections.galleryImages.map((src, idx) => (
                            <div key={`${src.slice(0, 24)}-${idx}`} className="rounded-lg border overflow-hidden bg-white">
                              <div className="aspect-square">
                                <img src={src} alt={`Galerie ${idx + 1}`} className="h-full w-full object-cover" />
                              </div>
                              <div className="p-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="w-full"
                                  onClick={() =>
                                    setSections((prev) => ({
                                      ...prev,
                                      galleryImages: prev.galleryImages.filter((_, imageIdx) => imageIdx !== idx),
                                    }))
                                  }
                                >
                                  {ui.remove}
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="rounded-lg border border-dashed px-4 py-5 text-sm text-muted-foreground">
                          {ui.noGalleryPhotos}
                        </div>
                      )}
                    </div>
                    <Button onClick={saveDesign} disabled={isSaving} size="sm" className="w-full mt-2">
                      {isSaving ? ui.saving : ui.save}
                    </Button>
                  </div>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="accommodation" className="border rounded-xl px-4 mb-4">
                <AccordionTrigger className="hover:no-underline">{ui.nearbyStay}</AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between rounded-xl border bg-card px-3 py-2">
                      <div>
                        <div className="text-sm font-medium">{ui.showSection}</div>
                        <p className="text-xs text-muted-foreground">{ui.accommodationVisibility}</p>
                      </div>
                      <Switch
                        checked={pageVisibility.accommodation}
                        onCheckedChange={(checked) => setPageVisibility((prev) => ({ ...prev, accommodation: checked }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-medium">{ui.titleLabel}</label>
                      <Input value={texts.accommodationTitle} onChange={(e) => setTexts({ ...texts, accommodationTitle: e.target.value })} />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-medium">{ui.introText}</label>
                      <Textarea rows={3} value={texts.accommodationDescription} onChange={(e) => setTexts({ ...texts, accommodationDescription: e.target.value })} />
                    </div>
                    <div className="space-y-3">
                      {sections.accommodationItems.map((item, idx) => (
                        <div key={`accommodation-item-${idx}`} className="rounded-lg border border-border p-3 space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold">{ui.addressItem.replace("{index}", String(idx + 1))}</span>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                setSections((prev) => ({
                                  ...prev,
                                  accommodationItems: prev.accommodationItems.filter((_, i) => i !== idx),
                                }))
                              }
                            >
                              {ui.remove}
                            </Button>
                          </div>
                          <Input
                            value={item.name}
                            onChange={(e) =>
                              setSections((prev) => {
                                const items = [...prev.accommodationItems];
                                items[idx] = { ...items[idx], name: e.target.value };
                                return { ...prev, accommodationItems: items };
                              })
                            }
                            placeholder={ui.accommodationNamePlaceholder}
                          />
                          <Input
                            value={item.address}
                            onChange={(e) =>
                              setSections((prev) => {
                                const items = [...prev.accommodationItems];
                                items[idx] = { ...items[idx], address: e.target.value };
                                return { ...prev, accommodationItems: items };
                              })
                            }
                            placeholder={ui.fullAddressPlaceholder}
                          />
                          <Input
                            value={item.url}
                            onChange={(e) =>
                              setSections((prev) => {
                                const items = [...prev.accommodationItems];
                                items[idx] = { ...items[idx], url: e.target.value };
                                return { ...prev, accommodationItems: items };
                              })
                            }
                            placeholder={ui.bookingLinkPlaceholder}
                          />
                        </div>
                      ))}
                    </div>
                    <Button
                      variant="outline"
                      onClick={() =>
                        setSections((prev) => ({
                          ...prev,
                          accommodationItems: [...prev.accommodationItems, { name: "", address: "", url: "" }],
                        }))
                      }
                    >
                      {ui.addAddress}
                    </Button>
                    <Button onClick={saveDesign} disabled={isSaving} size="sm" className="w-full mt-2">
                      {isSaving ? ui.saving : ui.save}
                    </Button>
                  </div>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="location-items" className="border rounded-xl px-4 mb-4">
                <AccordionTrigger className="hover:no-underline">{ui.locations}</AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between rounded-xl border bg-card px-3 py-2">
                      <div>
                        <div className="text-sm font-medium">{ui.showSection}</div>
                        <p className="text-xs text-muted-foreground">{ui.locationsVisibility}</p>
                      </div>
                      <Switch
                        checked={pageVisibility.location}
                        onCheckedChange={(checked) => setPageVisibility((prev) => ({ ...prev, location: checked }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-medium">{ui.titleLabel}</label>
                      <Input value={texts.locationTitle} onChange={(e) => setTexts({ ...texts, locationTitle: e.target.value })} />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-medium">{ui.introText}</label>
                      <Textarea rows={2} value={texts.locationDescription} onChange={(e) => setTexts({ ...texts, locationDescription: e.target.value })} />
                    </div>
                    {sections.locationItems.map((item, idx) => (
                      <div key={`${item.title}-${idx}`} className="rounded-lg border border-border p-3 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-semibold">{ui.locationItem.replace("{index}", String(idx + 1))}</span>
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
                            {ui.remove}
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
                          placeholder={ui.locationTitlePlaceholder}
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
                          placeholder={ui.addressPlaceholder}
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
                          placeholder={ui.descriptionPlaceholder}
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
                            { title: language === "en" ? "New venue" : "Nouveau lieu", address: "", description: "", accommodations: [] },
                          ],
                        }))
                      }
                    >
                      {ui.addLocation}
                    </Button>
                    <Button onClick={saveDesign} disabled={isSaving} size="sm" className="w-full mt-2">
                      {isSaving ? ui.saving : ui.save}
                    </Button>
                  </div>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="accommodations" className="border rounded-xl px-4 mb-4">
                <AccordionTrigger className="hover:no-underline">{ui.nearbyStay}</AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-4">
                    <div className="rounded-xl border bg-card px-3 py-3">
                      <div className="text-sm font-medium">{ui.lodgingSuggestions}</div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {ui.lodgingSuggestionsDesc}
                      </p>
                    </div>

                    {sections.locationItems.length === 0 ? (
                      <div className="rounded-xl border border-dashed px-4 py-5 text-sm text-muted-foreground">
                        {ui.addLocationFirst}
                      </div>
                    ) : (
                      sections.locationItems.map((item, idx) => (
                        <div key={`accommodation-group-${idx}`} className="rounded-lg border border-border p-3 space-y-3">
                          <div className="flex items-center justify-between gap-3">
                            <div>
                              <div className="text-sm font-medium">{item.title || ui.locationItem.replace("{index}", String(idx + 1))}</div>
                              <p className="text-xs text-muted-foreground">
                                {item.address || ui.locationAddressHint}
                              </p>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 text-xs"
                              onClick={() =>
                                setSections((prev) => {
                                  const items = [...prev.locationItems];
                                  const accs = [...(items[idx].accommodations || []), { name: "", address: "", url: "" }];
                                  items[idx] = { ...items[idx], accommodations: accs };
                                  return { ...prev, locationItems: items };
                                })
                              }
                            >
                              {ui.addAccommodation}
                            </Button>
                          </div>

                          {(item.accommodations || []).length === 0 ? (
                            <div className="rounded-lg border border-dashed px-3 py-4 text-xs text-muted-foreground">
                              {ui.noAccommodationForLocation}
                            </div>
                          ) : (
                            (item.accommodations || []).map((acc: any, accIdx: number) => (
                              <div key={accIdx} className="flex gap-2 items-start">
                                <div className="flex-1 space-y-2">
                                  <Input
                                    value={acc.name}
                                    onChange={(e) =>
                                      setSections((prev) => {
                                        const items = [...prev.locationItems];
                                        const accs = [...(items[idx].accommodations || [])];
                                        accs[accIdx] = { ...accs[accIdx], name: e.target.value };
                                        items[idx] = { ...items[idx], accommodations: accs };
                                        return { ...prev, locationItems: items };
                                      })
                                    }
                                    placeholder={ui.hotelNamePlaceholder}
                                    className="h-9 text-sm"
                                  />
                                  <Input
                                    value={acc.address}
                                    onChange={(e) =>
                                      setSections((prev) => {
                                        const items = [...prev.locationItems];
                                        const accs = [...(items[idx].accommodations || [])];
                                        accs[accIdx] = { ...accs[accIdx], address: e.target.value };
                                        items[idx] = { ...items[idx], accommodations: accs };
                                        return { ...prev, locationItems: items };
                                      })
                                    }
                                    placeholder={ui.distancePlaceholder}
                                    className="h-9 text-sm"
                                  />
                                  <Input
                                    value={acc.url}
                                    onChange={(e) =>
                                      setSections((prev) => {
                                        const items = [...prev.locationItems];
                                        const accs = [...(items[idx].accommodations || [])];
                                        accs[accIdx] = { ...accs[accIdx], url: e.target.value };
                                        items[idx] = { ...items[idx], accommodations: accs };
                                        return { ...prev, locationItems: items };
                                      })
                                    }
                                    placeholder={ui.reservationLinkPlaceholder}
                                    className="h-9 text-sm"
                                  />
                                </div>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-9 w-9 p-0 text-destructive shrink-0 mt-0"
                                  onClick={() =>
                                    setSections((prev) => {
                                      const items = [...prev.locationItems];
                                      const accs = [...(items[idx].accommodations || [])].filter((_, i) => i !== accIdx);
                                      items[idx] = { ...items[idx], accommodations: accs };
                                      return { ...prev, locationItems: items };
                                    })
                                  }
                                >
                                  ×
                                </Button>
                              </div>
                            ))
                          )}
                        </div>
                      ))
                    )}

                    <Button onClick={saveDesign} disabled={isSaving} size="sm" className="w-full mt-2">
                      {isSaving ? ui.saving : ui.save}
                    </Button>
                  </div>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="program-items" className="border rounded-xl px-4 mb-4">
                <AccordionTrigger className="hover:no-underline">{ui.schedule}</AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between rounded-xl border bg-card px-3 py-2">
                      <div>
                        <div className="text-sm font-medium">{ui.showSection}</div>
                        <p className="text-xs text-muted-foreground">{ui.scheduleVisibility}</p>
                      </div>
                      <Switch
                        checked={pageVisibility.program}
                        onCheckedChange={(checked) => setPageVisibility((prev) => ({ ...prev, program: checked }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-medium">{ui.titleLabel}</label>
                      <Input value={texts.programTitle} onChange={(e) => setTexts({ ...texts, programTitle: e.target.value })} />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-medium">{ui.introText}</label>
                      <Textarea rows={2} value={texts.programDescription} onChange={(e) => setTexts({ ...texts, programDescription: e.target.value })} />
                    </div>
                    {sections.programItems.map((item, idx) => (
                      <div key={`${item.title}-${idx}`} className="rounded-lg border border-border p-3 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-semibold">{ui.stepItem.replace("{index}", String(idx + 1))}</span>
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
                            {ui.remove}
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
                            placeholder={ui.timePlaceholder}
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
                            placeholder={ui.titleLabel}
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
                          placeholder={ui.descriptionLabel}
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
                            { time: "12:00", title: ui.newStep, description: "" },
                          ],
                        }))
                      }
                    >
                      {ui.addStep}
                    </Button>
                    <Button onClick={saveDesign} disabled={isSaving} size="sm" className="w-full mt-2">
                      {isSaving ? ui.saving : ui.save}
                    </Button>
                  </div>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="cagnotte" className="border rounded-xl px-4 mb-4">
                <AccordionTrigger className="hover:no-underline">{ui.fund}</AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between rounded-xl border bg-card px-3 py-2">
                      <div>
                        <div className="text-sm font-medium">{ui.showSection}</div>
                        <p className="text-xs text-muted-foreground">{ui.fundVisibility}</p>
                      </div>
                      <Switch
                        checked={pageVisibility.cagnotte}
                        onCheckedChange={(checked) => setPageVisibility((prev) => ({ ...prev, cagnotte: checked }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-medium">{ui.titleLabel}</label>
                      <Input value={texts.cagnotteTitle} onChange={(e) => setTexts({ ...texts, cagnotteTitle: e.target.value })} />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-medium">{ui.descriptionLabel}</label>
                      <Textarea rows={3} value={texts.cagnotteDescription} onChange={(e) => setTexts({ ...texts, cagnotteDescription: e.target.value })} />
                    </div>
                    <div className="rounded-xl border bg-card p-4 space-y-3">
                      <div className="space-y-1">
                        <div className="text-sm font-semibold">{ui.contributionOptions}</div>
                        <p className="text-xs text-muted-foreground">
                          {ui.contributionOptionsDesc}
                        </p>
                      </div>
                      <ContributionMethodsEditor
                        methods={contributionMethods}
                        onChange={setContributionMethods}
                      />
                    </div>
                    <Button onClick={saveDesign} disabled={isSaving} size="sm" className="w-full mt-2">
                      {isSaving ? ui.saving : ui.save}
                    </Button>
                  </div>
                </AccordionContent>
              </AccordionItem>

            </Accordion>
          </div>
        </aside>

        <main className="bg-[#F3F5F9] p-4 md:p-6 min-h-0">
          <div className="rounded-2xl border bg-white overflow-hidden shadow-sm h-full min-h-0 flex flex-col">
            <div className="bg-muted/40 px-4 py-2 text-xs text-muted-foreground flex items-center justify-between">
              <span className="truncate">{previewUrl}</span>
              <span>{ui.publicPreview}</span>
            </div>
            <iframe
              src={previewUrl}
              title={ui.publicPreviewTitle}
              className="w-full h-full flex-1 border-0 min-h-0"
            />
          </div>
        </main>
      </div>

      {showTour && (
        <GuidedTour
          tourId="design"
          steps={[
            { target: "design-edit-panel", title: ui.tour.editPanelTitle, description: ui.tour.editPanelDesc, position: "right" },
            { target: "design-preview", title: ui.tour.livePreviewTitle, description: ui.tour.livePreviewDesc, position: "bottom" },
            { target: "design-publish", title: ui.tour.publishTitle, description: ui.tour.publishDesc, position: "bottom" },
          ]}
        />
      )}
    </div>
  );
}
