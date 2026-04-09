import { NLS_EN } from "./nls_en";
import { NLS_FR } from "./nls_fr";

export type SiteLanguage = "fr" | "en";

type LocationItem = {
  title: string;
  address: string;
  description: string;
};

type ProgramItem = {
  time: string;
  title: string;
  description: string;
};

type SiteLanguagePack = {
  language: SiteLanguage;
  locale: string;
  stepLabels: string[];
  menuLabels: {
    home: string;
    gifts: string;
    story: string;
    gallery: string;
    accommodation: string;
    location: string;
    program: string;
  };
  texts: {
    heroSubtitle: string;
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
    programTitle: string;
    programDescription: string;
    storyTitle: string;
    storyBody: string;
    galleryTitle: string;
    galleryDescription: string;
    giftsTitle: string;
    giftsDescription: string;
    cagnotteTitle: string;
    cagnotteDescription: string;
    cagnotteBackLabel: string;
    cagnotteSubmitLabel: string;
    invitationGreeting: string;
    invitationPrelude: string;
    invitationMessage: string;
    invitationSubmessage: string;
    invitationCagnotteTitle: string;
    invitationCagnotteDescription: string;
    invitationCagnotteButton: string;
    invitationFooterNote: string;
    footerTitle: string;
    footerSubtitle: string;
    footerCopyright: string;
  };
  sections: {
    locationItems: LocationItem[];
    programItems: ProgramItem[];
  };
  invitation: {
    pageTitle: string;
    loading: string;
    notFoundTitle: string;
    notFoundDescription: string;
    people: string;
    person: string;
    table: string;
    invitationType: string;
    checkInLink: string;
  };
};

export const SITE_LANGUAGE_PACKS: Record<SiteLanguage, SiteLanguagePack> = {
  fr: NLS_FR.siteLanguagePack as unknown as SiteLanguagePack,
  en: NLS_EN.siteLanguagePack as unknown as SiteLanguagePack,
};

export function getSiteLanguagePack(language?: string) {
  return SITE_LANGUAGE_PACKS[language === "en" ? "en" : "fr"];
}
