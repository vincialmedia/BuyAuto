export type CatalogConfidence = "high" | "medium" | "low";

function stripDiacritics(input: string): string {
  return input.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

function mapGermanChars(input: string): string {
  return input
    .replace(/ä/gi, "ae")
    .replace(/ö/gi, "oe")
    .replace(/ü/gi, "ue")
    .replace(/ß/g, "ss");
}

function toAsciiComparable(input: string): string {
  return stripDiacritics(mapGermanChars(String(input ?? "")));
}

export function normalizeVehicleKey(input: string): string {
  const s = toAsciiComparable(input).trim().toLowerCase();
  return s.replace(/[^a-z0-9]+/g, "");
}

export function normalizeVehicleWords(input: string): string {
  const s = toAsciiComparable(input).trim().toLowerCase();
  return s.replace(/[^a-z0-9.]+/g, " ").replace(/\s+/g, " ").trim();
}

function normalizeWhitespacePreserveCase(input: string): string {
  const s = toAsciiComparable(input).trim();
  return s.replace(/[^A-Za-z0-9.]+/g, " ").replace(/\s+/g, " ").trim();
}

function cleanCanonicalName(input: string): string {
  return String(input ?? "").trim().replace(/\s+/g, " ");
}

function titleCaseWords(input: string): string {
  const s = cleanCanonicalName(input);
  if (!s) return s;
  return s
    .split(" ")
    .map((w) => {
      if (!w) return w;
      if (w.toUpperCase() === w && /[A-Z]/.test(w)) return w;
      return w.slice(0, 1).toUpperCase() + w.slice(1).toLowerCase();
    })
    .join(" ");
}

export function canonicalizeMakeText(rawMake: string): { canonicalName: string; normalizedKey: string; rawKey: string } {
  const raw = cleanCanonicalName(rawMake);
  const rawKey = normalizeVehicleKey(raw);

  const mappedKey =
    rawKey === "vw"
      ? "volkswagen"
      : rawKey === "mercedes"
        ? "mercedesbenz"
        : rawKey === "alfaromeo"
          ? "alfaromeo"
          : rawKey;

  const canonicalName =
    mappedKey === "volkswagen"
      ? "Volkswagen"
      : mappedKey === "mercedesbenz"
        ? "Mercedes-Benz"
        : mappedKey === "alfaromeo"
          ? "Alfa Romeo"
          : titleCaseWords(raw);

  return { canonicalName, normalizedKey: mappedKey, rawKey };
}

const TRIM_TOKENS = new Set(
  [
    "amg",
    "msport",
    "m sport",
    "m",
    "rs",
    "sline",
    "s line",
    "rline",
    "r line",
    "gti",
    "gtd",
    "st",
    "cupra",
    "typer",
    "type r",
    "nline",
    "n line",
    "performance",
    "edition",
    "premium",
    "sport",
    "line",
    "pack",
    "long range",
    "long",
    "range",
    "plaid",
  ].map((t) => normalizeVehicleKey(t))
);

const DRIVE_TOKENS = new Set(
  [
    "awd",
    "4wd",
    "4x4",
    "4motion",
    "xdrive",
    "quattro",
    "dsg",
    "tiptronic",
    "automatic",
    "automatik",
    "manual",
    "manuell",
  ].map((t) => normalizeVehicleKey(t))
);

const ENGINE_FAMILY_TOKENS = new Set(
  [
    "tdi",
    "tsi",
    "tfs i",
    "tfsi",
    "dci",
    "hdi",
    "cdti",
    "crdi",
    "hybrid",
    "phev",
    "bev",
    "ev",
    "ehybrid",
    "plugin",
  ].map((t) => normalizeVehicleKey(t))
);

function matchesEnginePatterns(raw: string): boolean {
  const s = normalizeVehicleWords(raw);
  if (/\b\d\.\d{1,2}\b/i.test(s)) return true;
  if (/\b\d{2,3}\s?(ps|hp|kw)\b/i.test(s)) return true;
  if (/\b\d{2,3}\b\s?(tdi|tsi|tfsi|hdi|dci|cdti|crdi)\b/i.test(s)) return true;
  return false;
}

export function isTrimLikeModelString(rawModel: string): boolean {
  const raw = String(rawModel ?? "").trim();
  if (!raw) return false;

  if (matchesEnginePatterns(raw)) return true;

  const words = normalizeVehicleWords(raw);
  const tokens = words.split(" ").map((t) => normalizeVehicleKey(t)).filter(Boolean);

  const hasLongRange = tokens.includes("long") && tokens.includes("range");
  if (hasLongRange) return true;

  for (const token of tokens) {
    if (!token) continue;

    if (DRIVE_TOKENS.has(token)) return true;
    if (ENGINE_FAMILY_TOKENS.has(token)) return true;
    if (TRIM_TOKENS.has(token)) return true;

    if (/^\d{3}[a-z]{0,2}$/i.test(token)) return true;
    if (/^\d{1,2}[a-z]{1,3}$/i.test(token) && /\d/.test(token)) return true;
  }

  return false;
}

function formatFamilyToken(token: string): string {
  const t = String(token ?? "").trim();
  if (!t) return "";

  if (/^\d+(\.\d+)?$/.test(t)) return t;

  if (/^[a-z0-9]+$/i.test(t) && /[a-z]/i.test(t) && /\d/.test(t)) {
    const lettersUpper = t.replace(/[a-z]+/gi, (m) => m.toUpperCase());
    return lettersUpper;
  }

  if (/^[a-z]{1,5}$/i.test(t)) return t.toUpperCase();

  return t.slice(0, 1).toUpperCase() + t.slice(1);
}

type Tokenization = {
  displayTokens: string[];
  comparableTokens: string[];
};

function tokenizeAligned(rawModel: string): Tokenization {
  const display = normalizeWhitespacePreserveCase(rawModel);
  const comparable = normalizeVehicleWords(rawModel);

  const displayTokens = display ? display.split(" ").map((t) => t.trim()).filter(Boolean) : [];
  const comparableTokens = comparable ? comparable.split(" ").map((t) => t.trim()).filter(Boolean) : [];

  if (displayTokens.length === comparableTokens.length) {
    return { displayTokens, comparableTokens };
  }

  const raw = String(rawModel ?? "").trim().replace(/\s+/g, " ");
  const rawTokens = raw.split(" ").map((t) => t.trim()).filter(Boolean);
  const rawComparableTokens = normalizeVehicleWords(raw).split(" ").filter(Boolean);

  if (rawTokens.length === rawComparableTokens.length) {
    return { displayTokens: rawTokens, comparableTokens: rawComparableTokens };
  }

  return { displayTokens, comparableTokens };
}

function startsWithAlphabeticFamilyToken(comparableTokens: string[]): boolean {
  const first = String(comparableTokens?.[0] ?? "").trim();
  if (!first) return false;
  return /^[a-z]/i.test(first);
}

function deriveMercedesFamily(rawModel: string): { family: string; stripPrefixTokens: number } | null {
  const raw = toAsciiComparable(rawModel).trim().toUpperCase().replace(/\s+/g, " ");
  if (!raw) return null;

  if (/^GLA\b/.test(raw)) return { family: "GLA", stripPrefixTokens: 1 };
  if (/^GLC\b/.test(raw)) return { family: "GLC", stripPrefixTokens: 1 };
  if (/^GLE\b/.test(raw)) return { family: "GLE", stripPrefixTokens: 1 };

  if (/^S\b/.test(raw)) return { family: "S-Class", stripPrefixTokens: 1 };
  if (/^C\b/.test(raw)) return { family: "C-Class", stripPrefixTokens: 1 };
  if (/^E\b/.test(raw)) return { family: "E-Class", stripPrefixTokens: 1 };
  if (/^A\b/.test(raw)) return { family: "A-Class", stripPrefixTokens: 1 };

  if (/^S\d{2,3}\b/.test(raw)) return { family: "S-Class", stripPrefixTokens: 1 };
  if (/^C\d{2,3}\b/.test(raw)) return { family: "C-Class", stripPrefixTokens: 1 };
  if (/^E\d{2,3}\b/.test(raw)) return { family: "E-Class", stripPrefixTokens: 1 };
  if (/^A\d{2,3}\b/.test(raw)) return { family: "A-Class", stripPrefixTokens: 1 };

  return null;
}

function deriveBmwFamily(rawModel: string): { family: string } | null {
  const raw = toAsciiComparable(rawModel).trim().toUpperCase().replace(/\s+/g, " ");

  const mSeries = raw.match(/^(\d)\d{2}[A-Z]{0,2}\b/);
  if (mSeries?.[1]) return { family: `${mSeries[1]} Series` };

  const mEr = raw.match(/^(\d)\s?ER\b/);
  if (mEr?.[1]) return { family: `${mEr[1]} Series` };

  return null;
}

function isStopTokenComparable(token: string): boolean {
  const key = normalizeVehicleKey(token);

  if (TRIM_TOKENS.has(key)) return true;
  if (DRIVE_TOKENS.has(key)) return true;
  if (ENGINE_FAMILY_TOKENS.has(key)) return true;

  if (/^\d\.\d{1,2}$/i.test(token)) return true;
  if (/^\d{2,}$/i.test(token)) return true;

  if (/^\d{3}[a-z]{0,2}$/i.test(key)) return true;

  return false;
}

export function deriveModelFamily(params: {
  rawModel: string;
  providerMake?: string | null;
}): {
  familyName: string | null;
  variantText: string | null;
  catalogConfidence: CatalogConfidence;
  catalogNeedsReview: boolean;
} {
  const raw = String(params.rawModel ?? "").trim().replace(/\s+/g, " ");
  if (!raw) {
    return {
      familyName: null,
      variantText: null,
      catalogConfidence: "low",
      catalogNeedsReview: true,
    };
  }

  const makeKey = normalizeVehicleKey(params.providerMake ?? "");
  const { displayTokens, comparableTokens } = tokenizeAligned(raw);

  if (makeKey.includes("mercedes")) {
    const mer = deriveMercedesFamily(raw);
    if (mer) {
      let strip = mer.stripPrefixTokens;

      const next = displayTokens[strip] ? normalizeVehicleKey(displayTokens[strip]) : "";
      if (next === "klasse" || next === "class") strip = Math.min(displayTokens.length, strip + 1);

      const remainder = displayTokens.slice(strip).join(" ").trim();
      return {
        familyName: mer.family,
        variantText: remainder || null,
        catalogConfidence: remainder ? "medium" : "high",
        catalogNeedsReview: Boolean(remainder) ? true : false,
      };
    }
  }

  if (makeKey === "bmw") {
    const bmw = deriveBmwFamily(raw);
    if (bmw) {
      const display = normalizeWhitespacePreserveCase(raw);
      return {
        familyName: bmw.family,
        variantText: display || raw,
        catalogConfidence: "medium",
        catalogNeedsReview: true,
      };
    }
  }

  if (!displayTokens.length || !comparableTokens.length) {
    const display = normalizeWhitespacePreserveCase(raw);
    return {
      familyName: null,
      variantText: display || raw,
      catalogConfidence: "low",
      catalogNeedsReview: true,
    };
  }

  if (!startsWithAlphabeticFamilyToken(comparableTokens)) {
    const display = normalizeWhitespacePreserveCase(raw);
    return {
      familyName: null,
      variantText: display || raw,
      catalogConfidence: "low",
      catalogNeedsReview: true,
    };
  }

  const family: string[] = [];
  let stopAt = 0;

  for (let i = 0; i < comparableTokens.length; i++) {
    const token = comparableTokens[i];
    const tokenKey = normalizeVehicleKey(token);
    const next = comparableTokens[i + 1];
    const nextKey = next ? normalizeVehicleKey(next) : "";

    if (tokenKey === "long" && nextKey === "range") {
      stopAt = i;
      break;
    }

    if (family.length > 0 && isStopTokenComparable(token)) {
      stopAt = i;
      break;
    }

    family.push(displayTokens[i] ?? token);
    stopAt = i + 1;

    if (family.length >= 3) break;
  }

  const familyName = family.map(formatFamilyToken).join(" ").trim();
  const remainder = displayTokens.slice(stopAt).join(" ").trim();

  const trimLike = isTrimLikeModelString(raw);
  const needsReview = trimLike;

  return {
    familyName: familyName || null,
    variantText: remainder || null,
    catalogConfidence: trimLike ? (familyName ? "medium" : "low") : "high",
    catalogNeedsReview: needsReview,
  };
}