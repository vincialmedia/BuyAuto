/**
 * Finds live BuyAuto Leasingübernahmen of the same model as an Auto-Abo example
 * (AUTO_ABO_PROVIDERS in facts.ts), for the "same model, both ways" block on
 * /leasinguebernahme-vs-autoabo. Pure functions: the page feeds them the live
 * offer index in getStaticProps. Tests: `npx tsx scripts/test-autoabo-match.ts`.
 */
import type { AutoAboOffer } from "@/lib/buyauto/facts";
import { LEASING_BRANDS, dbBrandsFor } from "@/lib/buyauto/leasingBrands";
import { buildListingHref } from "@/lib/buyauto/listingUrl";

/** The fields of a live Leasingübernahme the comparison reads (flattened PublicOffer). */
export interface TakeoverCandidate {
  id: string;
  brand: string | null;
  model: string | null;
  variant: string | null;
  year: number | null;
  /** Monthly takeover rate (offer.rateChf). */
  rateChf: number | null;
  /** Remaining months as of today (offer.months). */
  months: number | null;
  /** Kaution the seller asks (offer.kautionChf, 0 = none). */
  kautionChf: number | null;
}

/** A matched listing, JSON-serializable for getStaticProps. */
export interface MatchedTakeover {
  id: string;
  href: string;
  title: string;
  year: number | null;
  rateChf: number;
  months: number | null;
  kautionChf: number | null;
}

export interface SameModelMatch {
  /** Live Leasingübernahmen of the model in total. */
  total: number;
  /** The ones shown: newest model year first, then the lower rate. */
  listings: MatchedTakeover[];
}

/** "Škoda " -> "skoda": lower case, no diacritics, single spaces. */
export function normalizeVehicleText(value: string): string {
  return value
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Every spelling leasingBrands.ts treats as the same brand, normalized:
 * "Mercedes" -> ["mercedes-benz", "mercedes"], "Skoda" -> ["skoda"] (Škoda/Skoda
 * normalize alike). A brand without a curated entry is only itself.
 */
export function brandAliases(brand: string): string[] {
  const key = normalizeVehicleText(brand);
  if (!key) return [];
  const curated = LEASING_BRANDS.find((b) =>
    [b.name, ...dbBrandsFor(b)].some((name) => normalizeVehicleText(name) === key)
  );
  const names = curated ? [curated.name, ...dbBrandsFor(curated)] : [brand];
  return [...new Set(names.map(normalizeVehicleText))];
}

export function isSameBrand(listingBrand: string | null, offerBrand: string): boolean {
  if (typeof listingBrand !== "string") return false;
  const listingKey = normalizeVehicleText(listingBrand);
  return listingKey !== "" && brandAliases(offerBrand).includes(listingKey);
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * True when the listing's model contains the offer's model as a whole token,
 * case-insensitively: "X3", "X3 xDrive20d" and "Corsa-e" match "X3" / "Corsa";
 * "iX3" and "X30" do not match "X3", "2008" does not match "208".
 */
export function modelMatches(listingModel: string | null, offerListingModel: string): boolean {
  if (typeof listingModel !== "string") return false;
  const needle = normalizeVehicleText(offerListingModel);
  if (!needle) return false;
  const pattern = new RegExp(`(^|[^a-z0-9])${escapeRegExp(needle)}($|[^a-z0-9])`);
  return pattern.test(normalizeVehicleText(listingModel));
}

/** "BMW X3 xDrive20d"; a variant that already names the model replaces it ("BMW X3 20d xDrive"). */
export function takeoverTitle(c: Pick<TakeoverCandidate, "brand" | "model" | "variant">): string {
  const brand = c.brand?.trim() ?? "";
  const model = c.model?.trim() ?? "";
  const variant = c.variant?.trim() ?? "";
  const variantNamesModel = model !== "" && variant !== "" && normalizeVehicleText(variant).includes(normalizeVehicleText(model));
  const parts = variantNamesModel ? [brand, variant] : [brand, model, variant];
  return parts.filter((p) => p !== "").join(" ");
}

/**
 * Live Leasingübernahmen of the offer's model: same brand (incl. aliases), model
 * token match, a monthly rate > 0. Pass only live takeovers (liveTakeovers()).
 */
export function matchSameModel(
  offer: Pick<AutoAboOffer, "brand" | "listingModel">,
  candidates: TakeoverCandidate[],
  limit = 4
): SameModelMatch {
  const matches = candidates
    .filter(
      (c) =>
        typeof c.rateChf === "number" &&
        c.rateChf > 0 &&
        isSameBrand(c.brand, offer.brand) &&
        modelMatches(c.model, offer.listingModel)
    )
    .sort(
      (a, b) =>
        (b.year ?? -Infinity) - (a.year ?? -Infinity) || (a.rateChf as number) - (b.rateChf as number) || a.id.localeCompare(b.id)
    );

  return {
    total: matches.length,
    listings: matches.slice(0, Math.max(0, limit)).map((c) => ({
      id: c.id,
      href: buildListingHref({ id: c.id, brand: c.brand, model: c.model }),
      title: takeoverTitle(c),
      year: typeof c.year === "number" ? c.year : null,
      rateChf: c.rateChf as number,
      months: typeof c.months === "number" ? c.months : null,
      kautionChf: typeof c.kautionChf === "number" ? c.kautionChf : null,
    })),
  };
}
