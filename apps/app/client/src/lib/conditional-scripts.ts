import { canLoadCategory, registerCategory, type CookieCategory } from "./cookie-consent";

export function loadScriptIfConsented(
  category: CookieCategory,
  scriptUrl: string,
  attributes?: Record<string, string>,
): Promise<HTMLScriptElement | null> {
  registerCategory(category);
  if (!canLoadCategory(category)) {
    return Promise.resolve(null);
  }

  return new Promise((resolve, reject) => {
    const existing = document.querySelector(`script[src="${scriptUrl}"]`);
    if (existing) {
      resolve(existing as HTMLScriptElement);
      return;
    }

    const script = document.createElement("script");
    script.src = scriptUrl;
    script.async = true;

    if (attributes) {
      for (const [key, value] of Object.entries(attributes)) {
        script.setAttribute(key, value);
      }
    }

    script.onload = () => resolve(script);
    script.onerror = () => reject(new Error(`Failed to load script: ${scriptUrl}`));

    document.head.appendChild(script);
  });
}
