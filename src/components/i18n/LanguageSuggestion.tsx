import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { X } from "lucide-react";
import { HREFLANG, HTML_LANG, LOCALES, localizePath, toLocale, type Locale } from "@/i18n/config";
import { readRememberedLanguage, rememberLanguage } from "./languagePreference";

// Written in the *suggested* language — the one the visitor actually reads.
const COPY: Record<Locale, { text: string; cta: string; close: string }> = {
  de: { text: "Diese Seite gibt es auch auf Deutsch.", cta: "Auf Deutsch anzeigen", close: "Schliessen" },
  fr: { text: "Cette page existe aussi en français.", cta: "Afficher en français", close: "Fermer" },
  it: { text: "Questa pagina è disponibile anche in italiano.", cta: "Mostra in italiano", close: "Chiudi" },
  en: { text: "This page is also available in English.", cta: "View in English", close: "Close" },
};

// Crawlers, link previews and testing tools, case-insensitive. Some carry no
// "bot": Google-InspectionTool (Search Console URL inspection, Rich Results
// Test), Chrome-Lighthouse (PageSpeed Insights, via "lighthouse") and
// "Google Page Speed Insights".
const BOT_UA =
  /bot|crawl|spider|slurp|google-inspectiontool|lighthouse|page ?speed|headless|preview|facebookexternalhit|embedly|quora link/i;

function preferredSupportedLocale(): Locale | null {
  const candidates = (navigator.languages && navigator.languages.length ? navigator.languages : [navigator.language]) || [];
  for (const tag of candidates) {
    const primary = String(tag || "").toLowerCase().split("-")[0];
    if ((LOCALES as readonly string[]).includes(primary)) return primary as Locale;
  }
  return null;
}

/**
 * Suggests the visitor's browser language when the page is shown in another
 * one. Deliberately NOT a redirect (Google: "avoid automatically redirecting
 * users from one language version … to a different language version"):
 * a small fixed card that never shifts the layout, disappears for good once the
 * visitor picks a language or dismisses it, and is never rendered for bots.
 */
export function LanguageSuggestion() {
  const router = useRouter();
  const current = toLocale(router.locale);
  const [suggested, setSuggested] = useState<Locale | null>(null);

  useEffect(() => {
    if (BOT_UA.test(navigator.userAgent) || (navigator as Navigator & { webdriver?: boolean }).webdriver) return;
    if (readRememberedLanguage()) return;
    const preferred = preferredSupportedLocale();
    if (preferred && preferred !== current) setSuggested(preferred);
    else setSuggested(null);
  }, [current]);

  if (!suggested) return null;

  const copy = COPY[suggested];
  const [withoutHash] = router.asPath.split("#");
  const href = localizePath(withoutHash || "/", suggested);

  return (
    <div
      role="region"
      aria-label={copy.text}
      lang={HTML_LANG[suggested]}
      className="fixed inset-x-3 z-[60] sm:inset-x-auto sm:right-4 sm:max-w-sm"
      // Sits above the cookie banner while that is open (CookieConsent
      // publishes its height), otherwise near the bottom edge.
      style={{ bottom: "calc(var(--cookie-banner-h, 0px) + 0.75rem)" }}
    >
      <div className="flex items-center gap-3 rounded-2xl border border-neutral-200 bg-white/95 px-4 py-3 text-sm text-neutral-700 shadow-xl backdrop-blur">
        <p className="flex-1 leading-snug">
          {copy.text}{" "}
          <a
            href={href}
            hrefLang={HREFLANG[suggested]}
            onClick={() => rememberLanguage(suggested)}
            className="font-semibold text-red-600 underline-offset-2 hover:underline"
          >
            {copy.cta}
          </a>
        </p>
        <button
          type="button"
          onClick={() => {
            rememberLanguage(current);
            setSuggested(null);
          }}
          className="-mr-1 rounded-full p-1.5 text-neutral-400 transition-colors hover:bg-neutral-100 hover:text-neutral-700"
          aria-label={copy.close}
        >
          <X className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}
