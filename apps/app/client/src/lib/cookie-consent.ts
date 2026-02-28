const STORAGE_KEY = "daylora_cookie_consent";
const CONSENT_VERSION = 1;

export type CookieCategory = "necessary" | "analytics" | "marketing";

export interface CookieConsent {
  version: number;
  timestamp: string;
  categories: Record<CookieCategory, boolean>;
}

const DEFAULT_CONSENT: CookieConsent = {
  version: CONSENT_VERSION,
  timestamp: new Date().toISOString(),
  categories: {
    necessary: true,
    analytics: false,
    marketing: false,
  },
};

export function getConsent(): CookieConsent | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CookieConsent;
    if (parsed.version !== CONSENT_VERSION) return null;
    parsed.categories.necessary = true;
    return parsed;
  } catch {
    return null;
  }
}

export function setConsent(prefs: Partial<Record<CookieCategory, boolean>>): void {
  const consent: CookieConsent = {
    version: CONSENT_VERSION,
    timestamp: new Date().toISOString(),
    categories: {
      necessary: true,
      analytics: prefs.analytics ?? false,
      marketing: prefs.marketing ?? false,
    },
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(consent));
}

export function hasConsented(): boolean {
  return getConsent() !== null;
}

export function canLoadCategory(category: CookieCategory): boolean {
  if (category === "necessary") return true;
  const consent = getConsent();
  if (!consent) return false;
  return consent.categories[category] ?? false;
}

export function acceptAll(): void {
  setConsent({ necessary: true, analytics: true, marketing: true });
}

export function rejectAll(): void {
  setConsent({ necessary: true, analytics: false, marketing: false });
}

const ACTIVE_NON_NECESSARY: CookieCategory[] = [];

export function registerCategory(category: CookieCategory): void {
  if (category !== "necessary" && !ACTIVE_NON_NECESSARY.includes(category)) {
    ACTIVE_NON_NECESSARY.push(category);
  }
}

export function hasNonNecessaryCategories(): boolean {
  return ACTIVE_NON_NECESSARY.length > 0;
}

export function getActiveNonNecessaryCategories(): CookieCategory[] {
  return [...ACTIVE_NON_NECESSARY];
}
