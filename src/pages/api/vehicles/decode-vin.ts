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

const CACHE_MAX_AGE_DAYS = 30;

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

function computeControlSum(params: { vin: string; apiKey: string; secretKey: string; mode: ControlSumMode }): string {
  const { vin, apiKey, secretKey, mode } = params;
  const raw = mode === "WITH_PIPES" ? `${vin}|${apiKey}|${apiKey}|${secretKey}` : `${vin}${apiKey}${apiKey}${secretKey}`;
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

function extractProviderMessage(decoded: Json): string | null {
  return (
    deepPickString(decoded, ["message", "Message", "error_message", "errorMessage", "msg", "Msg", "detail", "Detail"]) ??
    pickString(decoded, ["message", "Message", "error_message", "errorMessage"]) ??
    null
  );
}

function getProviderErrorInfo(decoded: Json | null): { isError: boolean; message: string | null; invalidControlSum: boolean } {
  if (!decoded) return { isError: true, message: "Vincario returned no data", invalidControlSum: false };

  const providerError =
    isTruthyBooleanLike((decoded as Json)["error"]) ||
    isTruthyBooleanLike((decoded as Json)["provider_error"]) ||
    isTruthyBooleanLike((decoded as Json)["providerError"]);

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

  if (/(auto|automatik|at|dsg|tiptronic|cvt)/i.test(v)) return "Automatik";
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

  const { data: cached, error: cacheErr } = await supabaseAdmin
    .from("vin_cache")
    .select("*")
    .eq("vin", vin)
    .maybeSingle();

  if (!cacheErr && cached?.status === "success" && cached?.normalized_payload) {
    const providerInfo = getProviderErrorInfo((cached.decoded_payload as unknown as Json | null) ?? null);

    if (providerInfo.isError) {
      await supabaseAdmin
        .from("vin_cache")
        .upsert(
          {
            vin,
            status: "failed",
            provider: "vincario",
            decoded_payload: (cached.decoded_payload as unknown as Json | null) ?? null,
            normalized_payload: null,
            make_id: null,
            model_id: null,
            variant_id: null,
            error_message: providerInfo.message ?? "Vincario provider error",
            updated_at: new Date().toISOString(),
          },
          { onConflict: "vin" }
        );
    } else {
      const updatedAt = cached.updated_at ? new Date(cached.updated_at) : null;
      const ageOk =
        updatedAt && Number.isFinite(updatedAt.getTime())
          ? Date.now() - updatedAt.getTime() < CACHE_MAX_AGE_DAYS * 24 * 60 * 60 * 1000
          : false;

      if (ageOk) {
        return res.status(200).json({
          ...((cached.normalized_payload as unknown as NormalizedVinPayload) ?? {}),
          vin,
          cached: true,
        });
      }
    }
  }

  const base = env.baseUrl.replace(/\/$/, "");

  const requestDecode = async (mode: ControlSumMode): Promise<{ decoded: Json | null; httpOk: boolean; httpStatus: number | null; providerInfo: { isError: boolean; message: string | null; invalidControlSum: boolean } }> => {
    const controlSum = computeControlSum({ vin, apiKey: env.apiKey, secretKey: env.secretKey, mode });
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

  const providerMake =
    deepPickString(decoded, ["make", "Make", "brand", "Brand", "manufacturer", "Manufacturer"]) ??
    pickString(decoded, ["make", "brand", "manufacturer"]);
  const providerModel =
    deepPickString(decoded, ["model", "Model", "model_name", "modelName", "series", "Series", "family"]) ??
    pickString(decoded, ["model", "series", "family"]);
  const providerTrim =
    deepPickString(decoded, ["trim", "Trim", "version", "Version", "variant", "Variant", "derivative", "Derivative"]) ??
    pickString(decoded, ["trim", "version", "variant", "derivative"]);

  const rawYear =
    deepPickNumber(decoded, ["year", "Year", "model_year", "modelYear", "production_year"]) ??
    (providerModel ? null : null);
  const year = rawYear && rawYear >= 1900 && rawYear <= 2100 ? Math.floor(rawYear) : null;

  const rawFuel = deepPickString(decoded, ["fuel", "Fuel", "fuel_type", "fuelType", "engine_fuel"]) ?? null;
  const rawTransmission = deepPickString(decoded, ["transmission", "Transmission", "gearbox", "Gearbox"]) ?? null;
  const rawBody = deepPickString(decoded, ["body_type", "bodyType", "body", "Body", "body_style", "bodyStyle"]) ?? null;
  const rawDrivetrain = deepPickString(decoded, ["drivetrain", "drive", "drive_type", "driveType", "wheel_drive"]) ?? null;

  const fuel = mapFuel(rawFuel);
  const transmission = mapTransmission(rawTransmission);
  const body_type = mapBodyType(rawBody);
  const drivetrain = mapDrivetrain(rawDrivetrain);

  const powerHpRaw = deepPickNumber(decoded, ["power_hp", "powerHp", "hp", "HP"]) ?? null;
  const power_hp = powerHpRaw && powerHpRaw > 0 && powerHpRaw < 2000 ? Math.round(powerHpRaw) : null;

  const firstRegRaw =
    deepPickString(decoded, ["first_registration", "firstRegistration", "registration_date", "registrationDate"]) ?? null;
  const first_registration = normalizeFirstRegistration(firstRegRaw);

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

  if (make_id && providerModel) {
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

  if (model_id && providerTrim) {
    const { data: variantId, error: variantErr } = await supabaseAdmin.rpc("resolve_variant_id", {
      p_model_id: model_id,
      p_variant_text: providerTrim,
    });
    if (variantErr) {
      console.error("resolve_variant_id error", { vin: maskVin(vin) });
    } else {
      variant_id = (variantId as string | null) ?? null;
    }
  }

  if (model_id && providerTrim && !variant_id && !isLikelyJunkVariant(providerTrim)) {
    const cleanName = String(providerTrim).trim().replace(/\s+/g, " ");
    const normalized_name = normalizeText(cleanName);

    const { data: upsertedVariant, error: upsertErr } = await supabaseAdmin
      .from("variants")
      .upsert(
        {
          model_id,
          name: cleanName,
          normalized_name,
          is_active: true,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "model_id,normalized_name" }
      )
      .select("id,name,normalized_name")
      .single();

    if (!upsertErr && upsertedVariant?.id) {
      variant_id = upsertedVariant.id as string;

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

  return res.status(200).json({ ...normalized_payload, cached: false });
}