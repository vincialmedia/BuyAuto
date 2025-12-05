import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE',
};

async function handler(req: Request): Promise<Response> {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { record, old_record } = await req.json();
    
    // Only proceed if status changed to 'published' or 'rejected'
    if (record.status !== 'published' && record.status !== 'rejected') {
      return new Response(JSON.stringify({ 
        success: true, 
        message: 'Status change not relevant for notifications' 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // Fetch the listing owner's profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('email, full_name')
      .eq('id', record.created_by)
      .single();

    if (profileError || !profile) {
      console.error('Error fetching profile:', profileError);
      throw new Error('Could not find user profile');
    }

    // Prepare email content based on status
    const isApproved = record.status === 'published';
    const listingUrl = `https://buyauto.ch/fahrzeug/${record.id}`;
    
    const emailSubject = isApproved 
      ? '✅ Ihr Inserat wurde genehmigt!' 
      : '⚠️ Ihr Inserat benötigt Ihre Aufmerksamkeit';

    const emailHtml = isApproved
      ? `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #4CAF50; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; background-color: #f9f9f9; }
            .button { display: inline-block; padding: 12px 24px; background-color: #4CAF50; color: white; text-decoration: none; border-radius: 4px; margin: 20px 0; }
            .footer { padding: 20px; text-align: center; font-size: 12px; color: #666; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🎉 Herzlichen Glückwunsch!</h1>
            </div>
            <div class="content">
              <p>Hallo ${profile.full_name || 'Lieber Nutzer'},</p>
              <p>Wir freuen uns, Ihnen mitteilen zu können, dass Ihr Inserat <strong>${record.make} ${record.model}</strong> erfolgreich geprüft und veröffentlicht wurde!</p>
              <p>Ihr Inserat ist jetzt live und für alle Interessenten auf BuyAuto sichtbar.</p>
              <p style="text-align: center;">
                <a href="${listingUrl}" class="button">Inserat ansehen</a>
              </p>
              <p><strong>Was nun?</strong></p>
              <ul>
                <li>Ihr Inserat ist auf der BuyAuto-Plattform sichtbar</li>
                <li>Interessenten können Sie direkt kontaktieren</li>
                <li>Sie erhalten eine E-Mail bei jeder neuen Anfrage</li>
              </ul>
              <p>Viel Erfolg bei der Leasingübernahme!</p>
            </div>
            <div class="footer">
              <p>Mit freundlichen Grüßen,<br>Ihr BuyAuto Team</p>
              <p><a href="https://buyauto.ch">buyauto.ch</a></p>
            </div>
          </div>
        </body>
        </html>
      `
      : `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #f44336; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; background-color: #f9f9f9; }
            .warning-box { background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; }
            .button { display: inline-block; padding: 12px 24px; background-color: #2196F3; color: white; text-decoration: none; border-radius: 4px; margin: 20px 0; }
            .footer { padding: 20px; text-align: center; font-size: 12px; color: #666; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>⚠️ Inserat benötigt Überarbeitung</h1>
            </div>
            <div class="content">
              <p>Hallo ${profile.full_name || 'Lieber Nutzer'},</p>
              <p>Leider konnten wir Ihr Inserat <strong>${record.make} ${record.model}</strong> nicht in der aktuellen Form veröffentlichen.</p>
              ${record.moderation_note ? `
                <div class="warning-box">
                  <strong>Grund der Ablehnung:</strong><br>
                  ${record.moderation_note}
                </div>
              ` : ''}
              <p><strong>Was nun?</strong></p>
              <ul>
                <li>Bitte überprüfen Sie die oben genannten Punkte</li>
                <li>Bearbeiten Sie Ihr Inserat entsprechend</li>
                <li>Reichen Sie es erneut zur Prüfung ein</li>
              </ul>
              <p style="text-align: center;">
                <a href="https://buyauto.ch/dashboard" class="button">Zum Dashboard</a>
              </p>
              <p>Bei Fragen stehen wir Ihnen gerne zur Verfügung.</p>
            </div>
            <div class="footer">
              <p>Mit freundlichen Grüßen,<br>Ihr BuyAuto Team</p>
              <p><a href="https://buyauto.ch">buyauto.ch</a></p>
            </div>
          </div>
        </body>
        </html>
      `;

    // Send email via Resend
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (!resendApiKey) {
      throw new Error('RESEND_API_KEY not configured');
    }

    const resendResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'BuyAuto <info@email.buyauto.ch>',
        to: [profile.email],
        subject: emailSubject,
        html: emailHtml,
      }),
    });

    const resendData = await resendResponse.json();

    if (!resendResponse.ok) {
      console.error('Resend error:', resendData);
      throw new Error(`Failed to send email: ${JSON.stringify(resendData)}`);
    }

    return new Response(JSON.stringify({
      success: true,
      message: `${isApproved ? 'Approval' : 'Rejection'} email sent successfully`,
      emailId: resendData.id
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    console.error('Error in listing-status-notification:', error);
    return new Response(JSON.stringify({ 
      error: error.message 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
}

serve(handler);