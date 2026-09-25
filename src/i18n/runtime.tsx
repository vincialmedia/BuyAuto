import { Fragment, cloneElement, createContext, isValidElement, useCallback, useContext, useMemo } from "react";
import type { ReactElement, ReactNode } from "react";
import { useRouter } from "next/router";
import { toLocale, type Locale } from "./config";

// How translation works
// ---------------------
// UI strings stay written in German in the components and are wrapped in t():
//
//     const t = useT();
//     <button>{t("Inserat erstellen")}</button>
//
// The German text IS the key. German pages carry no dictionary at all, so t()
// returns the key unchanged and German renders exactly as before. For fr/it/en
// every page's getStaticProps/getServerSideProps adds the dictionary of the
// current locale to its props (see ./server.ts → withI18n) and _app provides it
// here — only that one language, only the namespaces the page needs, and it
// arrives together with the page data on client-side navigation (no flash).
// A key without translation falls back to the German text, never to "".
//
// Interpolation: t("Noch {n} Tage", { n: 5 })
// Rich text:     <T k="Lies den <0>Ratgeber</0>." c={[<Link href="/x" />]} />
// Context:       t("Anmelden@@newsletter") — when one German word needs different
//                translations in different places. German (and any missing
//                translation) renders the part before "@@".

export type Messages = Record<string, string>;
export type TranslateVars = Record<string, string | number | null | undefined>;
export type TFunction = (key: string, vars?: TranslateVars) => string;

/** Shape a page's data function adds to its props for non-German locales. */
export type I18nPageProps = { __i18n?: { locale: Locale; messages: Messages } };

const EMPTY: Messages = Object.freeze({}) as Messages;

// Innermost dictionary first.
const MessagesContext = createContext<readonly Messages[]>([]);

export function MessagesProvider({ messages, children }: { messages?: Messages | null; children?: ReactNode }) {
  const parent = useContext(MessagesContext);
  const layers = useMemo(() => (messages && messages !== EMPTY ? [messages, ...parent] : parent), [messages, parent]);
  return <MessagesContext.Provider value={layers}>{children}</MessagesContext.Provider>;
}

function interpolate(text: string, vars?: TranslateVars): string {
  if (!vars) return text;
  return text.replace(/\{(\w+)\}/g, (match, name: string) => {
    const value = vars[name];
    return value === undefined || value === null ? match : String(value);
  });
}

const CONTEXT_SEPARATOR = "@@";

/** German fallback for a key: the key itself, minus an optional "@@context" suffix. */
export function fallbackText(key: string): string {
  const cut = key.indexOf(CONTEXT_SEPARATOR);
  return cut === -1 ? key : key.slice(0, cut);
}

export function lookup(layers: readonly Messages[], key: string): string {
  for (const layer of layers) {
    const hit = layer[key];
    if (typeof hit === "string" && hit.length > 0) return hit;
  }
  return fallbackText(key);
}

export function useLocale(): Locale {
  const { locale } = useRouter();
  return toLocale(locale);
}

export function useT(): TFunction {
  const layers = useContext(MessagesContext);
  return useCallback((key: string, vars?: TranslateVars) => interpolate(lookup(layers, key), vars), [layers]);
}

/** Translate outside React with an explicit dictionary (e.g. inside getStaticProps). */
export function translateWith(messages: Messages | null | undefined, key: string, vars?: TranslateVars): string {
  const hit = messages?.[key];
  return interpolate(typeof hit === "string" && hit.length > 0 ? hit : fallbackText(key), vars);
}

/**
 * Renders a translated string that contains numbered tags, e.g.
 *   "Mehr im <0>Ratgeber</0> und in den <1>FAQ</1>."
 * Each <n>…</n> is replaced by c[n] with the tag's inner text as its children.
 * A self-closing <n/> inserts c[n] as is (e.g. a <br />). Tags do not nest.
 */
export function renderRich(text: string, components: ReactElement[] = []): ReactNode {
  const parts: ReactNode[] = [];
  const re = /<(\d+)>([\s\S]*?)<\/\1>|<(\d+)\s*\/>/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let i = 0;
  while ((m = re.exec(text))) {
    if (m.index > last) parts.push(text.slice(last, m.index));
    const index = Number(m[1] ?? m[3]);
    const el = components[index];
    if (isValidElement(el)) {
      parts.push(
        m[1] !== undefined
          ? cloneElement(el as ReactElement<{ children?: ReactNode }>, { key: `rich-${i++}` }, m[2])
          : cloneElement(el, { key: `rich-${i++}` }),
      );
    } else {
      parts.push(m[2] ?? "");
    }
    last = re.lastIndex;
  }
  if (last < text.length) parts.push(text.slice(last));
  return <Fragment>{parts}</Fragment>;
}

/** Rich-text translation component. See renderRich for the tag format. */
export function T({ k, c, vars }: { k: string; c?: ReactElement[]; vars?: TranslateVars }) {
  const t = useT();
  return <>{renderRich(t(k, vars), c)}</>;
}
