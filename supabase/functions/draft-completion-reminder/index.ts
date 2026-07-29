import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";
import { Resend } from "npm:resend@3.2.0";

// One reminder email per owner, listing every draft they still have open.
//
// An owner with a dozen drafts gets a dozen nudges if you mail per draft, so
// the unit here is the owner: one digest listing up to MAX_DRAFTS_LISTED
// drafts, each with its own countdown and a link straight into it, then
// "und N weitere" for the rest.
//
// Tone escalates with the most urgent draft in the digest — each step has its
// own subject line and intro:
//   step 1  day  5   straightforward, name + vehicle in the subject
//   step 2  day 10   "did something go wrong?" (best-opening pattern)
//   step 3  day 15   effort reduction ("2 Minuten")
//   step 4  day 20   value / demand
//   step 5  day 25   deadline warning (5 days left)
//   step 6  archived Archiviert, 5 days left to restore
//
// Steps 1-5 come from updated_at (last edit); step 6 comes from the archive
// stamp set by the 30-day sweep.

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
/** Drafts shown in full before the digest collapses the rest into "und N weitere". */
const MAX_DRAFTS_LISTED = 10;
/** Floor between two digests to the same owner, so staggered drafts can't mail daily. */
const MIN_DAYS_BETWEEN_DIGESTS = 5;

const MS_PER_DAY = 24 * 60 * 60 * 1000;

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
  return Math.floor((now.getTime() - then) / MS_PER_DAY);
}

function daysUntil(iso: string, now: Date): number {
  return Math.max(0, Math.ceil((Date.parse(iso) - now.getTime()) / MS_PER_DAY));
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

function pluralDays(n: number): string {
  return `${n} ${n === 1 ? "Tag" : "Tagen"}`;
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
  archived: boolean;
  /** Days until this draft is archived (active) or deleted (archived). */
  daysLeft: number;
  dueDateIso: string;
};

function buildVehicleName(brand: unknown, model: unknown): { name: string; known: boolean } {
  const b = typeof brand === "string" ? brand.trim() : "";
  const m = typeof model === "string" ? model.trim() : "";
  const joined = [b, m].filter(Boolean).join(" ");
  return joined ? { name: joined, known: true } : { name: "Entwurf ohne Fahrzeugangabe", known: false };
}

/** "Noch 3 Tage bis zur Löschung" / "Noch 12 Tage bis zur Archivierung" */
function countdownLabel(draft: DraftCandidate): string {
  const what = draft.archived ? "Löschung" : "Archivierung";
  if (draft.daysLeft <= 0) return `Heute – ${what} steht an`;
  return `Noch ${pluralDays(draft.daysLeft)} bis zur ${what}`;
}

// ---------------------------------------------------------------------------
// Copy. Subject and intro follow the most urgent draft in the digest.
// ---------------------------------------------------------------------------

type Copy = { subject: string; preheader: string; heading: string; intro: string; cta: string };

function buildCopy(params: {
  step: number;
  /** Every open draft this owner has. */
  count: number;
  /** Only the drafts sitting at the step that drives the subject. */
  urgentCount: number;
  mostUrgent: DraftCandidate;
  name: string | null;
}): Copy {
  const { step, mostUrgent, name } = params;
  // Steps 5 and 6 make a claim about a deadline, so they may only ever count
  // the drafts that deadline actually applies to — telling someone all twelve
  // of their drafts are about to be deleted when two are archived is a lie.
  // Steps 1-4 are generic "still unfinished" nudges, true of every draft.
  const count = step >= 5 ? params.urgentCount : params.count;
  const multi = count > 1;
  const vehicle = mostUrgent.vehicleName;
  // Only name the vehicle when we actually know it, so the article in the
  // surrounding sentence never collides with a placeholder noun.
  const subjectNoun = mostUrgent.hasVehicleName ? `Ihr ${vehicle}` : "Ihr Entwurf";
  const forVehicle = mostUrgent.hasVehicleName ? ` für ${escapeHtml(vehicle)}` : "";
  // Subject lines stay under ~50 characters so they survive on mobile.
  const withName = (text: string) =>
    name ? `${name}, ${text}` : text.charAt(0).toUpperCase() + text.slice(1);
  const theseDrafts = multi ? `Ihre ${count} Entwürfe` : "Ihr Entwurf";

  switch (step) {
    case 1:
      return {
        subject: withName(multi ? `${count} Entwürfe warten noch` : `${subjectNoun} wartet noch`),
        preheader: `${theseDrafts} sind fast fertig – es fehlen nur noch wenige Angaben.`,
        heading: multi ? "Ihre Inserate sind fast fertig" : "Ihr Inserat ist fast fertig",
        intro: multi
          ? `Sie haben ${count} Entwürfe angefangen, aber noch nicht abgeschlossen. Sie liegen bereit – Sie machen jeweils genau dort weiter, wo Sie aufgehört haben.`
          : `Sie haben vor Kurzem angefangen zu inserieren, den Entwurf${forVehicle} aber noch nicht abgeschlossen. Er liegt bereit – Sie machen genau dort weiter, wo Sie aufgehört haben.`,
        cta: multi ? "Entwürfe abschliessen" : "Entwurf abschliessen",
      };
    case 2:
      return {
        subject: "Ist beim Inserieren etwas schiefgelaufen?",
        preheader: "Falls etwas hakte: wir helfen gerne weiter.",
        heading: "Ist etwas schiefgelaufen?",
        intro: multi
          ? `${theseDrafts} liegen seit einer Weile unverändert bei uns. Falls beim Ausfüllen etwas nicht funktioniert hat oder eine Angabe unklar war: Antworten Sie einfach auf diese E-Mail, wir schauen es uns an.`
          : `Ihr Entwurf${forVehicle} liegt seit einer Weile unverändert bei uns. Falls beim Ausfüllen etwas nicht funktioniert hat oder eine Angabe unklar war: Antworten Sie einfach auf diese E-Mail, wir schauen es uns an.`,
        cta: multi ? "Entwürfe öffnen" : "Entwurf öffnen",
      };
    case 3:
      return {
        subject: multi ? `${count} Inserate, nur Minuten entfernt` : "Nur noch 2 Minuten bis zum Inserat",
        preheader: "Die restlichen Angaben sind schnell erledigt.",
        heading: "Zwei Minuten, dann sind sie online",
        intro: multi
          ? `Der aufwendige Teil ist erledigt: ${theseDrafts} sind bereits erfasst. Es fehlen nur noch die letzten Angaben, dann gehen die Inserate in die Prüfung und anschliessend online.`
          : `Der aufwendige Teil ist erledigt: Ihr Entwurf${forVehicle} ist bereits erfasst. Es fehlen nur noch die letzten Angaben, dann geht Ihr Inserat in die Prüfung und anschliessend online.`,
        cta: "Jetzt fertigstellen",
      };
    case 4:
      return {
        subject: withName(multi ? `${count} Fahrzeuge finden Käufer` : `${subjectNoun} findet Käufer`),
        preheader: "Interessenten suchen täglich auf BuyAuto – Ihre Entwürfe sind noch nicht sichtbar.",
        heading: multi ? "Ihre Fahrzeuge sind noch nicht sichtbar" : "Ihr Fahrzeug ist noch nicht sichtbar",
        intro: multi
          ? `Auf BuyAuto suchen täglich Interessentinnen und Interessenten nach passenden Fahrzeugen. Solange ${theseDrafts} nicht abgeschlossen sind, sieht sie niemand. Ein paar Klicks genügen.`
          : `Auf BuyAuto suchen täglich Interessentinnen und Interessenten nach passenden Fahrzeugen. Solange Ihr Entwurf${forVehicle} nicht abgeschlossen ist, sieht ihn niemand. Ein paar Klicks genügen.`,
        cta: multi ? "Inserate veröffentlichen" : "Inserat veröffentlichen",
      };
    case 5:
      return {
        subject: multi ? `Noch 5 Tage für ${count} Entwürfe ⏳` : "Noch 5 Tage für Ihren Entwurf ⏳",
        preheader: `${theseDrafts} werden bald automatisch archiviert.`,
        heading: multi ? "Ihre Entwürfe laufen bald ab" : "Ihr Entwurf läuft bald ab",
        intro: `Entwürfe, die ${ARCHIVE_AFTER_DAYS} Tage lang nicht bearbeitet werden, archivieren wir automatisch. Die Fristen sehen Sie unten. Bearbeiten Sie einen Entwurf, startet seine Frist neu.`,
        cta: multi ? "Entwürfe jetzt sichern" : "Entwurf jetzt sichern",
      };
    default:
      return {
        subject: multi
          ? `Letzte Chance: ${count} Entwürfe werden gelöscht`
          : mostUrgent.hasVehicleName
            ? `Letzte Chance: ${vehicle} wird gelöscht`
            : "Letzte Chance für Ihren Entwurf",
        preheader: "Archiviert – danach werden die Entwürfe endgültig gelöscht.",
        heading: multi ? "Entwürfe wurden archiviert" : "Ihr Entwurf wurde archiviert",
        intro: `Nach ${ARCHIVE_AFTER_DAYS} Tagen ohne Bearbeitung archivieren wir Entwürfe und löschen sie ${DELETE_AFTER_ARCHIVE_DAYS} Tage später endgültig. Bearbeiten Sie einen Entwurf, stellen Sie ihn damit wieder her.`,
        cta: multi ? "Entwürfe wiederherstellen" : "Entwurf wiederherstellen",
      };
  }
}

function draftRowHtml(draft: DraftCandidate): string {
  const details: string[] = [];
  if (draft.year) details.push(`Jahrgang ${draft.year}`);
  const dealLine = [draft.dealLabel, draft.financingLabel].filter(Boolean).join(" · ");
  if (dealLine) details.push(dealLine);
  if (draft.priceLabel) details.push(draft.priceLabel);

  const detailLine = details.length
    ? `<p style="margin: 4px 0 0 0; color: #6b7280; font-size: 13px;">${escapeHtml(details.join(" | "))}</p>`
    : "";

  // Archived drafts are the ones actually about to disappear, so they get the
  // warning colour; everything else stays quiet.
  const urgent = draft.archived || draft.daysLeft <= DELETE_AFTER_ARCHIVE_DAYS;
  const countdownColor = urgent ? "#b45309" : "#6b7280";

  return `<tr>
  <td style="padding: 14px 0; border-bottom: 1px solid #e5e7eb;">
    <a href="${draft.resumeUrl}" style="color: #111827; font-weight: 700; font-size: 16px; text-decoration: underline;">${escapeHtml(
      draft.vehicleName
    )}</a>
    ${detailLine}
    <p style="margin: 6px 0 0 0; color: ${countdownColor}; font-size: 13px; font-weight: ${urgent ? "700" : "400"};">
      ${escapeHtml(countdownLabel(draft))} <span style="color:#9ca3af; font-weight:400;">(${escapeHtml(
        formatDateDeCh(draft.dueDateIso)
      )})</span>
    </p>
  </td>
</tr>`;
}

function buildHtml(params: {
  copy: Copy;
  greeting: string;
  drafts: DraftCandidate[];
  totalCount: number;
}): string {
  const { copy, greeting, drafts, totalCount } = params;
  const hidden = totalCount - drafts.length;

  const moreRow =
    hidden > 0
      ? `<tr>
  <td style="padding: 14px 0;">
    <a href="${SITE_URL}/dashboard" style="color: #2563eb; font-size: 14px;">und ${hidden} weitere ${
      hidden === 1 ? "Entwurf" : "Entwürfe"
    } …</a>
  </td>
</tr>`
      : "";

  // One draft => send them straight to it; several => the dashboard is the
  // only sensible single destination.
  const ctaUrl = totalCount === 1 && drafts[0] ? drafts[0].resumeUrl : `${SITE_URL}/dashboard`;

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
    .card { background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 16px; padding: 6px 18px 12px 18px; }
    .button { display: inline-block; background-color: #dc2626; color: #ffffff; padding: 12px 18px; text-decoration: none; border-radius: 10px; font-weight: 700; }
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

      <p style="margin-bottom: 18px;">${copy.intro}</p>

      <div class="card">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse: collapse;">
          ${drafts.map(draftRowHtml).join("\n")}
          ${moreRow}
        </table>
      </div>

      <div style="text-align: center; margin: 24px 0;">
        <a href="${ctaUrl}" class="button">${escapeHtml(copy.cta)}</a>
      </div>

      <p>Beste Grüsse<br>Ihr BuyAuto Team</p>
    </div>

    <div class="footer">
      <p>Sie erhalten diese E-Mail, weil in Ihrem BuyAuto-Konto unvollständige Entwürfe liegen.</p>
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
    new Date(Date.parse(iso) + days * MS_PER_DAY).toISOString();

  // --- Wizard drafts (listing_drafts) ---------------------------------------
  const { data: wizardDrafts, error: wizardError } = await supabase
    .from("listing_drafts")
    .select("id,user_id,data,updated_at,archived_at");

  if (wizardError) {
    console.error("draft-completion-reminder wizardError:", wizardError);
  }

  for (const row of wizardDrafts ?? []) {
    const data = (row.data ?? {}) as Record<string, unknown>;

    // A wizard draft that already spawned a listing row is represented by that
    // listing below — don't list the same vehicle twice.
    if (typeof data.id === "string" && data.id.length > 0) continue;

    const archivedAt = (row.archived_at as string | null) ?? null;
    const step = archivedAt ? ARCHIVED_STEP : stepForIdleDays(daysBetween(row.updated_at, now));
    if (step === null) continue;

    const { name, known } = buildVehicleName(data.brand, data.model);
    const dueDateIso = archivedAt
      ? addDays(archivedAt, DELETE_AFTER_ARCHIVE_DAYS)
      : addDays(row.updated_at, ARCHIVE_AFTER_DAYS);
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
      year: typeof data.year === "number" ? data.year : null,
      priceLabel: price,
      dealLabel: dealTypeLabel(data.deal_type),
      financingLabel: financingTypeLabel(data.financing_type),
      step,
      archived: Boolean(archivedAt),
      daysLeft: daysUntil(dueDateIso, now),
      dueDateIso,
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
    const archivedAt = (row.archived_at as string | null) ?? null;
    const step = isArchived ? ARCHIVED_STEP : stepForIdleDays(daysBetween(row.updated_at, now));
    if (step === null) continue;

    const { name, known } = buildVehicleName(row.brand, row.model);
    const dueDateIso =
      isArchived && archivedAt
        ? addDays(archivedAt, DELETE_AFTER_ARCHIVE_DAYS)
        : addDays(row.updated_at, ARCHIVE_AFTER_DAYS);
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
      archived: isArchived,
      daysLeft: daysUntil(dueDateIso, now),
      dueDateIso,
    });
  }

  // --- Group by owner -------------------------------------------------------
  const byOwner = new Map<string, DraftCandidate[]>();
  for (const candidate of candidates) {
    const bucket = byOwner.get(candidate.ownerId);
    if (bucket) bucket.push(candidate);
    else byOwner.set(candidate.ownerId, [candidate]);
  }

  const ownerIds = Array.from(byOwner.keys());

  const profilesById = new Map<string, ProfileRow>();
  /** "<draftId>:<step>" for every reminder already sent. */
  const sentPairs = new Set<string>();
  /** Owner -> when we last mailed them, for the digest floor. */
  const lastDigestAt = new Map<string, number>();

  if (ownerIds.length > 0) {
    const [profilesRes, logRes] = await Promise.all([
      supabase.from("profiles").select("id,email,full_name").in("id", ownerIds),
      supabase
        .from("email_notification_log")
        .select("entity_id,days_before,created_at,recipient_user_id")
        .eq("kind", REMINDER_KIND)
        .in("recipient_user_id", ownerIds),
    ]);

    if (profilesRes.error) {
      console.error("draft-completion-reminder profilesError:", profilesRes.error);
    } else {
      for (const p of (profilesRes.data ?? []) as ProfileRow[]) profilesById.set(p.id, p);
    }

    if (logRes.error) {
      console.error("draft-completion-reminder logError:", logRes.error);
    } else {
      for (const row of logRes.data ?? []) {
        sentPairs.add(`${row.entity_id}:${row.days_before}`);
        const owner = row.recipient_user_id as string | null;
        if (!owner) continue;
        const at = Date.parse(row.created_at as string);
        if (Number.isFinite(at)) {
          lastDigestAt.set(owner, Math.max(lastDigestAt.get(owner) ?? 0, at));
        }
      }
    }
  }

  let sent = 0;
  let skippedNothingNew = 0;
  let skippedTooSoon = 0;
  let skippedNoEmail = 0;
  let errors = 0;
  const preview: Array<{
    to: string;
    step: number;
    subject: string;
    drafts: number;
    listed: number;
    urgent: number;
  }> = [];

  for (const [ownerId, ownerDrafts] of byOwner) {
    // Most urgent first: archived ahead of active, then by time remaining. This
    // is also the order the digest lists them and the order that decides which
    // drafts make the cut when there are more than MAX_DRAFTS_LISTED.
    ownerDrafts.sort((a, b) => {
      if (a.archived !== b.archived) return a.archived ? -1 : 1;
      if (a.daysLeft !== b.daysLeft) return a.daysLeft - b.daysLeft;
      return b.step - a.step;
    });

    const listed = ownerDrafts.slice(0, MAX_DRAFTS_LISTED);

    // Something is worth mailing about only if a listed draft has reached a
    // step we have not already mailed this owner about.
    const freshPairs = listed.filter((d) => !sentPairs.has(`${d.entityId}:${d.step}`));
    if (freshPairs.length === 0) {
      skippedNothingNew++;
      continue;
    }

    // Hold to the digest floor, except when a draft is archived — those are on
    // a 5-day fuse to deletion and must not wait for the next window.
    const hasArchived = freshPairs.some((d) => d.step === ARCHIVED_STEP);
    const last = lastDigestAt.get(ownerId);
    if (!hasArchived && last && now.getTime() - last < MIN_DAYS_BETWEEN_DIGESTS * MS_PER_DAY) {
      skippedTooSoon++;
      continue;
    }

    const profile = profilesById.get(ownerId);
    const email = profile?.email?.trim() || "";
    if (!email) {
      skippedNoEmail++;
      continue;
    }

    const name = firstName(profile?.full_name);
    const mostUrgent = listed[0];
    const step = Math.max(...listed.map((d) => d.step));
    const copy = buildCopy({
      step,
      count: ownerDrafts.length,
      urgentCount: ownerDrafts.filter((d) => d.step === step).length,
      mostUrgent,
      name,
    });

    if (dryRun) {
      preview.push({
        to: email,
        step,
        subject: copy.subject,
        drafts: ownerDrafts.length,
        listed: listed.length,
        urgent: ownerDrafts.filter((d) => d.step === step).length,
      });
      continue;
    }

    // Claim every listed draft at its current step before sending. The unique
    // index on (kind, entity_id, days_before, recipient_email) means a
    // concurrent run loses the race on the first row and backs off, so the
    // digest cannot go out twice.
    const claim = await supabase.from("email_notification_log").insert(
      freshPairs.map((d) => ({
        kind: REMINDER_KIND,
        entity_id: d.entityId,
        recipient_user_id: ownerId,
        recipient_email: email,
        days_before: d.step,
      }))
    );

    if (claim.error) {
      if ((claim.error as unknown as { code?: string }).code === "23505") {
        skippedNothingNew++;
        continue;
      }
      console.error("draft-completion-reminder log insert error:", claim.error);
      errors++;
      continue;
    }

    const sendRes = await resend.emails.send({
      from: "BuyAuto <noreply@email.buyauto.ch>",
      to: email,
      subject: copy.subject,
      html: buildHtml({
        copy,
        greeting: name ?? "Guten Tag",
        drafts: listed,
        totalCount: ownerDrafts.length,
      }),
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
      draftsScanned: candidates.length,
      owners: byOwner.size,
      sent,
      skippedNothingNew,
      skippedTooSoon,
      skippedNoEmail,
      errors,
      ...(dryRun ? { preview } : {}),
    }),
    {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    }
  );
});
