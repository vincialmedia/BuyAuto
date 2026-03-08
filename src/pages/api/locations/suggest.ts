import type { NextApiRequest, NextApiResponse } from "next";

type LocationSuggestion = {
  label: string;
  value: string;
};

type SuggestResponse = {
  items: LocationSuggestion[];
};

const CACHE_TTL_MS = 1000 * 60 * 10;

const cache = new Map<string, { expiresAt: number; items: LocationSuggestion[] }>();

function normalizeSuggestionLabel(label: string): string {
  const cleaned = label.replace(/\s+/g, " ").trim();
  return cleaned.replace(/,?\s*(Schweiz|Switzerland)$/i, "");
}

async function fetchNominatimSuggestions(query: string): Promise<LocationSuggestion[]> {
  const url = new URL("https://nominatim.openstreetmap.org/search");
  url.searchParams.set("format", "json");
  url.searchParams.set("q", query);
  url.searchParams.set("countrycodes", "ch");
  url.searchParams.set("addressdetails", "0");
  url.searchParams.set("limit", "8");

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 4500);

  try {
    const resp = await fetch(url.toString(), {
      method: "GET",
      headers: {
        "Accept": "application/json",
        "User-Agent": "BuyAuto (Next.js)",
      },
      signal: controller.signal,
    });

    if (!resp.ok) return [];

    const json = (await resp.json()) as Array<{ display_name?: string }>;
    if (!Array.isArray(json)) return [];

    const items = json
      .map((row) => (typeof row?.display_name === "string" ? row.display_name : ""))
      .map((label) => normalizeSuggestionLabel(label))
      .filter((label) => label.length > 0)
      .map((label) => ({ label, value: label }));

    const unique = new Map<string, LocationSuggestion>();
    for (const item of items) unique.set(item.value, item);

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