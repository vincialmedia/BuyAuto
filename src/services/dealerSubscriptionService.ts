import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import type { Garage } from "@/services/garageService";

export type DealerSubscriptionRow = Database["public"]["Tables"]["dealer_subscriptions"]["Row"];
export type DealerPlanChangeRow = Database["public"]["Tables"]["dealer_plan_changes"]["Row"];
export type DealerPremiumCreditsRow = Database["public"]["Tables"]["dealer_premium_credits"]["Row"];

export async function getMyDealerSubscription(garage: Garage): Promise<DealerSubscriptionRow | null> {
  const { data, error } = await supabase.from("dealer_subscriptions").select("*").eq("dealer_id", garage.id).maybeSingle();

  if (error) throw error;
  return data ?? null;
}

export async function getMyDealerPlanChanges(garage: Garage): Promise<DealerPlanChangeRow[]> {
  const { data, error } = await supabase
    .from("dealer_plan_changes")
    .select("*")
    .eq("dealer_id", garage.id)
    .order("requested_at", { ascending: false });

  if (error) throw error;
  return Array.isArray(data) ? data : [];
}

export async function getMyDealerPremiumCredits(garage: Garage, periodYYYYMM: string): Promise<DealerPremiumCreditsRow | null> {
  const { data, error } = await supabase
    .from("dealer_premium_credits")
    .select("*")
    .eq("dealer_id", garage.id)
    .eq("period_yyyymm", periodYYYYMM)
    .maybeSingle();

  if (error) throw error;
  return data ?? null;
}

export async function ensureDealerPremiumCredits(garage: Garage, periodYYYYMM: string): Promise<DealerPremiumCreditsRow | null> {
  const { data, error } = await supabase.rpc("ensure_dealer_premium_credits", {
    dealer_id: garage.id,
    period_yyyymm: periodYYYYMM,
  });

  if (error) throw error;
  return (data as DealerPremiumCreditsRow | null) ?? null;
}

export async function requestDealerPlanChange(garage: Garage, toPlanCode: string) {
  const { data, error } = await supabase.rpc("request_dealer_plan_change", {
    dealer_id: garage.id,
    to_plan_code: toPlanCode,
  });

  if (error) throw error;
  return data;
}

export async function setListingPremiumUsingCredit(listingId: string) {
  const { data, error } = await supabase.rpc("garage_set_listing_premium_with_credit", {
    listing_id: listingId,
  });

  if (error) throw error;
  return data;
}