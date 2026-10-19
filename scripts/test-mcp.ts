/**
 * Checks for the MCP connector (src/lib/mcp): `npx tsx scripts/test-mcp.ts`.
 * Exits non-zero on the first failed assertion. Runs offline against fixtures.
 *
 * Covers the protocol core (handshake, version negotiation, tools/list,
 * tools/call, notifications, errors, batches), argument validation, the
 * listing allow-list (no private seller names, descriptions without contact
 * details), location parsing, brand matching, each tool's output against its
 * declared outputSchema, and that every tool is annotated read-only.
 */
import assert from "node:assert/strict";
import {
  LATEST_PROTOCOL_VERSION,
  handleMcpBody,
  handleMcpMessage,
  negotiateProtocolVersion,
  type McpServerConfig,
  type ToolResult,
} from "../src/lib/mcp/protocol";
import {
  cantonCodeFor,
  listingDetail,
  listingSummary,
  placeFor,
  sanitizeDescription,
  DESCRIPTION_REMOVED,
} from "../src/lib/mcp/listingOutput";
import {
  createBuyAutoTools,
  listingIdFromInput,
  matchBrands,
  matchesQuery,
  parseSearchArgs,
  searchPageUrl,
  type ListingDataSource,
} from "../src/lib/mcp/tools";
import type { SearchQuery } from "../src/lib/buyauto/search";
import type { Listing, ListingDetail } from "../src/lib/buyauto/types";

// ── Minimal JSON Schema check (the subset the connector's schemas use) ──────

function typeOf(value: unknown): string {
  if (value === null) return "null";
  if (Array.isArray(value)) return "array";
  if (typeof value === "number") return Number.isInteger(value) ? "integer" : "number";
  return typeof value;
}

function matchesType(value: unknown, type: string): boolean {
  const actual = typeOf(value);
  return actual === type || (type === "number" && actual === "integer");
}

function validate(value: unknown, schema: Record<string, any>, path = "$"): string[] {
  const errors: string[] = [];
  if (schema.type) {
    const types: string[] = Array.isArray(schema.type) ? schema.type : [schema.type];
    if (!types.some((t) => matchesType(value, t))) {
      return [`${path}: expected ${types.join("|")}, got ${typeOf(value)}`];
    }
  }
  if (schema.enum && !schema.enum.includes(value)) errors.push(`${path}: ${JSON.stringify(value)} not in enum`);
  if (typeOf(value) === "object" && schema.properties) {
    const obj = value as Record<string, unknown>;
    for (const key of schema.required ?? []) if (!(key in obj)) errors.push(`${path}.${key}: missing`);
    for (const [key, sub] of Object.entries(schema.properties as Record<string, any>)) {
      if (key in obj) errors.push(...validate(obj[key], sub, `${path}.${key}`));
    }
  }
  if (typeOf(value) === "array" && schema.items) {
    (value as unknown[]).forEach((item, i) => errors.push(...validate(item, schema.items, `${path}[${i}]`)));
  }
  return errors;
}

// ── Fixtures ────────────────────────────────────────────────────────────────

function listing(overrides: Partial<ListingDetail>): ListingDetail {
  return {
    id: "11111111-1111-4111-8111-111111111111",
    kaufart: "lease_takeover",
    contractEnded: false,
    deal_type: "lease_takeover",
    financing_type: null,
    leasing_offer: null,
    brand: "BMW",
    model: "X3",
    variant: "xDrive20d",
    title: "BMW X3 xDrive20d",
    description: "Top Zustand, 45'000 km, Baujahr 2021. Ruf mich an: 079 123 45 67 oder mail an max.muster@example.ch, Fotos: https://example.com/x",
    year: 2021,
    pricePerMonthCHF: 590,
    remainingMonths: 18,
    remaining_km: null,
    location: "Schlieren, ZH",
    mileageKm: 45000,
    fuel: "Diesel",
    gearbox: "Automatik",
    body: "SUV",
    premium: true,
    depositCHF: 0,
    images: ["https://example.supabase.co/storage/v1/object/public/listing-images/u/1.webp"],
    imageUrl: "https://example.supabase.co/storage/v1/object/public/listing-images/u/1.webp",
    purchasePriceCHF: null,
    vin: "WBA00000000000000",
    powerHp: 190,
    drivetrain: "Allrad",
    firstRegistration: "2021-03-15",
    seller_type: "private",
    seller_name: "Muster P.",
    seller_avatar_url: "https://example.com/avatar.png",
    garage_id: null,
    garage_name: null,
    created_at: "2026-09-30T10:00:00Z",
    canton_code: "ZH",
    image_urls: ["https://example.supabase.co/storage/v1/object/public/listing-images/u/1.webp"],
    status: "published",
    expires_at: null,
    duration_days: 60,
    price_plan: "standard",
    premium_until: null,
    ...overrides,
  } as ListingDetail;
}

const TAKEOVER = listing({});
const GARAGE_TAKEOVER = listing({
  id: "22222222-2222-4222-8222-222222222222",
  brand: "Mercedes",
  model: "GLC",
  variant: null,
  title: "Mercedes GLC 300e",
  seller_type: "garage",
  garage_id: "33333333-3333-4333-8333-333333333333",
  garage_name: "Garage Muster AG",
  seller_name: "Garage Muster AG",
  location: "Dietikon, Bezirk Dietikon, Zürich, 8953, Schweiz/Suisse/Svizzera/Svizra",
  canton_code: "",
  premium: false,
  depositCHF: 2000,
  remaining_km: 0,
  leasing_offer: { enabled: false, lease_takeover_offer: { remaining_km: 30000 } } as any,
  fuel: "Hybrid",
});
const DIRECT = listing({
  id: "44444444-4444-4444-8444-444444444444",
  kaufart: "direct_purchase",
  deal_type: "direct_purchase",
  financing_type: "cash",
  brand: "Škoda",
  model: "Enyaq",
  variant: null,
  title: "Škoda Enyaq iV 80",
  pricePerMonthCHF: 0,
  remainingMonths: 0,
  depositCHF: null,
  purchasePriceCHF: 31900,
  location: "Bern, BE",
  canton_code: "BE",
  fuel: "Elektro",
  premium: false,
});

const LIVE_BRANDS = ["BMW", "Mercedes", "Mercedes-Benz", "Škoda", "Volkswagen", "Tesla"];

function fakeData(items: Listing[]): ListingDataSource & { queries: SearchQuery[] } {
  const queries: SearchQuery[] = [];
  return {
    queries,
    async search(q) {
      queries.push(q);
      let matches = items.slice();
      if (q.brands?.length) matches = matches.filter((l) => q.brands!.includes(l.brand));
      if (q.dealType) matches = matches.filter((l) => l.kaufart === q.dealType);
      const page = q.page ?? 1;
      const size = q.pageSize ?? 12;
      return { items: matches.slice((page - 1) * size, page * size), total: matches.length, page, pageSize: size };
    },
    async getListing(id) {
      return (items.find((l) => l.id === id) as ListingDetail) ?? null;
    },
    async getGarage(garageId) {
      return garageId === GARAGE_TAKEOVER.garage_id ? { name: "Garage Muster AG", slug: "garage-muster" } : null;
    },
    async liveBrands() {
      return LIVE_BRANDS;
    },
  };
}

function serverWith(data: ListingDataSource): McpServerConfig {
  return {
    name: "buyauto",
    title: "BuyAuto",
    version: "test",
    websiteUrl: "https://www.buyauto.ch",
    instructions: "Test instructions.",
    tools: createBuyAutoTools(data),
  };
}

async function call(config: McpServerConfig, name: string, args: Record<string, unknown> = {}): Promise<ToolResult> {
  const res = (await handleMcpMessage(
    { jsonrpc: "2.0", id: 7, method: "tools/call", params: { name, arguments: args } },
    config
  )) as any;
  assert.ok(res && "result" in res, `tools/call ${name} must return a result: ${JSON.stringify(res)}`);
  return res.result as ToolResult;
}

function outputSchemaOf(config: McpServerConfig, name: string) {
  return config.tools.find((t) => t.definition.name === name)!.definition.outputSchema as Record<string, any>;
}

function assertMatchesSchema(config: McpServerConfig, name: string, result: ToolResult) {
  assert.ok(result.structuredContent, `${name}: structuredContent missing`);
  const errors = validate(result.structuredContent, outputSchemaOf(config, name));
  assert.deepEqual(errors, [], `${name}: output does not match outputSchema:\n${errors.join("\n")}`);
  assert.equal(result.content[0].type, "text");
  assert.deepEqual(JSON.parse(result.content[0].text), result.structuredContent, `${name}: text block must be the JSON`);
}

async function main() {
  const data = fakeData([TAKEOVER, GARAGE_TAKEOVER, DIRECT]);
  const config = serverWith(data);

  // ── Protocol ──
  assert.equal(negotiateProtocolVersion("2025-06-18"), "2025-06-18");
  assert.equal(negotiateProtocolVersion("2099-01-01"), LATEST_PROTOCOL_VERSION);
  assert.equal(negotiateProtocolVersion(undefined), LATEST_PROTOCOL_VERSION);

  const init = (await handleMcpMessage(
    { jsonrpc: "2.0", id: 1, method: "initialize", params: { protocolVersion: "2025-03-26", capabilities: {}, clientInfo: { name: "t", version: "1" } } },
    config
  )) as any;
  assert.equal(init.id, 1);
  assert.equal(init.result.protocolVersion, "2025-03-26");
  assert.deepEqual(init.result.capabilities, { tools: { listChanged: false } });
  assert.equal(init.result.serverInfo.name, "buyauto");
  assert.equal(init.result.instructions, "Test instructions.");

  assert.equal(await handleMcpMessage({ jsonrpc: "2.0", method: "notifications/initialized" }, config), null);
  assert.deepEqual(await handleMcpBody({ jsonrpc: "2.0", method: "notifications/initialized" }, config), { status: 202 });
  assert.deepEqual(((await handleMcpMessage({ jsonrpc: "2.0", id: "p", method: "ping" }, config)) as any).result, {});
  assert.equal(((await handleMcpMessage({ jsonrpc: "2.0", id: 2, method: "nope" }, config)) as any).error.code, -32601);
  assert.equal(((await handleMcpMessage({ id: 3, method: "ping" }, config)) as any).error.code, -32600);
  assert.equal(
    ((await handleMcpMessage({ jsonrpc: "2.0", id: 4, method: "tools/call", params: { name: "x" } }, config)) as any).error.code,
    -32602
  );
  assert.equal(await handleMcpMessage({ jsonrpc: "2.0", id: 5, result: {} }, config), null, "client responses get no reply");

  const batch = await handleMcpBody(
    [{ jsonrpc: "2.0", id: 1, method: "ping" }, { jsonrpc: "2.0", method: "notifications/initialized" }],
    config
  );
  assert.equal(batch.status, 200);
  assert.equal((batch.body as unknown[]).length, 1);
  assert.equal((await handleMcpBody([], config)).status, 400);
  const tooMany = Array.from({ length: 21 }, (_, i) => ({ jsonrpc: "2.0", id: i + 1, method: "ping" }));
  assert.equal((await handleMcpBody(tooMany, config)).status, 400, "batches are capped");

  const list = (await handleMcpMessage({ jsonrpc: "2.0", id: 6, method: "tools/list" }, config)) as any;
  const tools = list.result.tools as any[];
  assert.deepEqual(
    tools.map((t) => t.name),
    ["search_listings", "get_listing", "get_takeover_costs", "get_handover_steps"]
  );
  for (const t of tools) {
    assert.ok(t.name.length <= 64, `${t.name}: name too long`);
    assert.ok(t.title && t.annotations.title === t.title, `${t.name}: title`);
    assert.ok(t.description.length > 50, `${t.name}: description`);
    assert.equal(t.inputSchema.type, "object", `${t.name}: inputSchema`);
    assert.equal(t.outputSchema.type, "object", `${t.name}: outputSchema`);
    assert.equal(t.annotations.readOnlyHint, true, `${t.name}: readOnlyHint`);
    assert.equal(t.annotations.destructiveHint, false, `${t.name}: destructiveHint`);
    assert.equal(t.annotations.openWorldHint, false, `${t.name}: openWorldHint`);
    assert.ok(!/\b(always|never|must)\b.*\b(call|use)\b/i.test(t.description), `${t.name}: no behavioural instructions`);
  }

  // ── Argument parsing ──
  assert.throws(() => parseSearchArgs({ colour: "red" }), /does not take "colour"/);
  assert.throws(() => parseSearchArgs({ min_monthly_rate_chf: 900, max_monthly_rate_chf: 500 }), /larger than/);
  assert.throws(() => parseSearchArgs({ max_monthly_rate_chf: 700, max_purchase_price_chf: 30000 }), /one set per search/);
  assert.throws(() => parseSearchArgs({ sort: "price_asc" }), /Sorting by price needs/);
  assert.throws(() => parseSearchArgs({ offer_type: "direct_purchase", max_monthly_rate_chf: 500 }), /only apply to lease takeovers/);
  assert.throws(() => parseSearchArgs({ fuel: ["wood"] }), /values must be one of/);

  const inferred = parseSearchArgs({ max_monthly_rate_chf: "700", fuel: ["electric"], canton: ["zürich", "AG"], gearbox: "automatic" });
  assert.equal(inferred.query.dealType, "lease_takeover");
  assert.equal(inferred.query.priceMax, 700);
  assert.deepEqual(inferred.query.fuel, ["Elektro"]);
  assert.deepEqual(inferred.query.gearbox, ["Automatik"]);
  assert.deepEqual(inferred.cantons, ["ZH", "AG"]);
  assert.match(inferred.notes[0], /offer_type set to lease_takeover/);

  const kmArgs = parseSearchArgs({ min_remaining_km_allowance: 20000 });
  assert.equal(kmArgs.query.dealType, "lease_takeover", "kilometres left imply a lease takeover");
  assert.equal(kmArgs.minRemainingKm, 20000);
  assert.throws(() => parseSearchArgs({ offer_type: "direct_purchase", min_remaining_km_allowance: 1 }), /only apply to lease takeovers/);

  const purchase = parseSearchArgs({ max_purchase_price_chf: 40000, sort: "price_asc" });
  assert.equal(purchase.query.dealType, "direct_purchase");
  assert.equal(purchase.query.priceMax, 40000);
  assert.equal(purchase.query.sort, "priceAsc");

  const nulls = parseSearchArgs({ brand: null, model: "", page: null });
  assert.equal(nulls.query.model, undefined);
  assert.equal(nulls.page, 1);

  const url = searchPageUrl(inferred.query, { cantons: inferred.cantons });
  assert.match(url, /^https:\/\/www\.buyauto\.ch\/suche\?/);
  assert.match(url, /dealType=lease_takeover/);
  assert.match(url, /canton=ZH&canton=AG/);
  assert.match(url, /via=mcp/);
  assert.ok(!url.includes("utm_"), "no UTM: the assistant's referrer must survive");

  // ── Brand matching and free text ──
  assert.deepEqual(matchBrands("mercedes", LIVE_BRANDS), ["Mercedes", "Mercedes-Benz"]);
  assert.deepEqual(matchBrands("Mercedes-Benz", LIVE_BRANDS), ["Mercedes", "Mercedes-Benz"]);
  assert.deepEqual(matchBrands("vw", LIVE_BRANDS), ["Volkswagen"]);
  assert.deepEqual(matchBrands("skoda", LIVE_BRANDS), ["Škoda"]);
  assert.deepEqual(matchBrands("bmw", LIVE_BRANDS), ["BMW"]);
  assert.deepEqual(matchBrands("Porsche", LIVE_BRANDS), []);
  assert.ok(matchesQuery(TAKEOVER, "bmw x3 xdrive"));
  assert.ok(!matchesQuery(TAKEOVER, "bmw x5"));
  assert.ok(matchesQuery(DIRECT, "skoda enyaq"));

  // ── Ids ──
  assert.equal(listingIdFromInput(TAKEOVER.id), TAKEOVER.id);
  assert.equal(listingIdFromInput(`bmw-x3-${TAKEOVER.id}`), TAKEOVER.id);
  assert.equal(listingIdFromInput(`https://www.buyauto.ch/fahrzeug/bmw-x3-${TAKEOVER.id}?utm_source=x#top`), TAKEOVER.id);
  assert.equal(listingIdFromInput("not-an-id"), null);

  // ── Location ──
  assert.equal(cantonCodeFor("Schlieren, ZH"), "ZH");
  assert.equal(cantonCodeFor("Dietikon, Bezirk Dietikon, Zürich, 8953, Schweiz/Suisse/Svizzera/Svizra"), "ZH");
  assert.equal(cantonCodeFor("Buchs (ZH), Bezirk Dielsdorf, Zürich, 8107, Schweiz/Suisse/Svizzera/Svizra"), "ZH");
  assert.equal(cantonCodeFor("Niederbuchsiten, Bezirk Gäu, Amtei Thal-Gäu, Solothurn, 4626, Schweiz/Suisse/Svizzera/Svizra"), "SO");
  assert.equal(cantonCodeFor("Zug, Schweiz/Suisse/Svizzera/Svizra"), "ZG");
  assert.equal(cantonCodeFor("Lausanne, District de Lausanne, Vaud, 1003, Schweiz/Suisse/Svizzera/Svizra"), "VD");
  assert.equal(cantonCodeFor("Winterthur"), null);
  assert.equal(cantonCodeFor("Winterthur", "ZH"), "ZH");
  assert.equal(placeFor("8494, Bauma, Bezirk Pfäffikon, Zürich, Schweiz/Suisse/Svizzera/Svizra"), "Bauma");
  assert.equal(placeFor("Oberurnen (Glarus Nord), GL"), "Oberurnen (Glarus Nord)");
  assert.equal(placeFor("ZH"), null);

  // ── Descriptions ──
  const cleaned = sanitizeDescription(TAKEOVER.description)!;
  assert.ok(!cleaned.includes("079"), "phone removed");
  assert.ok(!cleaned.includes("@"), "email removed");
  assert.ok(!cleaned.includes("example.com"), "link removed");
  assert.ok(cleaned.includes("45'000 km") && cleaned.includes("2021"), "car facts kept");
  assert.ok(cleaned.includes(DESCRIPTION_REMOVED));
  for (const phone of ["+41 79 123 45 67", "0041 44 123 45 67", "0791234567", "+41 (0)44 123 45 67", "+49 151 12345678"]) {
    assert.ok(!sanitizeDescription(`Tel ${phone} bitte`)!.match(/\d{3}/), `phone not removed: ${phone}`);
  }
  assert.equal(sanitizeDescription("CHF 590 pro Monat, 12 Monate, 2'000 Kaution"), "CHF 590 pro Monat, 12 Monate, 2'000 Kaution");
  assert.equal(sanitizeDescription("Vertragsende 01.01.2028 12 Raten offen"), "Vertragsende 01.01.2028 12 Raten offen");
  assert.equal(sanitizeDescription("Anzahlung CHF 5'000.00 bis 01.02.2026"), "Anzahlung CHF 5'000.00 bis 01.02.2026");
  assert.equal(sanitizeDescription(null), null);

  // ── Listing allow-list ──
  const summary = listingSummary(TAKEOVER);
  assert.equal(summary.monthly_rate_chf, 590);
  assert.equal(summary.remaining_months, 18);
  assert.equal(summary.deposit_chf, 0);
  assert.equal(summary.purchase_price_chf, null);
  assert.equal(summary.seller_type, "private");
  assert.equal(summary.garage_name, null);
  assert.equal(summary.featured, true);
  assert.equal(summary.location, "Schlieren, ZH");
  assert.match(summary.url, /^https:\/\/www\.buyauto\.ch\/fahrzeug\/bmw-x3-11111111-1111-4111-8111-111111111111\?via=mcp$/);
  const serialized = JSON.stringify(listingDetail(TAKEOVER));
  for (const secret of ["Muster P.", "avatar", "WBA00000000000000", "price_plan", "standard", "user_id"]) {
    assert.ok(!serialized.includes(secret), `private field leaked: ${secret}`);
  }

  const garage = listingSummary(GARAGE_TAKEOVER);
  assert.equal(garage.seller_type, "garage");
  assert.equal(garage.garage_name, "Garage Muster AG");
  assert.equal(garage.canton_code, "ZH");
  assert.equal(garage.location, "Dietikon, ZH");
  assert.equal(garage.deposit_chf, 2000);
  assert.equal(garage.remaining_km_allowance, 30000, "Restkilometer fall back to the takeover offer");

  const direct = listingSummary(DIRECT);
  assert.equal(direct.offer_type, "direct_purchase");
  assert.equal(direct.monthly_rate_chf, null);
  assert.equal(direct.remaining_months, null);
  assert.equal(direct.deposit_chf, null);
  assert.equal(direct.purchase_price_chf, 31900);

  const unknownMonths = listingSummary(listing({ remainingMonths: 0, contractEnded: false }));
  assert.equal(unknownMonths.remaining_months, null, "0 months on a live offer means unknown");

  // ── Tools end to end (fixtures) ──
  const all = await call(config, "search_listings", {});
  assertMatchesSchema(config, "search_listings", all);
  assert.equal((all.structuredContent as any).total, 3);

  const zh = await call(config, "search_listings", { canton: ["ZH"], offer_type: "lease_takeover" });
  assertMatchesSchema(config, "search_listings", zh);
  assert.deepEqual(
    (zh.structuredContent as any).results.map((r: any) => r.id),
    [TAKEOVER.id, GARAGE_TAKEOVER.id],
    "canton filter reads the location text when canton_code is empty"
  );

  const kmLeft = await call(config, "search_listings", { min_remaining_km_allowance: 25000 });
  assertMatchesSchema(config, "search_listings", kmLeft);
  assert.deepEqual(
    (kmLeft.structuredContent as any).results.map((r: any) => r.id),
    [GARAGE_TAKEOVER.id],
    "only listings that state enough kilometres left (incl. from the takeover offer)"
  );

  const mercedes = await call(config, "search_listings", { brand: "mercedes-benz" });
  assert.deepEqual(data.queries[data.queries.length - 1].brands, ["Mercedes", "Mercedes-Benz"]);
  assert.equal((mercedes.structuredContent as any).results[0].id, GARAGE_TAKEOVER.id);

  const porsche = await call(config, "search_listings", { brand: "Porsche" });
  assertMatchesSchema(config, "search_listings", porsche);
  assert.equal((porsche.structuredContent as any).total, 0);
  assert.match((porsche.structuredContent as any).notes[0], /Brands with listings: BMW/);

  const bad = await call(config, "search_listings", { max_monthly_rate_chf: -5 });
  assert.equal(bad.isError, true);
  assert.match(bad.content[0].text, /between 0 and/);

  const detail = await call(config, "get_listing", { id: `https://www.buyauto.ch/fahrzeug/mercedes-glc-${GARAGE_TAKEOVER.id}` });
  assertMatchesSchema(config, "get_listing", detail);
  const d = (detail.structuredContent as any).listing;
  assert.equal(d.garage_page_url, "https://www.buyauto.ch/garage-muster?via=mcp");
  assert.equal(d.contact.url, d.url);

  const missing = await call(config, "get_listing", { id: "99999999-9999-4999-8999-999999999999" });
  assert.equal(missing.isError, true);
  assert.match(missing.content[0].text, /No live listing/);
  assert.equal((await call(config, "get_listing", { id: "abc" })).isError, true);
  assert.equal((await call(config, "get_listing", {})).isError, true);

  const costs = await call(config, "get_takeover_costs", {});
  assertMatchesSchema(config, "get_takeover_costs", costs);
  const allLenders = (costs.structuredContent as any).leasing_companies;
  assert.equal(allLenders.length, 8);
  const cembra = allLenders.find((l: any) => l.key === "cembra");
  assert.equal(cembra.fee_published, true);
  assert.ok(cembra.takeover_fee_excl_vat_chf > 0 && cembra.source.url.startsWith("https://"));
  assert.ok((costs.structuredContent as any).cantonal_fee_ranges.vehicle_registration_chf.min.chf > 0);

  const vw = await call(config, "get_takeover_costs", { brand: "VW", canton: "zürich" });
  assertMatchesSchema(config, "get_takeover_costs", vw);
  const vwOut = vw.structuredContent as any;
  assert.equal(vwOut.brand_match.leasing_company_key, "amag");
  assert.equal(vwOut.leasing_companies.length, 1);
  assert.ok(vwOut.leasing_companies[0].details.length >= 3, "AMAG section facts included");
  assert.equal(vwOut.cantonal_fees[0].canton_code, "ZH");
  assert.equal(vwOut.cantonal_fee_ranges, null);

  const tesla = await call(config, "get_takeover_costs", { brand: "Tesla" });
  assert.equal((tesla.structuredContent as any).brand_match.leasing_company_key, null);
  assert.equal((tesla.structuredContent as any).leasing_companies.length, 8);

  const steps = await call(config, "get_handover_steps", {});
  assertMatchesSchema(config, "get_handover_steps", steps);
  assert.equal((steps.structuredContent as any).steps.length, 6);
  assert.match((steps.structuredContent as any).create_listing_url, /\/inserat-erstellen\?/);
  assert.equal((await call(config, "get_handover_steps", { x: 1 })).isError, true);

  // Database failure surfaces as an isError result, not a protocol error.
  const failing: ListingDataSource = {
    ...data,
    search: async () => {
      throw new Error("boom");
    },
  };
  const down = await call(serverWith(failing), "search_listings", {});
  assert.equal(down.isError, true);
  assert.match(down.content[0].text, /temporary problem/);

  console.log("test-mcp: all checks passed");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
