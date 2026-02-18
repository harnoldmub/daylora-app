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
    label: string;
    input: string;
    title: string;
    description: string;
  };
  story: {
    title: string;
    layout: string;
    image: string;
    container: string;
    body: string;
  };
  gallery: {
    section: string;
    imageRadius: string;
    title: string;
  };
  location: {
    section: string;
    card: string;
    title: string;
  };
  schedule: {
    section: string;
    card: string;
    title: string;
    time: string;
  };
  gifts: {
    section: string;
    card: string;
    title: string;
  };
  cagnotte: {
    section: string;
    title: string;
    icon: string;
  };
  countdown: {
    section: string;
    box: string;
    number: string;
    label: string;
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
      bg: "bg-[#FAF7F2]",
    },
    hero: {
      overlay: "from-black/60 via-black/30 to-[#FAF7F2]",
      wrapper: "text-center max-w-4xl space-y-8",
      title: "text-6xl md:text-8xl font-bold text-white leading-[1.05] drop-shadow-[0_4px_30px_rgba(0,0,0,0.4)]",
      subtitle: "text-xs md:text-sm tracking-[0.4em] uppercase text-white/90 mb-4",
      date: "text-lg md:text-xl font-medium text-white/90 mt-6 border-y border-white/30 py-4 inline-block px-10 tracking-widest",
      button: "px-14 py-7 text-xs tracking-[0.3em] uppercase font-bold shadow-2xl transition-all hover:scale-105",
      shell: "rounded-3xl bg-black/40 backdrop-blur-xl border border-white/15 px-8 py-10 md:px-14 md:py-14 shadow-[0_30px_80px_rgba(0,0,0,0.3)]",
      imageOpacity: "opacity-90",
      alignment: "center",
      decoration: "serif-border",
    },
    rsvp: {
      section: "bg-[#FAF7F2] py-32 border-t border-black/5",
      card: "border border-black/8 shadow-[0_20px_60px_rgba(0,0,0,0.06)] bg-white rounded-3xl p-12 md:p-16",
      label: "text-xs uppercase tracking-widest font-semibold text-[#6B5E50]",
      input: "h-14 rounded-xl bg-[#FAF7F2] border-[#E5DFD5] text-[#3D3428] placeholder:text-[#B5AA9A] focus:ring-[#C8A96A]/30 focus:border-[#C8A96A]",
      title: "text-4xl md:text-5xl font-serif font-light text-[#3D3428] tracking-tight",
      description: "text-[#8A7D6D]",
    },
    story: {
      title: "text-5xl md:text-6xl font-bold text-[#3D3428] mb-12 text-center",
      layout: "grid grid-cols-1 lg:grid-cols-2 gap-16 items-center",
      image: "rounded-3xl shadow-[0_30px_80px_rgba(0,0,0,0.08)] border-[8px] border-white -rotate-1 hover:rotate-0 transition-transform duration-700",
      container: "max-w-6xl mx-auto px-6",
      body: "text-lg text-[#6B5E50] leading-relaxed font-light italic",
    },
    gallery: {
      section: "bg-white/60",
      imageRadius: "rounded-2xl",
      title: "text-[#3D3428]",
    },
    location: {
      section: "bg-[#F3EDE4]/50",
      card: "bg-white border border-[#E5DFD5] rounded-2xl p-6 shadow-sm",
      title: "text-[#3D3428]",
    },
    schedule: {
      section: "",
      card: "border border-[#E5DFD5] rounded-2xl p-6 bg-white",
      title: "text-[#3D3428]",
      time: "text-primary",
    },
    gifts: {
      section: "",
      card: "rounded-2xl border border-[#E5DFD5] bg-white shadow-sm",
      title: "text-[#3D3428]",
    },
    cagnotte: {
      section: "bg-[#F3EDE4]/40",
      title: "text-[#3D3428]",
      icon: "text-primary/70",
    },
    countdown: {
      section: "bg-[#FAF7F2]",
      box: "w-18 h-18 md:w-22 md:h-22 rounded-xl bg-white border border-[#E5DFD5] shadow-sm",
      number: "text-2xl md:text-3xl font-serif font-bold text-primary",
      label: "text-xs text-[#8A7D6D] mt-2 font-sans",
    },
    footer: {
      section: "bg-[#2A2318] text-white/90",
    },
  },
  modern: {
    id: "modern",
    name: "Moderne",
    font: "sans",
    page: {
      bg: "bg-[#0A0A0A]",
    },
    hero: {
      overlay: "from-black/70 via-black/40 to-[#0A0A0A]",
      wrapper: "text-left max-w-7xl pt-20 px-10",
      title: "text-6xl md:text-[10rem] font-black text-white leading-[0.85] tracking-tighter uppercase drop-shadow-[0_4px_40px_rgba(0,0,0,0.5)]",
      subtitle: "text-[10px] md:text-xs font-bold tracking-[0.6em] uppercase text-white/80 mb-6",
      date: "text-xl md:text-4xl font-black text-white/50 mt-8 tracking-widest uppercase",
      button: "px-12 py-7 text-xs tracking-[0.4em] uppercase font-bold transition-all rounded-none ring-1 ring-white/20 hover:ring-white/60 bg-white text-black hover:bg-white/90",
      shell: "rounded-none bg-black/50 backdrop-blur-2xl border border-white/10 px-8 py-10 md:px-14 md:py-14 shadow-[0_30px_100px_rgba(0,0,0,0.5)]",
      imageOpacity: "opacity-80",
      alignment: "left",
      decoration: "none",
    },
    rsvp: {
      section: "bg-[#111111] text-white py-32",
      card: "bg-[#1A1A1A] border border-white/10 rounded-none shadow-[0_30px_80px_rgba(0,0,0,0.4)] p-12 md:p-16",
      label: "text-xs uppercase tracking-widest font-semibold text-white/60",
      input: "h-14 rounded-none bg-[#222222] border-white/15 text-white placeholder:text-white/30 focus:ring-white/20 focus:border-white/40",
      title: "text-4xl md:text-6xl font-black text-white tracking-tighter uppercase",
      description: "text-white/50",
    },
    story: {
      title: "text-6xl md:text-[8rem] font-black text-white leading-none tracking-tighter mb-16",
      layout: "grid grid-cols-1 lg:grid-cols-[1.3fr_0.7fr] gap-0 items-stretch min-h-[70vh]",
      image: "rounded-none grayscale contrast-110 hover:grayscale-0 transition-all duration-1000 object-cover h-full",
      container: "max-w-full mx-auto px-0",
      body: "text-lg text-white/60 leading-relaxed font-light",
    },
    gallery: {
      section: "bg-[#0A0A0A] text-white",
      imageRadius: "rounded-none",
      title: "text-white",
    },
    location: {
      section: "bg-[#111111]",
      card: "bg-[#1A1A1A] border border-white/10 rounded-none p-8",
      title: "text-white",
    },
    schedule: {
      section: "bg-[#0A0A0A] text-white",
      card: "border border-white/10 rounded-none p-8 bg-[#1A1A1A]",
      title: "text-white",
      time: "text-white/60",
    },
    gifts: {
      section: "bg-[#111111]",
      card: "rounded-none border border-white/10 bg-[#1A1A1A] shadow-lg",
      title: "text-white",
    },
    cagnotte: {
      section: "bg-[#0A0A0A] text-white",
      title: "text-white",
      icon: "text-white/50",
    },
    countdown: {
      section: "bg-[#0A0A0A]",
      box: "w-18 h-18 md:w-22 md:h-22 rounded-none bg-[#1A1A1A] border border-white/10",
      number: "text-2xl md:text-3xl font-sans font-black text-white",
      label: "text-xs text-white/40 mt-2 font-sans uppercase tracking-widest",
    },
    footer: {
      section: "bg-black text-white/70",
    },
  },
  minimal: {
    id: "minimal",
    name: "Minimal",
    font: "sans",
    page: {
      bg: "bg-white",
    },
    hero: {
      overlay: "from-white/50 via-transparent to-white",
      wrapper: "text-center max-w-3xl space-y-10",
      title: "text-5xl md:text-[5.5rem] font-extralight text-[#2D2D2D] tracking-[-0.04em] leading-[0.95] drop-shadow-[0_2px_20px_rgba(0,0,0,0.1)]",
      subtitle: "text-[10px] tracking-[1em] uppercase text-[#2D2D2D]/60 mb-10",
      date: "text-lg md:text-xl font-light text-[#2D2D2D]/60 mt-6 flex items-center justify-center gap-6 before:h-[0.5px] before:w-10 before:bg-[#2D2D2D]/20 after:h-[0.5px] after:w-10 after:bg-[#2D2D2D]/20",
      button: "px-10 py-6 text-[11px] tracking-[0.5em] uppercase font-medium border border-[#2D2D2D]/20 text-[#2D2D2D] bg-transparent hover:bg-[#2D2D2D] hover:text-white transition-all rounded-full",
      shell: "rounded-3xl bg-white/70 backdrop-blur-2xl border border-black/5 px-8 py-10 md:px-14 md:py-14 shadow-[0_20px_60px_rgba(0,0,0,0.06)]",
      imageOpacity: "opacity-60",
      alignment: "center",
      decoration: "floral",
    },
    rsvp: {
      section: "bg-[#FAFAFA] py-32",
      card: "border border-black/6 shadow-[0_12px_40px_rgba(0,0,0,0.04)] bg-white rounded-2xl p-12 md:p-14 max-w-2xl mx-auto",
      label: "text-xs uppercase tracking-widest font-medium text-[#2D2D2D]/50",
      input: "h-14 rounded-xl bg-[#F5F5F5] border-black/8 text-[#2D2D2D] placeholder:text-[#2D2D2D]/30 focus:ring-[#2D2D2D]/10 focus:border-[#2D2D2D]/30",
      title: "text-4xl md:text-5xl font-extralight text-[#2D2D2D] tracking-tight",
      description: "text-[#2D2D2D]/50",
    },
    story: {
      title: "text-4xl md:text-6xl font-extralight text-[#2D2D2D] text-center mb-20 tracking-tight",
      layout: "max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-14 items-center px-6",
      image: "rounded-2xl opacity-95 shadow-lg border border-black/5 transition-opacity hover:opacity-100 duration-1000",
      container: "max-w-5xl mx-auto px-6",
      body: "text-base text-[#2D2D2D]/50 leading-[1.8] font-light",
    },
    gallery: {
      section: "bg-white",
      imageRadius: "rounded-xl",
      title: "text-[#2D2D2D]",
    },
    location: {
      section: "bg-[#FAFAFA]",
      card: "border border-black/5 rounded-xl p-6 bg-white shadow-sm",
      title: "text-[#2D2D2D]",
    },
    schedule: {
      section: "",
      card: "border border-black/5 rounded-xl p-6 bg-white",
      title: "text-[#2D2D2D]",
      time: "text-[#2D2D2D]/40",
    },
    gifts: {
      section: "",
      card: "rounded-xl border border-black/5 bg-white shadow-sm",
      title: "text-[#2D2D2D]",
    },
    cagnotte: {
      section: "bg-[#FAFAFA]",
      title: "text-[#2D2D2D]",
      icon: "text-[#2D2D2D]/30",
    },
    countdown: {
      section: "bg-white",
      box: "w-18 h-18 md:w-22 md:h-22 rounded-xl bg-[#FAFAFA] border border-black/5",
      number: "text-2xl md:text-3xl font-extralight text-[#2D2D2D]",
      label: "text-xs text-[#2D2D2D]/40 mt-2 font-sans",
    },
    footer: {
      section: "bg-[#2D2D2D] text-white/80",
    },
  },
};

export function getTokens(templateId?: string): TemplateTokens {
  if (templateId && templateId in templateTokens) {
    return templateTokens[templateId as TemplateId];
  }
  return templateTokens.classic;
}
