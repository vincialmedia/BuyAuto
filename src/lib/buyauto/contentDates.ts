// Maintained last-edit dates for content pages — the single source for the sitemap's
// <lastmod>, each Ratgeber's Article dateModified and its visible «Aktualisiert am»
// badge. Bump a page's entry when its content actually changes (an earlier fake
// daily-refreshing date was deliberately removed as freshness spoofing — keep these
// honest). Seeded from each page's last real edit in git history.

export const CONTENT_LAST_UPDATED: Record<string, string> = {
  "/": "2026-10-09",
  "/suche": "2026-08-04",
  "/preise": "2026-08-14",
  "/updates": "2026-08-07",
  "/leasinguebernahme": "2026-10-09",
  "/leasinguebernahme-kosten": "2026-10-09",
  "/leasingvertrag-uebertragen": "2026-10-09",
  "/leasinguebernahme-vs-autoabo": "2026-10-09",
  "/eintauschwert-rechner": "2026-08-04",
  "/leasing-abgeben-schweiz": "2026-10-09",
  "/fuer-garagen": "2026-08-13",
  "/autoscout24-alternative-leasinguebernahme": "2026-10-08",
  "/datenschutz": "2026-07-31",
  "/agb": "2026-07-30",
};

/**
 * Last content edit of the brand page template (/leasinguebernahme/[marke]: lender
 * section, intro, layout). Kept out of CONTENT_LAST_UPDATED, whose keys are static
 * sitemap URLs. Shown in the brand pages' «Aktualisiert am»; their sitemap lastmod is
 * the later of this date and the brand's newest listing change.
 */
export const BRAND_PAGES_CONTENT_UPDATED = "2026-10-09";

export function contentLastUpdatedIso(path: string): string | null {
  return CONTENT_LAST_UPDATED[path] ?? null;
}

/** "2026-08-04" → "04.08.2026" for the visible «Aktualisiert am» badge. */
export function formatSwissDate(iso: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!match) return iso;
  return `${match[3]}.${match[2]}.${match[1]}`;
}
