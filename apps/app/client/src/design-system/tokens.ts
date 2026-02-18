export const colors = {
  primary: "#1C1C1E",
  background: "#F8F6F2",
  accent: "#C6A75E",
  secondary: "#8E8E93",
  white: "#FFFFFF",
  black: "#000000",
  muted: "#F1EDE8",
  border: "#E5E0D8",
} as const;

export const typography = {
  serif: "'Playfair Display', Georgia, serif",
  sans: "'Manrope', 'Inter', system-ui, sans-serif",
  mono: "'JetBrains Mono', monospace",
} as const;

export const spacing = {
  section: {
    sm: "py-16 px-6",
    md: "py-24 px-6",
    lg: "py-32 px-6",
    xl: "py-40 px-6",
  },
  container: {
    sm: "max-w-3xl mx-auto",
    md: "max-w-4xl mx-auto",
    lg: "max-w-5xl mx-auto",
    xl: "max-w-6xl mx-auto",
    full: "max-w-full mx-auto",
  },
} as const;

export const radius = {
  none: "rounded-none",
  sm: "rounded-md",
  md: "rounded-xl",
  lg: "rounded-2xl",
  xl: "rounded-3xl",
  xxl: "rounded-[4rem]",
  full: "rounded-full",
} as const;

export type TemplateId = "classic" | "modern" | "minimal";

export interface TemplateTokens {
  id: TemplateId;
  name: string;
  font: "serif" | "sans";
  page: {
    bg: string;
  };
  hero: {
    overlay: string;
    wrapper: string;
    title: string;
    subtitle: string;
    date: string;
    button: string;
    shell: string;
    imageOpacity: string;
    alignment: "center" | "left";
    decoration: "none" | "serif-border" | "floral";
  };
  rsvp: {
    section: string;
    card: string;
  };
  story: {
    title: string;
    layout: string;
    image: string;
    container: string;
  };
  gallery: {
    section: string;
    imageRadius: string;
  };
  location: {
    section: string;
    card: string;
  };
  schedule: {
    section: string;
    card: string;
  };
  gifts: {
    section: string;
    card: string;
  };
  cagnotte: {
    section: string;
  };
  footer: {
    section: string;
  };
}

export const templateTokens: Record<TemplateId, TemplateTokens> = {
  classic: {
    id: "classic",
    name: "Classique",
    font: "serif",
    page: {
      bg: "bg-secondary",
    },
    hero: {
      overlay: "from-foreground/25 via-transparent to-secondary",
      wrapper: "text-center max-w-5xl space-y-10",
      title: "text-7xl md:text-9xl font-bold text-foreground leading-[1.05]",
      subtitle: "text-xs md:text-sm tracking-[0.4em] uppercase text-primary mb-6 opacity-80",
      date: "text-xl md:text-2xl font-medium text-foreground mt-8 border-y border-primary/20 py-5 inline-block px-12 tracking-widest",
      button: "px-16 py-8 text-xs tracking-[0.3em] uppercase font-black shadow-2xl transition-all hover:scale-105",
      shell: "rounded-[3rem] bg-white/55 backdrop-blur-md border border-white/50 px-8 py-10 md:px-12 md:py-12 shadow-[0_30px_120px_rgba(0,0,0,0.10)]",
      imageOpacity: "opacity-78",
      alignment: "center",
      decoration: "serif-border",
    },
    rsvp: {
      section: "bg-secondary py-40 border-t border-primary/10",
      card: "border-none shadow-[0_40px_120px_rgba(0,0,0,0.1)] bg-card/90 backdrop-blur-2xl rounded-[4rem] p-16 border border-white/60",
    },
    story: {
      title: "text-6xl font-bold text-foreground mb-12 text-center",
      layout: "grid grid-cols-1 lg:grid-cols-2 gap-24 items-center",
      image: "rounded-[4rem] shadow-[0_50px_100px_rgba(0,0,0,0.1)] border-[12px] border-white -rotate-1 hover:rotate-0 transition-transform duration-700",
      container: "max-w-6xl mx-auto px-6",
    },
    gallery: {
      section: "bg-white/40",
      imageRadius: "rounded-3xl",
    },
    location: {
      section: "bg-muted/20",
      card: "bg-white/80 border border-primary/10 rounded-2xl p-6 shadow-sm",
    },
    schedule: {
      section: "",
      card: "border border-primary/10 rounded-2xl p-6",
    },
    gifts: {
      section: "",
      card: "rounded-3xl border border-primary/10 bg-white/60 backdrop-blur",
    },
    cagnotte: {
      section: "bg-secondary/30",
    },
    footer: {
      section: "bg-foreground text-background",
    },
  },
  modern: {
    id: "modern",
    name: "Moderne",
    font: "sans",
    page: {
      bg: "bg-background",
    },
    hero: {
      overlay: "from-black/35 via-black/10 to-background",
      wrapper: "text-left max-w-7xl pt-20 px-10",
      title: "text-7xl md:text-[11rem] font-black text-white leading-[0.8] tracking-tighter uppercase",
      subtitle: "text-[10px] md:text-sm font-black tracking-[0.8em] uppercase text-primary mb-8 drop-shadow-lg",
      date: "text-2xl md:text-5xl font-black text-white/40 mt-10 tracking-widest uppercase",
      button: "px-14 py-8 text-xs tracking-[0.4em] uppercase font-black transition-all rounded-none ring-1 ring-white/10 hover:ring-primary/50",
      shell: "rounded-[3rem] bg-black/25 backdrop-blur-md border border-white/10 px-8 py-10 md:px-12 md:py-12 shadow-[0_30px_120px_rgba(0,0,0,0.25)]",
      imageOpacity: "opacity-90",
      alignment: "left",
      decoration: "none",
    },
    rsvp: {
      section: "bg-black text-white py-40 border-y border-white/5",
      card: "bg-neutral-900/80 border border-white/10 backdrop-blur-3xl rounded-none shadow-[0_50px_100px_rgba(0,0,0,0.5)] p-16",
    },
    story: {
      title: "text-8xl md:text-[12rem] font-black text-foreground leading-none tracking-tighter mb-16",
      layout: "grid grid-cols-1 lg:grid-cols-[1.3fr_0.7fr] gap-0 items-stretch min-h-[80vh]",
      image: "rounded-none grayscale contrast-125 hover:grayscale-0 transition-all duration-1000 object-cover h-full",
      container: "max-w-full mx-auto px-0",
    },
    gallery: {
      section: "bg-neutral-950 text-white",
      imageRadius: "rounded-none",
    },
    location: {
      section: "bg-neutral-50",
      card: "bg-white border border-neutral-200 rounded-none p-8 shadow-md",
    },
    schedule: {
      section: "bg-black text-white",
      card: "border border-white/10 rounded-none p-8",
    },
    gifts: {
      section: "",
      card: "rounded-none border border-neutral-200 bg-white shadow-md",
    },
    cagnotte: {
      section: "bg-neutral-950 text-white",
    },
    footer: {
      section: "bg-black text-white",
    },
  },
  minimal: {
    id: "minimal",
    name: "Minimal",
    font: "sans",
    page: {
      bg: "bg-background",
    },
    hero: {
      overlay: "from-transparent via-transparent to-background",
      wrapper: "text-center max-w-3xl space-y-12",
      title: "text-5xl md:text-[6rem] font-thin text-foreground tracking-[-0.07em] leading-[0.9]",
      subtitle: "text-[10px] tracking-[1.2em] uppercase text-muted-foreground mb-12",
      date: "text-xl md:text-2xl font-light text-muted-foreground mt-6 flex items-center justify-center gap-6 before:h-[0.5px] before:w-12 before:bg-foreground/10 after:h-[0.5px] after:w-12 after:bg-foreground/10",
      button: "px-12 py-6 text-[11px] tracking-[0.6em] uppercase font-medium border border-foreground/20 text-foreground transition-all rounded-full",
      shell: "rounded-[3rem] bg-white/55 backdrop-blur-md border border-white/50 px-8 py-10 md:px-12 md:py-12 shadow-[0_30px_120px_rgba(0,0,0,0.10)]",
      imageOpacity: "opacity-75",
      alignment: "center",
      decoration: "floral",
    },
    rsvp: {
      section: "bg-background py-40",
      card: "border-none shadow-[0_20px_60px_rgba(0,0,0,0.03)] bg-card rounded-2xl p-16 max-w-2xl mx-auto",
    },
    story: {
      title: "text-5xl md:text-7xl font-extralight text-foreground text-center mb-24 tracking-tighter",
      layout: "max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center px-6 pb-40",
      image: "rounded-2xl opacity-95 shadow-2xl border border-black/5 transition-opacity hover:opacity-100 duration-1000",
      container: "max-w-4xl mx-auto px-6",
    },
    gallery: {
      section: "",
      imageRadius: "rounded-2xl",
    },
    location: {
      section: "",
      card: "border border-black/5 rounded-2xl p-8 shadow-sm",
    },
    schedule: {
      section: "",
      card: "border border-black/5 rounded-2xl p-8",
    },
    gifts: {
      section: "",
      card: "rounded-2xl border border-black/5 bg-white shadow-sm",
    },
    cagnotte: {
      section: "",
    },
    footer: {
      section: "bg-neutral-900 text-white",
    },
  },
};

export function getTokens(templateId?: string): TemplateTokens {
  if (templateId && templateId in templateTokens) {
    return templateTokens[templateId as TemplateId];
  }
  return templateTokens.classic;
}
