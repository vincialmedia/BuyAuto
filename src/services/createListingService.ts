import { supabase } from "@/integrations/supabase/client";
import type { User } from "@supabase/supabase-js";
import type { DealType, FinancingType, PricePlanId, LeasingOffer, ListingData } from "@/lib/buyauto/types";

export type LeasingOfferPayload = LeasingOffer;

export type ListingUpdatePayload = Partial<{
  id?: string;
  /**
   * Legacy column, dual-written as "v2" on insert until it is dropped: the
   * deployed main branch's listing cards render rows without it as v1
   * (forced Leasingübernahme, no purchase price). Nothing on this branch
   * reads it.
   */
  ui_version?: "v2" | null;
  deal_type?: DealType;
  financing_type?: FinancingType | null;
  leasing_offer?: LeasingOfferPayload | null;
  brand?: string;
  model?: string;
  make_id?: string | null;
  model_id?: string | null;
  variant_id?: string | null;

  vin?: string | null;
  power_hp?: number | null;
  drivetrain?: string | null;
  first_registration?: string | null;

  year?: number;
  mileage_km?: number;
  remaining_km?: number | null;
  fuel?: string;
  gearbox?: string;
  body?: string;
  description?: string;
  price_per_month_chf?: number | null;
  purchase_price_chf?: number | null;
  remaining_months?: number;
  deposit_chf?: number | null;
  contract_end_date?: string | null;
  location?: string;
  canton_code?: string;
  title?: string;
  price_plan?: PricePlanId;
  /**
   * Deliberately absent: premium, is_premium and premium_until. Premium is a paid
   * entitlement, and the owner_update RLS policy would happily let a seller write
   * it from the browser — which is exactly how listings ended up premium without
   * paying. It is granted server-side only (Stripe webhook, garage credit RPC, or
   * an admin), and stripPremiumFields below drops it from any payload that still
   * carries it. The wizard keeps the user's Premium Boost *choice* in wizard/draft
   * state and passes it to /api/billing/prepare, which prices it.
   */
  images?: string[];
  cover_image_index?: number;
  status?: string;
  user_id?: string;
}>;

function clampNumber(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

/**
 * Drop the paid-entitlement columns from a client write. Callers pass whole
 * wizard-state objects through here, so a stray `premium` can arrive without
 * anyone intending it; the database trigger rejects such a write outright, which
 * would surface to the seller as a failed save. Stripping is the quiet fix.
 */
function stripPremiumFields<T extends Record<string, unknown>>(payload: T): T {
  const clean = { ...payload };
  delete (clean as Record<string, unknown>).premium;
  delete (clean as Record<string, unknown>).is_premium;
  delete (clean as Record<string, unknown>).premium_until;
  return clean;
}

function coerceNumber(v: unknown): number | undefined {
  if (typeof v === "number") return Number.isFinite(v) ? v : undefined;
  if (typeof v === "string") {
    const n = Number(v.replace(/[^0-9.\-]/g, ""));
    return Number.isFinite(n) ? n : undefined;
  }
  return undefined;
}

/**
 * The vehicle "core" / technical fields (VIN, canonical make/model/variant ids,
 * power, drivetrain, first registration). These come from Step 1 and used to be
 * hand-copied into some write payloads but dropped from others (the Step-2
 * INSERT dropped all seven — audit finding U4). Centralising them here means
 * every write path includes the same set and they can never silently drift.
 */
export function vehicleCoreFieldsFromWizard(
  data: ListingData
): Pick<
  ListingUpdatePayload,
  "vin" | "make_id" | "model_id" | "variant_id" | "power_hp" | "drivetrain" | "first_registration"
> {
  const anyData = data as any;
  const hp = coerceNumber(anyData?.power_hp);

  // make_id/model_id/variant_id are uuid columns. Step 1's react-hook-form
  // defaults are "" and its mount effect mirrors raw form values into wizard
  // state, so "" can sit in `data` until the next Step-1 submit nulls it.
  // Postgres rejects '' for uuid ("invalid input syntax"), which would fail
  // the whole listing write — so an empty string is normalized to null here,
  // at the single choke point every write path shares.
  const uuidOrNull = (v: unknown): string | null =>
    typeof v === "string" && v.trim() !== "" ? v : null;

  return {
    vin: typeof anyData?.vin === "string" ? anyData.vin : null,
    make_id: uuidOrNull(anyData?.make_id),
    model_id: uuidOrNull(anyData?.model_id),
    variant_id: uuidOrNull(anyData?.variant_id),
    power_hp: typeof hp === "number" ? Math.round(hp) : null,
    drivetrain: typeof anyData?.drivetrain === "string" ? anyData.drivetrain : null,
    first_registration: typeof anyData?.first_registration === "string" ? anyData.first_registration : null,
  };
}

function normalizeLeasingOfferForDirectPurchaseInsert(
  payload: ListingUpdatePayload & { deal_type: "direct_purchase"; financing_type: FinancingType }
): ListingUpdatePayload {
  if (payload.financing_type === "cash") {
    const offer = payload.leasing_offer as LeasingOfferPayload | null | undefined;
    if (offer?.lease_takeover_offer?.enabled === true) {
      const takeover = offer.lease_takeover_offer;
      const pickupCanton =
        (String(takeover.pickup_canton_code ?? "").trim() || "XX").toUpperCase();

      return {
        ...payload,
        leasing_offer: {
          enabled: false,
          interest_rate_pct: 0,
          down_payment_pct: 0,
          no_down_payment: false,
          min_term_months: 0,
          max_term_months: 0,
          lease_takeover_offer: {
            enabled: true,
            price_per_month_chf: Math.max(1, Math.round(Number(takeover.price_per_month_chf))),
            remaining_months: Math.max(1, Math.floor(Number(takeover.remaining_months))),
            deposit_chf: Math.max(0, Math.round(Number(takeover.deposit_chf))),
            remaining_km:
              typeof takeover.remaining_km === "number" && Number.isFinite(takeover.remaining_km)
                ? Math.max(0, Math.round(Number(takeover.remaining_km)))
                : undefined,
            pickup_canton_code: pickupCanton,
          },
        } as LeasingOfferPayload,
      };
    }

    return { ...payload, leasing_offer: null };
  }

  const offer = payload.leasing_offer;
  if (!offer || typeof offer !== "object") {
    throw new Error("leasing_offer is required when financing_type is leasing");
  }

  const enabled = offer.enabled === true;
  if (!enabled) {
    throw new Error("leasing_offer.enabled must be true when financing_type is leasing");
  }

  const noDownPayment = offer.no_down_payment === true;
  const normalizedDownPaymentPct = noDownPayment ? 0 : clampNumber(Number(offer.down_payment_pct), 0, 100);

  const rawResidualAdj = Number((offer as LeasingOfferPayload).residual_pct_adjustment_pp ?? 0);
  const residual_pct_adjustment_pp = Number.isFinite(rawResidualAdj) ? clampNumber(rawResidualAdj, -20, 20) : 0;

  const takeover = (offer as LeasingOfferPayload).lease_takeover_offer;

  const pickupCanton =
    takeover?.enabled === true
      ? (String(takeover.pickup_canton_code ?? "").trim() || "XX").toUpperCase()
      : "";

  const normalizedOffer: LeasingOfferPayload = {
    enabled: true,
    interest_rate_pct: clampNumber(Number(offer.interest_rate_pct), 0.01, 99),
    down_payment_pct: normalizedDownPaymentPct,
    no_down_payment: noDownPayment,
    min_term_months: Math.max(1, Math.floor(Number(offer.min_term_months))),
    max_term_months: Math.max(1, Math.floor(Number(offer.max_term_months))),
    km_options: Array.isArray(offer.km_options) ? offer.km_options.map((v) => Math.floor(Number(v))) : undefined,
    residual_pct_adjustment_pp: residual_pct_adjustment_pp,
    lease_takeover_offer:
      takeover?.enabled === true
        ? {
            enabled: true,
            price_per_month_chf: Math.max(1, Math.round(Number(takeover.price_per_month_chf))),
            remaining_months: Math.max(1, Math.floor(Number(takeover.remaining_months))),
            deposit_chf: Math.max(0, Math.round(Number(takeover.deposit_chf))),
            remaining_km:
              typeof takeover.remaining_km === "number" && Number.isFinite(takeover.remaining_km)
                ? Math.max(0, Math.round(Number(takeover.remaining_km)))
                : undefined,
            pickup_canton_code: pickupCanton,
          }
        : undefined,
  };

  if (!Number.isFinite(normalizedOffer.interest_rate_pct)) {
    throw new Error("leasing_offer.interest_rate_pct is required");
  }

  if (!Number.isFinite(normalizedOffer.min_term_months) || !Number.isFinite(normalizedOffer.max_term_months)) {
    throw new Error("leasing_offer min/max term months are required");
  }

  if (normalizedOffer.min_term_months > normalizedOffer.max_term_months) {
    throw new Error("leasing_offer.min_term_months must be <= max_term_months");
  }

  if (normalizedOffer.no_down_payment && normalizedOffer.down_payment_pct !== 0) {
    throw new Error("leasing_offer.down_payment_pct must be 0 when no_down_payment is true");
  }

  return { ...payload, leasing_offer: normalizedOffer };
}

function normalizeDealFieldsForInsert(payload: ListingUpdatePayload): ListingUpdatePayload {
  const dealType: DealType = payload.deal_type ?? "direct_purchase";

  if (dealType === "lease_takeover") {
    const deal_type: DealType = "lease_takeover";
    return {
      ...payload,
      ui_version: "v2",
      deal_type,
      financing_type: null,
      leasing_offer: null,
      purchase_price_chf: null,
    };
  }

  const deal_type: DealType = "direct_purchase";
  const financing_type: FinancingType = payload.financing_type === "leasing" ? "leasing" : "cash";

  const hasLegacyPricePerMonth = typeof payload.price_per_month_chf === "number" && Number.isFinite(payload.price_per_month_chf);
  const hasPurchasePrice =
    typeof payload.purchase_price_chf === "number" && Number.isFinite(payload.purchase_price_chf) && payload.purchase_price_chf > 0;

  const base: ListingUpdatePayload = {
    ...payload,
    ui_version: "v2",
    deal_type,
    financing_type,
    purchase_price_chf: hasPurchasePrice ? payload.purchase_price_chf : hasLegacyPricePerMonth ? payload.price_per_month_chf : payload.purchase_price_chf,
    price_per_month_chf: null,
  };

  const hasLeasingOfferField = Object.prototype.hasOwnProperty.call(payload, "leasing_offer");
  const leasingOfferProvided = hasLeasingOfferField && (payload as any).leasing_offer !== undefined;

  if (!leasingOfferProvided) {
    return base;
  }

  return normalizeLeasingOfferForDirectPurchaseInsert({
    ...(base as ListingUpdatePayload),
    deal_type: "direct_purchase",
    financing_type,
    leasing_offer: (payload as any).leasing_offer as LeasingOfferPayload | null,
  } as ListingUpdatePayload & { deal_type: "direct_purchase"; financing_type: FinancingType });
}

function normalizeDealFieldsForUpdate(payload: ListingUpdatePayload): ListingUpdatePayload {
  const hasDealType = typeof payload.deal_type === "string";
  const hasFinancingField = Object.prototype.hasOwnProperty.call(payload, "financing_type");
  const hasLeasingOfferField = Object.prototype.hasOwnProperty.call(payload, "leasing_offer");
  const leasingOfferProvided = hasLeasingOfferField && (payload as any).leasing_offer !== undefined;

  const hasLegacyPricePerMonth = typeof payload.price_per_month_chf === "number" && Number.isFinite(payload.price_per_month_chf);
  const hasPurchasePrice =
    typeof payload.purchase_price_chf === "number" && Number.isFinite(payload.purchase_price_chf) && payload.purchase_price_chf > 0;

  const hasRemainingMonths =
    typeof payload.remaining_months === "number" && Number.isFinite(payload.remaining_months) && payload.remaining_months > 0;

  if ((payload.deal_type ?? null) === "direct_purchase" && !hasPurchasePrice && hasLegacyPricePerMonth && !hasRemainingMonths) {
    payload = { ...payload, purchase_price_chf: payload.price_per_month_chf, price_per_month_chf: null };
  }

  if (!hasDealType && !hasFinancingField && !hasLeasingOfferField) return payload;

  if (!hasDealType && (hasFinancingField || hasLeasingOfferField)) {
    throw new Error("deal_type is required when updating financing_type or leasing_offer");
  }

  const dealType = payload.deal_type as DealType;

  if (dealType === "lease_takeover") {
    return { ...payload, financing_type: null, leasing_offer: null, purchase_price_chf: null };
  }

  if (dealType === "direct_purchase") {
    if (hasFinancingField) {
      const nextFinancing = payload.financing_type;
      if (nextFinancing !== "cash" && nextFinancing !== "leasing") {
        throw new Error("financing_type must be cash or leasing when deal_type is direct_purchase");
      }

      if (nextFinancing === "cash") {
        if (!leasingOfferProvided) {
          return { ...payload, financing_type: "cash", leasing_offer: null };
        }

        const offer = payload.leasing_offer as LeasingOfferPayload | null | undefined;
        if (offer?.lease_takeover_offer?.enabled === true) {
          return normalizeLeasingOfferForDirectPurchaseInsert({
            ...(payload as ListingUpdatePayload),
            deal_type: "direct_purchase",
            financing_type: "cash",
            leasing_offer: offer,
          } as ListingUpdatePayload & { deal_type: "direct_purchase"; financing_type: FinancingType });
        }

        return { ...payload, financing_type: "cash", leasing_offer: null };
      }

      return normalizeLeasingOfferForDirectPurchaseInsert({
        ...(payload as ListingUpdatePayload),
        deal_type: "direct_purchase",
        financing_type: "leasing",
        leasing_offer: payload.leasing_offer as LeasingOfferPayload | null,
      } as ListingUpdatePayload & { deal_type: "direct_purchase"; financing_type: FinancingType });
    }

    if (hasLeasingOfferField) {
      const currentOffer = payload.leasing_offer;
      if (currentOffer === null) return payload;
      if (!currentOffer || typeof currentOffer !== "object") {
        throw new Error("leasing_offer must be an object or null");
      }

      const offerPayload = currentOffer as LeasingOfferPayload;
      const inferredFinancing: FinancingType = offerPayload.enabled === true ? "leasing" : "cash";

      return normalizeLeasingOfferForDirectPurchaseInsert({
        ...(payload as ListingUpdatePayload),
        deal_type: "direct_purchase",
        financing_type: inferredFinancing,
        leasing_offer: offerPayload,
      } as ListingUpdatePayload & { deal_type: "direct_purchase"; financing_type: FinancingType });
    }

    return payload;
  }

  return payload;
}

export const createOrUpdateListing = async (
  data: ListingUpdatePayload,
  user: User
) => {
  if (!user) {
    throw new Error("User must be authenticated.");
  }

  const listingId = data.id;

  if (!listingId) {
    const listingDataForInsert = {
      ...stripPremiumFields(normalizeDealFieldsForInsert(data)),
      user_id: user.id,
      created_by: user.id,
      status: "draft",
    };

    delete listingDataForInsert.id;

    const { data: newListing, error } = await supabase
      .from("listings")
      .insert(listingDataForInsert)
      .select()
      .single();

    if (error) {
      console.error("Error creating new listing:", {
        message: (error as any)?.message,
        code: (error as any)?.code,
        details: (error as any)?.details,
        hint: (error as any)?.hint,
      });
      throw error;
    }

    console.log("✅ New listing created:", newListing);
    return newListing;
  }

  const { id, ...updateData } = normalizeDealFieldsForUpdate(data);

  const cleanUpdateData = stripPremiumFields(updateData);
  if ("user_id" in cleanUpdateData) {
    delete cleanUpdateData.user_id;
  }
  if ("status" in cleanUpdateData) {
    delete (cleanUpdateData as unknown as { status?: unknown }).status;
  }

  const { data: updatedListing, error } = await supabase
    .from("listings")
    .update(cleanUpdateData)
    .eq("id", id)
    .eq("user_id", user.id)
    .select()
    .single();

  if (error) {
    console.error(`Error updating listing ${id}:`, {
      message: (error as any)?.message,
      code: (error as any)?.code,
      details: (error as any)?.details,
      hint: (error as any)?.hint,
    });
    throw error;
  }

  console.log(`✅ Listing ${id} updated:`, updatedListing);
  return updatedListing;
};

export const getDraftListing = async (user: User) => {
  if (!user) return null;

  const { data, error } = await supabase
    .from("listings")
    .select("*")
    .eq("user_id", user.id)
    .eq("status", "draft")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error("Error fetching draft listing:", error);
    return null;
  }

  return data;
};

export const finalizeListing = async (listingId: string, user: User) => {
  if (!user) {
    throw new Error("User must be authenticated.");
  }

  const { data, error } = await supabase
    .from("listings")
    .update({ status: "pending" })
    .eq("id", listingId)
    .eq("user_id", user.id)
    .select()
    .single();

  if (error) {
    console.error(`Error finalizing listing ${listingId}:`, error);
    throw error;
  }

  console.log(`✅ Listing ${listingId} finalized:`, data);
  return data;
};

export async function getListingByIdForOwner(listingId: string, user: User) {
  if (!user || !listingId) {
    console.error("User and listingId are required to fetch listing for owner.");
    return null;
  }

  const { data, error } = await supabase
    .from("listings")
    .select("*")
    .eq("id", listingId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (error) {
    console.error(`Error fetching listing ${listingId} for owner:`, error);
    return null;
  }

  console.log(`✅ Successfully fetched listing ${listingId} for owner.`);
  return data;
}