// Registry of brands with a Leasingübernahme landing page at /leasinguebernahme/<slug>.
// Curated entries below carry a short hand-written intro; any OTHER brand that appears in
// the DB with a live listing gets a page automatically via resolveBrandSlug/buildDynamicBrand
// (intro from its lender entry in brandLenders.ts, else a neutral one). Models and numbers
// on the pages come from the live listings only, never from this file.
//
// Curated entries with no matching inventory render as an (honest) empty state and are
// automatically noindex until inventory exists — so it is safe to list brands
// speculatively. When a DB spelling differs from the display name, list every stored
// variant in dbBrands.
//
// Intros: no claim without a source. They say what the page lists and, where
// brandLenders.ts has an entry, which lender's published facts follow below.

import { slugifyListingPart } from "@/lib/buyauto/listingUrl";
import { brandLenderFor } from "@/lib/buyauto/brandLenders";

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
  /** Brand-specific intro under the H1 (no numbers: those come from live data). */
  intro: string;
}

export const LEASING_BRANDS: LeasingBrand[] = [
  {
    slug: "tesla",
    name: "Tesla",
    intro:
      "Auf dieser Seite erscheint jeder Tesla, dessen laufender Leasingvertrag auf BuyAuto zur Übernahme inseriert ist.",
  },
  {
    slug: "bmw",
    name: "BMW",
    intro:
      "BMW mit laufendem Leasingvertrag, inseriert auf BuyAuto. Unter den Inseraten: was die Leasinggesellschaft von BMW zur Übernahme publiziert und was der Gründer von BuyAuto bei der Abgabe seines eigenen BMW-Leasings bezahlt hat.",
  },
  {
    slug: "audi",
    name: "Audi",
    intro:
      "Audi-Leasingverträge, die gerade jemand auf BuyAuto abgibt. Darunter steht, was AMAG Leasing, die Audi als Kernmarke führt, in ihren Leasingbestimmungen zu Gebühren, Bonität und Versicherung festhält.",
  },
  {
    slug: "mercedes-benz",
    name: "Mercedes-Benz",
    // Live listings store the brand as "Mercedes"; the catalog's makes table does too.
    dbBrands: ["Mercedes", "Mercedes-Benz"],
    intro:
      "Jeder Mercedes, dessen Leasingvertrag auf BuyAuto zur Übernahme steht. Mercedes-Benz Financial Services publiziert zur Übernahme keine Angaben; ihre Aussage zur Kündigung zitieren wir weiter unten.",
  },
  {
    slug: "volkswagen",
    name: "Volkswagen",
    intro:
      "Hier stehen die Volkswagen, deren Leasingvertrag aktuell auf BuyAuto zur Übernahme ausgeschrieben ist. Nach den Inseraten folgen die Bestimmungen von AMAG Leasing, zu deren Kernmarken VW gehört.",
  },
  {
    slug: "porsche",
    name: "Porsche",
    intro:
      "Porsche-Leasingverträge zur Übernahme auf BuyAuto. Porsche hat in der Schweiz eine eigene Leasinggesellschaft; ihre Klausel zur Übertragung eines Vertrags zitieren wir im Wortlaut.",
  },
  {
    slug: "volvo",
    name: "Volvo",
    intro: "Volvo zur Leasingübernahme: Sobald jemand seinen Volvo-Vertrag auf BuyAuto inseriert, erscheint er hier.",
  },
  {
    slug: "toyota",
    name: "Toyota",
    intro: "Diese Seite zeigt jeden Toyota, bei dem du auf BuyAuto in einen laufenden Leasingvertrag einsteigen kannst.",
  },
  {
    // Curated so the URL stays stable (AMAG brand; the guide, the sitemap and the
    // other AMAG brand pages link it when indexable) — as a dynamic-only brand it would 404 whenever the last
    // live Škoda listing expires.
    slug: "skoda",
    name: "Škoda",
    dbBrands: ["Škoda", "Skoda"],
    intro:
      "Škoda mit laufendem Leasing, auf BuyAuto zur Übernahme inseriert. Unter den Inseraten: die Gebühren und Prüfregeln von AMAG Leasing, die Škoda zu ihren Kernmarken zählt.",
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

/** Intro for a page without a curated entry: from its lender entry, else neutral. */
function dynamicIntro(dbBrand: string): string {
  const lender = brandLenderFor({ slug: slugifyBrandName(dbBrand), name: dbBrand });
  switch (lender?.basis) {
    case "fiat-partner":
      return `${dbBrand}-Leasingverträge, die auf BuyAuto zur Übernahme inseriert sind. Weiter unten steht, was CA Auto Finance als Leasingpartner von Fiat für eine Vertragsumschreibung verrechnet.`;
    case "ca-faq-brand":
      return `${dbBrand}-Leasingverträge zur Übernahme auf BuyAuto. CA Auto Finance nennt ${dbBrand} unter den Marken, auf die sie spezialisiert ist; ihre Gebühr für die Umschreibung steht weiter unten.`;
    case "amag-core-brand":
      return `${dbBrand} zur Leasingübernahme auf BuyAuto. AMAG Leasing führt ${dbBrand} als Kernmarke; ihre Bestimmungen folgen nach den Inseraten.`;
    default:
      return `Auf BuyAuto inserierte Leasingübernahmen der Marke ${dbBrand}.`;
  }
}

/**
 * Brand page for a DB brand that has inventory but no curated entry (e.g. Fiat).
 * Nothing brand-specific is invented: the intro comes from brandLenders.ts or is
 * neutral, and the models on the page come from its live listings.
 */
export function buildDynamicBrand(dbBrand: string): LeasingBrand {
  return {
    slug: slugifyBrandName(dbBrand),
    name: dbBrand,
    dbBrands: [dbBrand],
    intro: dynamicIntro(dbBrand),
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
  const dbBrands = new Set<string>();
  for (const row of rows) {
    if (typeof row.brand === "string" && row.brand.trim() !== "") dbBrands.add(row.brand);
  }

  for (const dbBrand of dbBrands) {
    if (slugifyBrandName(dbBrand) !== normalized) continue;
    const curatedCover = curatedBrandForDbBrand(dbBrand);
    if (curatedCover) return { redirectTo: curatedCover.slug };
    return { brand: buildDynamicBrand(dbBrand) };
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

// ---------------------------------------------------------------------------
// Indexing and redirect targets
// ---------------------------------------------------------------------------

/** A brand page is indexed ("index, follow") from this many live Leasingübernahmen on. */
export const BRAND_PAGE_MIN_INDEXABLE_LISTINGS = 2;

export function isIndexableBrandCount(count: number): boolean {
  return count >= BRAND_PAGE_MIN_INDEXABLE_LISTINGS;
}

export interface BrandPageSummary {
  slug: string;
  name: string;
  dbBrands: string[];
  /** Live Leasingübernahme listings on the page. */
  count: number;
}

/**
 * Brand pages with their live Leasingübernahme count. Pass ONLY live
 * Leasingübernahme rows (Kaufart rule, see lib/buyauto/kaufart).
 */
export function brandPageCounts(liveTakeoverRows: { brand: string | null }[]): BrandPageSummary[] {
  const rows = liveTakeoverRows
    .map((r) => (typeof r.brand === "string" ? r.brand.trim() : ""))
    .filter((b) => b !== "");
  return brandPagesForInventory(rows.map((brand) => ({ brand, model: null, deal_type: null }))).map((page) => ({
    ...page,
    count: rows.filter((b) => page.dbBrands.includes(b)).length,
  }));
}

/** The brand pages that are indexable — the only ones the sitemap and brand link blocks list. */
export function indexableBrandPages(liveTakeoverRows: { brand: string | null }[]): BrandPageSummary[] {
  return brandPageCounts(liveTakeoverRows).filter((b) => isIndexableBrandCount(b.count));
}

/** The brand page that covers a raw listings.brand value ("Mercedes" -> mercedes-benz). */
export function brandPageForDbBrand(dbBrand: string): { slug: string; name: string; dbBrands: string[] } | null {
  const trimmed = dbBrand.trim();
  if (!trimmed) return null;
  const curated = curatedBrandForDbBrand(trimmed);
  if (curated) return { slug: curated.slug, name: curated.name, dbBrands: dbBrandsFor(curated) };
  const slug = slugifyBrandName(trimmed);
  return slug ? { slug, name: trimmed, dbBrands: [trimmed] } : null;
}

/**
 * The brand page a listing URL segment starts with ("mercedes-eqe" -> mercedes-benz),
 * for listings that no longer have a row. Matches curated slugs, their DB
 * spellings and the given DB brands; the longest match wins.
 */
export function brandPageForListingSlug(
  slugPrefix: string,
  knownDbBrands: string[]
): { slug: string; name: string; dbBrands: string[] } | null {
  const segment = slugPrefix.trim().toLowerCase();
  if (!segment) return null;

  const candidates: { key: string; page: { slug: string; name: string; dbBrands: string[] } }[] = [];
  for (const curated of LEASING_BRANDS) {
    const page = { slug: curated.slug, name: curated.name, dbBrands: dbBrandsFor(curated) };
    for (const key of [curated.slug, ...dbBrandsFor(curated).map(slugifyBrandName)]) candidates.push({ key, page });
  }
  for (const dbBrand of knownDbBrands) {
    const page = brandPageForDbBrand(dbBrand);
    if (page) candidates.push({ key: slugifyBrandName(dbBrand), page });
  }

  const match = candidates
    .filter(({ key }) => key && (segment === key || segment.startsWith(`${key}-`)))
    .sort((a, b) => b.key.length - a.key.length)[0];
  return match ? match.page : null;
}
