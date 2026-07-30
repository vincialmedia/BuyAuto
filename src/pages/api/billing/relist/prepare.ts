import type { NextApiRequest, NextApiResponse } from "next";
import { createPagesServerClient } from "@supabase/auth-helpers-nextjs";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import { stripe } from "@/lib/stripe-server";
import { RELIST_PRICE_CHF, RELIST_PROMO_ACTIVE, pricingPlans } from "@/lib/buyauto/stripe_config";

/**
 * Relists an expired listing.
 *
 * Two paid variants, fulfilled by the webhook (checkout.session.completed,
 * kind 'listing_relist'):
 *  - standard relist: CHF 30, listing keeps its plan and runtime
 *  - upgrade relist:  CHF 50, listing becomes Verlängert — 90 days + premium
 *    for the whole runtime (the expired-listing upsell)
 *
 * Promo mode (RELIST_PROMO_ACTIVE): republishes directly and free — ownership
 * and the expired-status guard still apply, and the republish runs with the
 * service role because the status-authority trigger blocks owners setting
 * 'published' on a private listing themselves.
 */

type ListingRow = Pick<
  Database["public"]["Tables"]["listings"]["Row"],
  "id" | "user_id" | "created_by" | "status" | "brand" | "model" | "duration_days"
>;

type PrepareBody = {
  listing_id?: string;
  /** true = relist as Verlängert (90 days + premium) for the plan price. */
  upgrade?: boolean;
};

function safeString(input: unknown): string | null {
  if (typeof input === "string" && input.trim().length > 0) return input;
  return null;
}

function firstHeaderValue(value: string | string[] | undefined): string | null {
  const raw = Array.isArray(value) ? value[0] : value;
  if (!raw) return null;
  const first = raw.split(",")[0]?.trim();
  return first && first.length > 0 ? first : null;
}

function getRequestOrigin(req: NextApiRequest): string {
  const originHeader = firstHeaderValue(req.headers.origin);
  if (originHeader && /^https?:\/\//i.test(originHeader)) return originHeader;

  const proto = firstHeaderValue(req.headers["x-forwarded-proto"]);
  const host = firstHeaderValue(req.headers["x-forwarded-host"] ?? req.headers.host);

  if (host && proto) return `${proto}://${host}`;
  if (host) return `https://${host}`;
  return "http://localhost:3000";
}

async function getOwnedListing(
  supabase: ReturnType<typeof createPagesServerClient<Database>>,
  listingId: string,
  userId: string
): Promise<ListingRow | null> {
  const { data: byUserId, error: byUserIdError } = await supabase
    .from("listings")
    .select("id, user_id, created_by, status, brand, model, duration_days")
    .eq("id", listingId)
    .eq("user_id", userId)
    .maybeSingle();

  if (byUserIdError) {
    console.error("relist.prepare: listing fetch (user_id) error", byUserIdError);
  }
  if (byUserId) return byUserId as ListingRow;

  const { data: byCreatedBy, error: byCreatedByError } = await supabase
    .from("listings")
    .select("id, user_id, created_by, status, brand, model, duration_days")
    .eq("id", listingId)
    .eq("created_by", userId)
    .maybeSingle();

  if (byCreatedByError) {
    console.error("relist.prepare: listing fetch (created_by) error", byCreatedByError);
  }

  return (byCreatedBy as ListingRow | null) ?? null;
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
      console.error("relist.prepare: session error", sessionError);
      return res.status(401).json({ error: "Authentication failed" });
    }

    if (!session?.user) {
      return res.status(401).json({ error: "Unauthorized - Please log in" });
    }

    const body = (req.body ?? {}) as PrepareBody;
    const listingId = safeString(body.listing_id);
    const upgrade = body.upgrade === true;

    if (!listingId) {
      return res.status(400).json({ error: "Missing required field: listing_id" });
    }

    const listing = await getOwnedListing(supabase, listingId, session.user.id);
    if (!listing) {
      return res.status(404).json({ error: "Listing not found or you do not have permission to access it." });
    }

    if (listing.status !== "expired") {
      return res.status(400).json({ error: "Nur abgelaufene Inserate können wieder veröffentlicht werden." });
    }

    if (RELIST_PROMO_ACTIVE) {
      const supabaseAdmin = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      );

      const durationDays = typeof listing.duration_days === "number" ? listing.duration_days : 60;
      const nowIso = new Date().toISOString();
      const expiresAt = new Date(Date.parse(nowIso) + durationDays * 24 * 60 * 60 * 1000).toISOString();

      const { error: relistError } = await supabaseAdmin
        .from("listings")
        .update({ status: "published", expires_at: expiresAt, updated_at: nowIso })
        .eq("id", listingId)
        // Re-checked at write time so a concurrent relist can't double-apply.
        .eq("status", "expired");

      if (relistError) {
        console.error("relist.prepare: promo republish error", relistError);
        return res.status(500).json({ error: "Wiederveröffentlichung fehlgeschlagen. Bitte versuche es erneut." });
      }

      return res.status(200).json({ next: "relisted", listing_id: listingId });
    }

    const origin = getRequestOrigin(req);
    const vehicle = [listing.brand, listing.model].filter(Boolean).join(" ") || "Inserat";

    const amountChf = upgrade ? pricingPlans.extended.price : RELIST_PRICE_CHF;
    const productName = upgrade
      ? "Wieder veröffentlichen als Verlängert"
      : "Inserat wieder veröffentlichen";
    const productDescription = upgrade
      ? `${vehicle} – 90 Tage Laufzeit, Premium-Platzierung inklusive.`
      : `${vehicle} – erneute Veröffentlichung nach Ablauf.`;

    const sessionCheckout = await stripe.checkout.sessions.create({
      mode: "payment",
      success_url: `${origin}/dashboard?relist=success&listingId=${encodeURIComponent(listingId)}`,
      cancel_url: `${origin}/dashboard?relist=cancel&listingId=${encodeURIComponent(listingId)}`,
      line_items: [
        {
          price_data: {
            currency: "chf",
            unit_amount: amountChf * 100,
            product_data: {
              name: productName,
              description: productDescription,
            },
          },
          quantity: 1,
        },
      ],
      metadata: {
        kind: "listing_relist",
        listing_id: listingId,
        user_id: session.user.id,
        relist_plan: upgrade ? "extended" : "keep",
      },
      customer_email: session.user.email ?? undefined,
      allow_promotion_codes: false,
    });

    if (!sessionCheckout.url) {
      console.error("relist.prepare: missing checkout url", { sessionId: sessionCheckout.id });
      return res.status(500).json({ error: "Payment session could not be initialized. Please refresh and try again." });
    }

    return res.status(200).json({ url: sessionCheckout.url });
  } catch (error: unknown) {
    console.error("relist.prepare: unhandled error", error);
    return res.status(500).json({
      error: error instanceof Error ? error.message : "An unexpected error occurred.",
    });
  }
}
