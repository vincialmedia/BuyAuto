import type { NextApiRequest, NextApiResponse } from "next";
import {
  extractPrices,
  identifyCategoryUrl,
  identifyListingUrl,
  modelPrecision,
  parseCategoryMarkdown,
  parseListingText,
  yearMatches,
} from "@/lib/buyauto/compsParser";

// Firecrawl search calls can take 10-30s; lift the serverless limit accordingly.
// Pages Router API routes configure maxDuration via the config export (the bare
// `export const maxDuration` form is App Router segment config and gets ignored).
export const config = { maxDuration: 60 };

const FIRECRAWL_API = "https://api.firecrawl.dev/v2";
// Per-call timeout and overall budget: worst case is 2 sequential searches plus one
// parallel scrape round, which must stay under the 60s function limit.
const FIRECRAWL_TIMEOUT_MS = 18_000;
const TIER_DEADLINE_MS = 38_000;

const MAX_COMPS = 5;
const MAX_SCRAPE_CANDIDATES = 5;

// Vehicle DB names vs. how listings are actually titled on the portals.
const MAKE_ALIASES: Record<string, string> = {
  volkswagen: "VW",
  "mercedes-benz": "Mercedes",
};

interface CompOut {
  price: number;
  km: number;
  title: string;
  url: string;
  source: string;
}

interface Candidate {
  url: string;
  title: string;
  source: string;
}

interface FirecrawlWebResult {
  title?: string;
  url?: string;
  description?: string;
  markdown?: string;
}

interface SearchOutcome {
  results: FirecrawlWebResult[];
  status: number | "network";
}

interface TierStat {
  query: string;
  status: number | "network";
  results: number;
  onMarketplace: number;
  parsed: number;
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

async function firecrawlPost(
  apiKey: string,
  path: string,
  payload: Record<string, unknown>
): Promise<{ status: number | "network"; body: unknown }> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FIRECRAWL_TIMEOUT_MS);
  try {
    const res = await fetch(`${FIRECRAWL_API}${path}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
    const body = await res.json().catch(() => null);
    return { status: res.status, body };
  } catch (err) {
    console.error(`Firecrawl ${path} error:`, err);
    return { status: "network", body: null };
  } finally {
    clearTimeout(timer);
  }
}

async function firecrawlSearch(
  apiKey: string,
  query: string,
  limit: number
): Promise<SearchOutcome> {
  const { status, body } = await firecrawlPost(apiKey, "/search", { query, limit });
  if (status !== 200) {
    console.error(`Firecrawl search failed: ${status}`, JSON.stringify(body)?.slice(0, 300));
    return { results: [], status };
  }
  const data = body as { data?: { web?: FirecrawlWebResult[] } };
  return { results: data?.data?.web ?? [], status };
}

async function firecrawlScrape(apiKey: string, url: string): Promise<string> {
  const { status, body } = await firecrawlPost(apiKey, "/scrape", {
    url,
    formats: ["markdown"],
    onlyMainContent: true,
  });
  if (status !== 200) return "";
  const data = body as { data?: { markdown?: string } };
  return data?.data?.markdown ?? "";
}

function parseFromTexts(snippet: string, markdown: string | undefined): ReturnType<typeof parseListingText> {
  // Snippet first (title + description). A snippet carrying 3+ distinct prices
  // is a list page that slipped through the URL filter — never a single car.
  let parsed = extractPrices(snippet).length <= 2 ? parseListingText(snippet) : null;

  // Scraped page markdown as fallback. Capped: price and mileage sit in the top
  // section of a listing page, and further down "similar vehicles" widgets carry
  // misleading pairs. A top section flooded with prices is again a list page.
  if (!parsed && markdown) {
    const top = markdown.slice(0, 4_000);
    parsed = extractPrices(top).length <= 6 ? parseListingText(top) : null;
  }
  return parsed;
}

function resultsToComps(
  results: FirecrawlWebResult[],
  targetYear: number,
  seenUrls: Set<string>,
  candidates: Candidate[],
  categoryUrls: string[]
): { comps: CompOut[]; onMarketplace: number } {
  const comps: CompOut[] = [];
  let onMarketplace = 0;
  for (const r of results) {
    if (!r.url) continue;
    // Individual listings only — model-overview/search pages are not comps, but
    // marketplace category pages are worth harvesting: each carries dozens of
    // real listings with price + km per card.
    const source = identifyListingUrl(r.url);
    if (!source) {
      if (identifyCategoryUrl(r.url) && !categoryUrls.includes(r.url)) {
        categoryUrls.push(r.url);
      }
      continue;
    }
    if (seenUrls.has(r.url)) continue;
    onMarketplace += 1;

    const title = (r.title ?? "").slice(0, 120) || `${source} Inserat`;
    const parsed = parseFromTexts(`${r.title ?? ""} ${r.description ?? ""}`, r.markdown);
    if (!parsed) {
      // Listing URL without readable price/km in the snippet: remember it, a
      // targeted page scrape can still extract the numbers.
      seenUrls.add(r.url);
      candidates.push({ url: r.url, title, source });
      continue;
    }
    if (!yearMatches(parsed, targetYear)) continue;

    seenUrls.add(r.url);
    comps.push({ price: parsed.price, km: parsed.km, title, url: r.url, source });
  }
  return { comps, onMarketplace };
}

/**
 * Prefer comps with a similar mileage; widen the band only when the strict one
 * yields too few. Returns the picked comps plus whether relaxation was needed.
 */
function pickBySimilarKm(
  comps: CompOut[],
  targetKm: number,
  model: string
): { picked: CompOut[]; relaxed: boolean } {
  // Trim precision beats km proximity: a GTI comp poisons a 1.5-TSI valuation far
  // worse than a 20'000-km mileage gap (the km-Angleich corrects mileage anyway).
  const byDistance = [...comps].sort((a, b) => {
    const p = modelPrecision(a.title, model) - modelPrecision(b.title, model);
    if (p !== 0) return p;
    return Math.abs(a.km - targetKm) - Math.abs(b.km - targetKm);
  });
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

function buildDiagnosis(stats: TierStat[], candidatesTried: number): string {
  const totalResults = stats.reduce((s, t) => s + t.results, 0);
  const totalMarketplace = stats.reduce((s, t) => s + t.onMarketplace, 0);
  if (stats.every((t) => t.status === "network")) {
    return "Die Suchanfragen sind fehlgeschlagen (Netzwerk) – bitte später nochmals versuchen.";
  }
  if (totalResults === 0) {
    return "Die Web-Suche lieferte keine Treffer für dieses Modell – prüf Schreibweise/Jahrgang oder erfasse manuell.";
  }
  if (totalMarketplace === 0) {
    return `Die Suche fand ${totalResults} Web-Treffer, aber keine einzelnen Inserate auf Occasions-Portalen.`;
  }
  return `Die Suche fand ${totalMarketplace} Inserat(e)${candidatesTried > 0 ? `, auch nach Seitenabruf` : ""} ohne lesbaren Preis + Kilometerstand.`;
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

  // Query with the name listings actually use ("VW", not "Volkswagen").
  const queryMake = MAKE_ALIASES[makeStr.toLowerCase()] ?? makeStr;
  const vehicle = `${queryMake} ${modelStr}`;
  const stats: TierStat[] = [];
  const seenUrls = new Set<string>();
  const candidates: Candidate[] = [];
  const categoryUrls: string[] = [];
  let comps: CompOut[] = [];
  const startedAt = Date.now();
  const withinBudget = () => Date.now() - startedAt < TIER_DEADLINE_MS;

  // Round 1: three snippet-only searches in parallel — AutoScout24 detail pages,
  // tutti detail pages, and a generic marketplace-wide query. Unquoted terms —
  // an exact-phrase match is too brittle for listing titles.
  const queries = [
    `site:autoscout24.ch/de/d ${vehicle} ${yearNum}`,
    `site:tutti.ch/de/vi ${vehicle}`,
    `${vehicle} ${yearNum} Occasion Schweiz CHF km`,
  ];
  const outcomes = await Promise.all(queries.map((q) => firecrawlSearch(apiKey, q, 10)));

  // A key/quota problem hits every call the same way — fail loudly instead of
  // reporting a misleading "no listings found".
  if (outcomes.some((o) => o.status === 401 || o.status === 403)) {
    return res.status(502).json({
      error: "firecrawl_auth",
      message: "Die Inserats-Suche meldet einen ungültigen API-Key (Firecrawl). Bitte FIRECRAWL_API_KEY in Vercel prüfen.",
    });
  }
  if (outcomes.some((o) => o.status === 402)) {
    return res.status(502).json({
      error: "firecrawl_credits",
      message: "Das Firecrawl-Guthaben ist aufgebraucht – Suche vorübergehend nicht möglich.",
    });
  }

  outcomes.forEach((outcome, i) => {
    const { comps: found, onMarketplace } = resultsToComps(
      outcome.results,
      yearNum,
      seenUrls,
      candidates,
      categoryUrls
    );
    comps.push(...found);
    stats.push({
      query: queries[i],
      status: outcome.status,
      results: outcome.results.length,
      onMarketplace,
      parsed: found.length,
    });
  });

  // Round 2: when snippets alone weren't enough, scrape in parallel — up to 2
  // category/model-overview pages (dozens of listing cards each) and up to 4
  // individual listings whose snippets lacked price/km.
  let candidatesTried = 0;
  if (
    comps.length < MAX_COMPS &&
    withinBudget() &&
    (categoryUrls.length > 0 || candidates.length > 0)
  ) {
    const catPages = categoryUrls.slice(0, 2);
    const detailPages = candidates.slice(0, MAX_SCRAPE_CANDIDATES - catPages.length);
    candidatesTried = catPages.length + detailPages.length;

    const scraped = await Promise.allSettled(
      [...catPages, ...detailPages.map((c) => c.url)].map((u) => firecrawlScrape(apiKey, u))
    );

    let added = 0;
    scraped.forEach((s, i) => {
      if (s.status !== "fulfilled" || !s.value) return;
      if (i < catPages.length) {
        // Category page: harvest every parseable listing card.
        for (const card of parseCategoryMarkdown(s.value, catPages[i])) {
          if (seenUrls.has(card.url)) continue;
          if (!yearMatches(card, yearNum)) continue;
          seenUrls.add(card.url);
          comps.push({
            price: card.price,
            km: card.km,
            title: card.title,
            url: card.url,
            source: identifyListingUrl(card.url) ?? "inserat",
          });
          added += 1;
        }
      } else {
        // Individual listing page: parse its content.
        const c = detailPages[i - catPages.length];
        const parsed = parseFromTexts("", s.value);
        if (!parsed || !yearMatches(parsed, yearNum)) return;
        comps.push({ price: parsed.price, km: parsed.km, title: c.title, url: c.url, source: c.source });
        added += 1;
      }
    });
    stats.push({
      query: `(Seitenabruf: ${catPages.length} Übersichtsseiten, ${detailPages.length} Inserate)`,
      status: 200,
      results: candidatesTried,
      onMarketplace: candidatesTried,
      parsed: added,
    });
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
  const { picked, relaxed } = pickBySimilarKm(comps, kmNum, modelStr);

  // Funnel stats land in the Vercel function logs for every request.
  console.log("valuation/comps funnel:", JSON.stringify({ vehicle, yearNum, kmNum, stats, picked: picked.length }));

  return res.status(200).json({
    comps: picked,
    queried: stats.map((s) => s.query),
    diagnosis: picked.length === 0 ? buildDiagnosis(stats, candidatesTried) : undefined,
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
