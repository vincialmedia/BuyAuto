import type { NextApiRequest, NextApiResponse } from "next";
import { createPagesServerClient } from "@supabase/auth-helpers-nextjs";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import { stripe } from "@/lib/stripe-server";

/**
 * Client-side fallback that reconciles a premium-upgrade checkout right after
 * the seller returns from Stripe — the premium counterpart of
 * /api/billing/relist/verify. The Stripe webhook is the authoritative
 * fulfiller; this endpoint exists so a paid boost is granted even when the
 * webhook lags or is misconfigured. Safe the same way: authenticated, scoped
 * to the caller's own listing, tied to a paid Checkout Session whose metadata
 * names that listing, and idempotent — apply_listing_premium_purchase dedupes
 * on the checkout session id, so webhook + verify can both run.
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

    if (checkoutSession.metadata?.kind !== "listing_premium_upgrade") {
      return res.status(400).json({ error: "Not a premium-upgrade checkout session" });
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

    const paidAmountCents = typeof checkoutSession.amount_total === "number" ? checkoutSession.amount_total : null;
    const amountChf = paidAmountCents ? Math.round(paidAmountCents / 100) : 30;

    // Same RPC as the webhook — idempotent per checkout session id, so a
    // webhook that already granted this boost makes this call a no-op.
    const { error: applyError } = await supabaseAdmin.rpc("apply_listing_premium_purchase", {
      stripe_checkout_session_id: checkoutSession.id,
      listing_id: listingId,
      user_id: typeof checkoutSession.metadata?.user_id === "string" ? checkoutSession.metadata.user_id : null,
      amount_chf: amountChf,
    });

    if (applyError) {
      console.error("premium-upgrade.verify: apply failed", { listingId, sessionId: checkoutSession.id, applyError });
      return res.status(500).json({ error: "Premium konnte nicht aktiviert werden. Bitte lade die Seite neu." });
    }

    // amount_chf lets the client report the conversion with the amount Stripe
    // actually charged, rather than re-deriving it from price config.
    return res.status(200).json({ success: true, amount_chf: amountChf });
  } catch (err: unknown) {
    console.error("premium-upgrade.verify error:", err);
    return res.status(500).json({ error: err instanceof Error ? err.message : "Internal server error" });
  }
}
