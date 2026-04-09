export const LOGO_TEXT_STYLE_OPTIONS = [
  { id: "elegant", label: "Elegant classique" },
  { id: "signature", label: "Signature" },
  { id: "monogram", label: "Monogramme" },
  { id: "modern", label: "Modern chic" },
] as const;

export type LogoTextStyle = (typeof LOGO_TEXT_STYLE_OPTIONS)[number]["id"];

export const getLogoTextClassName = (style?: string) => {
  switch (style) {
    case "signature":
      return "font-serif italic tracking-[0.06em] text-[1.15em] font-medium";
    case "monogram":
      return "font-serif uppercase tracking-[0.32em] text-[0.95em] font-semibold";
    case "modern":
      return "font-sans uppercase tracking-[0.22em] text-[0.92em] font-semibold";
    case "elegant":
    default:
      return "font-serif tracking-[0.08em] text-[1.05em] font-semibold";
  }
};

export const getLogoTextWrapperClassName = (style?: string) => {
  switch (style) {
    case "signature":
      return "px-0 py-0";
    case "monogram":
      return "px-3 py-2 rounded-full border border-current/15 bg-white/65 backdrop-blur-sm";
    case "modern":
      return "px-3 py-1.5 rounded-full border border-current/10 bg-white/50 backdrop-blur-sm";
    case "elegant":
    default:
      return "px-0 py-0";
  }
};
