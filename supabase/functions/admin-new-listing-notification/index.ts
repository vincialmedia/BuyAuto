import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ListingRecord {
  id: string;
  brand: string;
  model: string;
  year: number;
  price: number;
  payment_status: string;
  status: string;
  user_id: string;
  plan_type: string;
}

async function handler(req: Request): Promise<Response> {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { record } = await req.json() as { record: ListingRecord };

    if (!RESEND_API_KEY) {
      throw new Error("RESEND_API_KEY is not set");
    }

    console.log("Processing new listing notification:", record.id);

    const adminEmail = "hello@buyauto.ch";
    const fromEmail = "notifications@email.buyauto.ch";

    const emailHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #1a1a1a; color: white; padding: 20px; text-align: center; }
            .content { background-color: #f9f9f9; padding: 30px; margin: 20px 0; }
            .listing-details { background-color: white; padding: 20px; margin: 15px 0; border-left: 4px solid #4CAF50; }
            .detail-row { margin: 10px 0; }
            .label { font-weight: bold; color: #666; }
            .value { color: #333; }
            .button { display: inline-block; padding: 12px 24px; background-color: #4CAF50; color: white; text-decoration: none; border-radius: 4px; margin-top: 20px; }
            .footer { text-align: center; color: #666; font-size: 12px; margin-top: 20px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🚗 Neues Inserat wartet auf Freigabe</h1>
            </div>
            <div class="content">
              <p>Ein neues Fahrzeuginserat wurde erfolgreich bezahlt und wartet auf deine Freigabe.</p>
              
              <div class="listing-details">
                <h3>Fahrzeugdetails:</h3>
                <div class="detail-row">
                  <span class="label">Marke:</span>
                  <span class="value">${record.brand}</span>
                </div>
                <div class="detail-row">
                  <span class="label">Modell:</span>
                  <span class="value">${record.model}</span>
                </div>
                <div class="detail-row">
                  <span class="label">Jahr:</span>
                  <span class="value">${record.year}</span>
                </div>
                <div class="detail-row">
                  <span class="label">Preis:</span>
                  <span class="value">CHF ${record.price?.toLocaleString('de-CH') || 'N/A'}</span>
                </div>
                <div class="detail-row">
                  <span class="label">Plan:</span>
                  <span class="value">${record.plan_type || 'Standard'}</span>
                </div>
                <div class="detail-row">
                  <span class="label">Status:</span>
                  <span class="value">${record.status}</span>
                </div>
                <div class="detail-row">
                  <span class="label">Inserat-ID:</span>
                  <span class="value">${record.id}</span>
                </div>
              </div>

              <p>Bitte überprüfe das Inserat und gib es frei oder lehne es ab.</p>

              <a href="https://buyauto.ch/admin" class="button">Zum Admin-Dashboard</a>
            </div>
            <div class="footer">
              <p>Diese E-Mail wurde automatisch vom BuyAuto System generiert.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: fromEmail,
        to: [adminEmail],
        subject: `🚗 Neues Inserat: ${record.brand} ${record.model} (${record.year}) - Freigabe erforderlich`,
        html: emailHtml,
      }),
    });

    if (!res.ok) {
      const error = await res.text();
      console.error("Resend API error:", error);
      throw new Error(`Failed to send email: ${error}`);
    }

    const data = await res.json();
    console.log("Email sent successfully:", data);

    return new Response(JSON.stringify({ success: true, data }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("Error in admin-new-listing-notification:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
}

serve(handler);