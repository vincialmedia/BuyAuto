#!/usr/bin/env node
/**
 * Pairwise 7-gram overlap of the main content of templated pages (brand, canton or model pages).
 *
 *   node scripts/seo-ngram-overlap.mjs https://www.buyauto.ch /leasinguebernahme/bmw /leasinguebernahme/audi
 *   node scripts/seo-ngram-overlap.mjs page-a.html page-b.html page-c.html
 *   add --max=30 to change the limit (default 30)
 *
 * For each ordered pair it prints the share of page A's distinct 7-word sequences that also
 * occur on page B. When the page has a <main>, only <main> is measured (including any <header> inside
 * it); otherwise header, footer and nav are removed. Scripts and styles are always removed.
 * Exits 1 when any pair reaches the limit, so it can gate a template change.
 * Guideline: well under 30 % for every pair (.claude/skills/seo-page/reference/page-types.md).
 */
import fs from "node:fs";

const N = 7;
const UA = "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)";

const args = process.argv.slice(2);
const maxArg = args.find((a) => a.startsWith("--max="));
const LIMIT = maxArg ? Number(maxArg.split("=")[1]) : 30;
const inputs = args.filter((a) => !a.startsWith("--"));

if (inputs.length < 2) {
  console.error("Usage: node scripts/seo-ngram-overlap.mjs <base URL> <path> <path> … | <file.html> <file.html> …");
  process.exit(2);
}

let targets;
if (/^https?:\/\//.test(inputs[0]) && inputs.slice(1).every((p) => p.startsWith("/"))) {
  const base = inputs[0].replace(/\/$/, "");
  targets = inputs.slice(1).map((p) => ({ name: p, url: base + p }));
} else {
  targets = inputs.map((x) => (/^https?:\/\//.test(x) ? { name: x, url: x } : { name: x, file: x }));
}

function decodeEntities(s) {
  return s
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&(?:#39|apos);/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(Number(d)))
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)));
}

function mainText(html) {
  const main = /<main\b[\s\S]*?<\/main>/i.exec(html);
  let s = main ? main[0] : html;
  // Inside <main>, a <header> holds the page's own H1, intro and stats, so it is measured. Without
  // <main>, header/footer/nav are the site chrome and are removed.
  const chrome = main ? "script|style|noscript|svg|template" : "script|style|noscript|svg|header|footer|nav|template";
  s = s.replace(new RegExp(`<(${chrome})\\b[\\s\\S]*?<\\/\\1>`, "gi"), " ");
  s = s.replace(/<[^>]+>/g, " ");
  return decodeEntities(s);
}

function grams(text) {
  const tokens = text.toLowerCase().split(/[^\p{L}\p{N}]+/u).filter(Boolean);
  const set = new Set();
  for (let i = 0; i + N <= tokens.length; i++) set.add(tokens.slice(i, i + N).join(" "));
  return { set, words: tokens.length };
}

async function load(t) {
  if (t.file) return fs.readFileSync(t.file, "utf8");
  const res = await fetch(t.url, { headers: { "User-Agent": UA }, redirect: "follow" });
  if (!res.ok) throw new Error(`${t.url} answered ${res.status}`);
  return res.text();
}

const pages = [];
for (const t of targets) {
  try {
    const g = grams(mainText(await load(t)));
    pages.push({ name: t.name, ...g });
  } catch (err) {
    console.error(`Skipped ${t.name}: ${err.message}`);
  }
}
if (pages.length < 2) process.exit(2);

let worst = { pct: 0, pair: "" };
console.log(`7-gram overlap (share of the first page's sequences found on the second), limit ${LIMIT} %\n`);
for (const a of pages) {
  for (const b of pages) {
    if (a === b) continue;
    let shared = 0;
    for (const g of a.set) if (b.set.has(g)) shared++;
    const pct = a.set.size ? (100 * shared) / a.set.size : 0;
    if (pct > worst.pct) worst = { pct, pair: `${a.name} → ${b.name}` };
    console.log(`${pct.toFixed(1).padStart(5)} %  ${a.name} → ${b.name}  (${shared} of ${a.set.size})`);
  }
}
console.log(`\nHighest: ${worst.pct.toFixed(1)} % (${worst.pair})`);
process.exit(worst.pct >= LIMIT ? 1 : 0);
