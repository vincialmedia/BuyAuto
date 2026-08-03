import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import { stripe } from "@/lib/stripe-server";

/** Stripe only accepts these three values for `refunds.create({ reason })`. */
export type RefundReason = "duplicate" | "fraudulent" | "requested_by_customer";

export type RefundResult =
  | { outcome: "refunded"; refundId: string }
  | { outcome: "already_refunded" }
  /** Free listing, or one that never completed payment — nothing to give back. */
  | { outcome: "not_eligible" }
  | { outcome: "not_found" }
  | { outcome: "failed"; error: string };

/**
 * Refund a listing's payment, server-side, with the service-role client.
 *
 * Idempotent and safe to call for any listing: an already-refunded listing
 * short-circuits on the stored `stripe_refund_id`, and a free or unpaid one
 * returns `not_eligible` without touching Stripe. Never throws — a caller that
 * must not lose the refund outcome gets it in the return value.
 *
 * This lives outside the API routes because a rejection can be triggered from
 * several places in the admin UI, and every one of them has to give the money
 * back. Routing them all through one server-side function is what makes that
 * true regardless of which button the admin pressed.
 */
export async function refundListingIfPaid(
  supabaseAdmin: SupabaseClient<Database>,
  listingId: string,
  reason: RefundReason = "requested_by_customer"
): Promise<RefundResult> {
  try {
    const { data: listing, error: listingError } = await supabaseAdmin
      .from("listings")
      .select("stripe_payment_intent_id, payment_status, stripe_refund_id")
      .eq("id", listingId)
      .maybeSingle<{
        stripe_payment_intent_id: string | null;
        payment_status: string | null;
        stripe_refund_id: string | null;
      }>();

    if (listingError) return { outcome: "failed", error: listingError.message };
    if (!listing) return { outcome: "not_found" };

    if (listing.stripe_refund_id) return { outcome: "already_refunded" };

    // A CHF 0 listing is recorded as payment_status='paid' with no
    // PaymentIntent, so the intent — not the status — is what says whether real
    // money moved.
    if (listing.payment_status !== "paid" || !listing.stripe_payment_intent_id) {
      return { outcome: "not_eligible" };
    }

    const refund = await stripe.refunds.create({
      payment_intent: listing.stripe_payment_intent_id,
      reason,
    });

    // The paid placement goes back with the money — but only the premium this
    // payment granted: the plan-included placement (Verlängert/Unlimitiert) or
    // a boost bought in the same checkout, both readable from the intent's
    // metadata. Premium from other sources — a standalone premium purchase, a
    // garage credit — was not part of this charge and survives the refund. If
    // the metadata cannot be read, premium is left untouched rather than
    // clobbering a grant that may have been paid for separately.
    let revokePremium = false;
    try {
      const intent = await stripe.paymentIntents.retrieve(listing.stripe_payment_intent_id);
      const plan = typeof intent.metadata?.plan === "string" ? intent.metadata.plan : null;
      revokePremium =
        intent.metadata?.premium === "true" ||
        intent.metadata?.premium_included === "true" ||
        plan === "extended" ||
        plan === "unlimited";
    } catch (metadataError) {
      console.warn(`refundListingIfPaid: could not read intent metadata for ${listingId}; premium left as-is`, metadataError);
    }

    // Service role, so the premium-authority trigger permits the revocation.
    const { error: updateError } = await supabaseAdmin
      .from("listings")
      .update({
        stripe_refund_id: refund.id,
        refunded_at: new Date().toISOString(),
        payment_status: "refunded",
        ...(revokePremium ? { premium: false, is_premium: false, premium_until: null } : {}),
      })
      .eq("id", listingId);

    // The money is already back with the seller at this point, so the refund
    // itself succeeded — but the row no longer records it, which would let a
    // later call refund a second time. Report it as a failure so the caller
    // stops rather than proceeding on a half-written state.
    if (updateError) {
      return {
        outcome: "failed",
        error: `Refund ${refund.id} succeeded but could not be recorded: ${updateError.message}`,
      };
    }

    return { outcome: "refunded", refundId: refund.id };
  } catch (e) {
    return { outcome: "failed", error: e instanceof Error ? e.message : "Refund request failed" };
  }
}
