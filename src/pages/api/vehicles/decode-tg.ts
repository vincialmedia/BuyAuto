import type { NextApiRequest, NextApiResponse } from "next";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import { canonicalizeMakeText, deriveModelFamily, normalizeVehicleKey } from "@/lib/buyauto/vin-canonical";
import { bodyTypeOf, displacementOf, type BodyType as CompsBodyType } from "@/lib/buyauto/compsParser";

// Typengenehmigungs-Lookup: Fahrzeugausweis Feld 24 (z.B. "1TD812") -> exakte
// Fahrzeugdaten aus der wöchentlich ingestierten ASTRA-TARGA-Tabelle
// `tg_vehicle_types` (Pipeline: Branch claude/targa-tg-lookup). Die Antwort
// spiegelt die decode-vin-Felder, damit der Listing-Wizard denselben
// Autofill-Pfad nutzen kann — plus Rechner-spezifische Felder (body_key,
// displacement_l). Im Gegensatz zu decode-vin wird der Katalog hier NIE
// beschrieben: canonical ids sind ein reiner Best-effort-Lookup, null wenn
// nichts eindeutig passt.

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

export interface TgDecodeResponse {
  tg_nr: string;
  make_id: string | null;
  model_id: string | null;
  variant_id: null;
  variant_text: string | null;
  provider_make: string | null;
  provider_model: string | null;
  fuel: string | null;
  transmission: string | null;
  power_hp: number | null;
  /** Listing-Vokabular: Limousine | Kombi | SUV | Cabrio | Coupe */
  body_type: string | null;
  /** Rechner-Vokabular (compsParser BodyType), z.B. "coupe" | "roadster". */
  body_key: CompsBodyType | null;
  body_label: string | null;
  /** Hubraum als Liter-Token für den Motorisierungs-Filter, z.B. "2.0". */
  displacement_l: string | null;
  hubraum_ccm: number | null;
  vmax_kmh: number | null;
  variants: Array<{
    variante: string | null;
    getriebe: string | null;
    hubraum_ccm: number | null;
    leistung_kw: number | null;
  }>;
  source: { name: string; updatedAt: string | null };
}

const ASTRA_ATTRIBUTION = "Bundesamt für Strassen ASTRA – TARGA Typengenehmigungen (OGD)";

/** "1998" ccm -> "2.0"; nur plausible Auto-Hubräume, sonst null. */
export function displacementFromCcm(ccm: number | null): string | null {
  if (!ccm || !Number.isFinite(ccm) || ccm < 500 || ccm > 9000) return null;
  const litres = Math.round(ccm / 100) / 10;
  return litres.toFixed(1);
}

export function mapTgFuel(raw: string | null): string | null {
  const trimmed = String(raw ?? "").trim();
  if (!trimmed) return null;
  // Der reale TARGA-Export liefert Bauart-Treibstoff als CODE. Bedeutungen
  // empirisch am Live-Datenbestand verifiziert (Beispielfahrzeuge je Code):
  //   B Benzin · D Diesel · E Elektrisch · C Benzin-Hybrid (MHEV/PHEV, z.B.
  //   "Tonale 1.3 PHEV") · F Diesel-Hybrid (z.B. Alpina D3 S MHEV) · R Elektro
  //   mit Range Extender (BMW i3 REX) · K Ethanol E85 · N/Y Erdgas (g-tron) ·
  //   Z Autogas LPG · X Wasserstoff. Gas/H2 haben keinen Wert im FUEL_TYPES-
  //   Vokabular (Benzin|Diesel|Hybrid|Elektro) -> null, Nutzer wählt manuell.
  if (/^[A-Z/+\s-]{1,4}$/i.test(trimmed)) {
    const code = trimmed.toUpperCase().replace(/[^A-Z]/g, "");
    if (code.length === 1) {
      const single: Record<string, string> = {
        B: "Benzin",
        D: "Diesel",
        E: "Elektro",
        C: "Hybrid",
        F: "Hybrid",
        R: "Hybrid",
        K: "Benzin",
      };
      return single[code] ?? null;
    }
    const hasB = code.includes("B");
    const hasD = code.includes("D");
    const hasE = code.includes("E");
    if (hasE && (hasB || hasD)) return "Hybrid";
    if (code.includes("C") || code.includes("F") || code.includes("R")) return "Hybrid";
    if (hasE) return "Elektro";
    if (hasD) return "Diesel";
    if (hasB) return "Benzin";
    return null;
  }
  const v = trimmed.toLowerCase();
  const electric = /elektr/.test(v);
  const petrol = /benzin/.test(v);
  const diesel = /diesel/.test(v);
  if (electric && (petrol || diesel)) return "Hybrid";
  if (/hybrid/.test(v)) return "Hybrid";
  if (electric) return "Elektro";
  if (diesel) return "Diesel";
  if (petrol) return "Benzin";
  return null;
}

export function mapTgTransmission(raw: string | null): string | null {
  const v = String(raw ?? "").toLowerCase().trim();
  if (!v) return null;
  // TARGA-Getriebecodes (empirisch am Live-Datenbestand verifiziert):
  // mN = Handschaltung N-Gang; Suffix "a" = automatisiertes Schaltgetriebe
  // (DSG & Co., z.B. m7a; m1a = Eingang-Automat der E-Autos) -> Automatik;
  // aN = Automat; s = stufenlos (CVT); "m?"/"m?a" = Gangzahl unbekannt;
  // h1/h2 = hydrostatisch (Arbeitsmaschinen) -> null. Klartexte kommen je
  // nach Ära ebenfalls vor ("Automat", "stufenlos").
  if (/^m[\d?]+a$/.test(v)) return "Automatik";
  if (/^a\d|^s$|autom|stufenlos|cvt|dsg/.test(v)) return "Automatik";
  if (/^m[\d?]+$|manuell|schalt/.test(v)) return "Manuell";
  return null;
}

/** Karosserieform-Label -> Listing-BODY_TYPES-Wert (listingContract). */
export function mapTgListingBody(raw: string | null): string | null {
  const v = String(raw ?? "").toLowerCase();
  if (!v) return null;
  if (/coup/.test(v)) return "Coupe";
  if (/cabrio|roadster|spider|targa/.test(v)) return "Cabrio";
  if (/kombi|caravan|break|estate/.test(v)) return "Kombi";
  if (/gel(ä|ae?)nde|suv|kompaktvan|van/.test(v) && /gel(ä|ae?)nde|suv/.test(v)) return "SUV";
  if (/limousine|stufenheck|schr(ä|ae?)gheck|sedan/.test(v)) return "Limousine";
  return null;
}

/**
 * Findet das Katalog-Modell, dessen Name den Anfang des TARGA-Typ-Texts bildet
 * ("Golf 8 1.5 eTSI" -> "Golf"; "Golf GTI Clubsport 2.0" -> "Golf GTI
 * Clubsport"). Vergleich tokenweise über normalizeVehicleKey, damit
 * Punktierung/Umlaute nicht stören ("ID.3 Pro" matcht "ID.3") und "T500"
 * NICHT "T5" matcht. Bei mehreren Treffern gewinnt der längste Name.
 */
export function matchModelFromTyp(
  typ: string,
  models: Array<{ id: string; name: string }>
): { id: string; name: string; rest: string } | null {
  const typTokens = typ.trim().split(/\s+/).filter(Boolean);
  if (typTokens.length === 0) return null;
  const normTyp = typTokens.map((t) => normalizeVehicleKey(t));

  let best: { id: string; name: string; rest: string; len: number } | null = null;
  for (const model of models) {
    const nameTokens = model.name.trim().split(/\s+/).filter(Boolean);
    if (nameTokens.length === 0 || nameTokens.length > typTokens.length) continue;
    let ok = true;
    for (let i = 0; i < nameTokens.length; i++) {
      const nt = normalizeVehicleKey(nameTokens[i]);
      if (!nt || nt !== normTyp[i]) {
        ok = false;
        break;
      }
    }
    if (ok && (!best || nameTokens.length > best.len)) {
      best = {
        id: model.id,
        name: model.name,
        rest: typTokens.slice(nameTokens.length).join(" "),
        len: nameTokens.length,
      };
    }
  }
  return best ? { id: best.id, name: best.name, rest: best.rest } : null;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET" && req.method !== "POST") {
    res.setHeader("Allow", "GET, POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const rawTg =
    req.method === "GET"
      ? req.query.tg
      : ((req.body ?? {}) as Record<string, unknown>).tg;
  const tgNr = String(typeof rawTg === "string" ? rawTg : "")
    .toUpperCase()
    .replace(/[\s.\-]/g, "");

  // 6 alphanumerische Zeichen (z.B. 1TD812, 1XE500); ältere rein numerische
  // Nummern haben dieselbe Länge. "IVI"/"IVIX"/"X" sind KEINE TG-Nummern —
  // eine präzise Meldung erspart dem Nutzer die Fehlersuche.
  if (/^(IVI|IVIX|X)$/.test(tgNr)) {
    return res.status(404).json({
      error: "no_tg",
      message:
        "Dieses Fahrzeug hat keine Typengenehmigungs-Nummer (Direktimport oder eCoC-Zulassung ab 2022). Nutze die VIN (Feld 23) oder erfasse die Daten manuell.",
    });
  }
  if (!/^[A-Z0-9]{6}$/.test(tgNr)) {
    return res.status(400).json({
      error: "invalid_tg",
      message: "Die Typengenehmigungs-Nummer hat 6 Zeichen, z.B. 1TD812 (Fahrzeugausweis Feld 24).",
    });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !anonKey) {
    return res.status(503).json({ error: "config", message: "Supabase ist nicht konfiguriert." });
  }
  // Anon-Client genügt: tg_vehicle_types und der Fahrzeugkatalog sind public
  // readable; dieser Endpoint schreibt nichts.
  const supabase = createClient<Database>(supabaseUrl, anonKey);

  const { data: rows, error } = await (supabase as any)
    .from("tg_vehicle_types")
    .select(
      "tg_nr,variante,marke,typ,fahrzeugart,karosserieform,karosserieform_code,treibstoff,hubraum_ccm,leistung_kw,getriebe,motor_marke,motor_typ,vmax_kmh,tg_erteilt,source_updated_at"
    )
    .eq("tg_nr", tgNr)
    .limit(20);

  if (error) {
    // 42P01 = Tabelle existiert (noch) nicht — die TARGA-Pipeline ist separat
    // deployt; bis dahin ehrlich "nicht verfügbar" statt eines falschen 404.
    const notReady = /42P01|relation .* does not exist|schema cache/i.test(
      `${(error as { code?: string }).code ?? ""} ${error.message ?? ""}`
    );
    return res.status(notReady ? 503 : 500).json({
      error: notReady ? "tg_data_unavailable" : "lookup_failed",
      message: notReady
        ? "Die Typenschein-Datenbank ist noch nicht befüllt – erfasse die Daten manuell."
        : "Typenschein-Abfrage fehlgeschlagen – bitte später nochmals versuchen.",
    });
  }

  const tgRows = (rows ?? []) as TgRow[];
  if (tgRows.length === 0) {
    return res.status(404).json({
      error: "not_found",
      message: `Keine Typengenehmigung ${tgNr} gefunden – prüf Feld 24 im Fahrzeugausweis (vor 1995 ist keine automatische Abfrage möglich).`,
    });
  }

  // Primärzeile: die vollständigste (eine TG kann mehrere Getriebevarianten haben).
  const score = (r: TgRow) =>
    [r.marke, r.typ, r.karosserieform, r.treibstoff, r.hubraum_ccm, r.leistung_kw].filter(
      (v) => v !== null && v !== ""
    ).length;
  const primary = [...tgRows].sort((a, b) => score(b) - score(a))[0];

  // Canonical-Katalog: reiner Lookup, kein Seeding. Marke direkt über den
  // normalisierten Namen, Modell über die abgeleitete Modellfamilie
  // ("A3 LIM 35 TFSI" -> "A3"). Kein Treffer -> null, der Client fällt auf
  // manuelle Auswahl zurück.
  let makeId: string | null = null;
  let modelId: string | null = null;
  let variantText: string | null = null;
  const providerMake = primary.marke?.trim() || null;
  const providerModel = primary.typ?.trim() || null;
  if (providerMake) {
    const { canonicalName } = canonicalizeMakeText(providerMake);
    const { data: makeRow } = await supabase
      .from("makes")
      .select("id")
      .eq("normalized_name", normalizeVehicleKey(canonicalName))
      .maybeSingle();
    makeId = (makeRow as { id?: string } | null)?.id ?? null;

    if (makeId && providerModel) {
      const family = deriveModelFamily({ rawModel: providerModel, providerMake });
      variantText = family.variantText;

      // Tokenweiser Präfix-Match gegen die echten Katalog-Modelle der Marke —
      // deutlich treffersicherer als die abgeleitete Modellfamilie, weil er
      // Generationszahlen und Motorisierungs-Suffixe im TARGA-Typ übersteht.
      const { data: modelRows } = await supabase
        .from("models")
        .select("id,name")
        .eq("make_id", makeId)
        .limit(1000);
      const matched = matchModelFromTyp(
        providerModel,
        (modelRows ?? []) as Array<{ id: string; name: string }>
      );
      if (matched) {
        modelId = matched.id;
        if (matched.rest) variantText = matched.rest;
      } else {
        const candidate = family.familyName ?? providerModel.split(/\s+/)[0];
        if (candidate) {
          const { data: modelRow } = await supabase
            .from("models")
            .select("id")
            .eq("make_id", makeId)
            .eq("normalized_name", normalizeVehicleKey(candidate))
            .maybeSingle();
          modelId = (modelRow as { id?: string } | null)?.id ?? null;
        }
      }
    }
  }

  const bodySource = `${primary.karosserieform ?? ""} ${primary.typ ?? ""}`;
  const payload: TgDecodeResponse = {
    tg_nr: tgNr,
    make_id: makeId,
    model_id: modelId,
    variant_id: null,
    variant_text: variantText,
    provider_make: providerMake,
    provider_model: providerModel,
    fuel: mapTgFuel(primary.treibstoff),
    transmission: mapTgTransmission(primary.getriebe),
    power_hp:
      primary.leistung_kw && Number.isFinite(primary.leistung_kw)
        ? Math.round(primary.leistung_kw * 1.35962)
        : null,
    body_type: mapTgListingBody(primary.karosserieform),
    body_key: bodyTypeOf(bodySource),
    body_label: primary.karosserieform?.trim() || null,
    // Das Marketing-Hubraum-Token bevorzugt aus dem Typ-Text ("155 1.8 TS"):
    // 1747 ccm rechnet sich zu "1.7", verkauft wurde das Auto aber als 1.8 —
    // und der Filter muss matchen, was in Inseraten steht. ccm nur als Fallback.
    displacement_l: displacementOf(providerModel ?? "") ?? displacementFromCcm(primary.hubraum_ccm),
    hubraum_ccm: primary.hubraum_ccm,
    vmax_kmh: primary.vmax_kmh,
    variants: tgRows.map((r) => ({
      variante: r.variante,
      getriebe: r.getriebe,
      hubraum_ccm: r.hubraum_ccm,
      leistung_kw: r.leistung_kw,
    })),
    source: { name: ASTRA_ATTRIBUTION, updatedAt: primary.source_updated_at },
  };

  res.setHeader("Cache-Control", "public, s-maxage=86400, stale-while-revalidate=604800");
  return res.status(200).json(payload);
}
