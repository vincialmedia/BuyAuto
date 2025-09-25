import { supabase } from "@/integrations/supabase/client";
import { ListingFormData, PricePlan } from "@/lib/buyauto/types";
import type { User } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

// Use the proper database types
type ListingInsert = Database['public']['Tables']['listings']['Insert'];
type ListingUpdate = Database['public']['Tables']['listings']['Update'];

// Calculate expiry date based on price plan
function calculateExpiryDate(plan: PricePlan): Date | null {
  const now = new Date();
  
  switch (plan) {
    case "free30":
      return new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days
    case "premium30":
      return new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days
    case "paid90":
      return new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000); // 90 days
    case "unlimited":
      return null; // Never expires
    default:
      return new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // Default to 30 days
  }
}

const getPlanDuration = (plan: PricePlan): number | undefined => {
  switch (plan) {
    case "free30":
      return 30;
    case "premium30":
      return 30;
    case "paid90":
      return 90;
    case "unlimited":
      return undefined; // Never expires
    default:
      return 30;
  }
};

// NEW: Unified function that handles both creation and updates
export async function createOrUpdateListing(listingData: ListingFormData & { id?: string }, user: User): Promise<string | null> {
  try {
    const {
      id,
      brand, model, year, mileage_km, fuel, gearbox, body,
      price_per_month_chf, remaining_months, deposit_chf,
      location, canton_code, title,
      price_plan, images = [], cover_image_index = 0
    } = listingData;

    const expires_at = calculateExpiryDate(price_plan);
    const cover_image_url = images[cover_image_index] || null;

    // If ID exists, update the existing listing
    if (id) {
      const updateData: Partial<ListingUpdate> = {};

      // Convert and assign fields with proper type handling
      if (brand) updateData.brand = brand;
      if (model) updateData.model = model;
      if (year) updateData.year = Number(year);
      if (mileage_km) updateData.mileage_km = Number(mileage_km);
      if (fuel) updateData.fuel = fuel;
      if (gearbox) updateData.gearbox = gearbox;
      if (body) updateData.body = body;
      if (price_per_month_chf) updateData.price_per_month_chf = Number(price_per_month_chf);
      if (remaining_months) updateData.remaining_months = Number(remaining_months);
      if (deposit_chf !== undefined) {
        updateData.deposit_chf = deposit_chf ? Number(deposit_chf) : null;
      }
      if (location) updateData.location = location;
      if (canton_code) updateData.canton_code = canton_code;
      if (title) updateData.title = title;
      if (price_plan) {
        updateData.price_plan = price_plan;
        updateData.expires_at = expires_at?.toISOString();
        updateData.duration_days = getPlanDuration(price_plan);
        updateData.premium = price_plan === "premium30" || price_plan === "unlimited";
        updateData.premium_until = price_plan === "premium30" ? expires_at?.toISOString() : (price_plan === "unlimited" ? new Date(new Date().setFullYear(new Date().getFullYear() + 10)).toISOString() : undefined);
      }

      // Handle images
      if (images.length > 0) {
        updateData.images = images;
        updateData.cover_image_url = cover_image_url;
        updateData.cover_image_index = cover_image_index;
      }

      const { error } = await supabase
        .from("listings")
        .update(updateData)
        .eq("id", id);

      if (error) {
        console.error("Error updating listing:", error);
        throw error;
      }

      return id; // Return the existing ID
    }

    // If no ID, create a new listing
    const newListing: ListingInsert = {
      brand,
      model,
      year: Number(year),
      mileage_km: Number(mileage_km),
      fuel,
      gearbox,
      body,
      price_per_month_chf: Number(price_per_month_chf),
      remaining_months: Number(remaining_months),
      deposit_chf: deposit_chf ? Number(deposit_chf) : null,
      location,
      canton_code,
      title,
      price_plan,
      images: images,
      cover_image_url: cover_image_url,
      cover_image_index,
      expires_at: expires_at?.toISOString(),
      duration_days: getPlanDuration(price_plan),
      status: "pending",
      user_id: user.id,
      created_by: user.id,
      premium: price_plan === "premium30" || price_plan === "unlimited",
      premium_until: price_plan === "premium30" ? expires_at?.toISOString() : (price_plan === "unlimited" ? new Date(new Date().setFullYear(new Date().getFullYear() + 10)).toISOString() : undefined)
    };

    const { data, error } = await supabase
      .from("listings")
      .insert(newListing)
      .select("id")
      .single();

    if (error) {
      console.error("Error creating listing:", error);
      throw error;
    }

    return data.id; // Return the new ID

  } catch (error) {
    console.error("Failed to create or update listing:", error);
    return null;
  }
}

// LEGACY: Keep the original functions for backward compatibility
// This function now expects `listingData.images` to be an array of permanent URLs
export async function createListing(listingData: ListingFormData, user: User): Promise<string | null> {
  // Delegate to the new unified function
  return createOrUpdateListing(listingData, user);
}

export async function updateListing(listingId: string, listingData: Partial<ListingFormData>): Promise<boolean> {
  try {
    const updateData: Partial<ListingUpdate> = {};

    // Handle image updates specifically
    if (listingData.images) {
      const cover_image_index = listingData.cover_image_index ?? 0;
      updateData.cover_image_url = listingData.images[cover_image_index] || null;
      updateData.images = listingData.images;
      updateData.cover_image_index = cover_image_index;
    }

    // Convert and assign fields with proper type handling
    if (listingData.brand) updateData.brand = listingData.brand;
    if (listingData.model) updateData.model = listingData.model;
    if (listingData.year) updateData.year = Number(listingData.year);
    if (listingData.mileage_km) updateData.mileage_km = Number(listingData.mileage_km);
    if (listingData.fuel) updateData.fuel = listingData.fuel;
    if (listingData.gearbox) updateData.gearbox = listingData.gearbox;
    if (listingData.body) updateData.body = listingData.body;
    if (listingData.price_per_month_chf) updateData.price_per_month_chf = Number(listingData.price_per_month_chf);
    if (listingData.remaining_months) updateData.remaining_months = Number(listingData.remaining_months);
    if (listingData.deposit_chf !== undefined) {
      updateData.deposit_chf = listingData.deposit_chf ? Number(listingData.deposit_chf) : null;
    }
    if (listingData.location) updateData.location = listingData.location;
    if (listingData.canton_code) updateData.canton_code = listingData.canton_code;
    if (listingData.title) updateData.title = listingData.title;
    if (listingData.price_plan) updateData.price_plan = listingData.price_plan;

    const { error } = await supabase
      .from("listings")
      .update(updateData)
      .eq("id", listingId);

    if (error) {
      console.error("Error updating listing:", error);
      return false;
    }

    return true;

  } catch (error) {
    console.error("Failed to update listing:", error);
    return false;
  }
}