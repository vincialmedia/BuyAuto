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
  priority?: boolean;
}

export function ModernListingCard({ listing, onDetailsClick, priority = false }: ModernListingCardProps) {
  const router = useRouter();
  const [imageLoaded, setImageLoaded] = useState(false);

  const handleDetailsClick = (e?: React.MouseEvent) => {
    e?.stopPropagation();
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
      className={`group relative bg-white rounded-2xl overflow-hidden transition-all duration-300 hover:-translate-y-1 cursor-pointer touch-manipulation ${
        listing.premium
          ? "border-2 border-amber-200/60 shadow-lg shadow-amber-500/10 hover:shadow-2xl hover:shadow-amber-500/20 active:shadow-lg"
          : "border border-neutral-200/60 shadow-sm hover:shadow-xl hover:shadow-neutral-900/10 active:shadow-md"
      }`}
      onClick={handleDetailsClick}
    >
      {/* Image Section */}
      <div className="relative w-full aspect-[16/10] overflow-hidden bg-neutral-100">
        {!imageLoaded && (
          <div className="absolute inset-0 animate-pulse bg-gradient-to-r from-neutral-200 via-neutral-100 to-neutral-200" />
        )}
        <Image
          src={listing.imageUrl}
          alt={`${listing.brand} ${listing.model}`}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
          priority={priority}
          quality={85}
          className={`object-cover group-hover:scale-105 transition-all duration-500 ${
            imageLoaded ? 'opacity-100' : 'opacity-0'
          }`}
          onLoad={() => setImageLoaded(true)}
        />
        
        {/* Premium Badge */}
        {listing.premium && (
          <div className="absolute top-3 left-3 sm:top-4 sm:left-4 z-10">
            <Badge className="bg-gradient-to-br from-amber-400 via-amber-500 to-amber-600 text-white border-0 shadow-lg shadow-amber-500/50 text-xs font-bold px-2.5 py-1 sm:px-3 sm:py-1.5 backdrop-blur-sm">
              <Star className="h-3 w-3 sm:h-3.5 sm:w-3.5 mr-1 sm:mr-1.5 fill-current" />
              Premium
            </Badge>
          </div>
        )}

        {(() => {
          const sellerType = (listing as unknown as { seller_type?: string | null }).seller_type;
          const garageId = (listing as unknown as { garage_id?: string | null }).garage_id;
          const base = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "");
          if (sellerType !== "garage" || !garageId || !base) return null;
          const path = `garage-logos/${garageId}/logo_medium.webp`
            .split("/")
            .map((seg) => encodeURIComponent(seg))
            .join("/");
          const src = `${base}/storage/v1/object/public/listing-images/${path}`;
          return (
            <div className="absolute top-3 right-3 sm:top-4 sm:right-4 z-10 h-9 w-9 rounded-full bg-white/90 ring-1 ring-white/60 shadow overflow-hidden">
              <img src={src} alt="Garage Logo" className="h-full w-full object-cover" loading="lazy" />
            </div>
          );
        })()}

        {/* Gradient Overlay for better text readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      </div>

      {/* Content Section */}
      <div className="p-4 sm:p-5">
        {/* Title */}
        <h3 className="text-base sm:text-lg font-bold text-neutral-900 group-hover:text-red-600 transition-colors duration-200 mb-2 sm:mb-3 line-clamp-1">
          {listing.brand} {listing.model}
        </h3>

        {/* Year Pill */}
        <div className="inline-flex items-center px-2 sm:px-2.5 py-0.5 sm:py-1 bg-neutral-100 text-neutral-700 rounded-full text-xs font-semibold mb-3 sm:mb-4">
          {listing.year}
        </div>

        {/* Specs Grid */}
        <div className="grid grid-cols-2 gap-2 sm:gap-2.5 mb-3 sm:mb-4">
          <div className="flex items-center text-xs text-neutral-600">
            <Gauge className="h-3 w-3 sm:h-3.5 sm:w-3.5 mr-1 sm:mr-1.5 text-neutral-400 flex-shrink-0" />
            <span className="font-medium truncate">{listing.mileageKm.toLocaleString()} km</span>
          </div>
          <div className="flex items-center text-xs text-neutral-600">
            <Fuel className="h-3 w-3 sm:h-3.5 sm:w-3.5 mr-1 sm:mr-1.5 text-neutral-400 flex-shrink-0" />
            <span className="font-medium truncate">{listing.fuel}</span>
          </div>
          <div className="flex items-center text-xs text-neutral-600">
            <Settings className="h-3 w-3 sm:h-3.5 sm:w-3.5 mr-1 sm:mr-1.5 text-neutral-400 flex-shrink-0" />
            <span className="font-medium truncate">{listing.gearbox}</span>
          </div>
          <div className="flex items-center text-xs text-neutral-600">
            <MapPin className="h-3 w-3 sm:h-3.5 sm:w-3.5 mr-1 sm:mr-1.5 text-neutral-400 flex-shrink-0" />
            <span className="font-medium truncate">{formatLocation(listing.location)}</span>
          </div>
        </div>

        {/* Leasing Term */}
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Restlaufzeit</span>
          <span className="font-medium">{listing.remainingMonths} Monate</span>
        </div>

        {listing.remaining_km && (
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Verbleibende KM</span>
            <span className="font-medium">{listing.remaining_km.toLocaleString("de-CH")} km</span>
          </div>
        )}

        {/* Divider */}
        <div className="h-px bg-neutral-200 mb-3 sm:mb-4" />

        {/* Price & CTA */}
        <div className="flex items-end justify-between gap-2">
          {/* Price */}
          <div className="flex-1 min-w-0">
            <div className="text-xl sm:text-2xl font-bold text-red-600 truncate">
              CHF {listing.pricePerMonthCHF.toLocaleString()}
            </div>
            <div className="text-xs text-neutral-500 font-medium">pro Monat</div>
            {listing.depositCHF > 0 && (
              <div className="text-xs text-neutral-400 mt-0.5 truncate">
                + CHF {listing.depositCHF.toLocaleString()} Kaution
              </div>
            )}
          </div>

          {/* CTA Button */}
          <Button
            onClick={handleDetailsClick}
            variant="ghost"
            className="flex-shrink-0 bg-transparent hover:bg-red-50 border border-neutral-200 text-neutral-700 hover:border-red-500 hover:text-red-600 text-sm font-semibold h-9 sm:h-10 px-4 sm:px-5 group-hover:border-red-500 group-hover:text-red-600 group-hover:bg-red-50 transition-all duration-200 active:scale-95"
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
