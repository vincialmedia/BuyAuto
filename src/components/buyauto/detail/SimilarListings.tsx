import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Listing, ListingDetail } from "@/lib/buyauto/types";
import { getSimilarListings } from "@/services/listingsService";
import { ModernListingCard } from "@/components/buyauto/search/ModernListingCard";

interface SimilarListingsProps {
  listing: ListingDetail;
}

export default function SimilarListings({ listing }: SimilarListingsProps) {
  const [listings, setListings] = useState<Listing[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadSimilarListings = async () => {
      try {
        const similarListings = await getSimilarListings(listing, 6);
        setListings(similarListings);
      } catch (error) {
        console.error("Error loading similar listings:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadSimilarListings();
  }, [listing]);

  if (isLoading) {
    return (
      <section className="space-y-8">
        <div className="flex items-center justify-between">
          <div className="w-48 h-8 bg-neutral-200 rounded animate-pulse"></div>
          <div className="w-32 h-10 bg-neutral-200 rounded animate-pulse"></div>
        </div>

        {/* Mobile: horizontal scroll skeleton (mirrors the loaded layout) */}
        <div className="md:hidden">
          <div className="flex gap-4 overflow-x-auto pb-4 -mx-4 px-4 snap-x snap-mandatory">
            {[...Array(3)].map((_, i) => (
              <SimilarListingCardSkeleton key={i} className="flex-shrink-0 w-72 snap-start" />
            ))}
          </div>
        </div>

        {/* Desktop: grid skeleton (mirrors the loaded layout) */}
        <div className="hidden md:grid grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => (
            <SimilarListingCardSkeleton key={i} />
          ))}
        </div>
      </section>
    );
  }

  if (listings.length === 0) {
    return null;
  }

  return (
    <section className="space-y-8">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-neutral-900">
          Ähnliche Fahrzeuge
        </h2>
        <Button variant="outline" asChild className="bg-transparent hover:bg-neutral-50">
          <Link href="/suche">
            Alle ansehen
            <ArrowRight className="w-4 h-4 ml-2" />
          </Link>
        </Button>
      </div>

      {/* Mobile: Horizontal scroll */}
      <div className="md:hidden">
        <div className="flex gap-4 overflow-x-auto pb-4 -mx-4 px-4 snap-x snap-mandatory">
          {listings.map((listingItem) => (
            <div key={listingItem.id} className="flex-shrink-0 w-72 snap-start">
              <ModernListingCard listing={listingItem} />
            </div>
          ))}
        </div>
      </div>

      {/* Desktop: Grid */}
      <div className="hidden md:grid grid-cols-2 lg:grid-cols-3 gap-6">
        {listings.slice(0, 6).map((listingItem) => (
          <ModernListingCard key={listingItem.id} listing={listingItem} />
        ))}
      </div>
    </section>
  );
}

function SimilarListingCardSkeleton({ className }: { className?: string }) {
  return (
    <Card
      className={`animate-pulse border-0 shadow-lg shadow-neutral-900/5 bg-white rounded-2xl overflow-hidden ${className ?? ""}`}
    >
      <div className="aspect-video bg-neutral-200"></div>
      <CardContent className="p-4 space-y-3">
        <div>
          <div className="w-3/4 h-5 bg-neutral-200 rounded mb-1.5"></div>
          <div className="w-1/2 h-4 bg-neutral-200 rounded"></div>
        </div>
        <div className="flex justify-between">
          <div>
            <div className="w-20 h-5 bg-neutral-200 rounded mb-1.5"></div>
            <div className="w-16 h-3 bg-neutral-200 rounded"></div>
          </div>
          <div className="flex flex-col items-end">
            <div className="w-14 h-4 bg-neutral-200 rounded mb-1.5"></div>
            <div className="w-20 h-3 bg-neutral-200 rounded"></div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
