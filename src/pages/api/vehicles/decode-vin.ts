import type { NextApiRequest, NextApiResponse } from "next";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { createHash } from "crypto";
import type { Database } from "@/integrations/supabase/types";
import {
  canonicalizeMakeText,
  deriveModelFamily,
  isTrimLikeModelString,
  normalizeVehicleKey,
  type CatalogConfidence,
} from "@/lib/buyauto/vin-canonical";

type SupabaseDbClient = SupabaseClient<Database>;

type JsonObject = Record<string, unknown>;
type SupabaseJson = string | number | boolean | null | { [key: string]: SupabaseJson } | SupabaseJson[];

interface NormalizedVinPayload {
  vin: string;

  make_id: string | null;
  model_id: string | null;
  variant_id: string | null;

  variant_text?: string | null;
  catalog_confidence?: CatalogConfidence | null;
  catalog_needs_review?: boolean | null;

  year?: number | null;
  fuel?: string | null;
  transmission?: string | null;
  drivetrain?: string | null;
  power_hp?: number | null;
  body_type?: string | null;
  first_registration?: string | null;

  provider_make?: string | null;
  provider_model?: string | null;
  provider_trim?: string | null;
}

const SUCCESS_CACHE_MAX_AGE_DAYS = 30;
const FAILED_CACHE_MAX_AGE_MINUTES = 5;

const MAPPING_ERROR_PREFIX = "MAPPING:";

function buildMappingError(message: string): string {
  return `${MAPPING_ERROR_PREFIX}${message}`;
}

function isMappingErrorMessage(message: unknown): boolean {
  return typeof message === "string" && message.startsWith(MAPPING_ERROR_PREFIX);
}

function stripMappingPrefix(message: string): string {
  return message.startsWith(MAPPING_ERROR_PREFIX) ? message.slice(MAPPING_ERROR_PREFIX.length) : message;
}

function shouldAutoCreateBaseModel(providerModel: string | null): boolean {
  const raw = String(providerModel ?? "").trim();
  if (!raw) return false;

  if (raw.length < 2 || raw.length > 40) return false;

  const norm = normalizeText(raw);
  if (!norm) return false;

  if (!/[a-zäöüß]/i.test(norm)) return false;

  if (/\b\d\.\d\b/.test(norm)) return false;

  if (/^\d{3,4}$/.test(norm)) return false;

  if (/\b\d{3}[a-z]\b/i.test(norm)) return false;

  if (/\b\d{2,4}\s?(ps|hp|kw)\b/i.test(norm)) return false;

  const blocked = [
    "4matic",
    "quattro",
    "xdrive",
    "awd",
    "4wd",
    "4x4",
    "allrad",
    "amg",
    "amg line",
    "line",
    "m sport",
    "msport",
    "s line",
    "sline",
    "r line",
    "rline",
    "gti",
    "tsi",
    "tdi",
    "tfs i",
    "tfsi",
    "cdi",
    "dci",
    "hdi",
    "bluehdi",
    "bluetec",
    "facelift",
    "lci",
    "sport",
    "edition",
    "performance",
    "limited",
    "premium",
    "luxury",
  ];

  for (const token of blocked) {
    if (norm.includes(normalizeText(token))) return false;
  }

  return true;
}

function isUnknownColumnError(err: unknown, column: string): boolean {
  const msg = String((err as any)?.message ?? "");
  const lower = msg.toLowerCase();
  const c = column.toLowerCase();
  return lower.includes(`'${c}'`) || lower.includes(`"${c}"`) || lower.includes(` ${c} `) || lower.includes(`could not find the '${c}' column`);
}

function isUniqueViolation(err: unknown): boolean {
  const code = String((err as any)?.code ?? "");
  return code === "23505";
}

async function insertMakeAlias(params: {
  supabaseAdmin: SupabaseDbClient;
  makeId: string;
  alias: string;
  normalizedAlias: string;
}) {
  const { supabaseAdmin, makeId, alias, normalizedAlias } = params;

  const attempt = await supabaseAdmin.from("vehicle_aliases").insert({
    entity_type: "make",
    make_id: makeId,
    alias,
    normalized_alias: normalizedAlias,
    source: "vincario",
  } as any);

  if (!attempt.error) return;
  if (isUniqueViolation(attempt.error)) return;

  if (isUnknownColumnError(attempt.error, "source")) {
    const retry = await supabaseAdmin.from("vehicle_aliases").insert({
      entity_type: "make",
      make_id: makeId,
      alias,
      normalized_alias: normalizedAlias,
    } as any);
    if (retry.error && !isUniqueViolation(retry.error)) {
      console.error("vehicle_aliases insert (make alias) failed", { message: retry.error.message });
    }
    return;
  }

  console.error("vehicle_aliases insert (make alias) failed", { message: attempt.error.message });
}

async function createMake(params: { supabaseAdmin: SupabaseDbClient; providerMake: string }) {
  const { supabaseAdmin, providerMake } = params;

  const cleanName = String(providerMake).trim().replace(/\s+/g, " ");
  const normalized_name = normalizeVehicleKey(cleanName);
  const nowIso = new Date().toISOString();

  const primary = await supabaseAdmin
    .from("makes")
    .insert({
      name: cleanName,
      normalized_name,
      updated_at: nowIso,
    } as any)
    .select("id,name,normalized_name")
    .single();

  if (!primary.error && primary.data?.id) {
    return primary.data.id as string;
  }

  if (primary.error && isUnknownColumnError(primary.error, "updated_at")) {
    const retry = await supabaseAdmin
      .from("makes")
      .insert({
        name: cleanName,
        normalized_name,
      } as any)
      .select("id,name,normalized_name")
      .single();

    if (!retry.error && retry.data?.id) {
      return retry.data.id as string;
    }

    if (retry.error && isUniqueViolation(retry.error)) {
      const { data: existing } = await supabaseAdmin.from("makes").select("id").eq("normalized_name", normalized_name).maybeSingle();
      if (existing?.id) return existing.id as string;
    }

    if (retry.error) {
      console.error("makes insert retry failed", { message: retry.error.message });
    }

    return null;
  }

  if (primary.error && isUniqueViolation(primary.error)) {
    const { data: existing } = await supabaseAdmin.from("makes").select("id").eq("normalized_name", normalized_name).maybeSingle();
    if (existing?.id) return existing.id as string;
    return null;
  }

  if (primary.error) {
    console.error("makes insert failed", { message: primary.error.message });
  }

  return null;
}

async function insertModelAlias(params: {
  supabaseAdmin: SupabaseDbClient;
  makeId: string;
  modelId: string;
  alias: string;
  normalizedAlias: string;
}) {
  const { supabaseAdmin, makeId, modelId, alias, normalizedAlias } = params;

  const attempt = await supabaseAdmin.from("vehicle_aliases").insert({
    entity_type: "model",
    make_id: makeId,
    model_id: modelId,
    alias,
    normalized_alias: normalizedAlias,
    source: "vincario",
  } as any);

  if (!attempt.error) return;
  if (isUniqueViolation(attempt.error)) return;

  if (isUnknownColumnError(attempt.error, "source")) {
    const retry = await supabaseAdmin.from("vehicle_aliases").insert({
      entity_type: "model",
      make_id: makeId,
      model_id: modelId,
      alias,
      normalized_alias: normalizedAlias,
    } as any);
    if (retry.error && !isUniqueViolation(retry.error)) {
      console.error("vehicle_aliases insert (model alias) failed", { message: retry.error.message });
    }
    return;
  }

  console.error("vehicle_aliases insert (model alias) failed", { message: attempt.error.message });
}

async function createModel(params: { supabaseAdmin: SupabaseDbClient; makeId: string; providerModel: string }) {
  const { supabaseAdmin, makeId, providerModel } = params;

  const cleanName = String(providerModel).trim().replace(/\s+/g, " ");
  const normalized_name = normalizeVehicleKey(cleanName);
  const nowIso = new Date().toISOString();

  const primary = await supabaseAdmin
    .from("models")
    .insert({
      make_id: makeId,
      name: cleanName,
      normalized_name,
      is_active: true,
      source: "vincario",
      updated_at: nowIso,
    } as any)
    .select("id,name,normalized_name")
    .single();

  if (!primary.error && primary.data?.id) {
    return primary.data.id as string;
  }

  if (primary.error && isUniqueViolation(primary.error)) {
    const { data: existing } = await supabaseAdmin
      .from("models")
      .select("id")
      .eq("make_id", makeId)
      .eq("normalized_name", normalized_name)
      .maybeSingle();

    if (existing?.id) return existing.id as string;
    return null;
  }

  if (
    primary.error &&
    (isUnknownColumnError(primary.error, "is_active") ||
      isUnknownColumnError(primary.error, "source") ||
      isUnknownColumnError(primary.error, "updated_at") ||
      isUnknownColumnError(primary.error, "normalized_name"))
  ) {
    const minimalInsert: Record<string, unknown> = { make_id: makeId, name: cleanName };
    if (!isUnknownColumnError(primary.error, "normalized_name")) {
      minimalInsert["normalized_name"] = normalized_name;
    }

    const retry = await supabaseAdmin.from("models").insert(minimalInsert as any).select("id,name,normalized_name").single();

    if (!retry.error && retry.data?.id) return retry.data.id as string;

    if (retry.error && isUniqueViolation(retry.error)) {
      const { data: existing } = await supabaseAdmin
        .from("models")
        .select("id")
        .eq("make_id", makeId)
        .eq("normalized_name", normalized_name)
        .maybeSingle();
      if (existing?.id) return existing.id as string;
    }

    if (retry.error) {
      console.error("models insert retry failed", { message: retry.error.message });
    }

    return null;
  }

  if (primary.error) {
    console.error("models insert failed", { message: primary.error.message });
  }

  return null;
}

function pickSeedBaseModelName(params: { providerModel: string; providerTrim: string | null }): string {
  const { providerModel, providerTrim } = params;

  const candidates = buildModelTextCandidates({ providerModel, providerTrim });
  for (const c of candidates) {
    if (shouldAutoCreateBaseModel(c)) return String(c).trim().replace(/\s+/g, " ");
  }

  const first = candidates[0] ?? providerModel;
  return String(first).trim().replace(/\s+/g, " ");
}

function maskVin(vin: string): string {
  const safe = String(vin ?? "");
  if (safe.length <= 6) return "***";
  return `${safe.slice(0, 3)}***${safe.slice(-3)}`;
}

function normalizeText(input: string): string {
  return String(input ?? "")
    .trim()
    .toLowerCase()
    .replace(/[_/\\|]+/g, " ")
    .replace(/[^a-z0-9äöüàáâãåæçèéêëìíîïñòóôõøœùúûýÿß]+/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function buildModelTextCandidates(params: { providerModel: string | null; providerTrim: string | null }): string[] {
  const { providerModel, providerTrim } = params;

  const blocked = new Set(["amg", "4matic", "4matic+", "line", "facelift"]);
  const out: string[] = [];
  const seen = new Set<string>();

  const add = (raw: string | null | undefined) => {
    const s = String(raw ?? "").trim().replace(/\s+/g, " ");
    if (!s) return;

    const norm = normalizeText(s);
    if (!norm || blocked.has(norm)) return;

    if (seen.has(norm)) return;
    seen.add(norm);
    out.push(s);
  };

  add(providerModel);
  if (providerModel) {
    for (const part of providerModel.split(/[,;/|]+/g)) add(part);
    const first = providerModel.split(/\s+/)[0];
    add(first);
  }

  add(providerTrim);
  if (providerTrim) {
    for (const token of providerTrim.split(/\s+/g)) {
      const cleaned = token.replace(/[^A-Za-z0-9]+/g, "").trim();
      if (!cleaned) continue;

      // GLE53 -> GLE
      const m = cleaned.match(/^([A-Za-z]{2,6})\d{1,3}[A-Za-z]{0,2}$/);
      if (m?.[1]) add(m[1]);

      add(cleaned);
    }
  }

  // Also add first word of each multi-word candidate (e.g. "GLE 53 AMG" -> "GLE")
  const extra: string[] = [];
  for (const c of out) {
    const first = c.split(/\s+/)[0];
    if (first && first !== c) extra.push(first);
  }
  for (const e of extra) add(e);

  return out;
}

function isValidVin(vin: string): boolean {
  if (vin.length !== 17) return false;
  return /^[A-Z0-9]{17}$/.test(vin);
}

type ControlSumMode = "WITH_PIPES" | "NO_PIPES";

function computeControlSum(params: { vin: string; operation: string; apiKey: string; secretKey: string; mode: ControlSumMode }): string {
  const { vin, operation, apiKey, secretKey, mode } = params;

  const raw = mode === "WITH_PIPES" ? `${vin}|${operation}|${apiKey}|${secretKey}` : `${vin}${operation}${apiKey}${secretKey}`;

  return createHash("sha1").update(raw).digest("hex").slice(0, 10);
}

function getEnv() {
  const baseUrl = process.env.VINCARIO_API_BASE_URL;
  const apiKey = process.env.VINCARIO_API_KEY;
  const secretKey = process.env.VINCARIO_SECRET_KEY;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  // Name (never value) the vars that are absent — "Server misconfiguration"
  // alone can't distinguish a keyless local checkout from a Vercel env whose
  // variables aren't enabled for the Preview environment.
  const missing = [
    !baseUrl && "VINCARIO_API_BASE_URL",
    !apiKey && "VINCARIO_API_KEY",
    !secretKey && "VINCARIO_SECRET_KEY",
    !supabaseUrl && "NEXT_PUBLIC_SUPABASE_URL",
    !supabaseAnonKey && "NEXT_PUBLIC_SUPABASE_ANON_KEY",
    !serviceRoleKey && "SUPABASE_SERVICE_ROLE_KEY",
  ].filter((v): v is string => Boolean(v));

  if (missing.length > 0) {
    return { missing } as const;
  }

  return {
    missing: null,
    baseUrl: baseUrl!,
    apiKey: apiKey!,
    secretKey: secretKey!,
    supabaseUrl: supabaseUrl!,
    supabaseAnonKey: supabaseAnonKey!,
    serviceRoleKey: serviceRoleKey!,
  } as const;
}

function pickString(obj: unknown, keys: string[]): string | null {
  if (!obj || typeof obj !== "object") return null;
  const o = obj as Record<string, unknown>;
  for (const key of keys) {
    const v = o[key];
    if (typeof v === "string" && v.trim()) return v.trim();
  }
  return null;
}

function deepPickString(obj: unknown, candidateKeys: string[]): string | null {
  if (!obj) return null;

  const visited = new Set<unknown>();
  const stack: unknown[] = [obj];

  while (stack.length) {
    const current = stack.pop();
    if (!current || typeof current !== "object") continue;
    if (visited.has(current)) continue;
    visited.add(current);

    const asRec = current as Record<string, unknown>;
    for (const key of candidateKeys) {
      const v = asRec[key];
      if (typeof v === "string" && v.trim()) return v.trim();
    }

    for (const v of Object.values(asRec)) {
      if (v && typeof v === "object") stack.push(v);
    }
  }

  return null;
}

function deepPickNumber(obj: unknown, candidateKeys: string[]): number | null {
  if (!obj) return null;

  const visited = new Set<unknown>();
  const stack: unknown[] = [obj];

  while (stack.length) {
    const current = stack.pop();
    if (!current || typeof current !== "object") continue;
    if (visited.has(current)) continue;
    visited.add(current);

    const asRec = current as Record<string, unknown>;
    for (const key of candidateKeys) {
      const v = asRec[key];
      const num = typeof v === "number" ? v : typeof v === "string" ? Number(v) : NaN;
      if (Number.isFinite(num)) return num;
    }

    for (const v of Object.values(asRec)) {
      if (v && typeof v === "object") stack.push(v);
    }
  }

  return null;
}

function isTruthyBooleanLike(v: unknown): boolean {
  if (v === true) return true;
  if (typeof v === "string") {
    const s = v.trim().toLowerCase();
    return s === "true" || s === "1" || s === "yes";
  }
  if (typeof v === "number") return v === 1;
  return false;
}

function normalizeProviderMessage(s: string): string {
  return String(s ?? "").trim();
}

function extractProviderMessage(decoded: JsonObject): string | null {
  const message =
    deepPickString(decoded, [
      "message",
      "Message",
      "error_message",
      "errorMessage",
      "error_description",
      "errorDescription",
      "msg",
      "Msg",
      "detail",
      "Detail",
      "reason",
      "Reason",
      "status_message",
      "statusMessage",
      "error_text",
      "errorText",
    ]) ??
    pickString(decoded, ["message", "Message", "error_message", "errorMessage", "error_description", "errorDescription"]) ??
    null;

  if (message) {
    const norm = normalizeText(message);
    if (norm === "true" || norm === "false") return null;
    return normalizeProviderMessage(message);
  }

  const err = (decoded as JsonObject)["error"];
  if (typeof err === "string") {
    const norm = normalizeText(err);
    if (norm && norm !== "true" && norm !== "false") return normalizeProviderMessage(err);
  }

  return null;
}

function getProviderErrorInfo(decoded: JsonObject | null): { isError: boolean; message: string | null; invalidControlSum: boolean } {
  if (!decoded) return { isError: true, message: "Vincario returned no data", invalidControlSum: false };

  const providerError =
    isTruthyBooleanLike((decoded as JsonObject)["error"]) ||
    isTruthyBooleanLike((decoded as JsonObject)["Error"]) ||
    isTruthyBooleanLike((decoded as JsonObject)["provider_error"]) ||
    isTruthyBooleanLike((decoded as JsonObject)["providerError"]) ||
    isTruthyBooleanLike((decoded as JsonObject)["ProviderError"]);

  const message = extractProviderMessage(decoded);
  const invalidControlSum = !!message && /invalid control sum/i.test(message);

  return { isError: providerError || invalidControlSum, message, invalidControlSum };
}

function mapFuel(raw: string | null): string | null {
  const v = normalizeText(raw ?? "");
  if (!v) return null;

  if (/(electric|ev|elektro|battery)/i.test(v)) return "Elektro";
  if (/(hybrid|plug)/i.test(v)) return "Hybrid";
  if (/(diesel)/i.test(v)) return "Diesel";
  if (/(petrol|gasoline|benzin|gas)/i.test(v)) return "Benzin";

  return null;
}

function mapTransmission(raw: string | null): string | null {
  const v = normalizeText(raw ?? "");
  if (!v) return null;

  if (/(auto|automatik|automatic|at|dsg|tiptronic|cvt)/i.test(v)) return "Automatik";
  if (/(manual|manuell|mt)/i.test(v)) return "Manuell";

  return null;
}

function mapBodyType(raw: string | null): string | null {
  const v = normalizeText(raw ?? "");
  if (!v) return null;

  if (/(cabrio|convertible|roadster)/i.test(v)) return "Cabrio";
  if (/(kombi|wagon|estate)/i.test(v)) return "Kombi";
  if (/(suv|crossover|offroad|gelände)/i.test(v)) return "SUV";
  if (/(limousine|sedan|saloon)/i.test(v)) return "Limousine";

  return null;
}

function mapDrivetrain(raw: string | null): string | null {
  const v = normalizeText(raw ?? "");
  if (!v) return null;

  if (/(awd|4wd|4x4|allrad|all wheel|4matic|quattro|xdrive)/i.test(v)) return "Allrad";
  if (/(rwd|rear|heck|hinterrad)/i.test(v)) return "Heckantrieb";
  if (/(fwd|front|vorder|frontantrieb)/i.test(v)) return "Frontantrieb";

  return null;
}

function normalizeFirstRegistration(raw: string | null): string | null {
  const s = String(raw ?? "").trim();
  if (!s) return null;

  const m1 = s.match(/^(\d{4})[-/](\d{1,2})/);
  if (m1) {
    const year = Number(m1[1]);
    const month = Number(m1[2]);
    if (year >= 1900 && year <= 2100 && month >= 1 && month <= 12) {
      return `${String(year)}-${String(month).padStart(2, "0")}`;
    }
  }

  const m2 = s.match(/^(\d{1,2})[-/](\d{4})$/);
  if (m2) {
    const month = Number(m2[1]);
    const year = Number(m2[2]);
    if (year >= 1900 && year <= 2100 && month >= 1 && month <= 12) {
      return `${String(year)}-${String(month).padStart(2, "0")}`;
    }
  }

  return null;
}

function parseNumberFromText(raw: string | null): number | null {
  const s = String(raw ?? "").trim();
  if (!s) return null;
  const m = s.match(/(-?\d+(\.\d+)?)/);
  if (!m) return null;
  const num = Number(m[1]);
  return Number.isFinite(num) ? num : null;
}

function escapeRegExp(input: string): string {
  return String(input ?? "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function normalizeBmwDriveTrim(raw: string): string {
  const cleaned = String(raw ?? "").trim().replace(/[(),]/g, "");
  if (!cleaned) return cleaned;

  const compact = cleaned.replace(/[\s_-]+/g, "");
  const m = compact.match(/^(xdrive|sdrive)(\d{2,3})([a-z]{0,2})$/i);
  if (!m) return cleaned;

  const drive = m[1].toLowerCase().startsWith("x") ? "xDrive" : "sDrive";
  const num = m[2];
  const suf = (m[3] ?? "").toLowerCase();

  return `${num}${suf} ${drive}`.trim();
}

function normalizeMercedesAmgTrim(raw: string): string {
  const s = String(raw ?? "").trim().replace(/\s+/g, " ");
  if (!s) return s;

  const m1 = s.match(/^amg\s+([a-z]{2,6})\s?(\d{2,3})$/i);
  if (m1) return `${m1[1].toUpperCase()} ${m1[2]} AMG`;

  const m2 = s.match(/^([a-z]{2,6})\s?(\d{2,3})\s*amg$/i);
  if (m2) return `${m2[1].toUpperCase()} ${m2[2]} AMG`;

  const m3 = s.match(/^([a-z]{2,6})(\d{2,3})\s*amg$/i);
  if (m3) return `${m3[1].toUpperCase()} ${m3[2]} AMG`;

  return s;
}

function normalizeProviderTrimForResponse(params: { providerMake: string | null; providerTrim: string | null }): string | null {
  const { providerMake, providerTrim } = params;
  const trim = String(providerTrim ?? "").trim();
  if (!trim) return null;

  const makeNorm = normalizeText(providerMake ?? "");
  if (makeNorm.includes("mercedes")) return normalizeMercedesAmgTrim(trim);

  return trim;
}

function deepPickFirstRegexMatch(obj: unknown, re: RegExp): string | null {
  if (!obj) return null;

  const visited = new Set<unknown>();
  const stack: unknown[] = [obj];

  while (stack.length) {
    const current = stack.pop();
    if (!current || typeof current !== "object") continue;
    if (visited.has(current)) continue;
    visited.add(current);

    const asRec = current as Record<string, unknown>;
    for (const v of Object.values(asRec)) {
      if (typeof v === "string") {
        const m = v.match(re);
        if (m?.[0]) return m[0];
        continue;
      }
      if (v && typeof v === "object") {
        stack.push(v);
      }
    }
  }

  return null;
}

function deriveBmwTrimFromDecoded(decoded: JsonObject): string | null {
  const token =
    deepPickFirstRegexMatch(decoded, /\b(xdrive|sdrive)\s?\d{2,3}[a-z]{0,2}\b/i) ??
    deepPickFirstRegexMatch(decoded, /\b(xdrive|sdrive)\s*-\s*\d{2,3}[a-z]{0,2}\b/i);

  if (!token) return null;

  const normalized = normalizeBmwDriveTrim(token);
  return normalized && !isLikelyJunkVariant(normalized) ? normalized : null;
}

function deriveMercedesBaseModelNameFromTrimLikeModel(modelText: string): string | null {
  const compact = String(modelText ?? "").trim().replace(/\s+/g, " ");
  if (!compact) return null;

  const m = compact.match(/^([A-Za-z]{1,3})\s?\d{2,3}\b/);
  if (!m?.[1]) return null;

  const token = m[1].toUpperCase();
  const classFamilies = new Set(["A", "B", "C", "E", "S"]);
  const directFamilies = new Set(["GLA", "GLB", "GLC", "GLE", "GLS", "CLA", "CLS", "G"]);

  if (classFamilies.has(token)) return `${token}-Class`;
  if (directFamilies.has(token)) return token;

  return null;
}

function deriveTrimFromVehicleSpec(params: {
  vehicleSpec: string;
  providerMake: string | null;
  providerModel: string | null;
  modelFromMap: string | null;
}): string | null {
  const { vehicleSpec, providerMake, providerModel, modelFromMap } = params;

  const spec = String(vehicleSpec ?? "").trim();
  if (!spec) return null;

  const isBmw = normalizeText(providerMake ?? "") === "bmw";
  if (isBmw) {
    const compact = spec.replace(/[(),]/g, " ").replace(/\s+/g, " ").trim();
    const bmwDrive = compact.match(/\b(xdrive|sdrive)\s?(\d{2,3})([a-z]{0,2})\b/i);
    if (bmwDrive) {
      const drive = bmwDrive[1].toLowerCase().startsWith("x") ? "xDrive" : "sDrive";
      const num = bmwDrive[2];
      const suf = (bmwDrive[3] ?? "").toLowerCase();
      return `${num}${suf} ${drive}`.trim();
    }
  }

  const removalCandidates = [providerMake, providerModel, modelFromMap]
    .map((s) => String(s ?? "").trim())
    .filter(Boolean)
    .flatMap((s) => {
      const withoutParens = s.replace(/\s*\([^)]*\)\s*/g, " ").replace(/\s+/g, " ").trim();
      return withoutParens && withoutParens !== s ? [s, withoutParens] : [s];
    });

  let rest = spec;
  for (const token of removalCandidates) {
    if (!token) continue;
    const re = new RegExp(`\\b${escapeRegExp(token)}\\b`, "ig");
    rest = rest.replace(re, " ").replace(/\s+/g, " ").trim();
  }

  const rawTokens = rest.split(/\s+/).map((t) => t.trim()).filter(Boolean);
  if (!rawTokens.length) return null;

  const tokens = rawTokens.filter((t) => {
    const cleaned = t.replace(/[(),]/g, "");
    if (!cleaned) return false;

    if (/^\d{2,}$/.test(cleaned)) return false;

    if (/^[A-Z]\d[A-Z]$/i.test(cleaned)) return false;

    if (/^(xdrive|sdrive)\d/i.test(cleaned)) return true;

    if (/^\d{2,3}[a-z]{0,2}$/i.test(cleaned)) return true;

    const upper = cleaned.toUpperCase();

    const looksLikeInternalCode =
      /^[A-Z0-9]{5,}$/.test(upper) &&
      /[A-Z]/.test(upper) &&
      /\d/.test(upper) &&
      (/\d{4,}/.test(upper) || /^[A-Z]{2,}\d{3,}/.test(upper));

    if (looksLikeInternalCode) return false;

    return true;
  });

  if (!tokens.length) return null;

  const t0 = tokens[0];
  const t1 = tokens[1];

  if (/^(xdrive|sdrive)\d/i.test(t0)) {
    return normalizeBmwDriveTrim(t0);
  }

  if (/^\d{2,3}[a-z]{0,2}$/i.test(t0) && t1 && /^(xdrive|sdrive)$/i.test(t1)) {
    const drive = t1.toLowerCase().startsWith("x") ? "xDrive" : "sDrive";
    return `${t0.toLowerCase()} ${drive}`.trim();
  }

  if (t1 && /^[A-Z]{2,4}$/i.test(t1) && /\d/.test(t0)) {
    return `${t0} ${t1}`.trim();
  }

  return t0.trim();
}

function isLikelyJunkVariant(trim: string): boolean {
  const raw = String(trim ?? "").trim();
  if (!raw) return true;

  const norm = normalizeText(raw);
  if (norm.length < 2 || norm.length > 60) return true;

  if (/^[0-9]+$/.test(norm)) return true;
  if (!/[a-zäöüß]/i.test(norm)) return true;

  const block = new Set(["unknown", "n a", "na", "n/a", "standard", "base", "none", "-", "null"]);
  if (block.has(norm)) return true;

  if (norm.length <= 3 && /^[a-z]+$/.test(norm)) return true;

  return false;
}

async function safeParseJson(resp: Response): Promise<JsonObject | null> {
  try {
    const data = (await resp.json()) as unknown;
    if (data && typeof data === "object") return data as JsonObject;
    return null;
  } catch {
    return null;
  }
}

function isFresh(updatedAt: string | null | undefined, maxAgeMs: number): boolean {
  if (!updatedAt) return false;
  const d = new Date(updatedAt);
  if (!Number.isFinite(d.getTime())) return false;
  return Date.now() - d.getTime() < maxAgeMs;
}

function deepPickDecodeArray(obj: unknown): Array<Record<string, unknown>> | null {
  if (!obj) return null;

  const visited = new Set<unknown>();
  const stack: unknown[] = [obj];

  const decodeArrays: Array<Array<Record<string, unknown>>> = [];

  while (stack.length) {
    const current = stack.pop();
    if (!current || typeof current !== "object") continue;
    if (visited.has(current)) continue;
    visited.add(current);

    const asRec = current as Record<string, unknown>;
    const candidates = [asRec["decode"], asRec["Decode"], asRec["DECODE"]];

    for (const candidate of candidates) {
      if (!Array.isArray(candidate)) continue;

      const isLabelValueArray = candidate.some((x) => {
        if (!x || typeof x !== "object") return false;
        const r = x as Record<string, unknown>;
        const label = r["label"] ?? r["Label"] ?? r["LABEL"];
        const value = r["value"] ?? r["Value"] ?? r["VALUE"];
        return typeof label === "string" && (typeof value === "string" || typeof value === "number" || typeof value === "boolean");
      });

      if (isLabelValueArray) {
        decodeArrays.push(candidate.filter((x) => !!x && typeof x === "object") as Array<Record<string, unknown>>);
      }
    }

    for (const v of Object.values(asRec)) {
      if (v && typeof v === "object") stack.push(v);
    }
  }

  if (!decodeArrays.length) return null;

  const importantLabels = new Set(
    [
      "make",
      "marque",
      "brand",
      "manufacturer",
      "make (marque)",
      "vehicle make",
      "vehicle brand",
      "model",
      "model name",
      "series",
      "family",
      "vehicle model",
      "vehicle model name",
      "trim",
      "trim level",
      "version",
      "variant",
      "derivative",
      "vehicle specification",
      "vehicle spec",
      "vehicle description",
      "specification",
    ].map((s) => normalizeText(s))
  );

  const scoreArray = (arr: Array<Record<string, unknown>>) => {
    let score = 0;
    for (const row of arr) {
      const rawLabel = row["label"] ?? row["Label"] ?? row["LABEL"];
      const label = typeof rawLabel === "string" ? normalizeText(rawLabel) : "";
      if (label && importantLabels.has(label)) score += 1;
    }
    return score;
  };

  let best = decodeArrays[0];
  let bestScore = scoreArray(best);

  for (let i = 1; i < decodeArrays.length; i++) {
    const cand = decodeArrays[i];
    const candScore = scoreArray(cand);

    if (candScore > bestScore) {
      best = cand;
      bestScore = candScore;
      continue;
    }

    if (candScore === bestScore && cand.length > best.length) {
      best = cand;
    }
  }

  return best;
}

function buildDecodeLabelMap(decoded: JsonObject): Record<string, string> {
  const arr = deepPickDecodeArray(decoded);
  if (!arr) return {};

  const map: Record<string, string> = {};
  for (const row of arr) {
    const rawLabel = row["label"] ?? row["Label"] ?? row["LABEL"];
    const rawValue = row["value"] ?? row["Value"] ?? row["VALUE"];

    const label = typeof rawLabel === "string" ? String(rawLabel).trim() : "";
    const value = rawValue;

    if (!label) continue;
    if (value == null) continue;

    const key = normalizeText(label);
    const val =
      typeof value === "string"
        ? value.trim()
        : typeof value === "number"
          ? String(value)
          : typeof value === "boolean"
            ? String(value)
            : "";

    if (!val) continue;
    map[key] = val;
  }

  return map;
}

function mapGet(map: Record<string, string>, labels: string[]): string | null {
  for (const label of labels) {
    const k = normalizeText(label);
    const v = map[k];
    if (typeof v === "string" && v.trim()) return v.trim();
  }
  return null;
}

type ProviderExtract = {
  providerMake: string | null;
  providerModel: string | null;
  providerTrim: string | null;

  rawYear: number | null;
  rawFuel: string | null;
  rawTransmission: string | null;
  rawBody: string | null;
  rawDrivetrain: string | null;
  rawPowerHp: number | null;
  rawFirstRegistration: string | null;
};

function extractProviderFields(decoded: JsonObject): ProviderExtract {
  const decodeMap = buildDecodeLabelMap(decoded);

  const makeFromMap = mapGet(decodeMap, ["Make", "Marque", "Brand", "Manufacturer", "Make (Marque)", "Vehicle Make", "Vehicle Brand"]);
  const modelFromMap = mapGet(decodeMap, ["Model", "Model Name", "Series", "Family", "Vehicle Model", "Vehicle Model Name"]);
  const trimFromMap = mapGet(decodeMap, ["Trim", "Trim Level", "Version", "Variant", "Derivative", "Sub Model", "Submodel", "Model Variant", "Model Version"]);
  const vehicleSpecFromMap = mapGet(decodeMap, ["Vehicle Specification", "Vehicle Spec", "Vehicle Description", "Specification"]);
  const yearFromMapText = mapGet(decodeMap, ["Model Year", "Year", "Production Year", "Build Year", "Model year"]);
  const fuelFromMap = mapGet(decodeMap, ["Fuel Type - Primary", "Fuel Type", "Fuel", "Engine Fuel", "Fuel type"]);
  const transmissionFromMap = mapGet(decodeMap, ["Transmission", "Gearbox", "Transmission Type"]);
  const bodyFromMap = mapGet(decodeMap, ["Body", "Body Type", "Body Style", "Vehicle Type"]);
  const drivetrainFromMap = mapGet(decodeMap, ["Drivetrain", "Drive", "Drive Type", "Wheel Drive", "Driven Wheels"]);
  const hpFromMapText = mapGet(decodeMap, ["Engine Power (HP)", "Engine Power HP", "Power (HP)", "Power HP", "HP", "Horsepower"]);
  const firstRegFromMap = mapGet(decodeMap, ["Made", "First Registration", "Registration Date", "First Registered", "Date of first registration"]);

  const rawYearFromMap = yearFromMapText ? parseNumberFromText(yearFromMapText) : null;
  const rawYear = rawYearFromMap && Number.isFinite(rawYearFromMap) ? Math.floor(rawYearFromMap) : null;

  const rawPowerFromMap = hpFromMapText ? parseNumberFromText(hpFromMapText) : null;
  const rawPowerHp = rawPowerFromMap && Number.isFinite(rawPowerFromMap) ? rawPowerFromMap : null;

  const providerMake =
    makeFromMap ??
    deepPickString(decoded, ["make", "Make", "brand", "Brand", "manufacturer", "Manufacturer", "marque", "Marque"]) ??
    pickString(decoded, ["make", "brand", "manufacturer", "marque"]);

  let providerModel =
    modelFromMap ??
    deepPickString(decoded, ["model", "Model", "model_name", "modelName", "series", "Series", "family", "Family"]) ??
    pickString(decoded, ["model", "series", "family"]);

  const modelSegments = String(providerModel ?? "")
    .split(/[,;/|]+/g)
    .map((s) => s.trim())
    .filter(Boolean);

  const baseModelFromSegments = modelSegments[0] ?? null;
  const possibleVariantFromModel =
    modelSegments.length > 1 ? modelSegments.find((seg) => seg && seg !== baseModelFromSegments && /\d/.test(seg)) ?? null : null;

  const derivedTrim =
    !trimFromMap && vehicleSpecFromMap
      ? deriveTrimFromVehicleSpec({
          vehicleSpec: vehicleSpecFromMap,
          providerMake: providerMake ?? null,
          providerModel: providerModel ?? null,
          modelFromMap: modelFromMap ?? null,
        })
      : null;

  const bmwFallbackTrim =
    !trimFromMap && !derivedTrim && normalizeText(providerMake ?? "") === "bmw" ? deriveBmwTrimFromDecoded(decoded) : null;

  let providerTrim =
    trimFromMap ??
    deepPickString(decoded, ["trim", "Trim", "trim_level", "trimLevel", "version", "Version", "variant", "Variant", "derivative", "Derivative", "sub_model", "subModel"]) ??
    pickString(decoded, ["trim", "trim_level", "version", "variant", "derivative", "sub_model"]) ??
    derivedTrim ??
    bmwFallbackTrim;

  const isMercedes = normalizeText(providerMake ?? "").includes("mercedes");

  if (isMercedes && providerModel) {
    const providerModelCompact = String(providerModel).trim().replace(/\s+/g, " ");
    const modelLooksLikeTrim = /\bAMG\b/i.test(providerModelCompact) && /\b\d{2,3}\b/.test(providerModelCompact);

    const trimCompactToken = String(providerTrim ?? "")
      .trim()
      .replace(/\s+/g, "")
      .toLowerCase();

    const trimLooksCompactMercedesToken = !!trimCompactToken && /^amg[a-z]{1,4}\d{2,3}[a-z0-9]{0,3}$/.test(trimCompactToken);

    if (modelLooksLikeTrim) {
      const derivedBase = deriveMercedesBaseModelNameFromTrimLikeModel(providerModelCompact);
      if (derivedBase) {
        providerModel = derivedBase;
        if (!providerTrim || trimLooksCompactMercedesToken) {
          providerTrim = providerModelCompact;
        }
      } else {
        if (!providerTrim || trimLooksCompactMercedesToken) {
          providerTrim = providerModelCompact;
        }
      }
    }
  }

  if (isMercedes && providerTrim) {
    providerTrim = normalizeMercedesAmgTrim(providerTrim);
  }

  const rawYearFallback = deepPickNumber(decoded, ["year", "Year", "model_year", "modelYear", "production_year", "build_year"]) ?? null;

  const rawFuel =
    fuelFromMap ?? (deepPickString(decoded, ["fuel", "Fuel", "fuel_type", "fuelType", "engine_fuel", "engineFuel"]) ?? null);

  const rawTransmission =
    transmissionFromMap ?? (deepPickString(decoded, ["transmission", "Transmission", "gearbox", "Gearbox", "transmission_type", "transmissionType"]) ?? null);

  const rawBody =
    bodyFromMap ?? (deepPickString(decoded, ["body_type", "bodyType", "body", "Body", "body_style", "bodyStyle", "vehicle_type", "vehicleType"]) ?? null);

  const rawDrivetrain =
    drivetrainFromMap ??
    (deepPickString(decoded, ["drivetrain", "drive", "drive_type", "driveType", "wheel_drive", "wheelDrive", "driven_wheels", "drivenWheels"]) ?? null);

  const rawPowerHpFallback = deepPickNumber(decoded, ["power_hp", "powerHp", "hp", "HP", "horsepower"]) ?? null;

  const rawFirstRegistration =
    firstRegFromMap ??
    (deepPickString(decoded, ["first_registration", "firstRegistration", "registration_date", "registrationDate", "made", "Made"]) ?? null);

  return {
    providerMake: providerMake ?? null,
    providerModel: providerModel ?? null,
    providerTrim: providerTrim ?? null,
    rawYear: rawYear ?? (rawYearFallback && Number.isFinite(rawYearFallback) ? Math.floor(rawYearFallback) : null),
    rawFuel,
    rawTransmission,
    rawBody,
    rawDrivetrain,
    rawPowerHp: rawPowerHp ?? (rawPowerHpFallback && Number.isFinite(rawPowerHpFallback) ? rawPowerHpFallback : null),
    rawFirstRegistration,
  };
}

function hasUsefulNormalizedData(payload: unknown): boolean {
  if (!payload || typeof payload !== "object") return false;
  const p = payload as Record<string, unknown>;

  const keys: Array<keyof NormalizedVinPayload> = [
    "make_id",
    "model_id",
    "variant_id",
    "variant_text",
    "catalog_confidence",
    "catalog_needs_review",
    "year",
    "fuel",
    "transmission",
    "drivetrain",
    "power_hp",
    "body_type",
    "first_registration",
    "provider_make",
    "provider_model",
    "provider_trim",
  ];

  return keys.some((k) => {
    const v = p[k as string];
    if (v == null) return false;
    if (typeof v === "string") return v.trim().length > 0;
    if (typeof v === "number") return Number.isFinite(v);
    if (typeof v === "boolean") return true;
    return true;
  });
}

// Guests may trigger a handful of UNCACHED (= metered provider) decodes per
// IP per hour; cache hits don't count. Best-effort in-memory sliding window.
const GUEST_DECODE_LIMIT_PER_HOUR = 5;
const guestDecodeLog = new Map<string, number[]>();

function guestDecodeRateLimited(ip: string): boolean {
  const now = Date.now();
  const cutoff = now - 60 * 60 * 1000;
  const recent = (guestDecodeLog.get(ip) ?? []).filter((t) => t > cutoff);

  if (recent.length >= GUEST_DECODE_LIMIT_PER_HOUR) {
    guestDecodeLog.set(ip, recent);
    return true;
  }

  recent.push(now);
  guestDecodeLog.set(ip, recent);

  // Crude memory bound; a clear resets everyone but keeps the map small.
  if (guestDecodeLog.size > 10_000) guestDecodeLog.clear();

  return false;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const env = getEnv();
  if (env.missing) {
    console.error("decode-vin: missing env vars", env.missing);
    return res.status(500).json({
      error: "Server misconfiguration",
      message: `Fehlende Server-Konfiguration: ${env.missing.join(", ")}`,
    });
  }

  const rawVin = typeof req.body?.vin === "string" ? req.body.vin : "";
  const vin = rawVin.trim().toUpperCase();

  if (!isValidVin(vin)) {
    return res.status(400).json({ error: "Invalid VIN" });
  }

  // Auth is optional: guests may decode too (deferred login — the wizard is
  // VIN-first even before sign-in). Signed-in users are unmetered; guests get
  // a small per-IP budget, enforced just before the metered provider call
  // below (cache hits stay free for everyone).
  const authHeader = req.headers.authorization;
  let isAuthenticated = false;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    const token = authHeader.slice("Bearer ".length).trim();

    const supabaseAnon = createClient(env.supabaseUrl, env.supabaseAnonKey, {
      auth: { persistSession: false },
    });

    const { data: authData } = await supabaseAnon.auth.getUser(token);
    isAuthenticated = Boolean(authData?.user);
  }

  const supabaseAdmin = createClient<Database>(env.supabaseUrl, env.serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data: cached, error: cacheErr } = await supabaseAdmin.from("vin_cache").select("*").eq("vin", vin).maybeSingle();

  const successFresh =
    cached?.status === "success"
      ? isFresh(cached.updated_at as string | null | undefined, SUCCESS_CACHE_MAX_AGE_DAYS * 24 * 60 * 60 * 1000)
      : false;

  const failedFresh =
    cached?.status === "failed"
      ? isFresh(cached.updated_at as string | null | undefined, FAILED_CACHE_MAX_AGE_MINUTES * 60 * 1000)
      : false;

  const normalizeAndPersist = async (decoded: JsonObject, options: { cachedFlag: boolean }) => {
    const providerInfo = getProviderErrorInfo(decoded);
    if (providerInfo.isError) {
      const errMsg = providerInfo.message ?? "VIN decode failed";
      console.error("Vincario provider error", { vin: maskVin(vin), message: errMsg });

      await supabaseAdmin
        .from("vin_cache")
        .upsert(
          {
            vin,
            status: "failed",
            provider: "vincario",
            decoded_payload: decoded as unknown as SupabaseJson,
            normalized_payload: null,
            make_id: null,
            model_id: null,
            variant_id: null,
            error_message: errMsg,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "vin" }
        );

      return { ok: false as const, status: 502, error: errMsg };
    }

    const extracted = extractProviderFields(decoded);

    const rawYear = extracted.rawYear;
    const year = rawYear && rawYear >= 1990 && rawYear <= 2030 ? Math.floor(rawYear) : null;

    const fuel = mapFuel(extracted.rawFuel);
    const transmission = mapTransmission(extracted.rawTransmission);
    const body_type = mapBodyType(extracted.rawBody);
    const drivetrain = mapDrivetrain(extracted.rawDrivetrain);

    const powerHpRaw = extracted.rawPowerHp;
    const power_hp = powerHpRaw && powerHpRaw > 0 && powerHpRaw < 2000 ? Math.round(powerHpRaw) : null;

    const first_registration = normalizeFirstRegistration(extracted.rawFirstRegistration);

    const providerMakeRaw = extracted.providerMake;
    const providerModel = extracted.providerModel;
    let providerTrim = extracted.providerTrim;

    const makeCanon = providerMakeRaw ? canonicalizeMakeText(providerMakeRaw) : null;
    const providerMake = makeCanon?.canonicalName ?? providerMakeRaw;
    const makeAliasKey = makeCanon?.rawKey ?? (providerMakeRaw ? normalizeVehicleKey(providerMakeRaw) : "");
    const makeKey = makeCanon?.normalizedKey ?? (providerMakeRaw ? normalizeVehicleKey(providerMakeRaw) : "");

    let make_id: string | null = null;
    let model_id: string | null = null;
    let variant_id: string | null = null;

    const providerModelFirstPart =
      providerModel && /[,;/|]/.test(providerModel) ? providerModel.split(/[,;/|]+/g)[0]?.trim() : null;
    const providerModelForResolve = providerModelFirstPart || providerModel;

    let variant_text: string | null = null;
    let catalog_confidence: CatalogConfidence = "high";
    let catalog_needs_review = false;

    let modelFamilyName: string | null =
      typeof providerModelForResolve === "string" && providerModelForResolve.trim().length > 0 ? providerModelForResolve.trim() : null;

    const rawModelForFamily = modelFamilyName;
    let modelDerivedFromTrimLike = false;

    if (modelFamilyName) {
      const derived = deriveModelFamily({ rawModel: modelFamilyName, providerMake: providerMake ?? null });

      if (isTrimLikeModelString(modelFamilyName)) {
        modelFamilyName = derived.familyName;
        variant_text = derived.variantText ?? null;

        catalog_confidence = derived.catalogConfidence;
        catalog_needs_review = true;
        modelDerivedFromTrimLike = true;

        if (!modelFamilyName) {
          variant_text = variant_text ?? rawModelForFamily ?? null;
        }
      } else {
        modelFamilyName = derived.familyName ?? modelFamilyName;
      }
    }

    if ((!modelFamilyName || modelFamilyName.trim().length < 2) && providerTrim && isTrimLikeModelString(providerTrim)) {
      const derived = deriveModelFamily({ rawModel: providerTrim, providerMake: providerMake ?? null });

      if (!modelFamilyName && derived.familyName) {
        modelFamilyName = derived.familyName;
      }

      if (!variant_text) variant_text = derived.variantText ?? providerTrim;
      catalog_confidence = derived.catalogConfidence;
      catalog_needs_review = true;
      modelDerivedFromTrimLike = true;
    }

    if (providerTrim) {
      providerTrim = normalizeProviderTrimForResponse({ providerMake: providerMake ?? null, providerTrim }) ?? providerTrim;
    }

    if (!variant_text && providerTrim && !isLikelyJunkVariant(providerTrim)) {
      variant_text = providerTrim.trim();
    }

    if (makeKey) {
      const aliasAttempt = await supabaseAdmin
        .from("vehicle_aliases")
        .select("make_id")
        .eq("entity_type", "make")
        .eq("normalized_alias", makeAliasKey || makeKey)
        .maybeSingle();

      make_id = (aliasAttempt.data?.make_id as string | null) ?? null;

      if (!make_id) {
        const { data: existingMake } = await supabaseAdmin.from("makes").select("id").eq("normalized_name", makeKey).maybeSingle();
        make_id = (existingMake?.id as string | null) ?? null;
      }

      if (!make_id && providerMake) {
        make_id = await createMake({ supabaseAdmin, providerMake });
      }

      if (make_id) {
        if (providerMakeRaw && makeAliasKey) {
          await insertMakeAlias({ supabaseAdmin, makeId: make_id, alias: providerMakeRaw, normalizedAlias: makeAliasKey });
        }
        if (providerMake && makeKey && makeKey !== makeAliasKey) {
          await insertMakeAlias({ supabaseAdmin, makeId: make_id, alias: providerMake, normalizedAlias: makeKey });
        }
      }
    }

    if (make_id && modelFamilyName && modelFamilyName.trim().length >= 2) {
      const modelKey = normalizeVehicleKey(modelFamilyName);

      const aliasAttempt = await supabaseAdmin
        .from("vehicle_aliases")
        .select("model_id")
        .eq("entity_type", "model")
        .eq("make_id", make_id)
        .eq("normalized_alias", modelKey)
        .maybeSingle();

      model_id = (aliasAttempt.data?.model_id as string | null) ?? null;

      if (!model_id) {
        const { data: existingModel } = await supabaseAdmin
          .from("models")
          .select("id")
          .eq("make_id", make_id)
          .eq("normalized_name", modelKey)
          .maybeSingle();

        model_id = (existingModel?.id as string | null) ?? null;
      }

      if (!model_id) {
        model_id = await createModel({ supabaseAdmin, makeId: make_id, providerModel: modelFamilyName });
      }

      if (model_id) {
        await insertModelAlias({ supabaseAdmin, makeId: make_id, modelId: model_id, alias: modelFamilyName, normalizedAlias: modelKey });

        if (modelDerivedFromTrimLike && providerModelForResolve) {
          const rawKey = normalizeVehicleKey(providerModelForResolve);
          if (rawKey && rawKey !== modelKey) {
            await insertModelAlias({
              supabaseAdmin,
              makeId: make_id,
              modelId: model_id,
              alias: providerModelForResolve,
              normalizedAlias: rawKey,
            });
          }
        }
      }
    } else {
      if (rawModelForFamily && isTrimLikeModelString(rawModelForFamily)) {
        catalog_needs_review = true;
        catalog_confidence = "low";
      }
    }

    const canonicalVariantCandidate = (() => {
      const remainder = variant_text && !isLikelyJunkVariant(variant_text) ? variant_text.trim() : null;

      if (modelDerivedFromTrimLike && providerModelForResolve && !isLikelyJunkVariant(providerModelForResolve)) {
        return providerModelForResolve.trim().replace(/\s+/g, " ");
      }

      if (modelFamilyName && remainder) {
        const fam = modelFamilyName.trim().replace(/\s+/g, " ");
        if (remainder.toLowerCase().startsWith(fam.toLowerCase() + " ")) return remainder;
        return `${fam} ${remainder}`.trim();
      }

      if (providerTrim && !isLikelyJunkVariant(providerTrim)) return providerTrim.trim().replace(/\s+/g, " ");

      return remainder;
    })();

    if (model_id && canonicalVariantCandidate && !isLikelyJunkVariant(canonicalVariantCandidate)) {
      const { data: resolvedVariantId, error: vErr } = await supabaseAdmin.rpc("resolve_variant_id", {
        p_model_id: model_id,
        p_variant_text: canonicalVariantCandidate,
      });

      if (vErr) {
        console.error("resolve_variant_id error", { vin: maskVin(vin) });
      } else {
        variant_id = (resolvedVariantId as string | null) ?? null;
      }
    }

    if (model_id && canonicalVariantCandidate && !variant_id && !isLikelyJunkVariant(canonicalVariantCandidate)) {
      const cleanName = String(canonicalVariantCandidate).trim().replace(/\s+/g, " ");
      const normalized_name = normalizeVehicleKey(cleanName);
      const nowIso = new Date().toISOString();

      const { data: insertedVariant, error: insertErr } = await supabaseAdmin
        .from("variants")
        .insert({
          model_id,
          name: cleanName,
          normalized_name,
          is_active: true,
          source: "vincario",
          updated_at: nowIso,
        } as any)
        .select("id,name,normalized_name")
        .single();

      if (!insertErr && insertedVariant?.id) {
        variant_id = insertedVariant.id as string;
      } else if (insertErr) {
        console.error("variants insert failed", { message: insertErr.message });
      }
    }

    if (variant_id && model_id && canonicalVariantCandidate) {
      const cleanName = String(canonicalVariantCandidate).trim().replace(/\s+/g, " ");
      await supabaseAdmin.from("vehicle_aliases").upsert(
        {
          entity_type: "variant",
          model_id,
          variant_id,
          alias: cleanName,
          normalized_alias: normalizeVehicleKey(cleanName),
          source: "vincario",
        } as any,
        { onConflict: "model_id,normalized_alias" }
      );
    }

    const normalized_payload: NormalizedVinPayload = {
      vin,
      make_id,
      model_id,
      variant_id,
      variant_text: variant_text ?? null,
      catalog_confidence,
      catalog_needs_review,
      year,
      fuel,
      transmission,
      drivetrain,
      power_hp,
      body_type,
      first_registration,
      provider_make: providerMake ?? null,
      provider_model: providerModel ?? null,
      provider_trim: providerTrim ?? null,
    };

    await supabaseAdmin
      .from("vin_cache")
      .upsert(
        {
          vin,
          status: "success",
          provider: "vincario",
          decoded_payload: decoded as unknown as SupabaseJson,
          normalized_payload: normalized_payload as unknown as SupabaseJson,
          make_id,
          model_id,
          variant_id,
          error_message: null,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "vin" }
      );

    return { ok: true as const, payload: normalized_payload, cachedFlag: options.cachedFlag };
  };

  if (!cacheErr && cached?.status === "success" && cached?.make_id && cached?.model_id) {
    const cachedNormalized = (cached.normalized_payload as unknown as JsonObject | null) ?? null;
    const normalizedUseful = cachedNormalized ? hasUsefulNormalizedData(cachedNormalized) : false;

    const cachedDecoded = (cached.decoded_payload as unknown as JsonObject | null) ?? null;
    const cachedProviderTrim =
      cachedNormalized && typeof (cachedNormalized as any)?.provider_trim === "string"
        ? String((cachedNormalized as any).provider_trim).trim()
        : "";

    if (cachedDecoded && successFresh && !cached?.variant_id && !cachedProviderTrim) {
      const result = await normalizeAndPersist(cachedDecoded, { cachedFlag: true });
      if (!result.ok) {
        return res.status(result.status).json({
          error: "VIN decode failed",
          message: result.error,
          provider_make: (result as any)?.payload?.provider_make ?? null,
          provider_model: (result as any)?.payload?.provider_model ?? null,
          provider_trim: (result as any)?.payload?.provider_trim ?? null,
          cached: true,
        });
      }
      return res.status(200).json({ ...result.payload, vin, cached: true });
    }

    if (cachedNormalized && successFresh && normalizedUseful) {
      const cachedPayload = cachedNormalized as unknown as NormalizedVinPayload;

      return res.status(200).json({
        ...cachedPayload,
        provider_trim: normalizeProviderTrimForResponse({
          providerMake: cachedPayload.provider_make ?? null,
          providerTrim: cachedPayload.provider_trim ?? null,
        }),
        vin,
        cached: true,
      });
    }

    if (cachedDecoded && (successFresh || !normalizedUseful)) {
      const result = await normalizeAndPersist(cachedDecoded, { cachedFlag: true });
      if (!result.ok) {
        return res.status(result.status).json({
          error: "VIN decode failed",
          message: result.error,
          provider_make: (result as any)?.payload?.provider_make ?? null,
          provider_model: (result as any)?.payload?.provider_model ?? null,
          provider_trim: (result as any)?.payload?.provider_trim ?? null,
          cached: true,
        });
      }
      return res.status(200).json({ ...result.payload, vin, cached: true });
    }
  }

  if (!cacheErr && cached?.status === "success" && (!cached?.make_id || !cached?.model_id)) {
    const cachedDecoded = (cached.decoded_payload as unknown as JsonObject | null) ?? null;
    if (cachedDecoded) {
      const result = await normalizeAndPersist(cachedDecoded, { cachedFlag: true });
      if (!result.ok) {
        return res.status(result.status).json({
          error: "VIN decode failed",
          message: result.error,
          provider_make: (result as any)?.payload?.provider_make ?? null,
          provider_model: (result as any)?.payload?.provider_model ?? null,
          provider_trim: (result as any)?.payload?.provider_trim ?? null,
          cached: true,
        });
      }
      return res.status(200).json({ ...result.payload, vin, cached: true });
    }
  }

  if (!cacheErr && cached?.status === "failed") {
    const cachedDecoded = (cached.decoded_payload as unknown as JsonObject | null) ?? null;
    const rawMsg = (cached.error_message as string | null) ?? "";
    if (cachedDecoded && isMappingErrorMessage(rawMsg)) {
      const result = await normalizeAndPersist(cachedDecoded, { cachedFlag: true });
      if (result.ok) {
        return res.status(200).json({ ...result.payload, vin, cached: true });
      }
    }
  }

  // Everything above was answered from vin_cache; from here on we call the
  // metered provider. Guests get a small per-IP budget so an anonymous
  // scraper can't burn decode credits (in-memory, per instance — combined
  // with the cache this bounds spend without a datastore roundtrip).
  if (!isAuthenticated) {
    const forwarded = req.headers["x-forwarded-for"];
    const ip =
      (typeof forwarded === "string" ? forwarded.split(",")[0]?.trim() : Array.isArray(forwarded) ? forwarded[0] : null) ||
      req.socket.remoteAddress ||
      "unknown";

    if (guestDecodeRateLimited(ip)) {
      return res.status(429).json({
        error: "Rate limited",
        message: "Zu viele VIN-Abfragen. Bitte melde dich an oder versuche es in einer Stunde erneut.",
      });
    }
  }

  const base = env.baseUrl.replace(/\/$/, "");

  const requestDecode = async (
    mode: ControlSumMode
  ): Promise<{
    decoded: JsonObject | null;
    httpOk: boolean;
    httpStatus: number | null;
    providerInfo: { isError: boolean; message: string | null; invalidControlSum: boolean };
  }> => {
    const operation = "decode";
    const controlSum = computeControlSum({ vin, operation, apiKey: env.apiKey, secretKey: env.secretKey, mode });
    const url = `${base}/${env.apiKey}/${controlSum}/decode/${vin}.json`;

    try {
      const resp = await fetch(url, { method: "GET" });
      const decoded = await safeParseJson(resp);
      const providerInfo = getProviderErrorInfo(decoded);

      if (!resp.ok) {
        const msg = providerInfo.message ?? `Vincario request failed (${resp.status})`;
        return {
          decoded,
          httpOk: false,
          httpStatus: resp.status,
          providerInfo: { ...providerInfo, isError: true, message: msg },
        };
      }

      return { decoded, httpOk: true, httpStatus: resp.status, providerInfo };
    } catch (e) {
      const msg = e instanceof Error ? e.message : "unknown";
      return {
        decoded: null,
        httpOk: false,
        httpStatus: null,
        providerInfo: { isError: true, message: `Vincario request error: ${msg}`, invalidControlSum: false },
      };
    }
  };

  let decodedAttempt = await requestDecode("WITH_PIPES");
  if (decodedAttempt.providerInfo.invalidControlSum) {
    decodedAttempt = await requestDecode("NO_PIPES");
  }

  const decoded = decodedAttempt.decoded;
  const providerInfo = decodedAttempt.providerInfo;

  if (!decoded || providerInfo.isError) {
    const errMsg = providerInfo.message ?? "VIN decode failed";
    console.error("Vincario decode failed", { vin: maskVin(vin), message: errMsg });

    await supabaseAdmin
      .from("vin_cache")
      .upsert(
        {
          vin,
          status: "failed",
          provider: "vincario",
          decoded_payload: decoded as unknown as SupabaseJson,
          normalized_payload: null,
          make_id: null,
          model_id: null,
          variant_id: null,
          error_message: errMsg,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "vin" }
      );

    return res.status(502).json({ error: "VIN decode failed", message: errMsg });
  }

  const normResult = await normalizeAndPersist(decoded, { cachedFlag: false });
  if (!normResult.ok) {
    const payload = (normResult as any).payload as NormalizedVinPayload | undefined;

    return res.status(normResult.status).json({
      error: "VIN decode failed",
      message: normResult.error,
      provider_make: payload?.provider_make ?? null,
      provider_model: payload?.provider_model ?? null,
      provider_trim: payload?.provider_trim ?? null,
    });
  }

  return res.status(200).json({ ...normResult.payload, vin, cached: false });
}