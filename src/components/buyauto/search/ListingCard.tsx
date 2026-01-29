import { Listing } from "@/lib/buyauto/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Heart, MapPin, Calendar, Gauge, Fuel, Settings, Clock } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/router";
import { useState } from "react";
import { cn } from "@/lib/utils";

// Utility functions
const formatPrice = (price: number): string => {
  return `CHF ${price.toLocaleString('de-CH')}`;
};

const formatMileage = (mileage: number): string => {
  if (mileage >= 1000) {
    return `${(mileage / 1000).toFixed(0)}'${(mileage % 1000).toString().padStart(3, '0')} km`;
  }
  return `${mileage} km`;
};

interface ListingCardProps {
  listing: Listing;
  className?: string;
}

export default function ListingCard({ listing, className }: ListingCardProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [imageError, setImageError] = useState(false);
  const router = useRouter();

  const handleImageHover = () => {
    if (listing.images.length > 1) {
      setCurrentImageIndex(1);
    }
  };

  const handleImageLeave = () => {
    setCurrentImageIndex(0);
  };

  const handleDetailsClick = () => {
    router.push(`/fahrzeug/${listing.id}`);
  };

  const handleSaveClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    // Placeholder for save functionality
    console.log(`Save listing ${listing.id}`);
  };

  const dealType = (listing.deal_type ?? "lease_takeover") as "lease_takeover" | "direct_purchase";
  const leasingOffer = listing.leasing_offer ?? null;

  return (
    <Card 
      className={cn(
        "group cursor-pointer transition-all duration-300 hover:shadow-lg hover:shadow-neutral-900/10 hover:-translate-y-1",
        "bg-white border border-neutral-200 rounded-2xl overflow-hidden",
        listing.premium && "ring-2 ring-red-500/20 shadow-red-500/10",
        className
      )}
      onClick={handleDetailsClick}
    >
      <div className="p-6">
        <div className="flex gap-6">
          {/* Image */}
          <div 
            className="relative w-48 h-32 flex-shrink-0 bg-neutral-100 rounded-xl overflow-hidden"
            onMouseEnter={handleImageHover}
            onMouseLeave={handleImageLeave}
          >
            {!imageError ? (
              <Image
                src={listing.images[currentImageIndex] || listing.images[0]}
                alt={`${listing.brand} ${listing.model}`}
                fill
                className="object-cover transition-opacity duration-300"
                onError={() => setImageError(true)}
                sizes="192px"
                quality={75}
                loading="lazy"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-neutral-400">
                <div className="text-center">
                  <div className="text-2xl mb-2">{listing.brand.charAt(0)}</div>
                  <div className="text-xs">{listing.brand}</div>
                </div>
              </div>
            )}
            
            {listing.premium && (
              <div className="absolute top-3 left-3">
                <Badge className="bg-gradient-to-r from-red-600 to-red-700 text-white text-xs font-semibold px-2 py-1">
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
                <div className="absolute top-3 right-3 h-9 w-9 rounded-full bg-white/90 ring-1 ring-white/60 shadow overflow-hidden">
                  <img src={src} alt="Garage Logo" className="h-full w-full object-cover" loading="lazy" />
                </div>
              );
            })()}

            {listing.images.length > 1 && (
              <div className="absolute bottom-3 right-3 bg-black/60 text-white text-xs px-2 py-1 rounded">
                {listing.images.length} Bilder
              </div>
            )}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex justify-between items-start mb-3">
              <div>
                <h3 className="text-lg font-semibold text-neutral-900 group-hover:text-red-600 transition-colors">
                  {listing.brand} {listing.model}
                  {listing.title && (
                    <span className="text-neutral-600 font-normal ml-2">
                      · {listing.title}
                    </span>
                  )}
                </h3>
                <div className="flex items-center gap-1 text-sm text-neutral-600 mt-1">
                  <Calendar className="w-4 h-4" />
                  <span>{listing.year}</span>
                  <span className="mx-2">·</span>
                  <MapPin className="w-4 h-4" />
                  <span>{listing.location}</span>
                </div>
              </div>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSaveClick}
                className="text-neutral-500 hover:text-red-600 hover:bg-red-50 p-2"
              >
                <Heart className="w-4 h-4" />
              </Button>
            </div>

            {/* Key specs */}
            <div className="flex flex-wrap gap-2 mb-4">
              <Badge variant="secondary" className="bg-neutral-100 text-neutral-700 text-xs">
                <Gauge className="w-3 h-3 mr-1" />
                {formatMileage(listing.mileageKm)}
              </Badge>
              <Badge variant="secondary" className="bg-neutral-100 text-neutral-700 text-xs">
                <Fuel className="w-3 h-3 mr-1" />
                {listing.fuel}
              </Badge>
              <Badge variant="secondary" className="bg-neutral-100 text-neutral-700 text-xs">
                <Settings className="w-3 h-3 mr-1" />
                {listing.gearbox}
              </Badge>
              <Badge variant="secondary" className="bg-neutral-100 text-neutral-700 text-xs">
                <Clock className="w-3 h-3 mr-1" />
                {listing.remainingMonths} Mon.
              </Badge>
            </div>

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
          </div>

          {/* Price and CTA */}
          <div className="flex flex-col items-end justify-between text-right min-w-[140px]">
            <div className="space-y-1">
              <div className="text-2xl font-bold text-neutral-900">
                {formatPrice(listing.pricePerMonthCHF)}
              </div>
              <div className="text-sm text-neutral-600">
                pro Monat
              </div>
              <div className="text-xs text-neutral-500 mt-1">
                {(listing.depositCHF && listing.depositCHF > 0)
                  ? `Einmalige Kaution: ${formatPrice(listing.depositCHF)}`
                  : "Keine Kaution"}
              </div>
            </div>

            <div className="flex gap-2 mt-4">
              <Button
                variant="outline"
                size="sm"
                onClick={handleSaveClick}
                className="bg-transparent hover:bg-neutral-100/80 border-neutral-300 text-neutral-600 hover:text-neutral-800 text-xs px-3"
              >
                Merken
              </Button>
              <Button
                size="sm"
                className="bg-red-600 hover:bg-red-700 text-white font-medium text-xs px-4"
              >
                Details
              </Button>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}
