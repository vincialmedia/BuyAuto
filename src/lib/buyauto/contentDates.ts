// Maintained last-edit dates for content pages — the single source for the sitemap's
// <lastmod>, each Ratgeber's Article dateModified and its visible «Aktualisiert am»
// badge. Bump a page's entry when its content actually changes (an earlier fake
// daily-refreshing date was deliberately removed as freshness spoofing — keep these
// honest). Seeded from each page's last real edit in git history.

export const CONTENT_LAST_UPDATED: Record<string, string> = {
  "/": "2026-08-14",
  "/suche": "2026-08-04",
  "/preise": "2026-08-14",
  "/preise/vergleich": "2026-08-14",
  // /leasing-concierge is deliberately absent: the page stays reachable but
  // is delisted (noindex, no sitemap entry, no internal links).
  "/leasinguebernahme": "2026-08-14",
  "/leasinguebernahme-kosten": "2026-08-04",
  "/leasingvertrag-uebertragen": "2026-08-04",
  "/leasinguebernahme-vs-neues-leasing": "2026-08-04",
  "/leasinguebernahme-vs-autoabo": "2026-08-04",
  "/auto-abo-kuendigen": "2026-08-04",
  "/auto-abo-vs-leasing-kosten": "2026-08-04",
  "/eintauschwert-rechner": "2026-08-04",
  "/leasing-abgeben-schweiz": "2026-08-04",
  "/fuer-garagen": "2026-08-13",
  "/cembra-leasing-uebernehmen": "2026-08-14",
  "/amag-leasing-uebernehmen": "2026-08-14",
  "/multilease-leasing-uebernehmen": "2026-08-14",
  "/bank-now-leasing-uebernehmen": "2026-08-14",
  "/autoscout24-alternative-leasinguebernahme": "2026-08-04",
  "/carify-alternativen": "2026-08-04",
  "/auto-abos-im-vergleich": "2026-08-04",
  "/datenschutz": "2026-07-31",
  "/agb": "2026-07-30",
};

export function contentLastUpdatedIso(path: string): string | null {
  return CONTENT_LAST_UPDATED[path] ?? null;
}

/** "2026-08-04" → "04.08.2026" for the visible «Aktualisiert am» badge. */
export function formatSwissDate(iso: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!match) return iso;
  return `${match[3]}.${match[2]}.${match[1]}`;
}
