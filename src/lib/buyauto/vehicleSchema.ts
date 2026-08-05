// Helpers for the schema.org Car/Offer JSON-LD on vehicle pages. Everything here maps
// real DB values 1:1 — a helper returns null when the source field is missing or
// malformed, and the caller omits the property. Nothing is ever guessed or defaulted.

const SWISS_CANTON_CODES = new Set([
  "AG", "AI", "AR", "BE", "BL", "BS", "FR", "GE", "GL", "GR", "JU", "LU", "NE",
  "NW", "OW", "SG", "SH", "SO", "SZ", "TG", "TI", "UR", "VD", "VS", "ZG", "ZH",
]);

/** ISO 8601 duration for offers.leaseLength, e.g. 36 → "P36M". */
export function leaseLengthIso(remainingMonths: number | null | undefined): string | null {
  if (typeof remainingMonths !== "number" || !Number.isFinite(remainingMonths)) return null;
  if (remainingMonths <= 0) return null;
  return `P${Math.round(remainingMonths)}M`;
}

/** Erstzulassung is stored as free text; only the expected "YYYY-MM" shape is emitted. */
export function firstRegistrationIso(firstRegistration: string | null | undefined): string | null {
  if (typeof firstRegistration !== "string") return null;
  const trimmed = firstRegistration.trim();
  return /^\d{4}-(0[1-9]|1[0-2])$/.test(trimmed) ? trimmed : null;
}

/** schema.org driveWheelConfiguration for the German drivetrain labels the form stores. */
export function driveWheelConfigurationFor(drivetrain: string | null | undefined): string | null {
  switch (drivetrain?.trim()) {
    case "Allrad":
      return "https://schema.org/AllWheelDriveConfiguration";
    case "Frontantrieb":
      return "https://schema.org/FrontWheelDriveConfiguration";
    case "Heckantrieb":
      return "https://schema.org/RearWheelDriveConfiguration";
    default:
      return null;
  }
}

export interface ListingPlace {
  addressLocality?: string;
  addressRegion?: string;
  addressCountry: "CH";
}

/**
 * offers.availableAtOrFrom address from the listing's location fields. `location` comes
 * in three real-world shapes: a bare canton code ("ZH"), a "City, XX" pair ("Bern, BE"),
 * or a full geocoder string ("8494, Bauma, Bezirk Pfäffikon, Zürich, Schweiz/Suisse/…").
 * The locality is the first token that is neither a postal code nor a canton code nor
 * the country tail; the region comes from canton_code or a canton token. Returns null
 * when neither a locality nor a region can be derived — the property is then omitted.
 */
export function parseListingPlace(
  location: string | null | undefined,
  cantonCode: string | null | undefined
): ListingPlace | null {
  const canton = typeof cantonCode === "string" && SWISS_CANTON_CODES.has(cantonCode.trim().toUpperCase())
    ? cantonCode.trim().toUpperCase()
    : null;

  let locality: string | null = null;
  let regionFromLocation: string | null = null;

  if (typeof location === "string" && location.trim() !== "") {
    const tokens = location
      .split(",")
      .map((t) => t.trim())
      .filter((t) => t !== "" && !t.startsWith("Schweiz/"));

    for (const token of tokens) {
      const upper = token.toUpperCase();
      if (SWISS_CANTON_CODES.has(upper)) {
        regionFromLocation = regionFromLocation ?? upper;
        continue;
      }
      if (/^\d{4}$/.test(token)) continue; // postal code
      locality = locality ?? token;
    }
  }

  const addressRegion = canton ?? regionFromLocation ?? undefined;
  if (!locality && !addressRegion) return null;

  return {
    ...(locality ? { addressLocality: locality } : {}),
    ...(addressRegion ? { addressRegion } : {}),
    addressCountry: "CH",
  };
}

const chf = new Intl.NumberFormat("de-CH", { maximumFractionDigits: 0 });

export interface VehicleDescriptionInput {
  dealType: "lease_takeover" | "direct_purchase";
  brand: string;
  model: string;
  year: number;
  pricePerMonthCHF: number | null;
  remainingMonths: number | null;
  purchasePriceCHF: number | null;
  mileageKm: number | null;
  depositCHF: number | null;
}

/**
 * Deterministic JSON-LD description from real fields only. Wording differs per Kaufart:
 * for a Leasingübernahme the monthly rate + Restlaufzeit + Kaution are the story; for a
 * Direktkauf the one-time price is. remaining_months/deposit_chf on direct-purchase rows
 * are wizard defaults (12/0), so they are deliberately never used there.
 */
export function buildVehicleDescription(input: VehicleDescriptionInput): string | null {
  const name = [input.brand, input.model].filter(Boolean).join(" ").trim();
  if (!name) return null;
  const vehicle = input.year > 0 ? `${name} (${input.year})` : name;

  const parts: string[] = [];

  if (input.dealType === "lease_takeover") {
    const rate = typeof input.pricePerMonthCHF === "number" && input.pricePerMonthCHF > 0 ? input.pricePerMonthCHF : null;
    const months = typeof input.remainingMonths === "number" && input.remainingMonths > 0 ? input.remainingMonths : null;

    if (rate && months) {
      parts.push(`Leasingübernahme: ${vehicle} für CHF ${chf.format(rate)} pro Monat bei ${months} Monaten Restlaufzeit.`);
    } else if (rate) {
      parts.push(`Leasingübernahme: ${vehicle} für CHF ${chf.format(rate)} pro Monat.`);
    } else {
      parts.push(`Leasingübernahme: ${vehicle}.`);
    }

    if (input.depositCHF === 0) parts.push("Keine Kaution.");
    else if (typeof input.depositCHF === "number" && input.depositCHF > 0) {
      parts.push(`Kaution: CHF ${chf.format(input.depositCHF)}.`);
    }
  } else {
    const price = typeof input.purchasePriceCHF === "number" && input.purchasePriceCHF > 0 ? input.purchasePriceCHF : null;
    parts.push(price ? `Direktkauf: ${vehicle} für CHF ${chf.format(price)}.` : `Direktkauf: ${vehicle}.`);
  }

  if (typeof input.mileageKm === "number" && input.mileageKm > 0) {
    parts.push(`Kilometerstand: ${chf.format(input.mileageKm)} km.`);
  }

  return parts.join(" ");
}
