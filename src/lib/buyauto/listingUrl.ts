export function slugifyListingPart(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .replace(/-{2,}/g, "-");
}

const UUID_V4ish_END_REGEX =
  /([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12})$/;

export function extractListingIdFromParam(param: string): string {
  const trimmed = String(param || "").trim();
  if (!trimmed) return "";

  const uuidMatch = trimmed.match(UUID_V4ish_END_REGEX);
  if (uuidMatch?.[1]) return uuidMatch[1];

  return trimmed;
}

export function buildListingSlugSegment(input: { id: string; brand?: string | null; model?: string | null }): string {
  const id = input.id;
  const brand = typeof input.brand === "string" ? input.brand : "";
  const model = typeof input.model === "string" ? input.model : "";

  const prefix = slugifyListingPart([brand, model].filter(Boolean).join(" "));
  if (prefix) return `${prefix}-${id}`;
  return id;
}

export function buildListingHref(input: { id: string; brand?: string | null; model?: string | null }): string {
  return `/fahrzeug/${buildListingSlugSegment(input)}`;
}