import type { NextApiRequest, NextApiResponse } from "next";
import {
  extractPrices,
  identifyListingUrl,
  parseListingText,
  yearMatches,
} from "@/lib/buyauto/compsParser";

// Firecrawl search calls can take 10-30s; lift the serverless limit accordingly.
// Pages Router API routes configure maxDuration via the config export (the bare
// `export const maxDuration` form is App Router segment config and gets ignored).
export const config = { maxDuration: 60 };

const FIRECRAWL_API = "https://api.firecrawl.dev/v2";
// Per-call timeout and overall budget: worst case is 3 sequential searches, which
// must stay under the 60s function limit (3 × 18s + overhead ≈ 56s).
const FIRECRAWL_TIMEOUT_MS = 18_000;
const TIER_DEADLINE_MS = 32_000;

const MAX_COMPS = 5;

interface CompOut {
  price: number;
  km: number;
  title: string;
  url: string;
  source: string;
}

interface FirecrawlWebResult {
  title?: string;
  url?: string;
  description?: string;
  markdown?: string;
}

// Best-effort per-IP limiter. Serverless instances don't share memory, so this
// is a soft cap against a single hot instance being hammered — the real cost
// ceiling is the Firecrawl account's credit balance.
const RATE_LIMIT = 20;
const RATE_WINDOW_MS = 60 * 60 * 1000;
const rateMap = new Map<string, { count: number; reset: number }>();

function rateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = rateMap.get(ip);
  if (!entry || now > entry.reset) {
    rateMap.set(ip, { count: 1, reset: now + RATE_WINDOW_MS });
    return false;
  }
  entry.count += 1;
  return entry.count > RATE_LIMIT;
}

async function firecrawlSearch(
  apiKey: string,
  query: string,
  limit: number,
  withContent: boolean
): Promise<FirecrawlWebResult[]> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FIRECRAWL_TIMEOUT_MS);
  try {
    const payload: Record<string, unknown> = { query, limit };
    if (withContent) payload.scrapeOptions = { formats: ["markdown"] };

    const res = await fetch(`${FIRECRAWL_API}/search`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    if (!res.ok) {
      console.error(`Firecrawl search failed: HTTP ${res.status}`);
      return [];
    }

    const data = await res.json();
    return (data?.data?.web ?? []) as FirecrawlWebResult[];
  } catch (err) {
    console.error("Firecrawl search error:", err);
    return [];
  } finally {
    clearTimeout(timer);
  }
}

function resultsToComps(
  results: FirecrawlWebResult[],
  targetYear: number,
  seenUrls: Set<string>
): CompOut[] {
  const comps: CompOut[] = [];
  for (const r of results) {
    if (!r.url) continue;
    // Individual listings only — model-overview/search pages are not comps.
    const source = identifyListingUrl(r.url);
    if (!source) continue;
    if (seenUrls.has(r.url)) continue;

    // Snippet first (title + description). A snippet carrying 3+ distinct prices
    // is a list page that slipped through the URL filter — never a single car.
    const snippet = `${r.title ?? ""} ${r.description ?? ""}`;
    let parsed = extractPrices(snippet).length <= 2 ? parseListingText(snippet) : null;

    // Scraped page markdown as fallback. Capped: price and mileage sit in the top
    // section of a listing page, and further down "similar vehicles" widgets carry
    // misleading pairs. A top section flooded with prices is again a list page.
    if (!parsed && r.markdown) {
      const top = r.markdown.slice(0, 4_000);
      parsed = extractPrices(top).length <= 6 ? parseListingText(top) : null;
    }
    if (!parsed) continue;
    if (!yearMatches(parsed, targetYear)) continue;

    seenUrls.add(r.url);
    comps.push({
      price: parsed.price,
      km: parsed.km,
      title: (r.title ?? "").slice(0, 120) || `${source} Inserat`,
      url: r.url,
      source,
    });
  }
  return comps;
}

/**
 * Prefer comps with a similar mileage; widen the band only when the strict one
 * yields too few. Returns the picked comps plus whether relaxation was needed.
 */
function pickBySimilarKm(
  comps: CompOut[],
  targetKm: number
): { picked: CompOut[]; relaxed: boolean } {
  const byDistance = [...comps].sort(
    (a, b) => Math.abs(a.km - targetKm) - Math.abs(b.km - targetKm)
  );
  const bands = [
    Math.max(30_000, targetKm * 0.4),
    Math.max(60_000, targetKm * 0.8),
    Number.POSITIVE_INFINITY,
  ];

  const picked: CompOut[] = [];
  let relaxed = false;
  for (let i = 0; i < bands.length && picked.length < MAX_COMPS; i++) {
    if (i > 0 && picked.length >= 3) break; // enough similar-km comps, stop widening
    for (const c of byDistance) {
      if (picked.length >= MAX_COMPS) break;
      if (picked.includes(c)) continue;
      if (Math.abs(c.km - targetKm) <= bands[i]) {
        picked.push(c);
        if (i > 0) relaxed = true;
      }
    }
  }
  return { picked, relaxed };
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const apiKey = process.env.FIRECRAWL_API_KEY;
  if (!apiKey) {
    return res.status(503).json({
      error: "search_unavailable",
      message: "Inserats-Suche ist momentan nicht verfügbar.",
    });
  }

  const ip =
    (typeof req.headers["x-forwarded-for"] === "string"
      ? req.headers["x-forwarded-for"].split(",")[0].trim()
      : null) ??
    req.socket.remoteAddress ??
    "unknown";
  if (rateLimited(ip)) {
    return res.status(429).json({
      error: "rate_limited",
      message: "Zu viele Anfragen – bitte versuch es später nochmals.",
    });
  }

  const { make, model, year, km } = (req.body ?? {}) as {
    make?: unknown;
    model?: unknown;
    year?: unknown;
    km?: unknown;
  };

  const makeStr = typeof make === "string" ? make.trim().slice(0, 40) : "";
  const modelStr = typeof model === "string" ? model.trim().slice(0, 60) : "";
  const yearNum = Number(year);
  const kmNum = Number(km);

  if (
    !makeStr ||
    !modelStr ||
    !Number.isFinite(yearNum) ||
    yearNum < 1980 ||
    yearNum > new Date().getFullYear() + 1 ||
    !Number.isFinite(kmNum) ||
    kmNum < 0 ||
    kmNum > 500_000
  ) {
    return res.status(400).json({
      error: "invalid_input",
      message: "Marke, Modell, Jahr und Kilometerstand sind Pflichtfelder.",
    });
  }

  const vehicle = `${makeStr} ${modelStr}`;
  const queried: string[] = [];
  const seenUrls = new Set<string>();
  let comps: CompOut[] = [];
  const startedAt = Date.now();
  const withinBudget = () => Date.now() - startedAt < TIER_DEADLINE_MS;

  // Tier 1: cheap snippet-only search, pinned to AutoScout24 DETAIL pages
  // (/de/d/...) so results are individual cars, not model-overview pages.
  const q1 = `site:autoscout24.ch/de/d "${vehicle}" ${yearNum}`;
  queried.push(q1);
  comps.push(...resultsToComps(await firecrawlSearch(apiKey, q1, 10, false), yearNum, seenUrls));

  // Tier 2: widen to all Swiss marketplaces, still snippet-only. The URL filter
  // keeps it to individual listings.
  if (comps.length < MAX_COMPS && withinBudget()) {
    const q2 = `${vehicle} ${yearNum} Occasion Schweiz CHF km`;
    queried.push(q2);
    comps.push(...resultsToComps(await firecrawlSearch(apiKey, q2, 10, false), yearNum, seenUrls));
  }

  // Tier 3 (expensive, only when snippets were too thin): re-run the detail-page
  // search with page content so price/km can be parsed from the listings themselves.
  if (comps.length < 3 && withinBudget()) {
    const q3 = `site:autoscout24.ch/de/d "${vehicle}" ${yearNum}`;
    queried.push(`${q3} (mit Seiteninhalt)`);
    comps.push(...resultsToComps(await firecrawlSearch(apiKey, q3, 5, true), yearNum, seenUrls));
  }

  // Drop duplicate price/km pairs (same car listed twice), then keep the comps
  // closest in mileage — widening the km band only if the strict band is thin.
  const uniquePairs = new Set<string>();
  comps = comps.filter((c) => {
    const key = `${c.price}:${c.km}`;
    if (uniquePairs.has(key)) return false;
    uniquePairs.add(key);
    return true;
  });
  const { picked, relaxed } = pickBySimilarKm(comps, kmNum);

  return res.status(200).json({
    comps: picked,
    queried,
    warning:
      picked.length === 0
        ? "Keine Vergleichsinserate gefunden – erfasse sie manuell."
        : picked.length < 3
          ? "Nur wenige Vergleichsinserate gefunden – prüf die Werte und ergänze manuell."
          : relaxed
            ? "Einige Treffer weichen beim Kilometerstand stärker ab – prüf die Werte."
            : undefined,
  });
}
