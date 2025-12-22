import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Calendar, MapPin, Gauge, Fuel, Settings, Star } from "lucide-react";
import { Listing } from "@/lib/buyauto/types";
import Image from "next/image";

interface ListingCardProps {
  listing: Listing;
}

export default function ListingCard({ listing }: ListingCardProps) {
  return (
    <Card className={`group overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1 ${
      listing.premium 
        ? "ring-2 ring-red-100 bg-gradient-to-br from-red-50/50 to-white shadow-lg" 
        : "hover:shadow-lg"
    }`}>
      <div className="relative overflow-hidden h-48">
        <Image 
          src={listing.imageUrl} 
          alt={`${listing.brand} ${listing.model}`}
          fill
          className="object-cover group-hover:scale-105 transition-transform duration-300"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          quality={75}
          loading="lazy"
        />
        {listing.premium && (
          <Badge className="absolute top-3 left-3 bg-red-600 hover:bg-red-600 text-white border-0 z-10">
            <Star className="h-3 w-3 mr-1 fill-current" />
            Premium
          </Badge>
        )}
      </div>

      <CardContent className="p-4 space-y-3">
        {/* Title and Price */}
        <div className="flex items-start justify-between">
          <div>
            <h3 className="font-semibold text-slate-900 text-lg leading-tight">
              {listing.brand} {listing.model}
            </h3>
            <p className="text-slate-600 text-sm">{listing.year}</p>
          </div>
          <div className="text-right">
            <p className="font-bold text-red-600 text-xl">
              CHF {listing.pricePerMonthCHF.toLocaleString("de-CH")}
            </p>
            <p className="text-slate-500 text-sm">pro Monat</p>
          </div>
        </div>

        {/* Details Grid */}
        <div className="grid grid-cols-2 gap-2 py-2 border-t border-slate-100">
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <Calendar className="h-4 w-4" />
            <span>{listing.remainingMonths} Monate</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <MapPin className="h-4 w-4" />
            <span>{listing.location}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <Gauge className="h-4 w-4" />
            <span>{listing.mileageKm.toLocaleString("de-CH")} km</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <Fuel className="h-4 w-4" />
            <span>{listing.fuel}</span>
          </div>
        </div>

        {/* Additional Info */}
        <div className="flex items-center gap-4 text-sm text-slate-600 pt-2 border-t border-slate-100">
          <div className="flex items-center gap-1">
            <Settings className="h-4 w-4" />
            <span>{listing.gearbox}</span>
          </div>
          <span className="text-slate-400">•</span>
          <span>{listing.body}</span>
        </div>

        {/* CTA Button */}
        <Button 
          className="w-full mt-4 bg-slate-900 hover:bg-slate-800 text-white transition-colors"
          size="sm"
        >
          Details ansehen
        </Button>
      </CardContent>
    </Card>
  );
}