import type { NextApiRequest, NextApiResponse } from "next";
import { createPagesServerClient } from "@supabase/auth-helpers-nextjs";
import type { Database } from "@/integrations/supabase/types";
import { stripe } from "@/lib/stripe-server";

type ListingRow = Pick<
  Database["public"]["Tables"]["listings"]["Row"],
  "id" | "user_id" | "created_by" | "premium" | "premium_until" | "garage_id"
>;

type PrepareBody = {
  listing_id?: string;
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
    .select("id, user_id, created_by, premium, premium_until, garage_id")
    .eq("id", listingId)
    .eq("user_id", userId)
    .maybeSingle();

  if (byUserIdError) {
    console.error("premium-upgrade.prepare: listing fetch (user_id) error", byUserIdError);
  }
  if (byUserId) return byUserId as ListingRow;

  const { data: byCreatedBy, error: byCreatedByError } = await supabase
    .from("listings")
    .select("id, user_id, created_by, premium, premium_until, garage_id")
    .eq("id", listingId)
    .eq("created_by", userId)
    .maybeSingle();

  if (byCreatedByError) {
    console.error("premium-upgrade.prepare: listing fetch (created_by) error", byCreatedByError);
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
      console.error("premium-upgrade.prepare: session error", sessionError);
      return res.status(401).json({ error: "Authentication failed" });
    }

    if (!session?.user) {
      return res.status(401).json({ error: "Unauthorized - Please log in" });
    }

    const body = (req.body ?? {}) as PrepareBody;
    const listingId = safeString(body.listing_id);

    if (!listingId) {
      return res.status(400).json({ error: "Missing required field: listing_id" });
    }

    const listing = await getOwnedListing(supabase, listingId, session.user.id);
    if (!listing) {
      return res.status(404).json({ error: "Listing not found or you do not have permission to access it." });
    }

    // A premium listing with premium_until = NULL is premium indefinitely (that is
    // how admin-granted/seeded premium is represented). Checking only the date
    // treated those as "not premium", so the owner could pay CHF 30 and be
    // downgraded from permanent premium to a 30-day window.
    const now = Date.now();
    const premiumUntilMs = listing.premium_until ? Date.parse(listing.premium_until) : NaN;
    const hasLivePremium = listing.premium === true && (!listing.premium_until || premiumUntilMs > now);
    if (hasLivePremium || (Number.isFinite(premiumUntilMs) && premiumUntilMs > now)) {
      return res.status(400).json({ error: "Listing is already premium." });
    }

    const origin = getRequestOrigin(req);

    const amountCents = 3000;

    // The return must land on the dashboard the seller actually uses:
    // /dashboard/garage was hardcoded, so private sellers were bounced through
    // the SSR role router and lost the query params — the reconciliation
    // effect in ListingsSection never ran for them. {CHECKOUT_SESSION_ID} is
    // substituted by Stripe and feeds /api/billing/premium-upgrade/verify.
    const dashboardBase = listing.garage_id ? "/dashboard/garage" : "/dashboard/private";

    const sessionCheckout = await stripe.checkout.sessions.create({
      mode: "payment",
      success_url: `${origin}${dashboardBase}?premium_upgrade=success&listingId=${encodeURIComponent(listingId)}&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}${dashboardBase}?premium_upgrade=cancel&listingId=${encodeURIComponent(listingId)}`,
      line_items: [
        {
          price_data: {
            currency: "chf",
            unit_amount: amountCents,
            product_data: {
              name: "Premium-Inserat (30 Tage)",
              description: "Premium-Platzierung für ein Inserat für 30 Tage.",
            },
          },
          quantity: 1,
        },
      ],
      metadata: {
        kind: "listing_premium_upgrade",
        listing_id: listingId,
        user_id: session.user.id,
      },
      customer_email: session.user.email ?? undefined,
      allow_promotion_codes: false,
    });

    if (!sessionCheckout.url) {
      console.error("premium-upgrade.prepare: missing checkout url", { sessionId: sessionCheckout.id });
      return res.status(500).json({ error: "Payment session could not be initialized. Please refresh and try again." });
    }

    return res.status(200).json({ url: sessionCheckout.url });
  } catch (error: unknown) {
    console.error("premium-upgrade.prepare: unhandled error", error);
    return res.status(500).json({
      error: error instanceof Error ? error.message : "An unexpected error occurred.",
    });
  }
}