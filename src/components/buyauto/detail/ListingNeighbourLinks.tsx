import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { buildListingHref } from "@/lib/buyauto/listingUrl";
import type { ListingNeighbour } from "@/services/listingsService";

/**
 * Previous / next offer in the hub's order (getListingNeighbours; the Direktkauf view's
 * for a Direktkauf), server-rendered as plain links: with its hub card every live
 * Leasingübernahme gets at least three crawlable links, also a brand's only offer that
 * never makes another listing's similar cards.
 */
export function ListingNeighbourLinks({
  previous,
  next,
  isTakeover,
}: {
  previous: ListingNeighbour | null;
  next: ListingNeighbour | null;
  isTakeover: boolean;
}) {
  if (!previous && !next) return null;

  const name = (n: ListingNeighbour) =>
    [n.brand, n.model].filter(Boolean).join(" ") + (typeof n.year === "number" && n.year > 0 ? ` (${n.year})` : "");
  const href = (n: ListingNeighbour) => buildListingHref({ id: n.id, brand: n.brand, model: n.model });

  // The {" "} between label and name keeps the anchor text apart for text-only parsers
  // («Nächste Leasingübernahme Fiat 600»); between block spans it renders nothing.
  return (
    <nav
      aria-label={isTakeover ? "Weitere Leasingübernahmen" : "Weitere Angebote"}
      className="mt-10 grid grid-cols-1 gap-3 sm:grid-cols-2 text-sm"
    >
      {previous ? (
        <Link
          href={href(previous)}
          className="flex min-w-0 items-center gap-2 rounded-xl border border-neutral-200 bg-white px-4 py-3 hover:border-red-300"
        >
          <ChevronLeft className="h-4 w-4 flex-shrink-0 text-neutral-400" aria-hidden="true" />
          <span className="min-w-0">
            <span className="block text-neutral-500">
              {isTakeover ? "Vorherige Leasingübernahme" : "Vorheriges Angebot"}
            </span>{" "}
            <span className="block truncate font-semibold text-neutral-900">{name(previous)}</span>
          </span>
        </Link>
      ) : (
        <span className="hidden sm:block" aria-hidden="true" />
      )}
      {next && (
        <Link
          href={href(next)}
          className="flex min-w-0 items-center justify-end gap-2 rounded-xl border border-neutral-200 bg-white px-4 py-3 text-right hover:border-red-300"
        >
          <span className="min-w-0">
            <span className="block text-neutral-500">{isTakeover ? "Nächste Leasingübernahme" : "Nächstes Angebot"}</span>{" "}
            <span className="block truncate font-semibold text-neutral-900">{name(next)}</span>
          </span>
          <ChevronRight className="h-4 w-4 flex-shrink-0 text-neutral-400" aria-hidden="true" />
        </Link>
      )}
    </nav>
  );
}
