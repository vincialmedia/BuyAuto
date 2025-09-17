import { supabase } from "@/integrations/supabase/client";
import { TablesInsert } from "@/integrations/supabase/types";

export interface InquiryData {
  listing_id: string;
  name: string;
  email: string;
  phone?: string;
  message: string;
}

export async function createInquiry(inquiryData: InquiryData): Promise<boolean> {
  try {
    const newInquiry: TablesInsert<"listing_inquiries"> = {
      listing_id: inquiryData.listing_id,
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