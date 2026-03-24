import type { NextApiRequest, NextApiResponse } from "next";
import { createClient } from "@supabase/supabase-js";
import { Database } from "@/integrations/supabase/types";

interface MakeOption {
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

  const env = getSupabaseEnv();
  if (!env) {
    return res.status(500).json({ error: "Server misconfiguration" });
  }

  const supabase = createClient(env.supabaseUrl, env.supabaseAnonKey, {
    auth: { persistSession: false },
  });

  try {
    // Use !inner on the models relationship to ONLY return makes that have at least one model.
    // This ensures we don't show empty makes in the UI dropdowns.
    const { data, error } = await supabase
      .from("makes")
      .select("id, name, normalized_name, models!inner(id)")
      .order("name");

    if (error) {
      console.error("Error fetching makes:", error);
      return res.status(500).json({ error: "Failed to fetch makes" });
    }

    // Map out the models array from the response so we just return the clean make objects
    const makes = data?.map((make) => ({
      id: make.id,
      name: make.name,
      normalized_name: make.normalized_name,
    })) || [];

    return res.status(200).json(makes);
  } catch (err) {
    return res.status(500).json({ error: "Failed to load makes" });
  }
}