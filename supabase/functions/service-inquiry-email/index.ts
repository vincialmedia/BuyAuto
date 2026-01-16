import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.44.2";
import { Resend } from "npm:resend@3.2.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    // Support both direct calls (body) and DB webhook triggers (body.record)
    const inquiry = body.record || body;

    console.log("Processing inquiry email for:", inquiry.email);

    if (!inquiry.email) {
      throw new Error("Email is required");
    }

    const inquiryTypeLabels: Record<string, string> = {
      uebernahme_begleiten: "Leasingübernahme begleiten",
      leasing_exit_full_service: "Leasing Exit - Full Service",
      other: "Andere Anfrage"
    };

    const inquiryTypeLabel = inquiryTypeLabels[inquiry.inquiry_type] || inquiry.inquiry_type;
    
    // Fallbacks for optional fields
    const inquiryName = inquiry.name || "Unbekannt";
    const inquiryEmail = inquiry.email;
    const inquiryPhone = inquiry.phone || "Nicht angegeben";
    const inquiryLeasingCompany = inquiry.leasinggesellschaft || inquiry.leasing_company || "Nicht angegeben";
    const inquiryMessage = inquiry.nachricht || inquiry.message || "Keine Nachricht";

    // Send email to Admin
    const { data, error } = await resend.emails.send({
      from: "BuyAuto <noreply@email.buyauto.ch>",
      to: ["hello@buyauto.ch"],
      reply_to: inquiryEmail,
      subject: `Concierge Anfrage: ${inquiryTypeLabel}`,
      html: `
        <div style="font-family: sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #dc2626; border-bottom: 2px solid #dc2626; padding-bottom: 10px;">Neue Leasing Concierge Anfrage</h2>
          
          <div style="background-color: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 0; font-size: 1.1em;"><strong>Service:</strong> ${inquiryTypeLabel}</p>
          </div>
          
          <h3 style="margin-top: 25px;">Kontaktdaten:</h3>
          <ul style="list-style: none; padding: 0;">
            <li style="padding: 5px 0; border-bottom: 1px solid #eee;"><strong>Name:</strong> ${inquiryName}</li>
            <li style="padding: 5px 0; border-bottom: 1px solid #eee;"><strong>Email:</strong> <a href="mailto:${inquiryEmail}" style="color: #2563eb;">${inquiryEmail}</a></li>
            <li style="padding: 5px 0; border-bottom: 1px solid #eee;"><strong>Telefon:</strong> ${inquiryPhone}</li>
            <li style="padding: 5px 0; border-bottom: 1px solid #eee;"><strong>Leasinggesellschaft:</strong> ${inquiryLeasingCompany}</li>
          </ul>
          
          <h3 style="margin-top: 25px;">Nachricht / Eckdaten:</h3>
          <div style="background-color: #fff; padding: 15px; border: 1px solid #e5e7eb; border-radius: 8px; white-space: pre-wrap;">${inquiryMessage}</div>
          
          <p style="margin-top: 30px; font-size: 13px; color: #6b7280; text-align: center;">
            Diese Anfrage wurde über das Leasing-Concierge-Formular auf BuyAuto.ch gesendet.
          </p>
        </div>
      `,
    });

    if (error) {
      console.error("Resend API Error:", error);
      return new Response(JSON.stringify({ error: error.message }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ success: true, id: data?.id }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    console.error("Edge Function Error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});