import { createContext, useContext, useEffect, ReactNode } from "react";
import { type Wedding } from "@shared/schema";
import { resolveFontProfile } from "@/lib/font-profiles";

interface ThemeContextType {
    theme: Wedding["config"]["theme"];
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const DARK_FOREGROUND = "222 47% 11%";
const LIGHT_FOREGROUND = "0 0% 100%";

function adjustHslLightness(hsl: string, delta: number) {
    const parts = hsl.split(" ");
    if (parts.length < 3) return hsl;
    const h = parts[0];
    const s = parts[1];
    const lRaw = parts[2];
    const l = Number.parseFloat(lRaw.replace("%", ""));
    if (Number.isNaN(l)) return hsl;
    const next = Math.max(0, Math.min(100, l + delta));
    return `${h} ${s} ${next}%`;
}

function hexToHsl(hex: string) {
    const cleaned = hex.replace("#", "").trim();
    const normalized = cleaned.length === 3
        ? cleaned.split("").map((c) => c + c).join("")
        : cleaned;
    const r = parseInt(normalized.substring(0, 2), 16) / 255;
    const g = parseInt(normalized.substring(2, 4), 16) / 255;
    const b = parseInt(normalized.substring(4, 6), 16) / 255;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const delta = max - min;

    let h = 0;
    if (delta !== 0) {
        if (max === r) h = ((g - b) / delta) % 6;
        else if (max === g) h = (b - r) / delta + 2;
        else h = (r - g) / delta + 4;
        h = Math.round(h * 60);
        if (h < 0) h += 360;
    }

    const l = (max + min) / 2;
    const s = delta === 0 ? 0 : delta / (1 - Math.abs(2 * l - 1));

    const hRound = Math.round(h);
    const sRound = Math.round(s * 100);
    const lRound = Math.round(l * 100);

    return `${hRound} ${sRound}% ${lRound}%`;
}

function getForegroundFor(hex: string) {
    const cleaned = hex.replace("#", "").trim();
    const normalized = cleaned.length === 3
        ? cleaned.split("").map((c) => c + c).join("")
        : cleaned;
    const r = parseInt(normalized.substring(0, 2), 16) / 255;
    const g = parseInt(normalized.substring(2, 4), 16) / 255;
    const b = parseInt(normalized.substring(4, 6), 16) / 255;
    const luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b;
    return luminance > 0.6 ? DARK_FOREGROUND : LIGHT_FOREGROUND;
}

export function ThemeProvider({
    wedding,
    children
}: {
    wedding: Wedding;
    children: ReactNode
}) {
    const theme = wedding.config.theme;

    useEffect(() => {
        const root = document.documentElement;
        const fontProfile = resolveFontProfile(theme.fontFamily || "serif");
        const primaryHsl = hexToHsl(theme.primaryColor || "#C8A96A");
        const secondaryHsl = hexToHsl(theme.secondaryColor || "#FFFFFF");
        const backgroundHsl = adjustHslLightness(secondaryHsl, -1);
        const cardHsl = adjustHslLightness(secondaryHsl, 0);
        const mutedHsl = adjustHslLightness(secondaryHsl, -3);
        root.style.setProperty("--primary", primaryHsl);
        root.style.setProperty("--secondary", secondaryHsl);
        root.style.setProperty("--background", backgroundHsl);
        root.style.setProperty("--card", cardHsl);
        root.style.setProperty("--popover", cardHsl);
        root.style.setProperty("--accent", secondaryHsl);
        root.style.setProperty("--muted", mutedHsl);
        root.style.setProperty("--ring", primaryHsl);
        root.style.setProperty("--primary-foreground", getForegroundFor(theme.primaryColor || "#C8A96A"));
        root.style.setProperty("--secondary-foreground", getForegroundFor(theme.secondaryColor || "#FFFFFF"));
        root.style.setProperty("--font-primary", fontProfile.serif);
        root.style.setProperty("--font-serif", fontProfile.serif);
        root.style.setProperty("--font-sans", fontProfile.sans);
        root.style.setProperty("--button-radius", theme.buttonRadius === "square" ? "0.5rem" : theme.buttonRadius === "rounded" ? "0.9rem" : "9999px");

        root.style.setProperty("transition", "all 0.3s ease-in-out");
    }, [theme]);

    const fontProfile = resolveFontProfile(theme.fontFamily || "serif");

    return (
        <ThemeContext.Provider value={{ theme }}>
            <div className={`theme-font-${theme.fontFamily || "serif"} ${fontProfile.baseClass} template-${wedding.templateId || "classic"} min-h-screen bg-background text-foreground`}>
                {children}
            </div>
        </ThemeContext.Provider>
    );
}

export function useTheme() {
    const context = useContext(ThemeContext);
    if (!context) {
        throw new Error("useTheme must be used within a ThemeProvider");
    }
    return context;
}
