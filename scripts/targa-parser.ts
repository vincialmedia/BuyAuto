/**
 * Parser for ASTRA TARGA Typengenehmigung TSV exports (TG-Automobil.txt /
 * TG-Moto.txt): tab-separated, windows-1252, one header row with numbered
 * German field names ("04 Marke", "23 Hubraum", ...), one row per
 * transmission/variant so a TG-Nr can span multiple rows.
 *
 * Column names differ slightly between exports and over time, so columns are
 * resolved by normalized-name candidates rather than fixed positions. The
 * ingest dry run prints the detected header + mapping so drift is visible.
 */

export interface TgRecord {
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
  tg_erteilt: string | null; // ISO date yyyy-mm-dd
  raw: Record<string, string>;
}

export interface ColumnMapping {
  [target: string]: string | null; // target field -> source header name
}

/** Lowercase, fold umlauts, strip the leading field number and punctuation. */
export function normalizeHeader(name: string): string {
  return name
    .replace(/^\uFEFF/, "")
    .trim()
    .toLowerCase()
    .replace(/ä/g, "ae")
    .replace(/ö/g, "oe")
    .replace(/ü/g, "ue")
    .replace(/ß/g, "ss")
    .replace(/^\d+[a-z]?[\s._-]*/, "") // leading "04 ", "24a " field numbers
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

type Matcher = (normalized: string) => boolean;

const eq =
  (...names: string[]): Matcher =>
  (n) =>
    names.includes(n);
const has =
  (...parts: string[]): Matcher =>
  (n) =>
    parts.every((p) => n.includes(p));

/**
 * Candidate matchers per target column, tried in order — first header that
 * matches wins. Ordered so exact/documented names beat fuzzy fallbacks.
 */
const CANDIDATES: Array<{ target: keyof ColumnMapping; matchers: Matcher[] }> = [
  {
    target: "tg_nr",
    matchers: [
      eq("typengenehmigung", "typengenehmigungsnr", "typengenehmigungsnummer", "tg nr", "tg code"),
      (n) => n.includes("typengenehmigung") && !n.includes("erteilt") && !n.includes("datum"),
    ],
  },
  {
    target: "variante",
    matchers: [eq("variante", "typenvariante", "variante des typs")],
  },
  {
    target: "marke",
    matchers: [eq("marke", "fahrzeugmarke", "marke und typ marke")],
  },
  {
    target: "typ",
    matchers: [eq("typ", "fahrzeugtyp", "marke und typ typ")],
  },
  {
    target: "fahrzeugart",
    matchers: [eq("fahrzeugart"), has("fahrzeugart")],
  },
  {
    target: "karosserieform_code",
    matchers: [eq("karosserieform code"), has("karosserie", "code")],
  },
  {
    target: "karosserieform",
    matchers: [eq("karosserieform"), (n) => n.includes("karosserie") && !n.includes("code")],
  },
  {
    target: "treibstoff",
    matchers: [eq("bauart treibstoff", "treibstoff"), has("treibstoff")],
  },
  {
    target: "hubraum_ccm",
    matchers: [eq("hubraum"), has("hubraum")],
  },
  {
    target: "leistung_kw",
    matchers: [eq("leistung kw", "leistung in kw"), has("leistung")],
  },
  {
    target: "getriebe",
    matchers: [eq("getriebe", "getriebeart"), (n) => n.includes("getriebe") && !n.includes("uebersetzung")],
  },
  {
    target: "motor_marke",
    matchers: [eq("motormarke", "marke des motors"), has("motor", "marke")],
  },
  {
    target: "motor_typ",
    matchers: [eq("motortyp", "typ des motors"), has("motor", "typ")],
  },
  {
    target: "vmax_kmh",
    matchers: [
      eq("hoechstgeschwindigkeit", "v max", "vmax"),
      (n) => n.includes("geschwindigkeit") || n.includes("v max"),
    ],
  },
  {
    target: "tg_erteilt",
    matchers: [
      eq("typengenehmigung erteilt", "erteilt", "erteilt am", "tg erteilt"),
      (n) => n.includes("erteilt"),
      (n) => n.includes("datum") && n.includes("typengenehmigung"),
    ],
  },
];

export function resolveColumns(headers: string[]): ColumnMapping {
  const normalized = headers.map(normalizeHeader);
  const mapping: ColumnMapping = {};
  const claimed = new Set<number>();

  for (const { target, matchers } of CANDIDATES) {
    mapping[target] = null;
    for (const matcher of matchers) {
      const idx = normalized.findIndex((n, i) => !claimed.has(i) && matcher(n));
      if (idx !== -1) {
        mapping[target] = headers[idx];
        claimed.add(idx);
        break;
      }
    }
  }
  return mapping;
}

export function parseIntOrNull(value: string | undefined): number | null {
  if (!value) return null;
  // First number token only, so unit suffixes ("cm3") don't leak digits in.
  const m = value.match(/\d[\d'’ ]*/);
  if (!m) return null;
  const n = parseInt(m[0].replace(/[^\d]/g, ""), 10);
  return Number.isFinite(n) ? n : null;
}

export function parseNumericOrNull(value: string | undefined): number | null {
  if (!value) return null;
  const cleaned = value.replace(/'/g, "").replace(",", ".").replace(/[^\d.\-]/g, "");
  if (!cleaned || cleaned === "-" || cleaned === ".") return null;
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : null;
}

/** Accepts dd.mm.yyyy, yyyy-mm-dd and yyyymmdd; returns ISO yyyy-mm-dd. */
export function parseDateOrNull(value: string | undefined): string | null {
  if (!value) return null;
  const v = value.trim();
  let m = v.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})/);
  if (m) return `${m[3]}-${m[2].padStart(2, "0")}-${m[1].padStart(2, "0")}`;
  m = v.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (m) return `${m[1]}-${m[2]}-${m[3]}`;
  m = v.match(/^(\d{4})(\d{2})(\d{2})$/);
  if (m) return `${m[1]}-${m[2]}-${m[3]}`;
  return null;
}

function cell(raw: Record<string, string>, header: string | null): string | undefined {
  if (header === null) return undefined;
  const v = raw[header]?.trim();
  return v ? v : undefined;
}

export function toRecord(raw: Record<string, string>, mapping: ColumnMapping): TgRecord | null {
  const tgNr = cell(raw, mapping.tg_nr);
  if (!tgNr) return null;
  return {
    tg_nr: tgNr,
    variante: cell(raw, mapping.variante) ?? null,
    marke: cell(raw, mapping.marke) ?? null,
    typ: cell(raw, mapping.typ) ?? null,
    fahrzeugart: cell(raw, mapping.fahrzeugart) ?? null,
    karosserieform: cell(raw, mapping.karosserieform) ?? null,
    karosserieform_code: cell(raw, mapping.karosserieform_code) ?? null,
    treibstoff: cell(raw, mapping.treibstoff) ?? null,
    hubraum_ccm: parseIntOrNull(cell(raw, mapping.hubraum_ccm)),
    leistung_kw: parseNumericOrNull(cell(raw, mapping.leistung_kw)),
    getriebe: cell(raw, mapping.getriebe) ?? null,
    motor_marke: cell(raw, mapping.motor_marke) ?? null,
    motor_typ: cell(raw, mapping.motor_typ) ?? null,
    vmax_kmh: parseIntOrNull(cell(raw, mapping.vmax_kmh)),
    tg_erteilt: parseDateOrNull(cell(raw, mapping.tg_erteilt)),
    raw,
  };
}

export interface ParseResult {
  headers: string[];
  mapping: ColumnMapping;
  rowCount: number;
  skipped: number;
}

/**
 * Streams decoded text chunks, splits lines, and invokes onRecord per data
 * row. Memory stays flat: only the current partial line is buffered.
 */
export async function parseTargaStream(
  chunks: AsyncIterable<string>,
  onRecord: (record: TgRecord) => void | Promise<void>
): Promise<ParseResult> {
  let buffer = "";
  let headers: string[] | null = null;
  let mapping: ColumnMapping | null = null;
  let rowCount = 0;
  let skipped = 0;

  const handleLine = async (line: string) => {
    if (line === "") return;
    if (headers === null) {
      headers = line.replace(/^\uFEFF/, "").split("\t").map((h) => h.trim());
      mapping = resolveColumns(headers);
      return;
    }
    const cells = line.split("\t");
    const raw: Record<string, string> = {};
    for (let i = 0; i < headers.length; i++) {
      raw[headers[i]] = cells[i] ?? "";
    }
    const record = toRecord(raw, mapping as ColumnMapping);
    if (record) {
      rowCount++;
      await onRecord(record);
    } else {
      skipped++;
    }
  };

  for await (const chunk of chunks) {
    buffer += chunk;
    let idx: number;
    while ((idx = buffer.indexOf("\n")) !== -1) {
      const line = buffer.slice(0, idx).replace(/\r$/, "");
      buffer = buffer.slice(idx + 1);
      await handleLine(line);
    }
  }
  if (buffer.length > 0) {
    await handleLine(buffer.replace(/\r$/, ""));
  }

  if (headers === null || mapping === null) {
    throw new Error("TARGA file is empty: no header row found");
  }
  return { headers, mapping, rowCount, skipped };
}
