#!/usr/bin/env node
// Lists German keys used via t("…") / <T k="…"> that are missing from the
// fr / it / en dictionaries (src/i18n/messages/<locale>/**/*.json).
//
//   node scripts/i18n-check.mjs                 # scan all of src/
//   node scripts/i18n-check.mjs src/pages/x.tsx # scan specific files
//   node scripts/i18n-check.mjs --unused        # also list dictionary keys no code uses (static only)
//
// Only string-literal keys can be checked statically; keys passed as variables
// (t(item.label)) are covered by the rendered-page check instead.
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const ts = require("typescript");

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const MESSAGES = path.join(ROOT, "src/i18n/messages");
const LOCALES = ["fr", "it", "en"];

const args = process.argv.slice(2);
const showUnused = args.includes("--unused");
let files = args.filter((a) => !a.startsWith("--")).map((f) => path.resolve(ROOT, f));

function walk(dir, out = []) {
  for (const name of fs.readdirSync(dir)) {
    const p = path.join(dir, name);
    const st = fs.statSync(p);
    if (st.isDirectory()) {
      if (name === "node_modules" || name === "messages") continue;
      walk(p, out);
    } else if (/\.(tsx?|jsx?)$/.test(name)) out.push(p);
  }
  return out;
}
if (files.length === 0) files = walk(path.join(ROOT, "src"));

function loadDicts(locale) {
  const dict = new Map();
  const base = path.join(MESSAGES, locale);
  if (!fs.existsSync(base)) return dict;
  const jsons = [];
  (function w(d) {
    for (const n of fs.readdirSync(d)) {
      const p = path.join(d, n);
      if (fs.statSync(p).isDirectory()) w(p);
      else if (n.endsWith(".json")) jsons.push(p);
    }
  })(base);
  for (const f of jsons) {
    let data;
    try {
      data = JSON.parse(fs.readFileSync(f, "utf8"));
    } catch (e) {
      console.error(`✖ invalid JSON: ${path.relative(ROOT, f)} — ${e.message}`);
      process.exitCode = 1;
      continue;
    }
    for (const [k, v] of Object.entries(data)) {
      if (typeof v !== "string") {
        console.error(`✖ non-string value for key ${JSON.stringify(k)} in ${path.relative(ROOT, f)}`);
        process.exitCode = 1;
        continue;
      }
      if (!dict.has(k)) dict.set(k, { value: v, file: path.relative(ROOT, f) });
    }
  }
  return dict;
}

function literalText(node) {
  if (!node) return null;
  if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) return node.text;
  if (ts.isJsxExpression(node)) return literalText(node.expression);
  if (ts.isParenthesizedExpression(node)) return literalText(node.expression);
  return null;
}

const used = new Map(); // key -> [locations]
for (const file of files) {
  const src = fs.readFileSync(file, "utf8");
  const sf = ts.createSourceFile(file, src, ts.ScriptTarget.Latest, true, file.endsWith("x") ? ts.ScriptKind.TSX : ts.ScriptKind.TS);
  const add = (key, node) => {
    const { line } = sf.getLineAndCharacterOfPosition(node.getStart());
    const loc = `${path.relative(ROOT, file)}:${line + 1}`;
    if (!used.has(key)) used.set(key, []);
    used.get(key).push(loc);
  };
  (function visit(node) {
    if (ts.isCallExpression(node)) {
      const callee = node.expression;
      const name = ts.isIdentifier(callee) ? callee.text : ts.isPropertyAccessExpression(callee) ? callee.name.text : "";
      if ((name === "t" || name === "translateWith") && node.arguments.length) {
        const arg = name === "translateWith" ? node.arguments[1] : node.arguments[0];
        const key = literalText(arg);
        if (key !== null) add(key, node);
      }
    }
    if ((ts.isJsxSelfClosingElement(node) || ts.isJsxOpeningElement(node)) && ts.isIdentifier(node.tagName) && node.tagName.text === "T") {
      for (const attr of node.attributes.properties) {
        if (ts.isJsxAttribute(attr) && attr.name.getText() === "k") {
          const key = literalText(attr.initializer);
          if (key !== null) add(key, node);
        }
      }
    }
    ts.forEachChild(node, visit);
  })(sf);
}

let missingTotal = 0;
const placeholderIssues = [];
for (const locale of LOCALES) {
  const dict = loadDicts(locale);
  const missing = [];
  for (const [key, locs] of used) {
    const hit = dict.get(key);
    if (!hit) missing.push([key, locs]);
    else {
      const ph = (s) => (s.match(/\{\w+\}|<\/?\d+\s*\/?>/g) || []).sort().join(" ");
      if (ph(key) !== ph(hit.value)) placeholderIssues.push(`${locale}: ${JSON.stringify(key)} → ${JSON.stringify(hit.value)} (${hit.file})`);
    }
  }
  missingTotal += missing.length;
  if (missing.length) {
    console.log(`\n${locale}: ${missing.length} missing key(s)`);
    for (const [key, locs] of missing) console.log(`  ${JSON.stringify(key)}  ← ${locs[0]}${locs.length > 1 ? ` (+${locs.length - 1})` : ""}`);
  }
  if (showUnused) {
    const unused = [...dict.keys()].filter((k) => !used.has(k));
    console.log(`\n${locale}: ${unused.length} dictionary key(s) not referenced by a literal t()/<T> call (may be used via variables)`);
  }
}
if (placeholderIssues.length) {
  console.log(`\nPlaceholder/tag mismatches (${placeholderIssues.length}):`);
  for (const p of placeholderIssues) console.log("  " + p);
  process.exitCode = 1;
}
console.log(`\nScanned ${files.length} file(s), ${used.size} distinct key(s); missing: ${missingTotal}.`);
if (missingTotal) process.exitCode = 1;
