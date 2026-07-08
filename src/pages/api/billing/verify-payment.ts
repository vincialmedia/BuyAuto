import { NextApiRequest, NextApiResponse } from "next";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";
import { createPagesServerClient } from "@supabase/auth-helpers-nextjs";
import type { Database } from "@/integrations/supabase/types";

/**
 * Client-side fallback that reconciles a listing's payment state right after the
 * buyer returns from Stripe. The Stripe webhook is the authoritative promoter;
 * this endpoint only exists to make the success screen feel instant. It is
 * therefore written to be safe: authenticated, scoped to the caller's own
 * listing, tied to that listing's current PaymentIntent, and strictly
 * non-destructive (it never overwrites a terminal paid/refunded state).
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).end();
  }

  try {
    const { payment_intent_client_secret } = req.body ?? {};
    if (!payment_intent_client_secret || typeof payment_intent_client_secret !== "string") {
      return res.status(400).json({ error: "Missing client secret" });
    }

    // Require an authenticated session — this endpoint can mutate listing state.
    const supabase = createPagesServerClient<Database>({ req, res });
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session?.user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
    if (!stripeSecretKey) {
      throw new Error("STRIPE_SECRET_KEY is not defined");
    }

    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: "2024-04-10" as any,
    });

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // client_secret format: pi_XXXX_secret_YYYY. Extract pi_XXXX
    const paymentIntentId = payment_intent_client_secret.split("_secret_")[0];
    if (!paymentIntentId || !paymentIntentId.startsWith("pi_")) {
      return res.status(400).json({ error: "Invalid client secret format" });
    }

    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    if (paymentIntent.status !== "succeeded") {
      return res.status(400).json({ error: "Payment not succeeded", status: paymentIntent.status });
    }

    const listingId = paymentIntent.metadata?.listing_id;
    if (!listingId) {
      return res.status(400).json({ error: "No listing_id in payment metadata" });
    }

    const { data: listing, error: fetchError } = await supabaseAdmin
      .from("listings")
      .select("status, payment_status, user_id, created_by, stripe_payment_intent_id")
      .eq("id", listingId)
      .single();

    if (fetchError || !listing) {
      return res.status(404).json({ error: "Listing not found" });
    }

    // Ownership: the caller must own the listing this PaymentIntent belongs to.
    const isOwner = listing.user_id === session.user.id || listing.created_by === session.user.id;
    if (!isOwner) {
      return res.status(403).json({ error: "Forbidden" });
    }

    // The PaymentIntent must be the one currently attached to this listing.
    // Prevents replaying an unrelated (or superseded) succeeded intent.
    if (listing.stripe_payment_intent_id && listing.stripe_payment_intent_id !== paymentIntentId) {
      return res.status(409).json({ error: "PaymentIntent does not match this listing." });
    }

    // Idempotent + non-destructive: never clobber a terminal state.
    if (listing.payment_status === "refunded") {
      return res.status(200).json({ success: true, message: "Listing already refunded." });
    }
    if (listing.payment_status === "paid") {
      return res.status(200).json({ success: true, message: "Listing already paid." });
    }

    // Promote: mark paid, and move a draft into review. Do not touch listings
    // that are already past draft (the webhook owns richer transitions).
    const update: { payment_status: "paid"; price_paid_chf: number; status?: "pending" } = {
      payment_status: "paid",
      price_paid_chf: Math.round(paymentIntent.amount / 100),
    };
    if (listing.status === "draft") {
      update.status = "pending";
    }

    const { error: updateError } = await supabaseAdmin
      .from("listings")
      .update(update)
      .eq("id", listingId);

    if (updateError) {
      return res.status(500).json({ error: "Failed to update listing status" });
    }

    return res.status(200).json({ success: true, message: "Listing updated to paid." });
  } catch (err: any) {
    console.error("verify-payment error:", err);
    return res.status(500).json({ error: err.message || "Internal server error" });
  }
}
