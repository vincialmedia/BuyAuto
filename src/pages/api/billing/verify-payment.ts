import { NextApiRequest, NextApiResponse } from "next";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).end();
  
  try {
    const { payment_intent_client_secret } = req.body;
    if (!payment_intent_client_secret) return res.status(400).json({ error: "Missing client secret" });

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
    const paymentIntentId = payment_intent_client_secret.split('_secret_')[0];
    if (!paymentIntentId) return res.status(400).json({ error: "Invalid client secret format" });

    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    if (paymentIntent.status !== 'succeeded') {
      return res.status(400).json({ error: "Payment not succeeded", status: paymentIntent.status });
    }

    const listingId = paymentIntent.metadata?.listing_id;
    if (!listingId) {
      return res.status(400).json({ error: "No listing_id in payment metadata" });
    }

    // Check current status
    const { data: listing, error: fetchError } = await supabaseAdmin
      .from("listings")
      .select("status, payment_status")
      .eq("id", listingId)
      .single();

    if (fetchError || !listing) {
      return res.status(404).json({ error: "Listing not found" });
    }

    // Force transition to pending if stuck in draft
    if (listing.status === "draft" || listing.payment_status !== "paid") {
      const { error: updateError } = await supabaseAdmin
        .from("listings")
        .update({
          status: "pending",
          payment_status: "paid",
          price_paid_chf: paymentIntent.amount / 100
        })
        .eq("id", listingId);

      if (updateError) {
        return res.status(500).json({ error: "Failed to update listing status" });
      }
      return res.status(200).json({ success: true, message: "Listing updated successfully to pending." });
    }

    return res.status(200).json({ success: true, message: "Listing already pending or paid." });

  } catch (err: any) {
    console.error("verify-payment error:", err);
    return res.status(500).json({ error: err.message || "Internal server error" });
  }
}