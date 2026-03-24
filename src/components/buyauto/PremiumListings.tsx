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

type DealTypeLabel = "Direktkauf" | "Leasing" | "Leasingübernahme";

function getDealTypeLabel(listing: Listing): DealTypeLabel {
  if (listing.deal_type === "lease_takeover") return "Leasingübernahme";
  if (listing.financing_type === "leasing") return "Leasing";
  return "Direktkauf";
}

export default function PremiumListings() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const pageSize = 3;

  useEffect(() => {
    let cancelled = false;

    const loadPremiumListings = async () => {
      setIsLoading(true);
      try {
        const [directPurchaseResult, leaseTakeoverResult] = await Promise.all([
          searchListings({ page: 1, premiumOnly: true, dealType: "direct_purchase" }),
          searchListings({ page: 1, premiumOnly: true, dealType: "lease_takeover" }),
        ]);

        if (cancelled) return;

        const ordered = [...directPurchaseResult.items, ...leaseTakeoverResult.items];
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
  }, []);

  const pageCount = useMemo(() => Math.max(1, Math.ceil(listings.length / pageSize)), [listings.length]);
  const maxIndex = useMemo(() => Math.max(0, (pageCount - 1) * pageSize), [pageCount]);

  const visibleListings = useMemo(() => listings.slice(currentIndex, currentIndex + pageSize), [listings, currentIndex]);

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
    return (
      <section className="py-16 sm:py-20 bg-neutral-950">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <div className="w-48 h-8 bg-neutral-800 rounded animate-pulse mx-auto mb-4" />
            <div className="w-80 h-5 bg-neutral-800 rounded animate-pulse mx-auto" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="animate-pulse bg-neutral-900 rounded-2xl overflow-hidden">
                <div className="w-full h-48 bg-neutral-800" />
                <div className="p-5 space-y-3">
                  <div className="w-32 h-4 bg-neutral-800 rounded" />
                  <div className="w-24 h-4 bg-neutral-800 rounded" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (listings.length === 0) {
    return (
      <section className="py-16 sm:py-20 bg-neutral-950">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="inline-flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 rounded-full px-5 py-2 mb-5">
              <Crown className="w-4 h-4 text-amber-400" />
              <span className="text-amber-400 font-medium text-sm">Premium Inserate</span>
            </div>
            <h2 className="text-2xl font-bold text-white mb-3">Derzeit keine Premium-Angebote</h2>
            <p className="text-neutral-400 text-base max-w-lg mx-auto">
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

    if (hasPurchasePrice) {
      return (
        <div className="text-right">
          <div className="text-xs font-medium text-neutral-400">Direktkauf</div>
          <div className="text-xl font-bold tracking-tight text-white">{formatPrice(listing.purchasePriceCHF as number)}</div>

          {hasLeasingMonthly && (
            <div className="mt-1 text-xs text-neutral-500">
              Leasing: <span className="font-medium text-neutral-300">{formatPrice(listing.pricePerMonthCHF)}/Mt.</span>
            </div>
          )}

          {hasTakeoverMonthly && (
            <div className="text-xs text-neutral-500">
              Übernahme: <span className="font-medium text-neutral-300">{formatPrice(takeoverOffer!.price_per_month_chf)}/Mt.</span>
            </div>
          )}
        </div>
      );
    }

    const mainMonthly = listing.pricePerMonthCHF;
    const deposit = typeof listing.depositCHF === "number" && listing.depositCHF > 0 ? listing.depositCHF : null;

    return (
      <div className="text-right">
        <div className="text-xs font-medium text-neutral-400">{getDealTypeLabel(listing)}</div>
        <div className="text-xl font-bold text-amber-400">{formatPrice(mainMonthly)}</div>
        <div className="text-xs text-neutral-500">/ Monat</div>

        {hasTakeoverMonthly && (
          <div className="mt-1 text-xs text-neutral-500">
            Übernahme ab <span className="font-medium text-neutral-300">{formatPrice(takeoverOffer!.price_per_month_chf)}/Mt.</span>
          </div>
        )}

        <div className="text-xs text-neutral-500 mt-0.5">
          {deposit ? `Kaution: ${formatPrice(deposit)}` : "Keine Kaution"}
        </div>
      </div>
    );
  }

  const dots = Array.from({ length: pageCount });

  return (
    <section className="py-16 sm:py-20 bg-neutral-950 relative overflow-hidden">
      {/* Subtle glow effects */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-amber-500/5 rounded-full blur-[100px]" />
      <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-red-500/5 rounded-full blur-[80px]" />
      
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center mb-10 sm:mb-12">
          <div className="inline-flex items-center gap-2 bg-gradient-to-r from-amber-500/20 to-amber-600/10 border border-amber-500/30 rounded-full px-5 py-2 mb-5">
            <Crown className="w-4 h-4 text-amber-400" />
            <span className="text-amber-400 font-semibold text-sm">Premium Inserate</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-white mb-3">Exklusive Premium-Fahrzeuge</h2>
          <p className="text-neutral-400 text-base max-w-xl mx-auto">
            Handverlesene Top-Angebote mit Premium-Sichtbarkeit.
          </p>
        </div>

        <div className="relative">
          {listings.length > pageSize && (
            <>
              <Button
                variant="outline"
                size="icon"
                className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-2 sm:-translate-x-4 z-10 bg-neutral-900/90 backdrop-blur-sm border-neutral-700 hover:bg-neutral-800 text-white shadow-xl"
                onClick={prevSlide}
                disabled={!canGoPrev}
                aria-label="Vorherige Premium-Inserate"
              >
                <ChevronLeft className="w-5 h-5" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-2 sm:translate-x-4 z-10 bg-neutral-900/90 backdrop-blur-sm border-neutral-700 hover:bg-neutral-800 text-white shadow-xl"
                onClick={nextSlide}
                disabled={!canGoNext}
                aria-label="Nächste Premium-Inserate"
              >
                <ChevronRight className="w-5 h-5" />
              </Button>
            </>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
            {visibleListings.map((listing) => {
              const dealTypeLabel = getDealTypeLabel(listing);

              return (
                <Link
                  key={listing.id}
                  href={buildListingHref({ id: listing.id, brand: listing.brand, model: listing.model })}
                >
                  <Card className="group cursor-pointer bg-neutral-900 border-neutral-800 hover:border-amber-500/50 hover:shadow-2xl hover:shadow-amber-500/10 transition-all duration-500 hover:-translate-y-1 overflow-hidden">
                    <CardContent className="p-0 relative">
                      {/* Premium Badge */}
                      <div className="absolute top-3 left-3 z-10">
                        <Badge className="bg-gradient-to-r from-amber-500 to-amber-600 text-white border-0 shadow-lg text-xs">
                          <Crown className="w-3 h-3 mr-1" />
                          Premium
                        </Badge>
                      </div>

                      {/* Deal Type Badge */}
                      <div className="absolute top-3 right-3 z-10">
                        <Badge className="bg-neutral-900/80 text-neutral-200 border border-neutral-700 shadow-sm backdrop-blur-sm text-xs">
                          {dealTypeLabel}
                        </Badge>
                      </div>

                      {/* Image */}
                      <div className="relative w-full h-48 sm:h-52 overflow-hidden">
                        {listing.imageUrl ? (
                          <Image
                            src={listing.imageUrl}
                            alt={`${listing.brand} ${listing.model}`}
                            fill
                            className="object-cover group-hover:scale-105 transition-transform duration-700"
                            sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                            quality={60}
                          />
                        ) : (
                          <div className="w-full h-full bg-neutral-800 flex items-center justify-center">
                            <span className="text-neutral-600 font-medium text-sm">
                              {listing.brand} {listing.model}
                            </span>
                          </div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-neutral-900/60 to-transparent" />
                      </div>

                      {/* Content */}
                      <div className="p-5 bg-neutral-900">
                        <div className="flex justify-between items-start gap-3 mb-3">
                          <div className="min-w-0">
                            <h3 className="font-bold text-base text-white group-hover:text-amber-400 transition-colors truncate">
                              {listing.brand} {listing.model}
                            </h3>
                            <p className="text-neutral-400 text-sm">{listing.year}</p>
                          </div>
                          {renderPriceBlock(listing)}
                        </div>

                        <div className="flex items-center justify-between text-xs text-neutral-500 pt-3 border-t border-neutral-800">
                          <div className="flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5" />
                            <span className="truncate max-w-[80px]">{listing.location}</span>
                          </div>

                          <div className="flex items-center gap-1">
                            <Fuel className="w-3.5 h-3.5" />
                            <span>{listing.fuel}</span>
                          </div>

                          {listing.deal_type === "lease_takeover" && (
                            <div className="flex items-center gap-1">
                              <Clock className="w-3.5 h-3.5" />
                              <span>{listing.remainingMonths}M</span>
                            </div>
                          )}

                          {listing.deal_type === "direct_purchase" && (
                            <div className="flex items-center gap-1">
                              <Calendar className="w-3.5 h-3.5" />
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

          {listings.length > pageSize && (
            <div className="flex justify-center mt-6 gap-2">
              {dots.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  className={`h-1.5 rounded-full transition-all ${
                    Math.floor(currentIndex / pageSize) === i ? "bg-amber-500 w-6" : "bg-neutral-700 hover:bg-neutral-600 w-1.5"
                  }`}
                  onClick={() => setCurrentIndex(i * pageSize)}
                  aria-label={`Premium-Seite ${i + 1}`}
                />
              ))}
            </div>
          )}
        </div>

        <div className="text-center mt-10">
          <Button
            asChild
            size="lg"
            className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-bold shadow-lg hover:shadow-xl transition-all rounded-xl"
          >
            <Link href="/suche?premium=true">Alle Premium-Angebote</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}