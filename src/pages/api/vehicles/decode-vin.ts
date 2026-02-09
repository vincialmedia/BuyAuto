import type { NextApiRequest, NextApiResponse } from "next";
import { createClient } from "@supabase/supabase-js";
import { createHash } from "crypto";

type Json = Record<string, unknown>;

interface NormalizedVinPayload {
  vin: string;

  make_id: string | null;
  model_id: string | null;
  variant_id: string | null;

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

async function insertModelAlias(params: {
  supabaseAdmin: ReturnType<typeof createClient>;
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
  });

  if (!attempt.error) return;

  if (isUniqueViolation(attempt.error)) return;

  if (isUnknownColumnError(attempt.error, "source")) {
    const retry = await supabaseAdmin.from("vehicle_aliases").insert({
      entity_type: "model",
      make_id: makeId,
      model_id: modelId,
      alias,
      normalized_alias: normalizedAlias,
    });
    if (retry.error && !isUniqueViolation(retry.error)) {
      console.error("vehicle_aliases insert (model alias) failed", { message: retry.error.message });
    }
    return;
  }

  console.error("vehicle_aliases insert (model alias) failed", { message: attempt.error.message });
}

async function createBaseModel(params: { supabaseAdmin: ReturnType<typeof createClient>; makeId: string; providerModel: string }) {
  const { supabaseAdmin, makeId, providerModel } = params;

  const cleanName = String(providerModel).trim().replace(/\s+/g, " ");
  const normalized_name = normalizeText(cleanName);
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
    })
    .select("id,name,normalized_name")
    .single();

  if (!primary.error && primary.data?.id) {
    return primary.data.id as string;
  }

  if (primary.error && (isUnknownColumnError(primary.error, "source") || isUnknownColumnError(primary.error, "is_active") || isUnknownColumnError(primary.error, "updated_at"))) {
    const retry = await supabaseAdmin
      .from("models")
      .insert({
        make_id: makeId,
        name: cleanName,
        normalized_name,
      })
      .select("id,name,normalized_name")
      .single();

    if (!retry.error && retry.data?.id) {
      return retry.data.id as string;
    }

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

  if (primary.error) {
    console.error("models insert failed", { message: primary.error.message });
  }

  return null;
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

  if (!baseUrl || !apiKey || !secretKey || !supabaseUrl || !supabaseAnonKey || !serviceRoleKey) {
    return null;
  }

  return { baseUrl, apiKey, secretKey, supabaseUrl, supabaseAnonKey, serviceRoleKey };
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

function extractProviderMessage(decoded: Json): string | null {
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

  const err = (decoded as Json)["error"];
  if (typeof err === "string") {
    const norm = normalizeText(err);
    if (norm && norm !== "true" && norm !== "false") return normalizeProviderMessage(err);
  }

  return null;
}

function getProviderErrorInfo(decoded: Json | null): { isError: boolean; message: string | null; invalidControlSum: boolean } {
  if (!decoded) return { isError: true, message: "Vincario returned no data", invalidControlSum: false };

  const providerError =
    isTruthyBooleanLike((decoded as Json)["error"]) ||
    isTruthyBooleanLike((decoded as Json)["Error"]) ||
    isTruthyBooleanLike((decoded as Json)["provider_error"]) ||
    isTruthyBooleanLike((decoded as Json)["providerError"]) ||
    isTruthyBooleanLike((decoded as Json)["ProviderError"]);

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

async function safeParseJson(resp: Response): Promise<Json | null> {
  try {
    const data = (await resp.json()) as unknown;
    if (data && typeof data === "object") return data as Json;
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
        return candidate.filter((x) => !!x && typeof x === "object") as Array<Record<string, unknown>>;
      }
    }

    for (const v of Object.values(asRec)) {
      if (v && typeof v === "object") stack.push(v);
    }
  }

  return null;
}

function buildDecodeLabelMap(decoded: Json): Record<string, string> {
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

function extractProviderFields(decoded: Json): ProviderExtract {
  const decodeMap = buildDecodeLabelMap(decoded);

  const makeFromMap = mapGet(decodeMap, ["Make", "Marque", "Brand", "Manufacturer", "Make (Marque)", "Vehicle Make", "Vehicle Brand"]);
  const modelFromMap = mapGet(decodeMap, ["Model", "Model Name", "Series", "Family", "Vehicle Model", "Vehicle Model Name"]);
  const trimFromMap = mapGet(decodeMap, ["Trim", "Trim Level", "Version", "Variant", "Derivative", "Sub Model", "Submodel", "Model Variant", "Model Version"]);
  const yearFromMapText = mapGet(decodeMap, ["Model Year", "Year", "Production Year", "Build Year", "Model year"]);
  const fuelFromMap = mapGet(decodeMap, ["Fuel Type - Primary", "Fuel Type", "Fuel", "Engine Fuel", "Fuel type"]);
  const transmissionFromMap = mapGet(decodeMap, ["Transmission", "Gearbox", "Transmission Type"]);
  const bodyFromMap = mapGet(decodeMap, ["Body", "Body Type", "Body Style", "Vehicle Type"]);
  const drivetrainFromMap = mapGet(decodeMap, ["Drive", "Drivetrain", "Drive Type", "Wheel Drive", "Driven Wheels"]);
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

  const providerModel =
    modelFromMap ??
    deepPickString(decoded, ["model", "Model", "model_name", "modelName", "series", "Series", "family", "Family"]) ??
    pickString(decoded, ["model", "series", "family"]);

  const providerTrim =
    trimFromMap ??
    deepPickString(decoded, ["trim", "Trim", "trim_level", "trimLevel", "version", "Version", "variant", "Variant", "derivative", "Derivative", "sub_model", "subModel"]) ??
    pickString(decoded, ["trim", "trim_level", "version", "variant", "derivative", "sub_model"]);

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

  if (!p["make_id"] || !p["model_id"]) return false;

  const keys: Array<keyof NormalizedVinPayload> = [
    "make_id",
    "model_id",
    "variant_id",
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
    return true;
  });
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const env = getEnv();
  if (!env) {
    return res.status(500).json({ error: "Server misconfiguration" });
  }

  const rawVin = typeof req.body?.vin === "string" ? req.body.vin : "";
  const vin = rawVin.trim().toUpperCase();

  if (!isValidVin(vin)) {
    return res.status(400).json({ error: "Invalid VIN" });
  }

  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const token = authHeader.slice("Bearer ".length).trim();

  const supabaseAnon = createClient(env.supabaseUrl, env.supabaseAnonKey, {
    auth: { persistSession: false },
  });

  const { data: authData, error: authErr } = await supabaseAnon.auth.getUser(token);
  if (authErr || !authData?.user) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const supabaseAdmin = createClient(env.supabaseUrl, env.serviceRoleKey, {
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

  const normalizeAndPersist = async (decoded: Json, options: { cachedFlag: boolean }) => {
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
            decoded_payload: decoded,
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

    const providerMake = extracted.providerMake;
    const providerModel = extracted.providerModel;
    const providerTrim = extracted.providerTrim;

    const hasAnyUseful =
      !!providerMake ||
      !!providerModel ||
      !!providerTrim ||
      year != null ||
      !!fuel ||
      !!transmission ||
      !!drivetrain ||
      !!body_type ||
      power_hp != null ||
      !!first_registration;

    if (!hasAnyUseful) {
      const errMsg = "Vincario decode returned no usable fields";
      console.error("Vincario decode empty", { vin: maskVin(vin) });

      await supabaseAdmin
        .from("vin_cache")
        .upsert(
          {
            vin,
            status: "failed",
            provider: "vincario",
            decoded_payload: decoded,
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

    let make_id: string | null = null;
    let model_id: string | null = null;
    let variant_id: string | null = null;

    if (providerMake) {
      const { data: makeId, error: makeErr } = await supabaseAdmin.rpc("resolve_make_id", {
        p_make_text: providerMake,
      });
      if (makeErr) {
        console.error("resolve_make_id error", { vin: maskVin(vin) });
      } else {
        make_id = (makeId as string | null) ?? null;
      }
    }

    if (!make_id) {
      const msg = "Marke konnte aus der VIN nicht erkannt werden. Bitte kontaktiere den Support.";
      const error_message = buildMappingError(msg);

      const normalized_payload: NormalizedVinPayload = {
        vin,
        make_id: null,
        model_id: null,
        variant_id: null,
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
            status: "failed",
            provider: "vincario",
            decoded_payload: decoded,
            normalized_payload: normalized_payload as unknown as Json,
            make_id: null,
            model_id: null,
            variant_id: null,
            error_message,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "vin" }
        );

      return { ok: false as const, status: 422, error: msg, payload: normalized_payload };
    }

    if (providerModel) {
      const { data: modelId, error: modelErr } = await supabaseAdmin.rpc("resolve_model_id", {
        p_make_id: make_id,
        p_model_text: providerModel,
      });
      if (modelErr) {
        console.error("resolve_model_id error", { vin: maskVin(vin) });
      } else {
        model_id = (modelId as string | null) ?? null;
      }
    }

    if (!model_id) {
      const canSeed = shouldAutoCreateBaseModel(providerModel);

      if (!canSeed || !providerModel) {
        const msg = "Modell konnte aus der VIN nicht erkannt werden. Bitte kontaktiere den Support.";
        const error_message = buildMappingError(msg);

        const normalized_payload: NormalizedVinPayload = {
          vin,
          make_id,
          model_id: null,
          variant_id: null,
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
              status: "failed",
              provider: "vincario",
              decoded_payload: decoded,
              normalized_payload: normalized_payload as unknown as Json,
              make_id,
              model_id: null,
              variant_id: null,
              error_message,
              updated_at: new Date().toISOString(),
            },
            { onConflict: "vin" }
          );

        return { ok: false as const, status: 422, error: msg, payload: normalized_payload };
      }

      const createdModelId = await createBaseModel({ supabaseAdmin, makeId: make_id, providerModel });
      if (createdModelId) {
        model_id = createdModelId;

        const alias = String(providerModel).trim().replace(/\s+/g, " ");
        const normalized_alias = normalizeText(alias);
        await insertModelAlias({
          supabaseAdmin,
          makeId: make_id,
          modelId: model_id,
          alias,
          normalizedAlias: normalized_alias,
        });
      }
    }

    if (!model_id) {
      const msg = "Modell konnte aus der VIN nicht erkannt werden. Bitte kontaktiere den Support.";
      const error_message = buildMappingError(msg);

      const normalized_payload: NormalizedVinPayload = {
        vin,
        make_id,
        model_id: null,
        variant_id: null,
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
            status: "failed",
            provider: "vincario",
            decoded_payload: decoded,
            normalized_payload: normalized_payload as unknown as Json,
            make_id,
            model_id: null,
            variant_id: null,
            error_message,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "vin" }
        );

      return { ok: false as const, status: 422, error: msg, payload: normalized_payload };
    }

    if (model_id && providerTrim && !variant_id && !isLikelyJunkVariant(providerTrim)) {
      const cleanName = String(providerTrim).trim().replace(/\s+/g, " ");
      const normalized_name = normalizeText(cleanName);
      const nowIso = new Date().toISOString();

      const { data: existingVariant, error: existingErr } = await supabaseAdmin
        .from("variants")
        .select("id,name,normalized_name")
        .eq("model_id", model_id)
        .eq("normalized_name", normalized_name)
        .maybeSingle();

      if (existingErr) {
        console.error("variants lookup error", { vin: maskVin(vin) });
      }

      if (existingVariant?.id) {
        variant_id = existingVariant.id as string;
      } else {
        const { data: insertedVariant, error: insertErr } = await supabaseAdmin
          .from("variants")
          .insert({
            model_id,
            name: cleanName,
            normalized_name,
            is_active: true,
            source: "vincario",
            updated_at: nowIso,
          })
          .select("id,name,normalized_name")
          .single();

        if (!insertErr && insertedVariant?.id) {
          variant_id = insertedVariant.id as string;
        } else if ((insertErr as any)?.code === "23505") {
          const { data: conflictVariant } = await supabaseAdmin
            .from("variants")
            .select("id,name,normalized_name")
            .eq("model_id", model_id)
            .eq("normalized_name", normalized_name)
            .maybeSingle();

          if (conflictVariant?.id) {
            variant_id = conflictVariant.id as string;
          }
        } else if (insertErr && isUnknownColumnError(insertErr, "source")) {
          const { data: insertedVariant2, error: insertErr2 } = await supabaseAdmin
            .from("variants")
            .insert({
              model_id,
              name: cleanName,
              normalized_name,
              is_active: true,
              updated_at: nowIso,
            })
            .select("id,name,normalized_name")
            .single();

          if (!insertErr2 && insertedVariant2?.id) {
            variant_id = insertedVariant2.id as string;
          }
        }
      }

      if (variant_id) {
        const normalized_alias = normalizeText(cleanName);

        await supabaseAdmin.from("vehicle_aliases").upsert(
          {
            entity_type: "variant",
            model_id,
            variant_id,
            alias: cleanName,
            normalized_alias,
            source: "vincario",
          },
          { onConflict: "model_id,normalized_alias" }
        );
      }
    }

    const normalized_payload: NormalizedVinPayload = {
      vin,
      make_id,
      model_id,
      variant_id,
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
          decoded_payload: decoded,
          normalized_payload: normalized_payload as unknown as Json,
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

  if (!cacheErr && cached?.status === "success") {
    const cachedNormalized = (cached.normalized_payload as unknown as Json | null) ?? null;
    const normalizedUseful = cachedNormalized ? hasUsefulNormalizedData(cachedNormalized) : false;

    if (cachedNormalized && successFresh && normalizedUseful) {
      return res.status(200).json({
        ...(cachedNormalized as unknown as NormalizedVinPayload),
        vin,
        cached: true,
      });
    }

    const cachedDecoded = (cached.decoded_payload as unknown as Json | null) ?? null;

    if (cachedDecoded && (successFresh || !normalizedUseful)) {
      const result = await normalizeAndPersist(cachedDecoded, { cachedFlag: true });
      if (!result.ok) {
        return res.status(result.status).json({ error: "VIN decode failed", message: result.error, cached: true });
      }
      return res.status(200).json({ ...result.payload, vin, cached: true });
    }
  }

  if (!cacheErr && cached?.status === "failed" && failedFresh) {
    const providerInfo = getProviderErrorInfo((cached.decoded_payload as unknown as Json | null) ?? null);
    const isInvalidControlSum =
      providerInfo.invalidControlSum || /invalid control sum/i.test(String((cached.error_message as string | null) ?? ""));

    if (!isInvalidControlSum) {
      const rawMsg = (cached.error_message as string | null) ?? "VIN decode failed";
      const isMapping = isMappingErrorMessage(rawMsg);
      const message = isMapping ? stripMappingPrefix(rawMsg) : rawMsg;

      return res.status(isMapping ? 422 : 502).json({
        error: "VIN decode failed",
        message,
        cached: true,
      });
    }
  }

  const base = env.baseUrl.replace(/\/$/, "");

  const requestDecode = async (
    mode: ControlSumMode
  ): Promise<{
    decoded: Json | null;
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
          decoded_payload: decoded,
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

  return res.status(200).json({ ...normResult.payload, cached: false });
}