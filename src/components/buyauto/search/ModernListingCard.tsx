import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Listing } from "@/lib/buyauto/types";
import { Star, MapPin, Gauge, Fuel, Settings } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { estimateTeaserMonthlyRateChf } from "@/lib/buyauto/leasingMath";
import { buildListingHref } from "@/lib/buyauto/listingUrl";
import { getImageVariant } from "@/lib/buyauto/imageVariant";

interface ModernListingCardProps {
  listing: Listing;
  onDetailsClick?: (listingId: string) => void;
  priority?: boolean;
}

export function ModernListingCard({ listing, onDetailsClick, priority = false }: ModernListingCardProps) {
  // Real, server-rendered href to the vehicle detail page. Crucial for SEO: Googlebot
  // follows <a href>, not onClick handlers — without this the entire detail-page layer
  // is orphaned from the crawl graph.
  const href = buildListingHref({ id: listing.id, brand: listing.brand, model: listing.model });

  // When a parent passes onDetailsClick (e.g. to open a modal) intercept the anchor and
  // call it instead of navigating; otherwise the <a href> navigates normally.
  const handleAnchorClick = onDetailsClick
    ? (e: React.MouseEvent) => {
        e.preventDefault();
        onDetailsClick(listing.id);
      }
    : undefined;

  const uiVersion = listing.ui_version === "v2" ? "v2" : "v1";
  const rawDealType = (listing.deal_type ?? "lease_takeover") as "lease_takeover" | "direct_purchase";
  const dealType = uiVersion === "v1" ? "lease_takeover" : rawDealType;

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

  // Deterministic Swiss grouping (117'000). Intl/toLocaleString("de-CH") is NOT used
  // here because Node and browsers disagree on the apostrophe character (U+0027 vs
  // U+2019), which caused hydration mismatches on every server-rendered card.
  const swissInt = (n: number) => String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, "'");
  const chf = { format: swissInt };

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

  const formatLocation = (location: string) => {
    if (location.includes(",")) {
      return location.split(",").pop()?.trim() || location;
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

  const sellerAvatarUrl = (listing as unknown as { seller_avatar_url?: string | null }).seller_avatar_url ?? null;

  const sellerInitials =
    sellerName
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((p) => p[0]?.toUpperCase())
      .join("") || "A";

  return (
    <article
      className={`group relative bg-white rounded-2xl overflow-hidden transition-all duration-300 hover:-translate-y-1 cursor-pointer touch-manipulation ${
        listing.premium
          ? "border-2 border-amber-200/60 shadow-lg shadow-amber-500/10 hover:shadow-2xl hover:shadow-amber-500/20 active:shadow-lg"
          : "border border-neutral-200/60 shadow-sm hover:shadow-xl hover:shadow-neutral-900/10 active:shadow-md"
      }`}
    >
      {/* Image Section */}
      <div className="relative w-full aspect-[16/10] overflow-hidden bg-neutral-100">
        <div className="absolute inset-0 animate-pulse bg-gradient-to-r from-neutral-200 via-neutral-100 to-neutral-200" />
        <Image
          src={getImageVariant(listing.imageUrl, "medium")}
          alt={`${listing.brand} ${listing.model}`}
          fill
          sizes="(max-width: 767px) 100vw, (max-width: 1023px) 50vw, 33vw"
          priority={priority}
          quality={85}
          className="object-cover group-hover:scale-105 transition-transform duration-500"
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
          const garageLogoUrl = (listing as unknown as { garage_logo_url?: string | null }).garage_logo_url;
          if (sellerType !== "garage" || !garageLogoUrl) return null;
          return (
            <div className="absolute top-3 right-3 sm:top-4 sm:right-4 z-10 h-9 w-9 rounded-full bg-white/90 ring-1 ring-white/60 shadow overflow-hidden">
              <img src={garageLogoUrl} alt="Garage Logo" className="h-full w-full object-cover" loading="lazy" />
            </div>
          );
        })()}

        {/* Gradient Overlay for better text readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      </div>

      {/* Content Section */}
      <div className="p-4 sm:p-5">
        {/* Title — real crawlable link, stretched (::before) to make the whole card clickable */}
        <h3 className="text-base sm:text-lg font-bold text-neutral-900 group-hover:text-red-600 transition-colors duration-200 mb-2 sm:mb-3 line-clamp-1">
          <Link
            href={href}
            onClick={handleAnchorClick}
            className="before:absolute before:inset-0 before:z-[1] before:content-['']"
          >
            {listing.brand} {listing.model}
          </Link>
        </h3>

        {/* Year Pill */}
        <div className="inline-flex items-center px-2 sm:px-2.5 py-0.5 sm:py-1 bg-neutral-100 text-neutral-700 rounded-full text-xs font-semibold mb-3 sm:mb-4">
          {listing.year}
        </div>

        {/* Specs Grid */}
        <div className="grid grid-cols-2 gap-2 sm:gap-2.5 mb-3 sm:mb-4">
          <div className="flex items-center text-xs text-neutral-600">
            <Gauge className="h-3 w-3 sm:h-3.5 sm:w-3.5 mr-1 sm:mr-1.5 text-neutral-400 flex-shrink-0" />
            <span className="font-medium truncate">{swissInt(listing.mileageKm)} km</span>
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

        {dealType === "lease_takeover" && (
          <>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Restlaufzeit</span>
              <span className="font-medium">{listing.remainingMonths} Monate</span>
            </div>

            {listing.remaining_km && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Verbleibende KM</span>
                <span className="font-medium">{swissInt(listing.remaining_km)} km</span>
              </div>
            )}
          </>
        )}

        {dealType === "direct_purchase" && (
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Deal</span>
            <span className="font-medium">
              {leaseTakeoverEnabled ? "Direktkauf + Leasingübernahme" : leasingOffer?.enabled ? "Direktkauf + Leasing" : "Direktkauf"}
            </span>
          </div>
        )}

        <div className="mt-3 flex items-center gap-3">
          <div className="relative h-9 w-9 overflow-hidden rounded-full bg-neutral-100 ring-1 ring-neutral-200 flex-shrink-0">
            {(() => {
              const sellerType = (listing as unknown as { seller_type?: string | null }).seller_type;
              const garageLogoUrl = (listing as unknown as { garage_logo_url?: string | null }).garage_logo_url;
              if (sellerType === "garage" && garageLogoUrl) {
                return <img src={garageLogoUrl} alt={sellerName} className="h-full w-full object-cover" loading="lazy" />;
              }

              if (sellerAvatarUrl) {
                return <img src={sellerAvatarUrl} alt={sellerName} className="h-full w-full object-cover" loading="lazy" />;
              }

              return <div className="h-full w-full grid place-items-center text-xs font-bold text-neutral-700">{sellerInitials}</div>;
            })()}
          </div>

          <div className="min-w-0">
            <p className="text-xs font-semibold text-neutral-900 truncate">{sellerName}</p>
            <p className="text-xs text-neutral-500 truncate">{formatLocation(listing.location)}</p>
          </div>
        </div>

        {/* Divider */}
        <div className="h-px bg-neutral-200 mb-3 sm:mb-4 mt-3 sm:mt-4" />

        {/* Price & CTA */}
        <div className="flex items-end justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="text-xl sm:text-2xl font-bold text-red-600 truncate">{primaryLine}</div>
            {secondaryLine && <div className="text-xs text-neutral-500 font-medium mt-0.5 truncate">{secondaryLine}</div>}
          </div>

          <Button
            asChild
            variant="ghost"
            className="relative z-[2] flex-shrink-0 bg-transparent hover:bg-red-50 border border-neutral-200 text-neutral-700 hover:border-red-500 hover:text-red-600 text-sm font-semibold h-9 sm:h-10 px-4 sm:px-5 group-hover:border-red-500 group-hover:text-red-600 group-hover:bg-red-50 transition-all duration-200 active:scale-95"
          >
            <Link href={href} onClick={handleAnchorClick} aria-label={`Details zu ${listing.brand} ${listing.model}`}>
              Details
            </Link>
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
