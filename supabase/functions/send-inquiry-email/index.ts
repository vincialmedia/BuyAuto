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

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // 1. Fetch listing to get owner's user_id and title
    const { data: listingData, error: listingError } = await supabaseAdmin
      .from("listings")
      .select("created_by, title")
      .eq("id", inquiry.listing_id)
      .single();

    if (listingError) {
      throw new Error(`Error fetching listing: ${listingError.message}`);
    }
    if (!listingData || !listingData.created_by) {
      throw new Error(`Could not find owner for listing ${inquiry.listing_id}`);
    }

    const ownerId = listingData.created_by;
    const listingTitle = listingData.title;

    // 2. Fetch owner's profile to get their email
    const { data: profileData, error: profileError } = await supabaseAdmin
      .from("profiles")
      .select("email")
      .eq("id", ownerId)
      .single();

    if (profileError) {
      throw new Error(`Error fetching owner profile: ${profileError.message}`);
    }
    if (!profileData || !profileData.email) {
      throw new Error(`Could not find email for owner ${ownerId}`);
    }

    const ownerEmail = profileData.email;
    const inquiryName = inquiry.name;
    const inquiryEmail = inquiry.email;
    const inquiryMessage = inquiry.message;

    // 3. Send the email to the listing owner, with a BCC to the inquirer
    const { data, error } = await resend.emails.send({
      from: "BuyAuto <noreply@email.buyauto.ch>",
      to: [ownerEmail],
      bcc: [inquiryEmail],
      subject: `Anfrage für Ihr Inserat: "${listingTitle}"`,
      html: `
        <div style="font-family: sans-serif; line-height: 1.6;">
          <h2>Neue Anfrage für Ihr Inserat: "${listingTitle}"</h2>
          <p>Hallo,</p>
          <p>Sie haben eine neue Anfrage von <strong>${inquiryName}</strong> (${inquiryEmail}) erhalten.</p>
          <hr>
          <h3>Nachricht:</h3>
          <p style="white-space: pre-wrap; background-color: #f4f4f4; padding: 15px; border-radius: 5px;">${inquiryMessage}</p>
          <hr>
          <p>Sie können dem Interessenten direkt auf diese E-Mail antworten, um den Kontakt herzustellen.</p>
          <p>Viel Erfolg!</p>
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