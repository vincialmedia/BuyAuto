import type { SupabaseClient } from "@supabase/supabase-js";

export type RelistFulfillmentResult =
  | { outcome: "republished"; plan: "keep" | "extended" }
  | { outcome: "skipped"; reason: string }
  | { outcome: "failed"; error: unknown };

function addDaysIso(baseIso: string, days: number): string | null {
  const ms = Date.parse(baseIso);
  if (!Number.isFinite(ms)) return null;
  return new Date(ms + days * 24 * 60 * 60 * 1000).toISOString();
}

/**
 * Fulfils a paid relist checkout (metadata kind 'listing_relist'): republishes
 * the expired listing.
 *
 *  - keep (standard relist): the listing keeps its plan and runs another full
 *    duration_days window (Verlängert 90, Standard 60); a Verlängert listing
 *    renews with its included premium for the whole new runtime.
 *  - extended (upgrade relist): the listing becomes Verlängert — 90 days with
 *    premium for the whole runtime.
 *
 * Shared by the Stripe webhook and the client-return verify endpoint so both
 * paths apply the identical write. Idempotent: only a listing still in
 * 'expired' is touched, re-checked on the write itself so a webhook/verify
 * race cannot double-apply. Must run with the service role — the premium- and
 * status-authority triggers reject owners making these writes.
 */
export async function fulfillListingRelist(
  supabaseAdmin: SupabaseClient,
  listingId: string,
  relistPlan: string | null
): Promise<RelistFulfillmentResult> {
  const { data: listing } = await supabaseAdmin
    .from("listings")
    .select("status, duration_days, price_plan")
    .eq("id", listingId)
    .single();

  if (!listing) {
    return { outcome: "skipped", reason: "listing_not_found" };
  }

  // Idempotency: only an expired listing gets republished. A retried webhook
  // delivery or a duplicate verify call sees 'published' and does nothing.
  if (listing.status !== "expired") {
    return { outcome: "skipped", reason: `listing_is_${listing.status}` };
  }

  const nowIso = new Date().toISOString();
  const upgradeToExtended = relistPlan === "extended";

  if (upgradeToExtended) {
    // Paid relist-upsell: the listing becomes Verlängert — 90 days with
    // premium for the whole runtime.
    const expiresAt = addDaysIso(nowIso, 90);
    const { error: upgradeError } = await supabaseAdmin
      .from("listings")
      .update({
        status: "published",
        price_plan: "extended",
        pricing_plan: "extended",
        duration_days: 90,
        expires_at: expiresAt,
        premium: true,
        is_premium: true,
        premium_until: expiresAt,
        updated_at: nowIso,
      })
      .eq("id", listingId)
      .eq("status", "expired");

    if (upgradeError) {
      return { outcome: "failed", error: upgradeError };
    }
  } else {
    const durationDays = typeof listing.duration_days === "number" ? listing.duration_days : 60;
    const keepExpiresAt = addDaysIso(nowIso, durationDays);

    // A Verlängert listing renews with its plan perks: premium placement is
    // included for the whole (new) runtime.
    const keepUpdate: Record<string, unknown> = {
      status: "published",
      expires_at: keepExpiresAt,
      updated_at: nowIso,
    };
    if (listing.price_plan === "extended") {
      keepUpdate.premium = true;
      keepUpdate.is_premium = true;
      keepUpdate.premium_until = keepExpiresAt;
    }

    const { error: relistError } = await supabaseAdmin
      .from("listings")
      .update(keepUpdate)
      .eq("id", listingId)
      .eq("status", "expired");

    if (relistError) {
      return { outcome: "failed", error: relistError };
    }
  }

  // Reset the expiry-reminder dedupe for the new runtime: the unique key is
  // per (kind, entity, days_before, recipient), so last cycle's rows would
  // suppress every reminder before the next expiry.
  await supabaseAdmin
    .from("email_notification_log")
    .delete()
    .eq("kind", "listing_expiry_reminder")
    .eq("entity_id", listingId);

  return { outcome: "republished", plan: upgradeToExtended ? "extended" : "keep" };
}
