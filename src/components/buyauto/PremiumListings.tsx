"use client";

import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Crown } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import type { Listing } from "@/lib/buyauto/types";
import { hasNewLeasingFinancing, kaufartOf } from "@/lib/buyauto/kaufart";
import { orderPremiumListings, PREMIUM_LISTINGS_QUERY } from "@/lib/buyauto/premiumListings";
import { ModernListingCard } from "@/components/buyauto/search/ModernListingCard";

type FilterCategory = "all" | "direct_purchase" | "leasing" | "lease_takeover";

const FILTER_OPTIONS: { label: string; value: FilterCategory }[] = [
  { label: "Alle", value: "all" },
  { label: "Direktkauf", value: "direct_purchase" },
  { label: "Leasing", value: "leasing" },
  { label: "Leasingübernahme", value: "lease_takeover" },
];

interface PremiumListingsProps {
  externalFilter?: FilterCategory;
  onFilterChange?: (filter: FilterCategory) => void;
  /** Listings fetched at build/request time. When provided, no client fetch
   *  happens and the cards are part of the first paint (no layout shift). */
  initialListings?: Listing[];
}

export default function PremiumListings({ externalFilter, onFilterChange, initialListings }: PremiumListingsProps) {
  const [listings, setListings] = useState<Listing[]>(initialListings ?? []);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(initialListings === undefined);
  const [internalFilter, setInternalFilter] = useState<FilterCategory>("all");

  // Use external filter if provided, otherwise use internal
  const activeFilter = externalFilter ?? internalFilter;

  const handleFilterChange = (filter: FilterCategory) => {
    if (onFilterChange) {
      onFilterChange(filter);
    } else {
      setInternalFilter(filter);
    }
  };

  const pageSize = 3;

  useEffect(() => {
    if (initialListings !== undefined) return;

    let cancelled = false;

    const loadPremiumListings = async () => {
      setIsLoading(true);
      try {
        // Dynamic import keeps the Supabase client out of the homepage's
        // critical bundle — on the homepage this effect never runs anyway
        // (initialListings comes from getStaticProps).
        const { searchListings } = await import("@/services/listingsService");
        const result = await searchListings(PREMIUM_LISTINGS_QUERY);

        if (cancelled) return;

        // Same order as the homepage's getStaticProps: takeovers first, newest first.
        setListings(orderPremiumListings(result.items));
        setCurrentIndex(0);
      } catch (error) {
        console.error("Error loading premium listings:", error);
        setListings([]);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    loadPremiumListings();

    return () => {
      cancelled = true;
    };
  }, [initialListings]);

  const filteredListings = useMemo(() => {
    if (activeFilter === "all") return listings;
    // Each tab is exactly one Kaufart bucket, the same rule as the card chip.
    return listings.filter((listing) => {
      const kaufart = kaufartOf(listing);
      if (activeFilter === "lease_takeover") return kaufart === "lease_takeover";
      if (activeFilter === "leasing") return kaufart === "direct_purchase" && hasNewLeasingFinancing(listing);
      if (activeFilter === "direct_purchase") return kaufart === "direct_purchase" && !hasNewLeasingFinancing(listing);
      return true;
    });
  }, [listings, activeFilter]);

  const pageCount = useMemo(() => Math.max(1, Math.ceil(filteredListings.length / pageSize)), [filteredListings.length]);
  const maxIndex = useMemo(() => Math.max(0, (pageCount - 1) * pageSize), [pageCount]);

  const visibleListings = useMemo(() => filteredListings.slice(currentIndex, currentIndex + pageSize), [filteredListings, currentIndex]);

  // Reset index when filter changes
  useEffect(() => {
    setCurrentIndex(0);
  }, [activeFilter]);

  const nextSlide = () => setCurrentIndex((prev) => Math.min(prev + pageSize, maxIndex));
  const prevSlide = () => setCurrentIndex((prev) => Math.max(prev - pageSize, 0));

  const canGoPrev = currentIndex > 0;
  const canGoNext = currentIndex < maxIndex;

  if (isLoading) {
    // Mirrors the loaded state's geometry exactly (same floating card pulled
    // up by -mt-16) so swapping skeleton → content causes no layout shift.
    return (
      <section className="relative z-10 -mt-16 sm:-mt-20 pb-16 sm:pb-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-3xl shadow-2xl shadow-neutral-900/10 border border-neutral-100 p-6 sm:p-10">
            <div className="text-center mb-8 sm:mb-10">
              <div className="w-44 h-10 bg-amber-50 rounded-full animate-pulse mx-auto mb-5" />
              <div className="w-72 max-w-full h-8 bg-neutral-200 rounded animate-pulse mx-auto mb-3" />
              <div className="w-80 max-w-full h-5 bg-neutral-100 rounded animate-pulse mx-auto mb-6" />
              <div className="flex flex-wrap justify-center gap-2 sm:gap-3">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="w-24 h-9 bg-neutral-100 rounded-full animate-pulse" />
                ))}
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="animate-pulse bg-white rounded-2xl overflow-hidden shadow-md border border-neutral-200">
                  <div className="w-full h-48 sm:h-52 bg-neutral-100" />
                  <div className="p-5 space-y-3">
                    <div className="w-32 h-4 bg-neutral-100 rounded" />
                    <div className="w-24 h-4 bg-neutral-100 rounded" />
                  </div>
                </div>
              ))}
            </div>
            <div className="text-center mt-10">
              <div className="w-64 h-11 bg-neutral-100 rounded-xl animate-pulse mx-auto" />
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (listings.length === 0) {
    return (
      <section className="relative z-10 -mt-16 sm:-mt-20 pb-16 sm:pb-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-3xl shadow-2xl shadow-neutral-900/10 border border-neutral-100 p-6 sm:p-10 text-center">
            <div className="inline-flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-full px-5 py-2 mb-5">
              <Crown className="w-4 h-4 text-amber-600" />
              <span className="text-amber-700 font-medium text-sm">Premium Inserate</span>
            </div>
            <h2 className="text-2xl font-bold text-neutral-900 mb-3">Derzeit keine Premium-Angebote</h2>
            <p className="text-neutral-500 text-base max-w-lg mx-auto">
              Schau bald wieder vorbei.
            </p>
          </div>
        </div>
      </section>
    );
  }

  const dots = Array.from({ length: pageCount });

  return (
    <section className="relative z-10 -mt-16 sm:-mt-20 pb-16 sm:pb-20">
      {/* Floating card container */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-3xl shadow-2xl shadow-neutral-900/10 border border-neutral-100 p-6 sm:p-10 relative overflow-hidden">
          {/* Subtle decorative elements */}
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-amber-100/30 rounded-full blur-[100px] pointer-events-none" />
          <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-red-100/20 rounded-full blur-[80px] pointer-events-none" />
          
          <div className="relative z-10">
            {/* Section Header */}
            <div className="text-center mb-8 sm:mb-10">
              <div className="inline-flex items-center gap-2 bg-gradient-to-r from-amber-50 to-amber-100/50 border border-amber-200/60 rounded-full px-5 py-2.5 mb-5 shadow-sm">
                <Crown className="w-4 h-4 text-amber-600" />
                <span className="text-amber-700 font-semibold text-sm">Premium Inserate</span>
              </div>
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-neutral-900 mb-3">
                Aktuelle Leasingübernahmen
              </h2>
              <p className="text-neutral-500 text-base max-w-xl mx-auto mb-6">
                Premium-Angebote mit erhöhter Sichtbarkeit.
              </p>
              
              {/* Category Filter Tabs */}
              <div className="flex flex-wrap justify-center gap-2 sm:gap-3">
                {FILTER_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => handleFilterChange(option.value)}
                    className={`px-4 py-2 text-sm font-medium rounded-full transition-all duration-200 ${
                      activeFilter === option.value
                        ? "bg-red-500 text-white shadow-md"
                        : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200 hover:text-neutral-800"
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Carousel */}
            <div className="relative">
              {filteredListings.length > pageSize && (
                <>
                  <Button
                    variant="outline"
                    size="icon"
                    className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-3 sm:-translate-x-5 z-10 bg-white/90 backdrop-blur-sm border-neutral-200 hover:bg-white text-neutral-700 shadow-lg h-10 w-10 rounded-full"
                    onClick={prevSlide}
                    disabled={!canGoPrev}
                    aria-label="Vorherige Premium-Inserate"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-3 sm:translate-x-5 z-10 bg-white/90 backdrop-blur-sm border-neutral-200 hover:bg-white text-neutral-700 shadow-lg h-10 w-10 rounded-full"
                    onClick={nextSlide}
                    disabled={!canGoNext}
                    aria-label="Nächste Premium-Inserate"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </Button>
                </>
              )}

              {/* Empty tab: keep the section frame, explain instead of a blank grid */}
              {filteredListings.length === 0 && (
                <p className="text-center text-neutral-500 py-10">
                  In dieser Kategorie gibt es aktuell keine Premium-Angebote. Schau dir alle Fahrzeuge in der
                  Suche an.
                </p>
              )}

              {/* Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {visibleListings.map((listing) => (
                  <ModernListingCard key={listing.id} listing={listing} />
                ))}
              </div>

              {/* Pagination Dots — gate on the filtered list so an empty or
                  single-page tab shows neither arrows nor a lone dot */}
              {filteredListings.length > pageSize && (
                <div className="flex justify-center mt-8 gap-2">
                  {dots.map((_, i) => (
                    <button
                      key={i}
                      type="button"
                      className={`h-2 rounded-full transition-all duration-300 ${
                        Math.floor(currentIndex / pageSize) === i 
                          ? "bg-red-500 w-6" 
                          : "bg-neutral-300 hover:bg-neutral-400 w-2"
                      }`}
                      onClick={() => setCurrentIndex(i * pageSize)}
                      aria-label={`Premium-Seite ${i + 1}`}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* CTA Button */}
            <div className="text-center mt-10">
              <Button
                asChild
                size="lg"
                className="bg-red-500 hover:bg-red-600 text-white font-semibold shadow-lg hover:shadow-xl transition-all rounded-xl px-8"
              >
                <Link href="/suche?dealType=lease_takeover">Alle Leasingübernahmen ansehen</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}