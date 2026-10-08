/**
 * <title> and meta description of a listing page (/fahrzeug/[id]).
 *
 *   Leasingübernahme  "{Marke} {Modell} ({Jahr}) – Leasingübernahme CHF {rate}/Mt., {months} Mt. | BuyAuto"
 *   Direktkauf        "{Marke} {Modell} ({Jahr}) – CHF {price} | BuyAuto"
 *
 * The name carries the variant (trim) when there is room: over 70 characters
 * the variant goes first, then " | BuyAuto". The year is printed once, from
 * the year column — stored titles of older listings end in the year
 * ("Mercedes AMG C 63 2017"), which the page used to append a second time.
 */
import { CANTON_LABELS, isCantonCode } from "@/lib/buyauto/listingContract";
import { formatSwissInt } from "@/lib/buyauto/format";
import { kaufartOf } from "@/lib/buyauto/kaufart";
import type { Listing } from "@/lib/buyauto/types";

export const LISTING_TITLE_MAX = 70;
const SITE_SUFFIX = " | BuyAuto";

type SeoListing = Pick<
  Listing,
  | "brand"
  | "model"
  | "title"
  | "year"
  | "kaufart"
  | "deal_type"
  | "financing_type"
  | "leasing_offer"
  | "pricePerMonthCHF"
  | "remainingMonths"
  | "depositCHF"
  | "mileageKm"
  | "location"
  | "purchasePriceCHF"
  | "variant"
> & { canton_code?: string | null };

function clean(value: string | null | undefined): string {
  return typeof value === "string" ? value.replace(/\s+/g, " ").trim() : "";
}

function stripPrefix(text: string, prefix: string): string | null {
  if (!prefix) return text;
  return text.toLowerCase().startsWith(prefix.toLowerCase()) ? text.slice(prefix.length).trim() : null;
}

/**
 * Trim/variant text: the stored title minus brand, model, a trailing year and
 * the seller's "| Zusatz"; falls back to the catalog variant name.
 */
export function listingVariant(listing: SeoListing): string {
  const brand = clean(listing.brand);
  const model = clean(listing.model);
  const year = listing.year ? String(listing.year) : "";

  let rest = clean(listing.title).split(" | ")[0].trim();
  const afterBrand = stripPrefix(rest, brand);
  if (afterBrand !== null) {
    rest = afterBrand;
    const afterModel = stripPrefix(rest, model);
    if (afterModel !== null) rest = afterModel;
    else if (model.toLowerCase().startsWith(rest.toLowerCase())) rest = "";
  } else {
    rest = "";
  }

  if (year) rest = rest.replace(new RegExp(`(^|\\s)${year}$`), "").trim();
  if (rest) return rest;

  const catalogVariant = clean(listing.variant);
  if (!catalogVariant || catalogVariant === year) return "";
  return `${model} `.toLowerCase().includes(`${catalogVariant.toLowerCase()} `) ? "" : catalogVariant;
}

function brandModel(listing: SeoListing): string {
  return [clean(listing.brand), clean(listing.model)].filter(Boolean).join(" ");
}

function withYear(name: string, year: number | null | undefined): string {
  return year ? `${name} (${year})` : name;
}

/** "Mercedes AMG CLA 35 (2023)" — brand, model and year, no variant. */
export function listingNameWithYear(listing: SeoListing): string {
  return withYear(brandModel(listing), listing.year);
}

/** "Mercedes AMG CLA 45 S 4MATIC+" — brand, model and variant (no year), e.g. for JSON-LD. */
export function listingFullName(listing: SeoListing): string {
  const variant = listingVariant(listing);
  return [brandModel(listing), variant].filter(Boolean).join(" ");
}

function offerPart(listing: SeoListing): string | null {
  if (kaufartOf(listing) === "lease_takeover") {
    const rate = listing.pricePerMonthCHF > 0 ? `CHF ${formatSwissInt(listing.pricePerMonthCHF)}/Mt.` : null;
    const months = typeof listing.remainingMonths === "number" && listing.remainingMonths > 0 ? `${listing.remainingMonths} Mt.` : null;
    return ["Leasingübernahme", [rate, months].filter(Boolean).join(", ")].filter(Boolean).join(" ");
  }
  const price = listing.purchasePriceCHF;
  return typeof price === "number" && price > 0 ? `CHF ${formatSwissInt(price)}` : null;
}

export function listingSeoTitle(listing: SeoListing): string {
  const offer = offerPart(listing);
  const variant = listingVariant(listing);
  const compose = (name: string, suffix: string) => `${withYear(name, listing.year)}${offer ? ` – ${offer}` : ""}${suffix}`;

  const fullName = [brandModel(listing), variant].filter(Boolean).join(" ");
  const candidates = [compose(fullName, SITE_SUFFIX), compose(brandModel(listing), SITE_SUFFIX), compose(brandModel(listing), "")];
  return candidates.find((t) => t.length <= LISTING_TITLE_MAX) ?? candidates[candidates.length - 1];
}

/** Canton name ("Zürich") from canton_code, or from the location text. */
export function cantonNameFor(location: string | null | undefined, cantonCode: string | null | undefined): string | null {
  const code = typeof cantonCode === "string" ? cantonCode.trim().toUpperCase() : "";
  if (isCantonCode(code)) return CANTON_LABELS[code];

  const tokens = (location ?? "").split(",").map((t) => t.trim()).filter(Boolean);
  const labels = Object.values(CANTON_LABELS);
  for (let i = tokens.length - 1; i >= 0; i--) {
    const token = tokens[i];
    if (isCantonCode(token.toUpperCase())) return CANTON_LABELS[token.toUpperCase() as keyof typeof CANTON_LABELS];
    const label = labels.find((l) => l.toLowerCase() === token.toLowerCase());
    if (label) return label;
  }
  return null;
}

export function listingMetaDescription(listing: SeoListing): string {
  const name = listingNameWithYear(listing);

  if (kaufartOf(listing) === "lease_takeover") {
    const parts: string[] = [];
    if (listing.pricePerMonthCHF > 0) parts.push(`CHF ${formatSwissInt(listing.pricePerMonthCHF)}/Monat`);
    if (typeof listing.remainingMonths === "number" && listing.remainingMonths > 0) {
      parts.push(`noch ${listing.remainingMonths} ${listing.remainingMonths === 1 ? "Monat" : "Monate"}`);
    }
    if (typeof listing.depositCHF === "number" && listing.depositCHF > 0) parts.push(`Kaution CHF ${formatSwissInt(listing.depositCHF)}`);
    if (typeof listing.mileageKm === "number" && listing.mileageKm > 0) parts.push(`${formatSwissInt(listing.mileageKm)} km`);
    const canton = cantonNameFor(listing.location, listing.canton_code);
    if (canton) parts.push(canton);

    return `Leasingübernahme ${name}${parts.length ? `: ${parts.join(", ")}` : ""}. Kontakt direkt mit dem Anbieter auf BuyAuto.`;
  }

  const price = listing.purchasePriceCHF;
  const priceText = typeof price === "number" && price > 0 ? `CHF ${formatSwissInt(price)} Kaufpreis` : "Kaufpreis auf Anfrage";
  const place = clean(listing.location);
  return `${name} für ${priceText}${place ? ` in ${place}` : ""}. Jetzt Auto-Angebot entdecken!`;
}
