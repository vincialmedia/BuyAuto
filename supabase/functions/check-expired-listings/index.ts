import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

// Maintenance sweep, kept in sync with the DB-side run_listing_maintenance():
//  * published (non-garage) listings past their runtime become 'expired' —
//    they stay offline until the owner pays the CHF 30 relist fee. This
//    function must never archive them: 'archived' now means either a manual
//    archive or an aged-out draft, and draft archives get deleted.
//  * sold listings past sold_delete_at are tombstoned and removed.

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type CleanupResult = {
  expiredCount: number;
  expiredIds: string[];
  soldDeletedCount: number;
  soldDeletedIds: string[];
};

function computeEffectiveExpiresAtIso(input: {
  created_at: string | null;
  duration_days: number | null;
  expires_at: string | null;
}): string | null {
  if (input.expires_at) return input.expires_at;
  if (!input.created_at) return null;
  if (typeof input.duration_days !== "number") return null;

  const createdAtMs = Date.parse(input.created_at);
  if (!Number.isFinite(createdAtMs)) return null;

  const effectiveMs = createdAtMs + input.duration_days * 24 * 60 * 60 * 1000;
  return new Date(effectiveMs).toISOString();
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const nowIso = new Date().toISOString();

    const result: CleanupResult = {
      expiredCount: 0,
      expiredIds: [],
      soldDeletedCount: 0,
      soldDeletedIds: [],
    };

    const { data: candidates, error: candidatesError } = await supabaseAdmin
      .from("listings")
      .select("id, created_at, duration_days, expires_at")
      .in("status", ["published", "active"])
      .not("duration_days", "is", null)
      .neq("seller_type", "garage");

    if (candidatesError) {
      throw candidatesError;
    }

    const expiredIds: string[] = [];

    for (const row of candidates ?? []) {
      const effective = computeEffectiveExpiresAtIso({
        created_at: row.created_at ?? null,
        duration_days: typeof row.duration_days === "number" ? row.duration_days : null,
        expires_at: row.expires_at ?? null,
      });

      if (!effective) continue;

      if (effective <= nowIso) {
        expiredIds.push(row.id);
      }
    }

    if (expiredIds.length > 0) {
      const { error: expireError } = await supabaseAdmin
        .from("listings")
        .update({ status: "expired", updated_at: nowIso })
        .in("id", expiredIds)
        // Re-checked at write time: a listing sold/paused/archived between the
        // candidate scan and this update must not be flipped to expired.
        .in("status", ["published", "active"]);

      if (expireError) throw expireError;

      result.expiredCount = expiredIds.length;
      result.expiredIds = expiredIds;
    }

    const { data: soldCandidates, error: soldCandidatesError } = await supabaseAdmin
      .from("listings")
      .select("id, garage_id, created_by, brand, model, year, location, deal_type, financing_type, price_per_month_chf, purchase_price_chf, cover_image_url, sold_at, sold_delete_at")
      .eq("status", "sold")
      .not("sold_delete_at", "is", null)
      .lte("sold_delete_at", nowIso);

    if (soldCandidatesError) throw soldCandidatesError;

    const soldIds = Array.isArray(soldCandidates) ? soldCandidates.map((r) => r.id) : [];
    if (soldIds.length > 0) {
      const tombstoneRows = (soldCandidates ?? []).map((r) => ({
        original_listing_id: r.id,
        garage_id: r.garage_id,
        seller_user_id: r.created_by,
        brand: r.brand,
        model: r.model,
        year: r.year,
        location: r.location,
        deal_type: r.deal_type,
        financing_type: r.financing_type,
        price_per_month_chf: r.price_per_month_chf,
        purchase_price_chf: r.purchase_price_chf,
        cover_image_url: r.cover_image_url,
        sold_at: r.sold_at,
        deleted_at: nowIso,
      }));

      const { error: tombstoneError } = await supabaseAdmin
        .from("listing_tombstones")
        .upsert(tombstoneRows, { onConflict: "original_listing_id" });

      if (tombstoneError) throw tombstoneError;

      const { error: deleteError } = await supabaseAdmin
        .from("listings")
        .delete()
        .in("id", soldIds);

      if (deleteError) throw deleteError;

      result.soldDeletedCount = soldIds.length;
      result.soldDeletedIds = soldIds;
    }

    return new Response(JSON.stringify({ ok: true, ...result }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("Error processing listings cleanup:", error);
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});
