import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import type { User } from "@supabase/supabase-js";
import type { ListingData } from "@/lib/buyauto/types";

export type ListingDraftRow = Tables<"listing_drafts">;

export interface ListingDraft {
  id: string;
  user_id: string;
  data: Partial<ListingData>;
  created_at: string;
  updated_at: string;
}

const coerceDraft = (row: ListingDraftRow): ListingDraft => {
  const data = (row.data ?? {}) as Partial<ListingData>;
  return {
    id: row.id,
    user_id: row.user_id,
    data,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
};

function isUnknownColumnError(err: unknown, column: string): boolean {
  const msg = String((err as any)?.message ?? "");
  const lower = msg.toLowerCase();
  const c = column.toLowerCase();
  return lower.includes(`could not find the '${c}' column`) || lower.includes(`"${c}"`) || lower.includes(`'${c}'`);
}

function buildDraftWriteColumns(data: Partial<ListingData>): Record<string, unknown> {
  const anyData = data as any;

  return {
    make_id: anyData?.make_id ?? null,
    model_id: anyData?.model_id ?? null,
    variant_id: anyData?.variant_id ?? null,
    variant_text: typeof anyData?.variant_text === "string" ? anyData.variant_text : null,
    catalog_confidence: typeof anyData?.catalog_confidence === "string" ? anyData.catalog_confidence : null,
    catalog_needs_review: typeof anyData?.catalog_needs_review === "boolean" ? anyData.catalog_needs_review : false,
  };
}

export const createListingDraft = async (params: {
  user: User;
  data: Partial<ListingData>;
}): Promise<ListingDraft> => {
  const { user, data } = params;

  const basePayload: Record<string, unknown> = {
    user_id: user.id,
    data,
    ...buildDraftWriteColumns(data),
    updated_at: new Date().toISOString(),
  };

  let { data: created, error } = await supabase.from("listing_drafts").insert(basePayload as any).select("*").single();

  if (error && (isUnknownColumnError(error, "variant_text") || isUnknownColumnError(error, "catalog_confidence") || isUnknownColumnError(error, "catalog_needs_review"))) {
    const fallbackPayload: Record<string, unknown> = {
      user_id: user.id,
      data,
      make_id: (data as any)?.make_id ?? null,
      model_id: (data as any)?.model_id ?? null,
      variant_id: (data as any)?.variant_id ?? null,
      updated_at: new Date().toISOString(),
    };

    const retry = await supabase.from("listing_drafts").insert(fallbackPayload as any).select("*").single();
    created = retry.data;
    error = retry.error;
  }

  if (error) {
    throw error;
  }

  return coerceDraft(created);
};

export const updateListingDraft = async (params: {
  user: User;
  draftId: string;
  data: Partial<ListingData>;
}): Promise<ListingDraft> => {
  const { user, draftId, data } = params;

  const basePayload: Record<string, unknown> = {
    data,
    ...buildDraftWriteColumns(data),
    updated_at: new Date().toISOString(),
  };

  let { data: updated, error } = await supabase
    .from("listing_drafts")
    .update(basePayload as any)
    .eq("id", draftId)
    .eq("user_id", user.id)
    .select("*")
    .single();

  if (error && (isUnknownColumnError(error, "variant_text") || isUnknownColumnError(error, "catalog_confidence") || isUnknownColumnError(error, "catalog_needs_review"))) {
    const fallbackPayload: Record<string, unknown> = {
      data,
      make_id: (data as any)?.make_id ?? null,
      model_id: (data as any)?.model_id ?? null,
      variant_id: (data as any)?.variant_id ?? null,
      updated_at: new Date().toISOString(),
    };

    const retry = await supabase
      .from("listing_drafts")
      .update(fallbackPayload as any)
      .eq("id", draftId)
      .eq("user_id", user.id)
      .select("*")
      .single();

    updated = retry.data;
    error = retry.error;
  }

  if (error) {
    throw error;
  }

  return coerceDraft(updated);
};

export const deleteListingDraft = async (params: {
  user: User;
  draftId: string;
}): Promise<void> => {
  const { user, draftId } = params;

  const { error } = await supabase
    .from("listing_drafts")
    .delete()
    .eq("id", draftId)
    .eq("user_id", user.id);

  if (error) {
    throw error;
  }
};

export const getListingDraftById = async (params: {
  user: User;
  draftId: string;
}): Promise<ListingDraft | null> => {
  const { user, draftId } = params;

  const { data, error } = await supabase
    .from("listing_drafts")
    .select("*")
    .eq("id", draftId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (!data) return null;
  return coerceDraft(data);
};

export const getMyListingDrafts = async (params: {
  user: User;
}): Promise<ListingDraft[]> => {
  const { user } = params;

  const { data, error } = await supabase
    .from("listing_drafts")
    .select("*")
    .eq("user_id", user.id)
    .order("updated_at", { ascending: false });

  if (error) {
    throw error;
  }

  return (data ?? []).map(coerceDraft);
};