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
    const { record } = await req.json();
    const userEmail = record.email;
    const userId = record.id;
    const emailConfirmedAt = record.email_confirmed_at;

    if (!userEmail) {
      throw new Error("User email is missing in the payload.");
    }

    // Safety check: Log if this was somehow triggered without confirmation
    if (!emailConfirmedAt) {
      console.log(`Email not yet confirmed for ${userEmail}. Skipping welcome email.`);
      return new Response(JSON.stringify({ message: "Email not confirmed yet, welcome email not sent" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    if (!ADMIN_EMAIL_ADDRESS) {
      console.warn("ADMIN_EMAIL_ADDRESS secret is not set. Skipping admin notification.");
    }

    const sendToUser = await resend.emails.send({
      from: "welcome@email.buyauto.ch",
      to: userEmail,
      subject: "Willkommen bei BuyAuto! Dein Account ist bestätigt",
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: sans-serif; color: #333; line-height: 1.6; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { text-align: center; padding-bottom: 20px; border-bottom: 1px solid #eee; }
            .content { padding: 30px 0; }
            .button { display: inline-block; background-color: #dc2626; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; }
            .footer { text-align: center; font-size: 12px; color: #666; border-top: 1px solid #eee; padding-top: 20px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <img src="https://buyauto.ch/buyauto-logo.png" alt="BuyAuto Logo" height="40">
            </div>
            <div class="content">
              <h1>Willkommen bei BuyAuto!</h1>
              <p>Hallo,</p>
              <p>Vielen Dank für deine Registrierung. Deine E-Mail-Adresse wurde erfolgreich bestätigt und dein Account ist nun aktiv.</p>
              <p>Du kannst dich jetzt einloggen und die verfügbaren Angebote entdecken.</p>
              <div style="text-align: center; margin: 30px 0;">
                <a href="https://buyauto.ch/auth" class="button">Jetzt Einloggen</a>
              </div>
              <p>Beste Grüsse,<br>Dein BuyAuto Team</p>
            </div>
            <div class="footer">
              <p>&copy; ${new Date().getFullYear()} BuyAuto. Alle Rechte vorbehalten.</p>
            </div>
          </div>
        </body>
        </html>
      `,
    });

    if (sendToUser.error) {
       console.error(`Error sending welcome email to ${userEmail}:`, sendToUser.error);
    } else {
       console.log(`Welcome email sent to ${userEmail}`);
    }

    // Send admin notification
    if (ADMIN_EMAIL_ADDRESS) {
        const sendToAdmin = await resend.emails.send({
          from: "notifications@email.buyauto.ch",
          to: ADMIN_EMAIL_ADDRESS,
          subject: "🎉 Neuer Benutzer auf BuyAuto!",
          html: `
            <h1>Neuer Benutzer!</h1>
            <p>Ein neuer Benutzer hat sich registriert und die E-Mail bestätigt.</p>
            <ul>
              <li><strong>User ID:</strong> ${userId}</li>
              <li><strong>Email:</strong> ${userEmail}</li>
            </ul>
          `,
        });

        if (sendToAdmin.error) {
           console.error(`Error sending admin notification for ${userEmail}:`, sendToAdmin.error);
        } else {
           console.log(`Admin notification sent for ${userEmail}`);
        }
    }

    return new Response(JSON.stringify({ message: "Welcome emails sent successfully" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});