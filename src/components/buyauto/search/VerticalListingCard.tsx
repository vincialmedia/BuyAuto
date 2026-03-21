import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Listing } from "@/lib/buyauto/types";
import { Star, MapPin, Gauge, Fuel, Settings, Calendar } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/router";
import { estimateTeaserMonthlyRateChf } from "@/lib/buyauto/leasingMath";
import { buildListingHref } from "@/lib/buyauto/listingUrl";

interface VerticalListingCardProps {
  listing: Listing;
  onDetailsClick?: (listingId: string) => void;
}

export default function VerticalListingCard({ listing, onDetailsClick }: VerticalListingCardProps) {
  const router = useRouter();

  const uiVersion = listing.ui_version === "v2" ? "v2" : "v1";
  const rawDealType = (listing.deal_type ?? "lease_takeover") as "lease_takeover" | "direct_purchase";
  const dealType = uiVersion === "v1" ? "lease_takeover" : rawDealType;

  const leasingOffer = uiVersion === "v1" ? null : (listing.leasing_offer ?? null);

  const leaseTakeoverOffer =
    dealType === "direct_purchase" && leasingOffer && typeof leasingOffer === "object"
      ? ((leasingOffer as unknown as { lease_takeover_offer?: any | null }).lease_takeover_offer ?? null)
      : null;

  const leaseTakeoverEnabled = Boolean(leaseTakeoverOffer && typeof leaseTakeoverOffer === "object" && leaseTakeoverOffer.enabled === true);

  const leaseTakeoverMonthlyChf =
    leaseTakeoverEnabled && typeof leaseTakeoverOffer?.price_per_month_chf === "number"
      ? (leaseTakeoverOffer.price_per_month_chf as number)
      : null;

  const purchasePriceChf =
    uiVersion === "v1"
      ? null
      : typeof listing.purchasePriceCHF === "number"
        ? listing.purchasePriceCHF
        : typeof (listing as unknown as { purchase_price_chf?: unknown }).purchase_price_chf === "number"
          ? ((listing as unknown as { purchase_price_chf?: number }).purchase_price_chf ?? null)
          : typeof (listing as unknown as { price_chf?: unknown }).price_chf === "number"
            ? ((listing as unknown as { price_chf?: number }).price_chf ?? null)
            : typeof (listing as unknown as { listing_price?: unknown }).listing_price === "number"
              ? ((listing as unknown as { listing_price?: number }).listing_price ?? null)
              : null;

  const teaserMonthlyChf =
    dealType === "direct_purchase" &&
    leasingOffer?.enabled === true &&
    purchasePriceChf
      ? estimateTeaserMonthlyRateChf({
          priceChf: purchasePriceChf,
          year: listing.year,
          mileageKm: listing.mileageKm,
          interestRatePct: Number(leasingOffer.interest_rate_pct),
          residualPctAdjustmentPp: leasingOffer.residual_pct_adjustment_pp ?? 0,
          termMonths: 60,
          kmPerYear: 10000,
          downPaymentPct: 5,
        })
      : null;

  const chf = new Intl.NumberFormat("de-CH", { maximumFractionDigits: 0 });

  const primaryLine =
    dealType === "lease_takeover"
      ? `CHF ${chf.format(Math.round(listing.pricePerMonthCHF))} / Monat`
      : purchasePriceChf
        ? `CHF ${chf.format(Math.round(purchasePriceChf))}`
        : "Preis auf Anfrage";

  const secondaryLine =
    dealType === "lease_takeover"
      ? purchasePriceChf
        ? `CHF ${chf.format(Math.round(purchasePriceChf))}`
        : null
      : leaseTakeoverMonthlyChf
        ? `Leasingübernahme: CHF ${chf.format(Math.round(leaseTakeoverMonthlyChf))} / Monat`
        : teaserMonthlyChf
          ? `Ab CHF ${chf.format(Math.round(teaserMonthlyChf))} / Monat`
          : null;

  const handleDetailsClick = () => {
    if (onDetailsClick) {
      onDetailsClick(listing.id);
    } else {
      router.push(buildListingHref({ id: listing.id, brand: listing.brand, model: listing.model }));
    }
  };

  // Format the location to show just canton
  const formatLocation = (location: string) => {
    if (location.includes(',')) {
      return location.split(',').pop()?.trim() || location;
    }
    return location;
  };

  const sellerType = (listing as unknown as { seller_type?: string | null }).seller_type ?? null;
  const garageId = (listing as unknown as { garage_id?: string | null }).garage_id ?? null;
  const isGarage = sellerType === "garage" || (typeof garageId === "string" && garageId.trim() !== "");

  const rawSellerName =
    (listing as unknown as { seller_name?: string | null }).seller_name ??
    (listing as unknown as { garage_name?: string | null }).garage_name ??
    null;

  const sellerName =
    (typeof rawSellerName === "string" ? rawSellerName.trim() : "") ||
    (isGarage ? "Garage" : "Privatanbieter");

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
                {dealType === "lease_takeover" ? (
                  <>
                    <div className="inline-flex items-center px-2 py-1 bg-neutral-100 text-neutral-700 rounded-full text-xs font-medium">
                      <Calendar className="h-3 w-3 mr-1" />
                      Restlaufzeit {listing.remainingMonths} Mon.
                    </div>
                    {listing.remaining_km && (
                      <div className="inline-flex items-center px-2 py-1 bg-neutral-100 text-neutral-700 rounded-full text-xs font-medium">
                        <Gauge className="h-3 w-3 mr-1" />
                        {listing.remaining_km.toLocaleString("de-CH")} km verbleibend
                      </div>
                    )}
                  </>
                ) : (
                  <div className="inline-flex items-center px-2 py-1 bg-neutral-100 text-neutral-700 rounded-full text-xs font-medium">
                    <Calendar className="h-3 w-3 mr-1" />
                    {leaseTakeoverEnabled ? "Direktkauf + Leasingübernahme" : leasingOffer?.enabled ? "Direktkauf + Leasing" : "Direktkauf"}
                  </div>
                )}

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
                  {primaryLine}
                </div>
                {secondaryLine ? (
                  <div className="text-sm text-neutral-500 font-medium mt-1">
                    {secondaryLine}
                  </div>
                ) : (
                  <div className="text-sm text-neutral-500 font-medium mt-1">
                    {dealType === "lease_takeover" ? "/ Monat" : ""}
                  </div>
                )}

                {dealType === "lease_takeover" && (
                  <>
                    {listing.depositCHF > 0 ? (
                      <p className="text-xs text-neutral-500 mt-1">
                        Einmalige Kaution CHF {listing.depositCHF.toLocaleString()}
                      </p>
                    ) : (
                      <p className="text-xs text-neutral-500 mt-1">Keine Kaution</p>
                    )}
                  </>
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

      <div className="mt-3 flex items-center gap-3">
        <div className="relative h-8 w-8 overflow-hidden rounded-full bg-neutral-100 ring-1 ring-neutral-200 flex-shrink-0">
          {(() => {
            const sellerType = (listing as unknown as { seller_type?: string | null }).seller_type;
            const garageId = (listing as unknown as { garage_id?: string | null }).garage_id;
            const base = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "");
            if (sellerType === "garage" && garageId && base) {
              const path = `garage-logos/${garageId}/logo_medium.webp`
                .split("/")
                .map((seg) => encodeURIComponent(seg))
                .join("/");
              const src = `${base}/storage/v1/object/public/listing-images/${path}`;
              return <img src={src} alt="Garage Logo" className="h-full w-full object-cover" loading="lazy" />;
            }

            const avatarUrl = (listing as unknown as { seller_avatar_url?: string | null }).seller_avatar_url ?? null;
            const name =
              (listing as unknown as { seller_name?: string | null }).seller_name ??
              (listing as unknown as { garage_name?: string | null }).garage_name ??
              "Anbieter";

            const initials = name
              .trim()
              .split(/\s+/)
              .filter(Boolean)
              .slice(0, 2)
              .map((p) => p[0]?.toUpperCase())
              .join("") || "A";

            if (avatarUrl) {
              return <img src={avatarUrl} alt={name} className="h-full w-full object-cover" loading="lazy" />;
            }

            return <div className="h-full w-full grid place-items-center text-xs font-bold text-neutral-700">{initials}</div>;
          })()}
        </div>

        <div className="min-w-0">
          <p className="text-xs font-semibold text-neutral-900 truncate">
            {sellerName}
          </p>
          <p className="text-xs text-neutral-500 truncate">{listing.location}</p>
        </div>
      </div>

      {/* Premium glow effect */}
      {listing.premium && (
        <div className="absolute inset-0 rounded-2xl ring-1 ring-amber-200/50 ring-inset pointer-events-none" />
      )}
    </div>
  );
}
