import { supabase } from "@/integrations/supabase/client";

export interface Garage {
  id: string;
  owner_user_id: string;
  garage_name: string;
  city: string | null;
  contact_email: string | null;
  listing_limit: number | null;
  plan: string | null;
  created_at?: string | null;
  updated_at?: string | null;
}

export type GarageUpdate = Partial<Pick<Garage, "garage_name" | "city" | "contact_email" | "plan" | "listing_limit">>;

function toGarage(row: unknown): Garage {
  const r = row as Record<string, unknown>;

  return {
    id: String(r.id ?? ""),
    owner_user_id: String(r.owner_user_id ?? ""),
    garage_name: String(r.garage_name ?? ""),
    city: typeof r.city === "string" ? r.city : null,
    contact_email: typeof r.contact_email === "string" ? r.contact_email : null,
    listing_limit: typeof r.listing_limit === "number" ? r.listing_limit : null,
    plan: typeof r.plan === "string" ? r.plan : null,
    created_at: typeof r.created_at === "string" ? r.created_at : null,
    updated_at: typeof r.updated_at === "string" ? r.updated_at : null,
  };
}

export async function getMyGarage(): Promise<Garage | null> {
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError) throw userError;

  const user = userData.user;
  if (!user) return null;

  const { data, error } = await supabase
    .from("garages")
    .select("*")
    .eq("owner_user_id", user.id)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;

  return toGarage(data);
}

export async function updateMyGarage(updates: GarageUpdate): Promise<Garage> {
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError) throw userError;

  const user = userData.user;
  if (!user) throw new Error("Not authenticated");

  const { data, error } = await supabase
    .from("garages")
    .update(updates as unknown as Record<string, unknown>)
    .eq("owner_user_id", user.id)
    .select("*")
    .maybeSingle();

  if (error) throw error;
  if (!data) throw new Error("Garage not found");

  return toGarage(data);
}