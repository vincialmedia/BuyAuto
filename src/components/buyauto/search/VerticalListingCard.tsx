import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Listing } from "@/lib/buyauto/types";
import { Star, MapPin, Gauge, Fuel, Settings, Calendar } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/router";

interface VerticalListingCardProps {
  listing: Listing;
  onDetailsClick?: (listingId: string) => void;
}

export default function VerticalListingCard({ listing, onDetailsClick }: VerticalListingCardProps) {
  const router = useRouter();

  const handleDetailsClick = () => {
    if (onDetailsClick) {
      onDetailsClick(listing.id);
    } else {
      // Navigate to detail page
      router.push(`/fahrzeug/${listing.id}`);
    }
  };

  // Format the location to show just canton
  const formatLocation = (location: string) => {
    if (location.includes(',')) {
      return location.split(',').pop()?.trim() || location;
    }
    return location;
  };

  return (
    <div className="group bg-white border border-neutral-200/60 rounded-2xl overflow-hidden shadow-sm hover:shadow-xl hover:shadow-neutral-900/10 transition-all duration-300 hover:-translate-y-1 hover:bg-neutral-50/30">
      <div className="flex">
        {/* Image Section */}
        <div className="relative w-64 h-40 flex-shrink-0 overflow-hidden">
          <Image
            src={listing.imageUrl}
            alt={`${listing.brand} ${listing.model}`}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
            sizes="(max-width: 768px) 100vw, 256px"
            quality={75}
          />
          {listing.premium && (
            <div className="absolute top-3 left-3">
              <Badge className="bg-gradient-to-r from-amber-400 to-amber-500 text-amber-900 border-0 shadow-sm text-xs font-semibold">
                <Star className="h-3 w-3 mr-1 fill-current" />
                Premium
              </Badge>
            </div>
          )}
        </div>

        {/* Content Section */}
        <div className="flex-1 p-6">
          <div className="flex items-start justify-between">
            {/* Left Content */}
            <div className="flex-1">
              {/* Title */}
              <h3 className="text-lg font-semibold text-neutral-900 group-hover:text-red-600 transition-colors duration-200">
                {listing.brand} {listing.model} · {listing.year}
              </h3>

              {/* Subtitle Pills */}
              <div className="mt-3 flex flex-wrap gap-2">
                <div className="inline-flex items-center px-2 py-1 bg-neutral-100 text-neutral-700 rounded-full text-xs font-medium">
                  <Calendar className="h-3 w-3 mr-1" />
                  Restlaufzeit {listing.remainingMonths} Mon.
                </div>
                <div className="inline-flex items-center px-2 py-1 bg-neutral-100 text-neutral-700 rounded-full text-xs font-medium">
                  <Gauge className="h-3 w-3 mr-1" />
                  {listing.mileageKm.toLocaleString()} km
                </div>
                <div className="inline-flex items-center px-2 py-1 bg-neutral-100 text-neutral-700 rounded-full text-xs font-medium">
                  <Fuel className="h-3 w-3 mr-1" />
                  {listing.fuel}
                </div>
                <div className="inline-flex items-center px-2 py-1 bg-neutral-100 text-neutral-700 rounded-full text-xs font-medium">
                  <Settings className="h-3 w-3 mr-1" />
                  {listing.gearbox}
                </div>
                <div className="inline-flex items-center px-2 py-1 bg-neutral-100 text-neutral-700 rounded-full text-xs font-medium">
                  <MapPin className="h-3 w-3 mr-1" />
                  {formatLocation(listing.location)}
                </div>
              </div>
            </div>

            {/* Right Content - Price & CTA */}
            <div className="flex flex-col items-end space-y-4 ml-6">
              {/* Price */}
              <div className="text-right">
                <div className="text-2xl font-bold text-red-600">
                  CHF {listing.pricePerMonthCHF.toLocaleString()}
                </div>
                <div className="text-sm text-neutral-500 font-medium">
                  / Monat
                </div>
                {listing.depositCHF > 0 ? (
                  <p className="text-xs text-neutral-500 mt-1">
                    Einmalige Kaution CHF {listing.depositCHF.toLocaleString()}
                  </p>
                ) : (
                  <p className="text-xs text-neutral-500 mt-1">Keine Kaution</p>
                )}
              </div>

              {/* CTA Button */}
              <Button
                onClick={handleDetailsClick}
                variant="outline"
                className="bg-transparent hover:bg-transparent border-neutral-300 text-neutral-700 hover:border-red-500 hover:text-red-500 text-sm font-medium h-9 px-4 group-hover:border-red-500 group-hover:text-red-500 transition-all duration-200"
              >
                Details ansehen
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Premium glow effect */}
      {listing.premium && (
        <div className="absolute inset-0 rounded-2xl ring-1 ring-amber-200/50 ring-inset pointer-events-none" />
      )}
    </div>
  );
}
