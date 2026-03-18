import { supabase } from "@/integrations/supabase/client";

export interface TeamMember {
  id: string;
  name: string;
  role: string | null;
  bio: string | null;
  image_url: string | null;
  order: number | null;
}

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
  team_members: TeamMember[] | null;
  listing_limit: number | null;
  plan: string | null;
  created_at?: string | null;
  updated_at?: string | null;
}

export interface GaragePublicInfo {
  id: string;
  name: string;
  slug: string | null;
  city: string | null;
  bio: string | null;
  logoUrl: string | null;
  headerImageUrl?: string | null;

  location?: string | null;
  description?: string | null;
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
    | "team_members"
    | "plan"
    | "listing_limit"
  >
>;

function toTeamMembers(value: unknown): TeamMember[] | null {
  if (!Array.isArray(value)) return null;

  const mapped: TeamMember[] = value
    .filter((m) => m && typeof m === "object")
    .map((m) => m as Record<string, unknown>)
    .map((m) => ({
      id: typeof m.id === "string" ? m.id : "",
      name: typeof m.name === "string" ? m.name : "",
      role: typeof m.role === "string" ? m.role : null,
      bio: typeof m.bio === "string" ? m.bio : null,
      image_url: typeof m.image_url === "string" ? m.image_url : null,
      order: typeof m.order === "number" ? m.order : null,
    }))
    .filter((m) => m.id.trim().length > 0 && m.name.trim().length > 0);

  if (mapped.length === 0) return [];
  return mapped.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
}

function toGarage(row: unknown): Garage {
  const r = row as Record<string, unknown>;

  const headerRaw = typeof r.header_image_url === "string" ? r.header_image_url : null;
  const resolvedHeader = resolveListingImagesPublicUrl(headerRaw) ?? headerRaw;

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
    header_image_url: resolvedHeader,
    opening_hours:
      r.opening_hours && typeof r.opening_hours === "object"
        ? (r.opening_hours as Record<string, { from: string; to: string; closed: boolean }>)
        : null,
    services: Array.isArray(r.services) ? r.services : null,
    team_members: toTeamMembers(r.team_members) ?? null,
    listing_limit: typeof r.listing_limit === "number" ? r.listing_limit : null,
    plan: typeof r.plan === "string" ? r.plan : null,
    created_at: typeof r.created_at === "string" ? r.created_at : null,
    updated_at: typeof r.updated_at === "string" ? r.updated_at : null,
  };
}

function resolveListingImagesPublicUrl(pathOrUrl: string | null): string | null {
  if (typeof pathOrUrl !== "string") return null;
  const v = pathOrUrl.trim();
  if (!v) return null;

  if (/^https?:\/\//i.test(v)) return v;
  if (v.startsWith("/")) return v;

  const base = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "");
  if (!base) return null;

  const encoded = v
    .split("/")
    .map((seg) => encodeURIComponent(seg))
    .join("/");

  return `${base}/storage/v1/object/public/listing-images/${encoded}`;
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

export async function getPublicGarageBySlug(slug: string): Promise<Garage | null> {
  const { data, error } = await supabase.rpc("get_public_garage_by_slug", { p_slug: slug });

  if (error) throw error;

  const row = Array.isArray(data) ? data[0] : data;
  if (!row) return null;

  return toGarage(row);
}

export async function getGaragePublicById(garageId: string): Promise<GaragePublicInfo | null> {
  try {
    const { data, error } = await supabase.rpc("get_public_garages", {
      p_garage_ids: [garageId],
    });

    if (error) {
      console.error("getGaragePublicById rpc error:", error);
      return null;
    }

    const row = Array.isArray(data) ? data[0] : null;
    if (!row) return null;

    const name = (row as any)?.garage_name ?? "Garage";
    const city = (row as any)?.city ?? null;
    const bio = (row as any)?.description ?? null;
    const slug = (row as any)?.slug ?? null;

    const headerRaw = (row as any)?.header_image_url ?? null;
    const headerImageUrl = resolveListingImagesPublicUrl(typeof headerRaw === "string" ? headerRaw : null) ?? (typeof headerRaw === "string" ? headerRaw : null);

    return {
      id: (row as any)?.id,
      name,
      slug,
      city,
      bio,
      logoUrl: null,
      headerImageUrl,

      location: city,
      description: bio,
    };
  } catch (e) {
    console.error("getGaragePublicById error:", e);
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