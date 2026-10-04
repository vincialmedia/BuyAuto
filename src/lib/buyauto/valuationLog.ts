import type { NextApiRequest } from "next";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// Attribution for valuation_search_logs: who ran (or was blocked from) an
// Eintauschwert-Rechner search, from which page, in which build. Written via
// log_valuation_event(), which only the service role may call, so rows only
// come from our API routes. The page fields (source, embed_garage, visitor_id,
// internal) are still reported by the browser unauthenticated. See
// supabase/migrations/20261004160000_valuation_search_attribution.sql and
// docs/valuation-search-logs.md.

export type ValuationLogStatus = "ok" | "search_failed" | "gate_anon" | "gate_free" | "gate_paid";
export type ValuationSource = "public" | "dashboard" | "embed" | "other";

const SOURCES: readonly string[] = ["public", "dashboard", "embed", "other"];
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const SLUG_RE = /^[a-z0-9][a-z0-9-]{0,79}$/i;

export interface ValuationLogContext {
  source: ValuationSource | null;
  embedGarage: string | null;
  /** Per-browser id; the calculator only sends it after analytics consent. */
  visitorId: string | null;
  /** The browser flagged itself as the owner's (ba_no_track / via vercel.com). */
  internal: boolean;
  ip: string | null;
  userAgent: string | null;
}

/** The caller's IP as Vercel reports it (it overwrites x-forwarded-for). */
export function clientIp(req: NextApiRequest): string | null {
  const fwd = req.headers["x-forwarded-for"];
  const first = typeof fwd === "string" ? fwd.split(",")[0].trim() : "";
  return first || req.socket.remoteAddress || null;
}

/**
 * Reads the attribution fields the calculator sends with each request. They
 * come from the browser, so anything malformed is dropped rather than rejected.
 */
export function readLogContext(req: NextApiRequest, input: Record<string, unknown>): ValuationLogContext {
  const source = typeof input.source === "string" && SOURCES.includes(input.source)
    ? (input.source as ValuationSource)
    : null;
  const garage = typeof input.embedGarage === "string" ? input.embedGarage.trim() : "";
  const visitorId = typeof input.visitorId === "string" ? input.visitorId.trim() : "";
  const userAgent = typeof req.headers["user-agent"] === "string" ? req.headers["user-agent"].slice(0, 400) : null;
  return {
    source,
    embedGarage: source === "embed" && SLUG_RE.test(garage) ? garage.toLowerCase() : null,
    visitorId: UUID_RE.test(visitorId) ? visitorId.toLowerCase() : null,
    internal: input.internal === true,
    ip: clientIp(req),
    userAgent,
  };
}

function deploymentEnv(): "production" | "preview" | "development" | "local" {
  const env = process.env.VERCEL_ENV;
  return env === "production" || env === "preview" || env === "development" ? env : "local";
}

let serviceClient: SupabaseClient | null | undefined;
function getServiceClient(): SupabaseClient | null {
  if (serviceClient !== undefined) return serviceClient;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  serviceClient = url && key ? createClient(url, key, { auth: { persistSession: false } }) : null;
  return serviceClient;
}

/**
 * Writes one row. Diagnostics only: never throws and never blocks the
 * response on a logging failure. Await it before responding — a serverless
 * function may be frozen as soon as the response is sent.
 */
export async function logValuationEvent(args: {
  status: ValuationLogStatus;
  vehicle: Record<string, unknown>;
  funnel?: unknown;
  ctx: ValuationLogContext;
  userId?: string | null;
}): Promise<void> {
  const client = getServiceClient();
  if (!client) return;
  try {
    let isAdmin = false;
    if (args.userId) {
      const { data } = await client.from("profiles").select("role").eq("id", args.userId).maybeSingle();
      isAdmin = data?.role === "admin";
    }
    const { error } = await client.rpc("log_valuation_event", {
      p_status: args.status,
      p_vehicle: args.vehicle,
      p_funnel: args.funnel ?? null,
      p_source: args.ctx.source,
      p_embed_garage: args.ctx.embedGarage,
      p_env: deploymentEnv(),
      p_user_id: args.userId ?? null,
      p_visitor_id: args.ctx.visitorId,
      p_ip: args.ctx.ip,
      p_user_agent: args.ctx.userAgent,
      p_is_internal: args.ctx.internal || isAdmin,
    });
    if (error) console.error("valuation log failed:", error.message);
  } catch (e) {
    console.error("valuation log failed:", e);
  }
}
