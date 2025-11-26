import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { Resend } from "npm:resend@3.2.0";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const ADMIN_EMAIL_ADDRESS = Deno.env.get("ADMIN_EMAIL_ADDRESS");

const resend = new Resend(RESEND_API_KEY);

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const payload = await req.json();
    const record = payload.record;

    if (!record) {
      throw new Error("Missing record in payload");
    }

    // Only proceed if listing is pending and paid
    // (The DB trigger should filter this, but double-check here)
    if (record.status !== 'pending' || record.payment_status !== 'paid') {
      return new Response(JSON.stringify({ message: "Listing not ready for approval" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    const listingId = record.id;
    const brand = record.brand;
    const model = record.model;
    const year = record.first_registration_year || 'N/A';
    const price = record.price || 'N/A';

    if (!ADMIN_EMAIL_ADDRESS) {
      console.warn("ADMIN_EMAIL_ADDRESS not set");
      return new Response(JSON.stringify({ message: "Admin email not configured" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    console.log(`Sending admin notification for listing ${listingId}`);

    const { data, error } = await resend.emails.send({
      from: "notifications@email.buyauto.ch",
      to: ADMIN_EMAIL_ADDRESS,
      subject: "🚗 New Listing Pending Approval",
      html: `
        <h1>New Listing Pending Approval</h1>
        <p>A new listing has been submitted and paid for. It is waiting for your approval.</p>
        
        <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <h3>Vehicle Details:</h3>
          <ul>
            <li><strong>ID:</strong> ${listingId}</li>
            <li><strong>Vehicle:</strong> ${brand} ${model} (${year})</li>
            <li><strong>Price:</strong> CHF ${price}</li>
            <li><strong>Status:</strong> ${record.status}</li>
          </ul>
        </div>

        <p>
          <a href="https://buyauto.ch/admin" style="background-color: #000; color: #fff; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
            Go to Admin Dashboard
          </a>
        </p>
      `,
    });

    if (error) {
      throw error;
    }

    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    console.error('Error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});