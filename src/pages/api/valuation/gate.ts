import type { NextApiRequest, NextApiResponse } from "next";
import { createPagesServerClient } from "@supabase/auth-helpers-nextjs";
import {
  clientIp,
  logValuationEvent,
  readLogContext,
  type ValuationLogStatus,
} from "@/lib/buyauto/valuationLog";

// Records that the calculator blocked an automatic search: the anonymous
// 3-search wall (the sign-up moment) or a logged-in quota limit (the upgrade
// moment). The calculator enforces those gates client-side, so without this
// call they never reach the server. Write-only, always 204.

const GATE_STATUS: Record<string, ValuationLogStatus> = {
  anon: "gate_anon",
  free_plan: "gate_free",
  paid_limit: "gate_paid",
};

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
  const status = typeof input.kind === "string" ? GATE_STATUS[input.kind] : undefined;
  if (!status || rateLimited(clientIp(req) ?? "unknown")) {
    return res.status(204).end();
  }

  const year = Number(input.year);
  const km = Number(input.km);
  const vehicle = {
    make: typeof input.make === "string" ? input.make.trim().slice(0, 40) : "",
    model: typeof input.model === "string" ? input.model.trim().slice(0, 60) : "",
    year: Number.isFinite(year) && year > 0 ? year : null,
    km: Number.isFinite(km) && km > 0 ? km : null,
  };

  try {
    const supabase = createPagesServerClient({ req, res });
    const {
      data: { user },
    } = await supabase.auth.getUser();
    await logValuationEvent({ status, vehicle, ctx: readLogContext(req, input), userId: user?.id });
  } catch (e) {
    console.error("valuation gate log failed", e);
  }
  return res.status(204).end();
}
