import type { NextApiRequest, NextApiResponse } from "next";
import { isCantonCode, type CantonCode } from "@/lib/buyauto/listingContract";

type LocationSuggestion = {
  label: string;
  value: string;
  canton: CantonCode | null;
};

type SuggestResponse = {
  items: LocationSuggestion[];
};

// Federal GeoAdmin search (api3.geo.admin.ch) — unlike Nominatim it is built
// for autocomplete: it matches PREFIXES ("Oberlunkh" → Oberlunkhofen) and its
// gazetteer covers every official Ortschaft and Quartier, not just
// municipalities. No API key required.
//   gg25       = municipalities ("Oberlunkhofen (AG)")
//   gazetteer  = named localities ("<i>Ort</i> Riedt (ZH) - Neerach")
//   zipcode    = PLZ directory ("8302 - Kloten"; canton resolved separately)
type GeoAdminResult = {
  attrs?: {
    label?: string;
    detail?: string;
    origin?: string;
  };
};

const CACHE_TTL_MS = 1000 * 60 * 10;
const CACHE_MAX_ENTRIES = 5000;

const cache = new Map<string, { expiresAt: number; items: LocationSuggestion[] }>();

function cacheSet(key: string, items: LocationSuggestion[]) {
  // Evict expired entries opportunistically, then cap by insertion order so
  // the map can't grow without bound on a long-lived process.
  if (cache.size >= CACHE_MAX_ENTRIES) {
    const now = Date.now();
    for (const [k, v] of cache) {
      if (v.expiresAt <= now) cache.delete(k);
    }
    while (cache.size >= CACHE_MAX_ENTRIES) {
      const oldest = cache.keys().next().value;
      if (oldest === undefined) break;
      cache.delete(oldest);
    }
  }
  cache.set(key, { items, expiresAt: Date.now() + CACHE_TTL_MS });
}

function stripTags(html: string): string {
  return html.replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim();
}

// Settlement-type gazetteer rows only (the type tag is localized per request
// language; lang=de is forced below, English kept as belt and braces).
const SETTLEMENT_TYPE_RE = /^\s*<i>(Ort|Quartier|Quartierteil|Populated Place|Neighbourhood)\b/i;

function parseSuggestion(row: GeoAdminResult): LocationSuggestion | null {
  const rawLabel = row.attrs?.label ?? "";
  const origin = row.attrs?.origin ?? "";
  if (!rawLabel) return null;

  if (origin === "gazetteer" && !SETTLEMENT_TYPE_RE.test(rawLabel)) return null;

  // Drop the leading type tag entirely, then strip remaining markup.
  const text = stripTags(rawLabel.replace(/^\s*<i>[^<]*<\/i>\s*/i, ""));

  // Shapes: "Oberlunkhofen (AG)"  |  "Riedt (ZH) - Neerach"  |  "Riedtwies (ZH) - Wald (ZH)"
  const cantonMatch = text.match(/\(([A-Z]{2})\)/);
  const canton = cantonMatch && isCantonCode(cantonMatch[1]) ? (cantonMatch[1] as CantonCode) : null;
  if (!canton) return null; // the wizard derives canton_code from the pick — a canton-less entry would dead-end it

  const place = text.split("(")[0]?.trim();
  if (!place) return null;

  // Municipality names can carry their own canton disambiguator ("Wald (ZH)") —
  // strip it so the stored location doesn't nest parentheses.
  const municipality = (text.split(" - ")[1]?.trim() ?? "").replace(/\s*\([A-Z]{2}\)\s*$/, "").trim();
  const qualifier = municipality && municipality.toLowerCase() !== place.toLowerCase() ? ` (${municipality})` : "";

  const label = `${place}${qualifier}, ${canton}`;
  return { label, value: label, canton };
}

// null = upstream failure (as opposed to a legitimate "no matches") — failures
// must NOT be cached, or a brief GeoAdmin blip blocks Step 1 for 10 minutes.
async function searchGeoAdmin(query: string, origins: string): Promise<GeoAdminResult[] | null> {
  const url = new URL("https://api3.geo.admin.ch/rest/services/api/SearchServer");
  url.searchParams.set("searchText", query);
  url.searchParams.set("type", "locations");
  url.searchParams.set("origins", origins);
  url.searchParams.set("lang", "de");
  url.searchParams.set("limit", "15");

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 4500);

  try {
    const resp = await fetch(url.toString(), {
      method: "GET",
      headers: { Accept: "application/json" },
      signal: controller.signal,
    });

    if (!resp.ok) return null;

    const json = (await resp.json()) as { results?: GeoAdminResult[] };
    return Array.isArray(json?.results) ? json.results : null;
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

function dedupe(suggestions: Array<LocationSuggestion | null>): LocationSuggestion[] {
  const unique = new Map<string, LocationSuggestion>();
  for (const s of suggestions) {
    if (!s) continue;
    const key = s.value.toLowerCase();
    if (!unique.has(key)) unique.set(key, s);
  }
  return Array.from(unique.values()).slice(0, 8);
}

async function fetchPlaceSuggestions(query: string): Promise<LocationSuggestion[] | null> {
  const rows = await searchGeoAdmin(query, "gg25,gazetteer");
  if (rows === null) return null;
  return dedupe(rows.map(parseSuggestion));
}

// PLZ entry is the most common Swiss habit. Zipcode rows ("8302 - Kloten")
// carry no canton, so the town is resolved through the normal place search
// (one extra request per distinct town, all under the same response cache).
async function fetchZipcodeSuggestions(query: string): Promise<LocationSuggestion[] | null> {
  const rows = await searchGeoAdmin(query, "zipcode");
  if (rows === null) return null;

  const entries: Array<{ plz: string; town: string }> = [];
  for (const row of rows) {
    const text = stripTags(row.attrs?.label ?? "");
    const m = text.match(/^(\d{4})\s*-\s*(.+)$/);
    if (m) entries.push({ plz: m[1], town: m[2].trim() });
    if (entries.length >= 4) break;
  }

  const items: LocationSuggestion[] = [];
  for (const { plz, town } of entries) {
    const resolved = await fetchPlaceSuggestions(town);
    const match =
      resolved?.find((s) => s.value.toLowerCase().startsWith(town.toLowerCase())) ?? resolved?.[0] ?? null;
    if (match?.canton) {
      items.push({ label: `${plz} ${match.value}`, value: match.value, canton: match.canton });
    }
  }

  return dedupe(items);
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
    res.setHeader("Cache-Control", "public, s-maxage=600, stale-while-revalidate=3600");
    res.status(200).json({ items: cached.items });
    return;
  }

  const looksLikePlz = /^\d{2,4}(\s|$)/.test(q);
  const items = looksLikePlz ? await fetchZipcodeSuggestions(q) : await fetchPlaceSuggestions(q);

  if (items === null) {
    // Upstream failure: answer empty but uncached so the next keystroke retries.
    res.setHeader("Cache-Control", "no-store");
    res.status(200).json({ items: [] });
    return;
  }

  cacheSet(cacheKey, items);

  res.setHeader("Cache-Control", "public, s-maxage=600, stale-while-revalidate=3600");
  res.status(200).json({ items });
}
