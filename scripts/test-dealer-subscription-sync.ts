/**
 * Checks for the garage subscription sync: `npx tsx scripts/test-dealer-subscription-sync.ts`.
 * Exits non-zero on the first failed assertion.
 *
 * Stripe and the database are replaced by an in-memory world, so the checks
 * cover the decisions (what is written, what is ignored, what fails the
 * delivery), not the network. All ids are made up.
 */
import assert from "node:assert/strict";
import {
  DEALER_GRACE_DAYS,
  hasLiveStripeSubscription,
  mapStripeSubscriptionStatus,
  planDealerSubscriptionWrite,
  readInvoiceSubscriptionId,
  shouldTrackSubscription,
  syncDealerSubscription,
  type DealerSubscriptionWrite,
  type DealerSyncDeps,
  type StripeSubscriptionLike,
  type TrackedSubscription,
} from "../src/lib/billing/dealer-subscription-sync";

const DAY = 24 * 60 * 60;
const T0 = 1_800_000_000; // a fixed "now" in seconds
const iso = (seconds: number) => new Date(seconds * 1000).toISOString();

const GARAGE = "garage-1";

function subscription(overrides: Partial<StripeSubscriptionLike> = {}): StripeSubscriptionLike {
  return {
    id: "sub_A",
    status: "active",
    metadata: { kind: "dealer_plan", dealer_id: GARAGE, plan_code: "planb", plan_id: "plan_planb" },
    customer: "cus_A",
    current_period_start: T0,
    current_period_end: T0 + 30 * DAY,
    cancel_at_period_end: false,
    cancel_at: null,
    canceled_at: null,
    ended_at: null,
    ...overrides,
  };
}

// --- Status mapping ------------------------------------------------------------
assert.equal(mapStripeSubscriptionStatus("active"), "active");
assert.equal(mapStripeSubscriptionStatus("trialing"), "active");
assert.equal(mapStripeSubscriptionStatus("past_due"), "past_due");
assert.equal(mapStripeSubscriptionStatus("unpaid"), "past_due");
assert.equal(mapStripeSubscriptionStatus("canceled"), "canceled");
assert.equal(mapStripeSubscriptionStatus("paused"), "pending_change");
// Never started: nothing to record.
assert.equal(mapStripeSubscriptionStatus("incomplete"), null);
assert.equal(mapStripeSubscriptionStatus("incomplete_expired"), null);

// --- Is there a running Stripe subscription on record? -------------------------
assert.equal(hasLiveStripeSubscription(null), false);
assert.equal(hasLiveStripeSubscription(undefined), false);
assert.equal(hasLiveStripeSubscription({ status: "active", stripe_subscription_id: null }), false); // set by hand
assert.equal(hasLiveStripeSubscription({ status: "active", stripe_subscription_id: "sub_A", ended_at: null }), true);
assert.equal(hasLiveStripeSubscription({ status: "past_due", stripe_subscription_id: "sub_A" }), true);
assert.equal(hasLiveStripeSubscription({ status: "pending_change", stripe_subscription_id: "sub_A" }), true);
assert.equal(hasLiveStripeSubscription({ status: "canceled", stripe_subscription_id: "sub_A" }), false);
assert.equal(hasLiveStripeSubscription({ status: "active", stripe_subscription_id: "sub_A", ended_at: iso(T0) }), false);

// --- Subscription id on an invoice ----------------------------------------------
assert.equal(readInvoiceSubscriptionId({ subscription: "sub_A" }), "sub_A");
assert.equal(readInvoiceSubscriptionId({ subscription: { id: "sub_A" } }), "sub_A");
assert.equal(readInvoiceSubscriptionId({ parent: { subscription_details: { subscription: "sub_B" } } }), "sub_B");
assert.equal(readInvoiceSubscriptionId({ parent: { subscription_details: { subscription: { id: "sub_B" } } } }), "sub_B");
assert.equal(readInvoiceSubscriptionId({ subscription: null, parent: null }), null);
assert.equal(readInvoiceSubscriptionId({ subscription: "" }), null);
assert.equal(readInvoiceSubscriptionId({}), null);
assert.equal(readInvoiceSubscriptionId(null), null);
assert.equal(readInvoiceSubscriptionId("sub_A"), null);

// --- From a Stripe subscription to the row --------------------------------------
{
  // A trial: Stripe reports the trial as the current period.
  const plan = planDealerSubscriptionWrite(
    subscription({ status: "trialing", current_period_start: T0, current_period_end: T0 + 60 * DAY })
  );
  assert.equal(plan.outcome, "write");
  if (plan.outcome === "write") {
    assert.equal(plan.planCode, "planb");
    assert.deepEqual(plan.row, {
      dealer_id: GARAGE,
      plan_id: "plan_planb",
      status: "active",
      current_period_start: iso(T0),
      current_period_end: iso(T0 + 60 * DAY),
      cancel_at_period_end: false,
      stripe_customer_id: "cus_A",
      stripe_subscription_id: "sub_A",
      cancel_at: null,
      canceled_at: null,
      ended_at: null,
      grace_ends_at: null,
    });
  }
}
{
  // Ended: the grace period starts at the end, not at the event.
  const plan = planDealerSubscriptionWrite(
    subscription({ status: "canceled", canceled_at: T0 + DAY, ended_at: T0 + 2 * DAY, customer: { id: "cus_A" } })
  );
  assert.equal(plan.outcome, "write");
  if (plan.outcome === "write") {
    assert.equal(plan.row.status, "canceled");
    assert.equal(plan.row.canceled_at, iso(T0 + DAY));
    assert.equal(plan.row.ended_at, iso(T0 + 2 * DAY));
    assert.equal(plan.row.grace_ends_at, iso(T0 + (2 + DEALER_GRACE_DAYS) * DAY));
    assert.equal(plan.row.stripe_customer_id, "cus_A");
  }
}
{
  // Cancellation booked for the end of the period: still running.
  const plan = planDealerSubscriptionWrite(subscription({ cancel_at_period_end: true, cancel_at: T0 + 30 * DAY }));
  assert.equal(plan.outcome, "write");
  if (plan.outcome === "write") {
    assert.equal(plan.row.status, "active");
    assert.equal(plan.row.cancel_at_period_end, true);
    assert.equal(plan.row.cancel_at, iso(T0 + 30 * DAY));
    assert.equal(plan.row.grace_ends_at, null);
  }
}
{
  // Newer Stripe API versions carry the period on the items.
  const plan = planDealerSubscriptionWrite(
    subscription({
      current_period_start: undefined,
      current_period_end: undefined,
      items: { data: [{ current_period_start: T0, current_period_end: T0 + 30 * DAY }] },
    })
  );
  assert.equal(plan.outcome, "write");
  if (plan.outcome === "write") {
    assert.equal(plan.row.current_period_start, iso(T0));
    assert.equal(plan.row.current_period_end, iso(T0 + 30 * DAY));
  }
}
assert.deepEqual(
  planDealerSubscriptionWrite(subscription({ current_period_start: undefined, current_period_end: undefined })),
  { outcome: "error", reason: "missing_period" }
);
assert.deepEqual(planDealerSubscriptionWrite(subscription({ metadata: { kind: "something_else" } })), {
  outcome: "ignore",
  reason: "not_dealer_plan",
});
assert.deepEqual(planDealerSubscriptionWrite(subscription({ metadata: null })), {
  outcome: "ignore",
  reason: "not_dealer_plan",
});
assert.deepEqual(
  planDealerSubscriptionWrite(subscription({ metadata: { kind: "dealer_plan", dealer_id: GARAGE, plan_code: "planb" } })),
  { outcome: "ignore", reason: "missing_metadata" }
);
assert.deepEqual(planDealerSubscriptionWrite(subscription({ status: "incomplete" })), {
  outcome: "ignore",
  reason: "not_started",
});
assert.deepEqual(planDealerSubscriptionWrite(subscription({ status: "incomplete_expired" })), {
  outcome: "ignore",
  reason: "not_started",
});

// --- Which subscription does the garage's single row follow? --------------------
const incoming = (id: string, status: DealerSubscriptionWrite["status"] = "active") => ({
  stripe_subscription_id: id,
  status,
});
const liveA: TrackedSubscription = { stripe_subscription_id: "sub_A", status: "active", ended_at: null };
const endedA: TrackedSubscription = { stripe_subscription_id: "sub_A", status: "canceled", ended_at: iso(T0) };
const byHand: TrackedSubscription = { stripe_subscription_id: null, status: "active", ended_at: null };

assert.equal(shouldTrackSubscription(null, incoming("sub_A"), false), true); // first subscription
assert.equal(shouldTrackSubscription(null, incoming("sub_A", "canceled"), false), true);
assert.equal(shouldTrackSubscription(liveA, incoming("sub_A", "past_due"), false), true); // same one
assert.equal(shouldTrackSubscription(liveA, incoming("sub_A", "canceled"), false), true);
assert.equal(shouldTrackSubscription(endedA, incoming("sub_B"), false), true); // subscribing again
assert.equal(shouldTrackSubscription(byHand, incoming("sub_B"), false), true); // Stripe takes over a hand-made row
assert.equal(shouldTrackSubscription(liveA, incoming("sub_B"), false), false); // second running one: ignored ...
assert.equal(shouldTrackSubscription(liveA, incoming("sub_B", "past_due"), false), false);
assert.equal(shouldTrackSubscription(liveA, incoming("sub_B"), true), true); // ... unless it is a completed checkout
assert.equal(shouldTrackSubscription(liveA, incoming("sub_B", "canceled"), false), false); // an ended one never takes over
assert.equal(shouldTrackSubscription(liveA, incoming("sub_B", "canceled"), true), false);
assert.equal(shouldTrackSubscription(endedA, incoming("sub_B", "canceled"), false), false);
assert.equal(shouldTrackSubscription(byHand, incoming("sub_B", "canceled"), false), false);

// --- The sync itself, against an in-memory Stripe and database ------------------
type World = {
  stripe: Map<string, StripeSubscriptionLike>;
  garages: Set<string>;
  rows: Map<string, DealerSubscriptionWrite>;
  garagePlan: Map<string, string>;
  planChanges: Array<{ dealerId: string; from: string | null; to: string }>;
  failAt: "retrieve" | "garage" | "load" | "write" | "apply" | null;
  writes: number;
};

function newWorld(): World {
  return {
    stripe: new Map(),
    garages: new Set([GARAGE]),
    rows: new Map(),
    garagePlan: new Map(),
    planChanges: [],
    failAt: null,
    writes: 0,
  };
}

function depsFor(world: World): DealerSyncDeps {
  const failIf = (step: World["failAt"]) => {
    if (world.failAt === step) throw new Error(`simulated ${step} failure`);
  };
  return {
    async retrieveSubscription(id) {
      failIf("retrieve");
      return world.stripe.get(id) ?? null;
    },
    async garageExists(dealerId) {
      failIf("garage");
      return world.garages.has(dealerId);
    },
    async loadTrackedSubscription(dealerId) {
      failIf("load");
      return world.rows.get(dealerId) ?? null;
    },
    async writeSubscription(row) {
      failIf("write");
      world.writes += 1;
      world.rows.set(row.dealer_id, row);
    },
    async applyPlan({ dealerId, planCode, previousPlanId }) {
      failIf("apply");
      world.garagePlan.set(dealerId, planCode);
      const planId = `plan_${planCode}`;
      if (previousPlanId !== planId) world.planChanges.push({ dealerId, from: previousPlanId, to: planId });
    },
  };
}

async function main() {
  // 1. A new garage starts a trial. Stripe sends several events for it, in any order.
  {
    const world = newWorld();
    const deps = depsFor(world);
    world.stripe.set("sub_A", subscription({ status: "trialing", current_period_end: T0 + 60 * DAY }));

    // The invoice and subscription events may arrive before the checkout event.
    assert.deepEqual(await syncDealerSubscription(deps, "sub_A"), {
      outcome: "applied",
      status: "active",
      dealerId: GARAGE,
    });
    assert.deepEqual(await syncDealerSubscription(deps, "sub_A", { fromCheckout: true }), {
      outcome: "applied",
      status: "active",
      dealerId: GARAGE,
    });
    await syncDealerSubscription(deps, "sub_A");

    assert.equal(world.rows.get(GARAGE)?.status, "active");
    assert.equal(world.rows.get(GARAGE)?.current_period_end, iso(T0 + 60 * DAY));
    assert.equal(world.rows.get(GARAGE)?.stripe_subscription_id, "sub_A");
    assert.equal(world.garagePlan.get(GARAGE), "planb");
    // Three events, one plan change in the log.
    assert.deepEqual(world.planChanges, [{ dealerId: GARAGE, from: null, to: "plan_planb" }]);

    // 2. The trial ends and the first charge fails: past due, and no plan is (re)applied.
    world.stripe.set(
      "sub_A",
      subscription({ status: "past_due", current_period_start: T0 + 60 * DAY, current_period_end: T0 + 90 * DAY })
    );
    world.garagePlan.clear();
    assert.deepEqual(await syncDealerSubscription(deps, "sub_A"), {
      outcome: "applied",
      status: "past_due",
      dealerId: GARAGE,
    });
    assert.equal(world.rows.get(GARAGE)?.status, "past_due");
    assert.equal(world.garagePlan.has(GARAGE), false);

    // 3. A stale "payment failed" delivered after the card was fixed changes nothing:
    //    only what Stripe says now counts.
    world.stripe.set(
      "sub_A",
      subscription({ status: "active", current_period_start: T0 + 60 * DAY, current_period_end: T0 + 90 * DAY })
    );
    await syncDealerSubscription(deps, "sub_A");
    assert.equal(world.rows.get(GARAGE)?.status, "active");
    assert.equal(world.garagePlan.get(GARAGE), "planb");
    assert.equal(world.planChanges.length, 1);

    // 4. The subscription ends.
    world.stripe.set("sub_A", subscription({ status: "canceled", canceled_at: T0 + 80 * DAY, ended_at: T0 + 90 * DAY }));
    await syncDealerSubscription(deps, "sub_A");
    assert.equal(world.rows.get(GARAGE)?.status, "canceled");
    assert.equal(world.rows.get(GARAGE)?.ended_at, iso(T0 + 90 * DAY));
    assert.equal(world.rows.get(GARAGE)?.grace_ends_at, iso(T0 + (90 + DEALER_GRACE_DAYS) * DAY));

    // 5. The garage subscribes again, on another plan. Whichever event comes first may take the row.
    world.stripe.set(
      "sub_B",
      subscription({
        id: "sub_B",
        customer: "cus_B",
        metadata: { kind: "dealer_plan", dealer_id: GARAGE, plan_code: "planc", plan_id: "plan_planc" },
        current_period_start: T0 + 100 * DAY,
        current_period_end: T0 + 130 * DAY,
      })
    );
    assert.equal((await syncDealerSubscription(deps, "sub_B")).outcome, "applied");
    assert.equal(world.rows.get(GARAGE)?.stripe_subscription_id, "sub_B");
    assert.equal(world.rows.get(GARAGE)?.ended_at, null);
    assert.equal(world.rows.get(GARAGE)?.grace_ends_at, null);
    assert.equal(world.garagePlan.get(GARAGE), "planc");
    assert.deepEqual(world.planChanges[1], { dealerId: GARAGE, from: "plan_planb", to: "plan_planc" });

    // 6. A late event of the old, ended subscription must not cancel the new one.
    assert.deepEqual(await syncDealerSubscription(deps, "sub_A"), {
      outcome: "ignored",
      reason: "ended_subscription",
      dealerId: GARAGE,
    });
    assert.equal(world.rows.get(GARAGE)?.stripe_subscription_id, "sub_B");
    assert.equal(world.rows.get(GARAGE)?.status, "active");
  }

  // 7. Two running subscriptions for one garage (a second checkout slipped through).
  {
    const world = newWorld();
    const deps = depsFor(world);
    world.stripe.set("sub_A", subscription());
    world.stripe.set("sub_B", subscription({ id: "sub_B", customer: "cus_B" }));
    await syncDealerSubscription(deps, "sub_A", { fromCheckout: true });

    // Events of the second one are ignored until its checkout completes ...
    assert.deepEqual(await syncDealerSubscription(deps, "sub_B"), {
      outcome: "ignored",
      reason: "other_subscription",
      dealerId: GARAGE,
    });
    assert.equal(world.rows.get(GARAGE)?.stripe_subscription_id, "sub_A");
    // ... then the newest purchase is the one on record,
    assert.equal((await syncDealerSubscription(deps, "sub_B", { fromCheckout: true })).outcome, "applied");
    assert.equal(world.rows.get(GARAGE)?.stripe_subscription_id, "sub_B");
    // and the first one can no longer overwrite it, not even by being cancelled.
    assert.equal((await syncDealerSubscription(deps, "sub_A")).outcome, "ignored");
    world.stripe.set("sub_A", subscription({ status: "canceled", ended_at: T0 + DAY }));
    assert.deepEqual(await syncDealerSubscription(deps, "sub_A"), {
      outcome: "ignored",
      reason: "ended_subscription",
      dealerId: GARAGE,
    });
    assert.equal(world.rows.get(GARAGE)?.stripe_subscription_id, "sub_B");
    assert.equal(world.rows.get(GARAGE)?.status, "active");
  }

  // 8. A checkout that was never paid leaves nothing behind, with or without an existing plan.
  {
    const world = newWorld();
    const deps = depsFor(world);
    world.stripe.set("sub_X", subscription({ id: "sub_X", status: "incomplete" }));
    assert.deepEqual(await syncDealerSubscription(deps, "sub_X"), { outcome: "ignored", reason: "not_started" });
    world.stripe.set("sub_X", subscription({ id: "sub_X", status: "incomplete_expired" }));
    assert.deepEqual(await syncDealerSubscription(deps, "sub_X", { fromCheckout: true }), {
      outcome: "ignored",
      reason: "not_started",
    });
    assert.equal(world.rows.size, 0);
    assert.equal(world.garagePlan.size, 0);

    world.stripe.set("sub_A", subscription());
    await syncDealerSubscription(deps, "sub_A", { fromCheckout: true });
    await syncDealerSubscription(deps, "sub_X");
    assert.equal(world.rows.get(GARAGE)?.stripe_subscription_id, "sub_A");
    assert.equal(world.rows.get(GARAGE)?.status, "active");
  }

  // 9. A row set by hand is taken over by a real subscription.
  {
    const world = newWorld();
    const deps = depsFor(world);
    world.rows.set(GARAGE, {
      ...(planDealerSubscriptionWrite(subscription()) as { row: DealerSubscriptionWrite }).row,
      stripe_subscription_id: null as unknown as string,
      stripe_customer_id: null,
    });
    world.stripe.set("sub_B", subscription({ id: "sub_B" }));
    assert.equal((await syncDealerSubscription(deps, "sub_B")).outcome, "applied");
    assert.equal(world.rows.get(GARAGE)?.stripe_subscription_id, "sub_B");
  }

  // 10. Things that are not ours to record.
  {
    const world = newWorld();
    const deps = depsFor(world);
    assert.deepEqual(await syncDealerSubscription(deps, "sub_unknown"), {
      outcome: "ignored",
      reason: "subscription_not_found",
    });
    world.stripe.set("sub_other", subscription({ id: "sub_other", metadata: { kind: "newsletter" } }));
    assert.deepEqual(await syncDealerSubscription(deps, "sub_other"), { outcome: "ignored", reason: "not_dealer_plan" });
    world.stripe.set("sub_A", subscription());
    world.garages.clear(); // the garage was deleted
    assert.deepEqual(await syncDealerSubscription(deps, "sub_A"), {
      outcome: "ignored",
      reason: "garage_not_found",
      dealerId: GARAGE,
    });
    assert.equal(world.writes, 0);
  }

  // 11. Failures are thrown, so the webhook delivery fails and Stripe retries it.
  for (const step of ["retrieve", "garage", "load", "write", "apply"] as const) {
    const world = newWorld();
    const deps = depsFor(world);
    world.stripe.set("sub_A", subscription());
    world.failAt = step;
    await assert.rejects(() => syncDealerSubscription(deps, "sub_A"), new RegExp(`simulated ${step} failure`));
    // Nothing is half-applied before the write, and a retry finishes the job.
    if (step !== "apply") assert.equal(world.rows.size, 0);
    world.failAt = null;
    assert.equal((await syncDealerSubscription(deps, "sub_A")).outcome, "applied");
    assert.equal(world.rows.get(GARAGE)?.status, "active");
    assert.equal(world.garagePlan.get(GARAGE), "planb");
  }

  // 12. A subscription without a billing period is a setup problem (API version): fail loudly.
  {
    const world = newWorld();
    world.stripe.set("sub_A", subscription({ current_period_start: undefined, current_period_end: undefined }));
    await assert.rejects(() => syncDealerSubscription(depsFor(world), "sub_A"), /no billing period/);
    assert.equal(world.rows.size, 0);
  }

  console.log("test-dealer-subscription-sync: all checks passed");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
