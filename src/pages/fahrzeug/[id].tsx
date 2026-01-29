import { GetServerSideProps } from "next";
import { useState, useEffect } from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import dynamic from "next/dynamic";
import { ArrowLeft, MapPin, Calendar, Settings, Fuel, Users, Award, MessageCircle, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ListingDetail } from "@/lib/buyauto/types";
import { getPublishedListingById, getUserListingById } from "@/services/listingsService";
import ImageGallery from "@/components/buyauto/detail/ImageGallery";
import { StructuredData } from "@/components/buyauto/StructuredData";
import type { LeasingCalculatorProps } from "@/components/buyauto/detail/LeasingCalculator";
import { estimateTeaserMonthlyRateChf } from "@/lib/buyauto/leasingMath";
import { OwnerMiniProfile } from "@/components/buyauto/detail/OwnerMiniProfile";

// Helper function to ensure no undefined values (Next.js serialization fix)
const serializeListing = (listing: ListingDetail | null): ListingDetail | null => {
  if (!listing) return null;
  
  return {
    ...listing,
    description: listing.description ?? null,
    imageUrl: listing.imageUrl ?? null,
    depositCHF: listing.depositCHF ?? null,
  };
};

// Dynamically import InquiryForm (only loads when user clicks inquiry button)
const InquiryForm = dynamic(() => import("@/components/buyauto/detail/InquiryForm"), {
  ssr: false
});

// Dynamically import SimilarListings as it fetches data and is below the fold
const SimilarListings = dynamic(() => import("@/components/buyauto/detail/SimilarListings"), {
  loading: () => <div className="h-96 bg-neutral-50 animate-pulse rounded-xl mt-16" />
});

const LeasingCalculator = dynamic<LeasingCalculatorProps>(
  () => import("@/components/buyauto/detail/LeasingCalculator").then((m) => m.LeasingCalculator),
  { ssr: false, loading: () => <div className="h-80 bg-neutral-50 animate-pulse rounded-xl" /> }
);

interface ListingDetailPageProps {
  listing: ListingDetail | null;
  notFound?: boolean;
}

export default function ListingDetailPage({ listing: initialListing, notFound }: ListingDetailPageProps) {
  const [listing, setListing] = useState<ListingDetail | null>(initialListing);
  const [isLoading, setIsLoading] = useState(!initialListing && !notFound);
  const [showInquiryForm, setShowInquiryForm] = useState(false);
  const [clientNotFound, setClientNotFound] = useState(false);
  const router = useRouter();
  const { id } = router.query;

  useEffect(() => {
    if (!listing && !notFound && !clientNotFound && id && typeof id === "string") {
      const fetchListing = async () => {
        setIsLoading(true);
        try {
          const isPreview = router.query.preview === "true";
          const fetchedListing = isPreview
            ? await getUserListingById(id)
            : await getPublishedListingById(id);

          if (!fetchedListing) {
            setClientNotFound(true);
            return;
          }

          setListing(fetchedListing);
        } catch (error) {
          console.error("Error fetching listing:", error);
          setClientNotFound(true);
        } finally {
          setIsLoading(false);
        }
      };

      fetchListing();
    }
  }, [id, listing, notFound, clientNotFound, router.query.preview]);

  if (notFound || clientNotFound) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-neutral-900 mb-4">Inserat nicht gefunden</h1>
          <p className="text-neutral-600 mb-6">
            Das gewünschte Inserat existiert nicht oder ist nicht mehr verfügbar.
          </p>
          <Button onClick={() => router.push("/suche")} className="bg-red-500 hover:bg-red-600 text-white">
            Zurück zur Suche
          </Button>
        </div>
      </div>
    );
  }

  if (isLoading || !listing) {
    return (
      <div className="min-h-screen bg-neutral-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse space-y-6">
            <div className="w-32 h-10 bg-neutral-200 rounded"></div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="aspect-[4/3] bg-neutral-200 rounded-lg"></div>
              <div className="space-y-4">
                <div className="w-3/4 h-8 bg-neutral-200 rounded"></div>
                <div className="w-1/2 h-6 bg-neutral-200 rounded"></div>
                <div className="w-1/3 h-10 bg-neutral-200 rounded"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("de-CH", {
      style: "currency",
      currency: "CHF",
      minimumFractionDigits: 0
    }).format(price);
  };

  const formatMileage = (km: number) => {
    return new Intl.NumberFormat("de-CH").format(km);
  };

  const getFuelIcon = (fuel: string) => {
    return <Fuel className="w-4 h-4" />;
  };

  const getGearboxIcon = (gearbox: string) => {
    return <Settings className="w-4 h-4" />;
  };

  const images = listing.images && listing.images.length > 0 ? listing.images : [];
  const baseUrl = process.env.NODE_ENV === "production" 
    ? "https://www.buyauto.ch" 
    : "http://localhost:3000";
  const listingUrl = `${baseUrl}/fahrzeug/${listing.id}`;
  const ogImage = listing.imageUrl || (images.length > 0 ? images[0] : `${baseUrl}/buyauto-logo.png`);

  const dealType = (listing.deal_type ?? (listing as unknown as { deal_type?: string }).deal_type ?? "lease_takeover") as
    | "lease_takeover"
    | "direct_purchase";

  const leasingOffer = (listing as unknown as { leasing_offer?: any; leasingOffer?: any }).leasing_offer ??
    (listing as unknown as { leasing_offer?: any; leasingOffer?: any }).leasingOffer ??
    null;

  const purchasePriceCandidate =
    (listing as unknown as { listing_price?: unknown; price_chf?: unknown; purchase_price_chf?: unknown; purchasePriceCHF?: unknown }).purchasePriceCHF ??
    (listing as unknown as { listing_price?: unknown; price_chf?: unknown; purchase_price_chf?: unknown; purchasePriceCHF?: unknown }).purchase_price_chf ??
    (listing as unknown as { listing_price?: unknown; price_chf?: unknown; purchase_price_chf?: unknown; purchasePriceCHF?: unknown }).price_chf ??
    (listing as unknown as { listing_price?: unknown; price_chf?: unknown; purchase_price_chf?: unknown; purchasePriceCHF?: unknown }).listing_price ??
    null;

  const purchasePriceChf = typeof purchasePriceCandidate === "number" ? purchasePriceCandidate : null;
  const effectivePurchasePriceChf = purchasePriceChf;

  const teaserMonthlyChf =
    dealType === "direct_purchase" &&
    leasingOffer?.enabled === true &&
    effectivePurchasePriceChf
      ? estimateTeaserMonthlyRateChf({
          priceChf: effectivePurchasePriceChf,
          year: listing.year,
          mileageKm: listing.mileageKm,
          interestRatePct: Number(leasingOffer.interest_rate_pct),
          residualPctAdjustmentPp: leasingOffer.residual_pct_adjustment_pp ?? 0,
          termMonths: 60,
          kmPerYear: 10000,
          downPaymentPct: 5,
        })
      : null;

  const structuredPrice = dealType === "direct_purchase" ? (effectivePurchasePriceChf ?? 0) : listing.pricePerMonthCHF;
  const metaPriceText =
    dealType === "direct_purchase"
      ? effectivePurchasePriceChf
        ? `${formatPrice(effectivePurchasePriceChf)} Kaufpreis`
        : "Kaufpreis"
      : `${formatPrice(listing.pricePerMonthCHF)}/Monat`;

  return (
    <>
      <Head>
        <title>{`${listing.brand} ${listing.model} ${listing.year} - BuyAuto`}</title>
        <meta
          name="description"
          content={`${listing.brand} ${listing.model} ${listing.year} für ${metaPriceText} in ${listing.location}. Jetzt Auto-Angebot entdecken!`}
        />
        <link rel="canonical" href={listingUrl} />
        
        {/* Open Graph Meta Tags */}
        <meta property="og:title" content={`${listing.brand} ${listing.model} ${listing.year} - BuyAuto`} />
        <meta
          property="og:description"
          content={`${listing.brand} ${listing.model} ${listing.year} für ${metaPriceText} in ${listing.location}. Jetzt Auto-Angebot entdecken!`}
        />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={listingUrl} />
        <meta property="og:image" content={ogImage} />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:image:alt" content={`${listing.brand} ${listing.model} ${listing.year}`} />
        <meta property="og:site_name" content="BuyAuto" />
        
        {/* Twitter Card Meta Tags */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={`${listing.brand} ${listing.model} ${listing.year} - BuyAuto`} />
        <meta name="twitter:description" content={`${listing.brand} ${listing.model} ${listing.year} - ${metaPriceText}`} />
        <meta name="twitter:image" content={ogImage} />
      </Head>

      {/* Structured Data for Google */}
      <StructuredData 
        type="listing" 
        listingData={{
          id: listing.id,
          brand: listing.brand,
          model: listing.model,
          year: listing.year,
          price: structuredPrice,
          images: images
        }}
      />

      <div className="min-h-screen bg-neutral-50">
        <div className="bg-white border-b border-neutral-200 sticky top-0 z-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <Button
                variant="ghost"
                onClick={() => router.back()}
                className="flex items-center gap-2 hover:bg-neutral-100"
              >
                <ArrowLeft className="w-4 h-4" />
                Zurück
              </Button>
              <div className="text-sm text-neutral-600">
                ID: {listing.id.slice(0, 8)}...
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white rounded-2xl shadow-sm border border-neutral-200/60 overflow-hidden">
                <ImageGallery 
                  images={images}
                  brand={listing.brand}
                  model={listing.model}
                  premium={listing.premium}
                />
              </div>

              {/* Description Section */}
              {listing.description && listing.description.trim() && (
                <div className="bg-white rounded-2xl shadow-sm border border-neutral-200/60 p-8">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-neutral-100 rounded-lg flex items-center justify-center">
                      <FileText className="w-5 h-5 text-neutral-600" />
                    </div>
                    <h2 className="text-2xl font-bold text-neutral-900">Fahrzeugbeschreibung</h2>
                  </div>
                  <div className="prose prose-neutral max-w-none">
                    <p className="text-neutral-700 leading-relaxed whitespace-pre-wrap">
                      {listing.description}
                    </p>
                  </div>
                </div>
              )}

              <div className="bg-white rounded-2xl shadow-sm border border-neutral-200/60 p-8">
                <h2 className="text-2xl font-bold text-neutral-900 mb-6">Fahrzeugdetails</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-neutral-100 rounded-lg flex items-center justify-center">
                      <Calendar className="w-5 h-5 text-neutral-600" />
                    </div>
                    <div>
                      <p className="text-sm text-neutral-600">Baujahr</p>
                      <p className="font-semibold text-neutral-900">{listing.year}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-neutral-100 rounded-lg flex items-center justify-center">
                      <Settings className="w-5 h-5 text-neutral-600" />
                    </div>
                    <div>
                      <p className="text-sm text-neutral-600">Kilometerstand</p>
                      <p className="font-semibold text-neutral-900">{formatMileage(listing.mileageKm)} km</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-neutral-100 rounded-lg flex items-center justify-center">
                      {getFuelIcon(listing.fuel)}
                    </div>
                    <div>
                      <p className="text-sm text-neutral-600">Treibstoff</p>
                      <p className="font-semibold text-neutral-900">{listing.fuel}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-neutral-100 rounded-lg flex items-center justify-center">
                      {getGearboxIcon(listing.gearbox)}
                    </div>
                    <div>
                      <p className="text-sm text-neutral-600">Getriebe</p>
                      <p className="font-semibold text-neutral-900">{listing.gearbox}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-neutral-100 rounded-lg flex items-center justify-center">
                      <Users className="w-5 h-5 text-neutral-600" />
                    </div>
                    <div>
                      <p className="text-sm text-neutral-600">Karosserie</p>
                      <p className="font-semibold text-neutral-900">{listing.body}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-neutral-100 rounded-lg flex items-center justify-center">
                      <MapPin className="w-5 h-5 text-neutral-600" />
                    </div>
                    <div>
                      <p className="text-sm text-neutral-600">Standort</p>
                      <p className="font-semibold text-neutral-900">{listing.location}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <Card className="border-neutral-200/60 shadow-sm bg-white">
                <CardContent className="p-8">
                  <div className="text-center mb-6">
                    <h1 className="text-2xl font-bold text-neutral-900 mb-2">
                      {listing.brand} {listing.model}
                    </h1>
                    <p className="text-neutral-600">{listing.year}</p>
                  </div>

                  <div className="text-center mb-6">
                    {dealType === "direct_purchase" ? (
                      <>
                        <div className="text-4xl font-bold text-red-500 mb-1">
                          {effectivePurchasePriceChf ? formatPrice(effectivePurchasePriceChf) : "Preis auf Anfrage"}
                        </div>
                        <p className="text-neutral-600">Kaufpreis</p>
                        {teaserMonthlyChf && (
                          <p className="text-sm text-neutral-600 mt-2">
                            Ab CHF {teaserMonthlyChf.toLocaleString("de-CH")} / Monat
                          </p>
                        )}
                      </>
                    ) : (
                      <>
                        <div className="text-4xl font-bold text-red-500 mb-1">
                          {formatPrice(listing.pricePerMonthCHF)}
                        </div>
                        <p className="text-neutral-600">pro Monat</p>
                        {effectivePurchasePriceChf && (
                          <p className="text-sm text-neutral-600 mt-2">
                            Direktkauf: {formatPrice(effectivePurchasePriceChf)}
                          </p>
                        )}
                        <p className="text-sm text-neutral-600 mt-2">
                          {(listing.depositCHF && listing.depositCHF > 0)
                            ? `Einmalige Kaution: ${formatPrice(listing.depositCHF)}`
                            : "Keine Kaution"}
                        </p>
                      </>
                    )}
                  </div>

                  {dealType !== "direct_purchase" && (
                    <div className="space-y-4 mb-6">
                      <div className="flex justify-between items-center py-2 border-b border-neutral-100">
                        <span className="text-neutral-600">Restlaufzeit</span>
                        <span className="font-semibold">{listing.remainingMonths} Monate</span>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        {listing.remaining_km && (
                          <div>
                            <p className="text-sm text-neutral-500 mb-1">Verbleibende KM</p>
                            <p className="text-base font-semibold">{listing.remaining_km.toLocaleString("de-CH")} km</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="space-y-3">
                    <Button
                      onClick={() => setShowInquiryForm(true)}
                      size="lg"
                      className="w-full bg-red-500 hover:bg-red-600 text-white shadow-lg hover:shadow-xl transition-all"
                    >
                      <MessageCircle className="w-5 h-5 mr-2" />
                      Jetzt anfragen
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <OwnerMiniProfile
                sellerType={(listing as unknown as { seller_type?: string | null }).seller_type ?? null}
                name={
                  ((listing as unknown as { seller_name?: string | null }).seller_name ?? null) ||
                  ((listing as unknown as { garage_name?: string | null }).garage_name ?? null)
                }
                location={(listing.location ?? null) as unknown as string | null}
                avatarUrl={(() => {
                  const sellerType = (listing as unknown as { seller_type?: string | null }).seller_type;
                  const garageId = (listing as unknown as { garage_id?: string | null }).garage_id;
                  const base = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "");
                  if (sellerType === "garage" && garageId && base) {
                    const path = `garage-logos/${garageId}/logo_medium.webp`
                      .split("/")
                      .map((seg) => encodeURIComponent(seg))
                      .join("/");
                    return `${base}/storage/v1/object/public/listing-images/${path}`;
                  }
                  return (listing as unknown as { seller_avatar_url?: string | null }).seller_avatar_url ?? null;
                })()}
              />

              {dealType === "direct_purchase" && leasingOffer?.enabled === true && effectivePurchasePriceChf && (
                <LeasingCalculator
                  priceChf={effectivePurchasePriceChf}
                  year={listing.year}
                  mileageKm={listing.mileageKm}
                  offer={leasingOffer}
                />
              )}

              {listing.premium && (
                <Card className="border-amber-200/60 bg-gradient-to-br from-amber-50/50 to-white shadow-sm">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-3 mb-3">
                      <Award className="w-6 h-6 text-amber-500" />
                      <h3 className="text-lg font-semibold text-amber-900">Premium Inserat</h3>
                    </div>
                    <ul className="text-sm text-amber-800 space-y-1">
                      <li>• Geprüfte Qualität</li>
                      <li>• Prioritäre Sichtbarkeit</li>
                      <li>• Erweiterte Garantie</li>
                      <li>• Schnelle Bearbeitung</li>
                    </ul>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>

          <div className="mt-16">
            <SimilarListings listing={listing} />
          </div>
        </div>

        <InquiryForm
          listingId={listing.id}
          listingTitle={`${listing.brand} ${listing.model} ${listing.year}`}
          open={showInquiryForm}
          onOpenChange={setShowInquiryForm}
        />
      </div>
    </>
  );
}

export const getServerSideProps: GetServerSideProps<ListingDetailPageProps> = async (context) => {
  const { id } = context.params!;
  const { preview } = context.query;

  if (!id || typeof id !== "string") {
    return { notFound: true };
  }

  try {
    if (preview === "true") {
      return { props: { listing: null } };
    }

    const listing = await getPublishedListingById(id);
    
    if (!listing) {
      return { props: { listing: null, notFound: true } };
    }

    // Serialize listing to convert undefined to null
    const serializedListing = serializeListing(listing);

    return { props: { listing: serializedListing } };
  } catch (error) {
    console.error("Error in getServerSideProps for [id].tsx:", error);
    return { props: { listing: null, notFound: true } };
  }
};
