import type { SupabaseClient } from "@supabase/supabase-js";
import { GARAGE_PLANS, garagePlanFor } from "@/lib/buyauto/garagePlans";

// Monthly automatic-search limits. Only the portal search (which spends Firecrawl
// credits) is metered — manual comp entry and "Neuberechnung" never call the API.
export const FREE_MONTHLY_LIMIT = 3;

/**
 * Fallback for a paid garage whose tier we can't resolve (legacy `garages.plan`
 * value, custom/enterprise deal, or an admin override pointing at a plan code
 * that isn't one of the three public tiers). Matches the middle tier so nobody
 * ends up worse off than Growth by accident.
 */
export const PAID_MONTHLY_LIMIT = GARAGE_PLANS.growth.valuationsPerMonth;

/** Per-tier quota — this is one of the fences that separates the packages. */
export function valuationLimitForPlanCode(code: string | null | undefined): number {
  return garagePlanFor(code)?.valuationsPerMonth ?? PAID_MONTHLY_LIMIT;
}

export type QuotaPlan = "free" | "paid";

export interface QuotaResult {
  authenticated: boolean;
  allowed: boolean;
  used: number;
  limit: number;
  remaining: number;
  plan: QuotaPlan;
}

/**
 * Resolve the caller's monthly limit from their dealer plan. A garage with any
 * real plan / active subscription / active admin override is "paid", and the
 * limit then depends on which tier they are on (Starter 25 / Growth 100 /
 * Pro 400) — the automatic search spends Firecrawl credits, so it is priced
 * like the metered resource it is. Everyone else logged-in is "free".
 *
 * Fails OPEN: if plan detection throws, we treat the user as paid rather than
 * throttle a paying dealer because of a transient DB error. A private user with
 * no garage row simply falls through to "free" (that is not an error path).
 *
 * Exported so the read-only quota endpoint reuses the exact same logic (no drift).
 */
export async function resolveLimit(
  supabase: SupabaseClient,
  userId: string
): Promise<{ limit: number; plan: QuotaPlan }> {
  try {
    const { data: garage, error } = await supabase
      .from("garages")
      .select("id, plan")
      .eq("owner_user_id", userId)
      .maybeSingle();

    if (error) throw error;
    if (!garage) return { limit: FREE_MONTHLY_LIMIT, plan: "free" };

    const nowIso = new Date().toISOString();

    // Subscription first: it carries the tier the garage actually pays for,
    // while garages.plan is a denormalised copy that can lag behind a change.
    const { data: sub } = await supabase
      .from("dealer_subscriptions")
      .select("id, dealer_plans(code)")
      .eq("dealer_id", garage.id)
      .eq("status", "active")
      .gt("current_period_end", nowIso)
      .limit(1)
      .maybeSingle();
    if (sub) {
      const code = (sub as any)?.dealer_plans?.code ?? null;
      return { limit: valuationLimitForPlanCode(code), plan: "paid" };
    }

    const { data: override } = await supabase
      .from("dealer_admin_overrides")
      .select("id, dealer_plans(code)")
      .eq("dealer_id", garage.id)
      .gt("ends_at", nowIso)
      .limit(1)
      .maybeSingle();
    if (override) {
      const code = (override as any)?.dealer_plans?.code ?? null;
      return { limit: valuationLimitForPlanCode(code), plan: "paid" };
    }

    const planField = (garage.plan ?? "").toString().trim().toLowerCase();
    if (planField && planField !== "no_plan") {
      return { limit: valuationLimitForPlanCode(planField), plan: "paid" };
    }

    return { limit: FREE_MONTHLY_LIMIT, plan: "free" };
  } catch (e) {
    console.error("valuation quota: plan detection failed, failing open (paid)", e);
    return { limit: PAID_MONTHLY_LIMIT, plan: "paid" };
  }
}

/**
 * Read-only quota view WITHOUT consuming. Call this BEFORE the billable search
 * to reject an over-limit user (allowed=false) so they can't trigger Firecrawl.
 * Fails OPEN (allowed=true) on error.
 */
export async function peekQuota(supabase: SupabaseClient, userId: string): Promise<QuotaResult> {
  const { limit, plan } = await resolveLimit(supabase, userId);
  let used = 0;
  try {
    const { data, error } = await supabase.rpc("get_valuation_usage");
    if (!error) used = Number(data ?? 0);
  } catch (e) {
    console.error("valuation quota: peek failed, failing open (allow)", e);
  }
  return {
    authenticated: true,
    allowed: used < limit,
    used,
    limit,
    remaining: Math.max(0, limit - used),
    plan,
  };
}

/**
 * Atomically consume ONE search. Call this AFTER a successful search (Firecrawl
 * actually ran) so a platform failure never burns the user's quota. The RPC
 * re-checks the limit under a row lock, so concurrent clicks can't both slip
 * past. Fails OPEN (allowed=true) on RPC error.
 */
export async function commitSearch(
  supabase: SupabaseClient,
  limit: number,
  plan: QuotaPlan
): Promise<QuotaResult> {
  try {
    const { data, error } = await supabase.rpc("consume_valuation_search", { p_limit: limit });
    if (error) throw error;
    const row = Array.isArray(data) ? data[0] : data;
    const used = Number(row?.used ?? 0);
    return {
      authenticated: true,
      allowed: Boolean(row?.allowed),
      used,
      limit,
      remaining: Math.max(0, limit - used),
      plan,
    };
  } catch (e) {
    console.error("valuation quota: commit failed, failing open (allow)", e);
    return { authenticated: true, allowed: true, used: 0, limit, remaining: limit, plan };
  }
}
