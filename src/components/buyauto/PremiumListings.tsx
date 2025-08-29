
"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ArrowRight, Crown } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { searchListings, formatPrice, formatMileage } from "@/lib/buyauto/search";
import { Listing } from "@/lib/buyauto/types";

export default function PremiumListings() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPremiumListings = async () => {
      try {
        setLoading(true);
        // Fetch premium listings using correct query structure
        const result = await searchListings({
          premiumOnly: true,
          page: 1
        });
        // Take only first 6 items for homepage display
        setListings(result.items.slice(0, 6));
      } catch (error) {
        console.error("Error fetching premium listings:", error);
        // Fallback to empty array if search fails
        setListings([]);
      } finally {
        setLoading(false);
      }
    };

    fetchPremiumListings();
  }, []);

  if (loading) {
    return (
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-light text-neutral-900 mb-4 tracking-tight">
              Premium <span className="font-semibold text-red-500">Fahrzeuge</span>
            </h2>
            <p className="text-lg text-neutral-600 max-w-2xl mx-auto font-light leading-relaxed">
              Handverlesene Fahrzeuge mit besonders attraktiven Konditionen
            </p>
          </div>

          {/* Loading skeletons */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
            {Array.from({ length: 6 }).map((_, index) => (
              <Card key={index} className="border-neutral-200/60 shadow-sm hover:shadow-md transition-all duration-300 rounded-3xl overflow-hidden">
                <div className="aspect-[4/3] bg-neutral-100 animate-pulse" />
                <CardContent className="p-6">
                  <div className="h-4 bg-neutral-200 rounded animate-pulse mb-3" />
                  <div className="h-3 bg-neutral-100 rounded animate-pulse mb-4 w-2/3" />
                  <div className="flex justify-between items-end">
                    <div className="h-6 bg-neutral-200 rounded animate-pulse w-20" />
                    <div className="h-8 bg-neutral-100 rounded animate-pulse w-24" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Swiss clean section header */}
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-light text-neutral-900 mb-4 tracking-tight">
            Premium <span className="font-semibold text-red-500">Fahrzeuge</span>
          </h2>
          <p className="text-lg text-neutral-600 max-w-2xl mx-auto font-light leading-relaxed">
            Handverlesene Fahrzeuge mit besonders attraktiven Konditionen
          </p>
        </div>

        {/* Swiss grid layout with premium cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          {listings.map((listing) => (
            <Card 
              key={listing.id} 
              className={`group border-neutral-200/60 shadow-sm hover:shadow-xl transition-all duration-500 rounded-3xl overflow-hidden hover:-translate-y-1 ${
                listing.premium ? 'ring-1 ring-red-100 shadow-lg shadow-red-500/5 hover:shadow-red-500/10' : ''
              }`}
            >
              {/* Image with premium badge overlay */}
              <div className="relative aspect-[4/3] overflow-hidden bg-neutral-100">
                {listing.imageUrl ? (
                  <img 
                    src={listing.imageUrl} 
                    alt={`${listing.brand} ${listing.model}`}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-neutral-200 via-neutral-100 to-neutral-50 flex items-center justify-center">
                    <div className="text-neutral-400 text-lg font-light">
                      {listing.brand} {listing.model}
                    </div>
                  </div>
                )}
                
                {/* Premium badge with subtle glow */}
                {listing.premium && (
                  <div className="absolute top-4 left-4">
                    <Badge className="bg-gradient-to-r from-amber-400 to-amber-500 text-amber-900 border-0 shadow-lg shadow-amber-500/30 font-medium px-3 py-1">
                      <Crown className="h-3 w-3 mr-1" />
                      Premium
                    </Badge>
                  </div>
                )}
              </div>

              <CardContent className="p-6">
                {/* Vehicle title */}
                <h3 className="text-lg font-semibold text-neutral-900 mb-2 group-hover:text-red-600 transition-colors duration-200">
                  {listing.brand} {listing.model} · {listing.year}
                </h3>

                {/* Specification pills */}
                <div className="flex flex-wrap gap-2 mb-4">
                  <span className="px-3 py-1 bg-neutral-100 text-neutral-700 text-xs font-medium rounded-full">
                    {listing.remainingMonths} Mon.
                  </span>
                  <span className="px-3 py-1 bg-neutral-100 text-neutral-700 text-xs font-medium rounded-full">
                    {formatMileage(listing.mileageKm)}
                  </span>
                  <span className="px-3 py-1 bg-neutral-100 text-neutral-700 text-xs font-medium rounded-full">
                    {listing.fuel}
                  </span>
                  <span className="px-3 py-1 bg-neutral-100 text-neutral-700 text-xs font-medium rounded-full">
                    {listing.gearbox}
                  </span>
                  <span className="px-3 py-1 bg-neutral-100 text-neutral-700 text-xs font-medium rounded-full">
                    {listing.cantonCode}
                  </span>
                </div>

                {/* Price and CTA */}
                <div className="flex justify-between items-end">
                  <div>
                    <p className="text-2xl font-bold text-red-500 mb-1">
                      {formatPrice(listing.pricePerMonthCHF)} / Monat
                    </p>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="bg-transparent hover:bg-transparent border-neutral-300 text-neutral-700 hover:border-red-500 hover:text-red-500 transition-all duration-200 font-medium"
                  >
                    Details ansehen
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* View all button - Swiss minimal style */}
        <div className="text-center">
          <Link href="/suche">
            <Button 
              size="lg" 
              variant="outline" 
              className="bg-transparent border-neutral-300 text-neutral-700 hover:bg-neutral-50 hover:border-red-500 hover:text-red-500 px-8 font-medium transition-all duration-200 rounded-2xl"
            >
              Alle Fahrzeuge ansehen
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}
