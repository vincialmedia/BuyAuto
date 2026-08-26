import type { NextApiRequest, NextApiResponse } from "next";
import { createPagesServerClient } from "@supabase/auth-helpers-nextjs";
import type { Database } from "@/integrations/supabase/types";
import { stripe } from "@/lib/stripe-server";
import { calculateTotal, getPlanDetails, planIncludesPremium, type Plan } from "@/lib/buyauto/stripe_config";
import crypto from "crypto";

type ListingRow = Database["public"]["Tables"]["listings"]["Row"];

type PrepareBody = {
  listing_id?: string;
  plan?: Plan;
  premium?: boolean;
  donation_enabled?: boolean;
  donation_amount_chf?: number;
  /**
   * Upgrade the package of an already-paid listing. Content edits never touch
   * the runtime — only this paid flow re-anchors expires_at to the new plan.
   */
  plan_change?: boolean;
};

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

    const donationEnabled = body.donation_enabled ?? false;
    const rawDonationAmount = body.donation_amount_chf;

    const normalizeDonation = (): { enabled: boolean; amount: number } => {
      if (donationEnabled !== true) return { enabled: false, amount: 0 };
      const n =
        typeof rawDonationAmount === "number"
          ? rawDonationAmount
          : typeof rawDonationAmount === "string"
            ? Number(rawDonationAmount)
            : NaN;
      const normalized = Number.isFinite(n) ? Math.round(n) : 5;
      const clamped = Math.min(200, Math.max(1, normalized));
      return { enabled: true, amount: clamped };
    };

    const donation = normalizeDonation();

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

    const isPlanChange = body.plan_change === true;

    if (isPlanChange) {
      // Plan change: an already-paid listing upgrades to a bigger package.
      // Nothing on the listing moves here — the paid state, current plan and
      // runtime stay untouched until the upgrade payment lands (the webhook /
      // verify-payment fulfillment applies the new plan and re-anchors the
      // expiry). Only upgrades exist: standard→extended, standard→unlimited,
      // extended→unlimited.
      if (listing.payment_status !== "paid") {
        return res
          .status(409)
          .json({ error: "Ein Planwechsel ist nur für bereits bezahlte Inserate möglich." });
      }
      const currentPlan = listing.price_plan ?? "standard";
      if (plan === "standard") {
        return res.status(400).json({ error: "Ein Wechsel auf das Gratis-Inserat ist nicht möglich." });
      }
      if (currentPlan === plan) {
        return res.status(400).json({ error: "Dieses Inserat nutzt diesen Plan bereits." });
      }
      if (currentPlan === "unlimited") {
        return res.status(400).json({ error: "Das Unlimitiert-Paket kann nicht gewechselt werden." });
      }
      const blockedStatuses = ["sold", "archived", "expired", "rejected"];
      if (blockedStatuses.includes(String(listing.status))) {
        // Expired listings revive through the relist flow, which also resets
        // the status — a plan change here would take money without making the
        // listing visible again.
        return res.status(409).json({ error: "Für dieses Inserat ist kein Planwechsel mehr möglich." });
      }
    } else if (listing.payment_status === "paid" || listing.payment_status === "refunded") {
      // Guard: the initial-publish payment flow must never re-charge or wipe the
      // payment record of a listing that is already paid/refunded. Without this,
      // the free-plan path below silently knocks a paid listing back to 'pending'
      // and a paid listing can be charged a second time. (Premium upgrades run
      // through their own endpoint, not this one.)
      return res
        .status(409)
        .json({ error: "Dieses Inserat wurde bereits bezahlt und kann nicht erneut bezahlt werden." });
    }

    // calculateTotal charges the boost only where it isn't already included in
    // the plan (Verlängert/Unlimitiert ship with premium placement).
    const totalCHF = calculateTotal(plan, premium) + donation.amount;
    const planDetails = getPlanDetails(plan);
    const premiumIncluded = planIncludesPremium(plan);

    // listings.premium is never written here: this endpoint runs under the
    // caller's session and the premium-authority trigger rejects owners. The
    // premium choice travels in the PaymentIntent metadata and the Stripe
    // webhook (service role) grants it after payment.
    if (totalCHF === 0) {
      // Unreachable for plan changes (both target plans are paid), but the
      // free path below rewrites the whole payment record — never let it run
      // against an already-paid listing.
      if (isPlanChange) {
        return res.status(400).json({ error: "Ungültiger Planwechsel." });
      }
      const { error: updateError } = await (supabase as any)
        .from("listings")
        .update({
          price_plan: plan,
          // Dual-write until the legacy column drop: the live trigger
          // ensure_listing_expiry_defaults resolves the plan legacy-first
          // (coalesce(NEW.pricing_plan, NEW.price_plan)), so a plan change that
          // leaves a stale pricing_plan behind would compute the wrong expiry.
          pricing_plan: plan,
          duration_days: planDetails.duration_days,
          // expires_at is deliberately NOT set here: the listing goes to 'pending'
          // and the paid window must not start ticking while it waits for review.
          // set_listing_expires_at anchors it from duration_days at publication.
          // Premium is not touched here either — a free plan simply never grants
          // it, and clearing it from a user session is a write the premium
          // authority trigger rejects.
          price_paid_chf: 0,
          payment_status: "paid",
          status: "pending",
          stripe_payment_intent_id: null,
        })
        .eq("id", listingId);

      if (updateError) {
        console.error("prepare: free plan listing update error", updateError);
        return res.status(500).json({ error: "Failed to update listing. Please try again." });
      }

      return res.status(200).json({ next: "continue", listing_id: listingId });
    }

    const amountInCents = Math.round(totalCHF * 100);

    // The key includes the computed total and a version marker: Stripe rejects
    // a reused key whose request parameters changed, so whenever pricing logic
    // moves (e.g. premium becoming plan-included changed the total for the
    // same inputs) the key must move with it — otherwise users with an
    // in-flight pre-deploy intent are hard-blocked for the key's ~24h TTL.
    // Update and create also get distinct keys: Stripe idempotency keys are
    // account-global, and replaying an update's key against create errors.
    // Plan changes get their own key space ("pc"): the same listing/plan/user
    // combination must never collide with an initial-publish intent.
    const idemBase = crypto
      .createHash("sha256")
      .update(
        `v2-${isPlanChange ? "pc-" : ""}${listingId}-${plan}-${premium}-${donation.amount}-${totalCHF}-${session.user.id}`
      )
      .digest("hex");

    const paymentIntentBaseParams = {
      amount: amountInCents,
      currency: "chf",
      metadata: {
        listing_id: listingId,
        user_id: session.user.id,
        plan: plan,
        premium: String(premium && !premiumIncluded),
        premium_included: String(premiumIncluded),
        donation_enabled: String(donation.enabled),
        donation_amount_chf: String(donation.amount),
        // The webhook and verify-payment dispatch fulfillment on this marker;
        // without it a succeeded intent runs the initial-publish promotion.
        ...(isPlanChange ? { kind: "plan_change" } : {}),
      },
      statement_descriptor: "BUYAUTO",
    } as const;

    // Never for plan changes: their payment_status is 'paid', so the stored
    // intent is the original (already succeeded) publish intent, which Stripe
    // refuses to update. Plan changes always create, deduped by the idem key.
    let paymentIntentIdToUpdate: string | null = null;
    if (listing.stripe_payment_intent_id && listing.payment_status === "requires_payment") {
      paymentIntentIdToUpdate = listing.stripe_payment_intent_id;
    }

    let paymentIntent;
    try {
      if (paymentIntentIdToUpdate) {
        try {
          // automatic_payment_methods is create-only; passing it to update is
          // rejected by Stripe and used to force every re-preparation through
          // the create fallback.
          paymentIntent = await stripe.paymentIntents.update(paymentIntentIdToUpdate, paymentIntentBaseParams, {
            idempotencyKey: `${idemBase}-u`,
          });
        } catch (updateError) {
          console.warn("prepare: payment intent update failed, creating new", updateError);
          paymentIntent = await stripe.paymentIntents.create(
            { ...paymentIntentBaseParams, automatic_payment_methods: { enabled: true } },
            { idempotencyKey: `${idemBase}-c` }
          );
        }
      } else {
        paymentIntent = await stripe.paymentIntents.create(
          { ...paymentIntentBaseParams, automatic_payment_methods: { enabled: true } },
          { idempotencyKey: `${idemBase}-c` }
        );
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

    // Premium is deliberately NOT written here. This runs when the PaymentIntent is
    // created — i.e. before the card is charged — so granting it now would hand
    // premium to anyone who opens the payment form and then walks away. The
    // intent's `premium` metadata is the instruction; the webhook grants it for
    // real on payment_intent.succeeded. (trg_enforce_listing_premium_authority
    // also rejects premium writes made from a user session, so this endpoint
    // could not grant it even if it tried.)
    const listingUpdate = isPlanChange
      ? // Plan change: only attach the new intent so the fulfillment can match
        // it. The listing stays 'paid' on its current plan and keeps its
        // expiry — abandoning this checkout must leave it exactly as it was.
        { stripe_payment_intent_id: paymentIntent.id }
      : {
          price_plan: plan,
          // Dual-write until the legacy column drop (see the free-plan path above).
          pricing_plan: plan,
          duration_days: planDetails.duration_days,
          // No expires_at here either — see the free-plan path above. The clock
          // starts when the listing is published, not when checkout opens.
          price_paid_chf: totalCHF,
          payment_status: "requires_payment",
          stripe_payment_intent_id: paymentIntent.id,
        };

    const { error: updateError } = await (supabase as any)
      .from("listings")
      .update(listingUpdate)
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