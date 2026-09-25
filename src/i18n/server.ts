// Server-only: loads translation dictionaries inside getStaticProps /
// getServerSideProps. Next strips data functions (and imports used only by
// them) from the client bundle, so the JSON files never ship as JS.
import { DEFAULT_LOCALE, toLocale, type Locale } from "./config";
import type { I18nPageProps, Messages } from "./runtime";

/**
 * Namespaces:
 *  - "common" and "cards" (always loaded): header, footer, cookie banner,
 *    newsletter, language switcher, breadcrumbs ("common"); listing cards,
 *    search bar/form, filters, premium carousel, vehicle enums such as fuel,
 *    gearbox, cantons ("cards")
 *  - feature namespaces: "home", "search", "listing", "pricing", "wizard",
 *    "dashboard", "auth", "dealer", "calculator", "leasing", "messages"
 *  - "pages/<slug>": long-form text of one page
 */
export type Namespace = string;

async function loadNamespace(locale: Locale, ns: Namespace): Promise<Messages> {
  try {
    const mod = await import(`./messages/${locale}/${ns}.json`);
    return ((mod && (mod.default ?? mod)) || {}) as Messages;
  } catch {
    return {};
  }
}

export async function loadMessages(locale: Locale, namespaces: Namespace[] = []): Promise<Messages> {
  if (locale === DEFAULT_LOCALE) return {};
  // Shared namespaces are merged last, so header, footer and cards read the
  // same on every page even when a page namespace translates the same German
  // text differently. A page that needs its own wording uses an "@@context" key.
  const pageNamespaces = Array.from(new Set(namespaces)).filter((ns) => ns !== "common" && ns !== "cards");
  const dicts = await Promise.all([...pageNamespaces, "common", "cards"].map((ns) => loadNamespace(locale, ns)));
  return Object.assign({}, ...dicts) as Messages;
}

/**
 * Props fragment to spread into a page's props:
 *   return { props: { ...data, ...(await withI18n(ctx.locale, ["listing"])) } };
 * German gets {} — its pages carry no dictionary at all.
 */
export async function withI18n(localeInput: string | undefined, namespaces: Namespace[] = []): Promise<I18nPageProps> {
  const locale = toLocale(localeInput);
  if (locale === DEFAULT_LOCALE) return {};
  return { __i18n: { locale, messages: await loadMessages(locale, namespaces) } };
}

/** getStaticProps for pages that have no data of their own. */
export function staticI18nProps(namespaces: Namespace[] = []) {
  return async ({ locale }: { locale?: string }) => ({
    props: await withI18n(locale, namespaces),
  });
}
