import { Card, CardContent } from "@/components/ui/card";
import type { ListingDetail } from "@/lib/buyauto/types";
import ImageGallery from "@/components/buyauto/detail/ImageGallery";
import {
  Calendar,
  Car,
  FileText,
  Fuel,
  Gauge,
  GitBranch,
  Settings2,
  Tag,
  Zap,
  MapPin,
} from "lucide-react";
import { useMemo } from "react";
import type { ComponentType } from "react";
import type { GaragePublicInfo } from "@/services/garageService";
import { OwnerMiniProfile } from "@/components/buyauto/detail/OwnerMiniProfile";
import { MessagingPanel } from "@/components/buyauto/detail/MessagingPanel";
import Link from "next/link";
import Image from "next/image";
import dynamic from "next/dynamic";
import type { LeasingCalculatorProps } from "@/components/buyauto/detail/LeasingCalculator";
import { cn } from "@/lib/utils";
import { GarageMiniBanner } from "@/components/buyauto/detail/GarageMiniBanner";
import { hasNewLeasingFinancing, KAUFART_LABEL, kaufartOf } from "@/lib/buyauto/kaufart";
import { formatChf, formatSwissInt, pluralize } from "@/lib/buyauto/format";

const LeasingCalculator = dynamic<LeasingCalculatorProps>(
  () => import("@/components/buyauto/detail/LeasingCalculator").then((m) => m.LeasingCalculator),
  { ssr: false, loading: () => <div className="min-h-[600px] bg-neutral-50 animate-pulse rounded-2xl" /> }
);


// Same glyph as prices, meta and JSON-LD (lib/buyauto/format), independent of the runtime's ICU.
const formatNumber = formatSwissInt;

function formatDateDeCh(input: string): string {
  const d = new Date(input);
  if (Number.isNaN(d.getTime())) return input;
  return new Intl.DateTimeFormat("de-CH", { year: "numeric", month: "2-digit", timeZone: "Europe/Zurich" }).format(d);
}

function getGoogleMapsQuery(locationText: string): string {
  const base = locationText.trim();
  if (!base) return "";
  if (/\b(schweiz|switzerland)\b/i.test(base)) return base;
  return `${base}, Schweiz`;
}

function getGoogleMapsEmbedUrl(locationText: string): string | null {
  const q = getGoogleMapsQuery(locationText);
  if (!q) return null;
  return `https://www.google.com/maps?q=${encodeURIComponent(q)}&output=embed`;
}

function getGoogleMapsOpenUrl(locationText: string): string | null {
  const q = getGoogleMapsQuery(locationText);
  if (!q) return null;
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`;
}

function FactGrid({
  items,
}: {
  items: Array<{ key: string; label: string; value: string; Icon: ComponentType<{ className?: string }> }>;
}) {
  if (items.length === 0) return null;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {items.map((it) => (
        <div
          key={it.key}
          className="flex items-center gap-3 rounded-2xl border border-neutral-200/60 bg-neutral-50 px-4 py-3"
        >
          <div className="h-10 w-10 rounded-2xl bg-white border border-neutral-200/60 flex items-center justify-center">
            <it.Icon className="h-5 w-5 text-neutral-700" />
          </div>
          <div className="min-w-0">
            <div className="text-sm font-semibold text-neutral-900 truncate">{it.value}</div>
            <div className="text-xs text-neutral-500">{it.label}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

export function ListingDetailV2({
  listing,
  images,
  isOwnerPreview,
  garage,
  teaserMonthlyLabel,
  purchasePriceChf,
  childrenBelowFold,
  bottomContent,
}: {
  listing: ListingDetail;
  images: string[];
  isOwnerPreview: boolean;
  garage: GaragePublicInfo | null;
  teaserMonthlyLabel: string | null;
  purchasePriceChf: number | null;
  childrenBelowFold?: React.ReactNode;
  bottomContent?: React.ReactNode;
}) {
  // Display type from the one Kaufart rule (lib/buyauto/kaufart), never the stored deal_type.
  const kaufart = kaufartOf(listing);
  const isTakeover = kaufart === "lease_takeover";
  const isSold = (listing.status as any) === "sold";

  // Prefer the stored title (it carries the decoded trim, e.g. "530i xDrive")
  // over the bare brand+model; only append the year when the title doesn't
  // already end with it (legacy titles sometimes embed the year).
  const baseTitle = listing.title?.trim() || `${listing.brand} ${listing.model}`.trim();
  const displayTitle = listing.year && !baseTitle.endsWith(String(listing.year)) ? `${baseTitle} ${listing.year}` : baseTitle;

  const leasingOffer = (listing as unknown as { leasing_offer?: any | null }).leasing_offer ?? null;
  const takeoverOfferJson =
    leasingOffer && typeof leasingOffer === "object"
      ? ((leasingOffer as unknown as { lease_takeover_offer?: any | null }).lease_takeover_offer ?? null)
      : null;

  // "Leasing" (new-leasing financing on a Direktkauf) keeps its current handling:
  // a Leasing chip, the teaser line and the calculator.
  const hasLeasing = !isTakeover && hasNewLeasingFinancing(listing);

  // Leasingübernahme facts: effective values from the listing transform.
  const takeoverRateChf = isTakeover && listing.pricePerMonthCHF > 0 ? listing.pricePerMonthCHF : null;
  const takeoverMonths = isTakeover && typeof listing.remainingMonths === "number" ? listing.remainingMonths : null;
  const takeoverKautionChf = isTakeover && typeof listing.depositCHF === "number" ? listing.depositCHF : null;
  const remainingKmColumn = (listing as unknown as { remaining_km?: number | null }).remaining_km ?? null;
  const takeoverRemainingKm = !isTakeover
    ? null
    : typeof remainingKmColumn === "number"
      ? remainingKmColumn
      : typeof takeoverOfferJson?.remaining_km === "number"
        ? (takeoverOfferJson.remaining_km as number)
        : null;

  const primaryPriceLabel = isTakeover
    ? takeoverRateChf !== null
      ? formatChf(takeoverRateChf)
      : "Preis auf Anfrage"
    : typeof purchasePriceChf === "number"
      ? formatChf(purchasePriceChf)
      : "Preis auf Anfrage";

  const primaryPriceSub = isTakeover ? "pro Monat" : "Kaufpreis";

  const chatScroll = () => {
    const el = document.getElementById("messages");
    if (!el) return;
    el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const canShowLeasingCalculator =
    hasLeasing && typeof purchasePriceChf === "number" && leasingOffer && typeof leasingOffer === "object" && leasingOffer.enabled;

  const vehicleFacts = useMemo(() => {
    const items: Array<{ key: string; label: string; value: string; Icon: ComponentType<{ className?: string }> }> = [];

    if (listing.year) items.push({ key: "year", label: "Baujahr", value: String(listing.year), Icon: Calendar });

    const firstRegistration = (listing as unknown as { firstRegistration?: string | null }).firstRegistration ?? null;
    if (firstRegistration && firstRegistration.trim()) {
      items.push({
        key: "first-registration",
        label: "Erstzulassung",
        value: formatDateDeCh(firstRegistration),
        Icon: Calendar,
      });
    }

    if (typeof listing.mileageKm === "number") {
      items.push({
        key: "mileage",
        label: "Kilometerstand",
        value: `${formatNumber(listing.mileageKm)} km`,
        Icon: Gauge,
      });
    }

    if (listing.fuel) items.push({ key: "fuel", label: "Treibstoff", value: String(listing.fuel), Icon: Fuel });
    if (listing.gearbox) items.push({ key: "gearbox", label: "Getriebe", value: String(listing.gearbox), Icon: Settings2 });

    const body = (listing as unknown as { body?: string | null }).body ?? null;
    if (body) items.push({ key: "body", label: "Karosserie", value: String(body), Icon: Car });

    const drivetrain = (listing as unknown as { drivetrain?: string | null }).drivetrain ?? null;
    if (drivetrain && drivetrain.trim()) {
      items.push({ key: "drivetrain", label: "Antrieb", value: drivetrain, Icon: GitBranch });
    }

    const powerHp = (listing as unknown as { powerHp?: number | null }).powerHp ?? null;
    if (typeof powerHp === "number" && powerHp > 0) {
      items.push({ key: "power", label: "Leistung", value: `${formatNumber(powerHp)} PS`, Icon: Zap });
    }

    // Restkilometer of a Leasingübernahme live in the takeover box above.
    return items;
  }, [listing.fuel, listing.gearbox, listing.mileageKm, listing.year, listing]);

  return (
    <div className={cn("min-h-screen bg-neutral-50 pb-24", isSold ? "grayscale-[0.2]" : "")}>
      <div id="listing-hero-sentinel" className="h-px w-px" />

      {isOwnerPreview && (
        <div className="bg-amber-50 border-b border-amber-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div className="text-sm text-amber-900">Vorschau: Dieses Inserat ist noch nicht veröffentlicht und nur für dich sichtbar.</div>
          </div>
        </div>
      )}

      {isSold && (
        <div className="bg-neutral-900/90 text-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 text-sm">
            <span className="font-semibold">Verkauft.</span> Dieses Inserat ist nicht mehr verfügbar.
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-5 sm:pt-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
          <div className="lg:col-span-7 space-y-6">
            <div className="bg-white rounded-3xl shadow-sm border border-neutral-200/60 overflow-hidden">
              {/* Keyed by listing id: Next reuses the page component across
                  /fahrzeug/[id] navigations, and without a remount the gallery
                  keeps the previous listing's photo index and loading state. */}
              <ImageGallery key={listing.id} images={images} brand={listing.brand} model={listing.model} premium={listing.premium} />
            </div>

            <div className="bg-white rounded-3xl border border-neutral-200/60 shadow-sm p-6 sm:p-8">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-neutral-900">
                    {displayTitle}
                  </h1>
                  <p className="mt-1 text-sm text-neutral-600">{listing.location}</p>
                </div>

                {listing.premium && (
                  <div className="shrink-0 inline-flex items-center gap-2 rounded-full bg-amber-50 border border-amber-200 px-3 py-1 text-xs font-semibold text-amber-900">
                    <Zap className="h-3.5 w-3.5" />
                    Premium
                  </div>
                )}
              </div>

              <div className="mt-5 space-y-5">
                <div className="rounded-3xl bg-neutral-900 text-white p-5 sm:p-6 shadow-sm border border-neutral-800/60">
                  <div className="text-xs font-semibold uppercase tracking-wide text-white/70">{primaryPriceSub}</div>

                  <div className="mt-1 text-3xl sm:text-4xl font-bold tracking-tight">{primaryPriceLabel}</div>

                  {isTakeover && typeof purchasePriceChf === "number" && (
                    <div className="mt-1 text-sm text-white/75">
                      Kaufpreis: <span className="font-semibold text-white">{formatChf(purchasePriceChf)}</span>
                    </div>
                  )}

                  {isTakeover && (
                    <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-2">
                      <div className="rounded-2xl bg-white/10 border border-white/10 px-3 py-2 text-sm text-white/80">
                        <div className="text-[11px] uppercase tracking-wide text-white/60">Restlaufzeit</div>
                        <div className="mt-0.5 font-semibold text-white">
                          {typeof takeoverMonths === "number" && takeoverMonths > 0 ? `${takeoverMonths} ${pluralize(takeoverMonths, "Monat", "Monate")}` : "—"}
                        </div>
                      </div>
                      <div className="rounded-2xl bg-white/10 border border-white/10 px-3 py-2 text-sm text-white/80">
                        <div className="text-[11px] uppercase tracking-wide text-white/60">Kaution</div>
                        <div className="mt-0.5 font-semibold text-white">
                          {typeof takeoverKautionChf === "number" ? (takeoverKautionChf > 0 ? formatChf(takeoverKautionChf) : "Keine") : "—"}
                        </div>
                      </div>
                      <div className="rounded-2xl bg-white/10 border border-white/10 px-3 py-2 text-sm text-white/80">
                        <div className="text-[11px] uppercase tracking-wide text-white/60">Restkilometer</div>
                        <div className="mt-0.5 font-semibold text-white">
                          {typeof takeoverRemainingKm === "number" && takeoverRemainingKm > 0
                            ? `${formatNumber(takeoverRemainingKm)} km`
                            : "—"}
                        </div>
                      </div>
                    </div>
                  )}

                  {!isTakeover && teaserMonthlyLabel && (
                    <div className="mt-3 rounded-2xl bg-white/10 border border-white/10 px-3 py-2 text-sm text-white/85">
                      {teaserMonthlyLabel}
                    </div>
                  )}

                  <div className="mt-4 flex items-center gap-2 text-xs text-white/60">
                    <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-white/10">
                      <FileText className="h-3.5 w-3.5" />
                    </span>
                    <span>Alle Angaben gemäss Inserat.</span>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  <span className="inline-flex items-center rounded-full border border-neutral-200 bg-neutral-50 px-3 py-1 text-xs font-medium text-neutral-700">
                    <Tag className="h-3.5 w-3.5 mr-2 text-neutral-600" />
                    {KAUFART_LABEL[kaufart]}
                  </span>

                  {hasLeasing && (
                    <span className="inline-flex items-center rounded-full border border-neutral-200 bg-neutral-50 px-3 py-1 text-xs font-medium text-neutral-700">
                      <Tag className="h-3.5 w-3.5 mr-2 text-neutral-600" />
                      Leasing
                    </span>
                  )}
                </div>

                <FactGrid items={vehicleFacts} />
              </div>
            </div>

            {listing.description && listing.description.trim() && (
              <section className="bg-white rounded-3xl border border-neutral-200/60 shadow-sm p-6 sm:p-8">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-neutral-100 rounded-2xl flex items-center justify-center">
                    <FileText className="w-5 h-5 text-neutral-700" />
                  </div>
                  <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-neutral-900">Beschreibung</h2>
                </div>
                <p className="text-neutral-700 leading-relaxed whitespace-pre-wrap">{listing.description}</p>
              </section>
            )}

            {childrenBelowFold}
          </div>

          <div className="lg:col-span-5 space-y-6">
            <Card className="border-neutral-200/60 shadow-sm bg-white rounded-3xl">
              <CardContent className="p-6 sm:p-8">
                <div className="flex items-start justify-between gap-4">
                  <div className="text-sm font-semibold text-neutral-900">Anbieter</div>
                </div>

                <div className="mt-3 text-sm text-neutral-600">Du schreibst direkt dem Anbieter. Verlauf bleibt bei diesem Inserat gespeichert.</div>

                <div className="mt-5">
                  {(() => {
                    const sellerTypeRaw = (listing as unknown as { seller_type?: string | null }).seller_type ?? null;
                    const garageId =
                      (listing as unknown as { garage_id?: string | null }).garage_id ??
                      (listing as unknown as { garageId?: string | null }).garageId ??
                      null;

                    const sellerType = sellerTypeRaw ?? (garageId ? "garage" : null);

                    if (sellerType === "garage") {
                      const name =
                        garage?.name ??
                        ((listing as unknown as { garage_name?: string | null }).garage_name ?? null) ??
                        ((listing as unknown as { seller_name?: string | null }).seller_name ?? null) ??
                        "Garage";

                      const locationText = garage?.city ?? listing.location ?? null;
                      const bio = garage?.bio ?? null;
                      const slug = garage?.slug ?? null;

                      const headerImageUrl = garage?.headerImageUrl ?? null;

                      const logoUrl =
                        garage?.logoUrl ??
                        (listing as unknown as { garage_logo_url?: string | null }).garage_logo_url ??
                        null;

                      return (
                        <div className="rounded-3xl overflow-hidden border border-neutral-200/60 bg-white shadow-sm">
                          <div className="relative h-28 sm:h-32">
                            {headerImageUrl && headerImageUrl.trim() ? (
                              <Image
                                src={headerImageUrl}
                                alt={`${name} Header`}
                                fill
                                className="object-cover"
                                sizes="(max-width: 1024px) 100vw, 480px"
                              />
                            ) : (
                              <div className="absolute inset-0 bg-gradient-to-r from-primary to-primary/80" />
                            )}
                            <div className="absolute inset-0 bg-gradient-to-t from-neutral-900/85 via-neutral-900/45 to-transparent" />

                            <div className="absolute inset-x-0 bottom-0 p-4 sm:p-5">
                              <div className="flex items-end gap-3">
                                <div className="shrink-0">
                                  {logoUrl ? (
                                    <Image
                                      src={logoUrl}
                                      alt={`${name} Logo`}
                                      width={56}
                                      height={56}
                                      className="h-14 w-14 rounded-2xl object-cover bg-white ring-2 ring-white shadow"
                                    />
                                  ) : (
                                    <div className="h-14 w-14 rounded-2xl bg-white/15 backdrop-blur border border-white/20 ring-2 ring-white/40 flex items-center justify-center text-sm font-bold text-white">
                                      G
                                    </div>
                                  )}
                                </div>

                                <div className="min-w-0 flex-1">
                                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                                    <div className="text-base sm:text-lg font-bold tracking-tight text-white truncate">{name}</div>
                                    <span className="inline-flex items-center rounded-full border border-white/20 bg-white/10 backdrop-blur px-2.5 py-1 text-xs font-semibold text-white">
                                      Garage
                                    </span>
                                  </div>

                                  {locationText && (
                                    <div className="mt-1 flex items-center gap-2 text-sm text-white/85">
                                      <MapPin className="h-4 w-4 text-white/75" />
                                      <span className="truncate">{locationText}</span>
                                    </div>
                                  )}
                                </div>

                                {slug && (
                                  <div className="shrink-0">
                                    <Link
                                      href={`/${slug}`}
                                      className="inline-flex items-center rounded-2xl border border-white/25 bg-white/10 backdrop-blur px-3 py-2 text-sm font-semibold text-white hover:bg-white/15 hover:border-white/40 transition-colors"
                                    >
                                      Profil ansehen
                                    </Link>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>

                          {bio && bio.trim() && (
                            <div className="p-4 sm:p-5">
                              <p className="text-sm text-neutral-600 leading-relaxed [display:-webkit-box] [-webkit-box-orient:vertical] [-webkit-line-clamp:2] overflow-hidden">
                                {bio}
                              </p>
                            </div>
                          )}
                        </div>
                      );
                    }

                    const privateName =
                      ((listing as unknown as { seller_name?: string | null }).seller_name ?? null) ||
                      ((listing as unknown as { private_owner_name?: string | null }).private_owner_name ?? null);

                    const privateAvatar =
                      (listing as unknown as { seller_avatar_url?: string | null }).seller_avatar_url ?? null;

                    return (
                      <OwnerMiniProfile
                        sellerType={sellerType}
                        name={privateName}
                        location={(listing.location ?? null) as unknown as string | null}
                        avatarUrl={privateAvatar}
                      />
                    );
                  })()}
                </div>
              </CardContent>
            </Card>

            {!isSold && (
              <div id="messages" className="scroll-mt-36 md:scroll-mt-40">
                <MessagingPanel 
                  key={listing.id}
                  listingId={listing.id} 
                  listingTitle={displayTitle}
                  ownerId={((listing as any).user_id ?? (listing as any).created_by ?? null) as string | null}
                  isSold={isSold}
                  dealType={kaufart}
                />
              </div>
            )}

            {canShowLeasingCalculator && (
              <LeasingCalculator
                priceChf={purchasePriceChf as number}
                year={listing.year}
                mileageKm={typeof listing.mileageKm === "number" ? listing.mileageKm : 0}
                offer={leasingOffer}
              />
            )}

            {(() => {
              const loc = (listing.location ?? "").trim();
              const embedUrl = getGoogleMapsEmbedUrl(loc);
              const openUrl = getGoogleMapsOpenUrl(loc);

              if (!loc || !embedUrl) {
                return (
                  <Card className="border-neutral-200/60 shadow-sm bg-white rounded-3xl">
                    <CardContent className="p-6 sm:p-8">
                      <div className="flex items-start justify-between gap-4">
                        <div className="text-sm font-semibold text-neutral-900">Standort</div>
                      </div>
                      <div className="mt-3 flex items-start gap-2 text-sm text-neutral-600">
                        <MapPin className="h-4 w-4 mt-0.5 text-neutral-500" />
                        <span>Standort nicht angegeben</span>
                      </div>
                    </CardContent>
                  </Card>
                );
              }

              return (
                <Card className="border-neutral-200/60 shadow-sm bg-white rounded-3xl">
                  <CardContent className="p-6 sm:p-8">
                    <div className="flex items-start justify-between gap-4">
                      <div className="text-sm font-semibold text-neutral-900">Standort</div>
                      {openUrl && (
                        <a
                          href={openUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-sm font-medium text-neutral-900 hover:text-neutral-700 underline underline-offset-4"
                        >
                          In Google Maps öffnen
                        </a>
                      )}
                    </div>

                    <div className="mt-3 flex items-start gap-2 text-sm text-neutral-600">
                      <MapPin className="h-4 w-4 mt-0.5 text-neutral-500" />
                      <span>{loc}</span>
                    </div>

                    <div className="mt-4 overflow-hidden rounded-2xl border border-neutral-200/60 bg-neutral-50">
                      <iframe
                        title={`Karte Standort ${loc}`}
                        src={embedUrl}
                        className="h-64 w-full"
                        loading="lazy"
                        referrerPolicy="no-referrer-when-downgrade"
                      />
                    </div>

                    <div className="mt-3 text-xs text-neutral-500">Hinweis: Standort gemäss Inserat.</div>
                  </CardContent>
                </Card>
              );
            })()}
          </div>
        </div>

      </div>

      {/* Mounted once for all breakpoints so children (e.g. SimilarListings) fetch
          only once; the responsive padding mirrors the previous in-container
          placement below lg and the bare root placement at lg+. */}
      <div className="px-4 sm:px-6 lg:px-0">
        {bottomContent}
      </div>
    </div>
  );
}