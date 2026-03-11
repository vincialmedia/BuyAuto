import { useMemo, useState } from "react";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { estimateTeaserMonthlyRateChf } from "@/lib/buyauto/leasingMath";
import { cantons } from "@/lib/buyauto/data";

type SellerType = "private" | "garage";
type DealType = "lease_takeover" | "direct_purchase";
type FinancingType = "cash" | "leasing";

type SummaryVariant =
  | "lease_takeover"
  | "direct_purchase_cash"
  | "direct_purchase_leasing"
  | "unknown";

export interface SuccessListingSummaryInput {
  id?: string | null;

  deal_type?: DealType | null;
  financing_type?: FinancingType | null;
  leasing_offer?: unknown | null;

  brand?: string | null;
  model?: string | null;
  title?: string | null;
  year?: number | null;

  mileage_km?: number | null;
  km?: number | null;
  mileage?: number | null;

  body?: string | null;
  fuel?: string | null;
  gearbox?: string | null;

  location?: string | null;
  canton_code?: string | null;

  price_per_month_chf?: number | null;
  remaining_months?: number | null;
  remaining_km?: number | null;
  deposit_chf?: number | null;

  purchase_price_chf?: number | null;

  description?: string | null;

  images?: string[] | null;
  cover_image_index?: number | null;

  premium?: boolean | null;
  price_plan?: string | null;
  status?: string | null;
}

export interface SuccessListingSummaryProps {
  listing: SuccessListingSummaryInput;
  sellerType?: SellerType;
  planLabel?: string | null;
}

type LeaseTakeoverOfferShape = Partial<{
  enabled: boolean;
  price_per_month_chf: number;
  remaining_months: number;
  deposit_chf: number;
  remaining_km?: number;
  pickup_canton_code: string;
}>;

type LeasingOfferShape = Partial<{
  enabled: boolean;
  interest_rate_pct: number;
  down_payment_pct: number;
  no_down_payment: boolean;
  min_term_months: number;
  max_term_months: number;
  km_options: number[];
  residual_pct_adjustment_pp: number;
  lease_takeover_offer: LeaseTakeoverOfferShape;
}>;

function formatChf(value: number | null | undefined): string {
  if (typeof value !== "number" || !Number.isFinite(value)) return "-";
  return `CHF ${value.toLocaleString("de-CH")}`;
}

function formatKm(value: number | null | undefined): string {
  if (typeof value !== "number" || !Number.isFinite(value)) return "-";
  return `${value.toLocaleString("de-CH")} km`;
}

function getNumber(value: unknown): number | null {
  const n = typeof value === "number" ? value : typeof value === "string" ? Number(value) : NaN;
  if (!Number.isFinite(n)) return null;
  return n;
}

function getString(value: unknown): string | null {
  return typeof value === "string" && value.trim().length > 0 ? value : null;
}

function getSellerLabel(sellerType: SellerType | undefined): string {
  if (sellerType === "garage") return "Garage";
  return "Privat";
}

function getVariant(input: {
  dealType: DealType | null;
  financingType: FinancingType | null;
  leasingOffer: LeasingOfferShape | null;
}): SummaryVariant {
  const { dealType, financingType } = input;

  if (dealType === "lease_takeover") return "lease_takeover";

  if (dealType === "direct_purchase") {
    if (financingType === "leasing") return "direct_purchase_leasing";
    if (financingType === "cash") return "direct_purchase_cash";
    return "direct_purchase_cash";
  }

  return "unknown";
}

function getDealLabel(variant: SummaryVariant): string {
  if (variant === "direct_purchase_cash") return "Direktkauf · Cash";
  if (variant === "direct_purchase_leasing") return "Direktkauf · Leasing";
  if (variant === "lease_takeover") return "Leasingübernahme";
  return "Inserat";
}

function getCantonName(code: string): string {
  const normalized = String(code ?? "").trim().toUpperCase();
  if (!normalized) return "";
  if (normalized === "XX") return "Unbekannt";
  return cantons[normalized] ?? normalized;
}

function getPrimaryPricing(args: {
  variant: SummaryVariant;
  purchasePriceChf: number | null;
  pricePerMonthChf: number | null;
  year: number | null;
  mileageKm: number | null;
  leasingOffer: LeasingOfferShape | null;
}): { primary: { label: string; value: string }; secondary?: { label: string; value: string } } {
  const { variant, purchasePriceChf, pricePerMonthChf, year, mileageKm, leasingOffer } = args;

  if (variant === "lease_takeover") {
    return {
      primary: { label: "Monatliche Rate", value: pricePerMonthChf ? `${formatChf(pricePerMonthChf)} / Monat` : "-" },
    };
  }

  if (variant === "direct_purchase_cash") {
    return { primary: { label: "Kaufpreis", value: formatChf(purchasePriceChf) } };
  }

  if (variant === "direct_purchase_leasing") {
    const primary = { label: "Kaufpreis", value: formatChf(purchasePriceChf) };

    const offer = leasingOffer ?? null;
    const interestRatePct = getNumber(offer?.interest_rate_pct);
    const minTermMonths = getNumber(offer?.min_term_months) ?? 60;
    const noDownPayment = offer?.no_down_payment === true;
    const downPaymentPct = noDownPayment ? 0 : getNumber(offer?.down_payment_pct) ?? 5;
    const residualAdj = getNumber(offer?.residual_pct_adjustment_pp);

    const canEstimate =
      typeof purchasePriceChf === "number" &&
      typeof year === "number" &&
      typeof mileageKm === "number" &&
      typeof interestRatePct === "number";

    if (canEstimate) {
      const teaser = estimateTeaserMonthlyRateChf({
        priceChf: purchasePriceChf,
        year,
        mileageKm,
        interestRatePct,
        residualPctAdjustmentPp: residualAdj,
        termMonths: minTermMonths,
        downPaymentPct,
      });

      if (typeof teaser === "number" && Number.isFinite(teaser) && teaser > 0) {
        return {
          primary,
          secondary: { label: "Leasing ab", value: `CHF ${teaser.toLocaleString("de-CH")} / Monat` },
        };
      }
    }

    return { primary };
  }

  return { primary: { label: "Preis", value: "-" } };
}

export function SuccessListingSummary({ listing, sellerType, planLabel }: SuccessListingSummaryProps) {
  const [activeIndex, setActiveIndex] = useState(0);

  const brand = getString(listing.brand) ?? "-";
  const model = getString(listing.model) ?? "";
  const title = getString(listing.title);

  const dealType = (listing.deal_type ?? null) as DealType | null;
  const financingType = (listing.financing_type ?? null) as FinancingType | null;

  const leasingOffer = (listing.leasing_offer ?? null) as LeasingOfferShape | null;
  const takeoverOfferEnabled = leasingOffer?.lease_takeover_offer?.enabled === true;

  const variant = getVariant({ dealType, financingType, leasingOffer });

  const year = getNumber(listing.year);
  const mileageKm = getNumber(listing.mileage_km ?? listing.km ?? listing.mileage);

  const purchasePriceRaw = getNumber(listing.purchase_price_chf);
  const legacyPricePerMonthChf = getNumber(listing.price_per_month_chf);
  const purchasePriceChf =
    purchasePriceRaw ?? (dealType === "direct_purchase" ? legacyPricePerMonthChf : null);

  const pricePerMonthChf = getNumber(listing.price_per_month_chf);

  const images = Array.isArray(listing.images) ? listing.images.filter((u) => typeof u === "string" && u.length > 0) : [];
  const coverIndexRaw = getNumber(listing.cover_image_index);
  const coverIndex = typeof coverIndexRaw === "number" ? Math.max(0, Math.min(images.length - 1, coverIndexRaw)) : 0;

  const safeActiveIndex = images.length > 0 ? Math.max(0, Math.min(images.length - 1, activeIndex)) : 0;
  const mainImageUrl = images[safeActiveIndex] ?? images[coverIndex] ?? null;

  // Compute capability label
  let capabilityLabel = "";
  if (variant === "lease_takeover") {
    capabilityLabel = "pro Monat";
  } else {
    // direct purchase
    if (variant === "direct_purchase_leasing" && takeoverOfferEnabled) {
      capabilityLabel = "Leasing & Leasing Übernahme möglich";
    } else if (variant === "direct_purchase_leasing") {
      capabilityLabel = "Leasing möglich";
    } else if (takeoverOfferEnabled) {
      capabilityLabel = "Leasing Übernahme möglich";
    }
    // cash only -> blank
  }

  // Leasing calculator teaser
  const leasingTeaser = useMemo(() => {
    if (variant === "direct_purchase_leasing" && purchasePriceChf && year && mileageKm && leasingOffer) {
        const interestRatePct = getNumber(leasingOffer.interest_rate_pct);
        const minTermMonths = getNumber(leasingOffer.min_term_months) ?? 60;
        const noDownPayment = leasingOffer.no_down_payment === true;
        const downPaymentPct = noDownPayment ? 0 : getNumber(leasingOffer.down_payment_pct) ?? 5;
        const residualAdj = getNumber(leasingOffer.residual_pct_adjustment_pp);

        const canEstimate =
          typeof purchasePriceChf === "number" &&
          typeof year === "number" &&
          typeof mileageKm === "number" &&
          typeof interestRatePct === "number";

        if (canEstimate) {
          return estimateTeaserMonthlyRateChf({
            priceChf: purchasePriceChf,
            year,
            mileageKm,
            interestRatePct: interestRatePct!,
            residualPctAdjustmentPp: residualAdj,
            termMonths: minTermMonths,
            downPaymentPct,
          });
        }
    }
    return null;
  }, [variant, purchasePriceChf, year, mileageKm, leasingOffer]);

  const sections = useMemo(() => {
    const out: Array<{ title: string; rows: Array<{ label: string; value: string }> }> = [];

    const fahrzeugRows: Array<{ label: string; value: string }> = [];
    if (typeof year === "number") fahrzeugRows.push({ label: "Baujahr", value: String(year) });
    if (typeof mileageKm === "number") fahrzeugRows.push({ label: "Kilometer", value: formatKm(mileageKm) });
    if (getString(listing.body)) fahrzeugRows.push({ label: "Karosserie", value: String(listing.body) });
    if (getString(listing.fuel)) fahrzeugRows.push({ label: "Antrieb", value: String(listing.fuel) });
    if (getString(listing.gearbox)) fahrzeugRows.push({ label: "Getriebe", value: String(listing.gearbox) });

    const locationLabel = getString(listing.location) ?? getString(listing.canton_code);
    if (locationLabel) fahrzeugRows.push({ label: "Standort", value: locationLabel });

    if (fahrzeugRows.length > 0) out.push({ title: "Fahrzeug", rows: fahrzeugRows });

    // Listing Meta Info
    const listingRows: Array<{ label: string; value: string }> = [];
    if (sellerType) listingRows.push({ label: "Verkäufer", value: getSellerLabel(sellerType) });
    if (typeof listing.premium === "boolean") listingRows.push({ label: "Premium", value: listing.premium ? "Ja" : "Nein" });
    if (planLabel) listingRows.push({ label: "Plan", value: planLabel });

    if (listingRows.length > 0) out.push({ title: "Details", rows: listingRows });

    return out;
  }, [variant, year, mileageKm, listing, purchasePriceChf, pricePerMonthChf, sellerType, planLabel, leasingOffer]);

  const description = getString(listing.description);

  return (
    <div className="space-y-6">
      <div className="rounded-3xl overflow-hidden border border-neutral-200/60 shadow-lg bg-white">
        <div className="relative">
          <div className="relative w-full aspect-[16/10] bg-neutral-100">
            {mainImageUrl ? (
              <Image
                src={mainImageUrl}
                alt={`${brand} ${model}`.trim() || "Fahrzeug"}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 768px"
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center text-sm text-neutral-500">
                Keine Fotos verfügbar
              </div>
            )}
          </div>

          <div className="absolute left-4 top-4 flex gap-2">
            {listing.premium ? (
              <Badge className="bg-red-500 text-white border-red-500">Premium</Badge>
            ) : null}
          </div>
        </div>

        {images.length > 1 ? (
          <div className="p-4">
            <div className="flex gap-2 overflow-x-auto pb-1">
              {images.map((url, idx) => (
                <button
                  key={`${url}-${idx}`}
                  type="button"
                  onClick={() => setActiveIndex(idx)}
                  className={cn(
                    "relative h-16 w-24 shrink-0 overflow-hidden rounded-2xl border transition",
                    idx === safeActiveIndex ? "border-primary ring-2 ring-primary/20" : "border-neutral-200 hover:border-neutral-300"
                  )}
                  aria-label={idx === coverIndex ? "Titelbild" : `Foto ${idx + 1}`}
                >
                  <Image src={url} alt={`Foto ${idx + 1}`} fill className="object-cover" sizes="96px" />
                  {idx === coverIndex ? (
                    <span className="absolute left-1 top-1 rounded-full bg-black/60 px-2 py-0.5 text-[10px] text-white">
                      Titelbild
                    </span>
                  ) : null}
                </button>
              ))}
            </div>
          </div>
        ) : null}

        <div className="px-6 pb-6 md:px-8 md:pb-8">
          {/* Sleek Header */}
          <div className="pt-6 flex justify-between items-start mb-8">
            <div>
              <div className="text-2xl font-bold tracking-tight text-neutral-900">
                {brand} {model}
              </div>
              <div className="mt-1 text-sm text-neutral-500">{getCantonName(listing.canton_code) || title || "-"}</div>
            </div>
            <div className="text-right">
               {variant === "lease_takeover" ? (
                  <>
                    <p className="text-2xl font-bold tracking-tight text-neutral-900">
                      {formatChf(pricePerMonthChf)}
                    </p>
                    <p className="text-sm text-neutral-500 mt-1">{capabilityLabel}</p>
                  </>
                ) : (
                  <>
                    <p className="text-2xl font-bold tracking-tight text-neutral-900">
                      {formatChf(purchasePriceChf)}
                    </p>
                    {capabilityLabel && <p className="text-sm text-neutral-500 mt-1">{capabilityLabel}</p>}
                  </>
                )}
            </div>
          </div>

          <Separator className="my-8 border-neutral-100" />

          {/* Details Grid */}
          <div className="grid gap-8 md:grid-cols-2 mb-8">
              {sections.map((section) => (
                <div key={section.title} className="space-y-3">
                  <div className="text-sm font-semibold text-neutral-900">{section.title}</div>
                  <div className="space-y-2">
                    {section.rows.map((row) => (
                      <div key={`${section.title}-${row.label}`} className="flex items-start justify-between gap-3">
                        <div className="text-sm text-neutral-600">{row.label}</div>
                        <div className="text-sm font-medium text-neutral-900 text-right">{row.value}</div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
          </div>

          {/* Confirmation Blocks */}
          <div className="space-y-6">
             {/* Leasing Conditions */}
             {variant === "direct_purchase_leasing" && leasingOffer && (
                <div className="bg-neutral-50 rounded-2xl p-5 border border-neutral-100">
                  <div className="flex justify-between items-baseline mb-4">
                    <h4 className="font-semibold text-neutral-900 text-sm">Leasing-Konditionen</h4>
                    {leasingTeaser && leasingTeaser > 0 && (
                      <span className="text-sm font-medium text-neutral-900">
                        ab CHF {leasingTeaser.toLocaleString('de-CH')} / Monat
                      </span>
                    )}
                  </div>
                  <div className="grid grid-cols-1 gap-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-neutral-500">Zinssatz</span>
                      <span className="text-neutral-900">{getNumber(leasingOffer.interest_rate_pct)}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-neutral-500">Anzahlung</span>
                      <span className="text-neutral-900">
                        {leasingOffer.no_down_payment ? "Keine Anzahlung" : `${getNumber(leasingOffer.down_payment_pct)}%`}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-neutral-500">Laufzeit</span>
                      <span className="text-neutral-900">
                        {getNumber(leasingOffer.min_term_months)}–{getNumber(leasingOffer.max_term_months)} Monate
                      </span>
                    </div>
                    {leasingOffer.km_options && leasingOffer.km_options.length > 0 && (
                      <div className="flex justify-between">
                        <span className="text-neutral-500">KM-Optionen</span>
                        <span className="text-neutral-900 text-right max-w-[50%] truncate">
                          {leasingOffer.km_options.filter((k: number) => typeof k === 'number').map((k: number) => `${(k/1000).toFixed(0)}k`).join(', ')}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
             )}

             {/* Lease Takeover Offer */}
             {takeoverOfferEnabled && leasingOffer?.lease_takeover_offer && (
                <div className="bg-neutral-50 rounded-2xl p-5 border border-neutral-100">
                  <h4 className="font-semibold text-neutral-900 text-sm mb-4">Leasingübernahme-Angebot</h4>
                  <div className="grid grid-cols-1 gap-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-neutral-500">Monatliche Rate</span>
                      <span className="text-neutral-900 font-medium">CHF {getNumber(leasingOffer.lease_takeover_offer.price_per_month_chf)?.toLocaleString('de-CH')}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-neutral-500">Restlaufzeit</span>
                      <span className="text-neutral-900">{getNumber(leasingOffer.lease_takeover_offer.remaining_months)} Monate</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-neutral-500">Depot / Anzahlung</span>
                      <span className="text-neutral-900">CHF {getNumber(leasingOffer.lease_takeover_offer.deposit_chf)?.toLocaleString('de-CH')}</span>
                    </div>
                    {getNumber(leasingOffer.lease_takeover_offer.remaining_km) && (
                      <div className="flex justify-between">
                        <span className="text-neutral-500">Verbleibende KM</span>
                        <span className="text-neutral-900">{getNumber(leasingOffer.lease_takeover_offer.remaining_km)?.toLocaleString('de-CH')} km</span>
                      </div>
                    )}
                    {getString(leasingOffer.lease_takeover_offer.pickup_canton_code) &&
                      getString(leasingOffer.lease_takeover_offer.pickup_canton_code).trim().toUpperCase() !== "XX" && (
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-neutral-600">Abhol-Kanton</span>
                          <span className="text-neutral-900">{getCantonName(getString(leasingOffer.lease_takeover_offer.pickup_canton_code))}</span>
                        </div>
                      )}
                  </div>
                </div>
             )}

             {/* Pure Lease Takeover (for deal_type=lease_takeover) - Values Summary */}
             {variant === "lease_takeover" && (
                <div className="bg-neutral-50 rounded-2xl p-5 border border-neutral-100">
                   <h4 className="font-semibold text-neutral-900 text-sm mb-4">Vertragsdaten</h4>
                   <div className="grid grid-cols-1 gap-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-neutral-500">Restlaufzeit</span>
                        <span className="text-neutral-900">{getNumber(listing.remaining_months)} Monate</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-neutral-500">Depot / Anzahlung</span>
                        <span className="text-neutral-900">CHF {getNumber(listing.deposit_chf)?.toLocaleString('de-CH') ?? '-'}</span>
                      </div>
                      {getNumber(listing.remaining_km) && (
                        <div className="flex justify-between">
                          <span className="text-neutral-500">Verbleibende KM</span>
                          <span className="text-neutral-900">{getNumber(listing.remaining_km)?.toLocaleString('de-CH')} km</span>
                        </div>
                      )}
                   </div>
                </div>
             )}
          </div>

          {description ? (
            <>
              <Separator className="my-8 border-neutral-100" />
              <div className="space-y-2">
                <div className="text-sm font-semibold text-neutral-900">Beschreibung</div>
                <div className="text-sm text-neutral-700 whitespace-pre-line leading-relaxed">{description}</div>
              </div>
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}