import { GetServerSideProps } from "next";
import { useEffect, useMemo, useState } from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import dynamic from "next/dynamic";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ListingDetail } from "@/lib/buyauto/types";
import { getPublishedListingById, getUserListingById, transformPublicRowToListingDetail } from "@/services/listingsService";
import { estimateTeaserMonthlyRateChf } from "@/lib/buyauto/leasingMath";
import { ListingDetailV2 } from "@/components/buyauto/detail/ListingDetailV2";
import { getGaragePublicById } from "@/services/garageService";
import type { GaragePublicInfo } from "@/services/garageService";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { buildListingHref, buildListingSlugSegment, extractListingIdFromParam, listingSlugPrefix } from "@/lib/buyauto/listingUrl";
import { kaufartOf } from "@/lib/buyauto/kaufart";
import { listingFullName, listingMetaDescription, listingSeoTitle } from "@/lib/buyauto/listingSeo";
import { publicSellerName } from "@/lib/buyauto/sellerName";
import {
  isOwnerOrAdmin,
  isRetiredListing,
  readListingLifecycle,
  retiredListingDestination,
} from "@/services/listingLifecycleService";
import { BreadcrumbJsonLd } from "@/components/buyauto/Breadcrumbs";
import { safeFreeText, toDealType, track } from "@/lib/analytics";
import {
  buildVehicleDescription,
  driveWheelConfigurationFor,
  firstRegistrationIso,
  leaseLengthIso,
  parseListingPlace,
} from "@/lib/buyauto/vehicleSchema";

const SimilarListings = dynamic(() => import("@/components/buyauto/detail/SimilarListings"), {
  // No extra top margin: the bottomContent wrapper already applies mt-10,
  // matching the real component's position so the chunk swap doesn't shift.
  loading: () => <div className="h-96 bg-neutral-50 animate-pulse rounded-2xl" />,
});

interface ListingDetailPageProps {
  listing: ListingDetail | null;
  notFound?: boolean;
  // Set when the id is not a live listing (handled with a 404/410 status in getServerSideProps).
  gone?: boolean;
}

function serializeListing(listing: ListingDetail | null): ListingDetail | null {
  if (!listing) return null;

  return {
    ...listing,
    description: listing.description ?? null,
    imageUrl: listing.imageUrl ?? null,
    depositCHF: listing.depositCHF ?? null,
    cover_image_url: (listing as unknown as { cover_image_url?: string | null }).cover_image_url ?? null,
    remaining_km: (listing as unknown as { remaining_km?: number | null }).remaining_km ?? null,
    vin: listing.vin ?? null,
    makeId: listing.makeId ?? null,
    modelId: listing.modelId ?? null,
    variantId: listing.variantId ?? null,
    powerHp: listing.powerHp ?? null,
    drivetrain: listing.drivetrain ?? null,
    firstRegistration: listing.firstRegistration ?? null,
  };
}

export default function ListingDetailPage({ listing: initialListing, notFound, gone }: ListingDetailPageProps) {
  const router = useRouter();
  const { id } = router.query;
  const { user } = useAuth();

  const listingId = useMemo(() => {
    if (typeof id !== "string") return null;
    const extracted = extractListingIdFromParam(id);
    return extracted || null;
  }, [id]);

  const [listing, setListing] = useState<ListingDetail | null>(initialListing);
  const [isLoading, setIsLoading] = useState(!initialListing && !notFound);
  const [clientNotFound, setClientNotFound] = useState(false);
  const [isOwnerPreview, setIsOwnerPreview] = useState(false);

  // Keep the displayed listing in sync when navigating between detail pages.
  // Next.js reuses this component instance across /fahrzeug/[id] route changes,
  // so `useState(initialListing)` alone would keep showing the first listing —
  // making every similar-listing click appear to open the same vehicle.
  useEffect(() => {
    setListing(initialListing ?? null);
    setClientNotFound(false);
    setIsOwnerPreview(false);
    setIsLoading(!initialListing && !notFound);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [listingId, initialListing, notFound]);

  const [garage, setGarage] = useState<GaragePublicInfo | null>(null);

  // GA4 view_item: once per listing shown (a similar-listing click re-fires
  // for the new id). Not for the owner's ?preview=true view.
  useEffect(() => {
    if (!listing?.id || router.query.preview === "true" || isOwnerPreview) return;
    const dealType = toDealType(listing);
    const price = dealType === "lease_takeover"
      ? listing.leasing_offer?.lease_takeover_offer?.price_per_month_chf ?? listing.pricePerMonthCHF
      : listing.purchasePriceCHF;
    track("view_item", {
      listing_id: listing.id,
      deal_type: dealType,
      brand: safeFreeText(listing.brand) ?? "",
      model: safeFreeText(listing.model) ?? "",
      price: typeof price === "number" && Number.isFinite(price) ? price : 0,
      currency: "CHF",
    });
    // Keyed on the id only: re-renders of the same listing are not new views.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [listing?.id, router.query.preview, isOwnerPreview]);

  useEffect(() => {
    if (!listing && !notFound && !clientNotFound && listingId) {
      const fetchListing = async () => {
        setIsLoading(true);
        try {
          const isPreview = router.query.preview === "true";

          let fetchedListing = isPreview ? await getUserListingById(listingId) : await getPublishedListingById(listingId);

          if (!fetchedListing && isPreview && user) {
            const ownerListing = await getUserListingById(listingId);
            if (ownerListing) {
              fetchedListing = ownerListing;
              setIsOwnerPreview(true);
            }
          }

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
  }, [listingId, listing, notFound, clientNotFound, router.query.preview, user]);

  useEffect(() => {
    const preview = router.query.preview === "true";
    if (!listing?.id) return;
    if (preview) return;
    if (isOwnerPreview) return;
    if (typeof window === "undefined") return;

    const run = async () => {
      let viewerId: string | null = null;

      try {
        const { data, error } = await supabase.auth.getUser();
        if (error) viewerId = null;
        else viewerId = data.user?.id ?? null;
      } catch {
        viewerId = null;
      }

      let viewerKey = viewerId;

      if (!viewerKey) {
        try {
          const existing = window.sessionStorage.getItem("buyauto:anon-viewer");
          if (existing) viewerKey = existing;
          else {
            const created = `anon_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
            window.sessionStorage.setItem("buyauto:anon-viewer", created);
            viewerKey = created;
          }
        } catch {
          viewerKey = null;
        }
      }

      const storageKey = viewerKey ? `buyauto:viewed:${listing.id}:${viewerKey}` : null;

      let shouldCount = true;

      try {
        if (storageKey) {
          if (window.sessionStorage.getItem(storageKey) === "1") shouldCount = false;
          else window.sessionStorage.setItem(storageKey, "1");
        }
      } catch {
        shouldCount = true;
      }

      if (!shouldCount) return;

      void fetch("/api/listings/view", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ listing_id: listing.id }),
      }).catch((error) => {
        console.warn("View tracking failed:", error);
      });
    };

    void run();
  }, [listing?.id, router.query.preview, isOwnerPreview]);

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      if (!listing) {
        setGarage(null);
        return;
      }

      const garageId = typeof listing.garage_id === "string" ? listing.garage_id : null;
      if (!garageId) {
        setGarage(null);
        return;
      }

      const data = await getGaragePublicById(garageId);
      if (cancelled) return;
      setGarage(data);
    };

    void run();

    return () => {
      cancelled = true;
    };
  }, [listing?.id, listing?.garage_id]);

  const images = useMemo(() => (Array.isArray(listing?.images) ? listing?.images : []) ?? [], [listing]);

  if (notFound || clientNotFound || gone) {
    return (
      <>
        <Head>
          <title>Auto verkauft | BuyAuto</title>
          <meta name="robots" content="noindex,follow" />
        </Head>
        <div className="min-h-screen bg-neutral-50 flex items-center justify-center px-4">
          <div className="text-center max-w-md">
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-neutral-200 flex items-center justify-center">
              <svg className="w-10 h-10 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-neutral-900 mb-3">Dieses Auto wurde verkauft</h1>
            <p className="text-neutral-600 mb-8">
              Das Inserat ist nicht mehr verfügbar. Entdecke ähnliche Angebote in unserer Suche.
            </p>
            <Button
              onClick={() => router.push("/suche")}
              className="bg-red-500 hover:bg-red-600 text-white rounded-2xl px-8"
            >
              Weitere Autos entdecken
            </Button>
          </div>
        </div>
      </>
    );
  }

  if (isLoading || !listing) {
    return (
      <div className="min-h-screen bg-neutral-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="animate-pulse space-y-6">
            <div className="w-32 h-10 bg-neutral-200 rounded-2xl" />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="aspect-[4/3] bg-neutral-200 rounded-3xl" />
              <div className="space-y-4">
                <div className="w-3/4 h-8 bg-neutral-200 rounded-2xl" />
                <div className="w-1/2 h-6 bg-neutral-200 rounded-2xl" />
                <div className="w-1/3 h-10 bg-neutral-200 rounded-2xl" />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const baseUrl = process.env.NODE_ENV === "production" ? "https://www.buyauto.ch" : "http://localhost:3000";
  const listingUrl = `${baseUrl}${buildListingHref({ id: listing.id, brand: listing.brand, model: listing.model })}`;
  const ogImage = listing.imageUrl || (images.length > 0 ? images[0] : `${baseUrl}/buyauto-logo.png`);

  // Display type from the one Kaufart rule (lib/buyauto/kaufart), never the stored deal_type.
  const kaufart = kaufartOf(listing);
  const isDirectPurchase = kaufart === "direct_purchase";

  const leasingOffer = (listing as unknown as { leasing_offer?: any; leasingOffer?: any }).leasing_offer ??
    (listing as unknown as { leasing_offer?: any; leasingOffer?: any }).leasingOffer ??
    null;

  const purchasePriceChf =
    typeof listing.purchasePriceCHF === "number" && listing.purchasePriceCHF > 0 ? listing.purchasePriceCHF : null;

  // "Leasing" teaser (new-leasing financing on a Direktkauf): unchanged handling.
  const teaserMonthlyChf =
    isDirectPurchase &&
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

  const teaserMonthlyLabel =
    typeof teaserMonthlyChf === "number"
      ? `Ab CHF ${new Intl.NumberFormat("de-CH", { maximumFractionDigits: 0 }).format(Math.round(teaserMonthlyChf))} / Monat`
      : null;

  // Prefer the stored title — it carries the decoded trim ("BMW 5 Series 530i
  // xDrive"), which is what long-tail searches match — over bare brand+model.
  const seoName = listing.title?.trim() || `${listing.brand} ${listing.model}`;
  const pageTitle = listingSeoTitle(listing);
  const metaDescription = listingMetaDescription(listing);

  // Per-Kaufart Offer: a one-time sale price for Direktkauf, a monthly rate for
  // Leasingübernahme (never a monthly unit on a purchase price).
  const offerPrice = isDirectPurchase
    ? purchasePriceChf
    : typeof listing.pricePerMonthCHF === "number" && listing.pricePerMonthCHF > 0
      ? listing.pricePerMonthCHF
      : null;

  const leaseLength = isDirectPurchase ? null : leaseLengthIso(listing.remainingMonths);
  const availableAtOrFrom = parseListingPlace(listing.location, listing.canton_code);

  const vehicleOffer =
    typeof offerPrice === "number" && offerPrice > 0
      ? {
          "@type": "Offer",
          price: offerPrice,
          priceCurrency: "CHF",
          availability: "https://schema.org/InStock",
          itemCondition: "https://schema.org/UsedCondition",
          url: listingUrl,
          ...(leaseLength ? { leaseLength } : {}),
          ...(availableAtOrFrom
            ? {
                availableAtOrFrom: {
                  "@type": "Place",
                  address: { "@type": "PostalAddress", ...availableAtOrFrom },
                },
              }
            : {}),
          ...(isDirectPurchase
            ? {}
            : {
                priceSpecification: {
                  "@type": "UnitPriceSpecification",
                  price: offerPrice,
                  priceCurrency: "CHF",
                  unitCode: "MON",
                  unitText: "MONTH",
                },
              }),
        }
      : undefined;

  const dateVehicleFirstRegistered = firstRegistrationIso(listing.firstRegistration);
  const driveWheelConfiguration = driveWheelConfigurationFor(listing.drivetrain);
  const schemaDescription = buildVehicleDescription({
    dealType: kaufart,
    brand: listing.brand,
    model: listing.model,
    year: listing.year,
    pricePerMonthCHF: listing.pricePerMonthCHF ?? null,
    remainingMonths: listing.remainingMonths ?? null,
    purchasePriceCHF: purchasePriceChf,
    mileageKm: listing.mileageKm ?? null,
    depositCHF: isDirectPurchase ? null : listing.depositCHF ?? null,
  });

  const vehicleJsonLd = {
    "@context": "https://schema.org",
    "@type": "Car",
    name: `${listingFullName(listing)} ${listing.year}`,
    brand: { "@type": "Brand", name: listing.brand },
    model: listing.model,
    vehicleModelDate: listing.year,
    url: listingUrl,
    image: images.length > 0 ? images : undefined,
    ...(schemaDescription ? { description: schemaDescription } : {}),
    ...(dateVehicleFirstRegistered ? { dateVehicleFirstRegistered } : {}),
    ...(driveWheelConfiguration ? { driveWheelConfiguration } : {}),
    ...(listing.mileageKm
      ? { mileageFromOdometer: { "@type": "QuantitativeValue", value: listing.mileageKm, unitCode: "KMT" } }
      : {}),
    ...(listing.fuel ? { fuelType: listing.fuel } : {}),
    ...(listing.gearbox ? { vehicleTransmission: listing.gearbox } : {}),
    ...(listing.body ? { bodyType: listing.body } : {}),
    ...(listing.vin ? { vehicleIdentificationNumber: listing.vin } : {}),
    ...(typeof listing.powerHp === "number" && listing.powerHp > 0
      ? {
          vehicleEngine: {
            "@type": "EngineSpecification",
            enginePower: { "@type": "QuantitativeValue", value: listing.powerHp, unitCode: "BHP" },
          },
        }
      : {}),
    ...(vehicleOffer ? { offers: vehicleOffer } : {}),
  };

  return (
    <>
      <Head>
        <title>{pageTitle}</title>
        <meta name="description" content={metaDescription} />
        <link rel="canonical" href={listingUrl} />

        <meta property="og:title" content={pageTitle} />
        <meta property="og:description" content={metaDescription} />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={listingUrl} />
        <meta property="og:image" content={ogImage} />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:image:alt" content={`${listing.brand} ${listing.model} ${listing.year}`} />
        <meta property="og:site_name" content="BuyAuto" />

        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={pageTitle} />
        <meta name="twitter:description" content={metaDescription} />
        <meta name="twitter:image" content={ogImage} />

        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(vehicleJsonLd) }}
        />
      </Head>

      {/* Schema-only: the detail layout has no room for a visible crumb bar. */}
      <BreadcrumbJsonLd
        items={[
          { name: "Home", href: "/" },
          { name: "Fahrzeugsuche", href: "/suche" },
          { name: seoName, href: buildListingHref({ id: listing.id, brand: listing.brand, model: listing.model }) },
        ]}
      />

      {/* Stacks below the global sticky header (h-16 md:h-20), not under it. */}
      <div className="bg-white border-b border-neutral-200 sticky top-16 md:top-20 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Button variant="ghost" onClick={() => router.back()} className="flex items-center gap-2 hover:bg-neutral-100">
              <ArrowLeft className="w-4 h-4" />
              Zurück
            </Button>
            <div className="text-sm text-neutral-600">ID: {listing.id.slice(0, 8)}...</div>
          </div>
        </div>
      </div>

      <ListingDetailV2
        listing={listing}
        images={images}
        isOwnerPreview={isOwnerPreview}
        garage={garage}
        teaserMonthlyLabel={teaserMonthlyLabel}
        purchasePriceChf={purchasePriceChf}
        childrenBelowFold={undefined}
        bottomContent={
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-10">
            <SimilarListings listing={listing} />
          </div>
        }
      />
    </>
  );
}

// Keep the visitor's query (gclid, utm_*) on the retired-listing redirect, like the
// next.config redirects do. The route param and the preview flag are not forwarded.
function withForwardedQuery(destination: string, query: Record<string, string | string[] | undefined>): string {
  const url = new URL(destination, "https://www.buyauto.ch");
  for (const [key, value] of Object.entries(query)) {
    if (key === "id" || key === "preview" || url.searchParams.has(key)) continue;
    for (const v of Array.isArray(value) ? value : value === undefined ? [] : [value]) url.searchParams.append(key, v);
  }
  return url.pathname + url.search;
}

export const getServerSideProps: GetServerSideProps<ListingDetailPageProps> = async (context) => {
  const { id } = context.params!;
  const { preview } = context.query;

  if (!id || typeof id !== "string") {
    return { notFound: true };
  }

  const listingId = extractListingIdFromParam(id);
  if (!listingId) {
    return { notFound: true };
  }

  try {
    if (preview === "true") {
      return { props: { listing: null } };
    }

    const { data, error } = await supabase
      .from("listings_public")
      .select("*")
      .eq("id", listingId)
      // listings_public exposes published, unexpired rows only — 'active' and
      // 'sold' could never match here. Anything else falls through to the
      // 404/410 handling below.
      .eq("status", "published")
      .single();

    if (error && (error as any)?.code !== "PGRST116") {
      // supabase-js returns transport failures as error VALUES, not throws —
      // without this rethrow a Supabase outage fell through to the 404 branch
      // and every live, sitemap-listed listing URL answered with a hard 404
      // Google could de-index. The catch below turns it into 503 + Retry-After
      // (same pattern as the dealer microsite).
      console.error("Error fetching listing by ID (published):", error);
      throw error;
    }

    let listing = !error && data ? transformPublicRowToListingDetail(data as any) : null;

    if (listing) {
      // Redirect legacy/malformed slugs to the canonical URL before any further
      // fetches — everything below would be thrown away with the response.
      const canonicalSegment = buildListingSlugSegment({ id: listing.id, brand: listing.brand, model: listing.model });
      if (id !== canonicalSegment) {
        return {
          redirect: {
            destination: `/fahrzeug/${canonicalSegment}`,
            permanent: true,
          },
        };
      }

      const sellerType = (data as any)?.seller_type ?? null;
      const ownerId = (data as any)?.user_id ?? (data as any)?.created_by ?? null;

      if (sellerType !== "garage" && ownerId) {
        const { data: profileRows, error: profError } = await supabase.rpc("get_public_profiles", { p_user_ids: [ownerId] });

        if (profError) {
          console.error("Error fetching public profile for listing owner:", profError);
        } else {
          const row = Array.isArray(profileRows) ? (profileRows[0] as any) : null;
          const fullName = typeof row?.full_name === "string" ? row.full_name : null;
          const avatarUrl = typeof row?.avatar_url === "string" ? row.avatar_url : null;

          listing = {
            ...listing,
            // First name + initial only ("Dávid T."): the surname never reaches the props.
            seller_name: publicSellerName({ sellerType: "private", fullName }) ?? listing.seller_name ?? null,
            seller_avatar_url: avatarUrl ?? listing.seller_avatar_url ?? null,
          };
        }
      }
    }

    if (!listing) {
      // Not a live listing in listings_public. Sold / archived / expired / rejected
      // listings and ids without any row are retired URLs: anonymous and non-owner
      // visitors get a permanent redirect to the brand page (when it is indexable)
      // or the Leasingübernahme hub. Owners and admins keep today's page (and
      // preview their listing via ?preview=true). Paused, inactive, draft and
      // pending listings keep today's behaviour: 404 with noindex.
      const lifecycle = await readListingLifecycle(listingId);

      if (isRetiredListing(lifecycle)) {
        const ownerIds = lifecycle.kind === "row" ? lifecycle.ownerIds : [];
        const privileged = ownerIds.length > 0 && (await isOwnerOrAdmin(context, ownerIds));
        if (!privileged) {
          const destination = await retiredListingDestination(
            lifecycle.kind === "row" ? lifecycle.brand : null,
            listingSlugPrefix(id)
          );
          return { redirect: { destination: withForwardedQuery(destination, context.query), permanent: true } };
        }
      }

      if (lifecycle.kind === "unknown") {
        // Lookup unavailable: fall back to the anonymous check. A published-but-expired
        // row is visible to anon RLS (410); anything else answers 404.
        const { data: publishedRow, error: publishedRowError } = await supabase
          .from("listings")
          .select("id")
          .eq("id", listingId)
          .eq("status", "published")
          .maybeSingle();

        // A failed lookup is not a 404 verdict.
        if (publishedRowError) {
          throw publishedRowError;
        }

        if (context.res) {
          context.res.statusCode = publishedRow ? 410 : 404;
        }
        return { props: { listing: null, gone: true } };
      }

      if (context.res) {
        context.res.statusCode = lifecycle.kind === "row" && lifecycle.status === "published" ? 410 : 404;
      }
      return { props: { listing: null, gone: true } };
    }

    const serializedListing = serializeListing(listing);

    if (context.res) {
      context.res.setHeader("Cache-Control", "public, s-maxage=60, stale-while-revalidate=600");
    }

    return { props: { listing: serializedListing } };
  } catch (error) {
    console.error("Error in getServerSideProps for [id].tsx:", error);
    // Transient backend failure: signal 503 (retry later) instead of a 200 skeleton that
    // Google could soft-404 and de-index. The URL stays indexed; Google just retries.
    if (context.res) {
      context.res.statusCode = 503;
      context.res.setHeader("Retry-After", "120");
    }
    return { props: { listing: null } };
  }
};