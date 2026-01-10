import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.44.2";
import { Resend } from "npm:resend@3.2.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { record: inquiry } = await req.json();

    const inquiryTypeLabels: Record<string, string> = {
      uebernahme_begleiten: "Leasingübernahme begleiten",
      leasing_exit_full: "Leasing Exit - Full Service",
      other: "Andere Anfrage"
    };

    const inquiryTypeLabel = inquiryTypeLabels[inquiry.inquiry_type] || inquiry.inquiry_type;
    const inquiryName = inquiry.name || "Unbekannt";
    const inquiryEmail = inquiry.email || "keine Email angegeben";
    const inquiryPhone = inquiry.phone || "keine Telefonnummer angegeben";
    const inquiryLeasingCompany = inquiry.leasing_company || "nicht angegeben";
    const inquiryMessage = inquiry.message || "keine Nachricht";

    // Send email to BuyAuto admin
    const { data, error } = await resend.emails.send({
      from: "BuyAuto <noreply@email.buyauto.ch>",
      to: ["hello@buyauto.ch"],
      reply_to: [inquiryEmail],
      subject: `Leasing Concierge Anfrage: ${inquiryTypeLabel}`,
      html: `
        <div style="font-family: sans-serif; line-height: 1.6;">
          <h2>Neue Leasing Concierge Anfrage</h2>
          <p><strong>Service:</strong> ${inquiryTypeLabel}</p>
          <hr>
          <h3>Kontaktdaten:</h3>
          <ul>
            <li><strong>Name:</strong> ${inquiryName}</li>
            <li><strong>Email:</strong> ${inquiryEmail}</li>
            <li><strong>Telefon:</strong> ${inquiryPhone}</li>
            <li><strong>Leasinggesellschaft:</strong> ${inquiryLeasingCompany}</li>
          </ul>
          <hr>
          <h3>Nachricht / Eckdaten:</h3>
          <p style="white-space: pre-wrap; background-color: #f4f4f4; padding: 15px; border-radius: 5px;">${inquiryMessage}</p>
          <hr>
          <p>Sie können dem Interessenten direkt auf diese E-Mail antworten.</p>
          <p>Ihr BuyAuto-Team</p>
        </div>
      `,
    });

    if (error) {
      console.error("Resend error:", error);
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ data }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    console.error("Function error:", error);
    return new Response(String(error?.message ?? error), {
      status: 500,
      headers: corsHeaders,
    });
  }
});