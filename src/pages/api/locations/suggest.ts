import type { NextApiRequest, NextApiResponse } from "next";
import { CANTON_CODES, CANTON_LABELS, isCantonCode, type CantonCode } from "@/lib/buyauto/listingContract";

type LocationSuggestion = {
  label: string;
  value: string;
  canton: CantonCode | null;
};

type SuggestResponse = {
  items: LocationSuggestion[];
};

type NominatimAddress = {
  city?: string;
  town?: string;
  village?: string;
  municipality?: string;
  hamlet?: string;
  suburb?: string;
  state?: string;
  "ISO3166-2-lvl4"?: string;
  postcode?: string;
};

type NominatimRow = {
  display_name?: string;
  address?: NominatimAddress;
};

const CACHE_TTL_MS = 1000 * 60 * 10;

const cache = new Map<string, { expiresAt: number; items: LocationSuggestion[] }>();

// Canton name → code, including the French/Italian/Romansh names Nominatim can
// return for `address.state` when the ISO code is missing.
const CANTON_NAME_TO_CODE: Record<string, CantonCode> = (() => {
  const map: Record<string, CantonCode> = {};
  const add = (name: string, code: CantonCode) => {
    map[name.toLowerCase()] = code;
  };
  for (const code of CANTON_CODES) add(CANTON_LABELS[code], code);
  // Non-German aliases
  add("Genève", "GE");
  add("Geneva", "GE");
  add("Vaud", "VD");
  add("Valais", "VS");
  add("Wallis", "VS");
  add("Neuchâtel", "NE");
  add("Fribourg", "FR");
  add("Ticino", "TI");
  add("Grigioni", "GR");
  add("Grisons", "GR");
  add("Berne", "BE");
  add("Lucerne", "LU");
  add("Zurich", "ZH");
  add("St. Gallen", "SG");
  add("Sankt Gallen", "SG");
  add("Basel", "BS");
  return map;
})();

function cantonFromAddress(address: NominatimAddress | undefined): CantonCode | null {
  if (!address) return null;

  // Preferred: the ISO code, e.g. "CH-ZH".
  const iso = address["ISO3166-2-lvl4"];
  if (typeof iso === "string") {
    const code = iso.split("-")[1]?.toUpperCase();
    if (code && isCantonCode(code)) return code;
  }

  // Fallback: match the canton name.
  const state = address.state;
  if (typeof state === "string") {
    const mapped = CANTON_NAME_TO_CODE[state.trim().toLowerCase()];
    if (mapped) return mapped;
  }

  return null;
}

function placeNameFromAddress(address: NominatimAddress | undefined, fallback: string): string {
  const place =
    address?.city ||
    address?.town ||
    address?.village ||
    address?.municipality ||
    address?.suburb ||
    address?.hamlet;
  return (place && place.trim()) || fallback;
}

async function fetchNominatimSuggestions(query: string): Promise<LocationSuggestion[]> {
  const url = new URL("https://nominatim.openstreetmap.org/search");
  url.searchParams.set("format", "json");
  url.searchParams.set("q", query);
  url.searchParams.set("countrycodes", "ch");
  url.searchParams.set("addressdetails", "1");
  url.searchParams.set("limit", "8");

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 4500);

  try {
    const resp = await fetch(url.toString(), {
      method: "GET",
      headers: {
        Accept: "application/json",
        "User-Agent": "BuyAuto (Next.js)",
      },
      signal: controller.signal,
    });

    if (!resp.ok) return [];

    const json = (await resp.json()) as NominatimRow[];
    if (!Array.isArray(json)) return [];

    const unique = new Map<string, LocationSuggestion>();

    for (const row of json) {
      const canton = cantonFromAddress(row.address);
      const rawFallback = typeof row.display_name === "string" ? row.display_name.split(",")[0]?.trim() ?? "" : "";
      const place = placeNameFromAddress(row.address, rawFallback);
      if (!place) continue;

      // A tidy "Ort, KT" label the seller understands, and a value that carries
      // the canton so we never need a separate Kanton field.
      const label = canton ? `${place}, ${canton}` : place;
      const value = label;

      if (!unique.has(value)) {
        unique.set(value, { label, value, canton });
      }
    }

    return Array.from(unique.values()).slice(0, 8);
  } catch {
    return [];
  } finally {
    clearTimeout(timeout);
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse<SuggestResponse | { error: string }>) {
  if (req.method !== "GET") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const q = typeof req.query.q === "string" ? req.query.q.trim() : "";
  if (q.length < 2) {
    res.status(200).json({ items: [] });
    return;
  }

  const cacheKey = q.toLowerCase();
  const cached = cache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) {
    res.status(200).json({ items: cached.items });
    return;
  }

  const items = await fetchNominatimSuggestions(q);
  cache.set(cacheKey, { items, expiresAt: Date.now() + CACHE_TTL_MS });

  res.setHeader("Cache-Control", "public, s-maxage=600, stale-while-revalidate=3600");
  res.status(200).json({ items });
}
