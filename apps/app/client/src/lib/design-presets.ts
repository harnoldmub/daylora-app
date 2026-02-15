export const COLOR_TONES = [
  {
    id: "libala-signature",
    name: "Libala Signature",
    description: "Premium, intemporel et chaleureux.",
    primaryColor: "#8C7A6B",
    secondaryColor: "#FBF8F3",
  },
  {
    id: "golden-ivory",
    name: "Or & Ivoire",
    description: "Elegant, lumineux et intemporel.",
    primaryColor: "#C8A96A",
    secondaryColor: "#FFFDF9",
  },
  {
    id: "rose-sunset",
    name: "Rose Sunset",
    description: "Romantique et chaleureux.",
    primaryColor: "#D16A7D",
    secondaryColor: "#FFF3F6",
  },
  {
    id: "sage-olive",
    name: "Sauge & Olive",
    description: "Naturel et raffine.",
    primaryColor: "#5A7A65",
    secondaryColor: "#F2F7F1",
  },
  {
    id: "ocean-pearl",
    name: "Ocean Perle",
    description: "Moderne, frais et premium.",
    primaryColor: "#1F4AA2",
    secondaryColor: "#F2F6FF",
  },
] as const;

export const TEMPLATE_PRESETS = {
  classic: {
    id: "classic",
    name: "Classique",
    description: "Elegant et ceremoniel",
    defaultFont: "serif",
    defaultButtonStyle: "solid",
    defaultButtonRadius: "pill",
  },
  modern: {
    id: "modern",
    name: "Moderne",
    description: "Editorial et dynamique",
    defaultFont: "sans",
    defaultButtonStyle: "solid",
    defaultButtonRadius: "rounded",
  },
  minimal: {
    id: "minimal",
    name: "Minimal",
    description: "Graphique et epure",
    defaultFont: "sans",
    defaultButtonStyle: "outline",
    defaultButtonRadius: "square",
  },
} as const;

export const BUTTON_STYLE_OPTIONS = [
  { id: "solid", label: "Plein" },
  { id: "soft", label: "Soft" },
  { id: "outline", label: "Contour" },
] as const;

export const BUTTON_RADIUS_OPTIONS = [
  { id: "pill", label: "Pill" },
  { id: "rounded", label: "Arrondi" },
  { id: "square", label: "Structure" },
] as const;

export function resolveTone(toneId?: string) {
  return COLOR_TONES.find((tone) => tone.id === toneId) || COLOR_TONES[0];
}

export function getTemplatePreset(templateId?: string) {
  if (!templateId || !(templateId in TEMPLATE_PRESETS)) {
    return TEMPLATE_PRESETS.classic;
  }
  return TEMPLATE_PRESETS[templateId as keyof typeof TEMPLATE_PRESETS];
}

export function getButtonClass(buttonStyle?: string) {
  if (buttonStyle === "outline") {
    return "bg-transparent border border-primary text-primary hover:bg-primary/10";
  }
  if (buttonStyle === "soft") {
    return "bg-primary/15 border border-primary/30 text-primary hover:bg-primary/25";
  }
  return "bg-primary text-primary-foreground border border-primary hover:bg-primary/90";
}
