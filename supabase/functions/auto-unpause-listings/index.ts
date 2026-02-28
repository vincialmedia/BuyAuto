import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

serve(async (_req) => {
  const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

  if (!supabaseUrl || !serviceRoleKey) {
    return new Response(JSON.stringify({ ok: false, error: "Missing env" }), { status: 500 });
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey);

  const now = new Date().toISOString();

  const { data: paused, error } = await supabase
    .from("listings")
    .select("id")
    .eq("status", "paused")
    .lte("pause_until", now);

  if (error) return new Response(JSON.stringify({ ok: false, error: error.message }), { status: 500 });

  const ids = (paused ?? []).map((r: any) => r.id).filter((id: any) => typeof id === "string");
  let processed = 0;

  for (const id of ids) {
    const { error: unpauseError } = await supabase.rpc("unpause_listing", { p_listing_id: id });
    if (!unpauseError) processed++;
  }

  return new Response(JSON.stringify({ ok: true, processed, total: ids.length }), { status: 200 });
});