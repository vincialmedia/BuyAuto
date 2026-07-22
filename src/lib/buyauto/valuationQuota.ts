import type { SupabaseClient } from "@supabase/supabase-js";

// Monthly automatic-search limits. Only the portal search (which spends Firecrawl
// credits) is metered — manual comp entry and "Neuberechnung" never call the API.
export const FREE_MONTHLY_LIMIT = 5;
export const PAID_MONTHLY_LIMIT = 100;

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
 * real plan / active subscription / active admin override is "paid" (100);
 * everyone else logged-in is "free" (5).
 *
 * Fails OPEN: if plan detection throws, we treat the user as paid rather than
 * throttle a paying dealer because of a transient DB error. A private user with
 * no garage row simply falls through to "free" (that is not an error path).
 */
async function resolveLimit(
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

    const planField = (garage.plan ?? "").toString().trim().toLowerCase();
    if (planField && planField !== "no_plan") {
      return { limit: PAID_MONTHLY_LIMIT, plan: "paid" };
    }

    const nowIso = new Date().toISOString();

    const { data: sub } = await supabase
      .from("dealer_subscriptions")
      .select("id")
      .eq("dealer_id", garage.id)
      .eq("status", "active")
      .gt("current_period_end", nowIso)
      .limit(1)
      .maybeSingle();
    if (sub) return { limit: PAID_MONTHLY_LIMIT, plan: "paid" };

    const { data: override } = await supabase
      .from("dealer_admin_overrides")
      .select("id")
      .eq("dealer_id", garage.id)
      .gt("ends_at", nowIso)
      .limit(1)
      .maybeSingle();
    if (override) return { limit: PAID_MONTHLY_LIMIT, plan: "paid" };

    return { limit: FREE_MONTHLY_LIMIT, plan: "free" };
  } catch (e) {
    console.error("valuation quota: plan detection failed, failing open (paid)", e);
    return { limit: PAID_MONTHLY_LIMIT, plan: "paid" };
  }
}

/**
 * Atomically check the user's monthly quota and, if room remains, consume one
 * search. Call this AFTER input validation and the Firecrawl-key check, but
 * BEFORE the actual (billable) search — so an invalid request or an unavailable
 * search never burns quota.
 *
 * Fails OPEN on RPC error (allowed=true) for the same reason as above.
 */
export async function checkAndConsumeQuota(
  supabase: SupabaseClient,
  userId: string
): Promise<QuotaResult> {
  const { limit, plan } = await resolveLimit(supabase, userId);

  try {
    const { data, error } = await supabase.rpc("consume_valuation_search", { p_limit: limit });
    if (error) throw error;
    const row = Array.isArray(data) ? data[0] : data;
    const used = Number(row?.used ?? 0);
    const allowed = Boolean(row?.allowed);
    return {
      authenticated: true,
      allowed,
      used,
      limit,
      remaining: Math.max(0, limit - used),
      plan,
    };
  } catch (e) {
    console.error("valuation quota: consume failed, failing open (allow)", e);
    return { authenticated: true, allowed: true, used: 0, limit, remaining: limit, plan };
  }
}
