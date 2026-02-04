import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

export type CanonicalMake = Tables<"makes">;
export type CanonicalModel = Tables<"models">;
export type CanonicalVariant = Tables<"variants">;

export interface ResolvedVehicleIds {
  makeId: string | null;
  modelId: string | null;
  variantId: string | null;
}

export async function fetchCanonicalMakes(): Promise<CanonicalMake[]> {
  const { data, error } = await supabase
    .from("makes")
    .select("*")
    .order("name", { ascending: true });

  if (error) {
    console.error("fetchCanonicalMakes error:", error);
    throw error;
  }

  return data ?? [];
}

export async function fetchCanonicalModelsForMake(makeId: string): Promise<CanonicalModel[]> {
  if (!makeId) {
    return [];
  }

  const { data, error } = await supabase
    .from("models")
    .select("*")
    .eq("make_id", makeId)
    .order("name", { ascending: true });

  if (error) {
    console.error("fetchCanonicalModelsForMake error:", error);
    throw error;
  }

  return data ?? [];
}

export async function fetchCanonicalVariantsForModel(modelId: string): Promise<CanonicalVariant[]> {
  if (!modelId) {
    return [];
  }

  const { data, error } = await supabase
    .from("variants")
    .select("*")
    .eq("model_id", modelId)
    .order("name", { ascending: true });

  if (error) {
    console.error("fetchCanonicalVariantsForModel error:", error);
    throw error;
  }

  return data ?? [];
}

export async function resolveVehicleIds(input: {
  makeText: string;
  modelText: string;
  variantText?: string | null;
}): Promise<ResolvedVehicleIds> {
  const { data: makeId, error: makeErr } = await supabase.rpc("resolve_make_id", {
    p_make_text: input.makeText,
  });

  if (makeErr) {
    console.error("resolve_make_id error:", makeErr);
    throw makeErr;
  }

  if (!makeId) {
    return { makeId: null, modelId: null, variantId: null };
  }

  const { data: modelId, error: modelErr } = await supabase.rpc("resolve_model_id", {
    p_make_id: makeId,
    p_model_text: input.modelText,
  });

  if (modelErr) {
    console.error("resolve_model_id error:", modelErr);
    throw modelErr;
  }

  if (!modelId) {
    return { makeId, modelId: null, variantId: null };
  }

  if (!input.variantText) {
    return { makeId, modelId, variantId: null };
  }

  const { data: variantId, error: variantErr } = await supabase.rpc("resolve_variant_id", {
    p_model_id: modelId,
    p_variant_text: input.variantText,
  });

  if (variantErr) {
    console.error("resolve_variant_id error:", variantErr);
    throw variantErr;
  }

  return { makeId, modelId, variantId: variantId ?? null };
}