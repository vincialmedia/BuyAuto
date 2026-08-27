import { useCallback, useEffect, useState } from "react";
import Head from "next/head";
import { supabase } from "@/integrations/supabase/client";

// 🧪 TEMPORARY TEST PAGE for the Swiss TARGA type-approval data.
// Delete this file (and optionally the tg_distinct_* SQL functions) once the
// real Make/Model/Variant integration in the listing flow is live.

interface TgVariant {
  variante: string | null;
  getriebe: string | null;
  hubraumCcm: number | null;
  leistungKw: number | null;
}

interface TgLookupResult {
  tgNr: string;
  marke: string | null;
  typ: string | null;
  karosserieform: string | null;
  karosserieformCode: string | null;
  treibstoff: string | null;
  hubraumCcm: number | null;
  leistungKw: number | null;
  leistungPs: number | null;
  getriebe: string | null;
  motorMarke: string | null;
  motorTyp: string | null;
  vmaxKmh: number | null;
  tgErteilt: string | null;
  variants: TgVariant[];
  source: { name: string; updatedAt: string | null };
}

interface MakeRow {
  marke: string;
  variant_count: number;
}

interface TypRow {
  typ: string;
  variant_count: number;
}

interface VariantRow {
  tg_nr: string;
  variante: string | null;
  getriebe: string | null;
  treibstoff: string | null;
  hubraum_ccm: number | null;
  leistung_kw: number | null;
  vmax_kmh: number | null;
  tg_erteilt: string | null;
}

const TREIBSTOFF_LABELS: Record<string, string> = {
  B: "Benzin",
  D: "Diesel",
  E: "Elektrisch",
};

function fuelLabel(code: string | null): string {
  if (!code) return "–";
  return TREIBSTOFF_LABELS[code] ? `${TREIBSTOFF_LABELS[code]} (${code})` : code;
}

function fmt(value: string | number | null | undefined, suffix = ""): string {
  if (value === null || value === undefined || value === "") return "–";
  return `${value}${suffix}`;
}

export default function TgTestPage() {
  // --- TG-Nr lookup ---
  const [tgInput, setTgInput] = useState("");
  const [lookupLoading, setLookupLoading] = useState(false);
  const [lookupError, setLookupError] = useState<string | null>(null);
  const [result, setResult] = useState<TgLookupResult | null>(null);

  // --- Marke/Typ/Variante browser ---
  const [makes, setMakes] = useState<MakeRow[]>([]);
  const [makesError, setMakesError] = useState<string | null>(null);
  const [selectedMake, setSelectedMake] = useState("");
  const [typs, setTyps] = useState<TypRow[]>([]);
  const [selectedTyp, setSelectedTyp] = useState("");
  const [variants, setVariants] = useState<VariantRow[]>([]);
  const [browseLoading, setBrowseLoading] = useState(false);

  const lookup = useCallback(async (tgNr: string) => {
    const cleaned = tgNr.trim();
    if (!cleaned) return;
    setLookupLoading(true);
    setLookupError(null);
    setResult(null);
    try {
      const res = await fetch(`/api/tg/${encodeURIComponent(cleaned)}`);
      const body = await res.json();
      if (res.status === 400) {
        setLookupError(
          "Ungültiges Format: Die TG-Nr besteht aus 6 Zeichen (Buchstaben/Zahlen), z. B. 1AA101."
        );
      } else if (res.status === 404) {
        setLookupError("Keine Typengenehmigung mit dieser Nummer gefunden.");
      } else if (!res.ok) {
        setLookupError(`Fehler bei der Abfrage (HTTP ${res.status}).`);
      } else {
        setResult(body as TgLookupResult);
      }
    } catch {
      setLookupError("Netzwerkfehler – bitte erneut versuchen.");
    } finally {
      setLookupLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data, error } = await supabase.rpc("tg_distinct_makes");
      if (cancelled) return;
      if (error) {
        setMakesError(`Marken konnten nicht geladen werden: ${error.message}`);
      } else {
        setMakes((data as MakeRow[]) ?? []);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    setTyps([]);
    setSelectedTyp("");
    setVariants([]);
    if (!selectedMake) return;
    let cancelled = false;
    setBrowseLoading(true);
    (async () => {
      const { data, error } = await supabase.rpc("tg_distinct_typs", {
        p_marke: selectedMake,
      });
      if (cancelled) return;
      setBrowseLoading(false);
      if (!error) setTyps((data as TypRow[]) ?? []);
    })();
    return () => {
      cancelled = true;
    };
  }, [selectedMake]);

  useEffect(() => {
    setVariants([]);
    if (!selectedMake || !selectedTyp) return;
    let cancelled = false;
    setBrowseLoading(true);
    (async () => {
      const { data, error } = await supabase
        .from("tg_vehicle_types")
        .select(
          "tg_nr, variante, getriebe, treibstoff, hubraum_ccm, leistung_kw, vmax_kmh, tg_erteilt"
        )
        .eq("marke", selectedMake)
        .eq("typ", selectedTyp)
        .order("tg_nr")
        .limit(300);
      if (cancelled) return;
      setBrowseLoading(false);
      if (!error) setVariants((data as VariantRow[]) ?? []);
    })();
    return () => {
      cancelled = true;
    };
  }, [selectedMake, selectedTyp]);

  const specRows: Array<[string, string]> = result
    ? [
        ["Marke", fmt(result.marke)],
        ["Typ", fmt(result.typ)],
        ["Karosserieform", `${fmt(result.karosserieform)} (Code ${fmt(result.karosserieformCode)})`],
        ["Treibstoff", fuelLabel(result.treibstoff)],
        ["Hubraum", fmt(result.hubraumCcm, " ccm")],
        [
          "Leistung",
          result.leistungKw !== null
            ? `${result.leistungKw} kW (${fmt(result.leistungPs)} PS)`
            : "–",
        ],
        ["Getriebe", fmt(result.getriebe)],
        ["Motor", `${fmt(result.motorMarke)} ${fmt(result.motorTyp)}`],
        ["Höchstgeschwindigkeit", fmt(result.vmaxKmh, " km/h")],
        ["TG erteilt", fmt(result.tgErteilt)],
      ]
    : [];

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-8">
      <Head>
        <title>TARGA Test – TG-Nr Lookup</title>
        <meta name="robots" content="noindex, nofollow" />
      </Head>

      <div className="mx-auto max-w-3xl space-y-8">
        <div className="rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          🧪 <strong>Testseite</strong> – dient nur zum Ausprobieren der
          ASTRA-Typengenehmigungsdaten und wird gelöscht, sobald die richtige
          Integration steht.
        </div>

        <h1 className="text-2xl font-bold text-slate-900">
          Schweizer Typengenehmigungen (TARGA)
        </h1>

        {/* --- TG-Nr Suche --- */}
        <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="mb-1 text-lg font-semibold text-slate-900">
            Suche per Typengenehmigungsnummer
          </h2>
          <p className="mb-4 text-sm text-slate-600">
            Die TG-Nr steht in <strong>Feld 24 des Fahrzeugausweises</strong>{" "}
            (6 Zeichen, z.&nbsp;B. <code>1AA101</code>). Die Stammnummer (Feld 18)
            ist in den offenen ASTRA-Daten nicht enthalten.
          </p>
          <form
            className="flex gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              lookup(tgInput);
            }}
          >
            <input
              value={tgInput}
              onChange={(e) => setTgInput(e.target.value)}
              placeholder="z. B. 1AA101"
              className="w-48 rounded-md border border-slate-300 px-3 py-2 font-mono uppercase focus:border-slate-500 focus:outline-none"
              maxLength={12}
            />
            <button
              type="submit"
              disabled={lookupLoading}
              className="rounded-md bg-slate-900 px-4 py-2 font-medium text-white hover:bg-slate-700 disabled:opacity-50"
            >
              {lookupLoading ? "Suche…" : "Nachschlagen"}
            </button>
          </form>

          {lookupError && (
            <p className="mt-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
              {lookupError}
            </p>
          )}

          {result && (
            <div className="mt-5 space-y-4">
              <div className="rounded-md border border-slate-200">
                <div className="border-b border-slate-200 bg-slate-100 px-4 py-2 font-mono text-sm font-semibold">
                  TG-Nr {result.tgNr}
                </div>
                <dl className="grid grid-cols-1 gap-x-6 gap-y-1 px-4 py-3 sm:grid-cols-2">
                  {specRows.map(([label, value]) => (
                    <div key={label} className="flex justify-between gap-4 py-1 text-sm">
                      <dt className="text-slate-500">{label}</dt>
                      <dd className="text-right font-medium text-slate-900">{value}</dd>
                    </div>
                  ))}
                </dl>
              </div>

              {result.variants.length > 1 && (
                <div>
                  <h3 className="mb-2 text-sm font-semibold text-slate-700">
                    Alle Varianten dieser Typengenehmigung ({result.variants.length})
                  </h3>
                  <div className="overflow-x-auto rounded-md border border-slate-200">
                    <table className="w-full text-sm">
                      <thead className="bg-slate-100 text-left text-slate-600">
                        <tr>
                          <th className="px-3 py-2">Variante</th>
                          <th className="px-3 py-2">Getriebe</th>
                          <th className="px-3 py-2">Hubraum</th>
                          <th className="px-3 py-2">Leistung</th>
                        </tr>
                      </thead>
                      <tbody>
                        {result.variants.map((v, i) => (
                          <tr key={i} className="border-t border-slate-100">
                            <td className="px-3 py-2 font-mono">{fmt(v.variante)}</td>
                            <td className="px-3 py-2">{fmt(v.getriebe)}</td>
                            <td className="px-3 py-2">{fmt(v.hubraumCcm, " ccm")}</td>
                            <td className="px-3 py-2">{fmt(v.leistungKw, " kW")}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}
        </section>

        {/* --- Marke/Typ/Variante Browser --- */}
        <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="mb-1 text-lg font-semibold text-slate-900">
            Alle Daten durchstöbern: Marke → Typ → Variante
          </h2>
          <p className="mb-4 text-sm text-slate-600">
            Direkt aus den importierten ASTRA-Daten ({makes.length} Marken).
          </p>

          {makesError && (
            <p className="mb-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
              {makesError}
            </p>
          )}
          {!makesError && makes.length === 0 && (
            <p className="mb-4 rounded-md bg-slate-100 px-3 py-2 text-sm text-slate-600">
              Marken werden geladen – falls dauerhaft leer, ist der Datenimport
              noch nicht durchgelaufen.
            </p>
          )}

          <div className="flex flex-col gap-3 sm:flex-row">
            <select
              value={selectedMake}
              onChange={(e) => setSelectedMake(e.target.value)}
              className="rounded-md border border-slate-300 px-3 py-2 sm:w-1/2"
            >
              <option value="">Marke wählen…</option>
              {makes.map((m) => (
                <option key={m.marke} value={m.marke}>
                  {m.marke} ({m.variant_count})
                </option>
              ))}
            </select>

            <select
              value={selectedTyp}
              onChange={(e) => setSelectedTyp(e.target.value)}
              disabled={!selectedMake || typs.length === 0}
              className="rounded-md border border-slate-300 px-3 py-2 disabled:bg-slate-100 sm:w-1/2"
            >
              <option value="">
                {selectedMake ? `Typ wählen… (${typs.length})` : "Zuerst Marke wählen"}
              </option>
              {typs.map((t) => (
                <option key={t.typ} value={t.typ}>
                  {t.typ} ({t.variant_count})
                </option>
              ))}
            </select>
          </div>

          {browseLoading && <p className="mt-4 text-sm text-slate-500">Laden…</p>}

          {variants.length > 0 && (
            <div className="mt-4 overflow-x-auto rounded-md border border-slate-200">
              <table className="w-full text-sm">
                <thead className="bg-slate-100 text-left text-slate-600">
                  <tr>
                    <th className="px-3 py-2">TG-Nr</th>
                    <th className="px-3 py-2">Variante</th>
                    <th className="px-3 py-2">Getriebe</th>
                    <th className="px-3 py-2">Treibstoff</th>
                    <th className="px-3 py-2">Hubraum</th>
                    <th className="px-3 py-2">kW</th>
                    <th className="px-3 py-2">Vmax</th>
                    <th className="px-3 py-2">Erteilt</th>
                  </tr>
                </thead>
                <tbody>
                  {variants.map((v) => (
                    <tr key={`${v.tg_nr}-${v.variante ?? ""}`} className="border-t border-slate-100">
                      <td className="px-3 py-2">
                        <button
                          type="button"
                          className="font-mono text-blue-700 underline hover:text-blue-900"
                          onClick={() => {
                            setTgInput(v.tg_nr);
                            lookup(v.tg_nr);
                            window.scrollTo({ top: 0, behavior: "smooth" });
                          }}
                        >
                          {v.tg_nr}
                        </button>
                      </td>
                      <td className="px-3 py-2 font-mono">{fmt(v.variante)}</td>
                      <td className="px-3 py-2">{fmt(v.getriebe)}</td>
                      <td className="px-3 py-2">{fuelLabel(v.treibstoff)}</td>
                      <td className="px-3 py-2">{fmt(v.hubraum_ccm)}</td>
                      <td className="px-3 py-2">{fmt(v.leistung_kw)}</td>
                      <td className="px-3 py-2">{fmt(v.vmax_kmh)}</td>
                      <td className="px-3 py-2">{fmt(v.tg_erteilt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <p className="text-center text-xs text-slate-500">
          Datenquelle: Bundesamt für Strassen ASTRA – TARGA Typengenehmigungen (OGD)
        </p>
      </div>
    </div>
  );
}
