import type { Locale } from "@/i18n/config";

// The visitor's explicit language choice (made via the footer switcher, the
// suggestion banner, or by dismissing the banner). Only used to stop showing
// the suggestion — it never redirects anyone.
export const LANGUAGE_PREFERENCE_KEY = "buyauto_lang_pref";

export function rememberLanguage(locale: Locale): void {
  try {
    window.localStorage.setItem(LANGUAGE_PREFERENCE_KEY, locale);
  } catch {
    // Storage blocked (private mode, disabled cookies): the banner may simply
    // show again on the next visit.
  }
}

export function readRememberedLanguage(): string | null {
  try {
    return window.localStorage.getItem(LANGUAGE_PREFERENCE_KEY);
  } catch {
    return null;
  }
}
