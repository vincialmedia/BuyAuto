/**
 * Tool argument parsing for the MCP connector. Invalid input throws
 * ToolInputError, which the protocol layer turns into an isError result with
 * the message, so the model can correct the call. Lenient where it is
 * harmless: null means "not set", numeric strings are numbers, English names
 * map to the German values stored in the database.
 */
import { BODY_TYPES, CANTON_CODES, CANTON_LABELS, FUEL_TYPES, GEARBOX_TYPES } from "@/lib/buyauto/listingContract";
import { normalizeText } from "@/lib/mcp/listingOutput";
import { ToolInputError } from "@/lib/mcp/protocol";

export type Args = Record<string, unknown>;

export function present(args: Args, key: string): boolean {
  return args[key] !== undefined && args[key] !== null && args[key] !== "";
}

export function rejectUnknownKeys(args: Args, allowed: readonly string[], tool: string): void {
  const unknown = Object.keys(args).filter((k) => !allowed.includes(k) && present(args, k));
  if (unknown.length) {
    throw new ToolInputError(
      `${tool} does not take ${unknown.map((k) => `"${k}"`).join(", ")}. Allowed arguments: ${allowed.join(", ")}.`
    );
  }
}

export function optString(args: Args, key: string, maxLength = 80): string | undefined {
  if (!present(args, key)) return undefined;
  const value = args[key];
  if (typeof value !== "string") throw new ToolInputError(`"${key}" must be a string.`);
  const trimmed = value.replace(/\s+/g, " ").trim();
  if (!trimmed) return undefined;
  if (trimmed.length > maxLength) throw new ToolInputError(`"${key}" is longer than ${maxLength} characters.`);
  return trimmed;
}

export function optNumber(args: Args, key: string, opts: { min: number; max: number; integer?: boolean }): number | undefined {
  if (!present(args, key)) return undefined;
  const raw = args[key];
  const value = typeof raw === "string" && raw.trim() !== "" ? Number(raw.replace(/['’\s]/g, "")) : raw;
  if (typeof value !== "number" || !Number.isFinite(value)) throw new ToolInputError(`"${key}" must be a number.`);
  if (opts.integer && !Number.isInteger(value)) throw new ToolInputError(`"${key}" must be a whole number.`);
  if (value < opts.min || value > opts.max) {
    throw new ToolInputError(`"${key}" must be between ${opts.min} and ${opts.max} (got ${value}).`);
  }
  return value;
}

export function optBoolean(args: Args, key: string): boolean | undefined {
  if (!present(args, key)) return undefined;
  const value = args[key];
  if (typeof value === "boolean") return value;
  if (value === "true") return true;
  if (value === "false") return false;
  throw new ToolInputError(`"${key}" must be true or false.`);
}

export function lookupEnum<T extends string>(raw: string, values: readonly T[], aliases: Record<string, T>): T | undefined {
  const exact = values.find((v) => v.toLowerCase() === raw.toLowerCase());
  if (exact) return exact;
  return aliases[normalizeText(raw)];
}

export function optEnum<T extends string>(args: Args, key: string, values: readonly T[], aliases: Record<string, T> = {}): T | undefined {
  if (!present(args, key)) return undefined;
  const raw = args[key];
  if (typeof raw !== "string") throw new ToolInputError(`"${key}" must be one of: ${values.join(", ")}.`);
  const match = lookupEnum(raw.trim(), values, aliases);
  if (!match) throw new ToolInputError(`"${key}" must be one of: ${values.join(", ")} (got "${raw}").`);
  return match;
}

export function optEnumList<T extends string>(args: Args, key: string, values: readonly T[], aliases: Record<string, T> = {}): T[] | undefined {
  if (!present(args, key)) return undefined;
  const raw = args[key];
  const list = Array.isArray(raw) ? raw : [raw];
  const out: T[] = [];
  for (const item of list) {
    if (typeof item !== "string") throw new ToolInputError(`"${key}" must be a list of: ${values.join(", ")}.`);
    const match = lookupEnum(item.trim(), values, aliases);
    if (!match) throw new ToolInputError(`"${key}" values must be one of: ${values.join(", ")} (got "${item}").`);
    if (!out.includes(match)) out.push(match);
  }
  return out.length ? out : undefined;
}

export function checkRange(minKey: string, min: number | undefined, maxKey: string, max: number | undefined): void {
  if (min !== undefined && max !== undefined && min > max) {
    throw new ToolInputError(`"${minKey}" (${min}) is larger than "${maxKey}" (${max}).`);
  }
}

export const FUEL_ALIASES: Record<string, (typeof FUEL_TYPES)[number]> = {
  petrol: "Benzin", gasoline: "Benzin", gas: "Benzin", essence: "Benzin", benzina: "Benzin",
  diesel: "Diesel",
  hybrid: "Hybrid", phev: "Hybrid", "plug-in-hybrid": "Hybrid", "plugin-hybrid": "Hybrid", "mild-hybrid": "Hybrid", hev: "Hybrid",
  electric: "Elektro", ev: "Elektro", bev: "Elektro", electrique: "Elektro", elettrico: "Elektro", strom: "Elektro",
};

export const GEARBOX_ALIASES: Record<string, (typeof GEARBOX_TYPES)[number]> = {
  automatic: "Automatik", auto: "Automatik", dsg: "Automatik", cvt: "Automatik", automatique: "Automatik",
  manual: "Manuell", stick: "Manuell", manuelle: "Manuell", "schaltgetriebe": "Manuell",
};

export const BODY_ALIASES: Record<string, (typeof BODY_TYPES)[number]> = {
  sedan: "Limousine", saloon: "Limousine", hatchback: "Limousine", berline: "Limousine",
  estate: "Kombi", wagon: "Kombi", "station-wagon": "Kombi", touring: "Kombi", break: "Kombi", avant: "Kombi",
  crossover: "SUV", "4x4": "SUV", offroad: "SUV", gelandewagen: "SUV",
  convertible: "Cabrio", cabriolet: "Cabrio", roadster: "Cabrio",
  coupe: "Coupe",
};

/** Canton names (German labels plus common French, Italian and English names) → code. */
export const CANTON_ALIASES: Record<string, (typeof CANTON_CODES)[number]> = (() => {
  const map: Record<string, (typeof CANTON_CODES)[number]> = {};
  for (const code of CANTON_CODES) map[normalizeText(CANTON_LABELS[code])] = code;
  Object.assign(map, {
    zurich: "ZH", berne: "BE", geneve: "GE", geneva: "GE", vaud: "VD", ticino: "TI", valais: "VS",
    fribourg: "FR", lucerne: "LU", neuchatel: "NE", grisons: "GR", "saint-gall": "SG", argovie: "AG",
    thurgovie: "TG", soleure: "SO", "bale-ville": "BS", "bale-campagne": "BL", schaffhouse: "SH",
  });
  return map;
})();
