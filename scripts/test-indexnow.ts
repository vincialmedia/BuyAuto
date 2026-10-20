/**
 * Checks for the IndexNow URL collection, submission and cron auth with a mocked data
 * source and a mocked fetch: `npx tsx scripts/test-indexnow.ts`. Nothing is sent.
 * Exits non-zero on the first failed assertion.
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import {
  INDEXNOW_ENDPOINT,
  INDEXNOW_HOST,
  INDEXNOW_KEY,
  INDEXNOW_KEY_LOCATION,
  INDEXNOW_MAX_URLS,
  INDEXNOW_WINDOW_HOURS,
  authorizeCronRequest,
  collectIndexNowUrls,
  runIndexNow,
  submitIndexNow,
  type IndexNowDataSource,
  type IndexNowEndedRow,
  type IndexNowOffer,
} from "../src/lib/buyauto/indexNow";
import type { EndedTakeover } from "../src/lib/buyauto/leasingBrands";

const NOW = new Date("2026-10-20T05:00:00Z");
const HOUR_MS = 60 * 60 * 1000;
const hoursAgo = (n: number) => new Date(NOW.getTime() - n * HOUR_MS).toISOString();
const SITE = "https://www.buyauto.ch";
const HUB = `${SITE}/suche?dealType=lease_takeover`;

const id = (n: number) => `00000000-0000-4000-8000-${String(n).padStart(12, "0")}`;

function offer(
  n: number,
  brand: string,
  model: string,
  changed: { created?: string; updated?: string },
  kaufart: "lease_takeover" | "direct_purchase" = "lease_takeover"
): IndexNowOffer {
  return {
    id: id(n),
    brand,
    model,
    created_at: changed.created ?? hoursAgo(24 * 90),
    updated_at: changed.updated ?? null,
    offer: { kaufart, isLiveOffer: true },
  };
}

function ended(n: number, brand: string, model: string, fields: Partial<IndexNowEndedRow>): IndexNowEndedRow {
  return {
    id: id(n),
    brand,
    model,
    status: "sold",
    expires_at: null,
    sold_at: null,
    archived_at: null,
    published_at: hoursAgo(24 * 60),
    deal_type: "lease_takeover",
    financing_type: null,
    price_per_month_chf: 600,
    leasing_offer: null,
    contract_end_date: null,
    remaining_months: 20,
    ...fields,
  };
}

function source(
  live: IndexNowOffer[] | Error,
  endedRows: IndexNowEndedRow[] | null | Error,
  grace: EndedTakeover[] | Error = []
): IndexNowDataSource & { sinceSeen: Date[]; graceReads: number } {
  const sinceSeen: Date[] = [];
  const src = {
    sinceSeen,
    graceReads: 0,
    liveOffers: async () => {
      if (live instanceof Error) throw live;
      return live;
    },
    endedRows: async (since: Date) => {
      sinceSeen.push(since);
      if (endedRows instanceof Error) throw endedRows;
      return endedRows;
    },
    endedTakeovers: async () => {
      src.graceReads += 1;
      if (grace instanceof Error) throw grace;
      return grace;
    },
  };
  return src;
}

async function main() {
  // --- The key file -----------------------------------------------------------
  assert.match(INDEXNOW_KEY, /^[0-9a-f]{32}$/, "a 32-hex key");
  const keyFile = path.join(__dirname, "..", "public", `${INDEXNOW_KEY}.txt`);
  assert.equal(fs.readFileSync(keyFile, "utf8").trim(), INDEXNOW_KEY, "public/<key>.txt holds the key");
  assert.equal(INDEXNOW_KEY_LOCATION, `${SITE}/${INDEXNOW_KEY}.txt`);
  assert.equal(INDEXNOW_HOST, "www.buyauto.ch");
  assert.equal(INDEXNOW_WINDOW_HOURS, 26);

  // --- Collection: live changes, ended listings, hub and brand pages --------------
  const live: IndexNowOffer[] = [
    offer(1, "BMW", "X3", { updated: hoursAgo(2) }), // updated: in
    offer(2, "Mercedes", "EQE", { created: hoursAgo(10) }), // published (new): in, brand page via alias
    offer(3, "Audi", "A4", { updated: hoursAgo(30) }), // older than 26 h: out
    offer(4, "Volvo", "XC60", { updated: hoursAgo(25.9) }), // just inside the window
    offer(5, "Fiat", "500", { updated: hoursAgo(1) }, "direct_purchase"), // Direktkauf: URL only
    offer(6, "Tesla", "Model 3", { updated: new Date(NOW.getTime() + HOUR_MS).toISOString() }), // future: out
    offer(7, "BMW", "i4", { updated: hoursAgo(5) }), // second BMW: one brand page
  ];
  const endedRows: IndexNowEndedRow[] = [
    ended(10, "Porsche", "Macan", { status: "sold", sold_at: hoursAgo(3) }), // sold in window
    ended(11, "Škoda", "Enyaq", { status: "expired", expires_at: hoursAgo(20) }), // expired in window
    ended(12, "Toyota", "Yaris", { status: "archived", archived_at: hoursAgo(40) }), // too old
    ended(13, "Volkswagen", "Golf", { status: "published", expires_at: hoursAgo(6) }), // published past expiry
    ended(14, "Volkswagen", "Polo", { status: "published", expires_at: hoursAgo(-48) }), // still live: out
    ended(15, "Renault", "Clio", { status: "sold", sold_at: hoursAgo(4), published_at: null }), // never published: out
    ended(16, "Dacia", "Duster", { status: "sold", sold_at: hoursAgo(4), deal_type: "direct_purchase", price_per_month_chf: null }), // Direktkauf ended
    ended(17, "Kia", "EV6", { status: "sold", sold_at: hoursAgo(8), remaining_months: 0 }), // contract had run out: not on the hub
  ];

  // Brand grace history (30 days): a Mercedes takeover ended 10 days ago, so the
  // Mercedes-Benz page (1 live) is indexable; Volvo, Audi and Tesla (1 live each) are not.
  const grace: EndedTakeover[] = [{ brand: "Mercedes-Benz", endedAt: hoursAgo(24 * 10) }];
  const src = source(live, endedRows, grace);
  const result = await collectIndexNowUrls(src, NOW);
  assert.deepEqual(result.errors, []);
  assert.equal(src.sinceSeen.length, 1);
  assert.equal(src.sinceSeen[0].toISOString(), hoursAgo(26), "ended rows are read for the 26-hour window");
  assert.equal(result.changedListings, 5, "BMW X3, Mercedes EQE, Volvo, Fiat, BMW i4");
  assert.equal(result.endedListings, 5, "Porsche, Škoda, VW Golf, Dacia, Kia");
  assert.equal(result.truncated, false);

  const expected = [
    HUB,
    `${SITE}/leasinguebernahme/bmw`,
    `${SITE}/leasinguebernahme/mercedes-benz`,
    `${SITE}/leasinguebernahme/porsche`,
    `${SITE}/leasinguebernahme/skoda`,
    `${SITE}/leasinguebernahme/volkswagen`,
    // listings, newest change first
    `${SITE}/fahrzeug/fiat-500-${id(5)}`,
    `${SITE}/fahrzeug/bmw-x3-${id(1)}`,
    `${SITE}/fahrzeug/porsche-macan-${id(10)}`,
    `${SITE}/fahrzeug/dacia-duster-${id(16)}`,
    `${SITE}/fahrzeug/bmw-i4-${id(7)}`,
    `${SITE}/fahrzeug/volkswagen-golf-${id(13)}`,
    `${SITE}/fahrzeug/kia-ev6-${id(17)}`,
    `${SITE}/fahrzeug/mercedes-eqe-${id(2)}`,
    `${SITE}/fahrzeug/skoda-enyaq-${id(11)}`,
    `${SITE}/fahrzeug/volvo-xc60-${id(4)}`,
  ];
  assert.deepEqual(result.urls, expected);
  assert.equal(src.graceReads, 1, "the grace history is read when a brand sits at one live offer");
  assert.ok(!result.urls.includes(`${SITE}/leasinguebernahme/volvo`), "a brand page that stays noindex is not submitted");
  // bmw: 2 live; mercedes-benz: 1 live + grace; porsche, skoda, volkswagen: their last
  // live takeover ended in the window (the page just went noindex).
  assert.ok(!result.urls.some((u) => u.includes("/leasinguebernahme/fiat")), "a Direktkauf adds no brand page");
  assert.ok(!result.urls.some((u) => u.includes("/leasinguebernahme/dacia")), "an ended Direktkauf adds no brand page");
  assert.ok(!result.urls.some((u) => u.includes("/leasinguebernahme/kia")), "a takeover whose contract had run out was off the hub");
  assert.ok(!result.urls.some((u) => /audi|tesla|toyota|polo|renault/.test(u)), "out-of-window and unpublished rows are left out");
  assert.equal(new Set(result.urls).size, result.urls.length, "no duplicates");
  assert.ok(result.urls.every((u) => u.startsWith(`${SITE}/`)), "only www.buyauto.ch URLs");

  // Without the grace history, the Mercedes-Benz page (1 live) is noindex: not submitted.
  const noGrace = await collectIndexNowUrls(source(live, endedRows, []), NOW);
  assert.ok(!noGrace.urls.includes(`${SITE}/leasinguebernahme/mercedes-benz`));
  assert.ok(noGrace.urls.includes(`${SITE}/fahrzeug/mercedes-eqe-${id(2)}`), "the listing itself still is");
  // A failed grace read is reported and falls back on the rule without it.
  const graceFails = await collectIndexNowUrls(source(live, endedRows, new Error("timeout")), NOW);
  assert.deepEqual(graceFails.errors, ["brand grace history: timeout"]);
  assert.ok(!graceFails.urls.includes(`${SITE}/leasinguebernahme/mercedes-benz`));
  assert.ok(graceFails.urls.includes(`${SITE}/leasinguebernahme/bmw`));
  // An ended takeover whose brand keeps one live offer without grace: no brand page.
  const stillOne = await collectIndexNowUrls(
    source([offer(30, "Volvo", "XC40", {})], [ended(31, "Volvo", "XC60", { status: "sold", sold_at: hoursAgo(2) })]),
    NOW
  );
  assert.deepEqual(stillOne.urls, [HUB, `${SITE}/fahrzeug/volvo-xc60-${id(31)}`]);
  // No brand at one live offer: the grace history is not read.
  const twoBmw = source([offer(1, "BMW", "X3", { updated: hoursAgo(2) }), offer(7, "BMW", "i4", {})], []);
  assert.deepEqual((await collectIndexNowUrls(twoBmw, NOW)).urls, [HUB, `${SITE}/leasinguebernahme/bmw`, `${SITE}/fahrzeug/bmw-x3-${id(1)}`]);
  assert.equal(twoBmw.graceReads, 0);

  // Only a Direktkauf changed: no hub, no brand page.
  const onlyDirect = await collectIndexNowUrls(source([live[4]], []), NOW);
  assert.deepEqual(onlyDirect.urls, [`${SITE}/fahrzeug/fiat-500-${id(5)}`]);

  // Nothing changed: empty list.
  const nothing = await collectIndexNowUrls(source([live[2]], []), NOW);
  assert.deepEqual(nothing.urls, []);

  // No service-role key: ended rows unknown, live changes still collected.
  const noKey = await collectIndexNowUrls(source(live, null), NOW);
  assert.equal(noKey.endedListings, null);
  assert.ok(noKey.urls.includes(`${SITE}/fahrzeug/bmw-x3-${id(1)}`));
  assert.ok(!noKey.urls.some((u) => u.includes("porsche")));

  // Read failures are reported, never thrown.
  const liveFails = await collectIndexNowUrls(source(new Error("offer index down"), endedRows), NOW);
  assert.deepEqual(liveFails.errors, ["live listings: offer index down"]);
  assert.ok(liveFails.urls.includes(`${SITE}/fahrzeug/porsche-macan-${id(10)}`), "ended rows still collected");
  assert.ok(liveFails.urls.includes(`${SITE}/leasinguebernahme/porsche`), "without live offers the brand rule is unknown: submitted");
  const endedFails = await collectIndexNowUrls(source(live, new Error("permission denied"), grace), NOW);
  assert.deepEqual(endedFails.errors, ["ended listings: permission denied"]);
  assert.equal(endedFails.endedListings, null);
  assert.ok(endedFails.urls.includes(HUB));

  // Dedupe across live and ended (same id in both) and the 500 cap.
  const dup = await collectIndexNowUrls(
    source(
      [offer(1, "BMW", "X3", { updated: hoursAgo(2) })],
      [ended(1, "BMW", "X3", { status: "sold", sold_at: hoursAgo(1) })],
      [{ brand: "BMW", endedAt: hoursAgo(1) }]
    ),
    NOW
  );
  assert.deepEqual(dup.urls, [HUB, `${SITE}/leasinguebernahme/bmw`, `${SITE}/fahrzeug/bmw-x3-${id(1)}`]);
  const many = Array.from({ length: 600 }, (_, i) => offer(1000 + i, "BMW", `M${i}`, { updated: hoursAgo(1 + i / 100) }));
  const capped = await collectIndexNowUrls(source(many, []), NOW);
  assert.equal(capped.urls.length, INDEXNOW_MAX_URLS);
  assert.equal(capped.truncated, true);
  assert.equal(capped.urls[0], HUB, "hub and brand pages come first");
  assert.equal(capped.urls[1], `${SITE}/leasinguebernahme/bmw`);
  assert.equal(capped.urls[2], `${SITE}/fahrzeug/bmw-m0-${id(1000)}`, "then the newest listing");

  // --- Submission with a mocked fetch --------------------------------------------
  const calls: { url: string; init: RequestInit }[] = [];
  const fetchWith = (status: number | Error): typeof fetch =>
    (async (url: string | URL | Request, init?: RequestInit) => {
      calls.push({ url: String(url), init: init ?? {} });
      if (status instanceof Error) throw status;
      return new Response(null, { status });
    }) as typeof fetch;

  const sent = await submitIndexNow(expected, fetchWith(200));
  assert.deepEqual(sent, { ok: true, status: 200 });
  assert.equal(calls.length, 1);
  assert.equal(calls[0].url, INDEXNOW_ENDPOINT);
  assert.equal(calls[0].url, "https://api.indexnow.org/indexnow");
  assert.equal(calls[0].init.method, "POST");
  assert.equal((calls[0].init.headers as Record<string, string>)["Content-Type"], "application/json; charset=utf-8");
  assert.deepEqual(JSON.parse(String(calls[0].init.body)), {
    host: "www.buyauto.ch",
    key: INDEXNOW_KEY,
    keyLocation: INDEXNOW_KEY_LOCATION,
    urlList: expected,
  });

  assert.deepEqual(await submitIndexNow(expected, fetchWith(202)), { ok: true, status: 202 }, "202: accepted, key check pending");
  const forbidden = await submitIndexNow(expected, fetchWith(403));
  assert.equal(forbidden.ok, false);
  assert.equal(forbidden.status, 403);
  const throttled = await submitIndexNow(expected, fetchWith(429));
  assert.equal(throttled.ok, false);
  const offline = await submitIndexNow(expected, fetchWith(new Error("getaddrinfo ENOTFOUND")));
  assert.deepEqual(offline, { ok: false, status: null, error: "getaddrinfo ENOTFOUND" }, "a network error is returned, not thrown");

  calls.length = 0;
  assert.deepEqual(await submitIndexNow([], fetchWith(200)), { ok: true, status: null });
  assert.equal(calls.length, 0, "an empty list sends nothing");

  // A hanging IndexNow is aborted after the timeout.
  const hanging = (async (_url: string | URL | Request, init?: RequestInit) =>
    new Promise<Response>((_, reject) => {
      init?.signal?.addEventListener("abort", () => reject(new Error("aborted")));
    })) as typeof fetch;
  const timedOut = await submitIndexNow(expected, hanging, 20);
  assert.equal(timedOut.ok, false);
  assert.equal(timedOut.error, "aborted");

  // --- The whole run ----------------------------------------------------------------
  calls.length = 0;
  const run = await runIndexNow({ source: source(live, endedRows, grace), fetchImpl: fetchWith(200), now: NOW, dryRun: false });
  assert.equal(run.ok, true);
  assert.equal(run.urlCount, expected.length);
  assert.deepEqual(run.submission, { ok: true, status: 200 });
  assert.equal(calls.length, 1);

  calls.length = 0;
  const dry = await runIndexNow({ source: source(live, endedRows, grace), fetchImpl: fetchWith(200), now: NOW, dryRun: true });
  assert.equal(dry.dryRun, true);
  assert.equal(dry.submission, null);
  assert.deepEqual(dry.urls, expected);
  assert.equal(calls.length, 0, "a dry run sends nothing");

  const failedRun = await runIndexNow({ source: source(live, endedRows, grace), fetchImpl: fetchWith(500), now: NOW, dryRun: false });
  assert.equal(failedRun.ok, false, "an IndexNow error marks the run, without throwing");
  assert.equal(failedRun.submission?.status, 500);

  calls.length = 0;
  const emptyRun = await runIndexNow({ source: source([], []), fetchImpl: fetchWith(200), now: NOW, dryRun: false });
  assert.equal(emptyRun.ok, true);
  assert.equal(emptyRun.submission, null);
  assert.equal(calls.length, 0);

  // --- Who may trigger it ---------------------------------------------------------------
  const secret = "test-secret-not-real";
  assert.deepEqual(authorizeCronRequest({ authorization: `Bearer ${secret}`, userAgent: "vercel-cron/1.0", cronSecret: secret }), { ok: true });
  assert.deepEqual(authorizeCronRequest({ authorization: `Bearer ${secret}`, userAgent: "curl/8", cronSecret: secret }), { ok: true });
  assert.deepEqual(authorizeCronRequest({ authorization: "Bearer wrong", userAgent: "vercel-cron/1.0", cronSecret: secret }), { ok: false }, "with a secret, the user agent alone is not enough");
  assert.deepEqual(authorizeCronRequest({ authorization: undefined, userAgent: "vercel-cron/1.0", cronSecret: secret }), { ok: false });
  const uaOnly = authorizeCronRequest({ authorization: undefined, userAgent: "vercel-cron/1.0", cronSecret: undefined });
  assert.equal(uaOnly.ok, true, "without a secret, the Vercel Cron user agent passes");
  assert.ok(uaOnly.ok && typeof uaOnly.warning === "string" && uaOnly.warning.includes("CRON_SECRET"), "with a warning");
  assert.deepEqual(authorizeCronRequest({ authorization: undefined, userAgent: "Mozilla/5.0", cronSecret: undefined }), { ok: false });
  assert.deepEqual(authorizeCronRequest({ authorization: undefined, userAgent: undefined, cronSecret: "" }), { ok: false }, "an empty secret counts as unset");

  console.log("test-indexnow: all checks passed");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
