import type { NextApiRequest, NextApiResponse } from "next";
import { createPagesServerClient } from "@supabase/auth-helpers-nextjs";
import type { Database } from "@/integrations/supabase/types";
import { adminService } from "@/services/adminService";

type Body = {
  user_id?: string;
  plan_code?: "starter" | "growth" | "pro";
  duration_days?: number;
};

type ProfileRow = { id: string; role: string | null; full_name: string | null; email: string | null };

function safeString(input: unknown): string | null {
  if (typeof input === "string" && input.trim().length > 0) return input.trim();
  return null;
}

function getErrorMessage(input: unknown): string {
  if (typeof input === "string" && input.trim().length > 0) return input;
  if (input && typeof input === "object" && "message" in input && typeof (input as any).message === "string") return (input as any).message;
  return "Unexpected error";
}

function addDaysIso(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString();
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

    const { data: me } = await supabase.from("profiles").select("role").eq("id", session.user.id).maybeSingle<{ role: string | null }>();
    if (!me || me.role !== "admin") return res.status(403).json({ ok: false, error: "Forbidden" });

    const body = (req.body ?? {}) as Body;
    const userId = safeString(body.user_id);
    const planCode = body.plan_code ?? "starter";
    const durationDays = typeof body.duration_days === "number" && Number.isFinite(body.duration_days) && body.duration_days > 0 ? Math.floor(body.duration_days) : 30;

    if (!userId) return res.status(400).json({ ok: false, error: "Missing user_id" });
    if (planCode !== "starter" && planCode !== "growth" && planCode !== "pro") {
      return res.status(400).json({ ok: false, error: "Invalid plan_code" });
    }

    const supabaseAdmin = adminService.getSupabaseAdminClient();

    const { data: profile, error: profileError } = await supabaseAdmin
      .from("profiles")
      .select("id,role,full_name,email")
      .eq("id", userId)
      .maybeSingle<ProfileRow>();

    if (profileError) return res.status(500).json({ ok: false, error: "Failed to load user profile" });
    if (!profile?.id) return res.status(404).json({ ok: false, error: "User not found" });

    if (profile.role !== "garage") {
      const { error: roleError } = await supabaseAdmin.from("profiles").update({ role: "garage" }).eq("id", userId);
      if (roleError) return res.status(500).json({ ok: false, error: "Failed to set user role to garage" });
    }

    const { data: garageExisting, error: garageLookupError } = await supabaseAdmin
      .from("garages")
      .select("id, owner_user_id")
      .eq("owner_user_id", userId)
      .maybeSingle();

    if (garageLookupError) return res.status(500).json({ ok: false, error: "Failed to load garage" });

    let dealerId = garageExisting?.id ?? null;

    if (!dealerId) {
      const defaultName =
        (typeof profile.full_name === "string" && profile.full_name.trim().length > 0 ? profile.full_name.trim() : null) ??
        (typeof profile.email === "string" && profile.email.trim().length > 0 ? `Garage (${profile.email.split("@")[0]})` : null) ??
        "Garage";

      const { data: createdGarage, error: createGarageError } = await supabaseAdmin
        .from("garages")
        .insert({
          owner_user_id: userId,
          garage_name: defaultName,
          contact_email: typeof profile.email === "string" ? profile.email : null,
          plan: "no_plan",
        })
        .select("id")
        .single();

      if (createGarageError) return res.status(500).json({ ok: false, error: "Failed to create garage" });
      dealerId = createdGarage?.id ?? null;
    }

    if (!dealerId) return res.status(500).json({ ok: false, error: "Failed to resolve dealer_id" });

    const { data: plan, error: planError } = await supabaseAdmin
      .from("dealer_plans")
      .select("id, code, active")
      .eq("code", planCode)
      .eq("active", true)
      .maybeSingle();

    if (planError) return res.status(500).json({ ok: false, error: "Failed to load dealer plan" });
    if (!plan?.id) return res.status(400).json({ ok: false, error: "Plan not found" });

    const endsAt = addDaysIso(durationDays);

    const { data: overrideRow, error: overrideError } = await supabaseAdmin
      .from("dealer_admin_overrides")
      .insert({
        dealer_id: dealerId,
        plan_id: plan.id,
        ends_at: endsAt,
        notes: `admin trial approval (${durationDays}d)`,
        created_by: session.user.id,
      })
      .select("id, dealer_id, plan_id, starts_at, ends_at")
      .single();

    if (overrideError) return res.status(500).json({ ok: false, error: "Failed to create admin override" });

    return res.status(200).json({ ok: true, override: overrideRow });
  } catch (e: unknown) {
    return res.status(500).json({ ok: false, error: getErrorMessage(e) });
  }
}