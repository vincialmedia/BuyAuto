/**
 * Keeps `dealer_subscriptions` in step with a garage's Stripe subscription.
 *
 * Every Stripe event about a garage plan (checkout completed, invoice paid or
 * failed, subscription updated or deleted) ends up in `syncDealerSubscription`.
 * The event is only the trigger: what gets written comes from a fresh
 * `subscriptions.retrieve`, so late, repeated and out-of-order deliveries all
 * converge on what Stripe says right now.
 *
 * `dealer_subscriptions` holds one row per garage. The rules below decide
 * which Stripe subscription that row follows when there is more than one.
 */

export type DealerSubscriptionStatus = "active" | "pending_change" | "canceled" | "past_due";

/** Days a garage keeps its plan after a subscription has ended. */
export const DEALER_GRACE_DAYS = 5;

/**
 * The fields read from a Stripe subscription. The period sits on the
 * subscription up to API 2025-02-24 and on its items from 2025-03-31.basil;
 * both places are read so an API upgrade cannot silently break the sync.
 */
export type StripeSubscriptionLike = {
  id: string;
  status: string;
  metadata?: Record<string, string> | null;
  customer?: string | { id?: string | null } | null;
  current_period_start?: number | null;
  current_period_end?: number | null;
  cancel_at_period_end?: boolean | null;
  cancel_at?: number | null;
  canceled_at?: number | null;
  ended_at?: number | null;
  items?: {
    data?: Array<{ current_period_start?: number | null; current_period_end?: number | null }> | null;
  } | null;
};

/** The columns written to `dealer_subscriptions`. */
export type DealerSubscriptionWrite = {
  dealer_id: string;
  plan_id: string;
  status: DealerSubscriptionStatus;
  current_period_start: string;
  current_period_end: string;
  cancel_at_period_end: boolean;
  stripe_customer_id: string | null;
  stripe_subscription_id: string;
  cancel_at: string | null;
  canceled_at: string | null;
  ended_at: string | null;
  grace_ends_at: string | null;
};

/** What is already on record for a garage. */
export type TrackedSubscription = {
  plan_id?: string | null;
  status?: string | null;
  stripe_subscription_id?: string | null;
  ended_at?: string | null;
};

export type DealerSubscriptionPlan =
  | { outcome: "write"; row: DealerSubscriptionWrite; planCode: string }
  | { outcome: "ignore"; reason: "not_dealer_plan" | "missing_metadata" | "not_started" }
  | { outcome: "error"; reason: "missing_period" };

export type DealerSyncResult =
  | { outcome: "applied"; status: DealerSubscriptionStatus; dealerId: string }
  | {
      outcome: "ignored";
      reason:
        | "not_dealer_plan"
        | "missing_metadata"
        | "not_started"
        | "subscription_not_found"
        | "garage_not_found"
        /** Another subscription than the one on record, and it has ended: a late event, nothing to do. */
        | "ended_subscription"
        /** A second running subscription for the same garage. Someone has to look at it. */
        | "other_subscription";
      dealerId?: string;
    };

/** Everything the sync needs from Stripe and the database. Each function throws on failure. */
export type DealerSyncDeps = {
  /** Resolves `null` when Stripe does not know the subscription. */
  retrieveSubscription(subscriptionId: string): Promise<StripeSubscriptionLike | null>;
  garageExists(dealerId: string): Promise<boolean>;
  loadTrackedSubscription(dealerId: string): Promise<TrackedSubscription | null>;
  writeSubscription(row: DealerSubscriptionWrite): Promise<void>;
  applyPlan(input: { dealerId: string; planCode: string; previousPlanId: string | null }): Promise<void>;
};

function text(input: unknown): string | null {
  return typeof input === "string" && input.trim().length > 0 ? input : null;
}

function secondsToIso(seconds: unknown): string | null {
  if (typeof seconds !== "number" || !Number.isFinite(seconds)) return null;
  return new Date(seconds * 1000).toISOString();
}

function addDaysIso(baseIso: string, days: number): string | null {
  const ms = Date.parse(baseIso);
  if (!Number.isFinite(ms)) return null;
  return new Date(ms + days * 24 * 60 * 60 * 1000).toISOString();
}

/**
 * Maps a Stripe subscription status to ours.
 *
 * `trialing` counts as active: the garage has a running plan until the trial
 * ends. `null` means the subscription never started (`incomplete`: the first
 * payment is still open, `incomplete_expired`: it was never made), so there is
 * nothing to record. Recording it would put the plan on the garage, because a
 * database trigger copies the plan from every row written here.
 */
export function mapStripeSubscriptionStatus(status: string): DealerSubscriptionStatus | null {
  if (status === "active" || status === "trialing") return "active";
  if (status === "past_due" || status === "unpaid") return "past_due";
  if (status === "canceled") return "canceled";
  if (status === "incomplete" || status === "incomplete_expired") return null;
  return "pending_change";
}

/** True while the row on record points at a Stripe subscription that has not ended. */
export function hasLiveStripeSubscription(row: TrackedSubscription | null | undefined): boolean {
  if (!row || !row.stripe_subscription_id) return false;
  return !row.ended_at && row.status !== "canceled";
}

/** Reads the subscription id from an invoice (top level up to API 2025-02-24, under `parent` from basil). */
export function readInvoiceSubscriptionId(invoice: unknown): string | null {
  if (!invoice || typeof invoice !== "object") return null;
  const candidate = invoice as {
    subscription?: unknown;
    parent?: { subscription_details?: { subscription?: unknown } | null } | null;
  };

  for (const value of [candidate.subscription, candidate.parent?.subscription_details?.subscription]) {
    if (typeof value === "string" && value.length > 0) return value;
    if (value && typeof value === "object") {
      const id = (value as { id?: unknown }).id;
      if (typeof id === "string" && id.length > 0) return id;
    }
  }
  return null;
}

/** Turns a Stripe subscription into the row to store, or says why there is nothing to store. */
export function planDealerSubscriptionWrite(subscription: StripeSubscriptionLike): DealerSubscriptionPlan {
  const metadata = subscription.metadata ?? {};
  if (text(metadata.kind) !== "dealer_plan") return { outcome: "ignore", reason: "not_dealer_plan" };

  const dealerId = text(metadata.dealer_id);
  const planCode = text(metadata.plan_code);
  const planId = text(metadata.plan_id);
  if (!dealerId || !planCode || !planId) return { outcome: "ignore", reason: "missing_metadata" };

  const status = mapStripeSubscriptionStatus(subscription.status);
  if (!status) return { outcome: "ignore", reason: "not_started" };

  const firstItem = subscription.items?.data?.[0];
  const periodStart = secondsToIso(subscription.current_period_start ?? firstItem?.current_period_start);
  const periodEnd = secondsToIso(subscription.current_period_end ?? firstItem?.current_period_end);
  if (!periodStart || !periodEnd) return { outcome: "error", reason: "missing_period" };

  const customer = subscription.customer;
  const customerId = typeof customer === "string" ? customer : text(customer?.id);
  const endedAt = secondsToIso(subscription.ended_at);

  return {
    outcome: "write",
    planCode,
    row: {
      dealer_id: dealerId,
      plan_id: planId,
      status,
      current_period_start: periodStart,
      current_period_end: periodEnd,
      cancel_at_period_end: subscription.cancel_at_period_end === true,
      stripe_customer_id: customerId,
      stripe_subscription_id: subscription.id,
      cancel_at: secondsToIso(subscription.cancel_at),
      canceled_at: secondsToIso(subscription.canceled_at),
      ended_at: endedAt,
      grace_ends_at: endedAt ? addDaysIso(endedAt, DEALER_GRACE_DAYS) : null,
    },
  };
}

/**
 * Decides whether a subscription may take over a garage's single row.
 *
 *  - no row yet, or the row already follows this subscription: yes
 *  - another subscription that has itself ended: never. A late "deleted"
 *    event for an old subscription must not cancel the one in use
 *  - the row has no running Stripe subscription (ended, or set by hand): yes,
 *    this is a garage subscribing again
 *  - both are running: only a completed checkout takes over (the newest
 *    purchase wins). Other events of the second subscription are ignored, so
 *    two subscriptions cannot keep overwriting each other
 */
export function shouldTrackSubscription(
  existing: TrackedSubscription | null | undefined,
  incoming: Pick<DealerSubscriptionWrite, "stripe_subscription_id" | "status">,
  fromCheckout: boolean
): boolean {
  if (!existing) return true;
  if (existing.stripe_subscription_id === incoming.stripe_subscription_id) return true;
  if (incoming.status === "canceled") return false;
  if (!hasLiveStripeSubscription(existing)) return true;
  return fromCheckout;
}

/**
 * Fetches the subscription from Stripe and records its current state for the
 * garage. Safe to call any number of times for the same subscription.
 *
 * Throws when Stripe or the database fails, so the caller can fail the
 * webhook delivery and have Stripe send it again.
 */
export async function syncDealerSubscription(
  deps: DealerSyncDeps,
  subscriptionId: string,
  options: { fromCheckout?: boolean } = {}
): Promise<DealerSyncResult> {
  const subscription = await deps.retrieveSubscription(subscriptionId);
  if (!subscription) return { outcome: "ignored", reason: "subscription_not_found" };

  const plan = planDealerSubscriptionWrite(subscription);
  if (plan.outcome === "error") {
    throw new Error(
      `Stripe subscription ${subscriptionId} carries no billing period. Check the Stripe API version pinned in lib/stripe-server.`
    );
  }
  if (plan.outcome === "ignore") return { outcome: "ignored", reason: plan.reason };

  const { row, planCode } = plan;

  if (!(await deps.garageExists(row.dealer_id))) {
    return { outcome: "ignored", reason: "garage_not_found", dealerId: row.dealer_id };
  }

  const existing = await deps.loadTrackedSubscription(row.dealer_id);
  if (!shouldTrackSubscription(existing, row, options.fromCheckout === true)) {
    return {
      outcome: "ignored",
      reason: row.status === "canceled" ? "ended_subscription" : "other_subscription",
      dealerId: row.dealer_id,
    };
  }

  await deps.writeSubscription(row);

  if (row.status === "active") {
    await deps.applyPlan({ dealerId: row.dealer_id, planCode, previousPlanId: existing?.plan_id ?? null });
  }

  return { outcome: "applied", status: row.status, dealerId: row.dealer_id };
}
