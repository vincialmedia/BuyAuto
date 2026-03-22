import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";
import { Resend } from "npm:resend@3.2.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

type ListingStatus = "published" | "rejected" | "archived";
type DealType = "lease_takeover" | "direct_purchase";
type FinancingType = "cash" | "leasing";

function escapeHtml(input: string): string {
  return input
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function isRelevantStatus(status: unknown): status is ListingStatus {
  return status === "published" || status === "rejected" || status === "archived";
}

function formatListingTitle(record: { brand?: string | null; model?: string | null; title?: string | null }): string {
  const brand = record.brand?.trim() || "";
  const model = record.model?.trim() || "";
  const base = [brand, model].filter(Boolean).join(" ");
  const suffix = record.title?.trim() ? ` – ${record.title.trim()}` : "";
  return (base || "Ihr Fahrzeug") + suffix;
}

function dealTypeLabel(value: unknown): string | null {
  const v = value as DealType;
  if (v === "lease_takeover") return "Leasingübernahme";
  if (v === "direct_purchase") return "Direktkauf";
  return null;
}

function financingTypeLabel(value: unknown): string | null {
  const v = value as FinancingType;
  if (v === "leasing") return "Leasing";
  if (v === "cash") return "Barzahlung";
  return null;
}

function requireServiceAuthorization(req: Request): boolean {
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
  const auth = req.headers.get("Authorization") || "";
  return Boolean(serviceKey) && auth === `Bearer ${serviceKey}`;
}

function templateShell(params: { heading: string; bodyHtml: string }): string {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif; line-height: 1.6; color: #111827; background: #ffffff; }
    .container { max-width: 640px; margin: 0 auto; padding: 24px; }
    .header { text-align: center; padding-bottom: 18px; border-bottom: 1px solid #e5e7eb; }
    .content { padding: 22px 0; }
    .h1 { font-size: 22px; font-weight: 800; margin: 0; color: #111827; }
    .card { background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 16px; padding: 18px; }
    .button { display: inline-block; background-color: #dc2626; color: white; padding: 12px 18px; text-decoration: none; border-radius: 10px; font-weight: 800; }
    .muted { color: #6b7280; font-size: 13px; }
    .footer { border-top: 1px solid #e5e7eb; padding-top: 16px; text-align: center; color: #6b7280; font-size: 12px; }
    a { color: #2563eb; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <img src="https://buyauto.ch/buyauto-logo.png" alt="BuyAuto Logo" height="40">
    </div>

    <div class="content">
      <p class="h1">${params.heading}</p>
      ${params.bodyHtml}
    </div>

    <div class="footer">
      <p>&copy; ${new Date().getFullYear()} BuyAuto</p>
    </div>
  </div>
</body>
</html>`;
}

function buildListingCard(params: { listingTitle: string; dealLabel: string | null; financingLabel: string | null }): string {
  const dealLine = [params.dealLabel, params.financingLabel].filter(Boolean).join(" · ");
  const dealBlock = dealLine
    ? `<p style="margin: 10px 0 0 0; color: #6b7280; font-size: 14px;">${escapeHtml(dealLine)}</p>`
    : "";

  return `<div class="card">
    <p style="margin: 0; font-weight: 800;">${escapeHtml(params.listingTitle)}</p>
    ${dealBlock}
  </div>`;
}

function approvedTemplate(params: {
  name: string;
  listingTitle: string;
  listingUrl: string;
  dealLabel: string | null;
  financingLabel: string | null;
}): string {
  const card = buildListingCard(params);

  return templateShell({
    heading: "✅ Ihr Inserat wurde genehmigt",
    bodyHtml: `
      <p>Hallo ${escapeHtml(params.name)},</p>
      ${card}
      <p style="margin-top: 18px;">Ihr Inserat ist jetzt öffentlich sichtbar.</p>
      <div style="text-align: center; margin: 22px 0;">
        <a href="${params.listingUrl}" class="button">Inserat ansehen</a>
      </div>
      <p class="muted">Wenn Sie Änderungen vornehmen möchten, finden Sie das Inserat im Dashboard.</p>
      <p>Beste Grüsse<br>Ihr BuyAuto Team</p>
    `,
  });
}

function rejectedTemplate(params: {
  name: string;
  listingTitle: string;
  dashboardUrl: string;
  moderationNote: string | null;
  dealLabel: string | null;
  financingLabel: string | null;
}): string {
  const card = buildListingCard(params);
  const note = params.moderationNote?.trim()
    ? `<div class="card" style="background: #fff7ed; border-color: #fed7aa;">
         <p style="margin: 0; font-weight: 800;">Grund / Hinweis</p>
         <p style="margin: 10px 0 0 0; white-space: pre-wrap;">${escapeHtml(params.moderationNote.trim())}</p>
       </div>`
    : "";

  return templateShell({
    heading: "⚠️ Ihr Inserat benötigt Ihre Aufmerksamkeit",
    bodyHtml: `
      <p>Hallo ${escapeHtml(params.name)},</p>
      ${card}
      <p style="margin-top: 18px;">Leider konnten wir Ihr Inserat in der aktuellen Form nicht veröffentlichen.</p>
      ${note}
      <div style="text-align: center; margin: 22px 0;">
        <a href="${params.dashboardUrl}" class="button">Zum Dashboard</a>
      </div>
      <p class="muted">Bei Fragen können Sie einfach auf diese E-Mail antworten.</p>
      <p>Beste Grüsse<br>Ihr BuyAuto Team</p>
    `,
  });
}

function archivedTemplate(params: {
  name: string;
  listingTitle: string;
  moderationNote: string | null;
  dealLabel: string | null;
  financingLabel: string | null;
}): string {
  const card = buildListingCard(params);
  const note = params.moderationNote?.trim()
    ? `<div class="card">
         <p style="margin: 0; font-weight: 800;">Hinweis</p>
         <p style="margin: 10px 0 0 0; white-space: pre-wrap;">${escapeHtml(params.moderationNote.trim())}</p>
       </div>`
    : "";

  return templateShell({
    heading: "🗑️ Ihr Inserat wurde archiviert",
    bodyHtml: `
      <p>Hallo ${escapeHtml(params.name)},</p>
      ${card}
      <p style="margin-top: 18px;">Ihr Inserat ist nicht mehr öffentlich sichtbar.</p>
      ${note}
      <p class="muted">Wenn Sie Unterstützung benötigen, antworten Sie einfach auf diese E-Mail.</p>
      <p>Beste Grüsse<br>Ihr BuyAuto Team</p>
    `,
  });
}

function buildEmail(params: {
  status: ListingStatus;
  name: string;
  listingTitle: string;
  listingUrl: string;
  dashboardUrl: string;
  moderationNote: string | null;
  dealLabel: string | null;
  financingLabel: string | null;
}): { subject: string; html: string } {
  if (params.status === "published") {
    return {
      subject: "✅ Ihr Inserat wurde genehmigt!",
      html: approvedTemplate({
        name: params.name,
        listingTitle: params.listingTitle,
        listingUrl: params.listingUrl,
        dealLabel: params.dealLabel,
        financingLabel: params.financingLabel,
      }),
    };
  }

  if (params.status === "archived") {
    return {
      subject: "🗑️ Ihr Inserat wurde archiviert",
      html: archivedTemplate({
        name: params.name,
        listingTitle: params.listingTitle,
        moderationNote: params.moderationNote,
        dealLabel: params.dealLabel,
        financingLabel: params.financingLabel,
      }),
    };
  }

  return {
    subject: "⚠️ Ihr Inserat wurde abgelehnt",
    html: rejectedTemplate({
      name: params.name,
      listingTitle: params.listingTitle,
      dashboardUrl: params.dashboardUrl,
      moderationNote: params.moderationNote,
      dealLabel: params.dealLabel,
      financingLabel: params.financingLabel,
    }),
  };
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  if (!requireServiceAuthorization(req)) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 401,
    });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const resendKey = Deno.env.get("RESEND_API_KEY");

    if (!supabaseUrl || !serviceKey) {
      return new Response(JSON.stringify({ error: "SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY missing" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      });
    }
    if (!resendKey) {
      return new Response(JSON.stringify({ error: "RESEND_API_KEY missing" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      });
    }

    const supabase = createClient(supabaseUrl, serviceKey);
    const resend = new Resend(resendKey);

    const payload = await req.json().catch(() => ({} as Record<string, unknown>));
    const record = (payload as any)?.record;
    const oldRecord = (payload as any)?.old_record;
    const notificationStatus = (payload as any)?.notification_status;

    const newStatus: unknown = record?.status;
    const oldStatus: unknown = oldRecord?.status;

    if (!isRelevantStatus(newStatus) || newStatus === oldStatus) {
      return new Response(JSON.stringify({ success: true, message: "Status change not relevant" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    const ownerId: string | null = record?.created_by ?? record?.user_id ?? null;
    if (!ownerId) {
      return new Response(JSON.stringify({ success: true, message: "No owner on record" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("email, full_name")
      .eq("id", ownerId)
      .single();

    if (profileError || !profile?.email) {
      console.error("listing-status-notification profile error:", profileError);
      return new Response(JSON.stringify({ error: "Recipient email not found" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 404,
      });
    }

    const listingTitle = formatListingTitle(record);
    const listingUrl = `https://buyauto.ch/fahrzeug/${record.id}`;
    const dashboardUrl = "https://buyauto.ch/dashboard";

    const moderationNoteRaw =
      typeof record?.moderation_note === "string" ? (record.moderation_note as string) : null;

    const dealLabel = dealTypeLabel(record?.deal_type);
    const financingLabel = financingTypeLabel(record?.financing_type);

    const emailStatus: ListingStatus = isRelevantStatus(notificationStatus) ? notificationStatus : newStatus;

    const email = buildEmail({
      status: emailStatus,
      name: profile.full_name?.trim() || "Guten Tag",
      listingTitle,
      listingUrl,
      dashboardUrl,
      moderationNote: moderationNoteRaw,
      dealLabel,
      financingLabel,
    });

    const kind = `listing_status_${emailStatus}`;

    const { error: logError } = await supabase.from("email_notification_log").insert({
      kind,
      entity_id: record.id,
      recipient_user_id: ownerId,
      recipient_email: profile.email,
    });

    if (logError) {
      const code = (logError as unknown as { code?: string }).code;
      if (code === "23505") {
        return new Response(JSON.stringify({ success: true, skipped: "duplicate" }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        });
      }
      console.error("listing-status-notification log insert error:", logError);
    }

    const sendRes = await resend.emails.send({
      from: "BuyAuto <noreply@email.buyauto.ch>",
      to: profile.email,
      subject: email.subject,
      html: email.html,
    });

    if (sendRes.error) {
      console.error("listing-status-notification resend error:", sendRes.error);
      return new Response(JSON.stringify({ error: "Failed to send email" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      });
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("listing-status-notification error:", error);
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});