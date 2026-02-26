import type { NextApiRequest, NextApiResponse } from "next";
import { createPagesServerClient } from "@supabase/auth-helpers-nextjs";
import type { Database } from "@/integrations/supabase/types";
import { adminService } from "@/services/adminService";

type Body = {
  user_id?: string;
  role?: "private" | "garage";
};

function safeString(input: unknown): string | null {
  if (typeof input === "string" && input.trim().length > 0) return input.trim();
  return null;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ ok: false, error: "Method Not Allowed" });
  }

  const supabase = createPagesServerClient<Database>({ req, res });
  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();

  if (sessionError) return res.status(401).json({ ok: false, error: "Authentication failed" });
  if (!session?.user) return res.status(401).json({ ok: false, error: "Unauthorized" });

  const { data: me } = await supabase.from("profiles").select("role").eq("id", session.user.id).maybeSingle();
  if (!me || me.role !== "admin") return res.status(403).json({ ok: false, error: "Forbidden" });

  const body = (req.body ?? {}) as Body;
  const userId = safeString(body.user_id);
  const role = body.role;

  if (!userId) return res.status(400).json({ ok: false, error: "Missing user_id" });
  if (role !== "private" && role !== "garage") return res.status(400).json({ ok: false, error: "Invalid role" });

  const supabaseAdmin = adminService.getSupabaseAdminClient();

  const { error } = await supabaseAdmin.from("profiles").update({ role }).eq("id", userId);
  if (error) return res.status(500).json({ ok: false, error: "Failed to update role" });

  return res.status(200).json({ ok: true });
}