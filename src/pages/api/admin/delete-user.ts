import type { NextApiRequest, NextApiResponse } from "next";
import { createClient } from "@supabase/supabase-js";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Only allow POST requests
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseServiceRoleKey) {
      console.error("SUPABASE_SERVICE_ROLE_KEY is not configured");
      return res.status(500).json({ error: "Server configuration error" });
    }

    // Step 1: Authenticate the requesting user with anon key
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: false,
      },
    });

    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: "Unauthorized - No authorization header" });
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);

    if (userError || !user) {
      return res.status(401).json({ error: "Unauthorized - Invalid token" });
    }

    // Step 2: Create admin client with service role key
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // Step 3: Check if the authenticated user is an admin using the admin client
    // This bypasses RLS and gives us the true role value
    const { data: profile, error: profileError } = await supabaseAdmin
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profileError || !profile || profile.role !== "admin") {
      console.error("Admin check failed:", profileError || "User is not an admin");
      return res.status(403).json({ error: "Forbidden - Admin access required" });
    }

    // Step 4: Get the userId to delete from the request body
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ error: "Missing userId in request body" });
    }

    // Step 5: Delete the user from auth.users using the admin client
    // This will cascade to profiles and listings if ON DELETE CASCADE is configured
    const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(userId);

    if (deleteError) {
      console.error("Error deleting user:", deleteError);
      return res.status(500).json({ error: "Failed to delete user", details: deleteError.message });
    }

    return res.status(200).json({ success: true, message: "User deleted successfully" });
  } catch (error: any) {
    console.error("Unexpected error in delete-user API:", error);
    return res.status(500).json({ error: "Internal server error", details: error.message });
  }
}
