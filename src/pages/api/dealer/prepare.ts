import type { NextApiRequest, NextApiResponse } from "next";
import { createPagesServerClient } from "@supabase/auth-helpers-nextjs";
import type { Database } from "@/integrations/supabase/types";
import { stripe } from "@/lib/stripe-server";

type PrepareBody = {
  plan_code?: string;
};

type GaragePick = Pick<Database["public"]["Tables"]["garages"]["Row"], "id" | "owner_user_id">;
type PlanPick = Pick<Database["public"]["Tables"]["dealer_plans"]["Row"], "id" | "code" | "monthly_price_chf" | "active">;

function normalizePlanCode(input: unknown): "starter" | "growth" | "pro" | null {
  const raw = typeof input === "string" ? input.trim().toLowerCase() : "";
  if (raw === "starter" || raw === "growth" || raw === "pro") return raw;
  return null;
}

function getErrorMessage(input: unknown): string {
  if (typeof input === "string" && input.trim().length > 0) return input;
  if (input && typeof input === "object" && "message" in input && typeof (input as any).message === "string") return (input as any).message;
  return "Unexpected error";
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ ok: false, error: "Method Not Allowed" });
  }

  try {
    const supabase = createPagesServerClient<Database>({ req, res });
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError) return res.status(401).json({ ok: false, error: "Authentication failed" });
    if (!session?.user) return res.status(401).json({ ok: false, error: "Unauthorized" });

    const body = (req.body ?? {}) as PrepareBody;
    const planCode = normalizePlanCode(body.plan_code);
    if (!planCode) return res.status(400).json({ ok: false, error: "Invalid plan_code" });

    const { data: garageRaw, error: garageError } = await supabase
      .from("garages")
      .select("id, owner_user_id")
      .eq("owner_user_id", session.user.id)
      .maybeSingle();

    if (garageError) return res.status(500).json({ ok: false, error: "Failed to load garage" });

    const garage = (garageRaw ?? null) as GaragePick | null;
    if (!garage?.id) return res.status(400).json({ ok: false, error: "No garage found for this user" });

    const { data: planRaw, error: planError } = await supabase
      .from("dealer_plans")
      .select("id, code, monthly_price_chf, active")
      .eq("code", planCode)
      .eq("active", true)
      .maybeSingle();

    if (planError) return res.status(500).json({ ok: false, error: "Failed to load plan" });

    const plan = (planRaw ?? null) as PlanPick | null;
    const priceChf = plan?.monthly_price_chf;

    if (!plan?.id) return res.status(400).json({ ok: false, error: "Plan not found" });
    if (typeof priceChf !== "number" || !Number.isFinite(priceChf) || priceChf <= 0) {
      return res.status(400).json({ ok: false, error: "Plan has no valid price" });
    }

    const garageId = garage.id;
    const amountInCents = Math.round(priceChf * 100);

    // Determine base URL for redirection
    const protocol = (req.headers['x-forwarded-proto'] as string) || 'http';
    const host = req.headers.host;
    // Prioritize Host header to support dynamic preview URLs
    const origin = host ? `${protocol}://${host}` : (process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000');

    // Create Stripe Checkout Session
    const checkoutSession = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "chf",
            product_data: {
              name: `BuyAuto - ${plan.code.charAt(0).toUpperCase() + plan.code.slice(1)} Paket`,
              description: "Monatliches Abonnement",
            },
            unit_amount: amountInCents,
          },
          quantity: 1,
        },
      ],
      mode: "payment", // Treating as one-time payment that activates a 30-day period manually via webhook
      success_url: `${origin}/dashboard/garage?payment_success=true`,
      cancel_url: `${origin}/billing/cancel`,
      payment_intent_data: {
        metadata: {
          kind: "dealer_plan",
          dealer_id: garageId,
          plan_code: planCode,
          plan_id: plan.id,
          user_id: session.user.id,
        },
      },
    });

    if (!checkoutSession.url) {
      return res.status(500).json({ ok: false, error: "Could not generate payment URL" });
    }

    return res.status(200).json({
      ok: true,
      url: checkoutSession.url,
    });

  } catch (e: unknown) {
    console.error("Payment preparation error:", e);
    return res.status(500).json({ ok: false, error: getErrorMessage(e) });
  }
}