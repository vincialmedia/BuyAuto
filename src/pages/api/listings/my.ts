
import type { NextApiRequest, NextApiResponse } from "next";
import { createPagesServerClient } from "@supabase/auth-helpers-nextjs";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    // Create a server-side Supabase client that can read from cookies
    const supabase = createPagesServerClient({ req, res });

    // Get the current user session
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      console.error("Authentication error:", userError);
      return res.status(401).json({ error: "User not authenticated" });
    }

    console.log("Authenticated user ID:", user.id);

    // Get query parameters for pagination and sorting
    const limit = parseInt(req.query.limit as string) || 12;
    const offset = parseInt(req.query.offset as string) || 0;
    const orderBy = (req.query.orderBy as string) || "created_at";
    const orderDir = (req.query.orderDir as string) || "desc";

    // Query listings with explicit user filter - RLS will also apply automatically
    const { data, error } = await supabase
      .from("listings")
      .select(`
        id, brand, model, title, year, price_per_month_chf, remaining_months,
        location, canton_code, mileage_km, fuel, gearbox, body, premium, 
        cover_image_url, images, cover_image_index, deposit_chf, created_at,
        status, expires_at, duration_days, price_plan, premium_until,
        created_by, user_id, moderation_note, updated_at
      `)
      .eq("created_by", user.id)
      .order(orderBy as any, { ascending: orderDir === "asc" })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error("Database query error:", error);
      return res.status(500).json({ error: error.message });
    }

    console.log(`Found ${data?.length || 0} listings for user ${user.id}`);

    // Transform the data to match the expected format
    const transformedData = (data || []).map((row: any) => ({
      id: row.id,
      brand: row.brand,
      model: row.model,
      title: row.title,
      year: row.year,
      price_per_month_chf: row.price_per_month_chf,
      remaining_months: row.remaining_months,
      location: row.location,
      canton_code: row.canton_code,
      mileage_km: row.mileage_km,
      fuel: row.fuel,
      gearbox: row.gearbox,
      body: row.body,
      premium: row.premium || false,
      is_premium: row.premium || false,
      premium_until: row.premium_until,
      cover_image_url: row.cover_image_url,
      images: row.images || [],
      cover_image_index: row.cover_image_index || 0,
      deposit_chf: row.deposit_chf,
      status: row.status,
      created_at: row.created_at,
      updated_at: row.updated_at,
      expires_at: row.expires_at,
      duration_days: row.duration_days,
      price_plan: row.price_plan,
      created_by: row.created_by,
      user_id: row.user_id || row.created_by,
      moderation_note: row.moderation_note
    }));

    return res.status(200).json({
      data: transformedData,
      pagination: {
        limit,
        offset,
        total: transformedData.length
      }
    });

  } catch (error) {
    console.error("Unexpected error in /api/listings/my:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}
