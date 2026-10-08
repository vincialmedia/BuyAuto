/**
 * Listing locations come from the seller's address autocomplete (Nominatim
 * display_name), e.g. "Zug, Schweiz/Suisse/Svizzera/Svizra". The quadrilingual
 * country name is the fallback buyers saw when the card shows the last segment;
 * on BuyAuto it reads "Schweiz".
 */
const QUADRILINGUAL_SWITZERLAND = /Schweiz\s*\/\s*Suisse\s*\/\s*Svizzera\s*\/\s*Svizra/gi;

export function displayLocation(location: string | null | undefined): string {
  if (typeof location !== "string") return "";
  return location.replace(QUADRILINGUAL_SWITZERLAND, "Schweiz").trim();
}
