import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";
import { Resend } from "npm:resend@3.2.0";

// Nudges owners of unfinished drafts every 5 days.
//
// Cadence — one mail per step, each with its own subject line and body:
//   step 1  day  5   straightforward, name + vehicle in the subject
//   step 2  day 10   "did something go wrong?" (best-opening pattern)
//   step 3  day 15   effort reduction ("2 Minuten")
//   step 4  day 20   value / demand
//   step 5  day 25   deadline warning (5 days left)
//   step 6  archived the draft is now Archiviert, 5 days left to restore
//
// Steps 1-5 run off updated_at (last edit). Step 6 fires once the 30-day sweep
// has archived the draft, which keeps the whole ladder on a true 5-day spacing
// instead of racing the sweep at day 30.

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const SITE_URL = "https://buyauto.ch";
const REMINDER_KIND = "draft_completion_reminder";
const IDLE_STEP_DAYS = 5;
const MAX_IDLE_STEP = 5; // steps 1-5 while active; step 6 is the archived mail
const ARCHIVED_STEP = 6;
const ARCHIVE_AFTER_DAYS = 30;
const DELETE_AFTER_ARCHIVE_DAYS = 5;
// One owner can hold many drafts, and every one of them is independently due
// for a step. Without a cap the first run mails somebody a dozen times in one
// morning — several with the same subject line — which reads as spam and costs
// sender reputation. The rest are not lost: the log dedupes per step, so the
// remainder go out on following days, most urgent first.
const MAX_EMAILS_PER_OWNER_PER_RUN = 2;

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

function formatChf(value: number | null): string | null {
  if (typeof value !== "number" || !Number.isFinite(value)) return null;
  return `CHF ${value.toLocaleString("de-CH")}`;
}

function daysBetween(fromIso: string, now: Date): number {
  const then = Date.parse(fromIso);
  if (!Number.isFinite(then)) return 0;
  return Math.floor((now.getTime() - then) / (24 * 60 * 60 * 1000));
}

function firstName(fullName: string | null | undefined): string | null {
  const trimmed = (fullName ?? "").trim();
  if (!trimmed) return null;
  const first = trimmed.split(/\s+/)[0];
  return first && first.length > 1 ? first : null;
}

function dealTypeLabel(value: unknown): string | null {
  if (value === "lease_takeover") return "Leasingübernahme";
  if (value === "direct_purchase") return "Direktkauf";
  return null;
}

function financingTypeLabel(value: unknown): string | null {
  if (value === "leasing") return "Leasing";
  if (value === "cash") return "Barzahlung";
  return null;
}

/** A draft from either source, normalised into one shape. */
type DraftCandidate = {
  entityId: string;
  ownerId: string;
  resumeUrl: string;
  vehicleName: string;
  hasVehicleName: boolean;
  year: number | null;
  priceLabel: string | null;
  dealLabel: string | null;
  financingLabel: string | null;
  step: number;
  /** When the draft is (or was) archived — drives the copy in steps 5 and 6. */
  archiveDateIso: string | null;
  deleteDateIso: string | null;
};

function buildVehicleName(brand: unknown, model: unknown): { name: string; known: boolean } {
  const b = typeof brand === "string" ? brand.trim() : "";
  const m = typeof model === "string" ? model.trim() : "";
  const joined = [b, m].filter(Boolean).join(" ");
  return joined ? { name: joined, known: true } : { name: "Ihr Entwurf", known: false };
}

// ---------------------------------------------------------------------------
// Copy. One distinct subject + body per step.
// ---------------------------------------------------------------------------

type Copy = { subject: string; preheader: string; heading: string; body: string; cta: string };

function buildCopy(step: number, d: DraftCandidate, name: string | null): Copy {
  const vehicle = d.vehicleName;
  const archiveDate = d.archiveDateIso ? formatDateDeCh(d.archiveDateIso) : null;
  const deleteDate = d.deleteDateIso ? formatDateDeCh(d.deleteDateIso) : null;

  // A draft may not have a brand/model yet. Keeping the vehicle out of the
  // sentence entirely reads better than falling back to a placeholder noun,
  // which is why prose says "Ihr Entwurf<für X>" rather than interpolating a
  // stand-in that would collide with the surrounding article ("Ihr Ihr ...").
  const subjectNoun = d.hasVehicleName ? `Ihr ${vehicle}` : "Ihr Entwurf";
  const forVehicle = d.hasVehicleName ? ` für ${escapeHtml(vehicle)}` : "";
  // Subject lines stay under ~50 characters so they survive on mobile.
  const withName = (text: string) => (name ? `${name}, ${text}` : text.charAt(0).toUpperCase() + text.slice(1));

  switch (step) {
    case 1:
      return {
        subject: withName(`${subjectNoun} wartet noch`),
        preheader: "Ihr Inserat ist fast fertig – es fehlen nur noch wenige Angaben.",
        heading: "Ihr Inserat ist fast fertig",
        body: `Sie haben vor Kurzem angefangen zu inserieren, den Entwurf${forVehicle} aber noch nicht abgeschlossen. Er liegt bereit – Sie machen genau dort weiter, wo Sie aufgehört haben.`,
        cta: "Entwurf abschliessen",
      };
    case 2:
      return {
        subject: "Ist beim Inserieren etwas schiefgelaufen?",
        preheader: "Falls etwas hakte: wir helfen gerne weiter.",
        heading: "Ist etwas schiefgelaufen?",
        body: `Ihr Entwurf${forVehicle} liegt seit einer Weile unverändert bei uns. Falls beim Ausfüllen etwas nicht funktioniert hat oder eine Angabe unklar war: Antworten Sie einfach auf diese E-Mail, wir schauen es uns an.`,
        cta: "Entwurf öffnen",
      };
    case 3:
      return {
        subject: "Nur noch 2 Minuten bis zum Inserat",
        preheader: "Die restlichen Angaben sind schnell erledigt.",
        heading: "Zwei Minuten, dann ist es online",
        body: `Der aufwendige Teil ist erledigt: Ihr Entwurf${forVehicle} ist bereits erfasst. Es fehlen nur noch die letzten Angaben, dann geht Ihr Inserat in die Prüfung und anschliessend online.`,
        cta: "Jetzt fertigstellen",
      };
    case 4:
      return {
        subject: withName(`${subjectNoun} findet Käufer`),
        preheader: "Interessenten suchen täglich auf BuyAuto – Ihr Entwurf ist noch nicht sichtbar.",
        heading: "Ihr Fahrzeug ist noch nicht sichtbar",
        body: `Auf BuyAuto suchen täglich Interessentinnen und Interessenten nach passenden Fahrzeugen. Solange Ihr Entwurf${forVehicle} nicht abgeschlossen ist, sieht ihn niemand. Ein paar Klicks genügen.`,
        cta: "Inserat veröffentlichen",
      };
    case 5:
      return {
        subject: "Noch 5 Tage für Ihren Entwurf ⏳",
        preheader: archiveDate
          ? `Ihr Entwurf wird am ${archiveDate} archiviert.`
          : "Ihr Entwurf wird in 5 Tagen archiviert.",
        heading: "Ihr Entwurf läuft bald ab",
        body: `Entwürfe, die 30 Tage lang nicht bearbeitet werden, archivieren wir automatisch. Ihr Entwurf${forVehicle} wird ${
          archiveDate ? `am <strong>${escapeHtml(archiveDate)}</strong>` : "in <strong>5 Tagen</strong>"
        } archiviert. Bearbeiten Sie ihn jetzt, startet die Frist neu.`,
        cta: "Entwurf jetzt sichern",
      };
    default:
      return {
        subject: d.hasVehicleName ? `Letzte Chance: ${vehicle} wird gelöscht` : "Letzte Chance für Ihren Entwurf",
        preheader: deleteDate
          ? `Archiviert – bis ${deleteDate} können Sie den Entwurf noch wiederherstellen.`
          : "Archiviert – Sie haben noch 5 Tage.",
        heading: "Ihr Entwurf wurde archiviert",
        body: `Ihr Entwurf${forVehicle} wurde nach 30 Tagen ohne Bearbeitung archiviert. Sie können ihn noch ${
          deleteDate ? `bis zum <strong>${escapeHtml(deleteDate)}</strong>` : "<strong>5 Tage lang</strong>"
        } wiederherstellen – danach wird er endgültig gelöscht.`,
        cta: "Entwurf wiederherstellen",
      };
  }
}

function buildHtml(params: {
  copy: Copy;
  greeting: string;
  draft: DraftCandidate;
}): string {
  const { copy, greeting, draft } = params;

  const detailRows: string[] = [];
  if (draft.year) {
    detailRows.push(`<span>Jahrgang ${draft.year}</span>`);
  }
  const dealLine = [draft.dealLabel, draft.financingLabel].filter(Boolean).join(" · ");
  if (dealLine) detailRows.push(`<span>${escapeHtml(dealLine)}</span>`);
  if (draft.priceLabel) detailRows.push(`<span>${escapeHtml(draft.priceLabel)}</span>`);

  const detailBlock = detailRows.length
    ? `<p style="margin: 8px 0 0 0; color: #6b7280; font-size: 14px;">${detailRows.join(
        ' <span style="color:#d1d5db;">|</span> '
      )}</p>`
    : "";

  return `<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <style>
    body { font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif; line-height: 1.6; color: #111827; background: #ffffff; }
    .container { max-width: 640px; margin: 0 auto; padding: 24px; }
    .header { text-align: center; padding-bottom: 18px; border-bottom: 1px solid #e5e7eb; }
    .content { padding: 22px 0; }
    .card { background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 16px; padding: 18px; }
    .button { display: inline-block; background-color: #dc2626; color: #ffffff; padding: 12px 18px; text-decoration: none; border-radius: 10px; font-weight: 700; }
    .muted { color: #6b7280; font-size: 13px; }
    .footer { border-top: 1px solid #e5e7eb; padding-top: 16px; text-align: center; color: #6b7280; font-size: 12px; }
    a { color: #2563eb; }
    .preheader { display: none; max-height: 0; overflow: hidden; opacity: 0; }
  </style>
</head>
<body>
  <span class="preheader">${escapeHtml(copy.preheader)}</span>
  <div class="container">
    <div class="header">
      <img src="${SITE_URL}/buyauto-logo.png" alt="BuyAuto Logo" height="40">
    </div>

    <div class="content">
      <p>Hallo ${escapeHtml(greeting)},</p>

      <h2 style="margin: 0 0 14px 0; font-size: 20px;">${escapeHtml(copy.heading)}</h2>

      <div class="card">
        <p style="margin: 0; font-weight: 700; font-size: 17px;">
          <a href="${draft.resumeUrl}" style="color: #111827; text-decoration: underline;">${escapeHtml(
            draft.vehicleName
          )}</a>
        </p>
        ${detailBlock}
      </div>

      <p style="margin-top: 18px;">${copy.body}</p>

      <div style="text-align: center; margin: 24px 0;">
        <a href="${draft.resumeUrl}" class="button">${escapeHtml(copy.cta)}</a>
      </div>

      <p class="muted">
        Direktlink zu Ihrem Entwurf: <a href="${draft.resumeUrl}">${draft.resumeUrl}</a>
      </p>

      <p>Beste Grüsse<br>Ihr BuyAuto Team</p>
    </div>

    <div class="footer">
      <p>Sie erhalten diese E-Mail, weil in Ihrem BuyAuto-Konto ein unvollständiger Entwurf liegt.</p>
      <p><a href="${SITE_URL}/dashboard">Entwürfe verwalten</a></p>
      <p>&copy; ${new Date().getFullYear()} BuyAuto</p>
    </div>
  </div>
</body>
</html>`;
}

// ---------------------------------------------------------------------------

function requireServiceAuthorization(req: Request): boolean {
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
  const auth = req.headers.get("Authorization") || "";
  return Boolean(serviceKey) && auth === `Bearer ${serviceKey}`;
}

type ProfileRow = { id: string; email: string | null; full_name: string | null };

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

  const dryRun = new URL(req.url).searchParams.get("dry_run") === "true";

  const candidates: DraftCandidate[] = [];

  /**
   * Steps 1-5 come from idle time (days 5, 10, 15, 20, 25); step 6 comes from
   * the archive stamp. A draft already past 30 days idle gets nothing here —
   * the hourly sweep is about to archive it, and step 6 is the honest mail for
   * it. Without this, a months-old draft would be told it has "5 days left"
   * and handed an archive date in the past.
   */
  const stepForIdleDays = (idleDays: number): number | null => {
    const step = Math.floor(idleDays / IDLE_STEP_DAYS);
    if (step < 1 || step > MAX_IDLE_STEP) return null;
    return step;
  };

  const addDays = (iso: string, days: number): string =>
    new Date(Date.parse(iso) + days * 24 * 60 * 60 * 1000).toISOString();

  // --- Wizard drafts (listing_drafts) ---------------------------------------
  const { data: wizardDrafts, error: wizardError } = await supabase
    .from("listing_drafts")
    .select("id,user_id,data,updated_at,archived_at");

  if (wizardError) {
    console.error("draft-completion-reminder wizardError:", wizardError);
  }

  for (const row of wizardDrafts ?? []) {
    const data = (row.data ?? {}) as Record<string, unknown>;
    const { name, known } = buildVehicleName(data.brand, data.model);

    // A wizard draft that already spawned a listing row is represented by that
    // listing below — don't mail twice about the same vehicle.
    if (typeof data.id === "string" && data.id.length > 0) continue;

    const archivedAt = row.archived_at as string | null;
    const step = archivedAt ? ARCHIVED_STEP : stepForIdleDays(daysBetween(row.updated_at, now));
    if (step === null) continue;

    const year = typeof data.year === "number" ? data.year : null;
    const price =
      formatChf(typeof data.purchase_price_chf === "number" ? data.purchase_price_chf : null) ??
      (typeof data.price_per_month_chf === "number"
        ? `${formatChf(data.price_per_month_chf)}/Mt.`
        : null);

    candidates.push({
      entityId: row.id,
      ownerId: row.user_id,
      resumeUrl: `${SITE_URL}/inserat-erstellen?draft=${row.id}`,
      vehicleName: name,
      hasVehicleName: known,
      year,
      priceLabel: price,
      dealLabel: dealTypeLabel(data.deal_type),
      financingLabel: financingTypeLabel(data.financing_type),
      step,
      archiveDateIso: archivedAt ?? addDays(row.updated_at, ARCHIVE_AFTER_DAYS),
      deleteDateIso: archivedAt ? addDays(archivedAt, DELETE_AFTER_ARCHIVE_DAYS) : null,
    });
  }

  // --- Draft listings (listings.status = 'draft' / archived drafts) ---------
  const { data: draftListings, error: listingsError } = await supabase
    .from("listings")
    .select(
      "id,brand,model,year,status,updated_at,archived_at,archived_reason,created_by,user_id,deal_type,financing_type,purchase_price_chf,price_per_month_chf"
    )
    .or("status.eq.draft,and(status.eq.archived,archived_reason.eq.draft_expired)");

  if (listingsError) {
    console.error("draft-completion-reminder listingsError:", listingsError);
  }

  for (const row of draftListings ?? []) {
    const ownerId = (row.created_by ?? row.user_id) as string | null;
    if (!ownerId) continue;

    const isArchived = row.status === "archived";
    const archivedAt = row.archived_at as string | null;
    const step = isArchived ? ARCHIVED_STEP : stepForIdleDays(daysBetween(row.updated_at, now));
    if (step === null) continue;

    const { name, known } = buildVehicleName(row.brand, row.model);
    const price =
      formatChf(row.purchase_price_chf as number | null) ??
      (typeof row.price_per_month_chf === "number" ? `${formatChf(row.price_per_month_chf)}/Mt.` : null);

    candidates.push({
      entityId: row.id,
      ownerId,
      resumeUrl: `${SITE_URL}/inserat-erstellen?edit=${row.id}`,
      vehicleName: name,
      hasVehicleName: known,
      year: typeof row.year === "number" ? row.year : null,
      priceLabel: price,
      dealLabel: dealTypeLabel(row.deal_type),
      financingLabel: financingTypeLabel(row.financing_type),
      step,
      archiveDateIso: archivedAt ?? addDays(row.updated_at, ARCHIVE_AFTER_DAYS),
      deleteDateIso: archivedAt ? addDays(archivedAt, DELETE_AFTER_ARCHIVE_DAYS) : null,
    });
  }

  // --- Throttle per owner ---------------------------------------------------
  // Highest step first, so the drafts closest to deletion are never starved by
  // ones that merely just became due.
  const byOwner = new Map<string, DraftCandidate[]>();
  for (const candidate of candidates) {
    const bucket = byOwner.get(candidate.ownerId);
    if (bucket) bucket.push(candidate);
    else byOwner.set(candidate.ownerId, [candidate]);
  }

  const throttled: DraftCandidate[] = [];
  let deferred = 0;
  for (const bucket of byOwner.values()) {
    bucket.sort((a, b) => b.step - a.step);
    throttled.push(...bucket.slice(0, MAX_EMAILS_PER_OWNER_PER_RUN));
    deferred += Math.max(0, bucket.length - MAX_EMAILS_PER_OWNER_PER_RUN);
  }

  // --- Recipients -----------------------------------------------------------
  const ownerIds = Array.from(new Set(throttled.map((c) => c.ownerId)));
  const profilesById = new Map<string, ProfileRow>();

  if (ownerIds.length > 0) {
    const { data: profiles, error: profilesError } = await supabase
      .from("profiles")
      .select("id,email,full_name")
      .in("id", ownerIds);

    if (profilesError) {
      console.error("draft-completion-reminder profilesError:", profilesError);
    } else {
      for (const p of (profiles ?? []) as ProfileRow[]) profilesById.set(p.id, p);
    }
  }

  let sent = 0;
  let skipped = 0;
  let errors = 0;
  const preview: Array<{ entityId: string; step: number; subject: string; to: string }> = [];

  for (const draft of throttled) {
    const profile = profilesById.get(draft.ownerId);
    const email = profile?.email?.trim() || "";
    if (!email) {
      skipped++;
      continue;
    }

    const name = firstName(profile?.full_name);
    const copy = buildCopy(draft.step, draft, name);

    if (dryRun) {
      preview.push({ entityId: draft.entityId, step: draft.step, subject: copy.subject, to: email });
      continue;
    }

    // The unique index on (kind, entity_id, days_before, recipient_email) makes
    // this insert the send-once lock for this step of this draft.
    const { error: logError } = await supabase.from("email_notification_log").insert({
      kind: REMINDER_KIND,
      entity_id: draft.entityId,
      recipient_user_id: draft.ownerId,
      recipient_email: email,
      days_before: draft.step,
    });

    if (logError) {
      if ((logError as unknown as { code?: string }).code === "23505") {
        skipped++;
        continue;
      }
      console.error("draft-completion-reminder log insert error:", logError);
      errors++;
      continue;
    }

    const sendRes = await resend.emails.send({
      from: "BuyAuto <noreply@email.buyauto.ch>",
      to: email,
      subject: copy.subject,
      html: buildHtml({ copy, greeting: name ?? "Guten Tag", draft }),
    });

    if (sendRes.error) {
      console.error("draft-completion-reminder resend error:", sendRes.error);
      errors++;
      continue;
    }

    sent++;
  }

  return new Response(
    JSON.stringify({
      success: true,
      dryRun,
      scanned: candidates.length,
      eligible: throttled.length,
      deferredByOwnerCap: deferred,
      sent,
      skipped,
      errors,
      ...(dryRun ? { preview } : {}),
    }),
    {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    }
  );
});
