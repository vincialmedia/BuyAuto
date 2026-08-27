/**
 * Listing field contract — the SINGLE source of truth for the allowed values
 * and limits of every constrained listing field.
 *
 * Why this file exists: the "Coupe" bug (and its whole class) happened because
 * the same enum was hand-copied into the Step 1 dropdown, two zod schemas, the
 * TS unions, the read-side normalizer, and the Postgres CHECK constraint — five
 * places that silently drifted apart. Everything that needs to know "what are
 * the valid body types / fuels / cantons / limits" now imports from here.
 *
 * INVARIANT: these values MUST stay identical to the Postgres CHECK constraints
 * on public.listings. They currently match the live DB (verified 2026-07-02):
 *   body     IN (Limousine, Kombi, SUV, Cabrio, Coupe)
 *   fuel     IN (Benzin, Diesel, Hybrid, Elektro)
 *   gearbox  IN (Automatik, Manuell)
 *   canton   IN (26 Swiss canton codes)
 *   year     BETWEEN 1990 AND 2030
 * If you add a value here, add a migration that widens the matching CHECK.
 */

import { z } from "zod";

// ── Vehicle enums (values are the German labels stored verbatim in the DB) ──
export const BODY_TYPES = ["Limousine", "Kombi", "SUV", "Cabrio", "Coupe"] as const;
export type BodyType = (typeof BODY_TYPES)[number];

export const FUEL_TYPES = ["Benzin", "Diesel", "Hybrid", "Elektro"] as const;
export type FuelType = (typeof FUEL_TYPES)[number];

export const GEARBOX_TYPES = ["Automatik", "Manuell"] as const;
export type GearboxType = (typeof GEARBOX_TYPES)[number];

// Drivetrain is stored as free text today (no DB CHECK); these are the offered
// options. Kept here so the dropdown and any future validation agree.
export const DRIVETRAIN_TYPES = ["Frontantrieb", "Heckantrieb", "Allrad"] as const;
export type DrivetrainType = (typeof DRIVETRAIN_TYPES)[number];

// ── Swiss cantons (must match listings_canton_code_check exactly) ──
export const CANTON_CODES = [
  "ZH", "BE", "LU", "UR", "SZ", "OW", "NW", "GL", "ZG", "FR",
  "SO", "BS", "BL", "SH", "AR", "AI", "SG", "GR", "AG", "TG",
  "TI", "VD", "VS", "NE", "GE", "JU",
] as const;
export type CantonCode = (typeof CANTON_CODES)[number];

export const CANTON_LABELS: Record<CantonCode, string> = {
  ZH: "Zürich", BE: "Bern", LU: "Luzern", UR: "Uri", SZ: "Schwyz",
  OW: "Obwalden", NW: "Nidwalden", GL: "Glarus", ZG: "Zug", FR: "Freiburg",
  SO: "Solothurn", BS: "Basel-Stadt", BL: "Basel-Landschaft", SH: "Schaffhausen",
  AR: "Appenzell Ausserrhoden", AI: "Appenzell Innerrhoden", SG: "St. Gallen",
  GR: "Graubünden", AG: "Aargau", TG: "Thurgau", TI: "Tessin", VD: "Waadt",
  VS: "Wallis", NE: "Neuenburg", GE: "Genf", JU: "Jura",
};

// ── Numeric limits (mirror the DB CHECKs) ──
export const YEAR_MIN = 1990;
export const YEAR_MAX_DB = 2030; // hard DB ceiling (listings_year_check)
export const MILEAGE_MIN = 0;
export const DESCRIPTION_MAX = 2000;
// Optionaler Freitext-Zusatz hinter dem generierten Titel (DB-CHECK
// listings_title_suffix_len erzwingt die Grenze serverseitig).
export const TITLE_SUFFIX_MAX = 50;

/**
 * Bereinigt den Titel-Zusatz auf reinen Text: HTML-Tags und Links fliegen
 * raus, ebenso "|" (unser Trennzeichen zwischen generiertem Titel und Zusatz —
 * so bleibt der komponierte Titel eindeutig zerlegbar), Whitespace wird
 * kollabiert und auf TITLE_SUFFIX_MAX gekürzt.
 */
export function sanitizeTitleSuffix(raw: unknown): string {
  if (typeof raw !== "string") return "";
  return raw
    .replace(/<[^>]*>/g, " ")
    .replace(/https?:\/\/\S+/gi, " ")
    .replace(/www\.\S+/gi, " ")
    .replace(/[|<>]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, TITLE_SUFFIX_MAX)
    .trim();
}

/** "FIAT 500 1.4 Abarth" + "Frisch ab MFK" -> "FIAT 500 1.4 Abarth | Frisch ab MFK". */
export function composeListingTitle(base: string, suffix?: string | null): string {
  const cleanBase = String(base ?? "").trim();
  const cleanSuffix = sanitizeTitleSuffix(suffix ?? "");
  return cleanSuffix ? `${cleanBase} | ${cleanSuffix}` : cleanBase;
}

/** Form-facing year ceiling: next model year, never above the DB ceiling. */
export function currentYearMax(now: Date = new Date()): number {
  return Math.min(YEAR_MAX_DB, now.getFullYear() + 1);
}

// ── Pricing plans ──
export const PLAN_IDS = ["free30", "standard", "extended", "unlimited"] as const;
export type PlanId = (typeof PLAN_IDS)[number];

// ── Type guards ──
export function isBodyType(v: unknown): v is BodyType {
  return typeof v === "string" && (BODY_TYPES as readonly string[]).includes(v);
}
export function isFuelType(v: unknown): v is FuelType {
  return typeof v === "string" && (FUEL_TYPES as readonly string[]).includes(v);
}
export function isGearboxType(v: unknown): v is GearboxType {
  return typeof v === "string" && (GEARBOX_TYPES as readonly string[]).includes(v);
}
export function isCantonCode(v: unknown): v is CantonCode {
  return typeof v === "string" && (CANTON_CODES as readonly string[]).includes(v);
}

// ── Reusable zod field validators (used by every listing schema) ──
export const zBody = z
  .string()
  .refine(isBodyType, { message: "Bitte wählen Sie eine gültige Karosserie" });

export const zFuel = z
  .string()
  .refine(isFuelType, { message: "Bitte wählen Sie einen gültigen Treibstoff" });

export const zGearbox = z
  .string()
  .refine(isGearboxType, { message: "Bitte wählen Sie ein gültiges Getriebe" });

export const zYear = z
  .number()
  .min(YEAR_MIN, `Baujahr muss mindestens ${YEAR_MIN} sein`)
  .max(currentYearMax(), "Baujahr kann nicht in der Zukunft liegen");

export const zCantonOptional = z
  .string()
  .refine((v) => v === "" || isCantonCode(v), { message: "Ungültiger Kanton" })
  .optional();

export const zDescriptionOptional = z
  .string()
  .max(DESCRIPTION_MAX, `Beschreibung darf maximal ${DESCRIPTION_MAX} Zeichen enthalten`)
  .optional()
  .or(z.literal(""));
