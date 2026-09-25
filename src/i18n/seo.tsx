import Head from "next/head";
import { CONTENT_LAST_UPDATED } from "@/lib/buyauto/contentDates";
import { DEFAULT_LOCALE, HREFLANG, LOCALES, absoluteUrl, type Locale } from "./config";

/**
 * hreflang cluster for one page: every language version lists itself and all
 * others (fully-qualified URLs), plus x-default → the German original.
 * Only render this on pages that are indexable in every listed language —
 * hreflang must point at canonical, indexable 200 URLs.
 */
export function Hreflang({ path, locales = LOCALES }: { path: string; locales?: readonly Locale[] }) {
  return (
    <Head>
      {locales.map((l) => (
        <link key={`hreflang-${l}`} rel="alternate" hrefLang={HREFLANG[l]} href={absoluteUrl(path, l)} />
      ))}
      <link key="hreflang-x-default" rel="alternate" hrefLang="x-default" href={absoluteUrl(path, DEFAULT_LOCALE)} />
    </Head>
  );
}

/**
 * Static routes that are indexable and translated in every language. These get
 * their hreflang cluster from _app automatically (keyed by router.pathname).
 * /suche is excluded on purpose: its canonical depends on the query, so the
 * page renders its own cluster for its indexable views.
 */
export const AUTO_HREFLANG_ROUTES: ReadonlySet<string> = new Set(
  Object.keys(CONTENT_LAST_UPDATED).filter((p) => p !== "/suche"),
);
