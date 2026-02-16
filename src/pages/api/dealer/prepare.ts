import type { NextApiRequest, NextApiResponse } from "next";
import { createPagesServerClient } from "@supabase/auth-helpers-nextjs";
import type { Database } from "@/integrations/supabase/types";
import { stripe } from "@/lib/stripe-server";
import crypto from "crypto";

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

    const idempotencyKey = crypto
      .createHash("sha256")
      .update(`${garageId}-${planCode}-${session.user.id}-${crypto.randomUUID()}`)
      .digest("hex");

    const paymentIntent = await stripe.paymentIntents.create(
      {
        amount: amountInCents,
        currency: "chf",
        automatic_payment_methods: { enabled: true },
        metadata: {
          kind: "dealer_plan",
          dealer_id: garageId,
          plan_code: planCode,
          plan_id: plan.id,
          user_id: session.user.id,
        },
        statement_descriptor: "BUYAUTO",
      },
      { idempotencyKey }
    );

    if (!paymentIntent?.client_secret) {
      return res.status(500).json({ ok: false, error: "Payment session could not be initialized" });
    }

    return res.status(200).json({
      ok: true,
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      amountChf: priceChf,
    });
  } catch (e: unknown) {
    return res.status(500).json({ ok: false, error: getErrorMessage(e) });
  }
}