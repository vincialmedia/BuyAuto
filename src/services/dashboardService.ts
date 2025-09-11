
import { supabase } from "@/integrations/supabase/client";

export interface DashboardListing {
  id: string;
  brand: string;
  model: string;
  year: number;
  price_per_month_chf: number;
  remaining_months: number;
  location: string;
  premium: boolean;
  is_premium: boolean;
  premium_until: string | null;
  expires_at: string | null;
  status: "pending" | "published" | "rejected" | "expired";
  created_at: string;
  duration_days: number | null;
  price_plan: string | null;
  cover_image_url: string | null;
  images: any;
  cover_image_index: number;
  moderation_note: string | null;
  created_by: string | null;
  user_id: string | null;
}

export interface DashboardStats {
  active: number;
  pending: number;
  rejected: number;
  expired: number;
  total: number;
}

export async function getUserListings(): Promise<DashboardListing[]> {
  try {
    // Query the full listings table - RLS ensures users only see their own listings
    const { data, error } = await supabase
      .from('listings')
      .select(`
        id, brand, model, title, year, price_per_month_chf, remaining_months,
        location, canton_code, mileage_km, fuel, gearbox, body, premium, 
        cover_image_url, images, cover_image_index, deposit_chf, created_at,
        status, expires_at, duration_days, price_plan, premium_until,
        created_by, user_id, moderation_note, updated_at
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Dashboard getUserListings error:', error);
      return [];
    }

    return (data || []).map((row: any) => ({
      id: row.id,
      brand: row.brand,
      model: row.model,
      title: row.title,
      year: row.year,
      price_per_month_chf: row.price_per_month_chf,
      remaining_months: row.remaining_months,
      location: row.location,
      canton_code: row.canton_code,
      mileage_km: row.mileage_km,
      fuel: row.fuel,
      gearbox: row.gearbox,
      body: row.body,
      premium: row.premium || false,
      is_premium: row.premium || false, // Backward compatibility
      premium_until: row.premium_until,
      cover_image_url: row.cover_image_url,
      images: row.images || [],
      cover_image_index: row.cover_image_index || 0,
      deposit_chf: row.deposit_chf,
      status: row.status as DashboardListingStatus,
      created_at: row.created_at,
      updated_at: row.updated_at,
      expires_at: row.expires_at,
      duration_days: row.duration_days,
      price_plan: row.price_plan,
      created_by: row.created_by,
      user_id: row.user_id || row.created_by, // Handle both fields
      moderation_note: row.moderation_note
    }));

  } catch (error) {
    console.error('Dashboard getUserListings unexpected error:', error);
    return [];
  }
}

export async function getDashboardStats(): Promise<DashboardStats> {
  try {
    // Query the full listings table - RLS ensures users only see their own listings
    const { data, error } = await supabase
      .from('listings')
      .select('status, expires_at')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Dashboard stats error:', error);
      return { active: 0, pending: 0, expired: 0, rejected: 0, total: 0 };
    }

    const now = new Date();
    const stats = {
      active: 0,
      pending: 0,
      expired: 0,
      rejected: 0,
      total: data.length
    };

    data.forEach((listing) => {
      // Check if listing is expired based on expires_at date
      if (listing.expires_at && new Date(listing.expires_at) <= now) {
        stats.expired += 1;
      } else {
        switch (listing.status) {
          case 'published':
            stats.active += 1;
            break;
          case 'pending':
            stats.pending += 1;
            break;
          case 'rejected':
            stats.rejected += 1;
            break;
          case 'expired':
            stats.expired += 1;
            break;
        }
      }
    });

    return stats;

  } catch (error) {
    console.error('Dashboard stats unexpected error:', error);
    return { active: 0, pending: 0, expired: 0, rejected: 0, total: 0 };
  }
}

export async function deleteListing(listingId: string): Promise<boolean> {
  try {
    // RLS ensures users can only delete their own listings
    const { error } = await supabase
      .from('listings')
      .delete()
      .eq('id', listingId);

    if (error) {
      console.error('Delete listing error:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Delete listing unexpected error:', error);
    return false;
  }
}

export async function upgradeToPremium(listingId: string): Promise<boolean> {
  try {
    // Set premium until 30 days from now
    const premiumUntil = new Date();
    premiumUntil.setDate(premiumUntil.getDate() + 30);

    // RLS ensures users can only update their own listings
    const { error } = await supabase
      .from('listings')
      .update({
        premium: true,
        is_premium: true,
        premium_until: premiumUntil.toISOString(),
        price_plan: 'premium30'
      })
      .eq('id', listingId);

    if (error) {
      console.error('Upgrade to premium error:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Upgrade to premium unexpected error:', error);
    return false;
  }
}

export async function extendListing(listingId: string, days: number): Promise<boolean> {
  try {
    // Extend the expiry date by the specified number of days
    const newExpiryDate = new Date();
    newExpiryDate.setDate(newExpiryDate.getDate() + days);

    // RLS ensures users can only update their own listings
    const { error } = await supabase
      .from('listings')
      .update({
        expires_at: newExpiryDate.toISOString(),
        duration_days: days,
        status: 'published' // Reactivate if expired
      })
      .eq('id', listingId);

    if (error) {
      console.error('Extend listing error:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Extend listing unexpected error:', error);
    return false;
  }
}