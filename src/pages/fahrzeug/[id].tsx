import { GetServerSideProps } from "next";
import { useState, useEffect } from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import { ArrowLeft, MapPin, Calendar, Settings, Fuel, Users, Shield, Award, Phone, Mail, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ListingDetail } from "@/lib/buyauto/types";
import { getPublishedListingById, getSimilarListings } from "@/services/listingsService";
import ImageGallery from "@/components/buyauto/detail/ImageGallery";
import TrustBadges from "@/components/buyauto/detail/TrustBadges";
import InquiryForm from "@/components/buyauto/detail/InquiryForm";
import SimilarListings from "@/components/buyauto/detail/SimilarListings";

interface ListingDetailPageProps {
  listing: ListingDetail | null;
  notFound?: boolean;
}

export default function ListingDetailPage({ listing: initialListing, notFound }: ListingDetailPageProps) {
  const [listing, setListing] = useState<ListingDetail | null>(initialListing);
  const [isLoading, setIsLoading] = useState(!initialListing && !notFound);
  const [showInquiryForm, setShowInquiryForm] = useState(false);
  const router = useRouter();
  const { id } = router.query;

  // Client-side fetch if SSR failed
  useEffect(() => {
    if (!listing && !notFound && id && typeof id === 'string') {
      const fetchListing = async () => {
        try {
          const fetchedListing = await getPublishedListingById(id);
          setListing(fetchedListing);
        } catch (error) {
          console.error('Error fetching listing:', error);
        } finally {
          setIsLoading(false);
        }
      };

      fetchListing();
    }
  }, [id, listing, notFound]);

  if (notFound) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-neutral-900 mb-4">Inserat nicht gefunden</h1>
          <p className="text-neutral-600 mb-6">
            Das gewünschte Inserat existiert nicht oder ist nicht mehr verfügbar.
          </p>
          <Button onClick={() => router.push('/suche')} className="bg-red-500 hover:bg-red-600 text-white">
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
    return new Intl.NumberFormat('de-CH', {
      style: 'currency',
      currency: 'CHF',
      minimumFractionDigits: 0
    }).format(price);
  };

  const formatMileage = (km: number) => {
    return new Intl.NumberFormat('de-CH').format(km);
  };

  const getFuelIcon = (fuel: string) => {
    return <Fuel className="w-4 h-4" />;
  };

  const getGearboxIcon = (gearbox: string) => {
    return <Settings className="w-4 h-4" />;
  };

  const images = listing.images && listing.images.length > 0 ? listing.images : [];
  const hasImages = images.length > 0;

  return (
    <>
      <Head>
        <title>{`${listing.brand} ${listing.model} ${listing.year} - BuyAuto`}</title>
        <meta name="description" content={`${listing.brand} ${listing.model} ${listing.year} für ${formatPrice(listing.pricePerMonthCHF)}/Monat in ${listing.location}. Jetzt Auto-Leasing übernehmen!`} />
        <meta property="og:title" content={`${listing.brand} ${listing.model} ${listing.year} - BuyAuto`} />
        <meta property="og:description" content={`${listing.brand} ${listing.model} ${listing.year} für ${formatPrice(listing.pricePerMonthCHF)}/Monat in ${listing.location}. Jetzt Auto-Leasing übernehmen!`} />
        {listing.imageUrl && <meta property="og:image" content={listing.imageUrl} />}
      </Head>

      <div className="min-h-screen bg-neutral-50">
        {/* Header */}
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

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column - Images and Details */}
            <div className="lg:col-span-2 space-y-8">
              {/* Image Gallery */}
              <div className="bg-white rounded-2xl shadow-sm border border-neutral-200/60 overflow-hidden">
                <ImageGallery 
                  images={images}
                  brand={listing.brand}
                  model={listing.model}
                  premium={listing.premium}
                />
              </div>

              {/* Vehicle Details */}
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

              {/* Trust Section */}
              <TrustBadges />
            </div>

            {/* Right Column - Pricing and Contact */}
            <div className="space-y-6">
              {/* Pricing Card */}
              <Card className="border-neutral-200/60 shadow-sm bg-white">
                <CardContent className="p-8">
                  <div className="text-center mb-6">
                    <h1 className="text-2xl font-bold text-neutral-900 mb-2">
                      {listing.brand} {listing.model}
                    </h1>
                    <p className="text-neutral-600">{listing.year}</p>
                  </div>

                  <div className="text-center mb-6">
                    <div className="text-4xl font-bold text-red-500 mb-1">
                      {formatPrice(listing.pricePerMonthCHF)}
                    </div>
                    <p className="text-neutral-600">pro Monat</p>
                  </div>

                  <div className="space-y-4 mb-6">
                    <div className="flex justify-between items-center py-2 border-b border-neutral-100">
                      <span className="text-neutral-600">Restlaufzeit</span>
                      <span className="font-semibold">{listing.remainingMonths} Monate</span>
                    </div>
                    {listing.depositCHF && (
                      <div className="flex justify-between items-center py-2 border-b border-neutral-100">
                        <span className="text-neutral-600">Kaution</span>
                        <span className="font-semibold">{formatPrice(listing.depositCHF)}</span>
                      </div>
                    )}
                  </div>

                  <div className="space-y-3">
                    <Button
                      onClick={() => setShowInquiryForm(true)}
                      size="lg"
                      className="w-full bg-red-500 hover:bg-red-600 text-white shadow-lg hover:shadow-xl transition-all"
                    >
                      <MessageCircle className="w-5 h-5 mr-2" />
                      Jetzt anfragen
                    </Button>
                    <Button
                      variant="outline"
                      size="lg"
                      className="w-full bg-transparent hover:bg-neutral-50 border-neutral-300"
                      onClick={() => {
                        const subject = encodeURIComponent(`Interesse an ${listing.brand} ${listing.model} ${listing.year}`);
                        const body = encodeURIComponent(`Hallo,\n\nIch interessiere mich für das Fahrzeug:\n\n${listing.brand} ${listing.model} ${listing.year}\nPreis: ${formatPrice(listing.pricePerMonthCHF)}/Monat\nInserat-ID: ${listing.id}\n\nBitte kontaktieren Sie mich für weitere Informationen.\n\nFreundliche Grüße`);
                        window.location.href = `mailto:kontakt@buyauto.ch?subject=${subject}&body=${body}`;
                      }}
                    >
                      <Mail className="w-5 h-5 mr-2" />
                      E-Mail senden
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Premium Badge */}
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

              {/* Contact Info */}
              <Card className="border-neutral-200/60 shadow-sm bg-white">
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold text-neutral-900 mb-4">Kontakt & Support</h3>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <Phone className="w-4 h-4 text-neutral-600" />
                      <span className="text-sm text-neutral-600">+41 44 123 45 67</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Mail className="w-4 h-4 text-neutral-600" />
                      <span className="text-sm text-neutral-600">kontakt@buyauto.ch</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Shield className="w-4 h-4 text-neutral-600" />
                      <span className="text-sm text-neutral-600">Sicher & Vertrauenswürdig</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Similar Listings */}
          <div className="mt-16">
            <SimilarListings listing={listing} />
          </div>
        </div>

        {/* Inquiry Form Modal */}
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

  if (!id || typeof id !== 'string') {
    return {
      notFound: true,
    };
  }

  try {
    // Use the secure published listings function - only shows published listings
    const listing = await getPublishedListingById(id);
    
    if (!listing) {
      return {
        props: { listing: null, notFound: true },
      };
    }

    return {
      props: { listing },
    };
  } catch (error) {
    console.error('Error in getServerSideProps:', error);
    return {
      props: { listing: null, notFound: true },
    };
  }
};