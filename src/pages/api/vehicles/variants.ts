import type { NextApiRequest, NextApiResponse } from "next";
import { createClient } from "@supabase/supabase-js";

interface VariantOption {
  id: string;
  name: string;
}

function getSupabaseEnv() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    return null;
  }

  return { supabaseUrl, supabaseAnonKey };
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const modelId = typeof req.query.model_id === "string" ? req.query.model_id : "";
  if (!modelId) {
    return res.status(400).json({ error: "Missing model_id" });
  }

  const env = getSupabaseEnv();
  if (!env) {
    return res.status(500).json({ error: "Server misconfiguration" });
  }

  const supabase = createClient(env.supabaseUrl, env.supabaseAnonKey, {
    auth: { persistSession: false },
  });

  const { data, error } = await supabase
    .from("variants")
    .select("id,name,is_active")
    .eq("model_id", modelId)
    .eq("is_active", true)
    .order("name", { ascending: true });

  if (error) {
    return res.status(500).json({ error: "Failed to load variants" });
  }

  const options: VariantOption[] = (data ?? []).map((row) => ({
    id: row.id,
    name: row.name,
  }));

  return res.status(200).json({ variants: options });
}