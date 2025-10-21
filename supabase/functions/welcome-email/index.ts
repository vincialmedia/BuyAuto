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

    if (!userEmail) {
      throw new Error("User email is missing in the payload.");
    }
    
    if (!ADMIN_EMAIL_ADDRESS) {
      console.warn("ADMIN_EMAIL_ADDRESS secret is not set. Skipping admin notification.");
    }

    const sendToUser = await resend.emails.send({
      from: "welcome@email.buyauto.ch",
      to: userEmail,
      subject: "Welcome to BuyAuto! Your Account is Confirmed",
      html: `
        <h1>Welcome to BuyAuto!</h1>
        <p>Hi there,</p>
        <p>Thanks for joining us. Your email has been successfully confirmed, and your account is now active.</p>
        <p>You can now log in and start exploring available listings.</p>
        <p>Best,<br>The BuyAuto Team</p>
      `,
    });

    if (sendToUser.error) {
       console.error(`Error sending welcome email to ${userEmail}:`, sendToUser.error);
    } else {
       console.log(`Welcome email sent to ${userEmail}`);
    }

    if (ADMIN_EMAIL_ADDRESS) {
        const sendToAdmin = await resend.emails.send({
          from: "notifications@email.buyauto.ch",
          to: ADMIN_EMAIL_ADDRESS,
          subject: "🎉 New User Signup on BuyAuto!",
          html: `
            <h1>New User Alert!</h1>
            <p>A new user has just signed up and confirmed their email address.</p>
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

    return new Response(JSON.stringify({ message: "Emails processed" }), {
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