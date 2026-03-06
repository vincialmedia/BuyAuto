import { supabase } from "@/integrations/supabase/client";

export interface Garage {
  id: string;
  owner_user_id: string;
  garage_name: string;
  slug: string | null;
  city: string | null;
  contact_email: string | null;
  phone_number: string | null;
  website_url: string | null;
  description: string | null;
  header_image_url: string | null;
  opening_hours: Record<string, { from: string; to: string; closed: boolean }> | null;
  services: string[] | null;
  listing_limit: number | null;
  plan: string | null;
  created_at?: string | null;
  updated_at?: string | null;
}

export interface GaragePublicInfo {
  id: string;
  garage_name: string;
  slug: string | null;
  city: string | null;
  description: string | null;
}

export type GarageUpdate = Partial<
  Pick<
    Garage,
    | "garage_name"
    | "slug"
    | "city"
    | "contact_email"
    | "phone_number"
    | "website_url"
    | "description"
    | "header_image_url"
    | "opening_hours"
    | "services"
    | "plan"
    | "listing_limit"
  >
>;

function toGarage(row: unknown): Garage {
  const r = row as Record<string, unknown>;

  return {
    id: String(r.id ?? ""),
    owner_user_id: String(r.owner_user_id ?? ""),
    garage_name: String(r.garage_name ?? ""),
    slug: typeof r.slug === "string" ? r.slug : null,
    city: typeof r.city === "string" ? r.city : null,
    contact_email: typeof r.contact_email === "string" ? r.contact_email : null,
    phone_number: typeof r.phone_number === "string" ? r.phone_number : null,
    website_url: typeof r.website_url === "string" ? r.website_url : null,
    description: typeof r.description === "string" ? r.description : null,
    header_image_url: typeof r.header_image_url === "string" ? r.header_image_url : null,
    opening_hours:
      r.opening_hours && typeof r.opening_hours === "object"
        ? (r.opening_hours as Record<string, { from: string; to: string; closed: boolean }>)
        : null,
    services: Array.isArray(r.services) ? r.services : null,
    listing_limit: typeof r.listing_limit === "number" ? r.listing_limit : null,
    plan: typeof r.plan === "string" ? r.plan : null,
    created_at: typeof r.created_at === "string" ? r.created_at : null,
    updated_at: typeof r.updated_at === "string" ? r.updated_at : null,
  };
}

export async function getMyGarage(): Promise<Garage | null> {
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError) throw userError;

  const user = userData.user;
  if (!user) return null;

  const { data, error } = await supabase.from("garages").select("*").eq("owner_user_id", user.id).maybeSingle();

  if (error) throw error;
  if (!data) return null;

  return toGarage(data);
}

export async function updateMyGarage(updates: GarageUpdate): Promise<Garage> {
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError) throw userError;

  const user = userData.user;
  if (!user) throw new Error("Not authenticated");

  const { data, error } = await supabase
    .from("garages")
    .update(updates as unknown as Record<string, unknown>)
    .eq("owner_user_id", user.id)
    .select("*")
    .maybeSingle();

  if (error) throw error;
  if (!data) throw new Error("Garage not found");

  return toGarage(data);
}

export async function getGarageBySlug(slug: string): Promise<Garage | null> {
  const { data, error } = await supabase.from("garages").select("*").eq("slug", slug).maybeSingle();

  if (error) throw error;
  if (!data) return null;

  return toGarage(data);
}

export async function getGaragePublicById(id: string): Promise<GaragePublicInfo | null> {
  try {
    const { data, error } = await supabase.rpc("get_garage_public", { p_garage_id: id });

    if (!error) {
      const row = Array.isArray(data) ? (data[0] as any) : null;

      if (row) {
        return {
          id: String(row.id),
          garage_name: String(row.garage_name ?? ""),
          slug: typeof row.slug === "string" ? row.slug : null,
          city: typeof row.city === "string" ? row.city : null,
          description: typeof row.description === "string" ? row.description : null,
        };
      }
    }

    const { data: directData, error: directError } = await supabase
      .from("garages")
      .select("id, garage_name, slug, city, description")
      .eq("id", id)
      .maybeSingle();

    if (directError || !directData) return null;

    return {
      id: String((directData as any).id),
      garage_name: String((directData as any).garage_name ?? ""),
      slug: typeof (directData as any).slug === "string" ? (directData as any).slug : null,
      city: typeof (directData as any).city === "string" ? (directData as any).city : null,
      description: typeof (directData as any).description === "string" ? (directData as any).description : null,
    };
  } catch {
    return null;
  }
}

export function generateSlugFromName(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[äöüß]/g, (char) => {
      const map: Record<string, string> = { ä: "ae", ö: "oe", ü: "ue", ß: "ss" };
      return map[char] || char;
    })
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}