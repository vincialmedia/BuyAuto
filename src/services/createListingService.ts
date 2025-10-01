import { supabase } from "@/integrations/supabase/client";
import type { User } from "@supabase/supabase-js";
import type { ListingFormData, PricePlanId } from "@/lib/buyauto/types";

// Define a more flexible type for the data payload
type ListingUpdatePayload = Partial<{
  id?: string;
  brand?: string;
  model?: string;
  year?: number;
  mileage_km?: number;
  fuel?: "Benzin" | "Diesel" | "Hybrid" | "Elektro";
  gearbox?: "Automatik" | "Manuell";
  body?: "Limousine" | "Kombi" | "SUV" | "Cabrio";
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

/**
 * Creates a new listing or updates an existing one.
 * If `data.id` is provided, it updates the existing record.
 * If `data.id` is not provided, it creates a new record.
 *
 * @param data - The listing data. Can be a partial object for updates.
 * @param user - The authenticated user.
 * @returns The created or updated listing data.
 */
export const createOrUpdateListing = async (
  data: ListingUpdatePayload,
  user: User
) => {
  if (!user) {
    throw new Error("User must be authenticated.");
  }

  const listingId = data.id;

  // 1. If no ID, create a new listing
  if (!listingId) {
    const listingDataForInsert = {
      ...data,
      user_id: user.id,
      created_by: user.id, // ✅ Required for RLS policy compliance
      status: "pending", // ✅ FIXED: Use valid enum value instead of 'draft'
    };

    // Remove id if it's undefined to avoid inserting it
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

  // 2. If ID exists, update the existing listing
  const { id, ...updateData } = data; // Separate ID from the rest of the data

  // Ensure user_id is not accidentally overwritten
  const cleanUpdateData = { ...updateData };
  if ('user_id' in cleanUpdateData) {
    delete cleanUpdateData.user_id;
  }
  
  const { data: updatedListing, error } = await supabase
    .from("listings")
    .update(cleanUpdateData)
    .eq("id", id)
    .eq("user_id", user.id) // Security check: ensure user owns the listing
    .select()
    .single();

  if (error) {
    console.error(`Error updating listing ${id}:`, error);
    throw error;
  }

  console.log(`✅ Listing ${id} updated:`, updatedListing);
  return updatedListing;
};

/**
 * Retrieves a pending listing for the current user.
 * Note: Since we're using 'pending' instead of 'draft', we look for pending listings.
 *
 * @param user - The authenticated user.
 * @returns The user's most recent pending listing, or null if none exists.
 */
export const getDraftListing = async (user: User) => {
  if (!user) return null;

  const { data, error } = await supabase
    .from("listings")
    .select("*")
    .eq("user_id", user.id)
    .eq("status", "pending") // ✅ FIXED: Use valid enum value instead of 'draft'
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error("Error fetching pending listing:", error);
    return null;
  }

  return data;
};

/**
 * Finalizes a listing by keeping it as 'pending' status.
 * This is called at the end of the wizard.
 * Note: Since we're already using 'pending', this function maintains the status.
 *
 * @param listingId - The ID of the listing to finalize.
 * @param user - The authenticated user.
 * @returns The finalized listing data.
 */
export const finalizeListing = async (listingId: string, user: User) => {
  if (!user) {
    throw new Error("User must be authenticated.");
  }

  const { data, error } = await supabase
    .from("listings")
    .update({ status: "pending" }) // ✅ FIXED: Maintain valid enum value
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

/**
 * Retrieves a specific listing by its ID, ensuring it belongs to the authenticated user.
 * This is used to re-hydrate the wizard state after payment.
 *
 * @param listingId - The ID of the listing to fetch.
 * @param user - The authenticated user.
 * @returns The listing data if found and owned by the user, otherwise null.
 */
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
