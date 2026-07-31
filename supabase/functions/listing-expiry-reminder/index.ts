import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";
import { Resend } from "npm:resend@3.2.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

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

function formatDateDeCh(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("de-CH", { day: "2-digit", month: "2-digit", year: "numeric" });
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

type ListingRow = {
  id: string;
  brand: string | null;
  model: string | null;
  title: string | null;
  expires_at: string | null;
  created_by: string | null;
  user_id: string | null;
  deal_type: DealType | null;
  financing_type: FinancingType | null;
  price_plan: string | null;
};

type ProfileRow = { id: string; email: string | null; full_name: string | null };

function buildEmail(params: {
  name: string;
  listingTitle: string;
  expiresAtIso: string;
  daysBefore: number;
  listingUrl: string;
  dashboardUrl: string;
  dealLabel: string | null;
  financingLabel: string | null;
  pricePlan: string | null;
}): { subject: string; html: string } {
  const expiresDate = formatDateDeCh(params.expiresAtIso);
  const dealLine = [params.dealLabel, params.financingLabel].filter(Boolean).join(" · ");
  const dealBlock = dealLine
    ? `<p style="margin: 10px 0 0 0; color: #6b7280; font-size: 14px;">${escapeHtml(dealLine)}</p>`
    : "";

  return {
    subject: `⏳ Ihr Inserat läuft in ${params.daysBefore} Tagen ab`,
    html: `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif; line-height: 1.6; color: #111827; background: #ffffff; }
    .container { max-width: 640px; margin: 0 auto; padding: 24px; }
    .header { text-align: center; padding-bottom: 18px; border-bottom: 1px solid #e5e7eb; }
    .content { padding: 22px 0; }
    .card { background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 16px; padding: 18px; }
    .button { display: inline-block; background-color: #dc2626; color: white; padding: 12px 18px; text-decoration: none; border-radius: 10px; font-weight: 700; }
    .muted { color: #6b7280; font-size: 13px; }
    .footer { border-top: 1px solid #e5e7eb; padding-top: 16px; text-align: center; color: #6b7280; font-size: 12px; }
    a { color: #2563eb; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <img src="https://buyauto.ch/buyauto-logo-email.png" alt="BuyAuto" width="160" height="61" style="display: block; margin: 0 auto; border: 0; max-width: 100%;">
    </div>

    <div class="content">
      <p>Hallo ${escapeHtml(params.name)},</p>

      <div class="card">
        <p style="margin: 0; font-weight: 700;">${escapeHtml(params.listingTitle)}</p>
        ${dealBlock}
        <p style="margin: 10px 0 0 0;">Ablaufdatum: <strong>${escapeHtml(expiresDate)}</strong></p>
      </div>

      <p style="margin-top: 18px;">
        Ihr Inserat läuft in <strong>${params.daysBefore} Tagen</strong> ab. Öffnen Sie Ihr Dashboard, um Ihr Inserat zu verwalten.
      </p>

      ${
        params.pricePlan === "extended"
          ? `<p style="color: #b45309;">
        Nach dem Ablauf wird Ihr Inserat offline genommen. Als Verlängert-Kunde verlängern Sie danach für
        <strong> CHF 15</strong> statt CHF 30 – erneut 90 Tage Laufzeit, Premium-Platzierung inklusive.
      </p>`
          : `<p style="color: #b45309;">
        Nach dem Ablauf wird Ihr Inserat offline genommen. Eine erneute Veröffentlichung kostet danach
        <strong> CHF 30</strong> – oder Sie wechseln beim Wiedereinstellen für CHF 50 auf
        <strong> Verlängert</strong> (90 Tage Laufzeit, Premium-Platzierung inklusive).
      </p>`
      }

      <div style="text-align: center; margin: 22px 0;">
        <a href="${params.dashboardUrl}" class="button">Zum Dashboard</a>
      </div>

      <p class="muted">
        Direktlink zum Inserat: <a href="${params.listingUrl}">${params.listingUrl}</a>
      </p>

      <p>Beste Grüsse<br>Ihr BuyAuto Team</p>
    </div>

    <div class="footer">
      <p>&copy; ${new Date().getFullYear()} BuyAuto</p>
    </div>
  </div>
</body>
</html>`,
  };
}

function requireServiceAuthorization(req: Request): boolean {
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
  const auth = req.headers.get("Authorization") || "";
  return Boolean(serviceKey) && auth === `Bearer ${serviceKey}`;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  if (!requireServiceAuthorization(req)) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 401,
    });
  }

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

  const now = new Date();
  const daysBeforeList = [7, 3];

  const results: Array<{ daysBefore: number; scanned: number; sent: number; skipped: number; errors: number }> = [];

  for (const daysBefore of daysBeforeList) {
    const start = new Date(now.getTime() + daysBefore * 24 * 60 * 60 * 1000);
    const end = new Date(now.getTime() + (daysBefore + 1) * 24 * 60 * 60 * 1000);

    const { data: listings, error: listingsError } = await supabase
      .from("listings")
      .select("id,brand,model,title,expires_at,created_by,user_id,deal_type,financing_type,price_plan,status")
      .eq("status", "published")
      .gte("expires_at", start.toISOString())
      .lt("expires_at", end.toISOString());

    if (listingsError) {
      console.error("listing-expiry-reminder listingsError:", listingsError);
      results.push({ daysBefore, scanned: 0, sent: 0, skipped: 0, errors: 1 });
      continue;
    }

    const rows: ListingRow[] = Array.isArray(listings) ? (listings as ListingRow[]) : [];
    const ownerIds = Array.from(
      new Set(
        rows
          .map((r) => (r.created_by ?? r.user_id) || null)
          .filter((v): v is string => typeof v === "string" && v.length > 0)
      )
    );

    const profilesById = new Map<string, ProfileRow>();
    if (ownerIds.length > 0) {
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("id,email,full_name")
        .in("id", ownerIds);

      if (profilesError) {
        console.error("listing-expiry-reminder profilesError:", profilesError);
      } else {
        const profRows = Array.isArray(profiles) ? (profiles as ProfileRow[]) : [];
        for (const p of profRows) profilesById.set(p.id, p);
      }
    }

    let sent = 0;
    let skipped = 0;
    let errors = 0;

    for (const listing of rows) {
      const ownerId = (listing.created_by ?? listing.user_id) || null;
      const expiresAtIso = listing.expires_at;
      if (!ownerId || !expiresAtIso) {
        skipped++;
        continue;
      }

      const profile = profilesById.get(ownerId);
      const email = profile?.email?.trim() || "";
      if (!email) {
        skipped++;
        continue;
      }

      const { error: logError } = await supabase.from("email_notification_log").insert({
        kind: "listing_expiry_reminder",
        entity_id: listing.id,
        recipient_user_id: ownerId,
        recipient_email: email,
        days_before: daysBefore,
      });

      if (logError) {
        const code = (logError as unknown as { code?: string }).code;
        if (code === "23505") {
          skipped++;
          continue;
        }
        console.error("listing-expiry-reminder log insert error:", logError);
        errors++;
        continue;
      }

      const name = profile?.full_name?.trim() || "Guten Tag";
      const listingTitle = formatListingTitle(listing);
      const listingUrl = `https://buyauto.ch/fahrzeug/${listing.id}`;
      const dashboardUrl = "https://buyauto.ch/dashboard";

      const emailPayload = buildEmail({
        name,
        listingTitle,
        expiresAtIso,
        daysBefore,
        listingUrl,
        dashboardUrl,
        dealLabel: dealTypeLabel(listing.deal_type),
        financingLabel: financingTypeLabel(listing.financing_type),
        pricePlan: listing.price_plan ?? null,
      });

      const sendRes = await resend.emails.send({
        from: "BuyAuto <noreply@email.buyauto.ch>",
        reply_to: "hello@buyauto.ch",
        to: email,
        subject: emailPayload.subject,
        html: emailPayload.html,
      });

      if (sendRes.error) {
        console.error("listing-expiry-reminder resend error:", sendRes.error);
        errors++;
        continue;
      }

      sent++;
    }

    results.push({ daysBefore, scanned: rows.length, sent, skipped, errors });
  }

  return new Response(JSON.stringify({ success: true, results }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
    status: 200,
  });
});