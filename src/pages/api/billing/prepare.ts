import type { NextApiRequest, NextApiResponse } from "next";
import { createPagesServerClient } from "@supabase/auth-helpers-nextjs";
import type { Database } from "@/integrations/supabase/types";
import { stripe } from "@/lib/stripe-server";
import { calculateTotal, getPlanDetails, type Plan } from "@/lib/buyauto/stripe_config";
import crypto from "crypto";

type ListingRow = Database["public"]["Tables"]["listings"]["Row"];

type PrepareBody = {
  listing_id?: string;
  plan?: Plan;
  premium?: boolean;
};

function getExpiresAt(durationDays: number | null): string | null {
  if (durationDays === null) return null;
  const date = new Date();
  date.setDate(date.getDate() + durationDays);
  return date.toISOString();
}

async function getOwnedListing(
  supabase: ReturnType<typeof createPagesServerClient<Database>>,
  listingId: string,
  userId: string
): Promise<ListingRow | null> {
  const { data: byUserId, error: byUserIdError } = await supabase
    .from("listings")
    .select("*")
    .eq("id", listingId)
    .eq("user_id", userId)
    .maybeSingle();

  if (byUserIdError) {
    console.error("prepare: listing fetch (user_id) error", byUserIdError);
  }
  if (byUserId) return byUserId;

  const { data: byCreatedBy, error: byCreatedByError } = await supabase
    .from("listings")
    .select("*")
    .eq("id", listingId)
    .eq("created_by", userId)
    .maybeSingle();

  if (byCreatedByError) {
    console.error("prepare: listing fetch (created_by) error", byCreatedByError);
  }

  return byCreatedBy ?? null;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  try {
    const supabase = createPagesServerClient<Database>({ req, res });
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError) {
      console.error("prepare: session error", sessionError);
      return res.status(401).json({ error: "Authentication failed" });
    }

    if (!session?.user) {
      return res.status(401).json({ error: "Unauthorized - Please log in" });
    }

    const body = (req.body ?? {}) as PrepareBody;
    const listingId = body.listing_id;
    const plan = body.plan;
    const premium = body.premium;

    if (!listingId || !plan || typeof premium !== "boolean") {
      return res.status(400).json({ error: "Missing required fields: listing_id, plan, premium" });
    }

    const validPlans: Plan[] = ["standard", "extended", "unlimited"];
    if (!validPlans.includes(plan)) {
      return res.status(400).json({ error: "Invalid plan specified" });
    }

    const listing = await getOwnedListing(supabase, listingId, session.user.id);
    if (!listing) {
      return res.status(404).json({ error: "Listing not found or you do not have permission to access it." });
    }

    const totalCHF = calculateTotal(plan, premium);
    const planDetails = getPlanDetails(plan);

    if (totalCHF === 0) {
      const { error: updateError } = await (supabase as any)
        .from("listings")
        .update({
          price_plan: plan,
          pricing_plan: plan,
          duration_days: planDetails.duration_days,
          expires_at: getExpiresAt(planDetails.duration_days),
          premium: false,
          premium_until: null,
          price_paid_chf: 0,
          payment_status: "paid",
        })
        .eq("id", listingId);

      if (updateError) {
        console.error("prepare: free plan listing update error", updateError);
        return res.status(500).json({ error: "Failed to update listing. Please try again." });
      }

      return res.status(200).json({ next: "continue", listing_id: listingId });
    }

    const amountInCents = Math.round(totalCHF * 100);

    const idempotencyKey = crypto
      .createHash("sha256")
      .update(`${listingId}-${plan}-${premium}-${session.user.id}`)
      .digest("hex");

    const paymentIntentParams = {
      amount: amountInCents,
      currency: "chf",
      automatic_payment_methods: { enabled: true },
      metadata: {
        listing_id: listingId,
        user_id: session.user.id,
        plan: plan,
        premium: String(premium),
      },
      statement_descriptor: "BUYAUTO",
    } as const;

    let paymentIntentIdToUpdate: string | null = null;
    if (listing.stripe_payment_intent_id && listing.payment_status === "requires_payment") {
      paymentIntentIdToUpdate = listing.stripe_payment_intent_id;
    }

    let paymentIntent;
    try {
      if (paymentIntentIdToUpdate) {
        try {
          paymentIntent = await stripe.paymentIntents.update(paymentIntentIdToUpdate, paymentIntentParams, { idempotencyKey });
        } catch (updateError) {
          console.warn("prepare: payment intent update failed, creating new", updateError);
          paymentIntent = await stripe.paymentIntents.create(paymentIntentParams, { idempotencyKey });
        }
      } else {
        paymentIntent = await stripe.paymentIntents.create(paymentIntentParams, { idempotencyKey });
      }
    } catch (stripeError: any) {
      console.error("prepare: stripe error", stripeError);
      const message =
        typeof stripeError?.message === "string" ? stripeError.message : "Payment processing failed. Please try again.";
      return res.status(500).json({ error: "Payment processing failed. Please try again.", details: message });
    }

    if (!paymentIntent?.client_secret) {
      console.error("prepare: missing client_secret on payment intent", { paymentIntentId: paymentIntent?.id });
      return res.status(500).json({ error: "Payment session could not be initialized. Please refresh and try again." });
    }

    const { error: updateError } = await (supabase as any)
      .from("listings")
      .update({
        price_plan: plan,
        pricing_plan: plan,
        duration_days: planDetails.duration_days,
        expires_at: getExpiresAt(planDetails.duration_days),
        premium: premium,
        premium_until: premium ? getExpiresAt(30) : null,
        price_paid_chf: totalCHF,
        payment_status: "requires_payment",
        stripe_payment_intent_id: paymentIntent.id,
      })
      .eq("id", listingId);

    if (updateError) {
      console.error("prepare: listing update error", updateError);
      return res.status(500).json({ error: "Failed to update listing. Please try again." });
    }

    return res.status(200).json({
      clientSecret: paymentIntent.client_secret,
      amount: totalCHF,
      currency: "CHF",
    });
  } catch (error: any) {
    console.error("prepare: unhandled error", error);
    return res.status(500).json({
      error: typeof error?.message === "string" ? error.message : "An unexpected error occurred.",
    });
  }
}