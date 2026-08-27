/**
 * Fixture-driven checks for the TARGA parser. The repo has no test framework,
 * so this is a plain script: `npx tsx scripts/test-targa-parser.ts`.
 * Exits non-zero on the first failed assertion.
 *
 * The fixture is genuine windows-1252 (including 0x80–0x9F chars like € and Š
 * that differ from latin-1) and uses the REAL header names of
 * TG-Automobil.txt, verified against the live file via the Actions dry run
 * (run 32931033426: 224 columns, 210k rows) — including the quirks: the
 * variant lives in "05 Typ; Variante/Version", top speed is spread over four
 * "19 Fahrzeug Vmax ..." range columns, and some columns are unnamed.
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  normalizeHeader,
  parseDateOrNull,
  parseIntOrNull,
  parseNumericOrNull,
  parseTargaStream,
  TgRecord,
} from "./targa-parser";

async function* inChunks(text: string, size: number): AsyncGenerator<string> {
  for (let i = 0; i < text.length; i += size) {
    yield text.slice(i, i + size);
  }
}

async function main() {
  // --- unit checks on the small helpers -------------------------------------
  assert.equal(normalizeHeader("04 Marke"), "marke");
  assert.equal(normalizeHeader("05 Typ; Variante/Version"), "typ variante version");
  assert.equal(normalizeHeader("26 Bauart Treibstoff"), "bauart treibstoff");
  assert.equal(normalizeHeader("19 Fahrzeug Vmax mech bis"), "fahrzeug vmax mech bis");
  assert.equal(normalizeHeader("﻿Typengenehmigungsnummer"), "typengenehmigungsnummer");
  assert.equal(parseIntOrNull("1'998 cm3"), 1998);
  assert.equal(parseIntOrNull(""), null);
  assert.equal(parseNumericOrNull("140,5"), 140.5);
  assert.equal(parseNumericOrNull("141"), 141);
  assert.equal(parseDateOrNull("01.03.2018"), "2018-03-01");
  assert.equal(parseDateOrNull("2018-03-01"), "2018-03-01");
  assert.equal(parseDateOrNull("20180301"), "2018-03-01");
  assert.equal(parseDateOrNull("garbage"), null);

  // --- fixture: decode windows-1252 and parse -------------------------------
  const bytes = readFileSync(join(__dirname, "fixtures", "TG-fixture.txt"));
  const text = new TextDecoder("windows-1252").decode(bytes);
  assert.ok(text.includes("ŠKODA"), "windows-1252 0x8A (Š) must decode");
  assert.ok(text.includes("€uro"), "windows-1252 0x80 (€) must decode");
  assert.ok(text.includes("Citroën"), "latin-1 range (ë) must decode");

  // Feed in tiny chunks to prove line reassembly across chunk boundaries.
  const records: TgRecord[] = [];
  const result = await parseTargaStream(inChunks(text, 7), (r) => {
    records.push(r);
  });

  assert.equal(result.rowCount, 3);
  assert.equal(result.skipped, 0);
  assert.equal(result.headers.length, 20);

  // Mapping must resolve against the real header names.
  assert.equal(result.mapping.tg_nr, "Typengenehmigungsnummer");
  assert.equal(result.mapping.variante, "05 Typ; Variante/Version");
  assert.equal(result.mapping.marke, "04 Marke");
  assert.equal(result.mapping.typ, "04 Typ");
  assert.equal(result.mapping.fahrzeugart, "01 Fahrzeugart");
  assert.equal(result.mapping.karosserieform, "07 Karosserieform");
  assert.equal(result.mapping.karosserieform_code, "07 Karosserieform Code");
  assert.equal(result.mapping.treibstoff, "26 Bauart Treibstoff");
  assert.equal(result.mapping.hubraum_ccm, "27 Hubraum");
  assert.equal(result.mapping.leistung_kw, "28 Leistung kW");
  assert.equal(result.mapping.getriebe, "18 Getriebe 1");
  assert.equal(result.mapping.motor_marke, "25 Motor Marke");
  assert.equal(result.mapping.motor_typ, "25 Motor Typ");
  assert.equal(result.mapping.tg_erteilt, "Typengenehmigung erteilt");
  assert.deepEqual(result.vmaxColumns, [
    "19 Fahrzeug Vmax mech von",
    "19 Fahrzeug Vmax mech bis",
    "19 Fahrzeug Vmax autom von",
    "19 Fahrzeug Vmax autom bis",
  ]);

  // One TG-Nr spans multiple rows — both variants must survive.
  const td812 = records.filter((r) => r.tg_nr === "1TD812");
  assert.equal(td812.length, 2);
  assert.equal(td812[0].variante, "NX35HJ");
  assert.equal(td812[0].marke, "ŠKODA");
  assert.equal(td812[0].hubraum_ccm, 1998);
  assert.equal(td812[0].leistung_kw, 141);
  assert.equal(td812[0].getriebe, "m6");
  assert.equal(td812[0].tg_erteilt, "2018-03-01");
  // vmax = max across the mech/autom range columns present on the row
  assert.equal(td812[0].vmax_kmh, 231);
  assert.equal(td812[1].vmax_kmh, 229);
  assert.equal(td812[1].leistung_kw, 140.5);
  assert.equal(td812[1].getriebe, "a7");

  // Empty cells become null; cp1252-specific chars survive into values.
  const ab345 = records.find((r) => r.tg_nr === "2AB345");
  assert.ok(ab345, "2AB345 must be parsed");
  assert.equal(ab345.variante, null);
  assert.equal(ab345.vmax_kmh, null);
  assert.equal(ab345.marke, "Citroën");
  assert.equal(ab345.typ, "C4 – Édition €uro");
  assert.equal(ab345.tg_erteilt, "2021-11-15");

  // raw keeps the full original row; unnamed columns get unique keys.
  assert.equal(td812[0].raw["04 Marke"], "ŠKODA");
  assert.equal(td812[0].raw["27 Hubraum"], "1998");
  assert.equal(td812[0].raw["col_19"], "x1");
  assert.equal(td812[0].raw["col_20"], "y1");

  console.log("All TARGA parser checks passed.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
