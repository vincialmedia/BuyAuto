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
      listingsDraftedCount: 0,
      listingsDraftedIds: [],
    };

    const { data: expiredOverrides, error: overridesError } = await supabaseAdmin
      .from("dealer_admin_overrides")
      .select("dealer_id, ends_at")
      .lte("ends_at", nowIso);

    if (overridesError) throw overridesError;

    const expiredOverrideDealerIds = Array.from(
      new Set((expiredOverrides ?? []).map((r) => r.dealer_id).filter(Boolean))
    );

    result.overridesExpiredCount = expiredOverrideDealerIds.length;
    result.overridesExpiredDealerIds = expiredOverrideDealerIds;

    const { data: graceEndedSubs, error: graceError } = await supabaseAdmin
      .from("dealer_subscriptions")
      .select("dealer_id, ended_at, grace_ends_at, status")
      .not("grace_ends_at", "is", null)
      .lte("grace_ends_at", nowIso);

    if (graceError) throw graceError;

    const graceEndedDealerIds = Array.from(
      new Set((graceEndedSubs ?? []).map((r) => r.dealer_id).filter(Boolean))
    );

    result.subscriptionsGraceEndedCount = graceEndedDealerIds.length;
    result.subscriptionsGraceEndedDealerIds = graceEndedDealerIds;

    const dealersToDraft = Array.from(new Set([...expiredOverrideDealerIds, ...graceEndedDealerIds]));
    if (dealersToDraft.length === 0) {
      return new Response(JSON.stringify({ ok: true, ...result }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    const { data: affectedListings, error: listError } = await supabaseAdmin
      .from("listings")
      .select("id, garage_id, status")
      .in("garage_id", dealersToDraft)
      .in("status", ["published", "active", "inactive"]);

    if (listError) throw listError;

    const listingIds = (affectedListings ?? []).map((l) => l.id);
    if (listingIds.length > 0) {
      const { error: updateError } = await supabaseAdmin
        .from("listings")
        .update({ status: "draft" })
        .in("id", listingIds);

      if (updateError) throw updateError;

      result.listingsDraftedCount = listingIds.length;
      result.listingsDraftedIds = listingIds;
    }

    for (const sub of graceEndedSubs ?? []) {
      if (sub.status !== "ended" && sub.status !== "canceled") {
        const endedAt = sub.ended_at ?? nowIso;
        const graceEndsAt = sub.grace_ends_at ?? addDaysIso(endedAt, 5);

        await supabaseAdmin
          .from("dealer_subscriptions")
          .update({
            status: "ended",
            ended_at: endedAt,
            grace_ends_at: graceEndsAt,
          })
          .eq("dealer_id", sub.dealer_id);
      }
    }

    return new Response(JSON.stringify({ ok: true, ...result }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const message = error && typeof error === "object" && "message" in error ? String((error as any).message) : "Unexpected error";
    console.error("enforce-dealer-entitlements error:", error);
    return new Response(JSON.stringify({ ok: false, error: message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});