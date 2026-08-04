// Registry of brands with a Leasingübernahme landing page at /leasinguebernahme/<slug>.
// Curated entries below carry hand-written intros; any OTHER brand that appears in the
// DB with a live listing gets a page automatically via resolveBrandSlug/buildDynamicBrand
// (generic intro, models taken from its real inventory) — no code change needed.
//
// Curated entries with no matching inventory render as an (honest) empty state and are
// automatically noindex until inventory exists — so it is safe to list brands
// speculatively. When a DB spelling differs from the display name, list every stored
// variant in dbBrands.

import { slugifyListingPart } from "@/lib/buyauto/listingUrl";

export interface LeasingBrand {
  /** URL segment, e.g. "mercedes-benz" → /leasinguebernahme/mercedes-benz */
  slug: string;
  /** Display name; also the DB filter value unless dbBrands overrides it. */
  name: string;
  /**
   * Exact brand strings as stored in listings.brand that this page covers. The DB is not
   * uniform (live rows say "Mercedes", older ones "Mercedes-Benz"), so a page can span
   * several spellings. Defaults to [name].
   */
  dbBrands?: string[];
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
    // Live listings store the brand as "Mercedes"; the catalog's makes table does too.
    dbBrands: ["Mercedes", "Mercedes-Benz"],
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

/** The exact listings.brand values a brand page queries for. */
export function dbBrandsFor(brand: LeasingBrand): string[] {
  return brand.dbBrands && brand.dbBrands.length > 0 ? brand.dbBrands : [brand.name];
}

/** URL slug for a raw listings.brand value ("Škoda" → "skoda"). */
export function slugifyBrandName(dbBrand: string): string {
  return slugifyListingPart(dbBrand);
}

/** Curated entry covering a raw DB brand string, if any. */
export function curatedBrandForDbBrand(dbBrand: string): LeasingBrand | null {
  return LEASING_BRANDS.find((b) => dbBrandsFor(b).includes(dbBrand)) ?? null;
}

/**
 * Brand page for a DB brand that has inventory but no curated entry (e.g. Fiat, Škoda).
 * The intro states only how a lease takeover works — nothing brand-specific is invented;
 * popularModels must come from that brand's real listings.
 */
export function buildDynamicBrand(dbBrand: string, liveModels: string[]): LeasingBrand {
  return {
    slug: slugifyBrandName(dbBrand),
    name: dbBrand,
    dbBrands: [dbBrand],
    intro:
      `Übernimm einen laufenden ${dbBrand}-Leasingvertrag in der Schweiz: Du steigst zu den bestehenden ` +
      `Konditionen ein, zahlst die vereinbarte Monatsrate weiter und bindest dich nur für die Restlaufzeit – ` +
      `ohne die hohe Anzahlung eines neuen Leasings. Alle ${dbBrand}-Angebote unten sind aktuelle Inserate auf BuyAuto.`,
    popularModels: liveModels,
  };
}

export interface BrandInventoryRow {
  brand: string;
  model: string | null;
  deal_type: string | null;
}

/**
 * Resolves a URL slug against curated entries first, then against the live DB brands.
 * A DB brand already covered by a curated page redirects to that page's slug instead of
 * spawning a duplicate (e.g. /leasinguebernahme/mercedes → /leasinguebernahme/mercedes-benz).
 */
export function resolveBrandSlug(
  slug: string,
  rows: BrandInventoryRow[]
): { brand: LeasingBrand } | { redirectTo: string } | null {
  const curated = getLeasingBrandBySlug(slug);
  if (curated) return { brand: curated };

  const normalized = slug.trim().toLowerCase();
  const byBrand = new Map<string, string[]>();
  for (const row of rows) {
    if (typeof row.brand !== "string" || row.brand.trim() === "") continue;
    const models = byBrand.get(row.brand) ?? [];
    if (typeof row.model === "string" && row.model.trim() !== "" && !models.includes(row.model)) {
      models.push(row.model);
    }
    byBrand.set(row.brand, models);
  }

  for (const [dbBrand, models] of byBrand) {
    if (slugifyBrandName(dbBrand) !== normalized) continue;
    const curatedCover = curatedBrandForDbBrand(dbBrand);
    if (curatedCover) return { redirectTo: curatedCover.slug };
    return { brand: buildDynamicBrand(dbBrand, models.slice(0, 4)) };
  }

  return null;
}

/**
 * All brand pages that currently have live inventory, for the hub's brand grid and the
 * sitemap: curated pages whose dbBrands intersect the live set, plus a dynamic page per
 * uncovered live brand. Pass rows already filtered to the deal types that matter.
 */
export function brandPagesForInventory(rows: BrandInventoryRow[]): { slug: string; name: string; dbBrands: string[] }[] {
  const liveBrands = new Set(
    rows.map((r) => (typeof r.brand === "string" ? r.brand.trim() : "")).filter((b) => b !== "")
  );

  const pages: { slug: string; name: string; dbBrands: string[] }[] = [];

  for (const curated of LEASING_BRANDS) {
    const covered = dbBrandsFor(curated);
    if (covered.some((b) => liveBrands.has(b))) {
      pages.push({ slug: curated.slug, name: curated.name, dbBrands: covered });
    }
  }

  for (const dbBrand of liveBrands) {
    if (curatedBrandForDbBrand(dbBrand)) continue;
    pages.push({ slug: slugifyBrandName(dbBrand), name: dbBrand, dbBrands: [dbBrand] });
  }

  return pages.sort((a, b) => a.name.localeCompare(b.name, "de-CH"));
}
