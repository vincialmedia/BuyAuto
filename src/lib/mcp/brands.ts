/** Brand and keyword matching for search_listings (stored brand spellings vary: "Mercedes", "Mercedes-Benz"). */
import { LEASING_BRANDS, dbBrandsFor } from "@/lib/buyauto/leasingBrands";
import { slugifyListingPart } from "@/lib/buyauto/listingUrl";
import type { Listing } from "@/lib/buyauto/types";
import { normalizeText } from "@/lib/mcp/listingOutput";

export const BRAND_ALIASES: Record<string, string> = {
  vw: "volkswagen",
  mercedes: "mercedes-benz",
  merc: "mercedes-benz",
  mb: "mercedes-benz",
  alfa: "alfa-romeo",
  chevy: "chevrolet",
  "land-rover": "land-rover",
  landrover: "land-rover",
};

/** Stored brand spellings a user's brand refers to ("mercedes" → Mercedes, Mercedes-Benz). */
export function matchBrands(input: string, liveBrands: readonly string[]): string[] {
  const raw = slugifyListingPart(input);
  if (!raw) return [];
  const slug = BRAND_ALIASES[raw] ?? raw;
  const out = new Set<string>();

  const curated = LEASING_BRANDS.find(
    (b) => b.slug === slug || slugifyListingPart(b.name) === slug || dbBrandsFor(b).some((d) => slugifyListingPart(d) === slug)
  );
  const curatedSlugs = new Set(curated ? dbBrandsFor(curated).map((d) => slugifyListingPart(d)) : []);

  for (const brand of liveBrands) {
    const brandSlug = slugifyListingPart(brand);
    if (!brandSlug) continue;
    if (brandSlug === slug || brandSlug === raw || curatedSlugs.has(brandSlug)) out.add(brand);
  }
  return Array.from(out).sort((a, b) => a.localeCompare(b, "de-CH"));
}

export function normalizedWords(value: string): string[] {
  return normalizeText(value).split("-").filter(Boolean);
}

/** Every word of the free-text query appears (as a word or word start) in brand, model, trim or title. */
export function matchesQuery(listing: Pick<Listing, "brand" | "model" | "variant" | "title">, query: string): boolean {
  const words = normalizedWords([listing.brand, listing.model, listing.variant ?? "", listing.title ?? ""].join(" "));
  return normalizedWords(query).every((word) => {
    const target = BRAND_ALIASES[word] ? normalizedWords(BRAND_ALIASES[word])[0] : word;
    return words.some((w) => w === target || w.startsWith(target));
  });
}
