/**
 * Brand -> leasing company, for the lender section on /leasinguebernahme/[marke].
 *
 * Pure data plus a lookup. The facts themselves (fees, clauses, quotes, sources)
 * live in facts.ts; this file only says which facts.ts entry a brand page
 * talks about and on which sourced basis the brand and the lender are linked.
 * A brand without an entry (Tesla, Volvo, Toyota, Mini, Dacia, Renault, …) has
 * no published lender fact and gets no lender section.
 *
 * Keys are URL slugs (slugifyListingPart of the brand name), so curated pages
 * ("skoda") and dynamic pages that resolve by their DB brand name ("Alfa Romeo"
 * -> "alfa-romeo", "SEAT" -> "seat") hit the same table.
 */
import { slugifyListingPart } from "@/lib/buyauto/listingUrl";

export type BrandLenderKey = "amag" | "bmw" | "ca-auto-finance" | "porsche" | "mercedes-benz";

/**
 * How the source ties the brand to the lender:
 * - "amag-core-brand": named among the Kernmarken in AMAG_LEASING.brandStatement
 *   (Geschäftsbericht 2025). Never ALB Ziff. 9.1.1.
 * - "fiat-partner": CA_AUTO_FINANCE.role, "der Leasingpartner von Fiat".
 * - "ca-faq-brand": named in CA_AUTO_FINANCE.brandsQuote (FAQ: the brands it is
 *   specialised in). Say only that; it is not called the brand's exclusive lender.
 * - "own-company": the brand's own leasing company (BMW, Porsche, Mercedes-Benz).
 */
export type BrandLenderBasis = "amag-core-brand" | "fiat-partner" | "ca-faq-brand" | "own-company";

export interface BrandLender {
  lender: BrandLenderKey;
  basis: BrandLenderBasis;
  /** Lender section on the cost page (anchors owned by /leasinguebernahme-kosten). */
  costHref: string;
}

const COST_PAGE = "/leasinguebernahme-kosten";

const AMAG: BrandLender = { lender: "amag", basis: "amag-core-brand", costHref: `${COST_PAGE}#amag` };
// The other lenders link their own row of the cost page's lender table.
const CA_FIAT: BrandLender = { lender: "ca-auto-finance", basis: "fiat-partner", costHref: `${COST_PAGE}#ca-auto-finance` };
const CA_FAQ: BrandLender = { lender: "ca-auto-finance", basis: "ca-faq-brand", costHref: `${COST_PAGE}#ca-auto-finance` };
const BMW: BrandLender = { lender: "bmw", basis: "own-company", costHref: `${COST_PAGE}#bmw` };
const PORSCHE: BrandLender = { lender: "porsche", basis: "own-company", costHref: `${COST_PAGE}#porsche` };
const MERCEDES: BrandLender = { lender: "mercedes-benz", basis: "own-company", costHref: `${COST_PAGE}#mercedes-benz` };

/** Keyed by brand slug. */
export const BRAND_LENDERS: Readonly<Record<string, BrandLender>> = {
  // AMAG Leasing, Geschäftsbericht 2025: «Von den Kernmarken Volkswagen, Audi, SEAT, CUPRA, Škoda und VW Nutzfahrzeuge …»
  volkswagen: AMAG,
  audi: AMAG,
  seat: AMAG,
  cupra: AMAG,
  skoda: AMAG,
  "vw-nutzfahrzeuge": AMAG,
  "volkswagen-nutzfahrzeuge": AMAG,
  // CA Auto Finance Suisse SA: Fiat's Leasingpartner; FAQ names the other brands.
  fiat: CA_FIAT,
  abarth: CA_FAQ,
  "fiat-professional": CA_FAQ,
  "alfa-romeo": CA_FAQ,
  jeep: CA_FAQ,
  maserati: CA_FAQ,
  // The brands' own leasing companies.
  bmw: BMW,
  porsche: PORSCHE,
  "mercedes-benz": MERCEDES,
  mercedes: MERCEDES,
};

/**
 * The lender a brand page covers, or null. Matches the page slug first, then the
 * display name and every stored DB spelling (dynamic pages pass their DB brand,
 * e.g. "Fiat" or "Alfa Romeo").
 */
export function brandLenderFor(brand: { slug: string; name?: string; dbBrands?: string[] }): BrandLender | null {
  const candidates = [brand.slug, brand.name ?? "", ...(brand.dbBrands ?? [])]
    .map((value) => slugifyListingPart(value))
    .filter((key) => key !== "");
  for (const key of candidates) {
    if (Object.prototype.hasOwnProperty.call(BRAND_LENDERS, key)) return BRAND_LENDERS[key];
  }
  return null;
}
