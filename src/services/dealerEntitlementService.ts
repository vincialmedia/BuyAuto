import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import type { Garage } from "@/services/garageService";

export type DealerAdminOverrideRow = Database["public"]["Tables"]["dealer_admin_overrides"]["Row"];
export type DealerSubscriptionRow = Database["public"]["Tables"]["dealer_subscriptions"]["Row"];
export type DealerPlanRow = Database["public"]["Tables"]["dealer_plans"]["Row"];

export type DealerEntitlement =
  | { kind: "trial"; planCode: string; planName: string | null; endsAt: string }
  | { kind: "subscription"; planCode: string; planName: string | null; endsAt: string | null }
  | { kind: "garage_plan_field"; planCode: string; planName: string | null }
  | { kind: "none" };

type DealerAdminOverrideWithPlan = DealerAdminOverrideRow & {
  dealer_plans?: Pick<DealerPlanRow, "code" | "name"> | null;
};

type DealerSubscriptionWithPlan = DealerSubscriptionRow & {
  dealer_plans?: Pick<DealerPlanRow, "code" | "name"> | null;
};

function safeLower(input: unknown): string {
  return typeof input === "string" ? input.trim().toLowerCase() : "";
}

function safeNameFromCode(code: string): string {
  const c = safeLower(code);
  if (!c) return "";
  return c.charAt(0).toUpperCase() + c.slice(1);
}

export async function getDealerEntitlement(garage: Garage | null): Promise<DealerEntitlement> {
  if (!garage?.id) return { kind: "none" };

  const nowIso = new Date().toISOString();

  const { data: override, error: overrideError } = await supabase
    .from("dealer_admin_overrides")
    .select("id,dealer_id,plan_id,starts_at,ends_at,dealer_plans(code,name)")
    .eq("dealer_id", garage.id)
    .gt("ends_at", nowIso)
    .order("ends_at", { ascending: false })
    .limit(1)
    .maybeSingle<DealerAdminOverrideWithPlan>();

  if (overrideError) throw overrideError;

  if (override?.dealer_plans?.code) {
    const planCode = safeLower(override.dealer_plans.code);
    return {
      kind: "trial",
      planCode,
      planName: override.dealer_plans.name ?? safeNameFromCode(planCode),
      endsAt: override.ends_at,
    };
  }

  const { data: sub, error: subError } = await supabase
    .from("dealer_subscriptions")
    .select("id,dealer_id,plan_id,status,current_period_end,dealer_plans(code,name)")
    .eq("dealer_id", garage.id)
    .eq("status", "active")
    .maybeSingle<DealerSubscriptionWithPlan>();

  if (subError) throw subError;

  if (sub?.dealer_plans?.code) {
    const planCode = safeLower(sub.dealer_plans.code);
    return {
      kind: "subscription",
      planCode,
      planName: sub.dealer_plans.name ?? safeNameFromCode(planCode),
      endsAt: sub.current_period_end ?? null,
    };
  }

  const raw = safeLower(garage.plan);
  if (raw && raw !== "no_plan") {
    return { kind: "garage_plan_field", planCode: raw, planName: safeNameFromCode(raw) };
  }

  return { kind: "none" };
}

export function formatDateTimeDeCH(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString("de-CH", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}