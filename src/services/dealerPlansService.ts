import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

export type DealerPlanRow = Database["public"]["Tables"]["dealer_plans"]["Row"];

export async function getActiveDealerPlans(): Promise<DealerPlanRow[]> {
  const { data, error } = await supabase
    .from("dealer_plans")
    .select("*")
    .eq("active", true)
    .order("monthly_price_chf", { ascending: true });

  if (error) throw error;
  return Array.isArray(data) ? data : [];
}

export async function getDealerPlanByCode(code: string): Promise<DealerPlanRow | null> {
  const normalized = code.trim().toLowerCase();
  const { data, error } = await supabase
    .from("dealer_plans")
    .select("*")
    .eq("code", normalized)
    .maybeSingle();

  if (error) throw error;
  return data ?? null;
}