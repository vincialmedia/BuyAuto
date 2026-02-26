import type { NextApiRequest, NextApiResponse } from "next";
import { createPagesServerClient } from "@supabase/auth-helpers-nextjs";
import type { Database } from "@/integrations/supabase/types";
import { adminService } from "@/services/adminService";

type Body = {
  user_id?: string;
  plan_code?: "starter" | "growth" | "pro";
};

type ProfileRoleRow = { role: string | null };

function safeString(input: unknown): string | null {
  if (typeof input === "string" && input.trim().length > 0) return input.trim();
  return null;
}

function getErrorMessage(input: unknown): string {
  if (typeof input === "string" && input.trim().length > 0) return input;
  if (input && typeof input === "object" && "message" in input && typeof (input as any).message === "string") return (input as any).message;
  return "Unexpected error";
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ ok: false, error: "Method Not Allowed" });
  }

  try {
    const supabase = createPagesServerClient<Database>({ req, res });
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError) return res.status(401).json({ ok: false, error: "Authentication failed" });
    if (!session?.user) return res.status(401).json({ ok: false, error: "Unauthorized" });

    const { data: me } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", session.user.id)
      .maybeSingle<ProfileRoleRow>();

    if (!me || me.role !== "admin") return res.status(403).json({ ok: false, error: "Forbidden" });

    const body = (req.body ?? {}) as Body;
    const userId = safeString(body.user_id);
    const planCode = body.plan_code;

    if (!userId) return res.status(400).json({ ok: false, error: "Missing user_id" });
    if (planCode !== "starter" && planCode !== "growth" && planCode !== "pro") {
      return res.status(400).json({ ok: false, error: "Invalid plan_code" });
    }

    const supabaseAdmin = adminService.getSupabaseAdminClient();

    const { data: garage, error: garageError } = await supabaseAdmin
      .from("garages")
      .select("id, owner_user_id")
      .eq("owner_user_id", userId)
      .maybeSingle();

    if (garageError) return res.status(500).json({ ok: false, error: "Failed to load garage" });
    if (!garage?.id) return res.status(400).json({ ok: false, error: "No garage found for this user" });

    const { data: plan, error: planError } = await supabaseAdmin
      .from("dealer_plans")
      .select("id, code, listing_limit, active")
      .eq("code", planCode)
      .eq("active", true)
      .maybeSingle();

    if (planError) return res.status(500).json({ ok: false, error: "Failed to load plan" });
    if (!plan?.id) return res.status(400).json({ ok: false, error: "Plan not found" });

    const { data: existingSub } = await supabaseAdmin
      .from("dealer_subscriptions")
      .select("plan_id")
      .eq("dealer_id", garage.id)
      .maybeSingle();

    const fromPlanId = existingSub?.plan_id ?? null;

    const { error: upsertSubError } = await supabaseAdmin
      .from("dealer_subscriptions")
      .upsert(
        {
          dealer_id: garage.id,
          plan_id: plan.id,
          status: "active",
          current_period_start: new Date().toISOString(),
          current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          cancel_at_period_end: false,
        },
        { onConflict: "dealer_id" }
      );

    if (upsertSubError) return res.status(500).json({ ok: false, error: "Failed to update subscription" });

    const { error: garageUpdateError } = await supabaseAdmin
      .from("garages")
      .update({
        plan: plan.code,
        listing_limit: plan.listing_limit ?? null,
      })
      .eq("id", garage.id);

    if (garageUpdateError) return res.status(500).json({ ok: false, error: "Failed to update garage snapshot" });

    const { error: changeError } = await supabaseAdmin.from("dealer_plan_changes").insert({
      dealer_id: garage.id,
      from_plan_id: fromPlanId,
      to_plan_id: plan.id,
      status: "applied",
      notes: `admin dashboard override for user ${userId}`,
    });

    if (changeError) return res.status(500).json({ ok: false, error: "Failed to log plan change" });

    return res.status(200).json({ ok: true });
  } catch (e: unknown) {
    return res.status(500).json({ ok: false, error: getErrorMessage(e) });
  }
}