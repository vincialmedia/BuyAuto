import type { NextApiRequest, NextApiResponse } from "next";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

type ViewResponse =
  | { ok: true }
  | { ok: false; error: string };

function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

function getListingIdFromBody(body: unknown): string | null {
  if (!body || typeof body !== "object") return null;

  const rec = body as Record<string, unknown>;
  const candidate = rec.listing_id ?? rec.listingId ?? rec.id ?? null;
  return typeof candidate === "string" ? candidate : null;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse<ViewResponse>) {
  res.setHeader("Cache-Control", "no-store");

  if (req.method !== "POST") {
    res.status(405).json({ ok: false, error: "method_not_allowed" });
    return;
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    res.status(500).json({ ok: false, error: "supabase_env_missing" });
    return;
  }

  let body: unknown = req.body;

  if (typeof body === "string") {
    try {
      body = JSON.parse(body) as unknown;
    } catch {
      res.status(400).json({ ok: false, error: "invalid_json" });
      return;
    }
  }

  const listingId = getListingIdFromBody(body);
  if (!listingId || !isUuid(listingId)) {
    res.status(400).json({ ok: false, error: "invalid_listing_id" });
    return;
  }

  const supabase = createClient<Database>(url, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });

  const { error } = await supabase.rpc("increment_listing_view", { p_listing_id: listingId });
  if (error) {
    console.error("increment_listing_view failed:", { message: error.message, code: (error as any)?.code });
    res.status(500).json({ ok: false, error: "increment_failed" });
    return;
  }

  res.status(200).json({ ok: true });
}