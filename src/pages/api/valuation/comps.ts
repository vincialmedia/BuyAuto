import type { NextApiRequest, NextApiResponse } from "next";
import { parseListingText, yearMatches } from "@/lib/buyauto/compsParser";

// Firecrawl search calls can take 10-30s; lift the serverless limit accordingly.
export const maxDuration = 60;

const FIRECRAWL_API = "https://api.firecrawl.dev/v2";
const FIRECRAWL_TIMEOUT_MS = 25_000;

// Only accept comps from real Swiss vehicle marketplaces — a blog post that happens
// to mention a price and a mileage is not a comparable listing.
const MARKETPLACE_HOSTS = [
  "autoscout24.ch",
  "tutti.ch",
  "comparis.ch",
  "carforyou.ch",
  "autolina.ch",
  "gowago.ch",
  "carmarket.ch",
  "anibis.ch",
  "buyauto.ch",
];

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

function marketplaceHost(url: string): string | null {
  try {
    const host = new URL(url).hostname.replace(/^www\./, "");
    const match = MARKETPLACE_HOSTS.find((h) => host === h || host.endsWith(`.${h}`));
    return match ?? null;
  } catch {
    return null;
  }
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
    const source = marketplaceHost(r.url);
    if (!source) continue;
    if (seenUrls.has(r.url)) continue;

    // Snippet first (title + description); scraped page markdown as fallback.
    // Markdown is capped: price and mileage sit in the top section of a listing
    // page, and further down "similar vehicles" widgets carry misleading pairs.
    const snippet = `${r.title ?? ""} ${r.description ?? ""}`;
    const parsed =
      parseListingText(snippet) ?? parseListingText((r.markdown ?? "").slice(0, 4_000));
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

  // Tier 1: cheap snippet-only search on AutoScout24 (largest Swiss inventory).
  const q1 = `"${vehicle}" ${yearNum} site:autoscout24.ch`;
  queried.push(q1);
  comps.push(...resultsToComps(await firecrawlSearch(apiKey, q1, 8, false), yearNum, seenUrls));

  // Tier 2: widen to all Swiss marketplaces, still snippet-only.
  if (comps.length < MAX_COMPS) {
    const q2 = `${vehicle} ${yearNum} Occasion Schweiz CHF km`;
    queried.push(q2);
    comps.push(...resultsToComps(await firecrawlSearch(apiKey, q2, 8, false), yearNum, seenUrls));
  }

  // Tier 3 (expensive, only when snippets were too thin): re-run tier 1 with page
  // content so price/km can be parsed from the listing pages themselves.
  if (comps.length < 3) {
    const q3 = `"${vehicle}" ${yearNum} site:autoscout24.ch`;
    queried.push(`${q3} (mit Seiteninhalt)`);
    comps.push(...resultsToComps(await firecrawlSearch(apiKey, q3, 5, true), yearNum, seenUrls));
  }

  // Drop duplicate price/km pairs (same car listed twice), rank by mileage
  // proximity to the target vehicle, keep the best 5.
  const uniquePairs = new Set<string>();
  comps = comps.filter((c) => {
    const key = `${c.price}:${c.km}`;
    if (uniquePairs.has(key)) return false;
    uniquePairs.add(key);
    return true;
  });
  comps.sort((a, b) => Math.abs(a.km - kmNum) - Math.abs(b.km - kmNum));
  comps = comps.slice(0, MAX_COMPS);

  return res.status(200).json({
    comps,
    queried,
    warning:
      comps.length === 0
        ? "Keine Vergleichsinserate gefunden – erfasse sie manuell."
        : comps.length < 3
          ? "Nur wenige Vergleichsinserate gefunden – prüf die Werte und ergänze manuell."
          : undefined,
  });
}
