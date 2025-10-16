
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Listing } from "@/lib/buyauto/types";
import { Star, MapPin, Gauge, Fuel, Settings, Calendar } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/router";
import { useState } from "react";

interface ModernListingCardProps {
  listing: Listing;
  onDetailsClick?: (listingId: string) => void;
}

export function ModernListingCard({ listing, onDetailsClick }: ModernListingCardProps) {
  const router = useRouter();
  const [imageError, setImageError] = useState(false);

  const handleDetailsClick = () => {
    if (onDetailsClick) {
      onDetailsClick(listing.id);
    } else {
      router.push(`/fahrzeug/${listing.id}`);
    }
  };

  const formatLocation = (location: string) => {
    if (location.includes(",")) {
      return location.split(",").pop()?.trim() || location;
    }
    return location;
  };

  return (
    <article
      className={`group relative bg-white rounded-2xl overflow-hidden transition-all duration-300 hover:-translate-y-1 cursor-pointer ${
        listing.premium
          ? "border-2 border-amber-200/60 shadow-lg shadow-amber-500/10 hover:shadow-2xl hover:shadow-amber-500/20"
          : "border border-neutral-200/60 shadow-sm hover:shadow-xl hover:shadow-neutral-900/10"
      }`}
      onClick={handleDetailsClick}
    >
      {/* Image Section */}
      <div className="relative w-full aspect-[16/10] overflow-hidden bg-neutral-100">
        <Image
          src={listing.imageUrl}
          alt={`${listing.brand} ${listing.model}`}
          fill
          className="object-cover group-hover:scale-105 transition-transform duration-500"
          onError={() => setImageError(true)}
        />
        
        {/* Premium Badge */}
        {listing.premium && (
          <div className="absolute top-4 left-4 z-10">
            <Badge className="bg-gradient-to-br from-amber-400 via-amber-500 to-amber-600 text-white border-0 shadow-lg shadow-amber-500/50 text-xs font-bold px-3 py-1.5">
              <Star className="h-3.5 w-3.5 mr-1.5 fill-current" />
              Premium
            </Badge>
          </div>
        )}

        {/* Gradient Overlay for better text readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      </div>

      {/* Content Section */}
      <div className="p-5">
        {/* Title */}
        <h3 className="text-lg font-bold text-neutral-900 group-hover:text-red-600 transition-colors duration-200 mb-3 line-clamp-1">
          {listing.brand} {listing.model}
        </h3>

        {/* Year Pill */}
        <div className="inline-flex items-center px-2.5 py-1 bg-neutral-100 text-neutral-700 rounded-full text-xs font-semibold mb-4">
          {listing.year}
        </div>

        {/* Specs Grid */}
        <div className="grid grid-cols-2 gap-2.5 mb-4">
          <div className="flex items-center text-xs text-neutral-600">
            <Gauge className="h-3.5 w-3.5 mr-1.5 text-neutral-400" />
            <span className="font-medium">{listing.mileageKm.toLocaleString()} km</span>
          </div>
          <div className="flex items-center text-xs text-neutral-600">
            <Fuel className="h-3.5 w-3.5 mr-1.5 text-neutral-400" />
            <span className="font-medium">{listing.fuel}</span>
          </div>
          <div className="flex items-center text-xs text-neutral-600">
            <Settings className="h-3.5 w-3.5 mr-1.5 text-neutral-400" />
            <span className="font-medium">{listing.gearbox}</span>
          </div>
          <div className="flex items-center text-xs text-neutral-600">
            <MapPin className="h-3.5 w-3.5 mr-1.5 text-neutral-400" />
            <span className="font-medium">{formatLocation(listing.location)}</span>
          </div>
        </div>

        {/* Leasing Term */}
        <div className="flex items-center px-3 py-2 bg-blue-50 border border-blue-100 rounded-xl text-xs text-blue-700 font-medium mb-4">
          <Calendar className="h-3.5 w-3.5 mr-1.5" />
          Restlaufzeit: {listing.remainingMonths} Monate
        </div>

        {/* Divider */}
        <div className="h-px bg-neutral-200 mb-4" />

        {/* Price & CTA */}
        <div className="flex items-center justify-between">
          {/* Price */}
          <div>
            <div className="text-2xl font-bold text-red-600">
              CHF {listing.pricePerMonthCHF.toLocaleString()}
            </div>
            <div className="text-xs text-neutral-500 font-medium">pro Monat</div>
            {listing.depositCHF > 0 && (
              <div className="text-xs text-neutral-400 mt-0.5">
                + CHF {listing.depositCHF.toLocaleString()} Kaution
              </div>
            )}
          </div>

          {/* CTA Button */}
          <Button
            onClick={handleDetailsClick}
            variant="ghost"
            className="bg-transparent hover:bg-red-50 border border-neutral-200 text-neutral-700 hover:border-red-500 hover:text-red-600 text-sm font-semibold h-10 px-5 group-hover:border-red-500 group-hover:text-red-600 group-hover:bg-red-50 transition-all duration-200"
          >
            Details
          </Button>
        </div>
      </div>

      {/* Premium glow ring */}
      {listing.premium && (
        <div className="absolute inset-0 rounded-2xl ring-2 ring-amber-300/30 ring-inset pointer-events-none" />
      )}
    </article>
  );
}
