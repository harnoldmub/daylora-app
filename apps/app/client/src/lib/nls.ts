import { NLS_EN } from "./nls_en";
import { NLS_FR } from "./nls_fr";

export function getAppNls(language?: string) {
  return language === "en" ? NLS_EN : NLS_FR;
}
