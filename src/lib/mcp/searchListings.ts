/**
 * search_listings: the live inventory through the site's own engine
 * (searchListingsOrThrow), so rates, months and Kaution follow the Kaufart rule
 * exactly as on /suche.
 */
import { BODY_TYPES, CANTON_CODES, FUEL_TYPES, GEARBOX_TYPES } from "@/lib/buyauto/listingContract";
import type { SearchQuery } from "@/lib/buyauto/search";
import {
  BODY_ALIASES,
  CANTON_ALIASES,
  FUEL_ALIASES,
  GEARBOX_ALIASES,
  checkRange,
  optBoolean,
  optEnum,
  optEnumList,
  optNumber,
  optString,
  rejectUnknownKeys,
  type Args,
} from "@/lib/mcp/args";
import { matchBrands, matchesQuery } from "@/lib/mcp/brands";
import type { ListingDataSource, ListingWithCanton } from "@/lib/mcp/dataSource";
import { cantonCodeFor, listingSummary, remainingKmFor, siteUrl, type ListingSummaryOutput } from "@/lib/mcp/listingOutput";
import { ToolInputError, toolResult, type JsonSchema } from "@/lib/mcp/protocol";
import { LISTING_SUMMARY_SCHEMA } from "@/lib/mcp/schemas";

export const SORT_VALUES = [
  "relevance",
  "newest",
  "price_asc",
  "price_desc",
  "remaining_months_asc",
  "remaining_months_desc",
  "mileage_asc",
  "year_desc",
] as const;
export type SortValue = (typeof SORT_VALUES)[number];

export const SORT_MAP: Record<SortValue, NonNullable<SearchQuery["sort"]>> = {
  relevance: "relevance",
  newest: "dateDesc",
  price_asc: "priceAsc",
  price_desc: "priceDesc",
  remaining_months_asc: "monthsAsc",
  remaining_months_desc: "monthsDesc",
  mileage_asc: "kmAsc",
  year_desc: "yearDesc",
};

export const OFFER_TYPES = ["lease_takeover", "direct_purchase", "all"] as const;

export const SEARCH_ARG_KEYS = [
  "offer_type",
  "brand",
  "model",
  "query",
  "min_monthly_rate_chf",
  "max_monthly_rate_chf",
  "min_remaining_months",
  "max_remaining_months",
  "no_deposit",
  "min_purchase_price_chf",
  "max_purchase_price_chf",
  "max_mileage_km",
  "min_remaining_km_allowance",
  "min_year",
  "max_year",
  "fuel",
  "gearbox",
  "body",
  "canton",
  "sort",
  "page",
  "page_size",
] as const;

export const DEFAULT_PAGE_SIZE = 8;
export const MAX_PAGE_SIZE = 20;
/**
 * Canton, free-text and kilometres-left filters run on the full rows of all matches (the canton
 * also comes from the location text, which 2026 inventory needs: older listings
 * have no canton_code). The inventory is small; 150 keeps the id list in one
 * PostgREST URL well under common 8 KB limits.
 */
export const POST_FILTER_LIMIT = 150;

export const SEARCH_INPUT_SCHEMA: JsonSchema = {
  type: "object",
  properties: {
    offer_type: {
      type: "string",
      enum: OFFER_TYPES,
      description:
        "lease_takeover: take over a running leasing contract (monthly rate, remaining months). direct_purchase: buy the car outright. all: both. Default: all, or the type the price or months filters imply.",
    },
    brand: { type: "string", description: "Car brand, e.g. BMW, Tesla, Mercedes, VW, Škoda." },
    model: { type: "string", description: "Model or part of it, e.g. X3, Model 3, Golf (substring match)." },
    query: {
      type: "string",
      description: "Free-text words that must all appear in brand, model or trim, e.g. \"Model Y Long Range\". Prefer brand and model when known.",
    },
    min_monthly_rate_chf: { type: "number", minimum: 0, maximum: 20000, description: "Lease takeover: lowest monthly rate in CHF." },
    max_monthly_rate_chf: { type: "number", minimum: 0, maximum: 20000, description: "Lease takeover: highest monthly rate in CHF." },
    min_remaining_months: { type: "integer", minimum: 0, maximum: 120, description: "Lease takeover: at least this many months left." },
    max_remaining_months: { type: "integer", minimum: 0, maximum: 120, description: "Lease takeover: at most this many months left." },
    no_deposit: { type: "boolean", description: "Lease takeover: only contracts without a deposit (Kaution)." },
    min_purchase_price_chf: { type: "number", minimum: 0, maximum: 5000000, description: "Direct purchase: lowest price in CHF." },
    max_purchase_price_chf: { type: "number", minimum: 0, maximum: 5000000, description: "Direct purchase: highest price in CHF." },
    max_mileage_km: { type: "integer", minimum: 0, maximum: 1000000, description: "Highest odometer reading in km." },
    min_remaining_km_allowance: {
      type: "integer",
      minimum: 0,
      maximum: 500000,
      description: "Lease takeover: at least this many kilometres left in the contract. Listings that state none are left out.",
    },
    min_year: { type: "integer", minimum: 1990, maximum: 2030, description: "Earliest model year." },
    max_year: { type: "integer", minimum: 1990, maximum: 2030, description: "Latest model year." },
    fuel: {
      type: "array",
      items: { type: "string", enum: FUEL_TYPES },
      description: "Fuel: Benzin = petrol, Diesel, Hybrid (incl. plug-in), Elektro = electric.",
    },
    gearbox: { type: "string", enum: GEARBOX_TYPES, description: "Automatik = automatic, Manuell = manual." },
    body: {
      type: "array",
      items: { type: "string", enum: BODY_TYPES },
      description: "Body: Limousine = sedan or hatchback, Kombi = estate, SUV, Cabrio = convertible, Coupe.",
    },
    canton: {
      type: "array",
      items: { type: "string", enum: CANTON_CODES },
      description: "Swiss canton codes where the car is, e.g. ZH, AG, BE.",
    },
    sort: {
      type: "string",
      enum: SORT_VALUES,
      description:
        "relevance (default: featured first, then newest), newest, price_asc / price_desc (needs offer_type lease_takeover or direct_purchase), remaining_months_asc / remaining_months_desc, mileage_asc, year_desc.",
    },
    page: { type: "integer", minimum: 1, maximum: 50, description: "Result page, starting at 1." },
    page_size: { type: "integer", minimum: 1, maximum: MAX_PAGE_SIZE, description: `Results per page (default ${DEFAULT_PAGE_SIZE}).` },
  },
  additionalProperties: false,
};

export const SEARCH_OUTPUT_SCHEMA: JsonSchema = {
  type: "object",
  properties: {
    total: { type: "integer", description: "Number of matching live listings." },
    page: { type: "integer" },
    page_size: { type: "integer" },
    has_more: { type: "boolean" },
    results: { type: "array", items: LISTING_SUMMARY_SCHEMA },
    search_url: { type: "string", description: "The same search on buyauto.ch." },
    applied_filters: { type: "object" },
    notes: { type: "array", items: { type: "string" } },
  },
  required: ["total", "page", "page_size", "has_more", "results", "search_url", "applied_filters", "notes"],
};

/** The model filter becomes a SQL LIKE pattern: wildcards and PostgREST syntax characters are dropped. */
export function likeSafe(value: string | undefined): string | undefined {
  if (value === undefined) return undefined;
  const cleaned = value.replace(/[%_*,()\\]/g, " ").replace(/\s+/g, " ").trim();
  return cleaned || undefined;
}

export interface ParsedSearch {
  query: SearchQuery;
  cantons?: string[];
  freeText?: string;
  minRemainingKm?: number;
  brandInput?: string;
  page: number;
  pageSize: number;
  applied: Record<string, unknown>;
  notes: string[];
}

export function parseSearchArgs(args: Args): ParsedSearch {
  rejectUnknownKeys(args, SEARCH_ARG_KEYS, "search_listings");
  const notes: string[] = [];

  const explicitType = optEnum(args, "offer_type", OFFER_TYPES, {
    leasinguebernahme: "lease_takeover", takeover: "lease_takeover", lease: "lease_takeover", leasing: "lease_takeover",
    direktkauf: "direct_purchase", purchase: "direct_purchase", buy: "direct_purchase", sale: "direct_purchase",
    both: "all", any: "all",
  });
  const brand = optString(args, "brand", 40);
  const model = likeSafe(optString(args, "model", 60));
  const freeText = optString(args, "query", 80);
  const minRate = optNumber(args, "min_monthly_rate_chf", { min: 0, max: 20000 });
  const maxRate = optNumber(args, "max_monthly_rate_chf", { min: 0, max: 20000 });
  const minMonths = optNumber(args, "min_remaining_months", { min: 0, max: 120, integer: true });
  const maxMonths = optNumber(args, "max_remaining_months", { min: 0, max: 120, integer: true });
  const noDeposit = optBoolean(args, "no_deposit");
  const minPrice = optNumber(args, "min_purchase_price_chf", { min: 0, max: 5000000 });
  const maxPrice = optNumber(args, "max_purchase_price_chf", { min: 0, max: 5000000 });
  const kmMax = optNumber(args, "max_mileage_km", { min: 0, max: 1000000, integer: true });
  const minRemainingKm = optNumber(args, "min_remaining_km_allowance", { min: 0, max: 500000, integer: true });
  const yearMin = optNumber(args, "min_year", { min: 1990, max: 2030, integer: true });
  const yearMax = optNumber(args, "max_year", { min: 1990, max: 2030, integer: true });
  const fuel = optEnumList(args, "fuel", FUEL_TYPES, FUEL_ALIASES);
  const gearbox = optEnum(args, "gearbox", GEARBOX_TYPES, GEARBOX_ALIASES);
  const body = optEnumList(args, "body", BODY_TYPES, BODY_ALIASES);
  const cantons = optEnumList(args, "canton", CANTON_CODES, CANTON_ALIASES);
  const sort = optEnum(args, "sort", SORT_VALUES) ?? "relevance";
  const page = optNumber(args, "page", { min: 1, max: 50, integer: true }) ?? 1;
  const pageSize = optNumber(args, "page_size", { min: 1, max: MAX_PAGE_SIZE, integer: true }) ?? DEFAULT_PAGE_SIZE;

  checkRange("min_monthly_rate_chf", minRate, "max_monthly_rate_chf", maxRate);
  checkRange("min_remaining_months", minMonths, "max_remaining_months", maxMonths);
  checkRange("min_purchase_price_chf", minPrice, "max_purchase_price_chf", maxPrice);
  checkRange("min_year", yearMin, "max_year", yearMax);

  const takeoverFilters = [
    minRate !== undefined && "min_monthly_rate_chf",
    maxRate !== undefined && "max_monthly_rate_chf",
    minMonths !== undefined && "min_remaining_months",
    maxMonths !== undefined && "max_remaining_months",
    noDeposit === true && "no_deposit",
    minRemainingKm !== undefined && "min_remaining_km_allowance",
    sort.startsWith("remaining_months") && `sort=${sort}`,
  ].filter(Boolean) as string[];
  const purchaseFilters = [
    minPrice !== undefined && "min_purchase_price_chf",
    maxPrice !== undefined && "max_purchase_price_chf",
  ].filter(Boolean) as string[];

  if (takeoverFilters.length && purchaseFilters.length) {
    throw new ToolInputError(
      `${takeoverFilters.join(", ")} apply to lease takeovers and ${purchaseFilters.join(", ")} to direct purchases. Use one set per search (or run two searches).`
    );
  }

  let offerType = explicitType;
  if (!offerType) {
    offerType = takeoverFilters.length ? "lease_takeover" : purchaseFilters.length ? "direct_purchase" : "all";
    if (offerType !== "all") notes.push(`offer_type set to ${offerType} because of ${[...takeoverFilters, ...purchaseFilters].join(", ")}.`);
  } else if (offerType !== "lease_takeover" && takeoverFilters.length) {
    throw new ToolInputError(`${takeoverFilters.join(", ")} only apply to lease takeovers; set offer_type to lease_takeover or drop them.`);
  } else if (offerType !== "direct_purchase" && purchaseFilters.length) {
    throw new ToolInputError(`${purchaseFilters.join(", ")} only apply to direct purchases; set offer_type to direct_purchase or drop them.`);
  }

  if ((sort === "price_asc" || sort === "price_desc") && offerType === "all") {
    throw new ToolInputError(
      "Sorting by price needs offer_type lease_takeover (sorts by monthly rate) or direct_purchase (sorts by purchase price)."
    );
  }

  const query: SearchQuery = {
    model,
    yearMin,
    yearMax,
    kmMax,
    fuel,
    gearbox: gearbox ? [gearbox] : undefined,
    body,
    noDeposit: noDeposit === true ? true : undefined,
    dealType: offerType === "all" ? undefined : offerType,
    priceMin: offerType === "lease_takeover" ? minRate : offerType === "direct_purchase" ? minPrice : undefined,
    priceMax: offerType === "lease_takeover" ? maxRate : offerType === "direct_purchase" ? maxPrice : undefined,
    monthsMin: minMonths,
    monthsMax: maxMonths,
    sort: SORT_MAP[sort],
  };

  const applied: Record<string, unknown> = { offer_type: offerType, sort };
  const record = (key: string, value: unknown) => {
    if (value !== undefined && !(Array.isArray(value) && value.length === 0)) applied[key] = value;
  };
  record("brand", brand);
  record("model", model);
  record("query", freeText);
  record("min_monthly_rate_chf", minRate);
  record("max_monthly_rate_chf", maxRate);
  record("min_remaining_months", minMonths);
  record("max_remaining_months", maxMonths);
  record("no_deposit", noDeposit);
  record("min_purchase_price_chf", minPrice);
  record("max_purchase_price_chf", maxPrice);
  record("max_mileage_km", kmMax);
  record("min_remaining_km_allowance", minRemainingKm);
  record("min_year", yearMin);
  record("max_year", yearMax);
  record("fuel", fuel);
  record("gearbox", gearbox);
  record("body", body);
  record("canton", cantons);

  return { query, cantons, freeText, minRemainingKm, brandInput: brand, page, pageSize, applied, notes };
}

export function searchPageUrl(query: SearchQuery, extra: { cantons?: string[]; freeText?: string }): string {
  const p = new URLSearchParams();
  if (query.dealType) p.set("dealType", query.dealType);
  // The site's keyword search matches one word against brand or model.
  if (extra.freeText && !/\s/.test(extra.freeText)) p.set("query", extra.freeText);
  if (query.brands?.length) p.set("brand", query.brands[0]);
  if (query.model) p.set("model", query.model);
  const numbers: Array<[string, number | undefined]> = [
    ["yearMin", query.yearMin],
    ["yearMax", query.yearMax],
    ["priceMin", query.priceMin],
    ["priceMax", query.priceMax],
    ["monthsMin", query.monthsMin],
    ["monthsMax", query.monthsMax],
    ["kmMax", query.kmMax],
  ];
  for (const [key, value] of numbers) if (typeof value === "number") p.set(key, String(value));
  for (const v of query.fuel ?? []) p.append("fuel", v);
  for (const v of query.gearbox ?? []) p.append("gearbox", v);
  for (const v of query.body ?? []) p.append("body", v);
  for (const v of extra.cantons ?? []) p.append("canton", v);
  if (query.noDeposit) p.set("noDeposit", "true");
  if (query.sort && query.sort !== "relevance") p.set("sort", query.sort);
  return siteUrl("/suche", p);
}

export async function runSearch(args: Args, data: ListingDataSource) {
  const parsed = parseSearchArgs(args);
  const { query, cantons, minRemainingKm, page, pageSize, applied, notes } = parsed;
  let freeText = parsed.freeText;

  if (parsed.brandInput) {
    const live = await data.liveBrands();
    const brands = matchBrands(parsed.brandInput, live);
    if (brands.length === 0) {
      // Not a brand with listings ("AMG", "GTI"): look for it in model and trim instead.
      freeText = [freeText, parsed.brandInput].filter(Boolean).join(" ");
      notes.push(
        `"${parsed.brandInput}" is not a brand with listings on BuyAuto right now, so it was searched as a word in model and trim. Brands with listings: ${live
          .slice()
          .sort((a, b) => a.localeCompare(b, "de-CH"))
          .join(", ")}.`
      );
    } else {
      query.brands = brands;
      if (brands.length > 1 || brands[0].toLowerCase() !== parsed.brandInput.toLowerCase()) {
        notes.push(`Brand "${parsed.brandInput}" matched: ${brands.join(", ")}.`);
      }
    }
  }

  let items: ListingWithCanton[];
  let total: number;

  if (cantons?.length || freeText || minRemainingKm !== undefined) {
    const all = await data.search({ ...query, page: 1, pageSize: POST_FILTER_LIMIT });
    const candidates = (all.items as ListingWithCanton[]).filter(
      (listing) =>
        (!freeText || matchesQuery(listing, freeText)) &&
        (minRemainingKm === undefined || (remainingKmFor(listing) ?? -1) >= minRemainingKm)
    );
    const filtered = cantons?.length
      ? candidates.filter((listing) => cantons.includes(cantonCodeFor(listing.location, listing.canton_code) ?? ""))
      : candidates;
    if (cantons?.length) {
      const withoutCanton = candidates.filter((listing) => !cantonCodeFor(listing.location, listing.canton_code)).length;
      if (withoutCanton > 0) {
        notes.push(`${withoutCanton} otherwise matching listing(s) state no canton and were left out by the canton filter.`);
      }
    }
    if (all.total > POST_FILTER_LIMIT) {
      notes.push(
        `Only the first ${POST_FILTER_LIMIT} of ${all.total} matches were checked for canton, keywords and kilometres left; add filters to narrow the search.`
      );
    }
    total = filtered.length;
    items = filtered.slice((page - 1) * pageSize, page * pageSize);
  } else {
    const result = await data.search({ ...query, page, pageSize });
    total = result.total;
    items = result.items as ListingWithCanton[];
  }

  const results: ListingSummaryOutput[] = items.map((listing) => listingSummary(listing));

  if (total === 0) {
    notes.push("No live listings match these filters. Fewer filters (or a neighbouring canton) may find some.");
  } else if (results.length === 0) {
    notes.push(`Page ${page} is past the last result (${total} in total).`);
  }

  return toolResult({
    total,
    page,
    page_size: pageSize,
    has_more: page * pageSize < total,
    results,
    search_url: searchPageUrl(query, { cantons, freeText }),
    applied_filters: applied,
    notes,
  });
}
