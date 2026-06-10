// Curated registry of brands that get their own programmatic Leasingübernahme landing
// page at /leasinguebernahme/<slug>. Adding a brand here is all that's needed to spin
// up a new SEO landing page — the [marke].tsx route and the sitemap read from this list.
//
// `name` MUST exactly match the `brand` string stored in the listings table, because the
// listings query filters with `.eq("brand", name)`. If a brand name here does not match
// any inventory, its page renders as an (honest) empty state and is automatically set to
// noindex until inventory exists — so it is safe to list brands speculatively.

export interface LeasingBrand {
  /** URL segment, e.g. "mercedes-benz" → /leasinguebernahme/mercedes-benz */
  slug: string;
  /** Exact brand string as stored in listings.brand (used for the DB filter). */
  name: string;
  /** Brand-specific intro paragraph shown under the H1. */
  intro: string;
  /** Popular models, woven into copy + FAQ for topical relevance. */
  popularModels: string[];
}

export const LEASING_BRANDS: LeasingBrand[] = [
  {
    slug: "tesla",
    name: "Tesla",
    intro:
      "Eine Leasingübernahme ist der schnellste Weg zu einem Tesla in der Schweiz – ohne hohe Anzahlung und mit kurzer Restlaufzeit. Übernimm einen laufenden Leasingvertrag für ein Model 3, Model Y oder Model S und fahre elektrisch, ohne dich für die volle Laufzeit eines Neuwagen-Leasings zu binden.",
    popularModels: ["Model 3", "Model Y", "Model S", "Model X"],
  },
  {
    slug: "bmw",
    name: "BMW",
    intro:
      "Übernimm einen bestehenden BMW-Leasingvertrag in der Schweiz – von der 3er-Reihe bis zum X5 oder vollelektrischen i4. Eine Leasingübernahme spart dir die Anzahlung und bindet dich nur für die verbleibende Laufzeit statt der vollen 36–48 Monate eines neuen Leasings.",
    popularModels: ["3er", "5er", "X3", "X5", "i4"],
  },
  {
    slug: "audi",
    name: "Audi",
    intro:
      "Sichere dir einen Audi per Leasingübernahme in der Schweiz – ob A3, Q5 oder e-tron. Du steigst in einen laufenden Vertrag ein, profitierst von einer oft bereits geleisteten Anzahlung und sparst gegenüber einem brandneuen Leasing.",
    popularModels: ["A3", "A4", "Q5", "Q7", "e-tron"],
  },
  {
    slug: "mercedes-benz",
    name: "Mercedes-Benz",
    intro:
      "Eine Leasingübernahme bringt dich günstig in einen Mercedes-Benz – von der C-Klasse bis zum GLC oder vollelektrischen EQ-Modell. Übernimm einen laufenden Leasingvertrag in der Schweiz, ohne hohe Anzahlung und mit planbarer Restlaufzeit.",
    popularModels: ["A-Klasse", "C-Klasse", "GLC", "GLE", "EQC"],
  },
  {
    slug: "volkswagen",
    name: "Volkswagen",
    intro:
      "Übernimm ein VW-Leasing in der Schweiz – vom Golf über den Tiguan bis zum vollelektrischen ID.4. Eine Leasingübernahme ist die flexible Alternative: keine grosse Anzahlung, kurze Restlaufzeit und sofort fahrbereit.",
    popularModels: ["Golf", "Passat", "Tiguan", "T-Roc", "ID.4"],
  },
  {
    slug: "porsche",
    name: "Porsche",
    intro:
      "Fahre einen Porsche per Leasingübernahme – ob Macan, Cayenne oder der vollelektrische Taycan. In der Schweiz übernimmst du einen laufenden Leasingvertrag und sparst dir die hohe Anzahlung eines Neuwagen-Leasings.",
    popularModels: ["Macan", "Cayenne", "Taycan", "911", "Panamera"],
  },
  {
    slug: "volvo",
    name: "Volvo",
    intro:
      "Eine Leasingübernahme bringt dich sicher und günstig in einen Volvo – vom kompakten XC40 bis zum XC90. Übernimm einen laufenden Vertrag in der Schweiz, ohne Anzahlung und mit überschaubarer Restlaufzeit.",
    popularModels: ["XC40", "XC60", "XC90", "V60", "S60"],
  },
  {
    slug: "toyota",
    name: "Toyota",
    intro:
      "Übernimm ein Toyota-Leasing in der Schweiz und profitiere von bewährter Hybrid-Effizienz – vom Yaris bis zum RAV4. Die Leasingübernahme ist die kostengünstige Alternative zum Neuleasing: keine hohe Anzahlung, kurze Restlaufzeit.",
    popularModels: ["Yaris", "Corolla", "C-HR", "RAV4", "bZ4X"],
  },
];

export const LEASING_BRAND_SLUGS = LEASING_BRANDS.map((b) => b.slug);

export function getLeasingBrandBySlug(slug: string): LeasingBrand | null {
  const normalized = slug.trim().toLowerCase();
  return LEASING_BRANDS.find((b) => b.slug === normalized) ?? null;
}
