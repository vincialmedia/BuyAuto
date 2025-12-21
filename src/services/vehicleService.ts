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
    .from("vehicle_catalog")
    .select("make")
    .order("make", { ascending: true });

  if (error) {
    console.error("Error fetching makes:", error);
    throw error;
  }

  // Extract unique makes (database already ensures uniqueness via DISTINCT on query)
  const uniqueMakes = Array.from(new Set(data?.map(item => item.make) || []));
  return uniqueMakes.sort();
}

/**
 * Fetch all models for a specific make
 */
export async function fetchModelsForMake(make: string): Promise<string[]> {
  if (!make) {
    return [];
  }

  const { data, error } = await supabase
    .from("vehicle_catalog")
    .select("model")
    .eq("make", make)
    .order("model", { ascending: true });

  if (error) {
    console.error(`Error fetching models for ${make}:`, error);
    throw error;
  }

  return data?.map(item => item.model) || [];
}

/**
 * Search makes by query string
 */
export async function searchMakes(query: string): Promise<string[]> {
  if (!query) {
    return fetchMakes();
  }

  const { data, error } = await supabase
    .from("vehicle_catalog")
    .select("make")
    .ilike("make", `%${query}%`)
    .order("make", { ascending: true });

  if (error) {
    console.error("Error searching makes:", error);
    throw error;
  }

  const uniqueMakes = Array.from(new Set(data?.map(item => item.make) || []));
  return uniqueMakes.sort();
}

/**
 * Search models by query string for a specific make
 */
export async function searchModelsForMake(make: string, query: string): Promise<string[]> {
  if (!make) {
    return [];
  }

  const { data, error } = await supabase
    .from("vehicle_catalog")
    .select("model")
    .eq("make", make)
    .ilike("model", `%${query}%`)
    .order("model", { ascending: true });

  if (error) {
    console.error(`Error searching models for ${make}:`, error);
    throw error;
  }

  return data?.map(item => item.model) || [];
}