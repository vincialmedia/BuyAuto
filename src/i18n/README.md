# Internationalisation (de / fr / it / en)

German (`de`) is the default language and is served **without a URL prefix,
exactly as before**. French, Italian and English are served under `/fr`, `/it`
and `/en` (Next.js built-in i18n routing, `localeDetection: false`).

**Golden rule: German output must not change.** Every German page must render
byte-for-byte the same text as before the i18n work. The only intended German
differences are the hreflang `<link>` tags in `<head>` and the language
switcher in the footer's bottom bar.

## How it works

- `src/i18n/config.ts` — locales, `absoluteUrl(path, locale)`, `localizePath`,
  `HTML_LANG`, `OG_LOCALE`, `LOCALE_LABELS`.
- `src/i18n/runtime.tsx` — `useT()`, `<T>`, `useLocale()`, `translateWith()`.
- `src/i18n/server.ts` — `withI18n(locale, namespaces)` and
  `staticI18nProps(namespaces)`: load the dictionary of the current locale in a
  page's data function. German returns `{}` (no dictionary, zero bytes).
- `src/i18n/messages/<locale>/<namespace>.json` — dictionaries. **The key is the
  exact German text**, the value is the translation.
- `_app.tsx` reads `pageProps.__i18n` and provides the dictionary.

### Wrapping strings

```tsx
import { useT, T, useLocale } from "@/i18n/runtime";

const t = useT();
<h2>{t("So funktioniert BuyAuto")}</h2>
<input placeholder={t("Marke oder Modell")} aria-label={t("Suche")} />
toast.success(t("Erfolgreich abgemeldet!"));
t("Noch {n} Tage", { n: days })            // interpolation: {name}
```

Text with inline elements (links, bold, <br />) → one key with numbered tags:

```tsx
<T
  k="Details finden Sie in unserer <0>Datenschutzerklärung</0>."
  c={[<Link href="/datenschutz" className="text-red-600 underline" />]}
/>
<T k="Raus aus dem Leasing.<0/>Ohne <1>Verlust.</1>" c={[<br />, <span className="text-red-500" />]} />
```

Rules:

0. Same German word, different meaning in different places (e.g. "Anmelden" =
   log in vs. subscribe): add a context suffix, `t("Anmelden@@newsletter")`.
   German renders the text before `@@`.
1. **Key = the German text exactly as it renders.** JSX collapses newlines and
   indentation inside text to single spaces — write the key as that single-line
   string. Keep every character: `–`, `«»`, `’`, `'`, `…`, `CHF`, non-breaking
   spaces, trailing punctuation. `&apos;` / `&quot;` / `&amp;` become `'` `"` `&`.
2. Whitespace around inline elements (`{" "}`) must be reproduced inside the
   `<T>` key so the German output is identical.
3. Data arrays defined at module level (FAQ lists, feature lists, nav links):
   keep the German strings in the array and translate at render time with
   `t(item.title)`. Hooks can only be called inside components — never call
   `useT()` at module level.
4. Strings built from pieces (`"Leasingübernahme " + brand`) → one key with a
   placeholder: `t("Leasingübernahme {brand}", { brand })`. Never translate
   fragments separately; word order differs between languages.
5. Do not translate: brand/model names, `BuyAuto`, e-mail addresses, URLs,
   CSS classes, analytics event names, values sent to the API/DB (enum values
   like `"Benzin"` stay German in data — translate only the **label** shown).
6. Numbers, prices and dates keep the existing Swiss formatting (`de-CH`,
   `CHF 1'234`, `04.08.2026`) in every language.
7. Every German key used in a component must exist in the dictionaries of all
   three languages (`fr`, `it`, `en`). A missing key silently shows German.

### Page data functions

```ts
// page without data fetching
export const getStaticProps = staticI18nProps(["pages/preise", "pricing"]);

// page with existing getStaticProps / getServerSideProps
return { props: { ...data, ...(await withI18n(context.locale, ["listing"])) } };
```

`common` and `cards` are always included. Every page must call one of the two,
otherwise its header and footer stay German in fr/it/en.

### SEO per page

- `<title>`, meta description, og/twitter tags, image `alt`, JSON-LD text:
  translate with `t()`.
- Canonical / og:url: `absoluteUrl("/the-path", locale)` — for German this is
  identical to the old hard-coded URL.
- `og:locale`: `OG_LOCALE[locale]`.
- hreflang tags are emitted centrally in `_app` (`src/i18n/seo.tsx`) for the
  static routes listed in `CONTENT_LAST_UPDATED`; dynamic pages render
  `<Hreflang path=… />` themselves when they are indexable.

### Links

`next/link` and `router.push()` automatically keep the current locale. Raw
`<a href="/…">` to internal pages and `window.location` assignments do not —
use `<Link>` or `localizePath(href, locale)`.

## Namespaces

| Namespace | Content |
|---|---|
| `common` | Header, Footer, cookie banner, newsletter, language switcher/suggestion, breadcrumbs, 404, LP footer |
| `cards` | Listing cards, search bar/form, filter bar, premium carousel, pagination, vehicle enum labels (fuel, gearbox, body, cantons) |
| `home` | Homepage + its sections (FAQ, founder story, SEO copy …) |
| `search` | /suche page |
| `listing` | Vehicle detail page and its components |
| `pricing` | /preise, pricing components, plan data |
| `wizard` | Listing wizard (/inserat-erstellen) |
| `dashboard` | Private & garage dashboards, messages |
| `auth` | Login / register / password flows |
| `dealer` | Garage microsites and embeds |
| `calculator` | Eintauschwert-Rechner, Auto-Abo-vs-Leasing calculator |
| `leasing` | Leasing company pages, brand pages |
| `pages/<slug>` | Long-form text of a single page |

## Checking

- `node scripts/i18n-check.mjs` lists German keys used in `t()`/`<T>` calls
  that are missing from any fr/it/en dictionary.
- Terminology: see `GLOSSARY.md`.
