import type { NextApiRequest, NextApiResponse } from "next";
import { createPagesServerClient } from "@supabase/auth-helpers-nextjs";
import type { Database } from "@/integrations/supabase/types";

type SetSessionBody = {
  access_token?: string;
  refresh_token?: string;
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).json({ error: "Method not allowed" });
  }

  const body = (req.body ?? {}) as SetSessionBody;
  const accessToken = body.access_token;
  const refreshToken = body.refresh_token;

  if (!accessToken || !refreshToken) {
    return res.status(400).json({ error: "Missing access_token or refresh_token" });
  }

  const supabase = createPagesServerClient<Database>({ req, res });

  const { data, error } = await supabase.auth.setSession({
    access_token: accessToken,
    refresh_token: refreshToken,
  });

  if (error) {
    return res.status(401).json({ error: error.message });
  }

  return res.status(200).json({
    ok: true,
    userId: data.session?.user?.id ?? null,
  });
}