import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE',
};

interface InquiryEmailData {
  ownerEmail: string;
  ownerName: string;
  inquirerName: string;
  inquirerEmail: string;
  inquirerPhone?: string;
  message: string;
  listingTitle: string;
  listingMake: string;
  listingModel: string;
  listingUrl: string;
}

function generateEmailHtml(data: InquiryEmailData): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Neue Anfrage für Ihr Inserat</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
    <h1 style="color: #2c3e50; margin: 0 0 10px 0;">Neue Anfrage für Ihr Inserat</h1>
    <p style="margin: 0; color: #666;">Hallo ${data.ownerName}, Sie haben eine neue Anfrage erhalten</p>
  </div>

  <div style="background-color: #fff; padding: 20px; border: 1px solid #e1e8ed; border-radius: 8px; margin-bottom: 20px;">
    <h2 style="color: #2c3e50; margin-top: 0;">Inserat Details</h2>
    <p style="margin: 5px 0;"><strong>Fahrzeug:</strong> ${data.listingMake} ${data.listingModel}</p>
    <p style="margin: 5px 0;"><strong>Titel:</strong> ${data.listingTitle}</p>
    <p style="margin: 15px 0;">
      <a href="${data.listingUrl}" style="display: inline-block; padding: 12px 24px; background-color: #007bff; color: #fff; text-decoration: none; border-radius: 4px;">Inserat ansehen</a>
    </p>
  </div>

  <div style="background-color: #fff; padding: 20px; border: 1px solid #e1e8ed; border-radius: 8px; margin-bottom: 20px;">
    <h2 style="color: #2c3e50; margin-top: 0;">Kontaktdaten des Interessenten</h2>
    <p style="margin: 5px 0;"><strong>Name:</strong> ${data.inquirerName}</p>
    <p style="margin: 5px 0;"><strong>E-Mail:</strong> <a href="mailto:${data.inquirerEmail}" style="color: #007bff;">${data.inquirerEmail}</a></p>
    ${data.inquirerPhone ? `<p style="margin: 5px 0;"><strong>Telefon:</strong> <a href="tel:${data.inquirerPhone}" style="color: #007bff;">${data.inquirerPhone}</a></p>` : ''}
  </div>

  <div style="background-color: #fff; padding: 20px; border: 1px solid #e1e8ed; border-radius: 8px; margin-bottom: 20px;">
    <h2 style="color: #2c3e50; margin-top: 0;">Nachricht</h2>
    <p style="margin: 0; white-space: pre-wrap;">${data.message}</p>
  </div>

  <div style="background-color: #f8f9fa; padding: 15px; border-radius: 8px; margin-top: 20px; text-align: center; color: #666; font-size: 14px;">
    <p style="margin: 0;">Diese E-Mail wurde automatisch von BuyAuto gesendet.</p>
    <p style="margin: 5px 0 0 0;">Bitte antworten Sie dem Interessenten direkt über die angegebenen Kontaktdaten.</p>
  </div>
</body>
</html>
  `;
}

async function sendEmailViaResend(to: string, subject: string, html: string, replyTo: string): Promise<boolean> {
  const resendApiKey = Deno.env.get("RESEND_API_KEY");
  
  if (!resendApiKey) {
    console.error("RESEND_API_KEY not configured");
    return false;
  }

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${resendApiKey}`,
      },
      body: JSON.stringify({
        from: "BuyAuto <noreply@buyauto.ch>",
        to: [to],
        reply_to: replyTo,
        subject: subject,
        html: html,
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error("Resend API error:", response.status, errorData);
      return false;
    }

    const result = await response.json();
    console.log("Email sent successfully via Resend:", result);
    return true;
  } catch (error) {
    console.error("Error sending email via Resend:", error);
    return false;
  }
}

async function handler(req: Request): Promise<Response> {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { inquiry_id } = await req.json();

    if (!inquiry_id) {
      throw new Error("inquiry_id is required");
    }

    // Fetch inquiry details with listing and profile information
    const { data: inquiry, error: inquiryError } = await supabase
      .from("listing_inquiries")
      .select(`
        id,
        name,
        email,
        phone,
        message,
        created_at,
        listing_id,
        listings!listing_inquiries_listing_id_fkey (
          id,
          title,
          make,
          model,
          user_id,
          profiles!listings_user_id_fkey (
            email,
            full_name
          )
        )
      `)
      .eq("id", inquiry_id)
      .single();

    if (inquiryError || !inquiry) {
      console.error("Inquiry fetch error:", inquiryError);
      throw new Error(`Failed to fetch inquiry: ${inquiryError?.message || "Not found"}`);
    }

    const listing = inquiry.listings as any;
    const ownerProfile = listing?.profiles as any;
    const ownerEmail = ownerProfile?.email;
    const ownerName = ownerProfile?.full_name || "Listing Owner";

    if (!ownerEmail) {
      throw new Error("Owner email not found");
    }

    // Construct listing URL
    const baseUrl = Deno.env.get("SITE_URL") || "https://buy-auto.vercel.app";
    const listingUrl = `${baseUrl}/fahrzeug/${listing.id}`;

    // Prepare email data
    const emailData: InquiryEmailData = {
      ownerEmail,
      ownerName,
      inquirerName: inquiry.name,
      inquirerEmail: inquiry.email,
      inquirerPhone: inquiry.phone,
      message: inquiry.message,
      listingTitle: listing.title,
      listingMake: listing.make,
      listingModel: listing.model,
      listingUrl,
    };

    const emailHtml = generateEmailHtml(emailData);
    const emailSubject = `Neue Anfrage für Ihr Inserat: ${listing.make} ${listing.model}`;

    // Send email via Resend
    const emailSent = await sendEmailViaResend(
      ownerEmail,
      emailSubject,
      emailHtml,
      inquiry.email
    );

    if (!emailSent) {
      // Log for debugging but don't fail the request
      console.log("Email sending failed, but inquiry was saved");
      console.log("Owner email:", ownerEmail);
      console.log("Subject:", emailSubject);
      console.log("Inquiry ID:", inquiry_id);
      
      return new Response(JSON.stringify({
        success: true,
        message: "Inquiry saved successfully",
        inquiry_id: inquiry_id,
        warning: "Email delivery pending - please configure RESEND_API_KEY",
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    return new Response(JSON.stringify({
      success: true,
      message: "Inquiry email sent successfully",
      inquiry_id: inquiry_id
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("Error in send-inquiry-email function:", error);
    return new Response(JSON.stringify({ 
      error: error.message,
      success: false 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
}

serve(handler);
