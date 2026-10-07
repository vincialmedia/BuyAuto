import type { NextApiRequest, NextApiResponse } from "next";
import { createPagesServerClient } from "@supabase/auth-helpers-nextjs";
import { peekQuota } from "@/lib/buyauto/valuationQuota";
import { clientIp, logValuationEvent, readLogContext } from "@/lib/buyauto/valuationLog";

// Records that the calculator blocked an automatic search: the anonymous
// 3-search wall (the sign-up moment) or a logged-in quota limit (the upgrade
// moment). The calculator enforces those gates client-side, so without this
// call they never reach the server. Write-only, always 204.
//
// Only what the server can check is trusted: a quota gate is logged only for
// a signed-in user whose quota really is used up (and its kind comes from the
// server), an anonymous gate only without a session. The anonymous counter
// lives in localStorage, so gate_anon rows are the browser's word; the RPC
// caps them per visitor and day.

// Same best-effort per-instance soft cap as the comps route.
const RATE_LIMIT = 30;
const RATE_WINDOW_MS = 60 * 60 * 1000;
const rateMap = new Map<string, { count: number; reset: number }>();

function rateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = rateMap.get(ip);
  if (!entry || now > entry.reset) {
    rateMap.set(ip, { count: 1, reset: now + RATE_WINDOW_MS });
    return false;
  }
  entry.count += 1;
  return entry.count > RATE_LIMIT;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const input = (req.body ?? {}) as Record<string, unknown>;
  const kind = input.kind;
  if (
    (kind !== "anon" && kind !== "free_plan" && kind !== "paid_limit") ||
    rateLimited(clientIp(req) ?? "unknown")
  ) {
    return res.status(204).end();
  }

  // Same bounds as the comps route; anything outside them is stored as null.
  const year = Number(input.year);
  const km = Number(input.km);
  const vehicle = {
    make: typeof input.make === "string" ? input.make.trim().slice(0, 40) : "",
    model: typeof input.model === "string" ? input.model.trim().slice(0, 60) : "",
    year: Number.isInteger(year) && year >= 1980 && year <= new Date().getFullYear() + 1 ? year : null,
    km: Number.isFinite(km) && km > 0 && km <= 500_000 ? km : null,
  };

  try {
    const supabase = createPagesServerClient({ req, res });
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (kind === "anon") {
      // A signed-in user never sees the anonymous wall.
      if (user) return res.status(204).end();
      await logValuationEvent({ status: "gate_anon", vehicle, ctx: readLogContext(req, input) });
    } else {
      if (!user) return res.status(204).end();
      const peek = await peekQuota(supabase, user.id);
      if (peek.allowed) return res.status(204).end();
      await logValuationEvent({
        status: peek.plan === "paid" ? "gate_paid" : "gate_free",
        vehicle,
        ctx: readLogContext(req, input),
        userId: user.id,
      });
    }
  } catch (e) {
    console.error("valuation gate log failed", e);
  }
  return res.status(204).end();
}
