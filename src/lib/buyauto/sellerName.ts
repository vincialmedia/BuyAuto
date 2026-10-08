/**
 * Public seller display name.
 *
 * Private sellers appear as first name + initial of the last name
 * ("Dávid Tóth" -> "Dávid T."); garages keep their business name. Every public
 * render (cards, listing page, JSON-LD) reads names through the listing
 * transforms in services/listingsService, which call this — so a surname never
 * reaches the page props or the HTML.
 */

function capitalizeInitial(token: string): string {
  const first = Array.from(token)[0] ?? "";
  return first.toLocaleUpperCase("de-CH");
}

/** "Dávid Tóth" -> "Dávid T.", "Anna Maria Müller" -> "Anna M.", "Dávid" -> "Dávid". */
export function abbreviatePrivateName(fullName: string | null | undefined): string | null {
  if (typeof fullName !== "string") return null;
  const cleaned = fullName.replace(/\s+/g, " ").trim();
  // An e-mail address or handle typed into the name field is not a display name.
  if (!cleaned || cleaned.includes("@")) return null;

  const tokens = cleaned.split(" ").filter(Boolean);
  const firstName = tokens[0];
  if (tokens.length === 1) return firstName;

  const lastName = tokens[tokens.length - 1].replace(/^[^\p{L}]+/u, "");
  const initial = lastName ? capitalizeInitial(lastName) : "";
  return initial ? `${firstName} ${initial}.` : firstName;
}

/** Name to show for a listing's seller on any public surface. */
export function publicSellerName(input: {
  sellerType: string | null | undefined;
  fullName?: string | null;
  garageName?: string | null;
}): string | null {
  if (input.sellerType === "garage") {
    const garage = typeof input.garageName === "string" ? input.garageName.trim() : "";
    return garage || null;
  }
  return abbreviatePrivateName(input.fullName);
}
