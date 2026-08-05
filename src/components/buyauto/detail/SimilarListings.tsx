import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Listing, ListingDetail } from "@/lib/buyauto/types";
import { getSimilarListings } from "@/services/listingsService";
import { buildListingHref } from "@/lib/buyauto/listingUrl";
import { getImageVariant } from "@/lib/buyauto/imageVariant";

interface SimilarListingsProps {
  listing: ListingDetail;
}

export default function SimilarListings({ listing }: SimilarListingsProps) {
  const [listings, setListings] = useState<Listing[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadSimilarListings = async () => {
      try {
        const similarListings = await getSimilarListings(listing, 6);
        setListings(similarListings);
      } catch (error) {
        console.error("Error loading similar listings:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadSimilarListings();
  }, [listing]);

  if (isLoading) {
    return (
      <section className="space-y-8">
        <div className="flex items-center justify-between">
          <div className="w-48 h-8 bg-neutral-200 rounded animate-pulse"></div>
          <div className="w-32 h-10 bg-neutral-200 rounded animate-pulse"></div>
        </div>

        {/* Mobile: horizontal scroll skeleton (mirrors the loaded layout) */}
        <div className="md:hidden">
          <div className="flex gap-4 overflow-x-auto pb-4 -mx-4 px-4 snap-x snap-mandatory">
            {[...Array(3)].map((_, i) => (
              <SimilarListingCardSkeleton key={i} className="flex-shrink-0 w-72 snap-start" />
            ))}
          </div>
        </div>

        {/* Desktop: grid skeleton (mirrors the loaded layout) */}
        <div className="hidden md:grid grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => (
            <SimilarListingCardSkeleton key={i} />
          ))}
        </div>
      </section>
    );
  }

  if (listings.length === 0) {
    return null;
  }

  return (
    <section className="space-y-8">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-neutral-900">
          Ähnliche Fahrzeuge
        </h2>
        <Button variant="outline" asChild className="bg-transparent hover:bg-neutral-50">
          <Link href="/suche">
            Alle ansehen
            <ArrowRight className="w-4 h-4 ml-2" />
          </Link>
        </Button>
      </div>

      {/* Mobile: Horizontal scroll */}
      <div className="md:hidden">
        <div className="flex gap-4 overflow-x-auto pb-4 -mx-4 px-4 snap-x snap-mandatory">
          {listings.map((listingItem) => (
            <SimilarListingCardMobile key={listingItem.id} listing={listingItem} />
          ))}
        </div>
      </div>

      {/* Desktop: Grid */}
      <div className="hidden md:grid grid-cols-2 lg:grid-cols-3 gap-6">
        {listings.slice(0, 6).map((listingItem) => (
          <SimilarListingCard key={listingItem.id} listing={listingItem} />
        ))}
      </div>
    </section>
  );
}

function SimilarListingCardSkeleton({ className }: { className?: string }) {
  return (
    <Card
      className={`animate-pulse border-0 shadow-lg shadow-neutral-900/5 bg-white rounded-2xl overflow-hidden ${className ?? ""}`}
    >
      <div className="aspect-video bg-neutral-200"></div>
      <CardContent className="p-4 space-y-3">
        <div>
          <div className="w-3/4 h-5 bg-neutral-200 rounded mb-1.5"></div>
          <div className="w-1/2 h-4 bg-neutral-200 rounded"></div>
        </div>
        <div className="flex justify-between">
          <div>
            <div className="w-20 h-5 bg-neutral-200 rounded mb-1.5"></div>
            <div className="w-16 h-3 bg-neutral-200 rounded"></div>
          </div>
          <div className="flex flex-col items-end">
            <div className="w-14 h-4 bg-neutral-200 rounded mb-1.5"></div>
            <div className="w-20 h-3 bg-neutral-200 rounded"></div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Same product rule as ModernListingCard: a row is a Leasingübernahme when its
 * deal_type says so or its takeover add-on offer is enabled — those lead with
 * the monthly rate and Restlaufzeit. Everything else is a Direktkauf and shows
 * the purchase price (never the mirrored monthly columns as "pro Monat").
 */
function cardPriceInfo(listing: Listing): { price: string; priceSub: string; months: number | null } {
  const chf = (v: number) => `CHF ${v.toLocaleString("de-CH")}`;
  const dealType = listing.deal_type ?? "lease_takeover";

  const takeover = dealType === "direct_purchase" ? listing.leasing_offer?.lease_takeover_offer ?? null : null;
  const takeoverEnabled = takeover?.enabled === true;

  const monthly =
    dealType === "lease_takeover"
      ? listing.pricePerMonthCHF > 0
        ? listing.pricePerMonthCHF
        : null
      : takeoverEnabled && typeof takeover?.price_per_month_chf === "number"
        ? takeover.price_per_month_chf
        : null;

  if ((dealType === "lease_takeover" || takeoverEnabled) && monthly) {
    const months =
      dealType === "lease_takeover"
        ? listing.remainingMonths > 0
          ? listing.remainingMonths
          : null
        : typeof takeover?.remaining_months === "number" && takeover.remaining_months > 0
          ? takeover.remaining_months
          : null;
    return { price: chf(Math.round(monthly)), priceSub: "pro Monat", months };
  }

  const purchase = typeof listing.purchasePriceCHF === "number" && listing.purchasePriceCHF > 0 ? listing.purchasePriceCHF : null;
  return { price: purchase ? chf(Math.round(purchase)) : "Preis auf Anfrage", priceSub: purchase ? "Kaufpreis" : "", months: null };
}

function SimilarListingCard({ listing }: { listing: Listing }) {
  const formatMileage = (km: number) => `${km.toLocaleString("de-CH")} km`;
  const { price, priceSub, months } = cardPriceInfo(listing);

  return (
    <Card className="group border-0 shadow-lg shadow-neutral-900/5 bg-white rounded-2xl overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
      <Link href={buildListingHref({ id: listing.id, brand: listing.brand, model: listing.model })}>
        <div className="relative aspect-video bg-gradient-to-br from-neutral-100 to-neutral-200">
          {listing.imageUrl && (
            <Image
              src={getImageVariant(listing.imageUrl, "medium")}
              alt={`${listing.brand} ${listing.model} ${listing.year}`}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-300"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 33vw, 350px"
              quality={80}
            />
          )}
          {!listing.imageUrl && (
            <div className="absolute inset-0 flex items-center justify-center text-neutral-500">
              <div className="text-center">
                <div className="text-4xl mb-2">🚗</div>
                <p className="text-sm">Bild nicht verfügbar</p>
              </div>
            </div>
          )}
          {listing.premium && (
            <Badge className="absolute top-3 right-3 bg-gradient-to-r from-red-500 to-red-600 text-white border-0 text-xs">
              Premium
            </Badge>
          )}
        </div>
        
        <CardContent className="p-4 space-y-3">
          <div>
            <h3 className="font-semibold text-neutral-900 group-hover:text-red-600 transition-colors">
              {listing.brand} {listing.model}
            </h3>
            <p className="text-sm text-neutral-600">
              {listing.year} · {formatMileage(listing.mileageKm)}
            </p>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <div className="font-bold text-red-600">
                {price}
              </div>
              {priceSub && <div className="text-xs text-neutral-500">{priceSub}</div>}
            </div>
            <div className="text-right text-sm text-neutral-600">
              {months !== null && <div>{months} Mon.</div>}
              <div className="flex items-center gap-1 text-xs">
                <MapPin className="w-3 h-3" />
                {listing.location}
              </div>
            </div>
          </div>
        </CardContent>
      </Link>
    </Card>
  );
}

function SimilarListingCardMobile({ listing }: { listing: Listing }) {
  const formatMileage = (km: number) => `${km.toLocaleString("de-CH")} km`;
  const { price, priceSub, months } = cardPriceInfo(listing);

  return (
    <Card className="group flex-shrink-0 w-72 border-0 shadow-lg shadow-neutral-900/5 bg-white rounded-2xl overflow-hidden snap-start">
      <Link href={buildListingHref({ id: listing.id, brand: listing.brand, model: listing.model })}>
        <div className="relative aspect-video bg-gradient-to-br from-neutral-100 to-neutral-200">
          {listing.imageUrl && (
            <Image
              src={getImageVariant(listing.imageUrl, "medium")}
              alt={`${listing.brand} ${listing.model} ${listing.year}`}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-300"
              sizes="300px"
              quality={80}
            />
          )}
          {!listing.imageUrl && (
            <div className="absolute inset-0 flex items-center justify-center text-neutral-500">
              <div className="text-center">
                <div className="text-4xl mb-2">🚗</div>
                <p className="text-sm">Bild nicht verfügbar</p>
              </div>
            </div>
          )}
          {listing.premium && (
            <Badge className="absolute top-3 right-3 bg-gradient-to-r from-red-500 to-red-600 text-white border-0 text-xs">
              Premium
            </Badge>
          )}
        </div>
        
        <CardContent className="p-4 space-y-3">
          <div>
            <h3 className="font-semibold text-neutral-900 group-hover:text-red-600 transition-colors">
              {listing.brand} {listing.model}
            </h3>
            <p className="text-sm text-neutral-600">
              {listing.year} · {formatMileage(listing.mileageKm)}
            </p>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <div className="font-bold text-red-600">
                {price}
              </div>
              {priceSub && <div className="text-xs text-neutral-500">{priceSub}</div>}
            </div>
            <div className="text-right text-sm text-neutral-600">
              {months !== null && <div>{months} Mon.</div>}
              <div className="flex items-center gap-1 text-xs">
                <MapPin className="w-3 h-3" />
                {listing.location}
              </div>
            </div>
          </div>
        </CardContent>
      </Link>
    </Card>
  );
}