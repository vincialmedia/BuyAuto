// Registry for the Leasinggesellschaft pages (cembra-leasing-uebernehmen etc.).
// One entry = one SEO page, rendered by LeasingCompanyPage — same idea as the
// brand registry in leasingBrands.ts, but with flat top-level slugs because
// these are content pages like every other Ratgeber (and a distinct segment
// under /leasinguebernahme/ would collide with the [marke] fallback).
//
// UWG guardrail: every company-specific fact (Gebühren, Dauer, Dokumente,
// finanzierte Marken, Portfoliogrössen) ships ONLY once Vince supplies it with
// a verifiable source. Until then the fields stay null and the template
// renders honest generic copy instead. Do not fill these from memory.

export interface LeasingCompanyFacts {
  /** Exact transfer/Umschreibung fee wording, e.g. «CHF 250 Umschreibegebühr». */
  transferFee: string | null;
  /** Typical transfer duration wording, e.g. «5–10 Arbeitstage nach Antragseingang». */
  typicalDuration: string | null;
  /** Documents the company requires from the Übernehmer. */
  requiredDocuments: string[] | null;
  /** Company-specific process steps/channel (Portal, Formular, Hotline …). */
  processNotes: string | null;
}

export interface LeasingCompany {
  /** Flat page slug, e.g. "cembra-leasing-uebernehmen" → /cembra-leasing-uebernehmen */
  slug: string;
  /** Short display name used in headings and prose. */
  name: string;
  /** Official company website (root URL only — no deep-link claims). */
  officialSite: string;
  facts: LeasingCompanyFacts;
}

const NO_FACTS: LeasingCompanyFacts = {
  // TODO-VINCE: Umschreibegebühr pro Gesellschaft (Betrag + Quelle: Vertrag/Website/Auskunft)
  transferFee: null,
  // TODO-VINCE: typische Dauer der Übertragung pro Gesellschaft (Erfahrungswert + Quelle)
  typicalDuration: null,
  // TODO-VINCE: verbindliche Dokumentenliste pro Gesellschaft für die Bonitätsprüfung
  requiredDocuments: null,
  // TODO-VINCE: gesellschaftsspezifischer Übertragungsweg (Online-Portal? Formular? Hotline?)
  processNotes: null,
};

export const LEASING_COMPANIES: LeasingCompany[] = [
  {
    slug: "cembra-leasing-uebernehmen",
    name: "Cembra",
    officialSite: "https://www.cembra.ch",
    facts: { ...NO_FACTS },
  },
  {
    slug: "amag-leasing-uebernehmen",
    name: "AMAG Leasing",
    officialSite: "https://www.amag-leasing.ch",
    // TODO-VINCE: finanzierte Marken von AMAG Leasing mit Quelle von der
    // eigenen Website (dann Brand-Page-Links VW/Audi/Porsche/… ergänzen)
    facts: { ...NO_FACTS },
  },
  {
    slug: "multilease-leasing-uebernehmen",
    name: "Multilease",
    officialSite: "https://www.multilease.ch",
    facts: { ...NO_FACTS },
  },
  {
    slug: "bank-now-leasing-uebernehmen",
    name: "BANK-now",
    officialSite: "https://www.bank-now.ch",
    facts: { ...NO_FACTS },
  },
];

export function otherLeasingCompanies(slug: string): LeasingCompany[] {
  return LEASING_COMPANIES.filter((c) => c.slug !== slug);
}

/** Registry lookup for the page files — fails loudly at build time on a typo. */
export function leasingCompanyBySlug(slug: string): LeasingCompany {
  const company = LEASING_COMPANIES.find((c) => c.slug === slug);
  if (!company) throw new Error(`Unknown leasing company slug: ${slug}`);
  return company;
}
