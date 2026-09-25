import { Fragment } from "react";
import { useRouter } from "next/router";
import { Globe } from "lucide-react";
import { HREFLANG, HTML_LANG, LOCALES, LOCALE_LABELS, localizePath, toLocale } from "@/i18n/config";
import { useT } from "@/i18n/runtime";
import { cn } from "@/lib/utils";
import { rememberLanguage } from "./languagePreference";

/**
 * Current path without locale, hash — and without the query until the router is
 * ready. Statically generated pages render without a query on the server, so
 * using it before hydration would make server and client hrefs disagree.
 */
function useCurrentPath(): string {
  const router = useRouter();
  const [withoutHash] = router.asPath.split("#");
  if (!router.isReady) return withoutHash.split("?")[0] || "/";
  return withoutHash || "/";
}

/**
 * Footer language links. Plain <a href> on purpose: crawlable links to the
 * *same page* in every language (Google's recommendation), labelled with each
 * language's own name, and a full page load so the new language arrives with
 * its own server-rendered HTML.
 */
export function LanguageSwitcher({ className, tone = "dark" }: { className?: string; tone?: "dark" | "light" }) {
  const router = useRouter();
  const t = useT();
  const current = toLocale(router.locale);
  const path = useCurrentPath();

  const idle = tone === "dark" ? "text-neutral-400 hover:text-white" : "text-neutral-500 hover:text-neutral-900";
  const active = tone === "dark" ? "text-white" : "text-neutral-900";
  const muted = tone === "dark" ? "text-neutral-600" : "text-neutral-300";

  return (
    <nav aria-label={t("Sprache wählen")} className={cn("flex items-center gap-2 text-sm", className)}>
      <Globe className={cn("h-4 w-4 shrink-0", tone === "dark" ? "text-neutral-500" : "text-neutral-400")} aria-hidden="true" />
      <ul className="flex flex-wrap items-center gap-x-2 gap-y-1">
        {LOCALES.map((locale, index) => (
          <Fragment key={locale}>
            {index > 0 ? (
              <li aria-hidden="true" className={muted}>
                ·
              </li>
            ) : null}
            <li>
              {locale === current ? (
                <span aria-current="true" lang={HTML_LANG[locale]} className={cn("font-semibold", active)}>
                  {LOCALE_LABELS[locale]}
                </span>
              ) : (
                <a
                  href={localizePath(path, locale)}
                  hrefLang={HREFLANG[locale]}
                  lang={HTML_LANG[locale]}
                  onClick={() => rememberLanguage(locale)}
                  className={cn("transition-colors", idle)}
                >
                  {LOCALE_LABELS[locale]}
                </a>
              )}
            </li>
          </Fragment>
        ))}
      </ul>
    </nav>
  );
}
