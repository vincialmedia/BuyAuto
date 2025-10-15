"use client";

import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, Crown, MapPin, Calendar, Fuel } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import Image from "next/image";
import { searchListings } from "@/services/listingsService";
import { Listing } from "@/lib/buyauto/types";

export default function PremiumListings() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    setPrefersReducedMotion(mediaQuery.matches);
    
    const handleChange = () => setPrefersReducedMotion(mediaQuery.matches);
    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  useEffect(() => {
    const loadPremiumListings = async () => {
      try {
        const result = await searchListings({ 
          page: 1, 
          premiumOnly: true 
        });
        setListings(result.items);
      } catch (error) {
        console.error("Error loading premium listings:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadPremiumListings();
  }, []);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('de-CH', {
      style: 'currency',
      currency: 'CHF',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(price).replace('CHF', 'CHF');
  };

  const nextSlide = () => {
    setCurrentIndex((prev) => (prev + 1) % Math.max(1, listings.length - 2));
  };

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev - 1 + Math.max(1, listings.length - 2)) % Math.max(1, listings.length - 2));
  };

  const transitionClass = prefersReducedMotion ? "" : "transition-all duration-500";
  const hoverTransformClass = prefersReducedMotion ? "" : "hover:-translate-y-2";
  const scaleClass = prefersReducedMotion ? "" : "group-hover:scale-110 transition-transform duration-700";

  if (isLoading) {
    return (
      <section className="py-20 bg-gradient-to-br from-neutral-50 to-white" aria-label="Premium-Angebote werden geladen">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <div className="w-48 h-8 bg-neutral-200 rounded animate-pulse mx-auto mb-4"></div>
            <div className="w-96 h-6 bg-neutral-200 rounded animate-pulse mx-auto"></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(3)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-0">
                  <div className="w-full h-48 bg-neutral-200 rounded-t-lg"></div>
                  <div className="p-4 space-y-3">
                    <div className="w-32 h-4 bg-neutral-200 rounded"></div>
                    <div className="w-24 h-4 bg-neutral-200 rounded"></div>
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
      <section className="py-20 bg-gradient-to-br from-neutral-50 to-white" aria-labelledby="no-premium-heading">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="inline-flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-full px-6 py-2 mb-6">
              <Crown className="w-5 h-5 text-amber-600" aria-hidden="true" />
              <span className="text-amber-700 font-medium">Premium Inserate</span>
            </div>
            <h2 id="no-premium-heading" className="text-3xl font-bold text-neutral-900 mb-4">
              Derzeit keine Premium-Angebote verfügbar
            </h2>
            <p className="text-neutral-600 text-lg leading-relaxed max-w-2xl mx-auto">
              Schauen Sie bald wieder vorbei für exklusive Premium-Fahrzeuge.
            </p>
          </div>
        </div>
      </section>
    );
  }

  const visibleListings = listings.slice(currentIndex, currentIndex + 3);

  return (
    <section className="py-20 bg-gradient-to-br from-neutral-50 to-white" aria-labelledby="premium-listings-heading">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-full px-6 py-2 mb-6">
            <Crown className="w-5 h-5 text-amber-600" aria-hidden="true" />
            <span className="text-amber-700 font-medium">Premium Inserate</span>
          </div>
          <h2 id="premium-listings-heading" className="text-3xl font-bold text-neutral-900 mb-4">
            Exklusive Premium-Fahrzeuge
          </h2>
          <p className="text-neutral-600 text-lg leading-relaxed max-w-2xl mx-auto">
            Entdecken Sie unsere handverlesenen Premium-Angebote mit besonderen Vorteilen und erstklassigem Service.
          </p>
        </div>

        <div className="relative">
          {/* Navigation Arrows */}
          {listings.length > 3 && (
            <>
              <Button
                variant="outline"
                size="icon"
                className={`absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 z-10 bg-white/90 backdrop-blur-sm border-neutral-200 hover:bg-white shadow-lg ${transitionClass}`}
                onClick={prevSlide}
                disabled={currentIndex === 0}
                aria-label="Vorherige Premium-Angebote anzeigen"
              >
                <ChevronLeft className="w-5 h-5" aria-hidden="true" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className={`absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 z-10 bg-white/90 backdrop-blur-sm border-neutral-200 hover:bg-white shadow-lg ${transitionClass}`}
                onClick={nextSlide}
                disabled={currentIndex >= listings.length - 3}
                aria-label="Nächste Premium-Angebote anzeigen"
              >
                <ChevronRight className="w-5 h-5" aria-hidden="true" />
              </Button>
            </>
          )}

          {/* Listings Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" role="list" aria-label="Premium-Fahrzeuge">
            {visibleListings.map((listing, index) => (
              <Link key={listing.id} href={`/fahrzeug/${listing.id}`} role="listitem">
                <Card className={`group cursor-pointer border-amber-200/60 bg-gradient-to-br from-white to-amber-50/30 hover:shadow-xl hover:shadow-amber-500/10 ${transitionClass} ${hoverTransformClass} ring-2 ring-amber-200/20`}>
                  <CardContent className="p-0 relative overflow-hidden">
                    {/* Premium Badge */}
                    <div className="absolute top-3 left-3 z-10">
                      <Badge className="bg-gradient-to-r from-amber-500 to-amber-600 text-white border-0 shadow-lg">
                        <Crown className="w-3 h-3 mr-1" aria-hidden="true" />
                        Premium
                      </Badge>
                    </div>
                    
                    {/* Image with lazy loading and proper sizing */}
                    <div className="relative w-full h-56 overflow-hidden rounded-t-lg">
                      {listing.imageUrl ? (
                        <Image
                          src={listing.imageUrl}
                          alt={`${listing.brand} ${listing.model} - Premium Leasingübernahme`}
                          fill
                          className={`object-cover ${scaleClass}`}
                          sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                          loading={index === 0 ? "eager" : "lazy"}
                          priority={index === 0}
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-neutral-200 to-neutral-300 flex items-center justify-center">
                          <span className="text-neutral-400 font-medium">
                            {listing.brand} {listing.model}
                          </span>
                        </div>
                      )}
                      <div className={`absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 ${prefersReducedMotion ? "" : "transition-opacity duration-300"}`} />
                    </div>
                    
                    {/* Content */}
                    <div className="p-6 bg-gradient-to-br from-white to-amber-50/20">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h3 className={`font-bold text-lg text-neutral-900 group-hover:text-amber-700 ${prefersReducedMotion ? "" : "transition-colors"}`}>
                            {listing.brand} {listing.model}
                          </h3>
                          <p className="text-neutral-600 font-medium">{listing.year}</p>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold text-amber-600">
                            {formatPrice(listing.pricePerMonthCHF)}
                          </div>
                          <div className="text-sm text-neutral-500">/ Monat</div>
                          <div className="text-xs text-neutral-500 mt-1">
                            {(listing.depositCHF && listing.depositCHF > 0)
                              ? `Einmalige Kaution: ${formatPrice(listing.depositCHF)}`
                              : "Keine Kaution"}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between text-sm text-neutral-600 mb-4">
                        <div className="flex items-center gap-1">
                          <MapPin className="w-4 h-4" aria-hidden="true" />
                          <span>{listing.location}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" aria-hidden="true" />
                          <span>{listing.remainingMonths}M</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Fuel className="w-4 h-4" aria-hidden="true" />
                          <span>{listing.fuel}</span>
                        </div>
                      </div>
                      
                      <div className="pt-3 border-t border-amber-200/50">
                        <div className="flex items-center justify-between">
                          <div className="text-xs text-neutral-500">
                            {(listing.mileageKm || 0).toLocaleString('de-CH')} km
                          </div>
                          <div className="text-xs font-medium text-amber-700 bg-amber-100 px-2 py-1 rounded-full">
                            Premium Vorteile
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>

          {/* Dots Indicator */}
          {listings.length > 3 && (
            <div className="flex justify-center mt-8 gap-2" role="group" aria-label="Seitennavigation">
              {Array.from({ length: Math.ceil(listings.length / 3) }).map((_, i) => (
                <button
                  key={i}
                  className={`w-2 h-2 rounded-full ${prefersReducedMotion ? "" : "transition-all"} ${
                    Math.floor(currentIndex / 3) === i 
                      ? 'bg-amber-500 w-6' 
                      : 'bg-neutral-300 hover:bg-neutral-400'
                  }`}
                  onClick={() => setCurrentIndex(i * 3)}
                  aria-label={`Seite ${i + 1} anzeigen`}
                  aria-current={Math.floor(currentIndex / 3) === i ? "true" : "false"}
                />
              ))}
            </div>
          )}
        </div>

        <div className="text-center mt-12">
          <Button
            asChild
            size="lg"
            className={`bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white shadow-lg hover:shadow-xl ${transitionClass}`}
          >
            <Link href="/suche?premium=true">
              Alle Premium-Angebote ansehen
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
