import type { Wedding, Gift as GiftDb } from "@shared/schema";
import type { TemplateTokens } from "@/design-system/tokens";

export interface SectionEditProps {
  canEdit: boolean;
  editMode: boolean;
}

export interface SaveTextFn {
  (key: string, value: string): Promise<void>;
}

export interface HeroSectionProps extends SectionEditProps {
  tokens: TemplateTokens;
  wedding: Wedding;
  heroTitle: string;
  heroSubtitle: string;
  heroDate: string;
  heroCta: string;
  heroImage: string;
  logoUrl: string;
  logoText: string;
  countdownDate: string;
  ctaPath: string;
  buttonToneClass: string;
  buttonRadiusClass: string;
  onSaveText: SaveTextFn;
  onHeroCtaClick: () => void;
  onMediaUpload: (key: "heroImage" | "couplePhoto") => (event: React.ChangeEvent<HTMLInputElement>) => void;
  onUpdateMedia: (key: "heroImage" | "couplePhoto", value: string) => Promise<void>;
  isUploading: { heroImage: boolean; couplePhoto: boolean };
  onSaveCountdownDate: (value: string) => Promise<void>;
  onSaveCtaPath: (value: string) => Promise<void>;
  toDateInputValue: (value: string) => string;
  fromDateInputValue: (value: string) => string;
}

export interface CountdownSectionProps extends SectionEditProps {
  tokens: TemplateTokens;
  weddingDate: string;
  countdownTitle: string;
  onSaveText: SaveTextFn;
}

export interface RSVPSectionProps extends SectionEditProps {
  tokens: TemplateTokens;
  wedding: Wedding;
  rsvpTitle: string;
  rsvpDescription: string;
  rsvpButton: string;
  buttonToneClass: string;
  buttonRadiusClass: string;
  onSaveText: SaveTextFn;
  order?: number;
}

export interface StorySectionProps extends SectionEditProps {
  tokens: TemplateTokens;
  storyTitle: string;
  storyBody: string;
  couplePhoto: string;
  onSaveText: SaveTextFn;
  onMediaUpload: (key: "heroImage" | "couplePhoto") => (event: React.ChangeEvent<HTMLInputElement>) => void;
  onUpdateMedia: (key: "heroImage" | "couplePhoto", value: string) => Promise<void>;
  isUploading: { heroImage: boolean; couplePhoto: boolean };
  order?: number;
}

export type AccommodationItem = {
  name: string;
  address: string;
  url: string;
};

export type LocationItem = {
  title: string;
  address: string;
  description: string;
  accommodations?: AccommodationItem[];
};

export type ProgramItem = {
  time: string;
  title: string;
  description: string;
};

export interface LocationsSectionProps extends SectionEditProps {
  tokens: TemplateTokens;
  locationTitle: string;
  locationDescription: string;
  locationItems: LocationItem[];
  onSaveText: SaveTextFn;
  onUpdateLocationItem: (index: number, patch: Partial<LocationItem>) => Promise<void>;
  onDeleteLocationItem: (index: number) => Promise<void>;
  onAddLocationItem: () => Promise<void>;
  order?: number;
}

export interface ScheduleSectionProps extends SectionEditProps {
  tokens: TemplateTokens;
  programTitle: string;
  programDescription: string;
  programItems: ProgramItem[];
  onSaveText: SaveTextFn;
  onUpdateProgramItem: (index: number, patch: Partial<ProgramItem>) => Promise<void>;
  onDeleteProgramItem: (index: number) => Promise<void>;
  onAddProgramItem: () => Promise<void>;
  order?: number;
}

export interface GallerySectionProps extends SectionEditProps {
  tokens: TemplateTokens;
  galleryTitle: string;
  galleryDescription: string;
  galleryImages: string[];
  onSaveText: SaveTextFn;
  onGalleryFilesSelected: (files: FileList | null) => Promise<void>;
  onRemoveGalleryImage: (index: number) => Promise<void>;
  onResetGallery: () => Promise<void>;
  onSetMainImage?: (index: number) => void;
  maxImages: number;
  order?: number;
}

export interface GiftsSectionProps extends SectionEditProps {
  tokens: TemplateTokens;
  giftsTitle: string;
  giftsDescription: string;
  gifts: GiftDb[];
  onSaveText: SaveTextFn;
  onCreateGift: () => void;
  onEditGift: (gift: GiftDb) => void;
  onDeleteGift: (gift: GiftDb) => void;
  onReserveGift?: (giftId: number, guestName: string) => void;
  order?: number;
}

export interface CagnotteSectionProps extends SectionEditProps {
  tokens: TemplateTokens;
  cagnotteTitle: string;
  cagnotteDescription: string;
  contributionMethods: import("@shared/schema").ContributionMethod[];
  buttonRadiusClass: string;
  onSaveText: SaveTextFn;
  order?: number;
}
