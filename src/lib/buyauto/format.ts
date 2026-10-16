/**
 * Deterministic Swiss number formatting for server-rendered copy.
 *
 * Intl/toLocaleString("de-CH") is NOT used because Node and browsers disagree
 * on the grouping glyph (U+0027 vs U+2019), which caused hydration mismatches
 * on every server-rendered card. This is the formatter the listing cards
 * already used inline; it lives here so cards, facts copy and stats share it.
 */

/** 117000 -> "117'000" (rounded to whole francs). */
export function formatSwissInt(value: number): string {
  return String(Math.round(value)).replace(/\B(?=(\d{3})+(?!\d))/g, "'");
}

/** 15000 -> "CHF 15'000". */
export function formatChf(value: number): string {
  return `CHF ${formatSwissInt(value)}`;
}

/**
 * Amount with Rappen, for tariff figures that are not whole francs:
 * 432.4 -> "CHF 432.40", 74.55 -> "CHF 74.55", 42 -> "CHF 42.00".
 */
export function formatChfRappen(value: number): string {
  const rappen = Math.round(value * 100);
  const francs = Math.trunc(rappen / 100);
  const cents = String(Math.abs(rappen % 100)).padStart(2, "0");
  return `CHF ${formatSwissInt(francs)}.${cents}`;
}

/** 2000, 15000 -> "CHF 2'000–15'000"; equal bounds collapse to one amount. */
export function formatChfRange(min: number, max: number): string {
  if (Math.round(min) === Math.round(max)) return formatChf(min);
  return `CHF ${formatSwissInt(min)}–${formatSwissInt(max)}`;
}

/** German count noun: 1 -> singular, everything else -> plural. */
export function pluralize(count: number, singular: string, plural: string): string {
  return count === 1 ? singular : plural;
}

/** "1 Angebot" / "2 Angebote". */
export function countLabel(count: number, singular: string, plural: string): string {
  return `${count} ${pluralize(count, singular, plural)}`;
}
