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
  /** Set once the draft has gone 30 days without an edit; deleted 5 days later. */
  archived_at: string | null;
}

const coerceDraft = (row: ListingDraftRow): ListingDraft => {
  const data = (row.data ?? {}) as Partial<ListingData>;
  return {
    id: row.id,
    user_id: row.user_id,
    data,
    created_at: row.created_at,
    updated_at: row.updated_at,
    archived_at: (row as { archived_at?: string | null }).archived_at ?? null,
  };
};

export async function createListingDraft(params: { user: any; data: any }) {
  const { user, data } = params;

  const baseRow: Record<string, unknown> = {
    user_id: user.id,
    data,
  };

  const variantText = typeof data?.variant_text === "string" ? data.variant_text : null;
  const catalogConfidence = typeof data?.catalog_confidence === "string" ? data.catalog_confidence : null;
  const catalogNeedsReview = typeof data?.catalog_needs_review === "boolean" ? data.catalog_needs_review : undefined;

  const withColumns = {
    ...baseRow,
    variant_text: variantText,
    catalog_confidence: catalogConfidence,
    ...(catalogNeedsReview !== undefined ? { catalog_needs_review: catalogNeedsReview } : {}),
  };

  let inserted = await supabase.from("listing_drafts").insert(withColumns as any).select("*").single();

  const insertedMsg = String(inserted.error?.message ?? "").toLowerCase();
  if (
    inserted.error &&
    (insertedMsg.includes("could not find the 'variant_text' column") ||
      insertedMsg.includes("could not find the 'catalog_confidence' column") ||
      insertedMsg.includes("could not find the 'catalog_needs_review' column"))
  ) {
    inserted = await supabase.from("listing_drafts").insert(baseRow as any).select("*").single();
  }

  if (inserted.error) throw inserted.error;
  return coerceDraft(inserted.data);
}

export async function updateListingDraft(params: { user: any; draftId: string; data: any }) {
  const { user, draftId, data } = params;

  const basePatch: Record<string, unknown> = {
    data,
    updated_at: new Date().toISOString(),
    // Editing an archived draft rescues it: the 30-day clock restarts and it is
    // no longer queued for deletion.
    archived_at: null,
  };

  const variantText = typeof data?.variant_text === "string" ? data.variant_text : null;
  const catalogConfidence = typeof data?.catalog_confidence === "string" ? data.catalog_confidence : null;
  const catalogNeedsReview = typeof data?.catalog_needs_review === "boolean" ? data.catalog_needs_review : undefined;

  const patchWithColumns = {
    ...basePatch,
    variant_text: variantText,
    catalog_confidence: catalogConfidence,
    ...(catalogNeedsReview !== undefined ? { catalog_needs_review: catalogNeedsReview } : {}),
  };

  let updated = await supabase.from("listing_drafts").update(patchWithColumns as any).eq("id", draftId).eq("user_id", user.id).select("*").single();

  const updatedMsg = String(updated.error?.message ?? "").toLowerCase();
  if (
    updated.error &&
    (updatedMsg.includes("could not find the 'variant_text' column") ||
      updatedMsg.includes("could not find the 'catalog_confidence' column") ||
      updatedMsg.includes("could not find the 'catalog_needs_review' column"))
  ) {
    updated = await supabase.from("listing_drafts").update(basePatch as any).eq("id", draftId).eq("user_id", user.id).select("*").single();
  }

  if (updated.error) throw updated.error;
  return coerceDraft(updated.data);
}

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

export const deleteListingDraftsForListingId = async (params: {
  user: User;
  listingId: string;
}): Promise<void> => {
  const { user, listingId } = params;

  if (listingId.length === 0) return;

  const { error } = await supabase
    .from("listing_drafts")
    .delete()
    .eq("user_id", user.id)
    .eq("data->>id", listingId);

  if (error) {
    throw error;
  }
};

export const getListingDraftById = async (params: {
  user: User;
  draftId: string;
}): Promise<ListingDraft | null> => {
  const { draftId } = params;

  // Deliberately no user_id filter: RLS already scopes this read — owners get
  // their own rows, admins get every row (admin SELECT policy). Filtering by
  // the caller's id here made the admin Entwürfe tab's "Öffnen" links dead,
  // since an admin opening another user's draft matched zero rows.
  const { data, error } = await supabase
    .from("listing_drafts")
    .select("*")
    .eq("id", draftId)
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