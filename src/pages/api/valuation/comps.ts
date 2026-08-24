import type { NextApiRequest, NextApiResponse } from "next";
import { createPagesServerClient } from "@supabase/auth-helpers-nextjs";
import {
  as24CategoryUrl,
  autolinaCategoryUrl,
  baseModel,
  comparisCategoryUrl,
  extractPrices,
  identifyCategoryUrl,
  identifyListingUrl,
  isNewVehicleText,
  parseCategoryMarkdown,
  parseDetailMarkdown,
  parseListingText,
  selectComps,
  yearMatches,
  MAX_COMPS,
  type CompCandidate,
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

// Total page scrapes per request (category pages + individual listings).
const MAX_SCRAPES = 10;
// Three deterministic inventory pages (AS24, comparis, autolina) plus one
// search-discovered category page. Inventory pages yield dozens of cards each
// and are by far the best comps-per-scrape, so they get the majority of budget.
const MAX_CATEGORY_SCRAPES = 4;

// Vehicle DB names vs. how listings are actually titled on the portals.
const MAKE_ALIASES: Record<string, string> = {
  volkswagen: "VW",
  "mercedes-benz": "Mercedes",
};

type CompOut = CompCandidate;

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

/** Drop duplicate price/km pairs (same car listed twice). */
function dedupeByPriceKm(comps: CompOut[]): CompOut[] {
  const uniquePairs = new Set<string>();
  return comps.filter((c) => {
    const key = `${c.price}:${c.km}`;
    if (uniquePairs.has(key)) return false;
    uniquePairs.add(key);
    return true;
  });
}

/**
 * `searchStats` must contain ONLY the round-1 search tiers. The round-2 scrape
 * pushes a synthetic stat whose counts describe pages fetched, not listings
 * found — including it made the network branch unreachable and double-counted
 * detail candidates that round 1 had already reported.
 */
function buildDiagnosis(searchStats: TierStat[], candidatesTried: number): string {
  const totalResults = searchStats.reduce((s, t) => s + t.results, 0);
  const totalMarketplace = searchStats.reduce((s, t) => s + t.onMarketplace, 0);
  if (searchStats.length > 0 && searchStats.every((t) => t.status === "network")) {
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
  // Search the FULL trim ("VW Golf 1.5 TSI"), not just the base model: the
  // category-page scrape already harvests every trim for volume, so the searches
  // should target the exact engine to surface real matches. Wrong-trim listings
  // that slip in are dropped by the displacement filter below.
  const queries = [
    `site:autoscout24.ch/de/d ${vehicle} ${yearNum}`,
    `site:tutti.ch/de/vi ${vehicle}`,
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

  // Snapshot the SEARCH tiers before round 2 appends its scrape stat — the
  // diagnosis must reason about searches only (see buildDiagnosis).
  const searchStats = [...stats];

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
    autolinaCategoryUrl(makeStr, modelStr),
    ...categoryUrls,
  ].filter((u, i, arr) => arr.indexOf(u) === i);
  // Gate on comps that will SURVIVE selection, not on the raw haul: run the
  // real (pure, cheap) selectComps over the round-1 harvest and count what it
  // would actually put into the median. An earlier gate anticipated only the
  // trim filter and counted 5 raw i8s as "enough" — then the near-new filter
  // deleted 3 of them and the valuation ran on the 2 survivors (a CHF 124'900
  // Coupé and a CHF 49'900 Roadster) while the AS24/comparis i8 inventory pages,
  // full of normal cards, were never fetched. Any filter inside selectComps
  // (trim, body variant, near-new, outliers) must depress this count, so the
  // preview IS the selection, not a re-implementation of it.
  // Counts CONFIRMED picks only (minus top-ups) — engine-less cards are usable
  // as a top-up but are not a reason to stop looking for the real thing.
  comps = dedupeByPriceKm(comps);
  const preview = selectComps(comps, modelStr, kmNum);
  const viableSoFar = preview.picked.length - preview.toppedUp;
  if (viableSoFar < MAX_COMPS && withinBudget()) {
    const catPages = orderedCategoryUrls.slice(0, MAX_CATEGORY_SCRAPES);
    const detailPages = candidates.slice(0, MAX_SCRAPES - catPages.length);
    candidatesTried = catPages.length + detailPages.length;

    const scraped = await Promise.allSettled(
      [...catPages, ...detailPages.map((c) => c.url)].map((u) => firecrawlScrape(apiKey, u))
    );

    let added = 0;
    let detailParsed = 0;
    let detailFailed = 0;
    scraped.forEach((s, i) => {
      const isCat = i < catPages.length;
      if (s.status !== "fulfilled") {
        // A failed inventory scrape is THE thing that starves a run — name it.
        if (isCat) {
          const reason = s.reason instanceof Error ? s.reason.message : String(s.reason);
          stats.push({
            query: `(Übersicht ${new URL(catPages[i]).hostname}: Abruf fehlgeschlagen – ${reason.slice(0, 120)})`,
            status: "network",
            results: 0,
            onMarketplace: 0,
            parsed: 0,
          });
        } else {
          detailFailed += 1;
        }
        return;
      }
      const { markdown } = s.value;
      let addedHere = 0;
      if (markdown) {
        if (isCat) {
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
      // Per-inventory-page yield: which source produced (or failed to produce)
      // cards is the first question every thin-result diagnosis asks.
      if (isCat) {
        stats.push({
          query: `(Übersicht ${new URL(catPages[i]).hostname}: ${markdown ? `${addedHere} Karten` : "leere Antwort"})`,
          status: 200,
          results: 0,
          onMarketplace: 0,
          parsed: addedHere,
        });
      } else {
        detailParsed += addedHere;
      }
      added += addedHere;
    });
    // Logging only. results/onMarketplace stay 0: these count PAGES FETCHED, not
    // listings found, and buildDiagnosis() must not mistake them for either.
    stats.push({
      query: `(Seitenabruf: ${catPages.length} Übersichtsseiten, ${detailPages.length} Inserate → ${added} Karten, ${detailFailed} Abrufe fehlgeschlagen)`,
      status: 200,
      results: 0,
      onMarketplace: 0,
      parsed: detailParsed,
    });
  }

  // Round 2 may have re-harvested a round-1 car — dedupe again before selection.
  comps = dedupeByPriceKm(comps);

  // Quality guards + km-similarity pick. Pure functions in compsParser.
  const {
    picked,
    relaxed,
    toppedUp,
    droppedForTrim,
    droppedForBody,
    droppedNearNew,
    droppedOutliers,
    mixedBody,
    unverifiedAvailable,
    harvested,
  } = selectComps(comps, modelStr, kmNum);
  // Counters are disjoint (trim | body | near-new | outlier) so the funnel log adds up.
  const droppedForQuality = droppedForTrim + droppedForBody + droppedNearNew + droppedOutliers;

  // The search actually ran (Firecrawl was billed) — commit ONE search against
  // the logged-in user's quota now, not before, so a platform failure above
  // (handled via the 502 returns) never burns their quota.
  if (user && quotaCtx) {
    quota = await commitSearch(supabase, quotaCtx.limit, quotaCtx.plan);
  }

  // Funnel stats: Vercel function logs AND the valuation_search_logs table, so
  // a thin live result can be diagnosed from the DB without Vercel log access.
  const funnel = {
    stats,
    harvested,
    droppedForTrim,
    droppedForBody,
    droppedNearNew,
    droppedOutliers,
    droppedForQuality,
    mixedBody,
    unverifiedAvailable,
    toppedUp,
    picked: picked.length,
    pickedComps: picked.map((c) => ({ price: c.price, km: c.km, title: c.title, source: c.source })),
  };
  console.log("valuation/comps funnel:", JSON.stringify({ vehicle, yearNum, kmNum, ...funnel }));
  try {
    await supabase.rpc("log_valuation_search", {
      p_vehicle: { make: makeStr, model: modelStr, year: yearNum, km: kmNum },
      p_funnel: funnel,
    });
  } catch {
    // Diagnostics only — never let logging break the search response.
  }

  // A zero result caused by the trim/body filters (we DID find this model, just
  // not the requested engine or variant) needs its own message so the user knows
  // to enter the matching listings by hand rather than thinking the model
  // doesn't exist.
  const trimZero = picked.length === 0 && droppedForTrim > 0;
  const bodyZero = picked.length === 0 && !trimZero && droppedForBody > 0;
  const modelLabel = `${queryMake} ${baseModel(modelStr)}`.trim();
  const diagnosis =
    picked.length > 0
      ? undefined
      : trimZero
        ? `Es wurden ${modelLabel}-Inserate gefunden, aber keine mit passender Motorisierung (${modelStr}). Erfasse 3–5 Vergleichsfahrzeuge mit gleicher Motorisierung manuell.`
        : bodyZero
          ? `Es wurden ${modelLabel}-Inserate gefunden, aber keine mit passender Karosserie-Variante (${modelStr}). Erfasse 3–5 passende Vergleichsfahrzeuge manuell.`
          : buildDiagnosis(searchStats, candidatesTried);

  return res.status(200).json({
    comps: picked,
    queried: stats.map((s) => s.query),
    quota: quota ?? undefined,
    diagnosis,
    // The picked set blends distinct body variants (e.g. Coupé + Roadster) —
    // the client should treat the result as a range, not a point estimate.
    mixedBody,
    warning:
      picked.length === 0
        ? trimZero
          ? `Keine ${modelStr}-Inserate mit passender Motorisierung gefunden – erfasse sie manuell.`
          : bodyZero
            ? `Keine ${modelStr}-Inserate mit passender Karosserie-Variante gefunden – erfasse sie manuell.`
            : "Keine Vergleichsinserate gefunden – erfasse sie manuell."
        : picked.length < 3
          ? "Nur wenige Vergleichsinserate gefunden – prüf die Werte und ergänze manuell."
          : mixedBody
            ? "Die Treffer mischen verschiedene Karosserie-Varianten (z.B. Coupé und Roadster) – entferne unpassende und rechne neu."
            : toppedUp > 0
              ? "Bei einigen Inseraten ist die Motorisierung nicht ausgewiesen – prüf sie kurz nach."
              : relaxed
                ? "Einige Treffer weichen beim Kilometerstand stärker ab – prüf die Werte."
                : undefined,
  });
}
