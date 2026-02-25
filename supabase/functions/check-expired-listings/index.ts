import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type CleanupResult = {
  archivedUpdatedCount: number;
  archivedDeletedCount: number;
  archivedUpdatedIds: string[];
  archivedDeletedIds: string[];
};

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
    const cutoffIso = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

    const result: CleanupResult = {
      archivedUpdatedCount: 0,
      archivedDeletedCount: 0,
      archivedUpdatedIds: [],
      archivedDeletedIds: [],
    };

    const { data: expiredListings, error: fetchExpiredError } = await supabaseAdmin
      .from("listings")
      .select("id")
      .in("status", ["published", "active"])
      .not("expires_at", "is", null)
      .lt("expires_at", nowIso);

    if (fetchExpiredError) {
      throw fetchExpiredError;
    }

    if (Array.isArray(expiredListings) && expiredListings.length > 0) {
      const expiredIds = expiredListings.map((l) => l.id);

      const { error: updateError } = await supabaseAdmin
        .from("listings")
        .update({ status: "archived", archived_at: nowIso })
        .in("id", expiredIds);

      if (updateError) {
        throw updateError;
      }

      result.archivedUpdatedCount = expiredIds.length;
      result.archivedUpdatedIds = expiredIds;
    }

    const { data: archivedListings, error: fetchArchivedError } = await supabaseAdmin
      .from("listings")
      .select("id")
      .eq("status", "archived")
      .not("archived_at", "is", null)
      .lt("archived_at", cutoffIso);

    if (fetchArchivedError) {
      throw fetchArchivedError;
    }

    if (Array.isArray(archivedListings) && archivedListings.length > 0) {
      const archivedIds = archivedListings.map((l) => l.id);

      const { error: deleteError } = await supabaseAdmin
        .from("listings")
        .delete()
        .in("id", archivedIds);

      if (deleteError) {
        throw deleteError;
      }

      result.archivedDeletedCount = archivedIds.length;
      result.archivedDeletedIds = archivedIds;
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