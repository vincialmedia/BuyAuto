"use client";

import { useEffect, useMemo, useState } from "react";
import { Calendar, ChevronLeft, ChevronRight, Clock, Crown, Fuel, MapPin } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { Listing } from "@/lib/buyauto/types";
import { searchListings } from "@/services/listingsService";
import { buildListingHref } from "@/lib/buyauto/listingUrl";
import { getImageVariant } from "@/lib/buyauto/imageVariant";

type DealTypeLabel = "Direktkauf" | "Leasing" | "Leasingübernahme";
type FilterCategory = "all" | "direct_purchase" | "leasing" | "lease_takeover";

const FILTER_OPTIONS: { label: DealTypeLabel | "Alle"; value: FilterCategory }[] = [
  { label: "Alle", value: "all" },
  { label: "Direktkauf", value: "direct_purchase" },
  { label: "Leasing", value: "leasing" },
  { label: "Leasingübernahme", value: "lease_takeover" },
];

function getDealTypeLabel(listing: Listing): DealTypeLabel {
  // A Direktkauf with an enabled Übernahme-Angebot presents as Leasingübernahme —
  // same precedence as the search cards (ModernListingCard).
  if (listing.deal_type === "lease_takeover" || listing.leasing_offer?.lease_takeover_offer?.enabled === true) {
    return "Leasingübernahme";
  }
  if (listing.financing_type === "leasing") return "Leasing";
  return "Direktkauf";
}

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
        const [leaseTakeoverResult, directPurchaseResult] = await Promise.all([
          searchListings({ page: 1, premiumOnly: true, dealType: "lease_takeover" }),
          searchListings({ page: 1, premiumOnly: true, dealType: "direct_purchase" }),
        ]);

        if (cancelled) return;

        const ordered = [...leaseTakeoverResult.items, ...directPurchaseResult.items];
        const uniqueById = new Map<string, Listing>();
        for (const l of ordered) uniqueById.set(l.id, l);

        setListings(Array.from(uniqueById.values()));
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
    return listings.filter((listing) => {
      // Check if this listing has lease takeover offer enabled
      const hasLeaseTakeoverOffer = listing.leasing_offer?.lease_takeover_offer?.enabled === true;
      // Check if this listing has leasing offer enabled
      const hasLeasingOffer = listing.leasing_offer?.enabled === true || listing.financing_type === "leasing";

      if (activeFilter === "direct_purchase") {
        // A Direktkauf with enabled Übernahme-Angebot presents as
        // «Leasingübernahme» (getDealTypeLabel), so it belongs under that tab —
        // showing it here put Leasingübernahme-badged cards under Direktkauf.
        return listing.deal_type === "direct_purchase" && !hasLeaseTakeoverOffer;
      }
      if (activeFilter === "leasing") {
        // Show if it has leasing financing available (but not pure lease takeovers)
        return hasLeasingOffer && listing.deal_type !== "lease_takeover";
      }
      if (activeFilter === "lease_takeover") {
        // Show if deal_type is lease_takeover OR if it has a lease takeover offer enabled
        return listing.deal_type === "lease_takeover" || hasLeaseTakeoverOffer;
      }
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

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("de-CH", {
      style: "currency",
      currency: "CHF",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

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
              Schauen Sie bald wieder vorbei für exklusive Premium-Fahrzeuge.
            </p>
          </div>
        </div>
      </section>
    );
  }

  function renderPriceBlock(listing: Listing) {
    const takeoverOffer = listing.leasing_offer?.lease_takeover_offer?.enabled
      ? listing.leasing_offer.lease_takeover_offer
      : null;

    const hasPurchasePrice = typeof listing.purchasePriceCHF === "number" && listing.purchasePriceCHF > 0;
    const hasLeasingMonthly = typeof listing.pricePerMonthCHF === "number" && listing.pricePerMonthCHF > 0;
    const hasTakeoverMonthly = typeof takeoverOffer?.price_per_month_chf === "number" && takeoverOffer.price_per_month_chf > 0;

    // An enabled Übernahme-Angebot leads with the monthly rate — the Kaufpreis
    // becomes the secondary line (same rule as the search cards).
    if (hasTakeoverMonthly) {
      return (
        <div className="text-right">
          <div className="text-xs font-medium text-neutral-400 uppercase tracking-wide">Leasingübernahme</div>
          <div className="text-xl font-bold text-red-600">{formatPrice(takeoverOffer!.price_per_month_chf)}</div>
          <div className="text-xs text-neutral-500">/ Monat</div>

          {hasPurchasePrice && (
            <div className="mt-1 text-xs text-neutral-500">
              Kaufpreis: <span className="font-semibold text-neutral-700">{formatPrice(listing.purchasePriceCHF as number)}</span>
            </div>
          )}
        </div>
      );
    }

    if (hasPurchasePrice) {
      return (
        <div className="text-right">
          <div className="text-xs font-medium text-neutral-400 uppercase tracking-wide">Kaufpreis</div>
          <div className="text-xl font-bold tracking-tight text-neutral-900">{formatPrice(listing.purchasePriceCHF as number)}</div>

          {hasLeasingMonthly && (
            <div className="mt-1 text-xs text-neutral-500">
              Leasing: <span className="font-semibold text-neutral-700">{formatPrice(listing.pricePerMonthCHF)}/Mt.</span>
            </div>
          )}
        </div>
      );
    }

    const mainMonthly = listing.pricePerMonthCHF;
    const deposit = typeof listing.depositCHF === "number" && listing.depositCHF > 0 ? listing.depositCHF : null;

    return (
      <div className="text-right">
        <div className="text-xs font-medium text-neutral-400 uppercase tracking-wide">{getDealTypeLabel(listing)}</div>
        <div className="text-xl font-bold text-red-600">{formatPrice(mainMonthly)}</div>
        <div className="text-xs text-neutral-500">/ Monat</div>

        <div className="text-xs text-neutral-500 mt-0.5">
          {deposit ? `Kaution: ${formatPrice(deposit)}` : "Keine Kaution"}
        </div>
      </div>
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
              {listings.length > pageSize && (
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

              {/* Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {visibleListings.map((listing) => {
                  const dealTypeLabel = getDealTypeLabel(listing);

                  return (
                    <Link
                      key={listing.id}
                      href={buildListingHref({ id: listing.id, brand: listing.brand, model: listing.model })}
                    >
                      <Card className="group cursor-pointer bg-white border-neutral-200 hover:border-amber-300 shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1 overflow-hidden rounded-2xl">
                        <CardContent className="p-0 relative">
                          {/* Premium Badge */}
                          <div className="absolute top-3 left-3 z-10">
                            <Badge className="bg-gradient-to-r from-amber-500 to-amber-600 text-white border-0 shadow-md text-xs font-semibold">
                              <Crown className="w-3 h-3 mr-1" />
                              Premium
                            </Badge>
                          </div>

                          {/* Deal Type Badge */}
                          <div className="absolute top-3 right-3 z-10">
                            <Badge variant="secondary" className="bg-white/90 text-neutral-700 border border-neutral-200 shadow-sm backdrop-blur-sm text-xs">
                              {dealTypeLabel}
                            </Badge>
                          </div>

                          {/* Image */}
                          <div className="relative w-full h-48 sm:h-52 overflow-hidden bg-neutral-100">
                            {listing.imageUrl ? (
                              <Image
                                src={getImageVariant(listing.imageUrl, "medium")}
                                alt={`${listing.brand} ${listing.model}`}
                                fill
                                className="object-cover group-hover:scale-105 transition-transform duration-500"
                                sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                                quality={75}
                              />
                            ) : (
                              <div className="w-full h-full bg-neutral-100 flex items-center justify-center">
                                <span className="text-neutral-400 font-medium text-sm">
                                  {listing.brand} {listing.model}
                                </span>
                              </div>
                            )}
                            {/* Subtle gradient overlay */}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent" />
                          </div>

                          {/* Content */}
                          <div className="p-5">
                            <div className="flex justify-between items-start gap-3 mb-4">
                              <div className="min-w-0">
                                <h3 className="font-bold text-base text-neutral-900 group-hover:text-red-600 transition-colors truncate">
                                  {listing.brand} {listing.model}
                                </h3>
                                <p className="text-neutral-500 text-sm">{listing.year}</p>
                              </div>
                              {renderPriceBlock(listing)}
                            </div>

                            {/* Meta info */}
                            <div className="flex items-center justify-between text-xs text-neutral-500 pt-3 border-t border-neutral-100">
                              <div className="flex items-center gap-1.5">
                                <MapPin className="w-3.5 h-3.5 text-neutral-400" />
                                <span className="truncate max-w-[80px]">{listing.location}</span>
                              </div>

                              <div className="flex items-center gap-1.5">
                                <Fuel className="w-3.5 h-3.5 text-neutral-400" />
                                <span>{listing.fuel}</span>
                              </div>

                              {listing.deal_type === "lease_takeover" && (
                                <div className="flex items-center gap-1.5">
                                  <Clock className="w-3.5 h-3.5 text-neutral-400" />
                                  <span>{listing.remainingMonths} Mt.</span>
                                </div>
                              )}

                              {listing.deal_type === "direct_purchase" && (
                                <div className="flex items-center gap-1.5">
                                  <Calendar className="w-3.5 h-3.5 text-neutral-400" />
                                  <span>{(listing.mileageKm || 0).toLocaleString("de-CH")} km</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  );
                })}
              </div>

              {/* Pagination Dots */}
              {listings.length > pageSize && (
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