import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";
import { Resend } from "npm:resend@3.2.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

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

type OverrideRow = {
  id: string;
  dealer_id: string;
  plan_id: string;
  ends_at: string;
};

type GarageRow = { id: string; owner_user_id: string | null; garage_name: string | null; contact_email: string | null };
type PlanRow = { id: string; code: string | null; name: string | null };
type ProfileRow = { id: string; email: string | null; full_name: string | null };

function requireServiceAuthorization(req: Request): boolean {
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
  const auth = req.headers.get("Authorization") || "";
  return Boolean(serviceKey) && auth === `Bearer ${serviceKey}`;
}

function buildEmail(params: {
  name: string;
  garageName: string;
  planName: string;
  endsAtIso: string;
  daysBefore: number;
  dashboardUrl: string;
  pricingUrl: string;
}): { subject: string; html: string } {
  const endsDate = formatDateDeCh(params.endsAtIso);

  return {
    subject: `⏳ Ihr Trial endet in ${params.daysBefore} Tagen`,
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
      <img src="https://buyauto.ch/buyauto-logo.png" alt="BuyAuto Logo" height="40">
    </div>

    <div class="content">
      <p>Hallo ${escapeHtml(params.name)},</p>

      <div class="card">
        <p style="margin: 0; font-weight: 700;">${escapeHtml(params.garageName)}</p>
        <p style="margin: 10px 0 0 0;">Plan: <strong>${escapeHtml(params.planName)}</strong></p>
        <p style="margin: 10px 0 0 0;">Ende des Trials: <strong>${escapeHtml(endsDate)}</strong></p>
      </div>

      <p style="margin-top: 18px;">
        Ihr Trial endet in <strong>${params.daysBefore} Tagen</strong>. Öffnen Sie Ihr Dashboard, um Ihren Plan zu verwalten.
      </p>

      <div style="text-align: center; margin: 22px 0;">
        <a href="${params.dashboardUrl}" class="button">Zum Dashboard</a>
      </div>

      <p class="muted">
        Preise & Pläne: <a href="${params.pricingUrl}">${params.pricingUrl}</a>
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

    const { data: overrides, error: overridesError } = await supabase
      .from("dealer_admin_overrides")
      .select("id,dealer_id,plan_id,ends_at")
      .gte("ends_at", start.toISOString())
      .lt("ends_at", end.toISOString());

    if (overridesError) {
      console.error("trial-expiry-reminder overridesError:", overridesError);
      results.push({ daysBefore, scanned: 0, sent: 0, skipped: 0, errors: 1 });
      continue;
    }

    const rows: OverrideRow[] = Array.isArray(overrides) ? (overrides as OverrideRow[]) : [];
    const dealerIds = Array.from(new Set(rows.map((r) => r.dealer_id)));
    const planIds = Array.from(new Set(rows.map((r) => r.plan_id)));

    const garagesById = new Map<string, GarageRow>();
    if (dealerIds.length > 0) {
      const { data: garages, error: garagesError } = await supabase
        .from("garages")
        .select("id,owner_user_id,garage_name,contact_email")
        .in("id", dealerIds);

      if (garagesError) console.error("trial-expiry-reminder garagesError:", garagesError);
      const gRows = Array.isArray(garages) ? (garages as GarageRow[]) : [];
      for (const g of gRows) garagesById.set(g.id, g);
    }

    const plansById = new Map<string, PlanRow>();
    if (planIds.length > 0) {
      const { data: plans, error: plansError } = await supabase.from("dealer_plans").select("id,code,name").in("id", planIds);
      if (plansError) console.error("trial-expiry-reminder plansError:", plansError);
      const pRows = Array.isArray(plans) ? (plans as PlanRow[]) : [];
      for (const p of pRows) plansById.set(p.id, p);
    }

    const ownerIds = Array.from(
      new Set(
        dealerIds
          .map((id) => garagesById.get(id)?.owner_user_id ?? null)
          .filter((v): v is string => typeof v === "string" && v.length > 0)
      )
    );

    const profilesById = new Map<string, ProfileRow>();
    if (ownerIds.length > 0) {
      const { data: profiles, error: profilesError } = await supabase.from("profiles").select("id,email,full_name").in("id", ownerIds);
      if (profilesError) console.error("trial-expiry-reminder profilesError:", profilesError);
      const pr = Array.isArray(profiles) ? (profiles as ProfileRow[]) : [];
      for (const p of pr) profilesById.set(p.id, p);
    }

    let sent = 0;
    let skipped = 0;
    let errors = 0;

    for (const o of rows) {
      const garage = garagesById.get(o.dealer_id);
      const plan = plansById.get(o.plan_id);
      const ownerUserId = garage?.owner_user_id ?? null;

      const fallbackEmail = garage?.contact_email?.trim() || "";
      const profile = ownerUserId ? profilesById.get(ownerUserId) : undefined;
      const email = (profile?.email?.trim() || fallbackEmail).trim();

      if (!email || !o.ends_at) {
        skipped++;
        continue;
      }

      const { error: logError } = await supabase.from("email_notification_log").insert({
        kind: "trial_expiry_reminder",
        entity_id: o.id,
        recipient_user_id: ownerUserId,
        recipient_email: email,
        days_before: daysBefore,
      });

      if (logError) {
        const code = (logError as unknown as { code?: string }).code;
        if (code === "23505") {
          skipped++;
          continue;
        }
        console.error("trial-expiry-reminder log insert error:", logError);
        errors++;
        continue;
      }

      const name = profile?.full_name?.trim() || "Guten Tag";
      const garageName = garage?.garage_name?.trim() || "Ihre Garage";
      const planName = plan?.name?.trim() || plan?.code?.trim() || "Plan";
      const dashboardUrl = "https://buyauto.ch/dashboard/garage";
      const pricingUrl = "https://buyauto.ch/garage-plan";

      const emailPayload = buildEmail({
        name,
        garageName,
        planName,
        endsAtIso: o.ends_at,
        daysBefore,
        dashboardUrl,
        pricingUrl,
      });

      const sendRes = await resend.emails.send({
        from: "BuyAuto <noreply@email.buyauto.ch>",
        to: email,
        subject: emailPayload.subject,
        html: emailPayload.html,
      });

      if (sendRes.error) {
        console.error("trial-expiry-reminder resend error:", sendRes.error);
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