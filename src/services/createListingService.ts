import { supabase } from "@/integrations/supabase/client";
import type { User } from "@supabase/supabase-js";
import type { PricePlanId } from "@/lib/buyauto/types";

export type ListingUpdatePayload = Partial<{
  id?: string;
  brand?: string;
  model?: string;
  year?: number;
  mileage_km?: number;
  remaining_km?: number | null;
  fuel?: string;
  gearbox?: string;
  body?: string;
  description?: string;
  price_per_month_chf?: number;
  remaining_months?: number;
  deposit_chf?: number | null;
  location?: string;
  canton_code?: string;
  title?: string;
  price_plan?: PricePlanId;
  premium?: boolean;
  images?: string[];
  cover_image_index?: number;
  status?: string;
  user_id?: string;
}>;

export const createOrUpdateListing = async (
  data: ListingUpdatePayload,
  user: User
) => {
  if (!user) {
    throw new Error("User must be authenticated.");
  }

  const listingId = data.id;

  if (!listingId) {
    const listingDataForInsert = {
      ...data,
      user_id: user.id,
      created_by: user.id,
      status: "draft",
    };

    delete listingDataForInsert.id;

    const { data: newListing, error } = await supabase
      .from("listings")
      .insert(listingDataForInsert)
      .select()
      .single();

    if (error) {
      console.error("Error creating new listing:", error);
      throw error;
    }

    console.log("✅ New listing created:", newListing);
    return newListing;
  }

  const { id, ...updateData } = data;

  const cleanUpdateData = { ...updateData };
  if ('user_id' in cleanUpdateData) {
    delete cleanUpdateData.user_id;
  }
  
  const { data: updatedListing, error } = await supabase
    .from("listings")
    .update(cleanUpdateData)
    .eq("id", id)
    .eq("user_id", user.id)
    .select()
    .single();

  if (error) {
    console.error(`Error updating listing ${id}:`, error);
    throw error;
  }

  console.log(`✅ Listing ${id} updated:`, updatedListing);
  return updatedListing;
};

export const getDraftListing = async (user: User) => {
  if (!user) return null;

  const { data, error } = await supabase
    .from("listings")
    .select("*")
    .eq("user_id", user.id)
    .eq("status", "draft")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error("Error fetching draft listing:", error);
    return null;
  }

  return data;
};

export const finalizeListing = async (listingId: string, user: User) => {
  if (!user) {
    throw new Error("User must be authenticated.");
  }

  const { data, error } = await supabase
    .from("listings")
    .update({ status: "pending" })
    .eq("id", listingId)
    .eq("user_id", user.id)
    .select()
    .single();

  if (error) {
    console.error(`Error finalizing listing ${listingId}:`, error);
    throw error;
  }

  console.log(`✅ Listing ${listingId} finalized:`, data);
  return data;
};

export const getListingByIdForOwner = async (listingId: string, user: User) => {
  if (!user || !listingId) {
    console.error("User and listingId are required to fetch listing for owner.");
    return null;
  }

  const { data, error } = await supabase
    .from("listings")
    .select("*")
    .eq("id", listingId)
    .eq("user_id", user.id)
    .single();

  if (error) {
    console.error(`Error fetching listing ${listingId} for owner:`, error);
    return null;
  }

  console.log(`✅ Successfully fetched listing ${listingId} for owner.`);
  return data;
};