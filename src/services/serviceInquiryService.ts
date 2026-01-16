import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

export interface ServiceInquiryFormData {
  vorname: string;
  name: string;
  email: string;
  phone?: string;
  inquiry_type: "uebernahme_begleiten" | "leasing_exit_full_service";
  leasing_company?: string;
  message: string;
}

/**
 * Submit a new service inquiry
 * 1. Saves to Database (Reliability/CRM)
 * 2. Triggers Email Notification DIRECTLY (Fast & Simple)
 */
export async function submitServiceInquiry(data: ServiceInquiryFormData) {
  // 1. Save to Database
  const inquiryData = {
    vorname: data.vorname,
    name: data.name,
    email: data.email,
    phone: data.phone || null,
    inquiry_type: data.inquiry_type,
    leasinggesellschaft: data.leasing_company || null,
    nachricht: data.message,
    status: "new", // ensuring valid status
  };

  const { data: savedRecord, error: dbError } = await supabase
    .from("service_inquiries")
    .insert(inquiryData)
    .select()
    .single();

  if (dbError) {
    console.error("Error saving service inquiry to DB:", dbError);
    // Even if DB fails, we could technically try to send the email, 
    // but usually DB failure means something bigger is wrong.
    throw new Error("Fehler beim Speichern der Anfrage.");
  }

  // 2. Trigger Email Notification Directly
  // We send the 'savedRecord' so the email function has all the final IDs and timestamps
  try {
    const { error: emailError } = await supabase.functions.invoke('service-inquiry-email', {
      body: savedRecord // Send the exact data we just saved
    });
    
    if (emailError) {
      console.error("Warning: Email notification failed to send:", emailError);
      // We do NOT throw here because the inquiry IS saved in the database.
      // We might want to show a specific warning, but for the user "Success" is better 
      // since we will see it in the dashboard.
    }
  } catch (err) {
    console.error("Exception sending email notification:", err);
  }

  return savedRecord;
}

/**
 * Get all service inquiries (admin only)
 */
export async function getAllServiceInquiries() {
  const { data, error } = await supabase
    .from("service_inquiries")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching service inquiries:", error);
    throw error;
  }

  return data || [];
}

/**
 * Update service inquiry status (admin only)
 */
export async function updateServiceInquiryStatus(
  id: string,
  status: "new" | "contacted" | "in_progress" | "completed" | "cancelled"
) {
  const { data, error } = await supabase
    .from("service_inquiries")
    .update({ status })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error("Error updating service inquiry status:", error);
    throw error;
  }

  return data;
}