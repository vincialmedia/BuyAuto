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
const DETAIL_PATH_PATTERNS: Array<{ host: string; detail: RegExp }> = [
  // autoscout24.ch/de/d/vw-golf-...-10826494 (also /fr/d/, /it/d/)
  { host: "autoscout24.ch", detail: /\/d\// },
  // tutti.ch/de/vi/zuerich/...
  { host: "tutti.ch", detail: /\/vi\// },
  // anibis.ch/de/d/...
  { host: "anibis.ch", detail: /\/d\// },
  // comparis.ch/carfinder/marktplatz/details/show/12345
  { host: "comparis.ch", detail: /\/details\/show\// },
  // our own listing detail pages
  { host: "buyauto.ch", detail: /\/fahrzeug\// },
];

/**
 * Returns the marketplace host (e.g. "autoscout24.ch") when the URL matches a
 * KNOWN individual-listing path shape on a Swiss marketplace, null otherwise.
 */
export function identifyListingUrl(url: string): string | null {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return null;
  }
  const host = parsed.hostname.replace(/^www\./, "");
  const known = DETAIL_PATH_PATTERNS.find(
    (p) => host === p.host || host.endsWith(`.${p.host}`)
  );
  if (!known) return null;
  return known.detail.test(parsed.pathname) ? known.host : null;
}
