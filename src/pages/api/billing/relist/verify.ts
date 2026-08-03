import type { NextApiRequest, NextApiResponse } from "next";
import { createPagesServerClient } from "@supabase/auth-helpers-nextjs";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import { stripe } from "@/lib/stripe-server";
import { fulfillListingRelist } from "@/lib/billing/relist-fulfillment";

/**
 * Client-side fallback that reconciles a relist checkout right after the
 * seller returns from Stripe — the relist counterpart of
 * /api/billing/verify-payment. The Stripe webhook is the authoritative
 * fulfiller; this endpoint exists so a paid relist republishes even when the
 * webhook lags or is misconfigured. Written to be safe the same way:
 * authenticated, scoped to the caller's own listing, tied to a paid Checkout
 * Session whose metadata names that listing, and idempotent (only a listing
 * still in 'expired' is touched).
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  try {
    const { session_id } = (req.body ?? {}) as { session_id?: string };
    if (!session_id || typeof session_id !== "string" || !session_id.startsWith("cs_")) {
      return res.status(400).json({ error: "Missing or invalid session_id" });
    }

    // Require an authenticated session — this endpoint can mutate listing state.
    const supabase = createPagesServerClient<Database>({ req, res });
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session?.user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const checkoutSession = await stripe.checkout.sessions.retrieve(session_id);

    // Only relist checkouts are reconciled here, and only once Stripe reports
    // them paid — an open or expired session must not republish anything.
    if (checkoutSession.metadata?.kind !== "listing_relist") {
      return res.status(400).json({ error: "Not a relist checkout session" });
    }
    if (checkoutSession.payment_status !== "paid") {
      return res.status(400).json({ error: "Payment not completed", status: checkoutSession.payment_status });
    }

    const listingId = checkoutSession.metadata?.listing_id;
    if (!listingId) {
      return res.status(400).json({ error: "No listing_id in checkout metadata" });
    }

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Ownership: the caller must own the listing this checkout belongs to.
    const { data: listing, error: fetchError } = await supabaseAdmin
      .from("listings")
      .select("user_id, created_by")
      .eq("id", listingId)
      .single();

    if (fetchError || !listing) {
      return res.status(404).json({ error: "Listing not found" });
    }

    const isOwner = listing.user_id === session.user.id || listing.created_by === session.user.id;
    if (!isOwner) {
      return res.status(403).json({ error: "Forbidden" });
    }

    const relistPlan = typeof checkoutSession.metadata?.relist_plan === "string" ? checkoutSession.metadata.relist_plan : null;
    const result = await fulfillListingRelist(supabaseAdmin, listingId, relistPlan);

    if (result.outcome === "failed") {
      console.error("relist.verify: republish failed", { listingId, error: result.error });
      return res.status(500).json({ error: "Failed to republish listing" });
    }

    // 'skipped' is a success from the caller's perspective: the webhook (or an
    // earlier verify call) already republished it.
    return res.status(200).json({ success: true, outcome: result.outcome });
  } catch (err: unknown) {
    console.error("relist.verify error:", err);
    return res.status(500).json({ error: err instanceof Error ? err.message : "Internal server error" });
  }
}
