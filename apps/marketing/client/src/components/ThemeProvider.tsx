import { createContext, useContext, useEffect, ReactNode } from "react";
import { type Wedding } from "@shared/schema";

interface ThemeContextType {
    theme: Wedding["config"]["theme"];
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

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
        root.style.setProperty("--primary-color", theme.primaryColor);
        root.style.setProperty("--secondary-color", theme.secondaryColor);
        root.style.setProperty("--font-primary", theme.fontFamily === 'serif' ? '"Playfair Display", serif' : '"Inter", sans-serif');

        // Smooth transitions for theme changes
        root.style.setProperty("transition", "all 0.3s ease-in-out");
    }, [theme]);

    return (
        <ThemeContext.Provider value={{ theme }}>
            <div className={`theme-${theme.fontFamily} min-h-screen bg-background text-foreground`}>
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
