/**
 * Runs the real /api/billing/webhook handler: `npx tsx scripts/test-billing-webhook.ts`.
 * Exits non-zero on the first failed assertion.
 *
 * Every request is a correctly signed Stripe event, so the signature check,
 * the event routing, the garage subscription sync and the response codes run
 * as deployed. Stripe's API and the database are replaced in memory. All ids,
 * plans and numbers are made up.
 */
import assert from "node:assert/strict";
import { Readable } from "node:stream";

const WEBHOOK_SECRET = "local-test-webhook-secret";
process.env.STRIPE_SECRET_KEY = "test-key-not-real";
process.env.STRIPE_WEBHOOK_SECRET = WEBHOOK_SECRET;
process.env.NEXT_PUBLIC_SUPABASE_URL = "http://127.0.0.1:1";
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "not-a-real-key";
process.env.SUPABASE_SERVICE_ROLE_KEY = "not-a-real-key";

type Row = Record<string, any>;

const db: Record<string, Row[]> = {
  garages: [{ id: "g1", plan: "no_plan", listing_limit: 0 }],
  dealer_plans: [
    { id: "plan-b", code: "planb", listing_limit: 11 },
    { id: "plan-c", code: "planc", listing_limit: 22 },
  ],
  dealer_subscriptions: [],
  dealer_plan_changes: [],
  listings: [
    { id: "l-paid", payment_status: "paid", stripe_payment_intent_id: "pi_1" },
    { id: "l-refunded", payment_status: "refunded", stripe_payment_intent_id: "pi_5" },
    { id: "l-open", payment_status: "requires_payment", stripe_payment_intent_id: "pi_2" },
    { id: "l-other", payment_status: "requires_payment", stripe_payment_intent_id: "pi_newer" },
    { id: "l-null", payment_status: null, stripe_payment_intent_id: "pi_4" },
  ],
};
/** Name of a table whose next queries fail, to simulate a database problem. */
let failingTable: string | null = null;

/** The one `.or()` expression the handler uses. */
function parseOr(expression: string) {
  assert.equal(expression, "payment_status.is.null,payment_status.not.in.(paid,refunded)");
  return (r: Row) => r.payment_status === null || !["paid", "refunded"].includes(r.payment_status);
}

/** A small stand-in for the supabase-js query builder (only what the handler calls). */
function query(tableName: string) {
  const filters: Array<(r: Row) => boolean> = [];
  let operation: "select" | "update" | "insert" | "upsert" = "select";
  let payload: any = null;
  let conflictColumn: string | null = null;

  const run = (single: boolean) => {
    if (failingTable === tableName) return { data: null, error: { message: `simulated failure on ${tableName}` } };
    const rows = db[tableName];
    if (operation === "select") {
      const hits = rows.filter((r) => filters.every((f) => f(r))).map((r) => ({ ...r }));
      return { data: single ? (hits[0] ?? null) : hits, error: null };
    }
    if (operation === "update") {
      rows.filter((r) => filters.every((f) => f(r))).forEach((r) => Object.assign(r, payload));
      return { data: null, error: null };
    }
    if (operation === "insert") {
      rows.push({ ...payload });
      return { data: null, error: null };
    }
    const existing = rows.find((r) => r[conflictColumn!] === payload[conflictColumn!]);
    if (existing) Object.assign(existing, payload);
    else rows.push({ ...payload });
    return { data: null, error: null };
  };

  const api: any = {
    select: () => api,
    eq: (column: string, value: any) => (filters.push((r) => r[column] === value), api),
    or: (expression: string) => (filters.push(parseOr(expression)), api),
    update: (values: any) => ((operation = "update"), (payload = values), api),
    insert: (values: any) => ((operation = "insert"), (payload = values), api),
    upsert: (values: any, options: any) => (
      (operation = "upsert"), (payload = values), (conflictColumn = options.onConflict), api
    ),
    maybeSingle: async () => run(true),
    single: async () => run(true),
    then: (resolve: any, reject: any) => Promise.resolve(run(false)).then(resolve, reject),
  };
  return api;
}

const DAY = 86400;
const T0 = 1_800_000_000;
const iso = (seconds: number) => new Date(seconds * 1000).toISOString();
const META_B = { kind: "dealer_plan", dealer_id: "g1", plan_code: "planb", plan_id: "plan-b" };
const META_C = { kind: "dealer_plan", dealer_id: "g1", plan_code: "planc", plan_id: "plan-c" };

/** What "Stripe" answers for `subscriptions.retrieve`. */
const stripeSubscriptions: Record<string, any> = {};

async function main() {
  const { stripe } = await import("../src/lib/stripe-server");
  const { adminService } = await import("../src/services/adminService");
  const handler = (await import("../src/pages/api/billing/webhook")).default;

  (adminService as any).getSupabaseAdminClient = () => ({ from: (name: string) => query(name) });
  (stripe.subscriptions as any).retrieve = async (id: string) => {
    const subscription = stripeSubscriptions[id];
    if (!subscription) throw Object.assign(new Error("No such subscription"), { code: "resource_missing" });
    return subscription;
  };

  // The handler logs what it ignores and what fails. Keep the test output to the result line.
  const quiet = { error: console.error, warn: console.warn, log: console.log };
  console.error = () => {};
  console.warn = () => {};
  console.log = () => {};

  let deliveries = 0;
  async function deliver(type: string, object: any, options: { signed?: boolean; withoutSecret?: boolean } = {}) {
    const payload = JSON.stringify({ id: `evt_${++deliveries}`, object: "event", type, data: { object } });
    const headers: Record<string, string> = {};
    if (options.signed !== false) {
      headers["stripe-signature"] = stripe.webhooks.generateTestHeaderString({ payload, secret: WEBHOOK_SECRET });
    }
    const req: any = Readable.from([Buffer.from(payload)]);
    req.method = "POST";
    req.headers = headers;

    const out: { status: number; body: any } = { status: 0, body: undefined };
    const res: any = {
      setHeader() {},
      status(code: number) {
        out.status = code;
        return res;
      },
      json(body: any) {
        out.body = body;
        return res;
      },
      send(body: any) {
        out.body = body;
        return res;
      },
      end(body: any) {
        out.body = body;
        return res;
      },
    };

    if (options.withoutSecret) delete process.env.STRIPE_WEBHOOK_SECRET;
    try {
      await handler(req, res);
    } finally {
      process.env.STRIPE_WEBHOOK_SECRET = WEBHOOK_SECRET;
    }
    return out;
  }

  const row = () => db.dealer_subscriptions.find((r) => r.dealer_id === "g1");
  const garage = () => db.garages[0];
  const listing = (id: string) => db.listings.find((l) => l.id === id)!;

  // --- Secret and signature ------------------------------------------------------------
  // Without the secret the event is refused with a 5xx, so Stripe keeps it and retries.
  let r = await deliver("invoice.paid", { subscription: "sub_1" }, { withoutSecret: true });
  assert.equal(r.status, 500);
  r = await deliver("invoice.paid", { subscription: "sub_1" }, { signed: false });
  assert.equal(r.status, 400);
  assert.equal(db.dealer_subscriptions.length, 0);

  // --- A garage starts a trial: the events arrive with the checkout event last ------------
  stripeSubscriptions.sub_1 = {
    id: "sub_1",
    status: "trialing",
    metadata: META_B,
    customer: "cus_1",
    current_period_start: T0,
    current_period_end: T0 + 45 * DAY,
    cancel_at_period_end: false,
    cancel_at: null,
    canceled_at: null,
    ended_at: null,
  };
  // The payload still says "incomplete": only its id is used.
  r = await deliver("customer.subscription.updated", { id: "sub_1", metadata: META_B, status: "incomplete" });
  assert.deepEqual([r.status, r.body], [200, { received: true }]);
  r = await deliver("invoice.paid", { id: "in_1", subscription: "sub_1", amount_paid: 0 });
  assert.equal(r.status, 200);
  r = await deliver("checkout.session.completed", {
    id: "cs_1",
    mode: "subscription",
    metadata: META_B,
    subscription: "sub_1",
    customer: "cus_1",
    payment_status: "no_payment_required",
  });
  assert.equal(r.status, 200);
  assert.equal(row()?.status, "active");
  assert.equal(row()?.stripe_subscription_id, "sub_1");
  assert.equal(row()?.stripe_customer_id, "cus_1");
  assert.equal(row()?.plan_id, "plan-b");
  assert.equal(row()?.current_period_end, iso(T0 + 45 * DAY));
  assert.deepEqual([garage().plan, garage().listing_limit], ["planb", 11]);
  // Three events, one entry in the plan-change log.
  assert.equal(db.dealer_plan_changes.length, 1);
  assert.deepEqual(
    [db.dealer_plan_changes[0].from_plan_id, db.dealer_plan_changes[0].to_plan_id],
    [null, "plan-b"]
  );

  // --- Another checkout that was never paid must not touch the garage ------------------------
  stripeSubscriptions.sub_x = { ...stripeSubscriptions.sub_1, id: "sub_x", status: "incomplete_expired", metadata: META_C };
  r = await deliver("customer.subscription.updated", { id: "sub_x", metadata: META_C });
  assert.equal(r.status, 200);
  r = await deliver("invoice.payment_failed", { id: "in_x", subscription: "sub_x" });
  assert.equal(r.status, 200);
  assert.equal(row()?.stripe_subscription_id, "sub_1");
  assert.equal(row()?.status, "active");
  assert.equal(garage().plan, "planb");

  // --- The trial ends, the charge fails, then goes through -----------------------------------
  stripeSubscriptions.sub_1 = {
    ...stripeSubscriptions.sub_1,
    status: "past_due",
    current_period_start: T0 + 45 * DAY,
    current_period_end: T0 + 75 * DAY,
  };
  r = await deliver("invoice.payment_failed", { id: "in_2", subscription: "sub_1" });
  assert.equal(r.status, 200);
  assert.equal(row()?.status, "past_due");
  stripeSubscriptions.sub_1 = { ...stripeSubscriptions.sub_1, status: "active" };
  r = await deliver("invoice.paid", { id: "in_2", subscription: "sub_1" });
  assert.equal(row()?.status, "active");
  // A stale "past_due" snapshot delivered afterwards must not lock the garage out again.
  r = await deliver("customer.subscription.updated", { id: "sub_1", metadata: META_B, status: "past_due" });
  assert.equal(r.status, 200);
  assert.equal(row()?.status, "active");
  assert.equal(db.dealer_plan_changes.length, 1);

  // --- Newer API versions carry the subscription id under invoice.parent --------------------
  r = await deliver("invoice.paid", { id: "in_3", parent: { subscription_details: { subscription: "sub_1" } } });
  assert.equal(r.status, 200);

  // --- A database failure fails the delivery (Stripe retries), the retry succeeds -----------
  failingTable = "dealer_subscriptions";
  r = await deliver("customer.subscription.updated", { id: "sub_1", metadata: META_B });
  assert.deepEqual([r.status, r.body], [500, { received: false, retry: true }]);
  failingTable = "garages";
  r = await deliver("invoice.paid", { id: "in_4", subscription: "sub_1" });
  assert.equal(r.status, 500);
  failingTable = null;
  r = await deliver("invoice.paid", { id: "in_4", subscription: "sub_1" });
  assert.deepEqual([r.status, r.body], [200, { received: true }]);

  // --- Things that are not ours: acknowledged, nothing written --------------------------------
  r = await deliver("invoice.paid", { id: "in_5", subscription: "sub_unknown" });
  assert.equal(r.status, 200);
  r = await deliver("customer.subscription.deleted", { id: "sub_foreign", metadata: { kind: "something_else" } });
  assert.equal(r.status, 200);
  r = await deliver("invoice.paid", { id: "in_6" }); // a one-off invoice
  assert.equal(r.status, 200);
  r = await deliver("checkout.session.completed", { id: "cs_x", metadata: META_B, subscription: null });
  assert.equal(r.status, 200);
  r = await deliver("charge.succeeded", { id: "ch_1" });
  assert.equal(r.status, 200);
  assert.equal(row()?.stripe_subscription_id, "sub_1");

  // --- The subscription ends --------------------------------------------------------------------
  stripeSubscriptions.sub_1 = {
    ...stripeSubscriptions.sub_1,
    status: "canceled",
    canceled_at: T0 + 60 * DAY,
    ended_at: T0 + 60 * DAY,
  };
  r = await deliver("customer.subscription.deleted", { id: "sub_1", metadata: META_B });
  assert.equal(r.status, 200);
  assert.equal(row()?.status, "canceled");
  assert.equal(row()?.ended_at, iso(T0 + 60 * DAY));
  assert.equal(row()?.grace_ends_at, iso(T0 + 65 * DAY));

  // --- The garage subscribes again, on another plan ----------------------------------------------
  stripeSubscriptions.sub_2 = {
    id: "sub_2",
    status: "active",
    metadata: META_C,
    customer: "cus_2",
    current_period_start: T0 + 70 * DAY,
    current_period_end: T0 + 100 * DAY,
    cancel_at_period_end: false,
    cancel_at: null,
    canceled_at: null,
    ended_at: null,
  };
  r = await deliver("checkout.session.completed", {
    id: "cs_2",
    mode: "subscription",
    metadata: META_C,
    subscription: "sub_2",
    customer: "cus_2",
  });
  assert.equal(r.status, 200);
  assert.equal(row()?.stripe_subscription_id, "sub_2");
  assert.equal(row()?.status, "active");
  assert.equal(row()?.ended_at, null);
  assert.equal(row()?.grace_ends_at, null);
  assert.deepEqual([garage().plan, garage().listing_limit], ["planc", 22]);
  assert.equal(db.dealer_plan_changes.length, 2);
  assert.deepEqual(
    [db.dealer_plan_changes[1].from_plan_id, db.dealer_plan_changes[1].to_plan_id],
    ["plan-b", "plan-c"]
  );
  // A late event of the old subscription changes nothing.
  r = await deliver("customer.subscription.deleted", { id: "sub_1", metadata: META_B });
  assert.equal(r.status, 200);
  assert.equal(row()?.stripe_subscription_id, "sub_2");
  assert.equal(row()?.status, "active");

  // --- Private listings: a failed attempt never undoes a payment ---------------------------------
  // The failed first attempt of an intent that later succeeded, delivered late.
  r = await deliver("payment_intent.payment_failed", { id: "pi_1", metadata: { listing_id: "l-paid" } });
  assert.equal(r.status, 200);
  assert.equal(listing("l-paid").payment_status, "paid");
  r = await deliver("payment_intent.payment_failed", { id: "pi_5", metadata: { listing_id: "l-refunded" } });
  assert.equal(listing("l-refunded").payment_status, "refunded");
  // An intent the listing no longer uses.
  r = await deliver("payment_intent.payment_failed", { id: "pi_old", metadata: { listing_id: "l-other" } });
  assert.equal(listing("l-other").payment_status, "requires_payment");
  // The current intent of an unpaid listing is still recorded as failed.
  r = await deliver("payment_intent.payment_failed", { id: "pi_2", metadata: { listing_id: "l-open" } });
  assert.equal(listing("l-open").payment_status, "payment_failed");
  r = await deliver("payment_intent.payment_failed", { id: "pi_4", metadata: { listing_id: "l-null" } });
  assert.equal(listing("l-null").payment_status, "payment_failed");
  // A failed plan-change payment leaves the paid listing alone.
  r = await deliver("payment_intent.payment_failed", { id: "pi_9", metadata: { kind: "plan_change", listing_id: "l-paid" } });
  assert.equal(listing("l-paid").payment_status, "paid");

  console.error = quiet.error;
  console.warn = quiet.warn;
  console.log = quiet.log;
  console.log(`test-billing-webhook: all checks passed (${deliveries} deliveries)`);
}

main().catch((error) => {
  process.stderr.write(String(error?.stack ?? error) + "\n");
  process.exit(1);
});
