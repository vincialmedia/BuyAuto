import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type EnforcementResult = {
  overridesExpiredCount: number;
  overridesExpiredDealerIds: string[];
  subscriptionsGraceEndedCount: number;
  subscriptionsGraceEndedDealerIds: string[];
  garagesDowngradedCount: number;
  garagesDowngradedDealerIds: string[];
  listingsDraftedCount: number;
  listingsDraftedIds: string[];
};

function toIso(ms: number) {
  return new Date(ms).toISOString();
}

function addDaysIso(baseIso: string, days: number) {
  const ms = Date.parse(baseIso);
  if (!Number.isFinite(ms)) return null;
  return toIso(ms + days * 24 * 60 * 60 * 1000);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const nowIso = new Date().toISOString();

    const result: EnforcementResult = {
      overridesExpiredCount: 0,
      overridesExpiredDealerIds: [],
      subscriptionsGraceEndedCount: 0,
      subscriptionsGraceEndedDealerIds: [],
      garagesDowngradedCount: 0,
      garagesDowngradedDealerIds: [],
      listingsDraftedCount: 0,
      listingsDraftedIds: [],
    };

    const { data: expiredOverrides, error: overridesError } = await supabaseAdmin
      .from("dealer_admin_overrides")
      .select("dealer_id, ends_at")
      .lte("ends_at", nowIso);

    if (overridesError) throw overridesError;

    const endedOverrideDealerIds = Array.from(
      new Set((expiredOverrides ?? []).map((r) => r.dealer_id).filter(Boolean) as string[])
    );

    const overrideGraceEndedDealerIds = Array.from(
      new Set(
        (expiredOverrides ?? [])
          .filter((r) => Boolean(r.dealer_id) && Boolean(r.ends_at) && (r.ends_at as string) <= nowIso)
          .map((r) => ({ dealerId: r.dealer_id as string, graceEndsAt: addDaysIso(r.ends_at as string, 5) }))
          .filter((x) => Boolean(x.dealerId) && Boolean(x.graceEndsAt) && (x.graceEndsAt as string) <= nowIso)
          .map((x) => x.dealerId)
      )
    );

    result.overridesExpiredCount = overrideGraceEndedDealerIds.length;
    result.overridesExpiredDealerIds = overrideGraceEndedDealerIds;

    const { data: graceEndedSubs, error: graceError } = await supabaseAdmin
      .from("dealer_subscriptions")
      .select("dealer_id, grace_ends_at")
      .not("grace_ends_at", "is", null)
      .lte("grace_ends_at", nowIso);

    if (graceError) throw graceError;

    const graceEndedDealerIds = Array.from(new Set((graceEndedSubs ?? []).map((r) => r.dealer_id).filter(Boolean)));

    result.subscriptionsGraceEndedCount = graceEndedDealerIds.length;
    result.subscriptionsGraceEndedDealerIds = graceEndedDealerIds;

    const { data: endedNoGraceSubs, error: endedNoGraceError } = await supabaseAdmin
      .from("dealer_subscriptions")
      .select("dealer_id, current_period_end, grace_ends_at")
      .not("current_period_end", "is", null)
      .lte("current_period_end", nowIso)
      .is("grace_ends_at", null);

    if (endedNoGraceError) throw endedNoGraceError;

    const endedNoGraceDealerIds = Array.from(
      new Set((endedNoGraceSubs ?? []).map((r) => r.dealer_id).filter(Boolean))
    );

    const dealersToDowngrade = Array.from(
      new Set([...endedOverrideDealerIds, ...endedNoGraceDealerIds, ...overrideGraceEndedDealerIds, ...graceEndedDealerIds])
    );

    const dealersToDraft = Array.from(new Set([...overrideGraceEndedDealerIds, ...graceEndedDealerIds]));

    if (dealersToDowngrade.length === 0) {
      return new Response(JSON.stringify({ ok: true, ...result }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    const { error: downgradeError } = await supabaseAdmin
      .from("garages")
      .update({ plan: "no_plan", listing_limit: 0 })
      .in("id", dealersToDowngrade);

    if (downgradeError) throw downgradeError;

    result.garagesDowngradedCount = dealersToDowngrade.length;
    result.garagesDowngradedDealerIds = dealersToDowngrade;

    if (dealersToDraft.length === 0) {
      return new Response(JSON.stringify({ ok: true, ...result }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    const { data: affectedListings, error: listError } = await supabaseAdmin
      .from("listings")
      .select("id")
      .in("garage_id", dealersToDraft)
      .in("status", ["published", "active", "inactive"]);

    if (listError) throw listError;

    const listingIds = (affectedListings ?? []).map((l) => l.id).filter(Boolean);
    if (listingIds.length > 0) {
      const { error: updateError } = await supabaseAdmin
        .from("listings")
        .update({ status: "draft" })
        .in("id", listingIds);

      if (updateError) throw updateError;

      result.listingsDraftedCount = listingIds.length;
      result.listingsDraftedIds = listingIds;
    }

    return new Response(JSON.stringify({ ok: true, ...result }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const message =
      error && typeof error === "object" && "message" in error ? String((error as any).message) : "Unexpected error";
    console.error("enforce-dealer-entitlements error:", error);
    return new Response(JSON.stringify({ ok: false, error: message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});