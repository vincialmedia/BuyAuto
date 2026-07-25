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
  return t;
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
  const anchors: Array<{ rawText: string; url: string; end: number; start: number }> = [];
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
      // Same listing linked twice in a row (image + title) — extend the anchor.
      prev.end = m.index + m[0].length;
      if (!prev.rawText.trim() && rawText.trim()) prev.rawText = rawText;
      continue;
    }
    anchors.push({ rawText, url: href.split("#")[0], start: m.index, end: m.index + m[0].length });
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
    const title = cleanCardTitle(a.rawText);
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
const TRIM_TOKEN =
  /^(\d+(\.\d+)?|e-?tsi|tsi|tdi|tfsi|fsi|cdi|dci|hdi|dsg|cvt|mhev|phev|evo|4motion|quattro|xdrive|gti|gtd|gte|r-line|life|style|comfortline|highline|trendline)$/i;

const marketplaceSlug = (s: string) =>
  s
    .toLowerCase()
    .replace(/[äàâ]/g, "a")
    .replace(/[öô]/g, "o")
    .replace(/[üû]/g, "u")
    .replace(/[éèê]/g, "e")
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

export function as24CategoryUrl(make: string, model: string): string {
  return `https://www.autoscout24.ch/de/s/mo-${marketplaceSlug(baseModel(model))}/mk-${marketplaceSlug(make)}`;
}

/** Verified shape: comparis.ch/carfinder/marktplatz/vw/golf/occasion (aggregates all portals). */
export function comparisCategoryUrl(make: string, model: string): string {
  return `https://www.comparis.ch/carfinder/marktplatz/${marketplaceSlug(make)}/${marketplaceSlug(baseModel(model))}/occasion`;
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
  // Require a decimal litre figure (1.0–9.9). Avoid matching "ID.3", "1er" etc.
  const m = model.match(/(?<![\w.])([1-9]\.\d)(?!\d)/);
  return m ? m[1] : null;
}

/**
 * Does a listing TITLE share the requested engine displacement? A "Golf 1.5 TSI"
 * lookup must reject a 1.0 TSI, 1.4 PHEV GTE, 2.0 TSI R or 2.0 TDI — different
 * cars and price classes that wreck a median. Accepts "1.5" or "1,5" as a
 * standalone token. When the requested model names no displacement, or the title
 * names none, we can't discriminate — return true (don't over-filter).
 */
export function matchesDisplacement(title: string, model: string): boolean {
  const disp = displacementOf(model);
  if (!disp) return true;
  // The title carries no litre figure at all → nothing to contradict the request.
  if (!/(?<![\w.])[1-9][.,]\d(?!\d)/.test(title)) return true;
  const re = new RegExp(`(?<![\\w.])${disp[0]}[.,]${disp[2]}(?!\\d)`);
  return re.test(title);
}
