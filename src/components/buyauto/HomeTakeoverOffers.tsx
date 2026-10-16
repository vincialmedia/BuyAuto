import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ModernListingCard } from "@/components/buyauto/search/ModernListingCard";
import { LazyHydrate } from "@/components/layout/LazyHydrate";
import { countLabel } from "@/lib/buyauto/format";
import type { Listing } from "@/lib/buyauto/types";

/** The Leasingübernahme hub: every live offer, self-canonical. */
const HUB_HREF = "/suche?dealType=lease_takeover";

interface HomeTakeoverOffersProps {
  /** The hub's first offers in the hub's own order: premium first, then newest. */
  listings: Listing[];
  /** All live Leasingübernahmen, from the same query as the hub. */
  totalCount: number;
}

/**
 * Live Leasingübernahmen on the home page, all of them in the server HTML (the
 * former premium carousel put three cards in the HTML and hid the rest behind
 * client-side paging). Phones swipe through one row; from sm up it is a grid.
 *
 * Geometry matches the section it replaced: the card is pulled up under the
 * search bar (-mt-16 / sm:-mt-20), and the top padding clears the bar.
 */
export function HomeTakeoverOffers({ listings, totalCount }: HomeTakeoverOffersProps) {
  const ctaLabel =
    totalCount > listings.length
      ? `Alle ${countLabel(totalCount, "Leasingübernahme", "Leasingübernahmen")} ansehen`
      : "Alle Leasingübernahmen ansehen";

  return (
    <section aria-labelledby="aktuelle-leasinguebernahmen" className="relative z-10 -mt-16 sm:-mt-20 pb-16 sm:pb-20">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-3xl shadow-2xl shadow-neutral-900/10 border border-neutral-100 px-4 pb-6 pt-[5.25rem] sm:px-10 sm:pb-10 sm:pt-[6.5rem]">
          <div className="text-center mb-6 sm:mb-10">
            <h2
              id="aktuelle-leasinguebernahmen"
              className="text-2xl sm:text-3xl md:text-4xl font-bold text-neutral-900 mb-3"
            >
              Aktuelle Leasingübernahmen
            </h2>
            <p className="text-neutral-500 text-base max-w-xl mx-auto">
              {listings.length > 0
                ? "Premium-Inserate zuerst, danach die neusten Angebote."
                : "Gerade ist keine Leasingübernahme online. Schau bald wieder vorbei."}
            </p>
          </div>

          {listings.length > 0 && (
            <>
              {/* Phones: one swipeable row with the next card peeking in. sm and up: grid.
                  Every card is in the server HTML; each one hydrates only when it nears
                  the viewport (LazyHydrate), so twelve cards don't quadruple the
                  main-thread work at load the way the eager grid did (Lighthouse mobile
                  TBT 2.5 s against 0.8 s with three cards). Plain links work before
                  hydration. */}
              <ul className="-mx-4 flex snap-x snap-mandatory scroll-px-4 gap-4 overflow-x-auto px-4 py-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:mx-0 sm:grid sm:snap-none sm:grid-cols-2 sm:gap-5 sm:overflow-visible sm:p-0 lg:grid-cols-3">
                {listings.map((listing) => (
                  <li key={listing.id} className="w-[85%] shrink-0 snap-start sm:w-auto">
                    <LazyHydrate rootMargin="200px">
                      <ModernListingCard listing={listing} />
                    </LazyHydrate>
                  </li>
                ))}
              </ul>

              <div className="text-center mt-8 sm:mt-10">
                <Button
                  asChild
                  size="lg"
                  className="bg-red-500 hover:bg-red-600 text-white font-semibold shadow-lg hover:shadow-xl transition-all rounded-xl px-8"
                >
                  <Link href={HUB_HREF}>{ctaLabel}</Link>
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    </section>
  );
}
