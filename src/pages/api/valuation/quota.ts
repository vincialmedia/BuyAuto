import type { NextApiRequest, NextApiResponse } from "next";
import { createPagesServerClient } from "@supabase/auth-helpers-nextjs";
import {
  FREE_MONTHLY_LIMIT,
  PAID_MONTHLY_LIMIT,
  type QuotaPlan,
} from "@/lib/buyauto/valuationQuota";

// Read-only view of the caller's current monthly search quota — for showing
// "X / limit" before they run a search. Never consumes. Anonymous callers get
// authenticated:false and the client falls back to its localStorage counter.
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const supabase = createPagesServerClient({ req, res });
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return res.status(200).json({ authenticated: false });
    }

    // Resolve the plan-based limit (mirror of resolveLimit; fails open to paid).
    let limit = FREE_MONTHLY_LIMIT;
    let plan: QuotaPlan = "free";
    try {
      const { data: garage } = await supabase
        .from("garages")
        .select("id, plan")
        .eq("owner_user_id", user.id)
        .maybeSingle();

      if (garage) {
        const planField = (garage.plan ?? "").toString().trim().toLowerCase();
        const nowIso = new Date().toISOString();
        let paid = Boolean(planField && planField !== "no_plan");

        if (!paid) {
          const { data: sub } = await supabase
            .from("dealer_subscriptions")
            .select("id")
            .eq("dealer_id", garage.id)
            .eq("status", "active")
            .gt("current_period_end", nowIso)
            .limit(1)
            .maybeSingle();
          paid = Boolean(sub);
        }
        if (!paid) {
          const { data: override } = await supabase
            .from("dealer_admin_overrides")
            .select("id")
            .eq("dealer_id", garage.id)
            .gt("ends_at", nowIso)
            .limit(1)
            .maybeSingle();
          paid = Boolean(override);
        }
        if (paid) {
          limit = PAID_MONTHLY_LIMIT;
          plan = "paid";
        }
      }
    } catch (e) {
      console.error("valuation quota (read): plan detection failed, failing open (paid)", e);
      limit = PAID_MONTHLY_LIMIT;
      plan = "paid";
    }

    const { data: usedData, error } = await supabase.rpc("get_valuation_usage");
    const used = error ? 0 : Number(usedData ?? 0);

    return res.status(200).json({
      authenticated: true,
      used,
      limit,
      remaining: Math.max(0, limit - used),
      plan,
    });
  } catch (e) {
    console.error("valuation quota (read) failed", e);
    return res.status(200).json({ authenticated: false });
  }
}
