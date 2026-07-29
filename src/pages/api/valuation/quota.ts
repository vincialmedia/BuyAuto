import type { NextApiRequest, NextApiResponse } from "next";
import { createPagesServerClient } from "@supabase/auth-helpers-nextjs";
import { peekQuota } from "@/lib/buyauto/valuationQuota";

// Read-only view of the caller's current monthly search quota — for showing
// "X / limit" before they run a search. Never consumes. Anonymous callers get
// authenticated:false and the client falls back to its localStorage counter.
// Reuses peekQuota so the plan/limit logic can never drift from the comps route.
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

    const quota = await peekQuota(supabase, user.id);
    return res.status(200).json({
      authenticated: true,
      used: quota.used,
      limit: quota.limit,
      remaining: quota.remaining,
      plan: quota.plan,
    });
  } catch (e) {
    console.error("valuation quota (read) failed", e);
    return res.status(200).json({ authenticated: false });
  }
}
