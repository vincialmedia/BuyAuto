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
      <section className="py-20 bg-gradient-to-br from-neutral-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <div className="w-48 h-8 bg-neutral-200 rounded animate-pulse mx-auto mb-4" />
            <div className="w-96 h-6 bg-neutral-200 rounded animate-pulse mx-auto" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(3)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-0">
                  <div className="w-full h-48 bg-neutral-200 rounded-t-lg" />
                  <div className="p-4 space-y-3">
                    <div className="w-32 h-4 bg-neutral-200 rounded" />
                    <div className="w-24 h-4 bg-neutral-200 rounded" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (listings.length === 0) {
    return (
      <section className="py-20 bg-gradient-to-br from-neutral-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="inline-flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-full px-6 py-2 mb-6">
              <Crown className="w-5 h-5 text-amber-600" />
              <span className="text-amber-700 font-medium">Premium Inserate</span>
            </div>
            <h2 className="text-3xl font-bold text-neutral-900 mb-4">Derzeit keine Premium-Angebote verfügbar</h2>
            <p className="text-neutral-600 text-lg leading-relaxed max-w-2xl mx-auto">
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
          <div className="text-xs font-medium text-neutral-500">Direktkauf</div>
          <div className="text-2xl font-bold tracking-tight text-neutral-900">{formatPrice(listing.purchasePriceCHF as number)}</div>

          {hasLeasingMonthly && (
            <div className="mt-1 text-sm text-neutral-600">
              Leasing:{" "}
              <span className="font-semibold text-neutral-800">{formatPrice(listing.pricePerMonthCHF)}</span>
              <span className="text-neutral-500"> / Monat</span>
            </div>
          )}

          {hasTakeoverMonthly && (
            <div className="text-xs text-neutral-500">
              Leasingübernahme:{" "}
              <span className="font-medium text-neutral-700">{formatPrice(takeoverOffer!.price_per_month_chf)}</span>
              <span className="text-neutral-500"> / Monat</span>
            </div>
          )}
        </div>
      );
    }

    const mainMonthly = listing.pricePerMonthCHF;
    const deposit = typeof listing.depositCHF === "number" && listing.depositCHF > 0 ? listing.depositCHF : null;

    return (
      <div className="text-right">
        <div className="text-xs font-medium text-neutral-500">{getDealTypeLabel(listing)}</div>

        <div className="text-2xl font-bold text-amber-600">{formatPrice(mainMonthly)}</div>
        <div className="text-sm text-neutral-500">/ Monat</div>

        {hasTakeoverMonthly && (
          <div className="mt-1 text-xs text-neutral-500">
            <span className="text-neutral-500">Übernahme ab </span>
            <span className="font-medium text-neutral-700">{formatPrice(takeoverOffer!.price_per_month_chf)}</span>
            <span className="text-neutral-500"> / Monat</span>
          </div>
        )}

        <div className="text-xs text-neutral-500 mt-1">
          {deposit ? `Einmalige Kaution: ${formatPrice(deposit)}` : "Keine Kaution"}
        </div>
      </div>
    );
  }

  const dots = Array.from({ length: pageCount });

  return (
    <section className="py-20 bg-gradient-to-br from-neutral-50 to-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-full px-6 py-2 mb-6">
            <Crown className="w-5 h-5 text-amber-600" />
            <span className="text-amber-700 font-medium">Premium Inserate</span>
          </div>
          <h2 className="text-3xl font-bold text-neutral-900 mb-4">Exklusive Premium-Fahrzeuge</h2>
          <p className="text-neutral-600 text-lg leading-relaxed max-w-2xl mx-auto">
            Direktkauf steht im Fokus – mit optionalen Leasing- und Übernahme-Konditionen, wenn verfügbar.
          </p>
        </div>

        <div className="relative">
          {listings.length > pageSize && (
            <>
              <Button
                variant="outline"
                size="icon"
                className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 z-10 bg-white/90 backdrop-blur-sm border-neutral-200 hover:bg-white shadow-lg"
                onClick={prevSlide}
                disabled={!canGoPrev}
                aria-label="Vorherige Premium-Inserate"
              >
                <ChevronLeft className="w-5 h-5" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 z-10 bg-white/90 backdrop-blur-sm border-neutral-200 hover:bg-white shadow-lg"
                onClick={nextSlide}
                disabled={!canGoNext}
                aria-label="Nächste Premium-Inserate"
              >
                <ChevronRight className="w-5 h-5" />
              </Button>
            </>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {visibleListings.map((listing) => {
              const dealTypeLabel = getDealTypeLabel(listing);

              return (
                <Link
                  key={listing.id}
                  href={buildListingHref({ id: listing.id, brand: listing.brand, model: listing.model })}
                >
                  <Card className="group cursor-pointer border-amber-200/60 bg-gradient-to-br from-white to-amber-50/30 hover:shadow-xl hover:shadow-amber-500/10 transition-all duration-500 hover:-translate-y-2 ring-2 ring-amber-200/20">
                    <CardContent className="p-0 relative overflow-hidden">
                      <div className="absolute top-3 left-3 z-10">
                        <Badge className="bg-gradient-to-r from-amber-500 to-amber-600 text-white border-0 shadow-lg">
                          <Crown className="w-3 h-3 mr-1" />
                          Premium
                        </Badge>
                      </div>

                      <div className="absolute top-3 right-3 z-10">
                        <Badge className="bg-white/90 text-neutral-900 border border-white/60 shadow-sm backdrop-blur-sm">
                          {dealTypeLabel}
                        </Badge>
                      </div>

                      <div className="relative w-full h-56 overflow-hidden rounded-t-lg">
                        {listing.imageUrl ? (
                          <Image
                            src={listing.imageUrl}
                            alt={`${listing.brand} ${listing.model}`}
                            fill
                            className="object-cover group-hover:scale-110 transition-transform duration-700"
                            sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                            quality={60}
                          />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-neutral-200 to-neutral-300 flex items-center justify-center">
                            <span className="text-neutral-500 font-medium">
                              {listing.brand} {listing.model}
                            </span>
                          </div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                      </div>

                      <div className="p-6 bg-gradient-to-br from-white to-amber-50/20">
                        <div className="flex justify-between items-start gap-4 mb-3">
                          <div className="min-w-0">
                            <h3 className="font-bold text-lg text-neutral-900 group-hover:text-amber-700 transition-colors truncate">
                              {listing.brand} {listing.model}
                            </h3>
                            <p className="text-neutral-600 font-medium">{listing.year}</p>
                          </div>

                          {renderPriceBlock(listing)}
                        </div>

                        <div className="flex items-center justify-between text-sm text-neutral-600 mb-4">
                          <div className="flex items-center gap-1 min-w-0">
                            <MapPin className="w-4 h-4 shrink-0" />
                            <span className="truncate">{listing.location}</span>
                          </div>

                          <div className="flex items-center gap-1">
                            <Fuel className="w-4 h-4" />
                            <span>{listing.fuel}</span>
                          </div>

                          {listing.deal_type === "lease_takeover" && (
                            <div className="flex items-center gap-1">
                              <Clock className="w-4 h-4" />
                              <span>{listing.remainingMonths}M</span>
                            </div>
                          )}

                          {listing.deal_type === "direct_purchase" && (
                            <div className="flex items-center gap-1">
                              <Calendar className="w-4 h-4" />
                              <span>{listing.year}</span>
                            </div>
                          )}
                        </div>

                        <div className="pt-3 border-t border-amber-200/50">
                          <div className="flex items-center justify-between">
                            <div className="text-xs text-neutral-500">{(listing.mileageKm || 0).toLocaleString("de-CH")} km</div>
                            <div className="text-xs font-medium text-amber-700 bg-amber-100 px-2 py-1 rounded-full">
                              Premium Vorteile
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>

          {listings.length > pageSize && (
            <div className="flex justify-center mt-8 gap-2">
              {dots.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  className={`h-2 rounded-full transition-all ${
                    Math.floor(currentIndex / pageSize) === i ? "bg-amber-500 w-6" : "bg-neutral-300 hover:bg-neutral-400 w-2"
                  }`}
                  onClick={() => setCurrentIndex(i * pageSize)}
                  aria-label={`Premium-Seite ${i + 1}`}
                />
              ))}
            </div>
          )}
        </div>

        <div className="text-center mt-12">
          <Button
            asChild
            size="lg"
            className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white shadow-lg hover:shadow-xl transition-all"
          >
            <Link href="/suche?premium=true">Alle Premium-Angebote ansehen</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}