import { supabase } from "@/integrations/supabase/client";

export interface VehicleMake {
  make: string;
}

export interface VehicleModel {
  model: string;
}

/**
 * Fetch all unique car makes from the vehicle catalog
 */
export async function fetchMakes(): Promise<string[]> {
  const { data, error } = await supabase
    .from("makes")
    .select("name, models!inner(id)")
    .order("name", { ascending: true });

  if (error) {
    console.error("Error fetching makes:", error);
    throw error;
  }

  // Extract unique makes (the inner join ensures they have at least one model)
  const uniqueMakes = Array.from(new Set(data?.map(item => item.name) || []));
  return uniqueMakes.sort();
}

/**
 * Fetch all models for a specific make
 */
export async function fetchModelsForMake(make: string): Promise<string[]> {
  if (!make) {
    return [];
  }

  // First find the make_id
  const { data: makeData, error: makeError } = await supabase
    .from("makes")
    .select("id")
    .ilike("name", make)
    .maybeSingle();

  if (makeError || !makeData) {
    console.error(`Error finding make ID for ${make}:`, makeError);
    return [];
  }

  const { data, error } = await supabase
    .from("models")
    .select("name")
    .eq("make_id", makeData.id)
    .eq("is_active", true)
    .order("name", { ascending: true });

  if (error) {
    console.error(`Error fetching models for ${make}:`, error);
    throw error;
  }

  const uniqueModels = Array.from(new Set(data?.map(item => item.name) || []));
  return uniqueModels.sort();
}

/**
 * Search makes by query string
 */
export async function searchMakes(query: string): Promise<string[]> {
  if (!query) {
    return fetchMakes();
  }

  const { data, error } = await supabase
    .from("makes")
    .select("name, models!inner(id)")
    .ilike("name", `%${query}%`)
    .order("name", { ascending: true });

  if (error) {
    console.error("Error searching makes:", error);
    throw error;
  }

  const uniqueMakes = Array.from(new Set(data?.map(item => item.name) || []));
  return uniqueMakes.sort();
}

/**
 * Search models by query string for a specific make
 */
export async function searchModelsForMake(make: string, query: string): Promise<string[]> {
  if (!make) {
    return [];
  }

  // First find the make_id
  const { data: makeData, error: makeError } = await supabase
    .from("makes")
    .select("id")
    .ilike("name", make)
    .maybeSingle();

  if (makeError || !makeData) {
    return [];
  }

  const { data, error } = await supabase
    .from("models")
    .select("name")
    .eq("make_id", makeData.id)
    .eq("is_active", true)
    .ilike("name", `%${query}%`)
    .order("name", { ascending: true });

  if (error) {
    console.error(`Error searching models for ${make}:`, error);
    throw error;
  }

  const uniqueModels = Array.from(new Set(data?.map(item => item.name) || []));
  return uniqueModels.sort();
}