// Tolerant extraction of price/mileage pairs from Swiss vehicle-listing text
// (search-result titles/descriptions or scraped page markdown). Pure functions,
// no I/O — kept separate from the API route so the parsing is testable on its own.

export interface ParsedComp {
  price: number;
  km: number;
  year: number | null;
}

// Swiss listings write numbers as 18'900, 18’900, 18.900, 18,900 or 18 900.
// Strict grouped-thousands (separator must be followed by exactly 3 digits) or a
// plain digit run — anything looser greedily spans neighbouring numbers like
// "2020, 45'000" and swallows both.
const NUM = "(?:\\d{1,3}(?:['’.,\\u00a0 ]\\d{3})+|\\d+)";

// "CHF 18'900.-", "CHF 18’900.–", "Fr. 18'900", "18'900 CHF"
const PRICE_BEFORE = new RegExp(`(?:CHF|Fr\\.)\\s*(${NUM})`, "gi");
const PRICE_AFTER = new RegExp(`(${NUM})\\s*(?:CHF|Fr\\.)`, "gi");
// "45'000 km", "45’000km", "Kilometerstand 45'000 km"
const KM = new RegExp(`(${NUM})\\s*km\\b`, "gi");
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
  return { price, km, year: years.length > 0 ? years[0] : null };
}

/** True when the listing's year (if detectable) is within `tolerance` of the target. */
export function yearMatches(comp: ParsedComp, targetYear: number, tolerance = 2): boolean {
  if (comp.year === null) return true;
  return Math.abs(comp.year - targetYear) <= tolerance;
}
