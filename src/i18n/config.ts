// Single source of truth for the site's languages.
//
// German is the default locale and is served WITHOUT a prefix, exactly as
// before (no German URL, canonical or title changed when the other languages
// were added). French, Italian and English live under /fr, /it and /en on the
// same host. next.config.mjs mirrors LOCALES/DEFAULT_LOCALE — keep them in sync.

export const LOCALES = ["de", "fr", "it", "en"] as const;
export type Locale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: Locale = "de";

/** The non-default locales, i.e. the translated versions. */
export const TRANSLATED_LOCALES = LOCALES.filter((l) => l !== DEFAULT_LOCALE) as Exclude<Locale, "de">[];

export const SITE_URL = "https://www.buyauto.ch";

/** Value for <html lang>. Google ignores it, Bing, browsers and screen readers do not. */
export const HTML_LANG: Record<Locale, string> = {
  de: "de-CH",
  fr: "fr-CH",
  it: "it-CH",
  en: "en",
};

/** hreflang codes. Language-only on purpose: the .ch domain already signals Switzerland. */
export const HREFLANG: Record<Locale, string> = {
  de: "de",
  fr: "fr",
  it: "it",
  en: "en",
};

export const OG_LOCALE: Record<Locale, string> = {
  de: "de_CH",
  fr: "fr_CH",
  it: "it_CH",
  en: "en_GB",
};

/** Endonyms — each language is labelled in its own language, never with a flag. */
export const LOCALE_LABELS: Record<Locale, string> = {
  de: "Deutsch",
  fr: "Français",
  it: "Italiano",
  en: "English",
};

export const LOCALE_SHORT: Record<Locale, string> = {
  de: "DE",
  fr: "FR",
  it: "IT",
  en: "EN",
};

export function isLocale(value: unknown): value is Locale {
  return typeof value === "string" && (LOCALES as readonly string[]).includes(value);
}

export function toLocale(value: unknown): Locale {
  return isLocale(value) ? value : DEFAULT_LOCALE;
}

/** "/x" → "/fr/x", "/" → "/fr"; German stays unprefixed. Query and hash are preserved. */
export function localizePath(path: string, locale: Locale): string {
  const clean = path.startsWith("/") ? path : `/${path}`;
  if (locale === DEFAULT_LOCALE) return clean;
  if (clean === "/") return `/${locale}`;
  if (clean.startsWith("/?") || clean.startsWith("/#")) return `/${locale}${clean.slice(1)}`;
  return `/${locale}${clean}`;
}

/**
 * Absolute, canonical URL of `path` in `locale`.
 * German home keeps its historical canonical form "https://www.buyauto.ch/".
 */
export function absoluteUrl(path: string, locale: Locale = DEFAULT_LOCALE): string {
  const localized = localizePath(path, locale);
  return `${SITE_URL}${localized}`;
}

/** Strip a leading locale segment from a path, e.g. "/fr/suche" → "/suche". */
export function stripLocale(path: string): string {
  const match = /^\/(de|fr|it|en)(?=\/|$|\?|#)/.exec(path);
  if (!match) return path || "/";
  const rest = path.slice(match[0].length);
  if (!rest) return "/";
  return rest.startsWith("/") ? rest : `/${rest}`;
}

/** Intl locale used for number/date formatting. Swiss conventions in every language. */
export const INTL_LOCALE: Record<Locale, string> = {
  de: "de-CH",
  fr: "fr-CH",
  it: "it-CH",
  en: "en-CH",
};
