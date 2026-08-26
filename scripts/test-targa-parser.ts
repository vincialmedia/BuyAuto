/**
 * Fixture-driven checks for the TARGA parser. The repo has no test framework,
 * so this is a plain script: `npx tsx scripts/test-targa-parser.ts`.
 * Exits non-zero on the first failed assertion.
 *
 * The fixture is genuine windows-1252 (including 0x80–0x9F chars like € and Š
 * that differ from latin-1) in the documented TARGA shape: tab-separated,
 * numbered German headers, CRLF, one row per transmission variant.
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
  assert.equal(normalizeHeader("31 Höchstgeschwindigkeit"), "hoechstgeschwindigkeit");
  assert.equal(normalizeHeader("22 Bauart Treibstoff"), "bauart treibstoff");
  assert.equal(normalizeHeader("﻿01 Typengenehmigung"), "typengenehmigung");
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
  assert.equal(result.headers.length, 15);

  // Every target column must resolve against the documented header names.
  for (const [target, source] of Object.entries(result.mapping)) {
    assert.ok(source !== null, `column mapping missing for ${target}`);
  }
  assert.equal(result.mapping.tg_nr, "01 Typengenehmigung");
  assert.equal(result.mapping.marke, "04 Marke");
  assert.equal(result.mapping.typ, "04 Typ");
  assert.equal(result.mapping.karosserieform, "07 Karosserieform");
  assert.equal(result.mapping.karosserieform_code, "07 Karosserieform Code");
  assert.equal(result.mapping.treibstoff, "22 Bauart Treibstoff");
  assert.equal(result.mapping.vmax_kmh, "31 Höchstgeschwindigkeit");
  assert.equal(result.mapping.tg_erteilt, "12 Typengenehmigung erteilt");

  // One TG-Nr spans multiple rows — both variants must survive.
  const td812 = records.filter((r) => r.tg_nr === "1TD812");
  assert.equal(td812.length, 2);
  assert.equal(td812[0].variante, "01");
  assert.equal(td812[0].marke, "ŠKODA");
  assert.equal(td812[0].hubraum_ccm, 1998);
  assert.equal(td812[0].leistung_kw, 141);
  assert.equal(td812[0].vmax_kmh, 235);
  assert.equal(td812[0].tg_erteilt, "2018-03-01");
  assert.equal(td812[0].getriebe, "Automatisiertes Schaltgetriebe");
  assert.equal(td812[1].leistung_kw, 140.5);
  assert.equal(td812[1].getriebe, "Schaltgetriebe 6-Gang");

  // Empty cells become null; cp1252-specific chars survive into values.
  const ab345 = records.find((r) => r.tg_nr === "2AB345");
  assert.ok(ab345, "2AB345 must be parsed");
  assert.equal(ab345.variante, null);
  assert.equal(ab345.vmax_kmh, null);
  assert.equal(ab345.marke, "Citroën");
  assert.equal(ab345.typ, "C4 – Édition €uro");
  assert.equal(ab345.tg_erteilt, "2021-11-15");

  // raw keeps the full original row keyed by original header names.
  assert.equal(td812[0].raw["04 Marke"], "ŠKODA");
  assert.equal(td812[0].raw["23 Hubraum"], "1998");

  console.log("All TARGA parser checks passed.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
