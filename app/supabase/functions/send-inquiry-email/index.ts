import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";
import { Resend } from "npm:resend@3.2.0";

// Initialize Resend with API key
const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const resend = new Resend(RESEND_API_KEY);

// CORS headers to allow everything
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
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

// Main handler function
// NO JWT VERIFICATION - This function is only called by the database trigger
async function handler(req: Request): Promise<Response> {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    console.log("Inquiry email function invoked");

    // Initialize Supabase client with service role key
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Parse request body
    const { inquiry_id } = await req.json();
    console.log("Processing inquiry_id:", inquiry_id);

    if (!inquiry_id) {
      throw new Error("inquiry_id is required");
    }

    // Fetch inquiry details with listing and profile information
    console.log("Fetching inquiry data...");
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
          brand,
          model,
          user_id
        )
      `)
      .eq("id", inquiry_id)
      .single();

    if (inquiryError || !inquiry) {
      console.error("Inquiry fetch error:", inquiryError);
      throw new Error(`Failed to fetch inquiry: ${inquiryError?.message || "Not found"}`);
    }

    console.log("Inquiry data fetched successfully");

    const listing = inquiry.listings as any;
    
    // Fetch owner profile separately using user_id
    console.log("Fetching owner profile for user_id:", listing?.user_id);
    const { data: ownerProfile, error: profileError } = await supabase
      .from("profiles")
      .select("email, full_name")
      .eq("id", listing?.user_id)
      .single();

    if (profileError || !ownerProfile) {
      console.error("Owner profile fetch error:", profileError);
      throw new Error(`Failed to fetch owner profile: ${profileError?.message || "Not found"}`);
    }

    const ownerEmail = ownerProfile?.email;
    const ownerName = ownerProfile?.full_name || "Listing Owner";

    if (!ownerEmail) {
      console.error("Owner email not found for listing:", listing?.id);
      throw new Error("Owner email not found");
    }

    console.log(`Preparing email for owner: ${ownerEmail}`);

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
      listingMake: listing.brand,
      listingModel: listing.model,
      listingUrl,
    };

    const emailHtml = generateEmailHtml(emailData);
    const emailSubject = `Neue Anfrage für Ihr Inserat: ${listing.brand} ${listing.model}`;

    // Send email using Resend npm package
    console.log("Sending email via Resend...");
    const sendResult = await resend.emails.send({
      from: "BuyAuto <notifications@email.buyauto.ch>",
      to: ownerEmail,
      bcc: inquiry.email,
      reply_to: inquiry.email,
      subject: emailSubject,
      html: emailHtml,
    });

    if (sendResult.error) {
      console.error("Error sending inquiry email:", sendResult.error);
      return new Response(JSON.stringify({
        success: false,
        message: "Inquiry saved but email delivery failed",
        inquiry_id: inquiry_id,
        error: sendResult.error.message,
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    console.log(`Inquiry email sent successfully to ${ownerEmail} for inquiry ${inquiry_id}`);

    return new Response(JSON.stringify({
      success: true,
      message: "Inquiry email sent successfully",
      inquiry_id: inquiry_id,
      email_id: sendResult.data?.id,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("Error in send-inquiry-email function:", error);
    return new Response(JSON.stringify({
      error: error.message,
      success: false,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
}

// Start the server
serve(handler);