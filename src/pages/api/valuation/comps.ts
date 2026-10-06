import type { NextApiRequest, NextApiResponse } from "next";
import { createPagesServerClient } from "@supabase/auth-helpers-nextjs";
import {
  as24CategoryUrl,
  autolinaCategoryUrl,
  baseModel,
  comparisCategoryUrl,
  displacementOf,
  extractPrices,
  identifyCategoryUrl,
  identifyListingUrl,
  isNewVehicleText,
  parseCategoryMarkdown,
  parseDetailMarkdown,
  parseListingText,
  selectComps,
  splitVariant,
  stripModelPrefix,
  variantIdentity,
  variantSearchTerm,
  yearMatches,
  BODY_TYPE_LABEL,
  BODY_TYPE_VALUES,
  MAX_COMPS,
  MIN_COMP_KM,
  type BodyType,
  type CompCandidate,
} from "@/lib/buyauto/compsParser";
import { DRIVETRAIN_TYPES, isGearboxType, type DrivetrainType } from "@/lib/buyauto/listingContract";
import { peekQuota, commitSearch, type QuotaResult } from "@/lib/buyauto/valuationQuota";
import { clientIp, logValuationEvent, readLogContext } from "@/lib/buyauto/valuationLog";

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

  if (rateLimited(clientIp(req) ?? "unknown")) {
    return res.status(429).json({
      error: "rate_limited",
      message: "Zu viele Anfragen – bitte versuch es später nochmals.",
    });
  }

  const { make, model, year, km, body } = input as {
    make?: unknown;
    model?: unknown;
    year?: unknown;
    km?: unknown;
    body?: unknown;
  };

  const makeStr = typeof make === "string" ? make.trim().slice(0, 40) : "";
  const modelStr = typeof model === "string" ? model.trim().slice(0, 60) : "";
  const yearNum = Number(year);
  // Kilometerstand is optional: missing, empty or ≤0 means unknown (null) —
  // the AS24 mileage window is then skipped and the pick centres on the
  // harvest's own median km. Only an absurd value is still an error.
  const kmRaw = km === undefined || km === null || km === "" ? NaN : Number(km);
  const kmNum: number | null = Number.isFinite(kmRaw) && kmRaw > 0 ? kmRaw : null;
  // Optional Karosserie from the calculator's body-type field. Unknown values
  // are ignored (never an error) — the filter is an optimization, not a gate.
  const bodyStr = typeof body === "string" ? body.trim().toLowerCase() : "";
  const requestedBody: BodyType | null = (BODY_TYPE_VALUES as string[]).includes(bodyStr)
    ? (bodyStr as BodyType)
    : null;
  // Optional engine displacement (from a Typenschein/VIN decode, e.g. "2.0").
  // Only used when the MODEL string names no displacement itself: appended to
  // the model handed to selectComps so the trim filter activates, while the
  // search queries keep the clean model name.
  const dispRaw = typeof (input as { displacement?: unknown }).displacement === "string"
    ? ((input as { displacement?: string }).displacement ?? "").trim().replace(",", ".")
    : "";
  const requestedDisplacement = /^\d\.\d$/.test(dispRaw) ? dispRaw : null;
  // Optional catalog variant ("R", "GTI Clubsport", "40 TFSI quattro") or free
  // text. Never appended to the model for the category URLs: baseModel() keeps
  // only the base name, so "Golf GTI Clubsport" would slug to a dead
  // "golf-clubsport" page.
  const variantStr =
    typeof input.variant === "string" ? input.variant.replace(/\s+/g, " ").trim().slice(0, 60) : "";
  const variantParts = splitVariant(variantStr);
  // The identity the variant check matches, minus a repeated model name ("X3
  // 20d xDrive" -> "20d"), exactly like the siblings below.
  const ownIdentity = variantIdentity(variantStr, modelStr);
  // Catalog model id, only to load the sibling variants for the variant check.
  const modelId =
    typeof input.modelId === "string" &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(input.modelId)
      ? input.modelId
      : null;
  const gearbox = isGearboxType(input.gearbox) ? input.gearbox : null;
  const drivetrain = (DRIVETRAIN_TYPES as readonly unknown[]).includes(input.drivetrain)
    ? (input.drivetrain as DrivetrainType)
    : null;

  if (
    !makeStr ||
    !modelStr ||
    !Number.isFinite(yearNum) ||
    yearNum < 1980 ||
    yearNum > new Date().getFullYear() + 1
  ) {
    return res.status(400).json({
      error: "invalid_input",
      message: "Marke, Modell und Jahrgang sind Pflichtfelder.",
    });
  }
  if (kmNum !== null && kmNum > 500_000) {
    return res.status(400).json({
      error: "invalid_input",
      message: "Bitte gib einen gültigen Kilometerstand ein.",
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
  // Attribution for valuation_search_logs (page, visitor, build, user).
  const logCtx = readLogContext(req, input);
  const logVehicle = {
    make: makeStr,
    model: modelStr,
    year: yearNum,
    km: kmNum,
    body: requestedBody,
    displacement: requestedDisplacement,
    variant: variantStr || null,
    gearbox,
    drivetrain,
  };
  if (user) {
    const peek = await peekQuota(supabase, user.id);
    if (!peek.allowed) {
      await logValuationEvent({
        status: peek.plan === "paid" ? "gate_paid" : "gate_free",
        vehicle: logVehicle,
        ctx: logCtx,
        userId: user.id,
      });
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

  // Sibling variants of the catalog model, for the variant check: a "GTI
  // Clubsport" listing is then a positive mismatch in a "GTI" lookup, not just
  // "unknown". Same anon-readable table as /api/vehicles/variants. Started now,
  // awaited before the first selection, so it overlaps the searches. A failed
  // load only weakens the check (match-or-unknown), it never fails the search.
  const siblingsPromise: Promise<string[]> =
    modelId && ownIdentity
      ? (async () => {
          try {
            const { data, error } = await supabase
              .from("variants")
              .select("id,name")
              .eq("model_id", modelId)
              .eq("is_active", true);
            if (error || !data) return [];
            const own = ownIdentity.toLowerCase();
            const ids = (data as Array<{ name?: unknown }>)
              .map((row) => (typeof row.name === "string" ? variantIdentity(row.name, modelStr) : ""))
              .filter((id) => id && id.toLowerCase() !== own);
            return [...new Set(ids)];
          } catch (e) {
            console.error("valuation/comps: variant siblings load failed", e);
            return [];
          }
        })()
      : Promise.resolve([]);

  // Query with the name listings actually use ("VW", not "Volkswagen").
  const queryMake = MAKE_ALIASES[makeStr.toLowerCase()] ?? makeStr;
  const vehicle = `${queryMake} ${modelStr}`;
  // The variant goes into the searches only ("VW Golf R 2021", "Audi A4 40
  // TFSI 2020"), minus drive words that listings often leave out. Skipped when
  // the typed model already ends in it as whole words (free text "Golf R").
  const variantTerm = stripModelPrefix(variantSearchTerm(variantStr), modelStr);
  const vehicleWithVariant =
    variantTerm && !` ${modelStr.toLowerCase()}`.endsWith(` ${variantTerm.toLowerCase()}`)
      ? `${vehicle} ${variantTerm}`
      : vehicle;
  // A known Karosserie sharpens the searches: "BMW i8 Coupé" surfaces the right
  // variant's listings instead of a Coupé/Roadster mix.
  const vehicleQuery = requestedBody
    ? `${vehicleWithVariant} ${BODY_TYPE_LABEL[requestedBody]}`
    : vehicleWithVariant;
  // The model used for SELECTION (trim filter). A displacement — decoded from
  // the Typenschein, else the variant's own ("1.5 TSI") — is appended only when
  // the typed model names none itself. Searches and category URLs keep the
  // clean model name.
  const extraDisplacement = requestedDisplacement ?? variantParts.displacement;
  const filterModel =
    extraDisplacement && !displacementOf(modelStr) ? `${modelStr} ${extraDisplacement}` : modelStr;
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
    `site:autoscout24.ch/de/d ${vehicleQuery} ${yearNum}`,
    `site:tutti.ch/de/vi ${vehicleQuery}`,
    `${vehicleQuery} ${yearNum} Occasion Schweiz CHF km`,
  ];
  const outcomes = await Promise.all(queries.map((q) => firecrawlSearch(apiKey, q, 15)));

  // A key/quota problem hits every call the same way — fail loudly instead of
  // reporting a misleading "no listings found".
  const keyProblem = outcomes.some((o) => o.status === 401 || o.status === 403);
  const creditsProblem = outcomes.some((o) => o.status === 402);
  if (keyProblem || creditsProblem) {
    await logValuationEvent({
      status: "search_failed",
      vehicle: logVehicle,
      funnel: { firecrawl: outcomes.map((o) => o.status) },
      ctx: logCtx,
      userId: user?.id,
    });
  }
  if (keyProblem) {
    return res.status(502).json({
      error: "firecrawl_auth",
      message: "Die Inserats-Suche meldet einen ungültigen API-Key (Firecrawl). Bitte FIRECRAWL_API_KEY in Vercel prüfen.",
    });
  }
  if (creditsProblem) {
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
  // AS24 supports server-side filters (year window matches the ±2 tolerance of
  // yearMatches, km window matches the middle pickBySimilarKm band, body from
  // the request) — the inventory arrives pre-filtered instead of being pruned
  // after the scrape. Comparis only supports the body facet; autolina neither.
  // No km window when the mileage is unknown: one around 0 km would fetch
  // only the near-new cars.
  const kmWindow =
    kmNum !== null
      ? (() => {
          const kmBand = Math.max(60_000, kmNum * 0.8);
          return {
            kmFrom: Math.max(MIN_COMP_KM, Math.round(kmNum - kmBand)),
            kmTo: Math.round(kmNum + kmBand),
          };
        })()
      : {};
  const as24Filters = {
    yearFrom: yearNum - 2,
    yearTo: yearNum + 2,
    ...kmWindow,
    body: requestedBody,
  };
  const orderedCategoryUrls = [
    as24CategoryUrl(makeStr, modelStr, as24Filters),
    comparisCategoryUrl(makeStr, modelStr, { body: requestedBody }),
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
  // Preview and final selection must get identical inputs.
  const siblings = await siblingsPromise;
  const selectOpts = {
    variant: ownIdentity
      ? { identity: ownIdentity, siblings, displacement: variantParts.displacement }
      : null,
    gearbox,
    // A drive named only in the variant ("2.0 TDI 4MOTION") is still a preference.
    drivetrain: drivetrain ?? variantParts.drive,
  };
  const preview = selectComps(comps, filterModel, kmNum, requestedBody, selectOpts);
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
    droppedForVariant,
    variantUnverified,
    droppedNearNew,
    droppedOutliers,
    mixedBody,
    unverifiedAvailable,
    harvested,
  } = selectComps(comps, filterModel, kmNum, requestedBody, selectOpts);
  // Counters are disjoint (trim | variant | body | near-new | outlier) so the
  // funnel log adds up. variantUnverified is set aside, not dropped for
  // quality — like unverifiedAvailable it is reported on its own.
  const droppedForQuality =
    droppedForTrim + droppedForVariant + droppedForBody + droppedNearNew + droppedOutliers;

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
    droppedForVariant,
    variantUnverified,
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
  console.log(
    "valuation/comps funnel:",
    JSON.stringify({
      vehicle,
      yearNum,
      kmNum,
      requestedBody,
      requestedDisplacement,
      variant: variantStr || null,
      gearbox,
      drivetrain,
      ...funnel,
    })
  );
  await logValuationEvent({ status: "ok", vehicle: logVehicle, funnel, ctx: logCtx, userId: user?.id });

  // A zero result caused by the variant/trim/body filters (we DID find this
  // model, just not the requested variant, engine or body) needs its own
  // message so the user knows to enter the matching listings by hand rather
  // than thinking the model doesn't exist. The variant goes first: it is the
  // most specific thing the user asked for.
  const variantZero =
    picked.length === 0 && !!variantStr && (droppedForVariant > 0 || variantUnverified > 0);
  const trimZero = picked.length === 0 && !variantZero && droppedForTrim > 0;
  const bodyZero = picked.length === 0 && !variantZero && !trimZero && droppedForBody > 0;
  const modelLabel = `${queryMake} ${baseModel(modelStr)}`.trim();
  const diagnosis =
    picked.length > 0
      ? undefined
      : variantZero
        ? `Es wurden ${modelLabel}-Inserate gefunden, aber keine als «${variantStr}» erkennbaren. Erfasse 3–5 passende Vergleichsfahrzeuge manuell.`
        : trimZero
          ? `Es wurden ${modelLabel}-Inserate gefunden, aber keine mit passender Motorisierung (${filterModel}). Erfasse 3–5 Vergleichsfahrzeuge mit gleicher Motorisierung manuell.`
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
        ? variantZero
          ? `Keine als «${variantStr}» erkennbaren ${modelLabel}-Inserate gefunden – erfasse sie manuell.`
          : trimZero
            ? `Keine ${filterModel}-Inserate mit passender Motorisierung gefunden – erfasse sie manuell.`
            : bodyZero
              ? `Keine ${modelStr}-Inserate mit passender Karosserie-Variante gefunden – erfasse sie manuell.`
              : "Keine Vergleichsinserate gefunden – erfasse sie manuell."
        : picked.length < 3
          ? "Nur wenige Vergleichsinserate gefunden – prüf die Werte und ergänze manuell."
          : mixedBody
            ? "Die Treffer mischen verschiedene Karosserie-Varianten (z.B. Coupé und Roadster) – entferne unpassende und rechne neu."
            : toppedUp > 0
              ? variantStr
                ? "Bei einigen Inseraten ist die Motorisierung oder Ausführung nicht ausgewiesen – prüf sie kurz nach."
                : "Bei einigen Inseraten ist die Motorisierung nicht ausgewiesen – prüf sie kurz nach."
              : relaxed && kmNum !== null
                ? "Einige Treffer weichen beim Kilometerstand stärker ab – prüf die Werte."
                : undefined,
  });
}
