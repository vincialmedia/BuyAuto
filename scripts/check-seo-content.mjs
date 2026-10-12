#!/usr/bin/env node
/**
 * Mechanical checks for BuyAuto's page guidelines (.claude/skills/seo-page).
 *
 *   node scripts/check-seo-content.mjs --hook      Claude Code PostToolUse hook: reads the hook JSON on
 *                                                  stdin and checks the text that was just written. For an
 *                                                  Edit that is the new text only; for a Write the whole
 *                                                  file. Findings go to stderr with exit 2 so Claude sees them.
 *   node scripts/check-seo-content.mjs <files…>    check these files (whole content)
 *   node scripts/check-seo-content.mjs --all       every public page and copy file, plus site-level checks
 *                                                  (retired URLs still linked or listed, llms.txt, dates)
 *   node scripts/check-seo-content.mjs --diff [base]
 *                                                  only the lines changed against base (default origin/main),
 *                                                  uncommitted and untracked files included, plus site-level checks
 *
 * Exit codes: 0 clean or not in scope, 1 findings (CLI), 2 findings (hook). Internal errors never block
 * an edit: in hook mode they exit 0.
 *
 * These are heuristics, not a parser. A genuine exception, such as a verbatim lender quote, is stored in
 * a property named quote/…Quote, or marked with a comment containing "seo-check-ignore" on the line above.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";

const SCRIPT_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const MAX_FINDINGS_SHOWN = 20;

// ── Scope ─────────────────────────────────────────────────────────────────────

const PRIVATE_PAGE =
  /^src\/pages\/(?:api|admin|dashboard|auth|billing|embed)(?:\/|\.)|^src\/pages\/(?:_app|_document|404|500|sitemap\.xml)\./;
const PRIVATE_COMPONENT = /^src\/components\/buyauto\/(?:dashboard|auth|create-listing|messages|admin)\//;
/** Legal pages keep their legal wording (copy.md): only spelling, typed claims about the company and names are checked. */
const LEGAL_PAGE = /^src\/pages\/(?:agb|datenschutz|impressum)\.tsx$/;
const SKIP_ON_LEGAL = new Set(["du", "typed-chf", "typed-percent", "gratis", "promise", "inflated", "negative-parallelism"]);

/** "page" | "component" | "lib" | "llms" | null (not checked) */
function classify(rel) {
  if (rel === "public/llms.txt") return "llms";
  if (/^src\/pages\/.+\.tsx$/.test(rel)) return PRIVATE_PAGE.test(rel) ? null : "page";
  if (/^src\/components\/buyauto\/.+\.tsx$/.test(rel)) return PRIVATE_COMPONENT.test(rel) ? null : "component";
  if (/^src\/lib\/buyauto\/.+\.ts$/.test(rel)) return "lib";
  return null;
}

/** The project root that contains a file: the nearest directory with package.json and src/pages (works in worktrees). */
function findRoot(absFile) {
  let dir = path.dirname(absFile);
  for (;;) {
    if (fs.existsSync(path.join(dir, "package.json")) && fs.existsSync(path.join(dir, "src", "pages"))) return dir;
    const parent = path.dirname(dir);
    if (parent === dir) return null;
    dir = parent;
  }
}

const toRel = (root, abs) => path.relative(root, abs).split(path.sep).join("/");

// ── Comments and strings ──────────────────────────────────────────────────────

/** Blanks out the contents of string literals so comment markers inside strings ("/fahrzeug/*") are ignored. */
function maskStrings(line) {
  let out = "";
  let quote = null;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (quote) {
      if (c === "\\") {
        out += "  ";
        i++;
        continue;
      }
      if (c === quote) quote = null;
      out += c === quote || quote === null ? c : " ";
      continue;
    }
    // An apostrophe after a letter or digit is text (2'000, «geht's»), not the start of a string.
    if (c === '"' || c === "`" || (c === "'" && !/[\p{L}\p{N}]/u.test(line[i - 1] || ""))) quote = c;
    out += c;
  }
  return out;
}

/** Index of a block comment start in a masked line: only at line start, after whitespace or after «{», so regex literals like /\/*$/ don't count. */
function blockCommentStart(masked) {
  let idx = masked.indexOf("/*");
  while (idx !== -1) {
    const prev = idx === 0 ? "" : masked[idx - 1];
    if (prev === "" || /\s/.test(prev) || prev === "{") return idx;
    idx = masked.indexOf("/*", idx + 2);
  }
  return -1;
}

/**
 * The part of a line that is neither comment nor import, and whether it opens a block comment that
 * continues on the next line. Inline comments are blanked, so copy before or after them is still checked.
 */
function visibleText(line) {
  const t = line.trim();
  if (t.startsWith("//") || t.startsWith("import ") || t.startsWith("#!")) return { text: "", opensBlock: false };
  let text = line;
  let masked = maskStrings(line);
  let idx;
  while ((idx = blockCommentStart(masked)) !== -1) {
    const end = masked.indexOf("*/", idx + 2);
    let s = idx;
    if (end === -1) {
      if (s > 0 && masked[s - 1] === "{") s--;
      return { text: text.slice(0, s), opensBlock: true };
    }
    let e = end + 2;
    if (s > 0 && masked[s - 1] === "{" && masked[e] === "}") {
      s--;
      e++;
    }
    const blank = " ".repeat(e - s);
    text = text.slice(0, s) + blank + text.slice(e);
    masked = masked.slice(0, s) + blank + masked.slice(e);
  }
  const lc = masked.search(/(^|[\s;{}),])\/\//);
  if (lc !== -1) text = text.slice(0, masked[lc] === "/" ? lc : lc + 1);
  return { text, opensBlock: false };
}

/** Visible text per line ("" inside block comments and on import/comment lines). Not used for llms.txt. */
function visibleLines(lines, kind) {
  if (kind === "llms") return lines.slice();
  const out = new Array(lines.length).fill("");
  let inBlock = false;
  lines.forEach((line, i) => {
    if (inBlock) {
      const end = line.indexOf("*/");
      if (end === -1) return;
      inBlock = false;
      line = " ".repeat(end + 2) + line.slice(end + 2);
    }
    const v = visibleText(line);
    out[i] = v.text;
    inBlock = v.opensBlock;
  });
  return out;
}

/** Removes CSS from a line before the percentage check: class names, style objects, colour stops, keyframes, SVG attributes. */
function stripCss(text) {
  return text
    .replace(/className=(?:"[^"]*"|'[^']*'|\{`[^`]*`\}|\{[^}]*\})/g, " ")
    .replace(/style=\{\{[^}]*\}\}/g, " ")
    .replace(/\)\s*-?\d+(?:\.\d+)?%/g, ")") // colour stops: rgb(…) 40%
    .replace(/\b(?:rgba?|hsla?|calc|translate[XYZ3d]*|scale|rotate|url|var|clamp|min|max)\([^)]*\)/gi, " ")
    // CSS and style-object properties are lowercase or camelCase (top: 50%, marginTop: "5%"); German nouns are capitalised.
    .replace(/(?<![\p{L}])[a-z][a-zA-Z-]*\s*:\s*["'`]?-?\d+(?:\.\d+)?%/gu, " ")
    .replace(/(?<![\p{L}])[a-z][a-zA-Z-]*=["'{]["'`]?[^"'}]*%[^"'}]*["'}]/gu, " ");
}

const CSS_LINE = /gradient\(|@keyframes|^\s*(?:from|to|\d+%)(?:\s*,\s*\d+%)*\s*\{|background-position|transform:|transition:/;

// ── Line rules ────────────────────────────────────────────────────────────────

const COPY_KINDS = new Set(["page", "component", "lib", "llms"]);
/** Typed numbers belong in data modules (facts.ts, leasingCompanies.ts, the pricing config), not in page copy. */
const PAGE_COPY_KINDS = new Set(["page", "component", "llms"]);

const LINE_RULES = [
  {
    id: "ss",
    kinds: COPY_KINDS,
    re: /ß/,
    skip: /\.replace(?:All)?\(\s*\/[^/\n]*ß|["'`]ß["'`]\s*[:,\]]/,
    msg: "«ß» found. Swiss spelling uses «ss».",
  },
  {
    id: "du",
    kinds: COPY_KINDS,
    re: /(?<=[a-zäöüé0-9,;] )(?:Sie|Ihnen|Ihr|Ihre|Ihren|Ihrem|Ihrer|Ihres)\b/,
    msg: "Formal address (Sie/Ihnen/Ihr) mid-sentence. Address the reader with du.",
  },
  {
    id: "promise",
    kinds: COPY_KINDS,
    re: /\bohne Verlust\b|(?<!\bnicht\s)\b(?:garantiert|risikolos|risikofrei)\b(?!\s+nicht\b)/i,
    msg: "Absolute promise (ohne Verlust / garantiert / risikolos). Say what is true for every reader.",
  },
  {
    id: "inflated",
    kinds: COPY_KINDS,
    re: /\b(?:revolutionär\w*|bahnbrechend\w*|einzigartig\w*|unschlagbar\w*|ultimativ\w*|erstklassig\w*|innovativ\w*|nahtlos\w*|stressfrei\w*|kinderleicht\w*|massgeschneidert\w*|im Handumdrehen|Schweizer Qualität)/i,
    msg: "Inflated word or platitude. Replace it with the concrete fact.",
  },
  {
    id: "negative-parallelism",
    kinds: COPY_KINDS,
    re: /\b(?:nicht|kein(?:e|en|em|er|es)?)\b[^.!?«»\n]{0,80}?,?\s+sondern\b/i,
    msg: "Negative parallelism («nicht/kein …, sondern …»). State the positive point.",
  },
  {
    id: "leasingexit",
    kinds: COPY_KINDS,
    re: /\bleasingexit\b|\bleaseexit\b|leasingexit\.ch/i,
    msg: "Company name Leasingexit/LeaseExit. Use «Leasing-Exit» only as a plain description, never the company.",
  },
  {
    id: "typed-chf",
    kinds: PAGE_COPY_KINDS,
    re: /\bCHF\s?\d|\d[\d'’.]*(?:\s?[–-]\s?\d[\d'’.]*)?\s?(?:CHF|Franken)\b/,
    skip: /formatLabel|toLocaleString|placeholder=/,
    msg: "Typed CHF amount in copy. Take it from facts.ts, leasingCompanies.ts, the pricing config or live data and format it with format.ts.",
  },
  {
    id: "typed-percent",
    kinds: PAGE_COPY_KINDS,
    re: /(?<![\w[/.:#-])\d{1,3}(?:[.,]\d{1,2})?\s?%(?![\w\]])/,
    prepare: stripCss,
    skip: CSS_LINE,
    msg: "Typed percentage in copy. Every percentage needs a source in facts.ts or a live computation.",
  },
  {
    id: "title-year",
    kinds: new Set(["page"]),
    re: /(?:<title>|\bTITLE\s*=).*\b20[2-3]\d\b/,
    msg: "Year in the title. Titles carry the current year only on dated reports.",
  },
];

const FREE_RE = /\b(?:gratis|kostenlos\w*)\b/gi;
/** Exemptions: an explicit marker, or a property holding a verbatim quote (quote:, terminationQuote:, feeQuotes:). Case-sensitive on purpose: «Erfolgsquote:» is copy, not an exemption. */
const IGNORE_RE = /seo-check-ignore|\b(?:quotes?|[a-z]\w*Quotes?)\s*[:=]/;

/** A line is exempt when it, or the closest non-empty line above it, carries an exemption. */
function isExempt(lines, idx) {
  if (IGNORE_RE.test(lines[idx])) return true;
  for (let j = idx - 1; j >= 0 && j >= idx - 3; j--) {
    if (lines[j].trim() === "") continue;
    return IGNORE_RE.test(lines[j]);
  }
  return false;
}

function lineFindings(rel, kind, lines, visible, touched) {
  const out = [];
  const legal = LEGAL_PAGE.test(rel);
  visible.forEach((text, idx) => {
    if (!touched(idx) || text.trim() === "" || isExempt(lines, idx)) return;
    for (const rule of LINE_RULES) {
      if (!rule.kinds.has(kind)) continue;
      if (legal && SKIP_ON_LEGAL.has(rule.id)) continue;
      if (rule.skip && rule.skip.test(text)) continue;
      const subject = rule.prepare ? rule.prepare(text) : text;
      const m = rule.re.exec(subject);
      if (m) out.push({ rel, line: idx + 1, rule: rule.id, msg: `${rule.msg} («${m[0].trim()}»)` });
    }
  });
  return out;
}

function freeWordFindings(rel, kind, lines, visible, touched, alsoTouched = false) {
  if (!PAGE_COPY_KINDS.has(kind) || LEGAL_PAGE.test(rel)) return [];
  let count = 0;
  let touchedOne = alsoTouched;
  const where = [];
  visible.forEach((text, idx) => {
    if (isExempt(lines, idx)) return;
    const n = (text.match(FREE_RE) || []).length;
    if (n > 0) {
      count += n;
      where.push(idx + 1);
      if (touched(idx)) touchedOne = true;
    }
  });
  if (count > 1 && touchedOne) {
    return [
      {
        rel,
        line: where[0],
        rule: "gratis",
        msg: `«gratis»/«kostenlos» appears ${count} times in this file (lines ${where.join(", ")}). At most once per page, and only where it is true.`,
      },
    ];
  }
  return [];
}

// ── Whole-page checks ─────────────────────────────────────────────────────────

function readContentDates(root) {
  try {
    const src = fs.readFileSync(path.join(root, "src/lib/buyauto/contentDates.ts"), "utf8");
    const block = src.split("CONTENT_LAST_UPDATED")[1] || "";
    const body = block.slice(0, block.indexOf("};"));
    return new Set([...body.matchAll(/^\s*"([^"]+)"\s*:/gm)].map((m) => m[1]));
  } catch {
    return new Set();
  }
}

function routeOf(rel) {
  const r = rel.replace(/^src\/pages/, "").replace(/\.tsx?$/, "").replace(/\/index$/, "");
  return r || "/";
}

const isDynamicRoute = (route) => /\[/.test(route);

/** True when the page renders noindex and never a canonical. */
function isNoindexPage(content) {
  return /name=["']robots["'][^>]*content=["'][^"']*noindex/i.test(content) && !/rel=["']canonical["']/.test(content);
}

function lengthFindings(rel, content, touched) {
  const out = [];
  const checks = [
    { re: /<title>([^<{}]+)<\/title>/g, max: 60, what: "Title" },
    { re: /\bTITLE\s*=\s*\n?\s*(["'`])([^"'`$]+)\1/g, max: 60, what: "Title", group: 2 },
    { re: /name=["']description["'][\s\n]*content=["']([^"'{}]+)["']/g, max: 155, what: "Meta description" },
    { re: /\bDESCRIPTION\s*=\s*\n?\s*(["'`])([^"'`$]+)\1/g, max: 155, what: "Meta description", group: 2 },
  ];
  for (const c of checks) {
    for (const m of content.matchAll(c.re)) {
      const text = m[c.group || 1].trim();
      const start = content.slice(0, m.index).split("\n").length - 1;
      const end = start + m[0].split("\n").length - 1;
      let hit = false;
      for (let i = start; i <= end; i++) if (touched(i)) hit = true;
      if (hit && text.length > c.max) {
        out.push({ rel, line: start + 1, rule: "length", msg: `${c.what} is ${text.length} characters (aim for ${c.max} or fewer): «${text}»` });
      }
    }
  }
  return out;
}

function structureFindings(rel, content, contentDates) {
  if (LEGAL_PAGE.test(rel)) return [];
  const route = routeOf(rel);
  const out = [];
  const noindex = isNoindexPage(content);
  const usesSeoComponent = /<SEO\b/.test(content);
  // A page that sets no head itself delegates it to the component it renders; that component is checked when edited.
  const setsHead = usesSeoComponent || /from ["']next\/head["']/.test(content);
  if (!noindex && setsHead) {
    if (!/<title[\s>]/.test(content) && !(usesSeoComponent && /\btitle=/.test(content)))
      out.push({ rel, line: 1, rule: "head", msg: "No <title>. Every indexable page sets its own title." });
    if (!/name=["']description["']/.test(content) && !(usesSeoComponent && /\bdescription=/.test(content)))
      out.push({ rel, line: 1, rule: "head", msg: "No meta description." });
    if (!/rel=["']canonical["']/.test(content) && !(usesSeoComponent && /\burl=/.test(content)))
      out.push({
        rel,
        line: 1,
        rule: "head",
        msg: "No canonical. Indexable pages need a self-referencing canonical (or noindex if the page shouldn't be indexed).",
      });
  }
  if (!isDynamicRoute(route) && !rel.startsWith("src/pages/lp/")) {
    const listed = contentDates.has(route);
    if (!listed && /rel=["']canonical["']/.test(content) && !/noindex/.test(content)) {
      out.push({
        rel,
        line: 1,
        rule: "content-dates",
        msg: `Indexable page ${route} is not in CONTENT_LAST_UPDATED (contentDates.ts), so it has no sitemap entry and no «Aktualisiert am» date.`,
      });
    }
    if (noindex && listed) {
      out.push({
        rel,
        line: 1,
        rule: "content-dates",
        msg: `Noindex page ${route} is listed in CONTENT_LAST_UPDATED, which puts it into the sitemap. Remove the entry.`,
      });
    }
  }
  return out;
}

function checkFile(rel, content, touched, contentDates, { structure = true, extraTexts = [] } = {}) {
  const kind = classify(rel);
  if (!kind) return [];
  const lines = content.split("\n");
  const visible = visibleLines(lines, kind);
  const findings = [...lineFindings(rel, kind, lines, visible, touched)];
  // New text that also occurs elsewhere in the file can't be pinned to one place: check the text itself.
  for (const { text, line } of extraTexts) {
    const own = text.split("\n");
    for (const f of lineFindings(rel, kind, own, visibleLines(own, kind), () => true)) {
      findings.push({ ...f, line: line + f.line - 1, msg: `${f.msg} (in the new text)` });
    }
  }
  const extraFree = extraTexts.some(({ text }) => FREE_RE.test(text));
  FREE_RE.lastIndex = 0;
  findings.push(...freeWordFindings(rel, kind, lines, visible, touched, extraFree));
  if (kind === "page") {
    findings.push(...lengthFindings(rel, content, touched));
    if (structure) findings.push(...structureFindings(rel, content, contentDates));
  }
  return findings;
}

// ── Site-level checks (--all) ─────────────────────────────────────────────────

function walk(dir, acc = []) {
  let entries = [];
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return acc;
  }
  for (const e of entries) {
    if (e.name === "node_modules" || e.name.startsWith(".")) continue;
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, acc);
    else acc.push(p);
  }
  return acc;
}

function redirectSources(root) {
  const sources = new Set();
  try {
    const next = fs.readFileSync(path.join(root, "next.config.mjs"), "utf8");
    for (const m of next.matchAll(/source:\s*['"]([^'"]+)['"]/g)) sources.add(m[1]);
  } catch {}
  try {
    const vercel = JSON.parse(fs.readFileSync(path.join(root, "vercel.json"), "utf8"));
    for (const r of vercel.redirects || []) if (r.source) sources.add(r.source);
  } catch {}
  return [...sources].filter((s) => !/[:(*]/.test(s));
}

function siteFindings(root, contentDates) {
  const out = [];
  const staticRoutes = new Map(); // route -> rel
  const dynamicPatterns = [];
  for (const abs of walk(path.join(root, "src/pages"))) {
    const rel = toRel(root, abs);
    if (!/\.tsx?$/.test(rel) || /^src\/pages\/(?:api\/|_app|_document)/.test(rel)) continue;
    const route = routeOf(rel);
    if (isDynamicRoute(route)) {
      // The top-level catch-all (/[dealerSlug]) matches any path, so it can't vouch for a URL.
      if (/^\/\[[^\]]+\]$/.test(route)) continue;
      dynamicPatterns.push(new RegExp("^" + route.replace(/\[\.\.\.[^\]]+\]/g, ".+").replace(/\[[^\]]+\]/g, "[^/]+") + "$"));
    } else staticRoutes.set(route, rel);
  }
  const redirects = redirectSources(root);
  const redirectSet = new Set(redirects);
  const routeExists = (route) => staticRoutes.has(route) || dynamicPatterns.some((re) => re.test(route));

  for (const route of contentDates) {
    if (redirectSet.has(route)) {
      out.push({ rel: "src/lib/buyauto/contentDates.ts", line: 1, rule: "retired", msg: `${route} redirects but is still in CONTENT_LAST_UPDATED.` });
    } else if (!staticRoutes.has(route)) {
      out.push({ rel: "src/lib/buyauto/contentDates.ts", line: 1, rule: "content-dates", msg: `${route} is in CONTENT_LAST_UPDATED but no page file exists for it.` });
    }
  }

  for (const src of redirects) {
    if (staticRoutes.has(src)) {
      out.push({ rel: staticRoutes.get(src), line: 1, rule: "retired", msg: `${src} redirects in next.config.mjs/vercel.json, but its page file still exists. Delete it.` });
    }
  }

  // Links to retired URLs, relative ("/old") or absolute (buyauto.ch/old), in the app and the e-mail functions.
  const retiredLinkRes = redirects.map((src) => {
    const esc = src.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    return { src, re: new RegExp(`(?:["'\`]|buyauto\\.ch)${esc}(?=["'\`#?\\s)<\\]]|$)`) };
  });
  const codeFiles = [...walk(path.join(root, "src")), ...walk(path.join(root, "supabase/functions"))].filter((f) =>
    /\.(tsx?|mjs|js)$/.test(f)
  );
  for (const abs of codeFiles) {
    const rel = toRel(root, abs);
    const lines = fs.readFileSync(abs, "utf8").split("\n");
    const visible = visibleLines(lines, "code");
    visible.forEach((text, idx) => {
      if (!text.trim()) return;
      for (const { src, re } of retiredLinkRes) {
        if (re.test(text)) out.push({ rel, line: idx + 1, rule: "retired", msg: `Link to retired URL ${src}. Point it at the page it redirects to.` });
      }
    });
  }

  try {
    const llms = fs.readFileSync(path.join(root, "public/llms.txt"), "utf8").split("\n");
    llms.forEach((line, idx) => {
      for (const m of line.matchAll(/https:\/\/www\.buyauto\.ch(\/[^)\s?#]*)?/g)) {
        const route = m[1] && m[1] !== "/" ? m[1].replace(/\/$/, "") : "/";
        if (redirectSet.has(route)) out.push({ rel: "public/llms.txt", line: idx + 1, rule: "retired", msg: `llms.txt lists retired URL ${route}.` });
        else if (!routeExists(route)) out.push({ rel: "public/llms.txt", line: idx + 1, rule: "llms", msg: `llms.txt lists ${route}, which has no page.` });
        else if (staticRoutes.has(route)) {
          const content = fs.readFileSync(path.join(root, staticRoutes.get(route)), "utf8");
          if (isNoindexPage(content)) out.push({ rel: "public/llms.txt", line: idx + 1, rule: "llms", msg: `llms.txt lists ${route}, which is noindex.` });
        }
      }
    });
  } catch {}

  return out;
}

// ── Running ───────────────────────────────────────────────────────────────────

function format(findings) {
  const shown = findings.slice(0, MAX_FINDINGS_SHOWN);
  const text = shown.map((f) => `  ${f.rel}:${f.line}  [${f.rule}] ${f.msg}`).join("\n");
  const more = findings.length > shown.length ? `\n  … and ${findings.length - shown.length} more` : "";
  return text + more;
}

/**
 * Where the new text of an Edit sits in the file. Text found once (or with replace_all) marks its lines as
 * touched. Text found several times can't be pinned to one place, so it is returned to be checked on its own.
 */
function locate(content, edits) {
  const starts = [0];
  for (let i = 0; i < content.length; i++) if (content.charCodeAt(i) === 10) starts.push(i + 1);
  const lineOf = (offset) => {
    let lo = 0;
    let hi = starts.length - 1;
    while (lo < hi) {
      const mid = (lo + hi + 1) >> 1;
      if (starts[mid] <= offset) lo = mid;
      else hi = mid - 1;
    }
    return lo;
  };
  const touched = new Set();
  const extraTexts = [];
  for (const { text, replaceAll } of edits) {
    if (typeof text !== "string" || text.trim() === "") continue;
    const hits = [];
    let from = 0;
    let idx;
    while ((idx = content.indexOf(text, from)) !== -1 && hits.length < 1000) {
      hits.push(idx);
      from = idx + text.length;
    }
    if (hits.length === 0) continue;
    if (hits.length === 1 || replaceAll) {
      for (const h of hits) for (let i = lineOf(h); i <= lineOf(h + text.length - 1); i++) touched.add(i);
    } else {
      extraTexts.push({ text, line: lineOf(hits[0]) + 1 });
    }
  }
  return { touched, extraTexts };
}

const HEAD_SNIPPET = /<title|\bTITLE\s*=|\bDESCRIPTION\s*=|name=["'](?:description|robots)["']|rel=["']canonical|<Head\b|<SEO\b|CONTENT_LAST_UPDATED/;

async function readStdin() {
  const chunks = [];
  for await (const c of process.stdin) chunks.push(c);
  return Buffer.concat(chunks).toString("utf8");
}

async function hookMode() {
  let input;
  try {
    input = JSON.parse(await readStdin());
  } catch {
    return 0;
  }
  if (!input || typeof input !== "object") return 0;
  const ti = input.tool_input || {};
  if (typeof ti.file_path !== "string" || !ti.file_path) return 0;
  const abs = path.resolve(input.cwd || process.cwd(), ti.file_path);
  const root = findRoot(abs);
  if (!root) return 0;
  const rel = toRel(root, abs);
  if (!classify(rel)) return 0;

  let content;
  try {
    content = fs.readFileSync(abs, "utf8");
  } catch {
    return 0;
  }

  const edits = [];
  if (typeof ti.new_string === "string") edits.push({ text: ti.new_string, replaceAll: ti.replace_all === true });
  if (Array.isArray(ti.edits))
    for (const e of ti.edits) if (e && typeof e.new_string === "string") edits.push({ text: e.new_string, replaceAll: e.replace_all === true });
  const isEdit = typeof ti.new_string === "string" || Array.isArray(ti.edits);

  let touched;
  let structure;
  let extraTexts = [];
  if (isEdit) {
    // Only the new text counts. A pure deletion, or text that can't be located, checks nothing line by line.
    const located = locate(content, edits);
    touched = (i) => located.touched.has(i);
    extraTexts = located.extraTexts;
    structure = edits.some((e) => HEAD_SNIPPET.test(e.text));
  } else {
    touched = () => true;
    structure = true;
  }

  const findings = checkFile(rel, content, touched, readContentDates(root), { structure, extraTexts });
  if (findings.length === 0) return 0;

  process.stderr.write(
    `BuyAuto page guidelines (.claude/skills/seo-page): ${findings.length} finding(s) in ${rel}\n` +
      format(findings) +
      "\nFix the real violations in the text you just wrote. If one is a genuine exception (for example a verbatim lender" +
      " quote), store it in a quote property (…Quote) or add a comment containing «seo-check-ignore» on the line above," +
      " and mention it in the PR. Leave findings in text you didn't touch alone.\n"
  );
  return 2;
}

function cliMode(args) {
  const root = SCRIPT_ROOT;
  const contentDates = readContentDates(root);
  const all = args.includes("--all");
  let files;
  const skipped = [];
  if (all) {
    files = [...walk(path.join(root, "src")), path.join(root, "public/llms.txt")].map((f) => toRel(root, f)).filter((rel) => classify(rel));
  } else {
    files = [];
    for (const a of args.filter((x) => !x.startsWith("--"))) {
      const abs = path.resolve(a);
      const fileRoot = fs.existsSync(abs) ? findRoot(abs) : null;
      const rel = fileRoot ? toRel(fileRoot, abs) : null;
      if (!fs.existsSync(abs)) skipped.push(`${a} (not found)`);
      else if (!rel || !classify(rel)) skipped.push(`${a} (not a public page or copy file)`);
      else files.push({ abs, rel, root: fileRoot });
    }
  }

  const findings = [];
  for (const f of files) {
    const abs = typeof f === "string" ? path.join(root, f) : f.abs;
    const rel = typeof f === "string" ? f : f.rel;
    const dates = typeof f === "string" ? contentDates : readContentDates(f.root);
    let content;
    try {
      content = fs.readFileSync(abs, "utf8");
    } catch {
      skipped.push(`${rel} (unreadable)`);
      continue;
    }
    findings.push(...checkFile(rel, content, () => true, dates));
  }
  if (all) findings.push(...siteFindings(root, contentDates));

  if (skipped.length) console.log(`Not checked: ${skipped.join(", ")}`);
  if (findings.length === 0) {
    console.log(`check-seo-content: ${files.length} file(s) checked, no findings.`);
    return 0;
  }
  const byRule = findings.reduce((acc, f) => ((acc[f.rule] = (acc[f.rule] || 0) + 1), acc), {});
  console.log(
    findings.map((f) => `${f.rel}:${f.line}  [${f.rule}] ${f.msg}`).join("\n") +
      `\n\ncheck-seo-content: ${findings.length} finding(s) in ${new Set(findings.map((f) => f.rel)).size} file(s) ` +
      `(${Object.entries(byRule)
        .map(([k, v]) => `${k} ${v}`)
        .join(", ")})`
  );
  return 1;
}

/** Lines changed against a git base (0-based, new side) per file, plus untracked files as wholly new. */
function changedLines(root, base) {
  const git = (a) => execFileSync("git", ["-C", root, ...a], { encoding: "utf8", maxBuffer: 256 * 1024 * 1024 });
  const changed = new Map();
  let file = null;
  for (const line of git(["diff", "-U0", "--no-color", "--no-ext-diff", base, "--"]).split("\n")) {
    if (line.startsWith("+++ ")) {
      const p = line.slice(4).trim();
      file = p === "/dev/null" ? null : p.replace(/^b\//, "");
      if (file && !changed.has(file)) changed.set(file, { lines: new Set(), whole: false });
      continue;
    }
    const m = /^@@ -\d+(?:,\d+)? \+(\d+)(?:,(\d+))? @@/.exec(line);
    if (m && file) {
      const start = Number(m[1]);
      const count = m[2] === undefined ? 1 : Number(m[2]);
      for (let i = 0; i < count; i++) changed.get(file).lines.add(start - 1 + i);
    }
  }
  for (const f of git(["ls-files", "--others", "--exclude-standard"]).split("\n").filter(Boolean)) {
    changed.set(f, { lines: new Set(), whole: true });
  }
  return changed;
}

function diffMode(base) {
  const root = SCRIPT_ROOT;
  let changed;
  try {
    changed = changedLines(root, base);
  } catch (err) {
    console.log(`check-seo-content: git diff against ${base} failed: ${String(err && err.message).split("\n")[0]}`);
    return 1;
  }
  const contentDates = readContentDates(root);
  const findings = [];
  let checked = 0;
  for (const [rel, info] of changed) {
    if (!classify(rel)) continue;
    let content;
    try {
      content = fs.readFileSync(path.join(root, rel), "utf8");
    } catch {
      continue;
    }
    checked++;
    const lines = content.split("\n");
    const touched = info.whole ? () => true : (i) => info.lines.has(i);
    const structure = info.whole || [...info.lines].some((i) => HEAD_SNIPPET.test(lines[i] || ""));
    findings.push(...checkFile(rel, content, touched, contentDates, { structure }));
  }
  findings.push(...siteFindings(root, contentDates));
  if (findings.length === 0) {
    console.log(`check-seo-content: ${checked} changed file(s) checked against ${base}, no findings on changed lines.`);
    return 0;
  }
  console.log(
    findings.map((f) => `${f.rel}:${f.line}  [${f.rule}] ${f.msg}`).join("\n") +
      `\n\ncheck-seo-content: ${findings.length} finding(s) on lines changed against ${base} (and site-level checks).`
  );
  return 1;
}

const args = process.argv.slice(2);
const hook = args.includes("--hook");
try {
  const diffAt = args.indexOf("--diff");
  const diffBase = diffAt !== -1 && args[diffAt + 1] && !args[diffAt + 1].startsWith("--") ? args[diffAt + 1] : "origin/main";
  process.exit(hook ? await hookMode() : diffAt !== -1 ? diffMode(diffBase) : cliMode(args));
} catch (err) {
  // A broken check must never block work: report and get out of the way.
  process.stderr.write(`check-seo-content: internal error, skipped (${err && err.message})\n`);
  process.exit(hook ? 0 : 1);
}
