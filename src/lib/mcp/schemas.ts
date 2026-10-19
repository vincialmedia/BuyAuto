/** JSON Schemas of the listing objects the connector returns (outputSchema of search_listings and get_listing). */
import type { JsonSchema } from "@/lib/mcp/protocol";

export const nullable = (type: string | string[]) => ({ type: Array.isArray(type) ? [...type, "null"] : [type, "null"] });

export const LISTING_SUMMARY_PROPERTIES: Record<string, JsonSchema> = {
  id: { type: "string", description: "Listing id; pass it to get_listing." },
  url: { type: "string", description: "Listing page on buyauto.ch, where buyers contact the seller." },
  title: { type: "string" },
  offer_type: { type: "string", enum: ["lease_takeover", "direct_purchase"] },
  offer_label: { type: "string" },
  monthly_rate_chf: { ...nullable("number"), description: "Lease takeover: monthly rate in CHF." },
  remaining_months: { ...nullable("integer"), description: "Lease takeover: months left on the contract (as of today)." },
  deposit_chf: { ...nullable("number"), description: "Lease takeover: deposit (Kaution) in CHF; 0 = none." },
  remaining_km_allowance: { ...nullable("number"), description: "Lease takeover: kilometres left in the contract, if stated." },
  purchase_price_chf: { ...nullable("number"), description: "Direct purchase: price in CHF; null = on request." },
  new_leasing_offered: { type: "boolean", description: "Direct purchase: the seller also offers new leasing financing." },
  brand: { type: "string" },
  model: { type: "string" },
  year: nullable("integer"),
  mileage_km: nullable("number"),
  fuel: nullable("string"),
  gearbox: nullable("string"),
  body: nullable("string"),
  power_hp: nullable("number"),
  location: { ...nullable("string"), description: "Town and canton code where the car is." },
  canton_code: nullable("string"),
  seller_type: { type: "string", enum: ["private", "garage"] },
  garage_name: nullable("string"),
  featured: { type: "boolean", description: "Paid featured placement on BuyAuto." },
  image_url: nullable("string"),
  listed_on: { ...nullable("string"), description: "Date the listing was created (YYYY-MM-DD)." },
};

export const LISTING_SUMMARY_REQUIRED = [
  "id", "url", "title", "offer_type", "offer_label", "monthly_rate_chf", "remaining_months", "deposit_chf",
  "remaining_km_allowance", "purchase_price_chf", "new_leasing_offered", "brand", "model", "year", "mileage_km",
  "fuel", "gearbox", "body", "power_hp", "location", "canton_code", "seller_type", "garage_name", "featured",
  "image_url", "listed_on",
];

export const LISTING_SUMMARY_SCHEMA: JsonSchema = {
  type: "object",
  properties: LISTING_SUMMARY_PROPERTIES,
  required: LISTING_SUMMARY_REQUIRED,
};

export const LISTING_DETAIL_SCHEMA: JsonSchema = {
  type: "object",
  properties: {
    ...LISTING_SUMMARY_PROPERTIES,
    contract_ended: { type: "boolean", description: "Lease takeover whose contract has run out (no longer a live offer)." },
    variant: nullable("string"),
    first_registration: { ...nullable("string"), description: "First registration date (YYYY-MM-DD)." },
    drivetrain: nullable("string"),
    description: { ...nullable("string"), description: "Seller's description; contact details and links removed." },
    images: { type: "array", items: { type: "string" } },
    garage_page_url: nullable("string"),
    contact: {
      type: "object",
      properties: { how: { type: "string" }, url: { type: "string" } },
      required: ["how", "url"],
    },
  },
  required: [
    ...LISTING_SUMMARY_REQUIRED,
    "contract_ended", "variant", "first_registration", "drivetrain", "description", "images", "garage_page_url", "contact",
  ],
};
