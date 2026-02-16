import type { NextApiRequest, NextApiResponse } from "next";
import { createPagesServerClient } from "@supabase/auth-helpers-nextjs";
import type { Database } from "@/integrations/supabase/types";
import { stripe } from "@/lib/stripe-server";
import { adminService } from "@/services/adminService";

type ConfirmBody = {
  payment_intent_id?: string;
};

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

    const body = (req.body ?? {}) as ConfirmBody;
    const paymentIntentId = typeof body.payment_intent_id === "string" ? body.payment_intent_id : "";
    if (!paymentIntentId) return res.status(400).json({ ok: false, error: "Missing payment_intent_id" });

    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    if (paymentIntent.status !== "succeeded") {
      return res.status(400).json({ ok: false, error: `Payment not succeeded (status: ${paymentIntent.status})` });
    }

    const kind = paymentIntent.metadata?.kind;
    const dealerId = paymentIntent.metadata?.dealer_id;
    const planCode = paymentIntent.metadata?.plan_code;
    const userId = paymentIntent.metadata?.user_id;

    if (kind !== "dealer_plan" || !dealerId || !planCode || !userId) {
      return res.status(400).json({ ok: false, error: "Invalid payment intent metadata" });
    }

    if (userId !== session.user.id) {
      return res.status(403).json({ ok: false, error: "Payment intent does not belong to this user" });
    }

    const supabaseAdmin = adminService.getSupabaseAdminClient();

    const { data: plan, error: planError } = await supabaseAdmin
      .from("dealer_plans")
      .select("id, code, listing_limit")
      .eq("code", planCode)
      .maybeSingle();

    if (planError) return res.status(500).json({ ok: false, error: "Failed to load plan" });
    if (!plan?.id) return res.status(400).json({ ok: false, error: "Plan not found" });

    const { data: existingSub } = await supabaseAdmin
      .from("dealer_subscriptions")
      .select("plan_id")
      .eq("dealer_id", dealerId)
      .maybeSingle();

    const fromPlanId = existingSub?.plan_id ?? null;

    const { error: upsertSubError } = await supabaseAdmin
      .from("dealer_subscriptions")
      .upsert(
        {
          dealer_id: dealerId,
          plan_id: plan.id,
          status: "active",
          current_period_start: new Date().toISOString(),
          current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          cancel_at_period_end: false,
        },
        { onConflict: "dealer_id" }
      );

    if (upsertSubError) return res.status(500).json({ ok: false, error: "Failed to update subscription" });

    const { error: garageUpdateError } = await supabaseAdmin
      .from("garages")
      .update({
        plan: plan.code,
        listing_limit: plan.listing_limit ?? null,
      })
      .eq("id", dealerId);

    if (garageUpdateError) return res.status(500).json({ ok: false, error: "Failed to update garage snapshot" });

    const { error: changeError } = await supabaseAdmin.from("dealer_plan_changes").insert({
      dealer_id: dealerId,
      from_plan_id: fromPlanId,
      to_plan_id: plan.id,
      status: "applied",
      notes: `confirm endpoint payment_intent ${paymentIntent.id}`,
    });

    if (changeError) return res.status(500).json({ ok: false, error: "Failed to log plan change" });

    return res.status(200).json({ ok: true });
  } catch (e: any) {
    const message = typeof e?.message === "string" ? e.message : "Unexpected error";
    return res.status(500).json({ ok: false, error: message });
  }
}