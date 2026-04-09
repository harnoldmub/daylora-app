export const FONT_PROFILE_OPTIONS = [
  {
    id: "serif",
    label: "Playfair & Manrope",
    description: "Elegant et intemporel",
    serif: "'Playfair Display', serif",
    sans: "'Manrope', sans-serif",
    baseClass: "font-serif",
  },
  {
    id: "sans",
    label: "Manrope moderne",
    description: "Simple et net",
    serif: "'Manrope', sans-serif",
    sans: "'Manrope', sans-serif",
    baseClass: "font-sans",
  },
  {
    id: "editorial",
    label: "Editorial chic",
    description: "Raffine et premium",
    serif: "'Cormorant Garamond', serif",
    sans: "'Inter', sans-serif",
    baseClass: "font-serif",
  },
  {
    id: "romantic",
    label: "Romantique",
    description: "Doux et ceremoniel",
    serif: "'Libre Baskerville', serif",
    sans: "'DM Sans', sans-serif",
    baseClass: "font-serif",
  },
  {
    id: "contemporary",
    label: "Contemporain",
    description: "Editorial et dynamique",
    serif: "'Inter', sans-serif",
    sans: "'Inter', sans-serif",
    baseClass: "font-sans",
  },
] as const;

export type FontProfileId = (typeof FONT_PROFILE_OPTIONS)[number]["id"];

export function resolveFontProfile(fontFamily?: string) {
  return FONT_PROFILE_OPTIONS.find((profile) => profile.id === fontFamily) || FONT_PROFILE_OPTIONS[0];
}
