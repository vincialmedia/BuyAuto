import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS, PUT, DELETE",
};

type ListingStatus = "published" | "rejected" | "archived";

function escapeHtml(input: string): string {
  return input
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function formatListingTitle(record: { brand?: string | null; model?: string | null; title?: string | null }): string {
  const brand = record.brand?.trim() || "";
  const model = record.model?.trim() || "";
  const base = [brand, model].filter(Boolean).join(" ");
  const suffix = record.title?.trim() ? ` – ${record.title.trim()}` : "";
  return (base || "Ihr Fahrzeug") + suffix;
}

function isRelevantStatus(status: unknown): status is ListingStatus {
  return status === "published" || status === "rejected" || status === "archived";
}

async function handler(req: Request): Promise<Response> {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { record, old_record } = await req.json();

    const newStatus: unknown = record?.status;
    const oldStatus: unknown = old_record?.status;

    if (!isRelevantStatus(newStatus) || newStatus === oldStatus) {
      return new Response(
        JSON.stringify({
          success: true,
          message: "Status change not relevant for notifications",
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        }
      );
    }

    const ownerId: string | null = record?.created_by ?? null;

    if (!ownerId) {
      return new Response(
        JSON.stringify({
          success: true,
          message: "No owner on record, skipping",
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        }
      );
    }

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("email, full_name")
      .eq("id", ownerId)
      .single();

    if (profileError || !profile?.email) {
      console.error("Error fetching profile:", profileError);
      throw new Error("Could not find user profile email");
    }

    const listingUrl = `https://buyauto.ch/fahrzeug/${record.id}`;
    const listingTitle = formatListingTitle(record);

    const safeName = escapeHtml(profile.full_name?.trim() || "Lieber Nutzer");
    const safeListingTitle = escapeHtml(listingTitle);

    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (!resendApiKey) {
      throw new Error("RESEND_API_KEY not configured");
    }

    const email = buildEmail({
      status: newStatus,
      name: safeName,
      listingTitle: safeListingTitle,
      listingUrl,
      moderationNote: typeof record?.moderation_note === "string" ? record.moderation_note : null,
    });

    const resendResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "BuyAuto <info@email.buyauto.ch>",
        to: [profile.email],
        subject: email.subject,
        html: email.html,
      }),
    });

    const resendData = await resendResponse.json();

    if (!resendResponse.ok) {
      console.error("Resend error:", resendData);
      throw new Error(`Failed to send email`);
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `Status email sent successfully`,
        emailId: resendData.id,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Error in listing-status-notification:", error);
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
}

function buildEmail(params: {
  status: ListingStatus;
  name: string;
  listingTitle: string;
  listingUrl: string;
  moderationNote: string | null;
}): { subject: string; html: string } {
  if (params.status === "published") {
    return {
      subject: "✅ Ihr Inserat wurde genehmigt!",
      html: approvedTemplate(params),
    };
  }

  if (params.status === "archived") {
    return {
      subject: "🗑️ Ihr Inserat wurde archiviert",
      html: archivedTemplate(params),
    };
  }

  return {
    subject: "⚠️ Ihr Inserat benötigt Ihre Aufmerksamkeit",
    html: rejectedTemplate(params),
  };
}

function approvedTemplate(params: {
  name: string;
  listingTitle: string;
  listingUrl: string;
}): string {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background-color: #16a34a; color: white; padding: 20px; text-align: center; }
    .content { padding: 20px; background-color: #f9f9f9; }
    .button { display: inline-block; padding: 12px 24px; background-color: #16a34a; color: white; text-decoration: none; border-radius: 6px; margin: 20px 0; }
    .footer { padding: 20px; text-align: center; font-size: 12px; color: #666; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🎉 Ihr Inserat ist live</h1>
    </div>
    <div class="content">
      <p>Hallo ${params.name},</p>
      <p>Ihr Inserat <strong>${params.listingTitle}</strong> wurde erfolgreich geprüft und veröffentlicht.</p>
      <p style="text-align: center;">
        <a href="${params.listingUrl}" class="button">Inserat ansehen</a>
      </p>
      <p>Viel Erfolg!</p>
    </div>
    <div class="footer">
      <p>Mit freundlichen Grüßen,<br>Ihr BuyAuto Team</p>
      <p><a href="https://buyauto.ch">buyauto.ch</a></p>
    </div>
  </div>
</body>
</html>`;
}

function rejectedTemplate(params: {
  name: string;
  listingTitle: string;
  moderationNote: string | null;
}): string {
  const note = params.moderationNote?.trim()
    ? `<div style="background-color:#fff3cd;border-left:4px solid #ffc107;padding:15px;margin:20px 0;">
         <strong>Grund der Ablehnung:</strong><br>${escapeHtml(params.moderationNote.trim())}
       </div>`
    : "";

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background-color: #dc2626; color: white; padding: 20px; text-align: center; }
    .content { padding: 20px; background-color: #f9f9f9; }
    .button { display: inline-block; padding: 12px 24px; background-color: #2563eb; color: white; text-decoration: none; border-radius: 6px; margin: 20px 0; }
    .footer { padding: 20px; text-align: center; font-size: 12px; color: #666; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>⚠️ Inserat benötigt Überarbeitung</h1>
    </div>
    <div class="content">
      <p>Hallo ${params.name},</p>
      <p>Leider konnten wir Ihr Inserat <strong>${params.listingTitle}</strong> nicht in der aktuellen Form veröffentlichen.</p>
      ${note}
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
</html>`;
}

function archivedTemplate(params: {
  name: string;
  listingTitle: string;
  moderationNote: string | null;
}): string {
  const note = params.moderationNote?.trim()
    ? `<div style="background-color:#f1f5f9;border-left:4px solid #64748b;padding:15px;margin:20px 0;">
         <strong>Hinweis:</strong><br>${escapeHtml(params.moderationNote.trim())}
       </div>`
    : "";

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background-color: #0f172a; color: white; padding: 20px; text-align: center; }
    .content { padding: 20px; background-color: #f9f9f9; }
    .footer { padding: 20px; text-align: center; font-size: 12px; color: #666; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🗑️ Inserat archiviert</h1>
    </div>
    <div class="content">
      <p>Hallo ${params.name},</p>
      <p>Ihr Inserat <strong>${params.listingTitle}</strong> wurde durch unser Team archiviert und ist nicht mehr öffentlich sichtbar.</p>
      <p>Das Inserat wird nach <strong>30 Tagen</strong> automatisch gelöscht.</p>
      ${note}
      <p>Bei Fragen stehen wir Ihnen gerne zur Verfügung.</p>
    </div>
    <div class="footer">
      <p>Mit freundlichen Grüßen,<br>Ihr BuyAuto Team</p>
      <p><a href="https://buyauto.ch">buyauto.ch</a></p>
    </div>
  </div>
</body>
</html>`;
}

serve(handler);