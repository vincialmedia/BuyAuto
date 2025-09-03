
import { supabase } from "@/integrations/supabase/client";
import { Inquiry, InquiryFormData } from "@/lib/buyauto/types";

export async function submitInquiry(formData: InquiryFormData, listingId: string): Promise<boolean> {
  try {
    // Prepare the inquiry data
    const inquiryData: Inquiry = {
      listing_id: listingId,
      name: formData.name.trim(),
      email: formData.email.trim().toLowerCase(),
      phone: formData.phone?.trim() || null,
      message: formData.message.trim()
    };

    // Insert into the database
    const { error } = await supabase
      .from('listing_inquiries')
      .insert([inquiryData]);

    if (error) {
      console.error('Error submitting inquiry:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Submit inquiry error:', error);
    return false;
  }
}

// Get inquiry count for a listing (optional, for analytics)
export async function getInquiryCount(listingId: string): Promise<number> {
  try {
    const { count, error } = await supabase
      .from('listing_inquiries')
      .select('*', { count: 'exact', head: true })
      .eq('listing_id', listingId);

    if (error) {
      console.error('Error fetching inquiry count:', error);
      return 0;
    }

    return count || 0;
  } catch (error) {
    console.error('Get inquiry count error:', error);
    return 0;
  }
}
