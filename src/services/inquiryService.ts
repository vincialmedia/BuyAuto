import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type InquiryInsert = Database['public']['Tables']['listing_inquiries']['Insert'];

export interface InquiryData {
  listing_id: string;
  user_id: string;
  name: string;
  email: string;
  phone?: string;
  message: string;
}

export async function createInquiry(inquiryData: InquiryData): Promise<boolean> {
  try {
    const newInquiry: InquiryInsert = {
      listing_id: inquiryData.listing_id,
      user_id: inquiryData.user_id,
      name: inquiryData.name,
      email: inquiryData.email,
      phone: inquiryData.phone || null,
      message: inquiryData.message,
    };

    const { error } = await supabase
      .from("listing_inquiries")
      .insert(newInquiry);

    if (error) {
      console.error("Error creating inquiry:", error);
      return false;
    }

    return true;
  } catch (error) {
    console.error("Failed to create inquiry:", error);
    return false;
  }
}

export async function getInquiriesForListing(listingId: string): Promise<any[]> {
  try {
    const { data, error } = await supabase
      .from("listing_inquiries")
      .select("*")
      .eq("listing_id", listingId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching inquiries:", error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error("Failed to fetch inquiries:", error);
    return [];
  }
}

export async function getUserProfile(userId: string): Promise<{ email: string; full_name: string } | null> {
  try {
    const { data, error } = await supabase
      .from("profiles")
      .select("email, full_name")
      .eq("id", userId)
      .maybeSingle();

    if (error) {
      console.error("Error fetching user profile:", error);
      return null;
    }

    return data;
  } catch (error) {
    console.error("Failed to fetch user profile:", error);
    return null;
  }
}
