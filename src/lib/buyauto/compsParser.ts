// Tolerant extraction of price/mileage pairs from Swiss vehicle-listing text
// (search-result titles/descriptions or scraped page markdown). Pure functions,
// no I/O — kept separate from the API route so the parsing is testable on its own.

export interface ParsedComp {
  price: number;
  km: number;
  year: number | null;   // first year token, for display only
  years: number[];       // ALL year tokens — year filtering must check all of them
}

// Swiss listings write numbers as 18'900, 18’900, 18.900, 18,900 or 18 900.
// Strict grouped-thousands (separator must be followed by exactly 3 digits) or a
// plain digit run — anything looser greedily spans neighbouring numbers like
// "2020, 45'000" and swallows both.
const NUM = "(?:\\d{1,3}(?:['’.,\\u00a0 ]\\d{3})+|\\d+)";

// Left guard: a capture must not start in the middle of a number ("2018 120'000"
// must not yield "018 120'000"), after a separator ("150'000" must not yield a
// trailing "000"), after "/" (l/100km) or "-" (0-100 km, 10'000-150'000 km ranges).
const NOT_MID_NUMBER = "(?<![\\d'’.,/\\-])";

// "CHF 18'900.-", "CHF 18’900.–", "Fr. 18'900", "18'900 CHF"
const PRICE_BEFORE = new RegExp(`(?:CHF|Fr\\.)\\s*(${NUM})`, "gi");
const PRICE_AFTER = new RegExp(`${NOT_MID_NUMBER}(${NUM})\\s*(?:CHF|Fr\\.)`, "gi");
// "45'000 km", "45’000km", "Kilometerstand 45'000 km" — but NOT "0-100 km/h",
// "l/100km" or "10'000-150'000 km" range tails.
const KM = new RegExp(`${NOT_MID_NUMBER}(${NUM})\\s*km\\b(?!\\s*/)`, "gi");
const YEAR = /\b(19[89]\d|20[0-4]\d)\b/g;

export const MIN_PRICE = 1_000;
export const MAX_PRICE = 500_000;
export const MIN_KM = 0;
export const MAX_KM = 500_000;

function normalizeNumber(raw: string): number {
  const n = Number(raw.replace(/\D/g, ""));
  return Number.isFinite(n) ? n : NaN;
}

function collect(regex: RegExp, text: string): number[] {
  const out: number[] = [];
  regex.lastIndex = 0;
  let m: RegExpExecArray | null;
  while ((m = regex.exec(text)) !== null) {
    const n = normalizeNumber(m[1]);
    if (!Number.isNaN(n)) out.push(n);
  }
  return out;
}

export function extractPrices(text: string): number[] {
  const all = [...collect(PRICE_BEFORE, text), ...collect(PRICE_AFTER, text)];
  return all.filter((n) => n >= MIN_PRICE && n <= MAX_PRICE);
}

export function extractKms(text: string): number[] {
  return collect(KM, text).filter((n) => n >= MIN_KM && n <= MAX_KM);
}

export function extractYears(text: string): number[] {
  const out: number[] = [];
  YEAR.lastIndex = 0;
  let m: RegExpExecArray | null;
  while ((m = YEAR.exec(text)) !== null) out.push(Number(m[1]));
  return out;
}

/**
 * Extract one price/km pair from a blob of listing text (snippet or page).
 * Returns null unless BOTH a plausible price and a plausible mileage are found.
 * When several candidates exist, the first price and the first km value that is
 * not identical to the price are used (protects against a malformed listing text
 * where the price digits get re-captured as mileage).
 */
export function parseListingText(text: string): ParsedComp | null {
  if (!text) return null;
  const prices = extractPrices(text);
  const kms = extractKms(text);
  if (prices.length === 0 || kms.length === 0) return null;

  const price = prices[0];
  const km = kms.find((k) => k !== price) ?? kms[0];

  const years = extractYears(text);
  return { price, km, year: years.length > 0 ? years[0] : null, years };
}

// Spec-table labels on detail pages: "Kilometerstand 78'000 km", "Kilometer: 78'000".
const LABELED_KM = new RegExp(`Kilometer(?:stand)?[^0-9]{0,20}(${NUM})\\s*km\\b`, "i");

/**
 * Portal markdown is drowning in inline images — AutoScout24 embeds 1'500+ char
 * data-URI SVGs per image. They blow the card windows, hide nested listing links
 * ([![img](data:...)](url) is invisible to a naive link regex) and push the real
 * content past any parse budget. Strip ALL image tokens before parsing.
 */
export function stripMarkdownImages(markdown: string): string {
  return markdown.replace(/!\[[^\]]*\]\([^)]*\)/g, " ");
}

/**
 * Parse a scraped INDIVIDUAL listing page (URL already verified as a detail
 * page). Unlike snippet parsing this reads the whole page and tolerates many
 * prices (financing offers, "similar vehicles" widgets): the car's own price is
 * the first CHF amount, and the mileage prefers the labeled spec-table value
 * over the first bare "... km" occurrence.
 */
export function parseDetailMarkdown(markdown: string): ParsedComp | null {
  if (!markdown) return null;
  // Generous budget: the Kilometerstand spec table sits mid-page and a 20k cap
  // demonstrably cut it off on real AutoScout24 pages.
  const text = stripMarkdownImages(markdown).slice(0, 35_000);

  const prices = extractPrices(text);
  if (prices.length === 0) return null;
  const price = prices[0];

  const labeled = LABELED_KM.exec(text);
  let km: number | null = null;
  if (labeled) {
    const n = Number(labeled[1].replace(/\D/g, ""));
    if (Number.isFinite(n) && n >= MIN_KM && n <= MAX_KM) km = n;
  }
  if (km === null) {
    const kms = extractKms(text);
    km = kms.find((k) => k !== price) ?? kms[0] ?? null;
  }
  if (km === null) return null;

  const years = extractYears(text.slice(0, 4_000));
  return { price, km, year: years.length > 0 ? years[0] : null, years };
}

/**
 * True when ANY year found in the listing text is within `tolerance` of the
 * target (or when no year was detectable). Listing text routinely contains
 * unrelated years — "MFK 03.2025", "Garantie bis 2027" — so requiring the FIRST
 * token to match would silently drop valid comps.
 */
export function yearMatches(comp: ParsedComp, targetYear: number, tolerance = 2): boolean {
  if (comp.years.length === 0) return true;
  return comp.years.some((y) => Math.abs(y - targetYear) <= tolerance);
}

// --- Listing-URL classification ---
//
// A comp must be ONE car, not a model-overview or search page ("548 VW Golf ab
// CHF 9'900"). Strict allowlist: only hosts whose individual-listing path shape
// we KNOW are accepted, and the URL must match that shape. Hosts without a known
// detail pattern are rejected outright — a category page sneaking in as a comp
// (teaser minimum prices) skews the valuation far worse than a missed listing.
const DETAIL_PATH_PATTERNS: Array<{ host: string; detail: RegExp; exclude?: RegExp }> = [
  // autoscout24.ch/de/d/vw-golf-...-10826494 (also /fr/d/, /it/d/)
  { host: "autoscout24.ch", detail: /\/d\// },
  // tutti.ch car listings exist in TWO shapes: /de/vi/{region}/fahrzeuge/autos/
  // {slug}/{id} and the older /de/vi/{slug}/{id}. Accept /vi/ but never the
  // non-car categories (wheels, parts, motorbikes, ...).
  {
    host: "tutti.ch",
    detail: /\/vi\//,
    exclude: /\/(autozubehoer|ersatzteile|motorraeder|motorradzubehoer|velos|wohnmobile|nutzfahrzeuge|boote)\//,
  },
  // anibis.ch/de/d/...
  { host: "anibis.ch", detail: /\/d\// },
  // comparis.ch/carfinder/marktplatz/details/show/12345
  { host: "comparis.ch", detail: /\/details\/show\// },
  // autolina.ch/en/vw/golf/golf-1.5-tsi-act-life (lang/make/model/listing-slug)
  { host: "autolina.ch", detail: /^\/[a-z]{2}\/[^/]+\/[^/]+\/[^/]+/ },
  // our own listing detail pages
  { host: "buyauto.ch", detail: /\/fahrzeug\// },
];

// Harvestable category/inventory pages — a strict allowlist just like details.
// (The earlier "on a marketplace but not a detail page" heuristic let tutti
// accessory ads pose as category pages and burn the scrape budget.)
const CATEGORY_PATH_PATTERNS: Array<{ host: string; category: RegExp }> = [
  // /de/s/mo-golf/mk-vw, /de/autos/vw--golf, /de/auto-modelle/vw--golf
  { host: "autoscout24.ch", category: /\/(s|autos|auto-modelle|modeles-voitures)\// },
  // /carfinder/marktplatz/vw/golf/occasion (but not /details/show/)
  { host: "comparis.ch", category: /\/carfinder\// },
  // /de/li/... search-result pages
  { host: "tutti.ch", category: /\/li\// },
  // /en/vw/golf (lang/make/model, exactly 3 segments)
  { host: "autolina.ch", category: /^\/[a-z]{2}\/[^/]+\/[^/]+\/?$/ },
];

function hostOf(url: string): { host: string; parsed: URL } | null {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return null;
  }
  return { host: parsed.hostname.replace(/^www\./, ""), parsed };
}

/**
 * Returns the marketplace host (e.g. "autoscout24.ch") when the URL matches a
 * KNOWN individual-listing path shape on a Swiss marketplace, null otherwise.
 */
export function identifyListingUrl(url: string): string | null {
  const h = hostOf(url);
  if (!h) return null;
  const known = DETAIL_PATH_PATTERNS.find(
    (p) => h.host === p.host || h.host.endsWith(`.${p.host}`)
  );
  if (!known) return null;
  if (!known.detail.test(h.parsed.pathname)) return null;
  if (known.exclude && known.exclude.test(h.parsed.pathname)) return null;
  return known.host;
}

/**
 * Returns the marketplace host when the URL matches a KNOWN harvestable
 * category/inventory page shape (and is not an individual listing).
 */
export function identifyCategoryUrl(url: string): string | null {
  const h = hostOf(url);
  if (!h) return null;
  if (identifyListingUrl(url)) return null; // individual listing
  const known = CATEGORY_PATH_PATTERNS.find(
    (p) => h.host === p.host || h.host.endsWith(`.${p.host}`)
  );
  if (!known) return null;
  return known.category.test(h.parsed.pathname) ? known.host : null;
}

// --- Category-page harvesting ---
//
// A marketplace category/model-overview page IS a list of individual listings —
// price and mileage per card. One scrape of it yields many comps at once. The
// markdown structure is "link to detail page, then that card's specs" repeated,
// so we window the text between consecutive detail links and parse each window.

export interface CategoryComp extends ParsedComp {
  title: string;
  url: string;
}

const MD_LINK = /\[([^\]]*)\]\((https?:\/\/[^)\s]+|\/[^)\s]+)\)/g;
const MAX_CARD_WINDOW = 800;
// Parse the WHOLE page, not just the first screenful: aggregators sort by their
// own score and the newest cars can sit at the bottom — a low cap starved the
// year filter of matching cards (comparis page 1 led with 2006-2015 cars).
const MAX_CATEGORY_COMPS = 60;

/**
 * Generic gallery/UI link labels that are NOT a listing title. autolina cards
 * link the photo carousel with "View more images", which was ending up as the
 * displayed comp title (and, worse, made the listing untypeable for the trim
 * filter). Anchored: "Kaufen" alone is junk, "VW Golf 1.5 TSI … Kaufen" is not.
 */
const JUNK_CARD_TITLE =
  /^(view (all |more )?(images?|photos?|pictures?|details|gallery)|mehr bilder|weitere bilder|bilder( ansehen)?|foto(s|grafien)?|details( ansehen)?|zum inserat|mehr( infos| erfahren)?|ansehen|kaufen|occasion)$/i;

/** Engine-code tokens; used to locate the displacement pair inside a URL slug. */
const ENGINE_TOKEN = /^(e?tsi|tdi|tfsi|fsi|cdi|dci|hdi|thp|crdi|mhev|phev|hybrid|bluemotion|bluem)$/i;

/** Acronyms that should stay uppercase when a title is rebuilt from a URL slug. */
const TITLE_ACRONYMS = new Set([
  "tsi", "etsi", "tdi", "tfsi", "fsi", "cdi", "dci", "hdi", "thp", "crdi",
  "gti", "gtd", "gte", "dsg", "suv", "4x4", "act", "bmt", "amg", "vw", "bmw", "s", "r",
]);

/**
 * Rebuild a readable title from a listing URL slug — the fallback when the card's
 * link text is junk. autolina: /en/vw/golf/golf-1.5-tsi-act-life; AutoScout24:
 * /de/d/vw-golf-1-5-tsi-highline-10826494 (trailing id stripped). Digit pairs
 * that precede an engine token are rejoined ("1-5-tsi" -> "1.5 TSI") — anchored
 * on the engine token so a generation number ("golf-7-1-5-tsi") is not merged
 * into a bogus "7.1".
 */
export function titleFromListingUrl(url: string): string {
  let slug: string;
  try {
    const segs = new URL(url).pathname.split("/").filter(Boolean);
    if (segs.length === 0) return "";
    slug = segs[segs.length - 1];
    // A purely numeric last segment (comparis /details/show/12345) carries nothing.
    if (/^\d+$/.test(slug)) return "";
  } catch {
    return "";
  }
  // Trailing marketplace id: "vw-golf-1-5-tsi-highline-10826494".
  slug = slug.replace(/\.(html?|php)$/i, "").replace(/-\d{4,}$/, "");
  const tokens = slug.split(/[-_]/).filter(Boolean);
  if (tokens.length === 0) return "";

  // Rejoin the displacement pair sitting directly before an engine token.
  const merged: string[] = [];
  for (let i = 0; i < tokens.length; i++) {
    const isPair =
      /^[1-9]$/.test(tokens[i]) &&
      /^\d$/.test(tokens[i + 1] ?? "") &&
      ENGINE_TOKEN.test(tokens[i + 2] ?? "");
    if (isPair) {
      merged.push(`${tokens[i]}.${tokens[i + 1]}`);
      i += 1;
      continue;
    }
    merged.push(tokens[i]);
  }

  return merged
    .map((t) =>
      TITLE_ACRONYMS.has(t.toLowerCase())
        ? t.toUpperCase()
        : t.charAt(0).toUpperCase() + t.slice(1)
    )
    .join(" ")
    .trim();
}

/** Link text on card-style pages carries markdown noise and the whole spec block. */
function cleanCardTitle(linkText: string): string {
  let t = linkText
    .replace(/\\+/g, " ")
    .replace(/\*\*/g, "")
    .replace(/[\n\r]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  // The card's own specs (price onward) belong to the card, not the title.
  const chf = t.search(/\b(?:CHF|Fr\.)/);
  if (chf > 0) t = t.slice(0, chf).trim();
  // Drop leading UI verbs ("Merken ") that precede the model name.
  t = t.replace(/^(Merken|Vergleichen|Details)\s+/i, "");
  // A pure gallery/UI label is not a title — signal "no title" to the caller.
  return JUNK_CARD_TITLE.test(t) ? "" : t;
}

/**
 * Extract individual listings (price/km/title/url) from a scraped category page.
 * `pageUrl` resolves relative links. Consecutive anchors to the SAME listing
 * (image link + title link) are merged into one card.
 */
export function parseCategoryMarkdown(rawMarkdown: string, pageUrl: string): CategoryComp[] {
  if (!rawMarkdown) return [];
  const markdown = stripMarkdownImages(rawMarkdown);

  // Locate all links to individual listing pages, with their positions. The RAW
  // link text feeds the parser (card-style pages put price/km inside it); the
  // CLEANED text is only for display.
  const anchors: Array<{
    rawText: string;
    labels: string[];
    url: string;
    end: number;
    start: number;
  }> = [];
  MD_LINK.lastIndex = 0;
  let m: RegExpExecArray | null;
  while ((m = MD_LINK.exec(markdown)) !== null) {
    let href: string;
    try {
      href = new URL(m[2], pageUrl).toString();
    } catch {
      continue;
    }
    if (!identifyListingUrl(href)) continue;
    const prev = anchors[anchors.length - 1];
    const rawText = m[1].replace(/[!\[\]]/g, "");
    if (prev && prev.url === href.split("#")[0]) {
      // Same listing linked twice (photo link + title link). KEEP the text
      // between the two anchors — that is where the card's price/km usually
      // sits; skipping it silently dropped the whole card. Every label is
      // retained so the title can prefer the real one over a gallery label.
      prev.rawText = `${prev.rawText} ${markdown.slice(prev.end, m.index)} ${rawText}`;
      prev.labels.push(rawText);
      prev.end = m.index + m[0].length;
      continue;
    }
    anchors.push({
      rawText,
      labels: [rawText],
      url: href.split("#")[0],
      start: m.index,
      end: m.index + m[0].length,
    });
  }

  const out: CategoryComp[] = [];
  const seen = new Set<string>();
  for (let i = 0; i < anchors.length && out.length < MAX_CATEGORY_COMPS; i++) {
    const a = anchors[i];
    if (seen.has(a.url)) continue;

    // The card's specs live in the link text and/or between this link and the
    // next one (the card ends where the next listing's link starts).
    const windowEnd = Math.min(
      i + 1 < anchors.length ? anchors[i + 1].start : markdown.length,
      a.end + MAX_CARD_WINDOW
    );
    const cardText = `${a.rawText} ${markdown.slice(a.end, windowEnd)}`;
    const parsed = parseListingText(cardText);
    if (!parsed) continue;

    seen.add(a.url);
    // Prefer the first label that is a real title (a card often links the photo
    // with a gallery label AND the name with the real one). When every label is
    // junk, rebuild from the URL slug — on autolina/AS24 it carries the model
    // AND the trim, so the comp stays identifiable for the trim filter.
    let title = "";
    for (const label of a.labels) {
      title = cleanCardTitle(label);
      if (title) break;
    }
    if (!title) title = titleFromListingUrl(a.url);
    out.push({ ...parsed, title: title.slice(0, 120) || "Inserat", url: a.url });
  }
  return out;
}

/**
 * AutoScout24's own listing titles mark brand-new cars as ", Neu," — those are
 * dead stock-listing zombies in the search index or new cars, never trade-in
 * comps. (Deliberately narrow: a used listing saying "neu bereift" must pass.)
 */
export function isNewVehicleText(text: string): boolean {
  return /,\s*neu\s*[,.]/i.test(text);
}

/**
 * The live AutoScout24 model-overview page, built deterministically from
 * make/model — e.g. ("VW", "Golf Plus") -> .../de/s/mo-golf-plus/mk-vw.
 * Engine/trim tokens ("1.5", "TSI", "R-Line") are stripped: category slugs are
 * BASE model names. Verified URL shape: autoscout24.ch/de/s/mo-golf/mk-vw.
 */
// Only a DECIMAL number is a displacement ("1.5"). A bare integer is part of the
// model designation for many makes — stripping it turned "C 220 d" into "C d".
const TRIM_TOKEN =
  /^(\d+\.\d+|e-?tsi|tsi|tdi|tfsi|fsi|cdi|dci|hdi|thp|crdi|puretech|bluehdi|ecoboost|tce|skyactiv|multijet|bluetec|bluemotion|dsg|cvt|mhev|phev|evo|4motion|quattro|xdrive|gti|gtd|gte|r-line|life|style|comfortline|highline|trendline)$/i;

/**
 * Strip diacritics generically via Unicode decomposition — the old hand-written
 * list missed exactly the makes our vehicle DB stores: "Škoda" became "koda" and
 * "Citroën" became "citro-n", i.e. 404 inventory URLs.
 */
const marketplaceSlug = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/ß/gi, "ss")
    .replace(/ø/gi, "o")
    .replace(/æ/gi, "ae")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

/**
 * "Golf 1.5 TSI" -> "Golf": strips engine/trim tokens to the BASE model name.
 * Used both for category-page slugs and to BROADEN discovery searches — a
 * site-scoped search for the full trim ("Golf 1.5 TSI") is far too narrow and
 * starves the funnel; searching the base model and then ranking by trim
 * precision (see modelPrecision) yields many more candidates without losing the
 * exact-trim ones.
 */
export function baseModel(model: string): string {
  const tokens = model.split(/\s+/).filter(Boolean);
  const baseTokens = tokens.filter((t) => !TRIM_TOKEN.test(t));
  return (baseTokens.length > 0 ? baseTokens : tokens.slice(0, 1)).join(" ");
}

/**
 * The portals' own make slugs differ from the names in our vehicle DB, which
 * stores "Volkswagen" and "Mercedes" — both verified inventory URLs above use
 * `vw` / `mercedes-benz`. Passing the raw DB name built a 404 and silently
 * killed the highest-yield comp source (the inventory pages), leaving only the
 * handful of individual listings we can afford to scrape. Map the known
 * mismatches; every other make slugifies cleanly.
 */
const PORTAL_MAKE_SLUG: Record<string, string> = {
  vw: "vw",
  volkswagen: "vw",
  mercedes: "mercedes-benz",
  "mercedes-benz": "mercedes-benz",
  "vw-nutzfahrzeuge": "vw",
};

export function portalMakeSlug(make: string): string {
  const slug = marketplaceSlug(make);
  return PORTAL_MAKE_SLUG[slug] ?? slug;
}

/** Optional server-side filters for the inventory URLs. */
export interface CategoryFilters {
  yearFrom?: number;
  yearTo?: number;
  kmFrom?: number;
  kmTo?: number;
  body?: BodyType | null;
}

/**
 * AutoScout24's own body-type enum (SMG API spec). Only positively known
 * mappings — an unmapped body simply leaves the URL unfiltered rather than
 * risking a 0-result page. Roadster/Targa are classed as Cabriolet on AS24.
 */
const AS24_BODY_SLUG: Partial<Record<BodyType, string>> = {
  coupe: "coupe",
  cabrio: "cabriolet",
  roadster: "cabriolet",
  targa: "cabriolet",
  kombi: "estate",
  limousine: "saloon",
  suv: "suv",
};

export function as24CategoryUrl(make: string, model: string, filters?: CategoryFilters): string {
  const base = `https://www.autoscout24.ch/de/s/mo-${marketplaceSlug(baseModel(model))}/mk-${portalMakeSlug(make)}`;
  if (!filters) return base;
  // Param names verified against SMG's official autoscout24-api-specs repo and
  // working third-party scrapers (firstRegistrationYearFrom/To, mileageFrom/To,
  // bodyTypes[0]) — the server filters the inventory before we ever scrape it.
  const params = new URLSearchParams();
  if (filters.yearFrom) params.set("firstRegistrationYearFrom", String(filters.yearFrom));
  if (filters.yearTo) params.set("firstRegistrationYearTo", String(filters.yearTo));
  if (filters.kmFrom !== undefined && filters.kmFrom > 0) params.set("mileageFrom", String(filters.kmFrom));
  if (filters.kmTo !== undefined && filters.kmTo > 0) params.set("mileageTo", String(filters.kmTo));
  const bodySlug = filters.body ? AS24_BODY_SLUG[filters.body] : undefined;
  if (bodySlug) params.set("bodyTypes[0]", bodySlug);
  const qs = params.toString();
  return qs ? `${base}?${qs}` : base;
}

/**
 * Comparis facets are PATH segments, not query params, and only the body-type
 * segments below are verified (via server-side result counts on indexed pages).
 * Year/km ranges are not URL-addressable on comparis — they stay client-side.
 */
const COMPARIS_BODY_SEGMENT: Partial<Record<BodyType, string>> = {
  coupe: "coupe-aufbau",
  cabrio: "cabrio",
  roadster: "cabrio",
  targa: "cabrio",
};

/** Verified shape: comparis.ch/carfinder/marktplatz/vw/golf/occasion (aggregates all portals). */
export function comparisCategoryUrl(make: string, model: string, filters?: CategoryFilters): string {
  const bodySegment = filters?.body ? COMPARIS_BODY_SEGMENT[filters.body] : undefined;
  const facet = bodySegment ?? "occasion";
  return `https://www.comparis.ch/carfinder/marktplatz/${portalMakeSlug(make)}/${marketplaceSlug(baseModel(model))}/${facet}`;
}

/**
 * Third deterministic inventory page. Its cards carry the trim in the listing
 * slug (golf-1.5-tsi-act-life), which makes it the highest-confidence source for
 * the engine check — the other portals often title a card with nothing but the
 * equipment line.
 *
 * `/en/`, not `/de/`: every autolina URL this scraper has actually seen in the
 * wild is the English tree (which is also what the "View more images" junk-label
 * handling in cleanCardTitle was built against). Prices and mileage parse
 * identically either way.
 */
export function autolinaCategoryUrl(make: string, model: string): string {
  return `https://www.autolina.ch/en/${portalMakeSlug(make)}/${marketplaceSlug(baseModel(model))}`;
}

/**
 * How precisely a listing title matches the requested model: 0 = full model
 * string (incl. trim) present, 1 = base model word present, 2 = no match info.
 * Whitespace-insensitive so "1.5tsi" matches "1.5 TSI".
 */
export function modelPrecision(title: string, model: string): number {
  const norm = (s: string) => s.toLowerCase().replace(/[\s\-]/g, "");
  const t = norm(title);
  if (!t) return 2;
  const full = norm(model);
  if (full && t.includes(full)) return 0;
  const base = norm(model.split(/\s+/)[0] ?? "");
  if (base && t.includes(base)) return 1;
  return 2;
}

/**
 * The engine-displacement token in a model string: "Golf 1.5 TSI" -> "1.5",
 * "A4 2.0 TDI" -> "2.0". Null when the model doesn't name one (e.g. just "Golf",
 * or an EV like "ID.3" — no combustion displacement to match on).
 */
export function displacementOf(model: string): string | null {
  // Accept the Swiss/German decimal comma ("Golf 1,5 TSI") and a glued form
  // ("Golf1.5 TSI") — this must NOT fail open: returning null disables the trim
  // filter entirely, which is the exact failure mode it exists to prevent.
  // A digit is required before the separator, so "ID.3"/"ID.4" stay null.
  const m = model.match(/(?<!\d)(\d)[.,](\d)(?!\d)/);
  if (!m) return null;
  const litres = Number(`${m[1]}.${m[2]}`);
  // Plausible car displacement — includes sub-litre engines (0.9 TCe/TwinAir).
  if (!(litres >= 0.6 && litres <= 8.9)) return null;
  return `${m[1]}.${m[2]}`;
}

/**
 * Does this comp POSITIVELY carry the requested engine displacement? A "Golf 1.5
 * TSI" lookup must reject a 1.0 TSI, 1.4 PHEV GTE, 2.0 TSI R or 2.0 TDI —
 * different cars and price classes that wreck a median.
 *
 * Checks the title AND the listing URL, because marketplace slugs carry the trim
 * (autolina /en/vw/golf/golf-1.5-tsi-act-life, AS24 /de/d/vw-golf-1-5-tsi-...).
 * Accepts "1.5", "1,5" and the slug form "1-5".
 *
 * This is deliberately STRICT: a comp we cannot positively identify as the right
 * engine returns false. An earlier lenient version gave untypeable listings the
 * benefit of the doubt, which let gallery-titled autolina cards ("View more
 * images", CHF 35'800) into a 1.5 TSI valuation. Returns true only when the
 * request names no displacement at all (nothing to discriminate on).
 *
 * Callers that want to distinguish "wrong engine" from "no engine stated" — and
 * so use the latter as a last-resort top-up — want trimVerdict() below.
 */
export function matchesDisplacement(title: string, model: string, url = ""): boolean {
  const disp = displacementOf(model);
  if (!disp) return true;
  const [a, , b] = disp;
  // Trailing guard, shared by both forms: not part of a longer number, and not a
  // Swiss day-date — "MFK 1.5.2025" must not make a 2.0 TDI pass as a 1.5.
  const tail = `(?!\\d|[.,-]\\d)`;
  // Title: "1.5" / "1,5". A preceding letter is fine ("Golf1.5"), a preceding
  // digit is not ("11.50"); a preceding comma is fine ("VW Golf,1.5 TSI").
  if (new RegExp(`(?<!\\d)${a}[.,]${b}${tail}`).test(title)) return true;
  if (!url) return false;
  // Slug: also "1-5". Here the digit must START a token — otherwise the model
  // designation in "bmw-x1-5-turer" (X1 + 5-Türer) reads as a 1.5.
  const slugRe = new RegExp(`(?<![\\w.,])${a}[.,-]${b}${tail}`);
  let decoded = url;
  try {
    decoded = decodeURIComponent(url);
  } catch {
    /* malformed escape — test the raw URL */
  }
  return slugRe.test(decoded);
}

// --- Body-type (Karosserie) matching --------------------------------------
//
// Same failure mode as the engine trim, one level up: for a "BMW i8" lookup the
// portals return Coupés (~CHF 65k) AND Roadsters (~CHF 110-130k) — different
// price classes that wreck a median exactly like a GTI in a 1.5-TSI valuation.
// Detection is a strict token allowlist over title + URL slug; anything not
// positively naming a variant stays null ("unknown") and is never dropped.

export type BodyType =
  | "coupe"
  | "gran-coupe"
  | "cabrio"
  | "roadster"
  | "targa"
  | "kombi"
  | "limousine"
  | "sportback"
  | "suv";

// Multi-word types FIRST: "Gran Coupé" is a 4-door and must never classify as
// "coupe". Tokens are matched on word boundaries, accent-insensitive.
const BODY_TYPE_TOKENS: Array<{ type: BodyType; re: RegExp }> = [
  { type: "gran-coupe", re: /\bgran[\s-]?coupe\b/ },
  { type: "coupe", re: /\bcoupe\b/ },
  { type: "cabrio", re: /\b(cabriolet|cabrio|convertible)\b/ },
  { type: "roadster", re: /\b(roadster|spider|spyder)\b/ },
  { type: "targa", re: /\btarga\b/ },
  { type: "kombi", re: /\b(kombi|touring|avant|variant|sportwagon|estate|break)\b/ },
  { type: "limousine", re: /\b(limousine|sedan|saloon)\b/ },
  { type: "sportback", re: /\bsportback\b/ },
  { type: "suv", re: /\bsuv\b/ },
];

/** Every valid BodyType value — for validating client-supplied body params. */
export const BODY_TYPE_VALUES: BodyType[] = [
  "coupe",
  "gran-coupe",
  "cabrio",
  "roadster",
  "targa",
  "kombi",
  "limousine",
  "sportback",
  "suv",
];

/** German display/search word per body type (used to sharpen search queries). */
export const BODY_TYPE_LABEL: Record<BodyType, string> = {
  coupe: "Coupé",
  "gran-coupe": "Gran Coupé",
  cabrio: "Cabriolet",
  roadster: "Roadster",
  targa: "Targa",
  kombi: "Kombi",
  limousine: "Limousine",
  sportback: "Sportback",
  suv: "SUV",
};

const foldBodyText = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    // Slugs write "bmw-i8-roadster-123": separators become spaces so the
    // word-boundary tokens above match inside URLs too.
    .replace(/[-_/]+/g, " ");

/** The body-type variant a text positively names, or null when it names none. */
export function bodyTypeOf(text: string): BodyType | null {
  if (!text) return null;
  const t = foldBodyText(text);
  for (const { type, re } of BODY_TYPE_TOKENS) {
    if (re.test(t)) return type;
  }
  return null;
}

/** Body type of a comp, from its title first, its URL slug as backstop. */
function compBodyType(title: string, url: string): BodyType | null {
  const fromTitle = bodyTypeOf(title);
  if (fromTitle) return fromTitle;
  if (!url) return null;
  let decoded = url;
  try {
    decoded = decodeURIComponent(url);
  } catch {
    /* malformed escape — test the raw URL */
  }
  return bodyTypeOf(decoded);
}

export type BodyVerdict = "match" | "mismatch" | "unknown";

/**
 * Three-way body-type check, mirroring trimVerdict(): only a comp that
 * POSITIVELY names a different variant than the requested model is a mismatch.
 * When the model names no variant (plain "i8"), everything matches — majority
 * preference in selectComps handles that case instead.
 */
export function bodyVerdict(title: string, model: string, url = ""): BodyVerdict {
  const wanted = bodyTypeOf(model);
  if (!wanted) return "match";
  const got = compBodyType(title, url);
  if (!got) return "unknown";
  return got === wanted ? "match" : "mismatch";
}

export type TrimVerdict = "match" | "mismatch" | "unknown";

/**
 * Three-way engine check, so we can be strict about WRONG cars without throwing
 * away merely UNIDENTIFIABLE ones:
 *   match    – carries the requested displacement (or the request names none)
 *   mismatch – names a DIFFERENT displacement → definitely another car, drop it
 *   unknown  – no engine info anywhere → usable to top up a thin result set
 *
 * The pure boolean filter dropped "unknown" too, which starved real lookups:
 * plenty of marketplace cards are titled just "VW Golf Life" with an id-only URL
 * — not evidence of the wrong engine, just no evidence either way.
 */
export function trimVerdict(title: string, model: string, url = ""): TrimVerdict {
  const disp = displacementOf(model);
  if (!disp) return "match";
  if (matchesDisplacement(title, model, url)) return "match";
  // Same boundary rules as matchesDisplacement, but looking for ANY litre figure:
  // a hit here means the listing positively names a different engine.
  const tail = `(?!\\d|[.,-]\\d)`;
  if (new RegExp(`(?<!\\d)\\d[.,]\\d${tail}`).test(title)) return "mismatch";
  if (url) {
    let decoded = url;
    try {
      decoded = decodeURIComponent(url);
    } catch {
      /* malformed escape — test the raw URL */
    }
    if (new RegExp(`(?<![\\w.,])\\d[.,-]\\d${tail}`).test(decoded)) return "mismatch";
  }
  return "unknown";
}

// --- Comp selection ------------------------------------------------------
// Lives here rather than in the API route so it can be unit-tested as a pure
// function: this is the stage that decides which cars end up in the median, and
// it is where every "garbage comps" / "only 3 results" bug has originated.

export interface CompCandidate {
  price: number;
  km: number;
  title: string;
  url: string;
  source: string;
}

export const MAX_COMPS = 5;
// A trade-in comp must be a genuinely USED car. Near-new / demo listings (e.g. a
// 140-km showroom GTE) are a different depreciation stage and, worse, a wild
// outlier that skews the median — drop anything below this mileage floor.
export const MIN_COMP_KM = 1_500;
// Price-class outlier band: a base Golf 1.5 TSI (~CHF 12–15k) and a GTE/GTI/R
// hybrid (~CHF 38k) are not comparable even after the km adjustment. Keep only
// listings within [0.5x, 2x] of the median listing price — but only when enough
// comps survive, so we never prune ourselves down to nothing.
const PRICE_OUTLIER_LOW = 0.5;
const PRICE_OUTLIER_HIGH = 2;

function medianOf(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

/**
 * Prefer comps with a similar mileage; widen the band only when the strict one
 * yields too few. Returns the picked comps plus whether relaxation was needed.
 */
function pickBySimilarKm(
  comps: CompCandidate[],
  targetKm: number,
  model: string,
  limit: number = MAX_COMPS,
  preferredBody: BodyType | null = null
): { picked: CompCandidate[]; relaxed: boolean } {
  // Trim precision beats km proximity: a GTI comp poisons a 1.5-TSI valuation far
  // worse than a 20'000-km mileage gap (the km-Angleich corrects mileage anyway).
  // Body-type agreement sits between the two: a same-variant comp with a bigger
  // mileage gap beats a Roadster in a Coupé valuation.
  const bodyRank = (c: CompCandidate): number => {
    if (!preferredBody) return 0;
    const got = compBodyType(c.title, c.url);
    if (!got) return 1;
    return got === preferredBody ? 0 : 2;
  };
  const byDistance = [...comps].sort((a, b) => {
    const p = modelPrecision(a.title, model) - modelPrecision(b.title, model);
    if (p !== 0) return p;
    const bd = bodyRank(a) - bodyRank(b);
    if (bd !== 0) return bd;
    return Math.abs(a.km - targetKm) - Math.abs(b.km - targetKm);
  });
  const bands = [
    Math.max(30_000, targetKm * 0.4),
    Math.max(60_000, targetKm * 0.8),
    Number.POSITIVE_INFINITY,
  ];

  const picked: CompCandidate[] = [];
  let relaxed = false;
  // Always fill up to the limit: the bands only control ORDER (similar-km comps
  // first) — stopping early returned 4 comps while 7 were on the table.
  for (let i = 0; i < bands.length && picked.length < limit; i++) {
    for (const c of byDistance) {
      if (picked.length >= limit) break;
      if (picked.includes(c)) continue;
      if (Math.abs(c.km - targetKm) <= bands[i]) {
        picked.push(c);
        if (i > 0) relaxed = true;
      }
    }
  }
  return { picked, relaxed };
}

export interface CompSelection {
  picked: CompCandidate[];
  /** Some picks fall outside the strict mileage band. */
  relaxed: boolean;
  /** How many picks could not be engine-verified (top-ups). */
  toppedUp: number;
  /** Positively the WRONG engine — always excluded. */
  droppedForTrim: number;
  /** Positively the WRONG body variant (model named one) — always excluded. */
  droppedForBody: number;
  droppedNearNew: number;
  droppedOutliers: number;
  /** The final picks still mix body variants (e.g. Coupé + Roadster). */
  mixedBody: boolean;
  /** Unverified comps still on the bench after selection. */
  unverifiedAvailable: number;
  harvested: number;
}

/**
 * Turn the raw harvest into the comps that actually drive the valuation.
 *
 * Order matters: engine verdict → body verdict → mileage floor → price band →
 * km-similarity pick. Confirmed comps always fill the seats first; unverified ones (no engine
 * stated anywhere) only fill seats that would otherwise stay empty, which is
 * what lifts a real lookup off "3 Inserate" without ever letting a known-wrong
 * engine into the median.
 */
export function selectComps(
  raw: CompCandidate[],
  model: string,
  targetKm: number,
  requestedBodyOverride?: BodyType | null
): CompSelection {
  const harvested = raw.length;
  const requestedDisplacement = displacementOf(model);

  // 1) Engine/trim verdict. The single biggest source of garbage: for "Golf 1.5
  //    TSI" the portals return 1.0 TSI, 1.4 PHEV GTE, 2.0 TSI R, 2.0 TDI — all
  //    different cars and price classes.
  //    Three-way, not boolean. "mismatch" is always dropped. A boolean filter
  //    also dropped every card that simply names no engine ("VW Golf Life" with
  //    an id-only URL), which is most of a marketplace grid — those are held
  //    back as a reserve instead.
  //    No-ops when the model names no displacement (an EV, or a bare "Golf").
  let confirmed: CompCandidate[] = [];
  let unverified: CompCandidate[] = [];
  if (requestedDisplacement) {
    for (const c of raw) {
      const verdict = trimVerdict(c.title, model, c.url);
      if (verdict === "match") confirmed.push(c);
      else if (verdict === "unknown") unverified.push(c);
    }
  } else {
    confirmed = [...raw];
  }
  const droppedForTrim = harvested - confirmed.length - unverified.length;

  // 1b) Body-variant verdict. Only when the requested variant is KNOWN — the
  //     caller passed one (the calculator's Karosserie field), or the model
  //     names it ("i8 Roadster", "Golf Variant") — is a positively-different
  //     comp dropped; untyped comps always survive. A plain "i8" with no
  //     caller-supplied body drops nothing here — the majority preference
  //     below keeps the picked set homogeneous instead.
  const requestedBody = requestedBodyOverride ?? bodyTypeOf(model);
  let droppedForBody = 0;
  if (requestedBody) {
    const beforeBody = confirmed.length + unverified.length;
    const keep = (c: CompCandidate) => {
      const got = compBodyType(c.title, c.url);
      return !got || got === requestedBody;
    };
    confirmed = confirmed.filter(keep);
    unverified = unverified.filter(keep);
    droppedForBody = beforeBody - confirmed.length - unverified.length;
  }

  // 2) Drop near-new / demo cars (a 140-km GTE is no comp for a used trade-in).
  const beforeKmFloor = confirmed.length + unverified.length;
  confirmed = confirmed.filter((c) => c.km >= MIN_COMP_KM);
  unverified = unverified.filter((c) => c.km >= MIN_COMP_KM);
  const droppedNearNew = beforeKmFloor - confirmed.length - unverified.length;

  // 3) Drop price-class outliers. The band is anchored on the CONFIRMED comps
  //    whenever there are enough to form a median, so an unverified card can
  //    never move the goalposts it is being judged against.
  //    Guarded: only prune when >=3 comps exist and >=2 would survive.
  let droppedOutliers = 0;
  const anchorPool = confirmed.length >= 3 ? confirmed : [...confirmed, ...unverified];
  if (anchorPool.length >= 3) {
    const medPrice = medianOf(anchorPool.map((c) => c.price));
    const inBand = (c: CompCandidate) =>
      c.price >= medPrice * PRICE_OUTLIER_LOW && c.price <= medPrice * PRICE_OUTLIER_HIGH;
    const keptConfirmed = confirmed.filter(inBand);
    const keptUnverified = unverified.filter(inBand);
    if (keptConfirmed.length + keptUnverified.length >= 2) {
      droppedOutliers =
        confirmed.length + unverified.length - keptConfirmed.length - keptUnverified.length;
      confirmed = keptConfirmed;
      unverified = keptUnverified;
    }
  }

  // 4) Body-variant preference for the pick. When the model names a variant,
  //    that is the preference (mismatches are already gone, this just ranks
  //    typed matches above untyped comps). Otherwise prefer the STRICT MAJORITY
  //    variant among the survivors — for a plain "i8" a mixed 8-Coupé/4-Roadster
  //    harvest then yields an all-Coupé median instead of a Coupé/Roadster blend.
  //    No majority (tie, or everything untyped) → no preference.
  let preferredBody: BodyType | null = requestedBody;
  if (!preferredBody) {
    const counts = new Map<BodyType, number>();
    for (const c of [...confirmed, ...unverified]) {
      const b = compBodyType(c.title, c.url);
      if (b) counts.set(b, (counts.get(b) ?? 0) + 1);
    }
    let best: BodyType | null = null;
    let bestCount = 0;
    let typedTotal = 0;
    for (const [b, n] of counts) {
      typedTotal += n;
      if (n > bestCount) {
        best = b;
        bestCount = n;
      }
    }
    if (best && bestCount >= 2 && bestCount * 2 > typedTotal) preferredBody = best;
  }

  // 5) Pick by mileage similarity — confirmed first, then top up.
  const confirmedPick = pickBySimilarKm(confirmed, targetKm, model, MAX_COMPS, preferredBody);
  const picked = confirmedPick.picked;
  let relaxed = confirmedPick.relaxed;
  let toppedUp = 0;
  if (picked.length < MAX_COMPS && unverified.length > 0) {
    const topUp = pickBySimilarKm(
      unverified,
      targetKm,
      model,
      MAX_COMPS - picked.length,
      preferredBody
    );
    picked.push(...topUp.picked);
    toppedUp = topUp.picked.length;
    if (topUp.relaxed) relaxed = true;
  }

  // Do the final picks still mix positively-named variants? (Two distinct typed
  // bodies in the set — untyped comps don't count as a mix.) This is the "the
  // median blends different cars" signal the caller should surface.
  const pickedBodies = new Set<BodyType>();
  for (const c of picked) {
    const b = compBodyType(c.title, c.url);
    if (b) pickedBodies.add(b);
  }

  return {
    picked,
    relaxed,
    toppedUp,
    droppedForTrim,
    droppedForBody,
    droppedNearNew,
    droppedOutliers,
    mixedBody: pickedBodies.size >= 2,
    unverifiedAvailable: unverified.length - toppedUp,
    harvested,
  };
}
