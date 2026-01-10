import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type ServiceInquiryInsert = Database["public"]["Tables"]["service_inquiries"]["Insert"];

export interface ServiceInquiryFormData {
  name: string;
  email: string;
  phone?: string;
  inquiry_type: "uebernahme_begleiten" | "leasing_exit_full";
  leasing_company?: string;
  message: string;
}

/**
 * Submit a new service inquiry
 * The database trigger will automatically send an email to hello@buyauto.ch
 */
export async function submitServiceInquiry(data: ServiceInquiryFormData) {
  const inquiryData: ServiceInquiryInsert = {
    name: data.name,
    email: data.email,
    phone: data.phone || null,
    inquiry_type: data.inquiry_type,
    leasing_company: data.leasing_company || null,
    message: data.message,
    status: "new",
  };

  const { data: result, error } = await supabase
    .from("service_inquiries")
    .insert(inquiryData)
    .select()
    .single();

  if (error) {
    console.error("Error submitting service inquiry:", error);
    throw new Error("Fehler beim Senden der Anfrage. Bitte versuche es erneut.");
  }

  return result;
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