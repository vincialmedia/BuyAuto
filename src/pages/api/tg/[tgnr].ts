import type { NextApiRequest, NextApiResponse } from "next";
import { createClient } from "@supabase/supabase-js";

// Swiss TARGA type-approval lookup by TG-Nr (field 24 of the Fahrzeugausweis).
// Data: tg_vehicle_types, ingested weekly from ASTRA open data (see
// scripts/ingest-targa.ts). Attribution below is an OGD requirement.
const ASTRA_ATTRIBUTION =
  "Bundesamt für Strassen ASTRA – TARGA Typengenehmigungen (OGD)";

const KW_TO_PS = 1.35962;

interface TgRow {
  tg_nr: string;
  variante: string | null;
  marke: string | null;
  typ: string | null;
  fahrzeugart: string | null;
  karosserieform: string | null;
  karosserieform_code: string | null;
  treibstoff: string | null;
  hubraum_ccm: number | null;
  leistung_kw: number | null;
  getriebe: string | null;
  motor_marke: string | null;
  motor_typ: string | null;
  vmax_kmh: number | null;
  tg_erteilt: string | null;
  source_updated_at: string | null;
}

function getSupabaseEnv() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    return null;
  }

  return { supabaseUrl, supabaseAnonKey };
}

/** Trim, uppercase, strip spaces and dots — "1td 812." becomes "1TD812". */
export function normalizeTgNr(input: string): string {
  return input.trim().toUpperCase().replace(/[\s.]/g, "");
}

/** Rows carrying more of the headline fields win the top-level spot. */
function completeness(row: TgRow): number {
  const fields = [
    row.marke,
    row.typ,
    row.karosserieform,
    row.karosserieform_code,
    row.treibstoff,
    row.hubraum_ccm,
    row.leistung_kw,
    row.getriebe,
    row.motor_marke,
    row.motor_typ,
    row.vmax_kmh,
    row.tg_erteilt,
  ];
  return fields.filter((f) => f !== null && f !== "").length;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const rawParam = req.query.tgnr;
  const tgNr = normalizeTgNr(Array.isArray(rawParam) ? rawParam[0] : rawParam || "");
  if (!/^[A-Z0-9]{6}$/.test(tgNr)) {
    return res.status(400).json({
      error: "invalid_tg_nr",
      message: "TG-Nr must be 6 alphanumeric characters (e.g. 1TD812)",
    });
  }

  const env = getSupabaseEnv();
  if (!env) {
    return res.status(500).json({ error: "Server misconfiguration" });
  }

  const supabase = createClient(env.supabaseUrl, env.supabaseAnonKey, {
    auth: { persistSession: false },
  });

  const { data, error } = await supabase
    .from("tg_vehicle_types")
    .select(
      "tg_nr, variante, marke, typ, fahrzeugart, karosserieform, karosserieform_code, treibstoff, hubraum_ccm, leistung_kw, getriebe, motor_marke, motor_typ, vmax_kmh, tg_erteilt, source_updated_at"
    )
    .eq("tg_nr", tgNr)
    .order("variante", { ascending: true, nullsFirst: false });

  if (error) {
    console.error("TG lookup failed:", error);
    return res.status(500).json({ error: "lookup_failed" });
  }

  const rows = (data ?? []) as TgRow[];
  if (rows.length === 0) {
    return res.status(404).json({ error: "not_found" });
  }

  const primary = rows.reduce((best, row) =>
    completeness(row) > completeness(best) ? row : best
  );

  res.setHeader(
    "Cache-Control",
    "public, s-maxage=86400, stale-while-revalidate=604800"
  );

  return res.status(200).json({
    tgNr: primary.tg_nr,
    marke: primary.marke,
    typ: primary.typ,
    karosserieform: primary.karosserieform,
    karosserieformCode: primary.karosserieform_code,
    treibstoff: primary.treibstoff,
    hubraumCcm: primary.hubraum_ccm,
    leistungKw: primary.leistung_kw,
    leistungPs:
      primary.leistung_kw !== null ? Math.round(primary.leistung_kw * KW_TO_PS) : null,
    getriebe: primary.getriebe,
    motorMarke: primary.motor_marke,
    motorTyp: primary.motor_typ,
    vmaxKmh: primary.vmax_kmh,
    tgErteilt: primary.tg_erteilt,
    variants: rows.map((row) => ({
      variante: row.variante,
      getriebe: row.getriebe,
      hubraumCcm: row.hubraum_ccm,
      leistungKw: row.leistung_kw,
    })),
    source: {
      name: ASTRA_ATTRIBUTION,
      updatedAt: primary.source_updated_at,
    },
  });
}
