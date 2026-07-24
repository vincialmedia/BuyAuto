import type { NextApiRequest, NextApiResponse } from "next";
import { createPagesServerClient } from "@supabase/auth-helpers-nextjs";
import {
  as24CategoryUrl,
  baseModel,
  comparisCategoryUrl,
  extractPrices,
  identifyCategoryUrl,
  identifyListingUrl,
  isNewVehicleText,
  modelPrecision,
  parseCategoryMarkdown,
  parseDetailMarkdown,
  parseListingText,
  yearMatches,
} from "@/lib/buyauto/compsParser";
import { peekQuota, commitSearch, type QuotaResult } from "@/lib/buyauto/valuationQuota";

// Firecrawl search calls can take 10-30s; lift the serverless limit accordingly.
// Pages Router API routes configure maxDuration via the config export (the bare
// `export const maxDuration` form is App Router segment config and gets ignored).
export const config = { maxDuration: 60 };

const FIRECRAWL_API = "https://api.firecrawl.dev/v2";
// Per-call timeouts and overall budget: one parallel search round (≤18s) plus one
// parallel scrape round (≤28s) stays under the 60s function limit. Stealth-proxy
// scrapes of the Swiss portals regularly need >15s (they 408'd before).
const SEARCH_TIMEOUT_MS = 18_000;
const SCRAPE_TIMEOUT_MS = 28_000;
const TIER_DEADLINE_MS = 30_000;

const MAX_COMPS = 5;
// Total page scrapes per request (category pages + individual listings).
const MAX_SCRAPES = 10;
const MAX_CATEGORY_SCRAPES = 3;

// --- Comp-quality guards ---
// A trade-in comp must be a genuinely USED car. Near-new / demo listings (e.g. a
// 140-km showroom GTE) are a different depreciation stage and, worse, a wild
// outlier that skews the median — drop anything below this mileage floor.
const MIN_COMP_KM = 1_500;
// Price-class outlier band: a base Golf 1.5 TSI (~CHF 12–15k) and a GTE/GTI/R
// hybrid (~CHF 38k) are not comparable even after the km adjustment. Keep only
// listings within [0.5x, 2x] of the median listing price — but only when enough
// comps survive, so we never prune ourselves down to nothing.
const PRICE_OUTLIER_LOW = 0.5;
const PRICE_OUTLIER_HIGH = 2;

function medianOf(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

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
  payload: Record<string, unknown>,
  timeoutMs: number
): Promise<{ status: number | "network"; body: unknown }> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
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
  const { status, body } = await firecrawlPost(apiKey, "/search", { query, limit }, SEARCH_TIMEOUT_MS);
  if (status !== 200) {
    console.error(`Firecrawl search failed: ${status}`, JSON.stringify(body)?.slice(0, 300));
    return { results: [], status };
  }
  const data = body as { data?: { web?: FirecrawlWebResult[] } };
  return { results: data?.data?.web ?? [], status };
}

async function firecrawlScrape(
  apiKey: string,
  url: string
): Promise<{ markdown: string; status: number | "network" }> {
  const { status, body } = await firecrawlPost(
    apiKey,
    "/scrape",
    {
      url,
      formats: ["markdown"],
      onlyMainContent: true,
      // The portal markdown was 90% inline data-URI SVGs — drop them at the source.
      removeBase64Images: true,
      // Swiss portals sit behind aggressive bot protection — let Firecrawl escalate
      // to its stealth proxy when the basic fetch gets blocked.
      proxy: "auto",
      // The inventory pages are client-rendered SPAs: give hydration a moment so
      // the listing cards are in the DOM before capture. 3s left AutoScout24 grids
      // thin — 4s surfaces more cards while staying under the scrape timeout.
      waitFor: 4_000,
      // Category inventories don't move fast; serve Firecrawl's cache for 1h so
      // repeated lookups of popular models cost no extra scrape.
      maxAge: 3_600_000,
      // Firecrawl-side cap below our own AbortController so we get a real status
      // instead of an aborted socket. 15s produced 408s on stealth scrapes.
      timeout: 25_000,
    },
    SCRAPE_TIMEOUT_MS
  );
  if (status !== 200) return { markdown: "", status };
  const data = body as { data?: { markdown?: string } };
  return { markdown: data?.data?.markdown ?? "", status };
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

    // Brand-new cars (and Google's zombie index of long-dead "Neu" stock
    // listings) are not trade-in comps.
    if (isNewVehicleText(`${r.title ?? ""} ${r.description ?? ""}`)) continue;

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
  // Always fill up to MAX_COMPS: the bands only control ORDER (similar-km comps
  // first) — stopping early returned 4 comps while 7 were on the table.
  for (let i = 0; i < bands.length && picked.length < MAX_COMPS; i++) {
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
  // POST only. (A GET/debug diagnostic path existed during development; it was a
  // quota-bypass + unmetered-search vector, so it was removed before launch.)
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }
  const input = (req.body ?? {}) as Record<string, unknown>;

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

  const { make, model, year, km } = input as {
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

  // --- Monthly quota (logged-in users) ---
  // Two-phase: PEEK before the billable search (reject an over-limit user so they
  // can't trigger Firecrawl — cost protection), then COMMIT one search only after
  // it actually ran (so a Firecrawl outage never burns the user's quota). The
  // commit RPC re-checks the limit atomically. Anonymous users are metered
  // client-side (localStorage) + the IP soft limit above.
  const supabase = createPagesServerClient({ req, res });
  const {
    data: { user },
  } = await supabase.auth.getUser();
  let quotaCtx: { limit: number; plan: "free" | "paid" } | null = null;
  let quota: QuotaResult | null = null;
  if (user) {
    const peek = await peekQuota(supabase, user.id);
    if (!peek.allowed) {
      return res.status(402).json({
        error: "quota_exceeded",
        message:
          peek.plan === "paid"
            ? `Dein Monatskontingent von ${peek.limit} Suchen ist aufgebraucht.`
            : `Dein Gratis-Kontingent von ${peek.limit} Suchen pro Monat ist aufgebraucht.`,
        quota: peek,
      });
    }
    quotaCtx = { limit: peek.limit, plan: peek.plan };
    quota = peek; // provisional; replaced by the post-search commit result
  }

  // Query with the name listings actually use ("VW", not "Volkswagen").
  const queryMake = MAKE_ALIASES[makeStr.toLowerCase()] ?? makeStr;
  const vehicle = `${queryMake} ${modelStr}`;
  // Broaden discovery: search the BASE model ("Golf"), not the full trim
  // ("Golf 1.5 TSI"), which returns far more detail-page hits. The trim
  // precision ranking (pickBySimilarKm -> modelPrecision) still floats the exact
  // trim to the top, so relevance is preserved while the funnel gets wider.
  const baseVehicle = `${queryMake} ${baseModel(modelStr)}`;
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
    `site:autoscout24.ch/de/d ${baseVehicle} ${yearNum}`,
    `site:tutti.ch/de/vi ${baseVehicle}`,
    `${vehicle} ${yearNum} Occasion Schweiz CHF km`,
  ];
  const outcomes = await Promise.all(queries.map((q) => firecrawlSearch(apiKey, q, 15)));

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

  // Round 2: when snippets alone weren't enough, scrape in parallel — category/
  // model-overview pages (dozens of listing cards each) plus individual listings
  // whose snippets lacked price/km. The AutoScout24 and Comparis inventory pages
  // are constructed directly from make/model, so this round ALWAYS has live
  // sources and never depends on the search surfacing one.
  let candidatesTried = 0;
  // Deterministic inventory pages FIRST — search-discovered categories only fill
  // the remaining slot, so junk can never crowd out the two known-good sources.
  const orderedCategoryUrls = [
    as24CategoryUrl(makeStr, modelStr),
    comparisCategoryUrl(makeStr, modelStr),
    ...categoryUrls,
  ].filter((u, i, arr) => arr.indexOf(u) === i);
  if (comps.length < MAX_COMPS && withinBudget()) {
    const catPages = orderedCategoryUrls.slice(0, MAX_CATEGORY_SCRAPES);
    const detailPages = candidates.slice(0, MAX_SCRAPES - catPages.length);
    candidatesTried = catPages.length + detailPages.length;

    const scraped = await Promise.allSettled(
      [...catPages, ...detailPages.map((c) => c.url)].map((u) => firecrawlScrape(apiKey, u))
    );

    let added = 0;
    scraped.forEach((s, i) => {
      if (s.status !== "fulfilled") return;
      const { markdown } = s.value;
      let addedHere = 0;
      if (markdown) {
        if (i < catPages.length) {
          // Category page: harvest every parseable listing card.
          for (const card of parseCategoryMarkdown(markdown, catPages[i])) {
            if (seenUrls.has(card.url)) continue;
            if (isNewVehicleText(card.title)) continue;
            if (!yearMatches(card, yearNum)) continue;
            seenUrls.add(card.url);
            comps.push({
              price: card.price,
              km: card.km,
              title: card.title,
              url: card.url,
              source: identifyListingUrl(card.url) ?? "inserat",
            });
            addedHere += 1;
          }
        } else {
          // Individual listing page (URL-verified): full-page parse that
          // tolerates financing offers and similar-vehicle widgets.
          const c = detailPages[i - catPages.length];
          const parsed = parseDetailMarkdown(markdown);
          if (parsed && yearMatches(parsed, yearNum)) {
            comps.push({ price: parsed.price, km: parsed.km, title: c.title, url: c.url, source: c.source });
            addedHere += 1;
          }
        }
      }
      added += addedHere;
    });
    stats.push({
      query: `(Seitenabruf: ${catPages.length} Übersichtsseiten, ${detailPages.length} Inserate)`,
      status: 200,
      results: candidatesTried,
      onMarketplace: candidatesTried,
      parsed: added,
    });
  }

  // Drop duplicate price/km pairs (same car listed twice).
  const uniquePairs = new Set<string>();
  comps = comps.filter((c) => {
    const key = `${c.price}:${c.km}`;
    if (uniquePairs.has(key)) return false;
    uniquePairs.add(key);
    return true;
  });

  // --- Quality guards, applied before selection ---
  const beforeQuality = comps.length;
  // 1) Drop near-new / demo cars (a 140-km GTE is not a comp for a used trade-in).
  comps = comps.filter((c) => c.km >= MIN_COMP_KM);
  // 2) Drop price-class outliers (a premium GTE/GTI/R among base 1.5 TSI Golfs).
  //    Guarded: only prune when >=3 comps exist and >=2 would survive.
  let droppedOutliers = 0;
  if (comps.length >= 3) {
    const medPrice = medianOf(comps.map((c) => c.price));
    const kept = comps.filter(
      (c) => c.price >= medPrice * PRICE_OUTLIER_LOW && c.price <= medPrice * PRICE_OUTLIER_HIGH
    );
    if (kept.length >= 2) {
      droppedOutliers = comps.length - kept.length;
      comps = kept;
    }
  }
  const droppedForQuality = beforeQuality - comps.length;

  const { picked, relaxed } = pickBySimilarKm(comps, kmNum, modelStr);

  // The search actually ran (Firecrawl was billed) — commit ONE search against
  // the logged-in user's quota now, not before, so a platform failure above
  // (handled via the 502 returns) never burns their quota.
  if (user && quotaCtx) {
    quota = await commitSearch(supabase, quotaCtx.limit, quotaCtx.plan);
  }

  // Funnel stats land in the Vercel function logs for every request.
  console.log(
    "valuation/comps funnel:",
    JSON.stringify({ vehicle, yearNum, kmNum, stats, droppedForQuality, droppedOutliers, picked: picked.length })
  );

  return res.status(200).json({
    comps: picked,
    queried: stats.map((s) => s.query),
    quota: quota ?? undefined,
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
