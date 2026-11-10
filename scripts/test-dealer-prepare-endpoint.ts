/**
 * Runs the real /api/dealer/prepare handler: `npx tsx scripts/test-dealer-prepare-endpoint.ts`.
 * Exits non-zero on the first failed assertion.
 *
 * The Supabase session client and the Stripe API calls are replaced in
 * memory, so this covers what the endpoint decides: who may start a checkout,
 * when a code is accepted, when a free period is granted and what is sent to
 * Stripe. All ids, codes and amounts are made up.
 */
import assert from "node:assert/strict";
import Module from "node:module";

process.env.STRIPE_SECRET_KEY = "test-key-not-real";

type Row = Record<string, any>;

const GARAGE_ID = "11111111-1111-4111-8111-111111111111";
const META = (planCode: string) => ({
  kind: "dealer_plan",
  dealer_id: GARAGE_ID,
  plan_code: planCode,
  plan_id: `plan-${planCode}`,
  user_id: "u1",
});

const state = {
  user: { id: "u1" } as { id: string } | null,
  garages: [{ id: GARAGE_ID, owner_user_id: "u1" }] as Row[],
  plans: ["starter", "growth", "pro"].map((code) => ({
    id: `plan-${code}`,
    code,
    active: true,
    stripe_price_id: `price_${code}`,
    monthly_price_chf: 1,
  })) as Row[],
  subscriptions: [] as Row[],
};

function table(rows: Row[]) {
  const filters: Array<(r: Row) => boolean> = [];
  const api: any = {
    select: () => api,
    eq: (column: string, value: any) => (filters.push((r) => r[column] === value), api),
    maybeSingle: async () => ({ data: rows.find((r) => filters.every((f) => f(r))) ?? null, error: null }),
  };
  return api;
}

const fakeSupabase = {
  auth: { getSession: async () => ({ data: { session: state.user ? { user: state.user } : null }, error: null }) },
  from: (name: string) =>
    table(name === "garages" ? state.garages : name === "dealer_plans" ? state.plans : state.subscriptions),
};

// The endpoint builds its Supabase client from the request cookies. Hand it
// the in-memory one instead, before the handler module is loaded.
const originalLoad = (Module as any)._load;
(Module as any)._load = function (request: string, ...rest: any[]) {
  if (request === "@supabase/auth-helpers-nextjs") return { createPagesServerClient: () => fakeSupabase };
  return originalLoad.call(this, request, ...rest);
};

// What "Stripe" knows.
const promotionCodes: Record<string, any[]> = {
  PARTNER24: [
    {
      id: "promo_partner",
      active: true,
      customer: null,
      metadata: {},
      restrictions: { minimum_amount: null, minimum_amount_currency: null },
      coupon: { valid: true, metadata: { trial_days: "45" }, applies_to: { products: ["prod_growth"] } },
    },
  ],
  NOTRIAL: [
    { id: "promo_notrial", active: true, customer: null, metadata: {}, restrictions: {}, coupon: { valid: true, metadata: {} } },
  ],
  BROKEN: [
    {
      id: "promo_broken",
      active: true,
      customer: null,
      metadata: { trial_days: "sechs Wochen" },
      restrictions: {},
      coupon: { valid: true, metadata: {} },
    },
  ],
  FIRSTONLY: [
    { id: "promo_first", active: true, customer: null, metadata: {}, restrictions: {}, coupon: { valid: true, metadata: {} } },
  ],
};
/** Status of the subscription on record as Stripe reports it; "throw" simulates an outage. */
const subscriptionStatus: Record<string, string> = { sub_1: "active" };
/** Statuses Stripe's search returns for the garage; "throw" simulates a failed search. */
let searchResult: string[] | "throw" = [];

const calls = { list: [] as any[], create: [] as any[], retrieve: [] as string[], search: [] as any[] };

async function main() {
  const { stripe } = await import("../src/lib/stripe-server");
  const handler = (await import("../src/pages/api/dealer/prepare")).default;

  (stripe.prices as any).retrieve = async (id: string) => ({
    id,
    currency: "chf",
    unit_amount: id === "price_growth" ? 50000 : 20000,
    product: id.replace("price_", "prod_"),
    recurring: { interval: "month", usage_type: "licensed" },
  });
  (stripe.promotionCodes as any).list = async (params: any) => {
    calls.list.push(params);
    return { data: promotionCodes[params.code] ?? [] };
  };
  (stripe.subscriptions as any).retrieve = async (id: string) => {
    calls.retrieve.push(id);
    const status = subscriptionStatus[id];
    if (status === "throw") throw new Error("Stripe unreachable");
    if (!status) throw Object.assign(new Error("No such subscription"), { code: "resource_missing" });
    return { id, status };
  };
  (stripe.subscriptions as any).search = async (params: any) => {
    calls.search.push(params);
    if (searchResult === "throw") throw new Error("search unavailable");
    return { data: searchResult.map((status, i) => ({ id: `sub_found_${i}`, status })) };
  };
  (stripe.checkout.sessions as any).create = async (params: any) => {
    calls.create.push(params);
    if (params.discounts?.[0]?.promotion_code === "promo_first") {
      throw Object.assign(new Error("This promotion code cannot be redeemed."), {
        type: "StripeInvalidRequestError",
        param: "discounts[0][promotion_code]",
      });
    }
    if (params.line_items[0].price === "price_pro" && !params.discounts) {
      throw new Error("internal detail that must not reach the browser");
    }
    return { id: "cs_test", url: "https://checkout.example.test/pay/cs_test" };
  };

  // The handler logs what it refuses. Keep the test output to the result line.
  const quiet = { error: console.error, warn: console.warn };
  console.error = () => {};
  console.warn = () => {};

  async function call(body: any, method = "POST") {
    const out: { status: number; body: any } = { status: 0, body: undefined };
    const res: any = {
      setHeader() {},
      status(code: number) {
        out.status = code;
        return res;
      },
      json(payload: any) {
        out.body = payload;
        return res;
      },
    };
    const req: any = { method, body, headers: { host: "www.example.test", "x-forwarded-proto": "https,http" } };
    await handler(req, res);
    return out;
  }
  const lastCreate = () => calls.create[calls.create.length - 1];
  const row = (overrides: Row = {}) => ({
    dealer_id: GARAGE_ID,
    plan_id: "plan-growth",
    status: "active",
    stripe_subscription_id: "sub_1",
    ended_at: null,
    ...overrides,
  });

  // --- Who may call it -----------------------------------------------------------
  assert.equal((await call({}, "GET")).status, 405);
  state.user = null;
  let r = await call({ plan_code: "growth" });
  assert.deepEqual([r.status, r.body.ok], [401, false]);
  assert.match(r.body.error, /melde dich an/);
  state.user = { id: "u1" };

  r = await call({ plan_code: "enterprise" });
  assert.equal(r.status, 400);

  // An account switched to "garage" by hand has no garage row.
  state.garages = [];
  r = await call({ plan_code: "growth" });
  assert.equal(r.status, 400);
  assert.match(r.body.error, /keine Garage/);
  state.garages = [{ id: GARAGE_ID, owner_user_id: "u1" }];

  // --- Without a code: exactly the plain checkout ----------------------------------
  r = await call({ plan_code: "starter" });
  assert.deepEqual([r.status, r.body], [200, { ok: true, url: "https://checkout.example.test/pay/cs_test" }]);
  assert.deepEqual(lastCreate(), {
    mode: "subscription",
    payment_method_types: ["card"],
    line_items: [{ price: "price_starter", quantity: 1 }],
    success_url: "https://www.example.test/dashboard/garage?payment_success=true",
    cancel_url: "https://www.example.test/billing/cancel",
    subscription_data: { metadata: META("starter") },
    metadata: META("starter"),
  });
  assert.equal(calls.list.length, 0, "no promotion-code lookup without a code");
  // Stripe is asked whether this garage already has a subscription, by the metadata set above.
  assert.equal(calls.search.length, 1);
  assert.equal(calls.search[0].query, `metadata['dealer_id']:'${GARAGE_ID}' AND metadata['kind']:'dealer_plan'`);
  assert.equal(calls.retrieve.length, 0, "nothing on record, nothing to confirm");

  // --- With a code -----------------------------------------------------------------
  // Typed in lower case with spaces, on the plan the code is for: discount and free period.
  r = await call({ plan_code: "growth", promo_code: "  partner24 " });
  assert.equal(r.status, 200);
  assert.deepEqual(calls.list[0], { code: "PARTNER24", active: true, limit: 10, expand: ["data.coupon.applies_to"] });
  assert.deepEqual(lastCreate().discounts, [{ promotion_code: "promo_partner" }]);
  assert.equal(lastCreate().subscription_data.trial_period_days, 45);
  assert.equal(lastCreate().subscription_data.metadata.promo_code, "PARTNER24");
  assert.equal(lastCreate().metadata.promo_code, "PARTNER24");

  const sessionsBefore = calls.create.length;
  // On another plan.
  r = await call({ plan_code: "starter", promo_code: "PARTNER24" });
  assert.deepEqual([r.status, r.body.field], [400, "promo_code"]);
  assert.match(r.body.error, /gilt nicht für das gewählte Paket/);
  // Unknown, malformed, broken trial metadata.
  r = await call({ plan_code: "growth", promo_code: "NOPE123" });
  assert.deepEqual([r.status, r.body.field], [400, "promo_code"]);
  assert.match(r.body.error, /ungültig oder abgelaufen/);
  r = await call({ plan_code: "growth", promo_code: "x'; drop--" });
  assert.deepEqual([r.status, r.body.field], [400, "promo_code"]);
  r = await call({ plan_code: "growth", promo_code: "BROKEN" });
  assert.deepEqual([r.status, r.body.field], [400, "promo_code"]);
  assert.match(r.body.error, /lässt sich gerade nicht einlösen/);
  assert.equal(calls.create.length, sessionsBefore, "no checkout session for a refused code");
  // Refused by Stripe only when the session is created.
  r = await call({ plan_code: "growth", promo_code: "FIRSTONLY" });
  assert.deepEqual([r.status, r.body.field], [400, "promo_code"]);
  assert.match(r.body.error, /ungültig oder abgelaufen/);
  // A code without a free period: discount only.
  r = await call({ plan_code: "starter", promo_code: "NOTRIAL" });
  assert.equal(r.status, 200);
  assert.equal("trial_period_days" in lastCreate().subscription_data, false);
  assert.deepEqual(lastCreate().discounts, [{ promotion_code: "promo_notrial" }]);
  // A code that is not text is treated as no code.
  r = await call({ plan_code: "starter", promo_code: 12345 });
  assert.equal(r.status, 200);
  assert.equal(lastCreate().discounts, undefined);

  // --- Where Stripe sends the garage afterwards -------------------------------------
  await call({ plan_code: "starter", success_path: "/\\evil.test", cancel_path: "/\t/evil.test" });
  assert.equal(lastCreate().success_url, "https://www.example.test/dashboard/garage?payment_success=true");
  assert.equal(lastCreate().cancel_url, "https://www.example.test/billing/cancel");
  await call({ plan_code: "starter", success_path: "//evil.test", cancel_path: "https://evil.test/x" });
  assert.equal(lastCreate().success_url, "https://www.example.test/dashboard/garage?payment_success=true");
  assert.equal(lastCreate().cancel_url, "https://www.example.test/billing/cancel");
  await call({
    plan_code: "starter",
    success_path: "/dashboard/garage?tab=subscription",
    cancel_path: "/garage-plan?redirect=%2Fdashboard%2Fgarage%3Ftab%3Dsubscription",
  });
  assert.equal(lastCreate().success_url, "https://www.example.test/dashboard/garage?tab=subscription&payment_success=true");
  assert.equal(
    lastCreate().cancel_url,
    "https://www.example.test/garage-plan?redirect=%2Fdashboard%2Fgarage%3Ftab%3Dsubscription"
  );

  // --- One subscription per garage ---------------------------------------------------
  let sessions = calls.create.length;

  // On record and confirmed by Stripe as running: refused, with or without a code.
  for (const stripeStatus of ["trialing", "active", "paused"]) {
    state.subscriptions = [row()];
    subscriptionStatus.sub_1 = stripeStatus;
    r = await call({ plan_code: "pro" });
    assert.deepEqual([r.status, r.body.code], [409, "already_subscribed"], stripeStatus);
    assert.match(r.body.error, /läuft bereits ein Paket/);
    r = await call({ plan_code: "growth", promo_code: "PARTNER24" });
    assert.equal(r.status, 409, stripeStatus);
  }
  // Overdue: refused too, but the garage is told what is actually wrong.
  for (const stripeStatus of ["past_due", "unpaid"]) {
    state.subscriptions = [row({ status: "past_due" })];
    subscriptionStatus.sub_1 = stripeStatus;
    r = await call({ plan_code: "growth" });
    assert.deepEqual([r.status, r.body.code], [409, "payment_overdue"], stripeStatus);
    assert.match(r.body.error, /letzte Zahlung .* fehlgeschlagen/);
  }
  assert.equal(calls.create.length, sessions);

  // On record as running, but Stripe says it is over (the "cancelled" event never
  // arrived): the garage is not locked out. It had a subscription, so no second free period.
  const searchesBefore = calls.search.length;
  for (const stripeStatus of ["canceled", "incomplete_expired", undefined]) {
    state.subscriptions = [row()];
    if (stripeStatus) subscriptionStatus.sub_1 = stripeStatus;
    else delete subscriptionStatus.sub_1;
    r = await call({ plan_code: "growth", promo_code: "PARTNER24" });
    assert.equal(r.status, 200, String(stripeStatus));
    assert.deepEqual(lastCreate().discounts, [{ promotion_code: "promo_partner" }]);
    assert.equal("trial_period_days" in lastCreate().subscription_data, false);
  }
  assert.equal(calls.search.length, searchesBefore + 3, "the search is the second opinion once the row is cleared");

  // Stripe cannot be asked about the subscription on record: no checkout.
  state.subscriptions = [row()];
  subscriptionStatus.sub_1 = "throw";
  sessions = calls.create.length;
  r = await call({ plan_code: "growth" });
  assert.equal(r.status, 500);
  assert.match(r.body.error, /konnte nicht vorbereitet werden/);
  assert.equal(calls.create.length, sessions);
  subscriptionStatus.sub_1 = "active";

  // Nothing on record (the webhook did not deliver), but Stripe knows a subscription.
  state.subscriptions = [];
  searchResult = ["incomplete_expired", "trialing"];
  r = await call({ plan_code: "growth", promo_code: "PARTNER24" });
  assert.deepEqual([r.status, r.body.code], [409, "already_subscribed"]);
  searchResult = ["past_due"];
  r = await call({ plan_code: "growth" });
  assert.deepEqual([r.status, r.body.code], [409, "payment_overdue"]);
  assert.equal(calls.create.length, sessions);
  // An earlier one that has ended: welcome back, discount without a second free period.
  searchResult = ["canceled"];
  r = await call({ plan_code: "growth", promo_code: "PARTNER24" });
  assert.equal(r.status, 200);
  assert.equal("trial_period_days" in lastCreate().subscription_data, false);
  // Attempts that never started do not count as a subscription.
  searchResult = ["incomplete", "incomplete_expired"];
  r = await call({ plan_code: "growth", promo_code: "PARTNER24" });
  assert.equal(r.status, 200);
  assert.equal(lastCreate().subscription_data.trial_period_days, 45);
  // A failed search does not stop a checkout: the row check has already passed.
  searchResult = "throw";
  r = await call({ plan_code: "growth", promo_code: "PARTNER24" });
  assert.equal(r.status, 200);
  assert.equal(lastCreate().subscription_data.trial_period_days, 45);
  searchResult = [];

  // An ended row: may subscribe again, no Stripe lookup of the old subscription needed.
  const retrievesBefore = calls.retrieve.length;
  state.subscriptions = [row({ status: "canceled", ended_at: "2030-01-01T00:00:00Z" })];
  r = await call({ plan_code: "growth", promo_code: "PARTNER24" });
  assert.equal(r.status, 200);
  assert.equal("trial_period_days" in lastCreate().subscription_data, false);
  // A row set by hand (no Stripe subscription): checkout and free period as for a new garage.
  state.subscriptions = [row({ stripe_subscription_id: null, plan_id: "plan-starter" })];
  r = await call({ plan_code: "growth", promo_code: "PARTNER24" });
  assert.equal(r.status, 200);
  assert.equal(lastCreate().subscription_data.trial_period_days, 45);
  assert.equal(calls.retrieve.length, retrievesBefore);
  state.subscriptions = [];

  // --- An unexpected failure ----------------------------------------------------------
  r = await call({ plan_code: "pro" });
  assert.equal(r.status, 500);
  assert.match(r.body.error, /konnte nicht vorbereitet werden/);
  assert.equal(JSON.stringify(r.body).includes("internal detail"), false);

  console.error = quiet.error;
  console.warn = quiet.warn;
  console.log("test-dealer-prepare-endpoint: all checks passed");
}

main().catch((error) => {
  process.stderr.write(String(error?.stack ?? error) + "\n");
  process.exit(1);
});
