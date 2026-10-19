/**
 * get_takeover_costs: the cost page's sourced facts (facts.ts, leasingCompanies.ts,
 * brandLenders.ts). Every amount comes with its source and Stand, never typed here.
 */
import {
  CANTONAL_FEES,
  CANTONS_WITHOUT_FIXED_PLATE_FEE,
  FACTS_CHECKED_ON,
  FAHRZEUGAUSWEIS_RANGE,
  KONTROLLSCHILDER_RANGE,
  LENDER_TAKEOVER_FEES,
  type FactSource,
  type LenderTakeoverFee,
} from "@/lib/buyauto/facts";
import { LENDER_SECTIONS, type SourcedFact } from "@/lib/buyauto/leasingCompanies";
import { brandLenderFor, type BrandLenderBasis } from "@/lib/buyauto/brandLenders";
import { CANTON_CODES } from "@/lib/buyauto/listingContract";
import { slugifyListingPart } from "@/lib/buyauto/listingUrl";
import { CANTON_ALIASES, optEnum, optString, rejectUnknownKeys, type Args } from "@/lib/mcp/args";
import { BRAND_ALIASES } from "@/lib/mcp/brands";
import { siteUrl } from "@/lib/mcp/listingOutput";
import { toolResult, type JsonSchema } from "@/lib/mcp/protocol";
import { nullable } from "@/lib/mcp/schemas";

export const LENDER_KEYS = LENDER_TAKEOVER_FEES.map((l) => l.key) as LenderTakeoverFee["key"][];

export const BASIS_EXPLAINED: Record<BrandLenderBasis, string> = {
  "amag-core-brand": "AMAG Leasing names this brand among its core brands (AMAG Leasing annual report 2025).",
  "fiat-partner": "CA Auto Finance is Fiat's leasing partner.",
  "ca-faq-brand": "CA Auto Finance's FAQ names this brand among those it specialises in; it is not named as the only lender for it.",
  "own-company": "This is the brand's own leasing company.",
};

export function sourceOut(source: FactSource | null | undefined) {
  if (!source) return null;
  return { title: source.title, url: source.url, stand: source.stand ?? null };
}

export function lenderOut(lender: LenderTakeoverFee, withDetails: boolean) {
  const section = withDetails ? LENDER_SECTIONS.find((s) => s.anchor === lender.key) : undefined;
  const detail = (topic: string, fact: SourcedFact | null) =>
    fact ? { topic, text_de: fact.text, source: sourceOut(fact.source) } : null;
  const details = section
    ? [
        ...section.notes.map((n) => detail("note", n)),
        detail("fee", section.fee),
        detail("checks", section.checks),
        detail("process", section.process),
      ].filter(Boolean)
    : [];

  return {
    key: lender.key,
    name: lender.name,
    fee_published: lender.feeExclVatChf !== null,
    takeover_fee_excl_vat_chf: lender.feeExclVatChf,
    takeover_fee_incl_vat_chf: lender.feeInclVatChf,
    fee_covers: lender.feeLabel,
    source: sourceOut(lender.source),
    details,
    details_url: siteUrl(
      `/leasinguebernahme-kosten#${section ? section.anchor : "leasinggesellschaften"}`
    ),
  };
}

export function cantonOut(code: string) {
  const c = CANTONAL_FEES.find((row) => row.code === code);
  if (!c) return null;
  return {
    canton_code: c.code,
    canton: c.name,
    vehicle_registration_chf: c.fahrzeugausweisChf,
    plates_chf: c.kontrollschilderChf,
    stand: c.stand,
    source_url: c.sourceUrl,
    note_de: c.note ?? null,
  };
}

export const COSTS_INPUT_SCHEMA: JsonSchema = {
  type: "object",
  properties: {
    leasing_company: {
      type: "string",
      enum: LENDER_KEYS,
      description: "Leasing company named in the contract: cembra, ca-auto-finance, amag, bmw, porsche, mercedes-benz, multilease, bank-now.",
    },
    brand: { type: "string", description: "Car brand, to look up the leasing company BuyAuto links to it (e.g. VW → AMAG Leasing)." },
    canton: { type: "string", enum: CANTON_CODES, description: "Canton of the person taking over, for the road traffic office fees." },
  },
  additionalProperties: false,
};

export const COSTS_OUTPUT_SCHEMA: JsonSchema = {
  type: "object",
  properties: {
    checked_on: { type: "string", description: "Date BuyAuto last checked the sources (d.m.yyyy)." },
    cost_page_url: { type: "string" },
    brand_match: {
      type: ["object", "null"],
      properties: {
        brand: { type: "string" },
        leasing_company_key: nullable("string"),
        basis: nullable("string"),
      },
    },
    leasing_companies: { type: "array", items: { type: "object" } },
    cantonal_fees: { type: "array", items: { type: "object" } },
    cantonal_fee_ranges: { type: ["object", "null"] },
    notes: { type: "array", items: { type: "string" } },
  },
  required: ["checked_on", "cost_page_url", "brand_match", "leasing_companies", "cantonal_fees", "cantonal_fee_ranges", "notes"],
};

export async function runTakeoverCosts(args: Args) {
  rejectUnknownKeys(args, ["leasing_company", "brand", "canton"], "get_takeover_costs");
  const lenderAliases: Record<string, LenderTakeoverFee["key"]> = {
    "cembra-money-bank": "cembra", "ca-auto-finance-suisse": "ca-auto-finance", "amag-leasing": "amag",
    "bmw-financial-services": "bmw", "bmw-finanzdienstleistungen": "bmw",
    "porsche-financial-services": "porsche", "mercedes-benz-financial-services": "mercedes-benz", mercedes: "mercedes-benz",
    banknow: "bank-now",
  };
  const lenderKey = optEnum(args, "leasing_company", LENDER_KEYS, lenderAliases);
  const brand = optString(args, "brand", 40);
  const canton = optEnum(args, "canton", CANTON_CODES, CANTON_ALIASES);
  const notes: string[] = [];

  let brandMatch: { brand: string; leasing_company_key: string | null; basis: string | null } | null = null;
  let selected = lenderKey;
  if (brand) {
    const match = brandLenderFor({ slug: slugifyListingPart(BRAND_ALIASES[slugifyListingPart(brand)] ?? brand), name: brand });
    brandMatch = { brand, leasing_company_key: match?.lender ?? null, basis: match ? BASIS_EXPLAINED[match.basis] : null };
    if (match && !selected) selected = match.lender;
    if (!match) notes.push(`BuyAuto has no sourced link between ${brand} and a leasing company. The leasing contract names the company.`);
    else notes.push("The leasing contract names the actual leasing company; check it before relying on the brand match.");
  }

  const lenders = selected
    ? LENDER_TAKEOVER_FEES.filter((l) => l.key === selected).map((l) => lenderOut(l, true))
    : LENDER_TAKEOVER_FEES.map((l) => lenderOut(l, false));

  notes.push(
    "Takeover fees are what each leasing company publishes; fee_published false means it publishes none, so ask it directly. Who pays the fee is agreed between the two parties.",
    "On top, the road traffic office (Strassenverkehrsamt) issues a new vehicle registration document (Fahrzeugausweis) for the person taking over; new plates are only needed if that person has none."
  );

  const cantonalFees = canton ? [cantonOut(canton)].filter(Boolean) : [];
  const ranges = canton
    ? null
    : {
        vehicle_registration_chf: {
          min: { chf: FAHRZEUGAUSWEIS_RANGE.min.chf, cantons: FAHRZEUGAUSWEIS_RANGE.min.codes },
          max: { chf: FAHRZEUGAUSWEIS_RANGE.max.chf, cantons: FAHRZEUGAUSWEIS_RANGE.max.codes },
        },
        plates_chf: {
          min: { chf: KONTROLLSCHILDER_RANGE.min.chf, cantons: KONTROLLSCHILDER_RANGE.min.codes },
          max: { chf: KONTROLLSCHILDER_RANGE.max.chf, cantons: KONTROLLSCHILDER_RANGE.max.codes },
          cantons_without_fixed_amount: CANTONS_WITHOUT_FIXED_PLATE_FEE,
        },
        detail: "Pass canton for one canton's fees and source.",
      };

  return toolResult({
    checked_on: FACTS_CHECKED_ON,
    cost_page_url: siteUrl("/leasinguebernahme-kosten"),
    brand_match: brandMatch,
    leasing_companies: lenders,
    cantonal_fees: cantonalFees,
    cantonal_fee_ranges: ranges,
    notes,
  });
}
