
import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Head from "next/head";
import Link from "next/link";
import { ChevronRight, Heart, MessageSquare, MapPin, Clock, Fuel, Gauge, Settings, Calendar, Shield, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { getPublishedListingById, getSimilarListings } from "@/services/listingsService";
import { ListingDetail, Listing } from "@/lib/buyauto/types";
import Header from "@/components/buyauto/Header";
import Footer from "@/components/buyauto/Footer";
import ImageGallery from "@/components/buyauto/detail/ImageGallery";
import InquiryForm from "@/components/buyauto/detail/InquiryForm";
import SimilarListings from "@/components/buyauto/detail/SimilarListings";
import TrustBadges from "@/components/buyauto/detail/TrustBadges";

export default function ListingDetailPage() {
  const router = useRouter();
  const { id } = router.query;
  const [listing, setListing] = useState<ListingDetail | null>(null);
  const [similarListings, setSimilarListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [showInquiryForm, setShowInquiryForm] = useState(false);

  useEffect(() => {
    if (!id || typeof id !== "string") return;

    const loadListing = async () => {
      setLoading(true);
      setNotFound(false);

      try {
        const data = await getPublishedListingById(id);
        if (!data) {
          setNotFound(true);
          return;
        }

        setListing(data);

        // Load similar listings
        const similar = await getSimilarListings(data, 6);
        setSimilarListings(similar);
      } catch (error) {
        console.error("Error loading listing:", error);
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    };

    loadListing();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-neutral-50 to-white">
        <Header />
        <div className="container mx-auto px-4 py-16">
          <div className="animate-pulse space-y-8">
            <div className="h-8 bg-neutral-200 rounded-xl w-2/3"></div>
            <div className="grid lg:grid-cols-2 gap-8">
              <div className="aspect-video bg-neutral-200 rounded-3xl"></div>
              <div className="space-y-4">
                <div className="h-12 bg-neutral-200 rounded-xl"></div>
                <div className="h-6 bg-neutral-200 rounded-lg w-3/4"></div>
                <div className="h-16 bg-neutral-200 rounded-xl"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (notFound || !listing) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-neutral-50 to-white">
        <Header />
        <div className="container mx-auto px-4 py-16 text-center">
          <div className="max-w-md mx-auto space-y-6">
            <div className="text-6xl">🚗</div>
            <h1 className="text-2xl font-bold text-neutral-900">
              Fahrzeug nicht gefunden
            </h1>
            <p className="text-neutral-600">
              Dieses Inserat ist nicht mehr verfügbar oder wurde noch nicht freigeschaltet.
            </p>
            <Button asChild className="bg-red-600 hover:bg-red-700">
              <Link href="/suche">Alle Fahrzeuge ansehen</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const formatPrice = (price: number) => `CHF ${price.toLocaleString("de-CH")}`;
  const formatMileage = (km: number) => `${km.toLocaleString("de-CH")} km`;
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("de-CH", {
      day: "numeric",
      month: "long",
      year: "numeric"
    });
  };

  const getPlanLabel = (plan?: string) => {
    switch (plan) {
      case "free30": return "Standard 30 Tage (Gratis)";
      case "premium30": return "Premium 30 Tage (CHF 30)";
      case "paid90": return "90 Tage (CHF 50)";
      case "unlimited": return "Unlimitiert (CHF 190)";
      default: return "Standard";
    }
  };

  const seoTitle = `${listing.brand} ${listing.model} ${listing.year} – Leasingübernahme Schweiz | BuyAuto`;
  const seoDescription = `${listing.brand} ${listing.model} ${listing.year} ab ${formatPrice(listing.pricePerMonthCHF)} pro Monat. ${listing.remainingMonths} Monate Restlaufzeit. ${formatMileage(listing.mileageKm)} in ${listing.location}.`;

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "BreadcrumbList",
        "itemListElement": [
          {
            "@type": "ListItem",
            "position": 1,
            "name": "Home",
            "item": "https://buyauto.ch"
          },
          {
            "@type": "ListItem",
            "position": 2,
            "name": "Fahrzeuge",
            "item": "https://buyauto.ch/suche"
          },
          {
            "@type": "ListItem",
            "position": 3,
            "name": `${listing.brand} ${listing.model} ${listing.year}`,
            "item": `https://buyauto.ch/fahrzeug/${listing.id}`
          }
        ]
      },
      {
        "@type": "Vehicle",
        "name": `${listing.brand} ${listing.model}`,
        "brand": listing.brand,
        "model": listing.model,
        "vehicleModelDate": listing.year.toString(),
        "bodyType": listing.body,
        "fuelType": listing.fuel,
        "vehicleTransmission": listing.gearbox,
        "mileageFromOdometer": {
          "@type": "QuantitativeValue",
          "value": listing.mileageKm,
          "unitCode": "KMT"
        },
        "image": listing.cover_image_url || listing.imageUrl
      },
      {
        "@type": "Offer",
        "name": `Leasingübernahme ${listing.brand} ${listing.model}`,
        "description": `${listing.brand} ${listing.model} ${listing.year} Leasingübernahme`,
        "price": listing.pricePerMonthCHF,
        "priceCurrency": "CHF",
        "priceSpecification": {
          "@type": "UnitPriceSpecification",
          "price": listing.pricePerMonthCHF,
          "priceCurrency": "CHF",
          "unitText": "Monat"
        },
        "availability": "https://schema.org/InStock",
        "itemOffered": {
          "@type": "Vehicle",
          "name": `${listing.brand} ${listing.model}`,
          "brand": listing.brand,
          "model": listing.model,
          "vehicleModelDate": listing.year.toString(),
          "bodyType": listing.body,
          "fuelType": listing.fuel,
          "vehicleTransmission": listing.gearbox,
          "mileageFromOdometer": {
            "@type": "QuantitativeValue",
            "value": listing.mileageKm,
            "unitCode": "KMT"
          }
        },
        "areaServed": "CH",
        "url": `https://buyauto.ch/fahrzeug/${listing.id}`
      }
    ]
  };

  return (
    <>
      <Head>
        <title>{seoTitle}</title>
        <meta name="description" content={seoDescription} />
        <meta property="og:title" content={seoTitle} />
        <meta property="og:description" content={seoDescription} />
        <meta property="og:image" content={listing.cover_image_url || listing.imageUrl} />
        <meta property="og:url" content={`https://buyauto.ch/fahrzeug/${listing.id}`} />
        <meta property="og:type" content="product" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={seoTitle} />
        <meta name="twitter:description" content={seoDescription} />
        <meta name="twitter:image" content={listing.cover_image_url || listing.imageUrl} />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-neutral-50 to-white">
        <Header />

        {/* Breadcrumbs */}
        <div className="border-b border-neutral-200/60 bg-white/80 backdrop-blur-sm">
          <div className="container mx-auto px-4 py-3">
            <nav className="flex items-center space-x-2 text-sm text-neutral-600">
              <Link href="/" className="hover:text-red-600 transition-colors">
                Home
              </Link>
              <ChevronRight className="w-4 h-4" />
              <Link href="/suche" className="hover:text-red-600 transition-colors">
                Fahrzeuge
              </Link>
              <ChevronRight className="w-4 h-4" />
              <span className="text-neutral-900 font-medium">
                {listing.brand} {listing.model} {listing.year}
              </span>
            </nav>
          </div>
        </div>

        <main className="container mx-auto px-4 py-8 space-y-12">
          {/* Title & Key Info */}
          <div className="space-y-4">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-3xl lg:text-4xl font-bold text-neutral-900">
                {listing.brand} {listing.model} · {listing.year}
              </h1>
              {listing.premium && (
                <Badge className="bg-gradient-to-r from-red-500 to-red-600 text-white border-0 shadow-lg shadow-red-500/20 animate-pulse">
                  Premium
                </Badge>
              )}
            </div>
            
            <div className="flex flex-wrap gap-3">
              <Badge variant="outline" className="bg-red-50 border-red-200 text-red-700 font-semibold text-base px-4 py-2">
                {formatPrice(listing.pricePerMonthCHF)} / Monat
              </Badge>
              <Badge variant="outline" className="bg-neutral-50 border-neutral-200 text-neutral-700">
                Restlaufzeit {listing.remainingMonths} Mon.
              </Badge>
              <Badge variant="outline" className="bg-neutral-50 border-neutral-200 text-neutral-700">
                {formatMileage(listing.mileageKm)}
              </Badge>
              <Badge variant="outline" className="bg-neutral-50 border-neutral-200 text-neutral-700">
                {listing.fuel} · {listing.gearbox} · {listing.body}
              </Badge>
              <Badge variant="outline" className="bg-neutral-50 border-neutral-200 text-neutral-700">
                <MapPin className="w-3 h-3 mr-1" />
                {listing.location} ({listing.canton_code})
              </Badge>
            </div>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Left Column - Gallery */}
            <div className="lg:col-span-2">
              <ImageGallery 
                images={listing.image_urls.length > 0 ? listing.image_urls : [listing.cover_image_url || listing.imageUrl]}
                alt={`${listing.brand} ${listing.model} ${listing.year}`}
              />
            </div>

            {/* Right Column - Actions & Details */}
            <div className="space-y-6">
              {/* Price & Actions Card */}
              <Card className="border-0 shadow-xl shadow-neutral-900/5 bg-gradient-to-br from-white to-neutral-50 rounded-3xl overflow-hidden">
                <CardContent className="p-8 space-y-6">
                  <div className="text-center space-y-2">
                    <div className="text-3xl font-bold text-neutral-900">
                      {formatPrice(listing.pricePerMonthCHF)}
                    </div>
                    <div className="text-neutral-600 font-medium">pro Monat</div>
                  </div>

                  <Separator className="bg-gradient-to-r from-transparent via-neutral-200 to-transparent" />

                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-neutral-600">Restlaufzeit:</span>
                      <span className="font-semibold">{listing.remainingMonths} Monate</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-neutral-600">Kaution:</span>
                      <span className="font-semibold">
                        {listing.depositCHF ? formatPrice(listing.depositCHF) : "Keine Kaution"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-neutral-600">Kanton:</span>
                      <span className="font-semibold">{listing.canton_code}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-neutral-600">Erstellt:</span>
                      <span className="font-semibold">{formatDate(listing.created_at)}</span>
                    </div>
                    {listing.expires_at && (
                      <div className="flex justify-between">
                        <span className="text-neutral-600">Läuft ab:</span>
                        <span className="font-semibold">{formatDate(listing.expires_at)}</span>
                      </div>
                    )}
                    {!listing.expires_at && (
                      <div className="flex justify-between">
                        <span className="text-neutral-600">Gültigk.:</span>
                        <span className="font-semibold">Unlimitiert</span>
                      </div>
                    )}
                  </div>

                  <Separator className="bg-gradient-to-r from-transparent via-neutral-200 to-transparent" />

                  <div className="space-y-3">
                    <Button
                      onClick={() => setShowInquiryForm(true)}
                      className="w-full bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200"
                      size="lg"
                    >
                      <MessageSquare className="w-4 h-4 mr-2" />
                      Anfrage senden
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full bg-transparent hover:bg-neutral-50 border-neutral-300 hover:border-red-300 hover:text-red-600 transition-all duration-200"
                      size="lg"
                    >
                      <Heart className="w-4 h-4 mr-2" />
                      Merken
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Trust Badges */}
              <TrustBadges />
            </div>
          </div>

          {/* Details Sections */}
          <div className="grid md:grid-cols-3 gap-6">
            {/* Leasing Details */}
            <Card className="border-0 shadow-lg shadow-neutral-900/5 bg-white rounded-2xl overflow-hidden group hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
              <CardContent className="p-6 space-y-4">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                    <Clock className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="font-semibold text-lg text-neutral-900">Leasingdetails</h3>
                </div>
                <div className="space-y-3">
                  <DetailRow label="Monatliche Rate" value={formatPrice(listing.pricePerMonthCHF)} />
                  <DetailRow label="Restlaufzeit" value={`${listing.remainingMonths} Monate`} />
                  <DetailRow 
                    label="Kaution" 
                    value={listing.depositCHF ? formatPrice(listing.depositCHF) : "Keine Kaution"} 
                  />
                  <DetailRow label="Standort" value={`${listing.location}, ${listing.canton_code}`} />
                </div>
              </CardContent>
            </Card>

            {/* Vehicle Details */}
            <Card className="border-0 shadow-lg shadow-neutral-900/5 bg-white rounded-2xl overflow-hidden group hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
              <CardContent className="p-6 space-y-4">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center">
                    <Gauge className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="font-semibold text-lg text-neutral-900">Fahrzeugdaten</h3>
                </div>
                <div className="space-y-3">
                  <DetailRow label="Marke" value={listing.brand} />
                  <DetailRow label="Modell" value={listing.model} />
                  <DetailRow label="Jahr" value={listing.year.toString()} />
                  <DetailRow label="Kilometerstand" value={formatMileage(listing.mileageKm)} />
                  <DetailRow label="Karosserie" value={listing.body} />
                  <DetailRow label="Antrieb" value={listing.fuel} />
                  <DetailRow label="Getriebe" value={listing.gearbox} />
                </div>
              </CardContent>
            </Card>

            {/* Listing Info */}
            <Card className="border-0 shadow-lg shadow-neutral-900/5 bg-white rounded-2xl overflow-hidden group hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
              <CardContent className="p-6 space-y-4">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center">
                    <Settings className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="font-semibold text-lg text-neutral-900">Inserats-Infos</h3>
                </div>
                <div className="space-y-3">
                  <DetailRow label="Plan" value={getPlanLabel(listing.price_plan)} />
                  <DetailRow label="Premium aktiv" value={listing.premium ? "Ja" : "Nein"} />
                  <DetailRow label="Erstellt" value={formatDate(listing.created_at)} />
                  <DetailRow 
                    label="Ablauf" 
                    value={listing.expires_at ? formatDate(listing.expires_at) : "Unlimitiert"} 
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Similar Listings */}
          {similarListings.length > 0 && (
            <SimilarListings listings={similarListings} />
          )}
        </main>

        <Footer />

        {/* Inquiry Form Modal */}
        <InquiryForm
          listing={listing}
          isOpen={showInquiryForm}
          onClose={() => setShowInquiryForm(false)}
        />
      </div>
    </>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-center py-1">
      <span className="text-neutral-600 text-sm">{label}:</span>
      <span className="font-semibold text-sm text-neutral-900">{value}</span>
    </div>
  );
}
