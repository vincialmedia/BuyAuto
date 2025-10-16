import type { NextApiRequest, NextApiResponse } from "next";
import { createClient } from "@supabase/supabase-js";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  console.log("=== DELETE USER API HANDLER STARTED ===");
  console.log("Request method:", req.method);
  
  // Only allow POST requests
  if (req.method !== "POST") {
    console.log("Method not allowed:", req.method);
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    console.log("Environment variables check:");
    console.log("- SUPABASE_URL present:", !!supabaseUrl);
    console.log("- SUPABASE_ANON_KEY present:", !!supabaseAnonKey);
    console.log("- SUPABASE_SERVICE_ROLE_KEY present:", !!supabaseServiceRoleKey);
    console.log("- SERVICE_ROLE_KEY length:", supabaseServiceRoleKey?.length || 0);
    console.log("- SERVICE_ROLE_KEY starts with:", supabaseServiceRoleKey?.substring(0, 20) || "N/A");
    
    if (!supabaseServiceRoleKey) {
      console.error("❌ SUPABASE_SERVICE_ROLE_KEY is not configured");
      return res.status(500).json({ error: "Server configuration error" });
    }

    // Step 1: Authenticate the requesting user with anon key
    console.log("\n--- Step 1: Authenticating requesting user ---");
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: false,
      },
    });

    const authHeader = req.headers.authorization;
    console.log("Authorization header present:", !!authHeader);
    
    if (!authHeader) {
      console.log("❌ No authorization header");
      return res.status(401).json({ error: "Unauthorized - No authorization header" });
    }

    const token = authHeader.replace("Bearer ", "");
    console.log("Token length:", token.length);
    console.log("Token starts with:", token.substring(0, 20));
    
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);

    if (userError) {
      console.error("❌ Error getting user from token:", userError);
      return res.status(401).json({ error: "Unauthorized - Invalid token" });
    }
    
    if (!user) {
      console.error("❌ No user returned from token");
      return res.status(401).json({ error: "Unauthorized - Invalid token" });
    }

    console.log("✅ User authenticated successfully");
    console.log("User ID:", user.id);
    console.log("User email:", user.email);

    // Step 2: Create admin client with service role key
    console.log("\n--- Step 2: Creating admin client ---");
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
    console.log("✅ Admin client created");

    // Step 3: Check if the authenticated user is an admin using the admin client
    console.log("\n--- Step 3: Checking admin status ---");
    console.log("Querying profiles table for user:", user.id);
    
    const { data: profile, error: profileError } = await supabaseAdmin
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    console.log("Profile query completed");
    console.log("Profile error:", profileError);
    console.log("Profile data:", profile);
    console.log("Profile role:", profile?.role);

    if (profileError) {
      console.error("❌ Error fetching profile:", profileError);
      return res.status(403).json({ error: "Forbidden - Admin access required" });
    }
    
    if (!profile) {
      console.error("❌ No profile found for user");
      return res.status(403).json({ error: "Forbidden - Admin access required" });
    }
    
    if (profile.role !== "admin") {
      console.error("❌ User is not an admin. Role:", profile.role);
      return res.status(403).json({ error: "Forbidden - Admin access required" });
    }

    console.log("✅ User confirmed as admin");

    // Step 4: Get the userId to delete from the request body
    console.log("\n--- Step 4: Extracting target user ID ---");
    const { userId } = req.body;
    console.log("Request body:", req.body);
    console.log("Target userId:", userId);

    if (!userId) {
      console.log("❌ Missing userId in request body");
      return res.status(400).json({ error: "Missing userId in request body" });
    }

    // Step 5: Delete the user from auth.users using the admin client
    console.log("\n--- Step 5: Deleting user ---");
    console.log("Attempting to delete user:", userId);
    
    const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(userId);

    if (deleteError) {
      console.error("❌ Error deleting user:", deleteError);
      return res.status(500).json({ error: "Failed to delete user", details: deleteError.message });
    }

    console.log("✅ User deleted successfully");
    console.log("=== DELETE USER API HANDLER COMPLETED ===\n");
    
    return res.status(200).json({ success: true, message: "User deleted successfully" });
  } catch (error: any) {
    console.error("❌ Unexpected error in delete-user API:", error);
    console.error("Error stack:", error.stack);
    return res.status(500).json({ error: "Internal server error", details: error.message });
  }
}
