import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/router";
import dynamic from "next/dynamic";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import ProgressBar from "./ProgressBar";
import Step1_VehicleData from "./Step1_VehicleData";
import Step2_LeasingDetails from "./Step2_LeasingDetails";
import type { DealType, ListingData } from "@/lib/buyauto/types";
import { useAuth } from "@/contexts/AuthContext";
import { checkOwnedListingExists, getListingByIdForOwner, type ListingUpdatePayload } from "@/services/createListingService";
import { createListingDraft, getListingDraftById, getMyListingDrafts, updateListingDraft } from "@/services/listingDraftService";
import {
  clearGuestImages,
  loadGuestImages,
  removeGuestImage,
  saveGuestImages,
  type GuestImagePair,
} from "@/lib/buyauto/guestImageStore";
import { Check, Loader2, Save } from "lucide-react";
import { GARAGE_MAX_PHOTOS } from "@/lib/buyauto/garagePlans";
import { getEntryPage, toDealType, trackOncePerSession, track, type DealType as AnalyticsDealType } from "@/lib/analytics";

const StepLoading = () => (
  <div className="flex items-center justify-center py-12">
    <Loader2 className="h-6 w-6 animate-spin text-neutral-400" />
  </div>
);

// Steps 3-5 and the success screen only render after user interaction,
// so load them lazily to keep them out of the initial bundle.
const Step3_PlanSelection = dynamic(() => import("./Step3_PlanSelection"), {
  loading: StepLoading,
});
const Step4_Images = dynamic(() => import("./Step4_Images").then((mod) => mod.Step4_Images), {
  loading: StepLoading,
});
const Step5_PreviewAndPay = dynamic(() => import("./Step5_PreviewAndPay"), {
  loading: StepLoading,
});
const SuccessScreen = dynamic(() => import("./SuccessScreen"), {
  loading: StepLoading,
});

interface WizardContextType {
  data: ListingData;
  updateData: (updates: Partial<ListingData>) => void;
  currentStep: number;
  setCurrentStep: (step: number) => void;
  nextStep: () => void;
  prevStep: () => void;
  isComplete: boolean;
  setIsComplete: (complete: boolean) => void;
  getMaxPhotos: () => number;
  /** Guest images awaiting upload: File plus its blob preview URL (the URL is
   *  what sits in data.images until the post-sign-in upload swaps it out). */
  guestImageFiles: { url: string; file: File }[];
  setGuestImageFiles: (files: { url: string; file: File }[]) => void;
  draftId: string | null;
  setDraftId: (id: string | null) => void;
  /**
   * Create-or-update the wizard's server draft and return its id. Single-flight:
   * concurrent callers (autosave, guest-draft migration after sign-in, step
   * saves) share one insert instead of each creating their own row.
   */
  persistDraft: (data: Partial<ListingData>) => Promise<string>;
  registerDraftSnapshotter: (snapshotter: () => Partial<ListingData> | Promise<Partial<ListingData>>) => void;
}

const WizardContext = createContext<WizardContextType | undefined>(undefined);

export const useWizard = () => {
  const context = useContext(WizardContext);
  if (!context) {
    throw new Error("useWizard must be used within a WizardProvider");
  }
  return context;
};

// Guests (not logged in) can't write server-side drafts, so their in-progress
// listing is mirrored to localStorage and restored on return.
const GUEST_DRAFT_KEY = "buyauto:guest-listing-draft";

// The guest payload also carries the row id its server draft will get. After an
// email-confirmation sign-up the original tab and the link's tab both migrate
// the same localStorage draft; with a shared id the second insert collides
// (23505) and adopts the first row instead of adding a duplicate.
const toGuestDraftKey = (value: unknown): string | null =>
  typeof value === "string" && value.length > 0 ? value : null;

const readGuestDraftKey = (): string | null => {
  try {
    const raw = window.localStorage.getItem(GUEST_DRAFT_KEY);
    return toGuestDraftKey(raw ? (JSON.parse(raw) as { draftKey?: unknown }).draftKey : null);
  } catch {
    return null;
  }
};

const newGuestDraftKey = (): string | null =>
  typeof crypto !== "undefined" && typeof crypto.randomUUID === "function" ? crypto.randomUUID() : null;

// Reported as listing_step.step_name (stable ids, not the German UI labels).
const STEP_NAMES: Record<number, string> = {
  1: "vehicle",
  2: "offer",
  3: "plan",
  4: "photos",
  5: "preview_payment",
};

const createEmptyListingData = (): ListingData => ({
  id: undefined,
  deal_type: "direct_purchase",
  financing_type: "cash",
  brand: "",
  model: "",
  year: new Date().getFullYear(),
  km: 0,
  body: "",
  fuel: "",
  gearbox: "",
  price_per_month_chf: 0,
  remaining_months: 12,
  deposit_chf: 0,
  contract_end_date: null,
  location: "",
  description: "",
  price_plan: "standard",
  premium: false,
  duration_days: 30,
  plan_price: 0,
  images: [],
  cover_image_index: 0,

  purchase_price_chf: null,

  vin: "",
  power_hp: null,
  drivetrain: "",
  first_registration: null,
  make_id: null,
  model_id: null,
  variant_id: null,

  // The donation fields are deliberately ABSENT from the pristine wizard:
  // Step 3 preselects the CHF 1 donation only when no stored choice exists
  // (donation_enabled === undefined). Predefining them here would make every
  // wizard look like it already carries a "user chose off" decision and the
  // preselect would never activate.
});

const hasAnyUserInput = (data: ListingData) => {
  const anyData = data as any;

  return Boolean(
    (data.brand && data.brand.trim().length > 0) ||
      (data.model && data.model.trim().length > 0) ||
      (data.body && data.body.trim().length > 0) ||
      (data.fuel && data.fuel.trim().length > 0) ||
      (data.gearbox && data.gearbox.trim().length > 0) ||
      (data.location && data.location.trim().length > 0) ||
      (data.description && data.description.trim().length > 0) ||
      (typeof data.km === "number" && data.km > 0) ||
      (typeof data.price_per_month_chf === "number" && data.price_per_month_chf > 0) ||
      (typeof data.deposit_chf === "number" && data.deposit_chf > 0) ||
      (typeof anyData?.purchase_price_chf === "number" && anyData.purchase_price_chf > 0) ||
      (data.price_plan && data.price_plan !== "standard") ||
      data.premium === true ||
      // donation_amount_chf is deliberately NOT checked: Step 3 preselects a
      // default amount, so it alone never proves the user typed anything.
      (anyData?.donation_enabled === true) ||
      (Array.isArray(data.images) && data.images.length > 0) ||
      (anyData?.leasing_offer?.enabled === true) ||
      (anyData?.leasing_offer?.lease_takeover_offer?.enabled === true)
  );
};


const toWizardPatchFromListing = (listing: any, prev: ListingData): Partial<ListingData> => {
  const dealType: DealType = (listing?.deal_type ?? prev.deal_type ?? "direct_purchase") as DealType;

  const financingType =
    dealType === "direct_purchase"
      ? ((listing?.financing_type ?? prev.financing_type ?? "cash") as any)
      : null;

  const leasingOffer = dealType === "direct_purchase" ? (listing?.leasing_offer ?? null) : null;

  const toNumberOrNull = (value: unknown): number | null => {
    const n = typeof value === "number" ? value : typeof value === "string" ? Number(value) : NaN;
    return Number.isFinite(n) ? n : null;
  };

  return {
    id: listing?.id ?? prev.id,
    deal_type: dealType,
    financing_type: financingType,
    leasing_offer: leasingOffer,

    brand: listing?.brand ?? prev.brand,
    model: listing?.model ?? prev.model,
    year: toNumberOrNull(listing?.year) ?? prev.year,
    km: toNumberOrNull(listing?.mileage_km) ?? prev.km,
    remaining_km: listing?.remaining_km ?? (prev as any)?.remaining_km,

    purchase_price_chf:
      toNumberOrNull(listing?.purchase_price_chf) ??
      (typeof (prev as any)?.purchase_price_chf === "number" ? (prev as any).purchase_price_chf : null),

    fuel: listing?.fuel ?? prev.fuel,
    gearbox: listing?.gearbox ?? prev.gearbox,
    body: listing?.body ?? prev.body,
    description: listing?.description ?? prev.description,

    price_per_month_chf: toNumberOrNull(listing?.price_per_month_chf) ?? prev.price_per_month_chf,
    remaining_months: toNumberOrNull(listing?.remaining_months) ?? prev.remaining_months,
    deposit_chf: toNumberOrNull(listing?.deposit_chf) ?? prev.deposit_chf,
    contract_end_date:
      typeof listing?.contract_end_date === "string"
        ? listing.contract_end_date
        : typeof (prev as any)?.contract_end_date === "string"
          ? (prev as any).contract_end_date
          : null,

    location: listing?.location ?? prev.location,
    canton_code: listing?.canton_code ?? (prev as any)?.canton_code,
    title: listing?.title ?? (prev as any)?.title,
    title_suffix: (listing as any)?.title_suffix ?? (prev as any)?.title_suffix ?? null,

    price_plan: (listing?.price_plan ?? prev.price_plan) as any,
    // listings.price_plan is only ever written by Step 3's submit (it has no
    // DB default), so a non-null value is a genuine user choice — mark it as
    // such so Step 3 doesn't replace it with the Verlängert default.
    ...(listing?.price_plan ? { plan_choice_v2: true } : {}),
    // Edit-mode anchors: the server row's plan and payment state, kept
    // separately from price_plan (which the user may change in Step 3). Step 5
    // compares against original_price_plan to decide between «Änderungen
    // speichern» (no expiry change) and the paid plan-change flow.
    original_price_plan: (listing?.price_plan ?? (prev as any)?.original_price_plan ?? null) as any,
    payment_status: (listing?.payment_status ?? (prev as any)?.payment_status ?? null) as any,
    // The row's premium is server state, not the seller's boost choice: the
    // premium-authority trigger keeps it false until the webhook grants it, so
    // taking it here would wipe the boost choice saved in the wizard draft.
    premium: typeof prev.premium === "boolean" ? prev.premium : Boolean(listing?.premium),

    images: Array.isArray(listing?.images) ? (listing.images as string[]) : prev.images,
    cover_image_index: toNumberOrNull(listing?.cover_image_index) ?? prev.cover_image_index,

    status: listing?.status ?? (prev as any)?.status,

    vin: listing?.vin ?? (prev as any)?.vin,
    tg_nr: (listing as any)?.tg_nr ?? (prev as any)?.tg_nr,
    make_id: listing?.make_id ?? (prev as any)?.make_id,
    model_id: listing?.model_id ?? (prev as any)?.model_id,
    variant_id: listing?.variant_id ?? (prev as any)?.variant_id,
    power_hp: toNumberOrNull(listing?.power_hp) ?? (prev as any)?.power_hp,
    drivetrain: listing?.drivetrain ?? (prev as any)?.drivetrain,
    first_registration: listing?.first_registration ?? (prev as any)?.first_registration,
  };
};

// blob: preview URLs stored in a draft die with the tab that minted them. Try
// to rebuild each one from the IndexedDB-persisted guest photos (fresh object
// URL per file, matched in insertion order); anything unrecoverable is dropped
// so the wizard never claims photos it cannot publish.
const rehydrateGuestImagesInData = async (
  draftData: Partial<ListingData>,
  livePairs: GuestImagePair[]
): Promise<{ data: Partial<ListingData>; pairs: GuestImagePair[] }> => {
  const images = Array.isArray(draftData.images) ? (draftData.images as string[]) : [];
  const blobUrls = images.filter((u) => typeof u === "string" && u.startsWith("blob:"));
  if (blobUrls.length === 0) return { data: draftData, pairs: livePairs };

  const liveByUrl = new Map(livePairs.map((p) => [p.url, p]));
  const stored = await loadGuestImages();
  let storedIdx = 0;

  const nextPairs: GuestImagePair[] = [...livePairs];
  const urlReplacements = new Map<string, string | null>();

  for (const blobUrl of blobUrls) {
    if (liveByUrl.has(blobUrl)) {
      urlReplacements.set(blobUrl, blobUrl);
      continue;
    }
    const record = stored[storedIdx];
    storedIdx += 1;
    if (record) {
      const freshUrl = URL.createObjectURL(record.file);
      nextPairs.push({ url: freshUrl, file: record.file });
      urlReplacements.set(blobUrl, freshUrl);
      // Re-key the stored record to the live preview URL so a later removal
      // at Step 4 (which deletes by preview URL) finds it.
      void saveGuestImages([{ url: freshUrl, file: record.file }]);
      void removeGuestImage(record.previewUrl);
    } else {
      urlReplacements.set(blobUrl, null);
    }
  }

  const nextImages = images
    .map((u) => (u.startsWith("blob:") ? urlReplacements.get(u) ?? null : u))
    .filter((u): u is string => typeof u === "string");

  const coverIndex =
    typeof draftData.cover_image_index === "number" && draftData.cover_image_index < nextImages.length
      ? draftData.cover_image_index
      : 0;

  return {
    data: { ...draftData, images: nextImages, cover_image_index: coverIndex },
    pairs: nextPairs,
  };
};

export default function ListingWizard() {
  const router = useRouter();
  const { toast } = useToast();
  const { user, profile } = useAuth();
  const isGarage = profile?.role === "garage";
  const isEditingExistingListing = typeof router.query.edit === "string" && router.query.edit.length > 0;

  const [currentStep, setCurrentStep] = useState(1);
  const [isComplete, setIsComplete] = useState(false);
  const [guestImageFiles, setGuestImageFiles] = useState<{ url: string; file: File }[]>([]);
  const [draftId, setDraftId] = useState<string | null>(null);
  const [data, setData] = useState<ListingData>(() => createEmptyListingData());
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const [isLoadingFromQuery, setIsLoadingFromQuery] = useState(true);
  const [autosaveState, setAutosaveState] = useState<"idle" | "saving" | "saved" | "error">("idle");

  const draftSnapshotterRef = useRef<() => Partial<ListingData> | Promise<Partial<ListingData>>>(() => ({}));
  const autosaveInFlightRef = useRef(false);
  const lastAutosavedRef = useRef<string>("");
  const guestImageFilesRef = useRef(guestImageFiles);
  // Mirrors draftId synchronously, plus the in-flight insert (if any), so two
  // callers racing on "no draft yet" can't both insert. This is what used to
  // leave a freshly signed-up seller with two identical drafts: the post-sign-in
  // guest-draft migration and the autosave tick each created one.
  const draftIdRef = useRef<string | null>(null);
  const draftCreateRef = useRef<Promise<string> | null>(null);
  // Set when a step closes the draft (Step 5 clears it after publishing). An
  // autosave tick landing between that and setIsComplete(true) would otherwise
  // insert a fresh row for the listing that was just published.
  const draftClosedRef = useRef(false);
  // The guest draftKey this tab last read or wrote, captured together with the
  // payload. The other tab may remove the localStorage entry while this one is
  // still rehydrating photos, so the key must not be re-read only at insert time.
  const guestDraftKeyRef = useRef<string | null>(null);

  const setDraftIdSynced = useCallback((id: string | null) => {
    draftIdRef.current = id;
    if (id === null) draftCreateRef.current = null;
    else draftClosedRef.current = false;
    setDraftId(id);
  }, []);

  const setDraftIdFromStep = useCallback(
    (id: string | null) => {
      if (id === null) draftClosedRef.current = true;
      setDraftIdSynced(id);
    },
    [setDraftIdSynced]
  );

  const persistDraft = useCallback(
    async (draftData: Partial<ListingData>): Promise<string> => {
      if (!user) throw new Error("persistDraft requires a signed-in user");

      if (!draftIdRef.current && draftCreateRef.current) {
        // Another caller is already inserting; wait for its row and update it.
        await draftCreateRef.current;
      }

      const existingId = draftIdRef.current;
      if (existingId) {
        await updateListingDraft({ user, draftId: existingId, data: draftData });
        return existingId;
      }

      // Reuse the pending guest draft's id (if any) so another tab migrating the
      // same guest draft converges on this row. Every create in this tab —
      // autosave or migration, whichever wins — uses it. Only a key this tab
      // itself read or wrote counts: a tab that never touched the guest payload
      // (edit mode, ?draft=, garage) must not claim it, or a later migration
      // would 23505 into that unrelated draft and overwrite it.
      const isExistingListingDraft = typeof draftData.id === "string" && draftData.id.length > 0;
      const preferredId = isExistingListingDraft ? null : guestDraftKeyRef.current;
      const createPromise = (async () => {
        let id: string;
        try {
          id = (await createListingDraft({ user, data: draftData, id: preferredId ?? undefined })).id;
        } catch (e) {
          if (!preferredId || (e as { code?: string } | null)?.code !== "23505") throw e;
          // Another tab already migrated this guest draft: adopt its row. If it
          // isn't ours to update (shouldn't happen), fall back to a fresh row.
          try {
            id = (await updateListingDraft({ user, draftId: preferredId, data: draftData })).id;
          } catch {
            id = (await createListingDraft({ user, data: draftData })).id;
          }
        }
        draftIdRef.current = id;
        guestDraftKeyRef.current = null;
        setDraftId(id);
        return id;
      })();
      draftCreateRef.current = createPromise;
      try {
        const id = await createPromise;
        if (router.isReady && router.query.draft !== id) {
          await router.replace({ pathname: router.pathname, query: { ...router.query, draft: id } }, undefined, {
            shallow: true,
          });
        }
        return id;
      } finally {
        if (draftCreateRef.current === createPromise) draftCreateRef.current = null;
      }
    },
    [router, user]
  );

  useEffect(() => {
    guestImageFilesRef.current = guestImageFiles;
  }, [guestImageFiles]);

  const registerDraftSnapshotter = useCallback(
    (snapshotter: () => Partial<ListingData> | Promise<Partial<ListingData>>) => {
      draftSnapshotterRef.current = snapshotter;
    },
    []
  );

  const updateData = useCallback((updates: Partial<ListingData>) => {
    setData((prev) => ({ ...prev, ...updates }));
  }, []);

  const getMaxPhotos = useCallback(() => {
    // Garages skip the plan step entirely, so their drafts keep the default
    // price_plan "standard" — which used to cap a CHF 599/month dealer at 5
    // photos, fewer than a private seller on the CHF 50 plan. Their photo
    // allowance comes from the garage package, not from a per-listing plan.
    if (isGarage) return GARAGE_MAX_PHOTOS;
    if (data.price_plan === "extended" || data.price_plan === "unlimited") return 15;
    return 5;
  }, [data.price_plan, isGarage]);

  useEffect(() => {
    if (isGarage && currentStep === 3) setCurrentStep(4);
  }, [currentStep, isGarage]);

  // Returning from a Stripe redirect (TWINT, some 3DS cards): Stripe sends the
  // buyer back to /inserat-erstellen?payment_confirmed=true&payment_intent_...
  // Jump straight to Step 5 so its payment-confirmation effect runs and shows
  // the success screen, instead of dumping the user on an empty Step 1.
  useEffect(() => {
    if (!router.isReady) return;
    if (router.query.payment_confirmed === "true") {
      setCurrentStep(5);
    }
  }, [router.isReady, router.query.payment_confirmed]);

  const nextStep = useCallback(() => {
    setCurrentStep((prev) => {
      if (prev >= 5) return prev;

      if (prev === 1) return 2;
      if (prev === 2) return isGarage ? 4 : 3;
      if (prev === 3) return 4;
      if (prev === 4) return 5;

      return prev + 1;
    });
  }, [isGarage]);

  const prevStep = useCallback(() => {
    setCurrentStep((prev) => {
      if (prev <= 1) return prev;

      if (prev === 5) return 4;
      if (prev === 4) return isGarage ? 2 : 3;
      if (prev === 3) return 2;
      if (prev === 2) return 1;

      return prev - 1;
    });
  }, [isGarage]);

  const contextValue: WizardContextType = useMemo(
    () => ({
      data,
      updateData,
      currentStep,
      setCurrentStep,
      nextStep,
      prevStep,
      isComplete,
      setIsComplete,
      getMaxPhotos,
      guestImageFiles,
      setGuestImageFiles,
      draftId,
      setDraftId: setDraftIdFromStep,
      persistDraft,
      registerDraftSnapshotter,
    }),
    [
      data,
      updateData,
      currentStep,
      nextStep,
      prevStep,
      isComplete,
      getMaxPhotos,
      guestImageFiles,
      draftId,
      setDraftIdFromStep,
      persistDraft,
      registerDraftSnapshotter,
    ]
  );

  // Read through a ref so the loader below doesn't re-run on every router change.
  const persistDraftRef = useRef(persistDraft);
  persistDraftRef.current = persistDraft;

  useEffect(() => {
    if (!router.isReady) return;

    const run = async () => {
      try {
        const draftQuery = router.query.draft;
        const editQuery = router.query.edit;

        if (!user) {
          // Guest: restore an in-progress listing from localStorage (if any) so
          // reopening the page — or returning after email confirmation — resumes
          // where they left off. Only applies to a fresh, non-edit visit.
          if (typeof editQuery !== "string" && typeof window !== "undefined") {
            try {
              const raw = window.localStorage.getItem(GUEST_DRAFT_KEY);
              if (raw) {
                const parsed = JSON.parse(raw) as { data?: Partial<ListingData>; draftKey?: unknown };
                guestDraftKeyRef.current = toGuestDraftKey(parsed?.draftKey);
                const restored = parsed?.data;
                if (restored && hasAnyUserInput({ ...createEmptyListingData(), ...restored } as ListingData)) {
                  const { data: hydrated, pairs } = await rehydrateGuestImagesInData(
                    { ...restored, id: undefined },
                    guestImageFilesRef.current
                  );
                  setGuestImageFiles(pairs);
                  setData((prev) => ({ ...prev, ...hydrated, id: undefined }));
                }
              }
            } catch {
              /* ignore malformed local draft */
            }
          }
          setIsLoadingFromQuery(false);
          return;
        }

        if (typeof draftQuery === "string" && draftQuery.length > 0) {
          const draft = await getListingDraftById({ user, draftId: draftQuery });
          if (draft) {
            setDraftIdSynced(draft.id);
            const draftDataRaw = (draft.data as any) ?? {};
            if (isGarage) {
              const { id: _id, status: _status, ...rest } = draftDataRaw ?? {};
              setData((prev) => ({ ...prev, ...(rest as any), id: undefined }));
            } else {
              const { data: hydrated, pairs } = await rehydrateGuestImagesInData(
                draftDataRaw as Partial<ListingData>,
                guestImageFilesRef.current
              );
              setGuestImageFiles(pairs);
              setData((prev) => ({ ...prev, ...(hydrated as any) }));

              const draftListingId = draftDataRaw?.id;
              if (typeof draftListingId === "string" && draftListingId.length > 0) {
                try {
                  const listing = await getListingByIdForOwner(draftListingId, user);
                  if (listing) {
                    setData((prev) => ({ ...prev, ...toWizardPatchFromListing(listing, prev) }));
                  } else {
                    // The linked listing may be gone for good (e.g. hard-deleted
                    // by the draft sweep). Only when its absence is confirmed —
                    // not on a failed check — drop the stale id, so the next
                    // submit creates a fresh row instead of updating a ghost.
                    const exists = await checkOwnedListingExists(draftListingId, user);
                    if (exists === false) {
                      setData((prev) => ({ ...prev, id: undefined }));
                    }
                  }
                } catch (e) {
                  console.warn("Could not refresh listing while loading draft:", e);
                }
              }
            }
          }
          setIsLoadingFromQuery(false);
          return;
        }

        if (typeof editQuery === "string" && editQuery.length > 0) {
          const listing = await getListingByIdForOwner(editQuery, user);
          if (listing) {
            setDraftIdSynced(null);
            setData((prev) => ({ ...prev, ...toWizardPatchFromListing(listing, prev) }));
          }
          setIsLoadingFromQuery(false);
          return;
        }

        // Signed-in visit without an explicit draft/edit target: don't start
        // from scratch while recoverable work exists. This is the path a seller
        // lands on after the signup email round trip — before this check, their
        // guest draft was silently ignored and the wizard came up empty.
        if (!isGarage && typeof window !== "undefined") {
          // 1) A guest draft in localStorage is unmigrated pre-sign-in work
          //    (it is removed once a server draft owns the state). Adopt it.
          let guestDraft: Partial<ListingData> | null = null;
          try {
            const raw = window.localStorage.getItem(GUEST_DRAFT_KEY);
            const parsed = raw ? (JSON.parse(raw) as { data?: Partial<ListingData>; draftKey?: unknown }) : null;
            guestDraft = parsed?.data ?? null;
            if (guestDraft) guestDraftKeyRef.current = toGuestDraftKey(parsed?.draftKey);
          } catch {
            guestDraft = null;
          }

          if (guestDraft && hasAnyUserInput({ ...createEmptyListingData(), ...guestDraft } as ListingData)) {
            const { data: hydrated, pairs } = await rehydrateGuestImagesInData(
              { ...guestDraft, id: undefined },
              guestImageFilesRef.current
            );
            setGuestImageFiles(pairs);
            setData((prev) => ({ ...prev, ...hydrated, id: undefined }));
            try {
              await persistDraftRef.current(hydrated);
              window.localStorage.removeItem(GUEST_DRAFT_KEY);
            } catch (e) {
              console.warn("Could not migrate guest draft to a server draft:", e);
            }
            toast({
              title: "Entwurf wiederhergestellt",
              description: "Dein begonnenes Inserat wurde übernommen.",
            });
            setIsLoadingFromQuery(false);
            return;
          }

          // 2) Otherwise resume the newest server draft that contains real work
          //    (empty autosave shells are skipped).
          try {
            const drafts = await getMyListingDrafts({ user });
            const resumable = drafts.find((d) =>
              hasAnyUserInput({ ...createEmptyListingData(), ...(d.data as any) } as ListingData)
            );
            if (resumable) {
              setDraftIdSynced(resumable.id);
              const { data: hydrated, pairs } = await rehydrateGuestImagesInData(
                resumable.data,
                guestImageFilesRef.current
              );
              setGuestImageFiles(pairs);
              setData((prev) => ({ ...prev, ...(hydrated as any) }));
              await router.replace(
                { pathname: router.pathname, query: { ...router.query, draft: resumable.id } },
                undefined,
                { shallow: true }
              );
              toast({
                title: "Entwurf wiederhergestellt",
                description: "Du kannst dein begonnenes Inserat fortsetzen.",
              });
              setIsLoadingFromQuery(false);
              return;
            }
          } catch (e) {
            console.warn("Could not check for resumable drafts:", e);
          }
        }

        // Clean create (no draft, no edit, nothing to resume): every new
        // listing is a Direktkauf — a Leasingübernahme is offered as an option
        // inside Step 2, so the old ?deal_type= deep-link no longer seeds a
        // pure lease_takeover.
        setIsLoadingFromQuery(false);
      } catch (e) {
        setIsLoadingFromQuery(false);
        toast({
          title: "Entwurf konnte nicht geladen werden",
          description: "Bitte versuche es erneut.",
          variant: "destructive",
        });
      }
    };

    void run();
  }, [isGarage, router.isReady, router.query.draft, router.query.edit, router.query.deal_type, setDraftIdSynced, toast, user]);

  const onSaveDraft = useCallback(async () => {
    if (isSavingDraft) return;

    if (!user) {
      // Guests: the wizard mirrors state to localStorage continuously, so a
      // manual save just captures the live form state and confirms — the
      // server-side draft is created after sign-in at Step 5.
      try {
        const livePatch = (await Promise.resolve(draftSnapshotterRef.current?.() ?? {})) ?? {};
        const draftData = { ...data, ...livePatch };
        if (!hasAnyUserInput(draftData as ListingData)) {
          toast({
            title: "Noch nichts zu speichern",
            description: "Fülle mindestens ein Feld aus, um einen Entwurf zu speichern.",
          });
          return;
        }
        updateData(draftData);
        toast({
          title: "Entwurf gespeichert",
          description: "Dein Entwurf ist auf diesem Gerät gespeichert und wird beim Anmelden übernommen.",
        });
      } catch {
        toast({
          title: "Entwurf konnte nicht gespeichert werden",
          description: "Bitte versuche es erneut.",
          variant: "destructive",
        });
      }
      return;
    }

    setIsSavingDraft(true);
    try {
      let livePatch: Partial<ListingData> = {};
      try {
        livePatch = (await Promise.resolve(draftSnapshotterRef.current?.() ?? {})) ?? {};
      } catch (e) {
        console.warn("Could not capture live draft snapshot:", e);
      }

      let draftData: Partial<ListingData> = { ...data, ...livePatch };
      if (!isGarage || isEditingExistingListing) {
        if (typeof data.id === "string" && data.id.length > 0) {
          (draftData as any).id = data.id;
        }
      } else {
        delete (draftData as any).id;
      }

      if (draftId) {
        try {
          const existing = await getListingDraftById({ user, draftId });
          if (existing?.data) {
            draftData = { ...(existing.data as any), ...(draftData as any) };
          }
        } catch (e) {
          console.warn("Could not load existing draft before saving:", e);
        }
      }

      if (!hasAnyUserInput(draftData as ListingData)) {
        toast({
          title: "Noch nichts zu speichern",
          description: "Fülle mindestens ein Feld aus, um einen Entwurf zu speichern.",
        });
        return;
      }

      updateData(draftData);

      await persistDraft(draftData);
      toast({ title: "Entwurf gespeichert" });
    } catch (e) {
      toast({
        title: "Speichern fehlgeschlagen",
        description: "Bitte versuche es erneut.",
        variant: "destructive",
      });
    } finally {
      setIsSavingDraft(false);
    }
  }, [data, draftId, isEditingExistingListing, isGarage, isSavingDraft, persistDraft, toast, updateData, user]);

  // Continuous autosave: periodically capture the active step's live form values
  // (via the snapshotter) plus committed wizard data, and upsert the draft with
  // last-write-wins. Purely additive — the explicit "Entwurf speichern" button
  // and per-step draft writes keep working; this just means work is never lost.
  const runAutosave = useCallback(async () => {
    if (isLoadingFromQuery || isEditingExistingListing || isComplete || draftClosedRef.current) return;
    if (typeof window !== "undefined" && new URLSearchParams(window.location.search).get("payment_confirmed") === "true") {
      return;
    }
    if (autosaveInFlightRef.current) return;

    let livePatch: Partial<ListingData> = {};
    try {
      livePatch = (await Promise.resolve(draftSnapshotterRef.current?.() ?? {})) ?? {};
    } catch {
      livePatch = {};
    }

    const draftData: Partial<ListingData> = { ...data, ...livePatch };
    if ((isGarage && !isEditingExistingListing) || !user) {
      delete (draftData as any).id;
    } else if (typeof data.id === "string" && data.id.length > 0) {
      (draftData as any).id = data.id;
    }

    if (!hasAnyUserInput(draftData as ListingData)) return;

    const snapshot = JSON.stringify(draftData);
    if (snapshot === lastAutosavedRef.current) return;

    // Guest (not logged in): keep the draft in localStorage so nothing is lost
    // before they sign in at the final step. Server-side drafts need a user_id.
    if (!user) {
      try {
        const draftKey = guestDraftKeyRef.current ?? readGuestDraftKey() ?? newGuestDraftKey();
        guestDraftKeyRef.current = draftKey;
        window.localStorage.setItem(
          GUEST_DRAFT_KEY,
          JSON.stringify({ savedAt: new Date().toISOString(), draftKey, data: draftData })
        );
        lastAutosavedRef.current = snapshot;
        setAutosaveState("saved");
      } catch {
        setAutosaveState("error");
      }
      return;
    }

    autosaveInFlightRef.current = true;
    setAutosaveState("saving");
    try {
      await persistDraft(draftData);
      lastAutosavedRef.current = snapshot;
      setAutosaveState("saved");
      // The server draft now owns the state; drop the pre-sign-in mirror so a
      // later fresh visit resumes the server draft instead of re-migrating a
      // stale local copy into a duplicate.
      try {
        window.localStorage.removeItem(GUEST_DRAFT_KEY);
      } catch {
        /* ignore */
      }
    } catch (e) {
      console.warn("Autosave failed:", e);
      setAutosaveState("error");
    } finally {
      autosaveInFlightRef.current = false;
    }
  }, [data, isComplete, isEditingExistingListing, isGarage, isLoadingFromQuery, persistDraft, user]);

  useEffect(() => {
    const interval = setInterval(() => {
      void runAutosave();
    }, 4000);
    return () => clearInterval(interval);
  }, [runAutosave]);

  // Latest deal type for the listeners/effects below without re-binding them.
  const dealTypeRef = useRef<AnalyticsDealType>(toDealType(data));
  dealTypeRef.current = toDealType(data);

  // GA4 listing_start: the first meaningful interaction with the creation
  // form, i.e. the first input/change event from any field — merely opening
  // the page or clicking around does not count. Native capture-phase
  // listeners on the steps container so Radix controls (whose hidden bubble
  // inputs dispatch bubbling change events) count alongside plain inputs.
  // Once per browser session, so reloads, draft resumes and the Stripe
  // redirect return don't fire it again; editing an existing listing is not a
  // creation start.
  const stepsContainerRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    if (isEditingExistingListing) return;
    const el = stepsContainerRef.current;
    if (!el) return;
    const onFirstFormInput = () => {
      removeListeners();
      trackOncePerSession("ba_listing_start", "listing_start", {
        deal_type: dealTypeRef.current,
        entry_page: getEntryPage(),
      });
    };
    const removeListeners = () => {
      el.removeEventListener("input", onFirstFormInput, true);
      el.removeEventListener("change", onFirstFormInput, true);
    };
    el.addEventListener("input", onFirstFormInput, true);
    el.addEventListener("change", onFirstFormInput, true);
    return removeListeners;
  }, [isEditingExistingListing]);

  // GA4 listing_step: one event per step reached by moving forward, each step
  // once per wizard visit (going back and forth doesn't re-count). Not for
  // edits, and not for the jump to step 5 on a Stripe redirect return.
  const reportedStepsRef = useRef<Set<number>>(new Set([1]));
  const previousStepRef = useRef(currentStep);
  useEffect(() => {
    const previous = previousStepRef.current;
    previousStepRef.current = currentStep;
    if (currentStep <= previous) return;
    if (isEditingExistingListing || router.query.payment_confirmed === "true") return;
    if (reportedStepsRef.current.has(currentStep)) return;
    reportedStepsRef.current.add(currentStep);
    track("listing_step", {
      funnel_step: currentStep,
      step_name: STEP_NAMES[currentStep] ?? `step_${currentStep}`,
      deal_type: dealTypeRef.current,
    });
  }, [currentStep, isEditingExistingListing, router.query.payment_confirmed]);

  // Once the listing is published, the guest draft has served its purpose.
  useEffect(() => {
    if (isComplete && typeof window !== "undefined") {
      try {
        window.localStorage.removeItem(GUEST_DRAFT_KEY);
      } catch {
        /* ignore */
      }
      void clearGuestImages();
    }
  }, [isComplete]);

  if (isComplete) {
    return <SuccessScreen draft={data} />;
  }

  const canSaveDraft = Boolean(user && !isLoadingFromQuery);
  const autosaveLabel =
    autosaveState === "saving"
      ? "Speichert…"
      : autosaveState === "saved"
        ? "Automatisch gespeichert"
        : autosaveState === "error"
          ? "Speichern fehlgeschlagen"
          : "";

  return (
    <WizardContext.Provider value={contextValue}>
      {/* No min-height or background here: the page shell (MainLayout's focused
          flow branch) owns the full-height gradient and centres this block
          under the header. A 100svh floor here would defeat that centring and
          make the page scrollable on every step. */}
      <div className="w-full">
        <div className="mx-auto w-full max-w-4xl px-4 sm:px-6 lg:px-8 py-6 sm:py-10">
          <Card className="bg-white border border-neutral-200/60 shadow-[0_24px_70px_-40px_rgba(0,0,0,0.45)] rounded-3xl overflow-hidden">
            <div className="px-5 sm:px-8 py-5 sm:py-7 border-b border-neutral-200/60">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                <div className="min-w-0">
                  <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-neutral-900">
                    Inserat erstellen
                  </h1>
                  <p className="mt-2 text-sm sm:text-base text-neutral-600">
                    Schritt für Schritt – klar, sicher, professionell.
                  </p>
                </div>

                <div className="shrink-0 flex items-center gap-3 sm:pt-1">
                  {autosaveLabel && (
                    <span
                      className={`hidden sm:flex items-center gap-1.5 text-xs ${
                        autosaveState === "error" ? "text-red-500" : "text-neutral-500"
                      }`}
                      aria-live="polite"
                    >
                      {autosaveState === "saving" ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : autosaveState === "saved" ? (
                        <Check className="h-3.5 w-3.5 text-green-600" />
                      ) : null}
                      {autosaveLabel}
                    </span>
                  )}
                  <Button
                    type="button"
                    variant="outline"
                    className="rounded-2xl h-10 px-3 sm:px-4 border-neutral-200 bg-white hover:bg-neutral-50"
                    onClick={onSaveDraft}
                    disabled={!canSaveDraft || isSavingDraft}
                  >
                    <Save className="h-4 w-4 sm:mr-2" />
                    <span className="hidden sm:inline">{isSavingDraft ? "Speichern..." : "Entwurf speichern"}</span>
                    <span className="sr-only sm:hidden">{isSavingDraft ? "Speichern..." : "Entwurf speichern"}</span>
                  </Button>
                </div>
              </div>

              <div className="mt-5 sm:mt-6">
                <ProgressBar />
              </div>
            </div>

            <div ref={stepsContainerRef} className="px-5 sm:px-8 py-6 sm:py-8">
              {isLoadingFromQuery ? (
                <div className="text-sm text-neutral-600">Lade Entwurf...</div>
              ) : (
                <>
                  {currentStep === 1 && <Step1_VehicleData />}
                  {currentStep === 2 && <Step2_LeasingDetails />}
                  {currentStep === 3 && !isGarage && <Step3_PlanSelection />}
                  {currentStep === 4 && <Step4_Images />}
                  {currentStep === 5 && <Step5_PreviewAndPay />}
                </>
              )}
            </div>
          </Card>

          <div className="mt-4 text-xs text-neutral-500">
            Tipp: Speichere zwischendurch deinen Entwurf – du kannst später jederzeit weitermachen.
          </div>
        </div>
      </div>
    </WizardContext.Provider>
  );
}