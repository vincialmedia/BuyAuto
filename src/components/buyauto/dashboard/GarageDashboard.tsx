import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";
import dynamic from "next/dynamic";
import { Building2, Crown, Loader2, Calculator } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ListingsSection from "@/components/buyauto/dashboard/ListingsSection";
import DraftsSection from "@/components/buyauto/dashboard/DraftsSection";
import { GarageBillingTab } from "@/components/buyauto/dashboard/GarageBillingTab";
import { GarageProfileTab } from "@/components/buyauto/dashboard/GarageProfileTab";
import { GarageStatsTab } from "@/components/buyauto/dashboard/GarageStatsTab";
import { cn } from "@/lib/utils";
import { dashboardService, type DashboardStats, type ListingInquiryCounts } from "@/services/dashboardService";
import { getMyGarage, updateMyGarage, type Garage } from "@/services/garageService";
import { useHasMounted } from "@/hooks/use-has-mounted";
import { ListingDetail } from "@/lib/buyauto/types";
import { formatDealerEntitlementLabel, formatDateTimeDeCH, getDealerEntitlement, type DealerEntitlement } from "@/services/dealerEntitlementService";
import { MessageCenterSheet } from "@/components/buyauto/messages/MessageCenterSheet";
import { useAuth } from "@/contexts/AuthContext";
import { GarageBasisTab } from "@/components/buyauto/dashboard/GarageBasisTab";

// Client-only chunk, kept out of the dashboard's initial bundle.
const EintauschwertRechner = dynamic(
  () =>
    import("@/components/buyauto/calculator/EintauschwertRechner").then(
      (mod) => mod.EintauschwertRechner
    ),
  { ssr: false }
);

export interface GarageDashboardProps {
  initialGarage: Garage | null;
}

type BannerState =
  | { kind: "idle" }
  | { kind: "success"; message: string }
  | { kind: "error"; message: string };

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === "string") return error;
  return "Unbekannter Fehler";
}

function isListingPausedForStats(listing: ListingDetail): boolean {
  const pausedAt =
    (listing as unknown as { paused_at?: unknown; pausedAt?: unknown }).paused_at ??
    (listing as unknown as { pausedAt?: unknown }).pausedAt ??
    null;

  const pauseUntil =
    (listing as unknown as { pause_until?: unknown; pauseUntil?: unknown }).pause_until ??
    (listing as unknown as { pauseUntil?: unknown }).pauseUntil ??
    null;

  const pausedAtStr = typeof pausedAt === "string" ? pausedAt : null;
  const pauseUntilStr = typeof pauseUntil === "string" ? pauseUntil : null;

  if (pauseUntilStr) {
    const ms = new Date(pauseUntilStr).getTime();
    if (Number.isFinite(ms)) return ms > Date.now();
    return true;
  }

  return Boolean(pausedAtStr);
}

function computeDashboardStatsFromListings(listings: ListingDetail[]): DashboardStats {
  const stats: DashboardStats = { active: 0, pending: 0, sold: 0, expired: 0, totalViews: 0 };

  (Array.isArray(listings) ? listings : []).forEach((l) => {
    const status = l.status;

    const isActive = (status === "active" || status === "published") && !isListingPausedForStats(l);
    if (isActive) stats.active += 1;
    else if (status === "pending") stats.pending += 1;
    else if (status === "sold") stats.sold += 1;
    else if (status === "expired" || status === "archived") stats.expired += 1;

    const raw = (l as any)?.view_count;
    const n = typeof raw === "number" ? raw : typeof raw === "string" ? Number(raw) : 0;
    stats.totalViews += Number.isFinite(n) ? n : 0;
  });

  return stats;
}

function appendCacheBuster(url: string | null | undefined, version?: number): string | undefined {
  if (!url) return undefined;
  if (!version) return url;
  return url.includes("?") ? `${url}&v=${version}` : `${url}?v=${version}`;
}

export function GarageDashboard({ initialGarage }: GarageDashboardProps) {
  const router = useRouter();
  const hasMounted = useHasMounted();
  const { messageCount } = useAuth();

  const [garage, setGarage] = useState<Garage | null>(initialGarage);
  const [garageLoading, setGarageLoading] = useState(!initialGarage);
  const [entitlement, setEntitlement] = useState<DealerEntitlement>({ kind: "none" });

  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);
  
  // We need to fetch listings here to pass them to the stats tab
  // ListingsSection fetches its own listings, but for the stats tab to work 
  // without duplicate fetches inside tabs, we ideally hoist state or let each fetch
  // For simplicity and avoiding complex prop drilling into ListingsSection (which has its own state),
  // we will fetch basic listing data for stats separately or just let the Stats component fetch.
  // Actually, let's fetch listings once at the top level to share with Stats tab
  // ListingsSection and DraftsSection manage their own CRUD state, so we might have some duplication
  // but it's cleaner than refactoring the massive ListingsSection right now.
  // BETTER APPROACH: Let GarageStatsTab fetch its data or pass it if available.
  // To follow the user request "view counter per Listing", we'll fetch all listings here for the stats tab.
  const [allListingsForStats, setAllListingsForStats] = useState<ListingDetail[]>([]);
  const [inquiryCounts, setInquiryCounts] = useState<Record<string, { total: number; last7d: number; last30d: number }>>(
    {}
  );

  const [banner, setBanner] = useState<BannerState>({ kind: "idle" });
  const [logoVersion, setLogoVersion] = useState<number>(0);

  const [mainTab, setMainTab] = useState<"inventory" | "basis" | "profile" | "subscription" | "stats" | "rechner">("inventory");

  // Deep link support (/dashboard/garage?tab=rechner) — used by the Rechner's
  // quota gate to bring the garage back to the right tab after checkout.
  useEffect(() => {
    if (!router.isReady) return;
    const tab = router.query.tab;
    if (
      typeof tab === "string" &&
      ["inventory", "basis", "profile", "subscription", "stats", "rechner"].includes(tab)
    ) {
      setMainTab(tab as typeof mainTab);
    }
  }, [router.isReady, router.query.tab]);
  const [inventorySubTab, setInventorySubTab] = useState<"active" | "drafts" | "sold">("active");

  const planLabel = useMemo(() => {
    return formatDealerEntitlementLabel(entitlement);
  }, [entitlement]);

  const logoUrl = useMemo(() => {
    return appendCacheBuster(garage?.logo_url, logoVersion);
  }, [garage?.logo_url, logoVersion]);

  useEffect(() => {
    if (!hasMounted) return;

    setLogoVersion(Date.now());

    const applyFromHash = () => {
      const hash = window.location.hash || "";
      if (hash.toLowerCase() === "#zahlung") setMainTab("subscription");
      if (hash.toLowerCase() === "#stats") setMainTab("stats");
      if (hash.toLowerCase() === "#rechner") setMainTab("rechner");
    };

    applyFromHash();
    window.addEventListener("hashchange", applyFromHash);
    return () => window.removeEventListener("hashchange", applyFromHash);
  }, [hasMounted]);

  useEffect(() => {
    let cancelled = false;

    async function loadGarage() {
      if (initialGarage) return;

      setGarageLoading(true);
      try {
        const g = await getMyGarage();
        if (cancelled) return;

        setGarage(g);
      } catch (e) {
        if (cancelled) return;
        setBanner({ kind: "error", message: `Garage-Profil konnte nicht geladen werden: ${getErrorMessage(e)}` });
      } finally {
        if (!cancelled) setGarageLoading(false);
      }
    }

    loadGarage();
    return () => {
      cancelled = true;
    };
  }, [initialGarage]);

  useEffect(() => {
    let cancelled = false;
    let intervalId: number | null = null;
    let timeoutId: number | null = null;

    function clearTimers() {
      if (intervalId !== null) window.clearInterval(intervalId);
      if (timeoutId !== null) window.clearTimeout(timeoutId);
      intervalId = null;
      timeoutId = null;
    }

    function scheduleRefreshAt(iso: string) {
      const targetMs = Date.parse(iso);
      if (!Number.isFinite(targetMs)) return;

      const delayMs = targetMs - Date.now() + 5000;
      if (delayMs <= 0) {
        void refreshEntitlement();
        return;
      }

      const capped = Math.min(delayMs, 2_147_483_647);
      timeoutId = window.setTimeout(() => {
        void refreshEntitlement();
      }, capped);
    }

    async function refreshEntitlement() {
      clearTimers();

      if (!garage?.id) {
        setEntitlement({ kind: "none" });
        return;
      }

      try {
        const e = await getDealerEntitlement(garage);
        if (cancelled) return;

        setEntitlement(e);

        if (e.kind === "trial") scheduleRefreshAt(e.endsAt);
        if (e.kind === "subscription" && e.endsAt) scheduleRefreshAt(e.endsAt);
      } catch {
        if (!cancelled) setEntitlement({ kind: "none" });
      }

      intervalId = window.setInterval(() => {
        void refreshEntitlement();
      }, 5 * 60 * 1000);
    }

    if (!hasMounted) return;

    void refreshEntitlement();

    const onVis = () => {
      if (document.visibilityState === "visible") void refreshEntitlement();
    };

    document.addEventListener("visibilitychange", onVis);

    return () => {
      cancelled = true;
      clearTimers();
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [garage, hasMounted]);

  async function reloadStatsAndListings() {
    if (!garage?.id) return;

    setStatsLoading(true);
    try {
      const l = await dashboardService.getListingsByGarageId(garage.id);
      const computed = computeDashboardStatsFromListings(l);

      const listingIds = (Array.isArray(l) ? l : []).map((x) => x.id).filter((x): x is string => typeof x === "string");
      const inquiries = await dashboardService.getListingInquiryCounts(listingIds);

      setStats(computed);
      setAllListingsForStats(l);
      setInquiryCounts(inquiries);
    } catch {
      setStats(null);
      setAllListingsForStats([]);
      setInquiryCounts({});
    } finally {
      setStatsLoading(false);
    }
  }

  // Load stats and listings for the stats tab (initial + when opening the tab)
  useEffect(() => {
    let cancelled = false;

    async function run() {
      if (!garage?.id) return;

      if (mainTab !== "stats") return;

      setStatsLoading(true);
      try {
        const l = await dashboardService.getListingsByGarageId(garage.id);
        const computed = computeDashboardStatsFromListings(l);

        const listingIds = (Array.isArray(l) ? l : []).map((x) => x.id).filter((x): x is string => typeof x === "string");
        const inquiries = await dashboardService.getListingInquiryCounts(listingIds);

        if (cancelled) return;
        setStats(computed);
        setAllListingsForStats(l);
        setInquiryCounts(inquiries);
      } catch {
        if (cancelled) return;
        setStats(null);
        setAllListingsForStats([]);
        setInquiryCounts({});
      } finally {
        if (!cancelled) setStatsLoading(false);
      }
    }

    void run();
    return () => {
      cancelled = true;
    };
  }, [mainTab, garage?.id]);

  useEffect(() => {
    let cancelled = false;

    async function runHeaderStats() {
      if (!garage?.id) return;

      setStatsLoading(true);
      try {
        const l = await dashboardService.getListingsByGarageId(garage.id);
        const computed = computeDashboardStatsFromListings(l);

        if (cancelled) return;
        setStats(computed);
      } catch {
        if (cancelled) return;
        setStats(null);
      } finally {
        if (!cancelled) setStatsLoading(false);
      }
    }

    void runHeaderStats();
    return () => {
      cancelled = true;
    };
  }, [garage?.id]);

  async function handleUpdateGarage(updates: Partial<Garage>) {
    setBanner({ kind: "idle" });

    try {
      const updated = await updateMyGarage(updates);
      setGarage(updated);
      setBanner({ kind: "success", message: "Garage-Daten gespeichert." });
    } catch (e) {
      setBanner({ kind: "error", message: `Speichern fehlgeschlagen: ${getErrorMessage(e)}` });
      throw e;
    }
  }

  const statCards = [
    { label: "Aktiv", value: stats?.active ?? 0 },
    { label: "In Prüfung", value: stats?.pending ?? 0 },
    { label: "Verkauft", value: stats?.sold ?? 0 },
    { label: "Aufrufe", value: stats?.totalViews ?? 0 }, // Updated to use totalViews from service
  ];

  return (
    <div className="space-y-6">
      {/* Below lg the MessageCenterRail isn't rendered, so this is the only way
          into the messages — full width and clearly labelled. */}
      <div className="lg:hidden">
        <MessageCenterSheet
          count={Math.max(0, messageCount)}
          triggerVariant="outline"
          triggerClassName="w-full h-14 rounded-2xl border-neutral-200/60 bg-white shadow-sm"
        />
      </div>

      <Card className="rounded-3xl overflow-hidden border-neutral-200/60 shadow-sm">
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-r from-primary to-primary/80" />
          <div className="absolute -top-24 -right-24 h-64 w-64 rounded-full bg-white/10 blur-2xl" />
          <div className="relative p-6 sm:p-8">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-4">
                <Avatar className="h-14 w-14 border border-white/25 bg-white/10">
                  <AvatarImage src={logoUrl} alt={garage?.garage_name ?? "Garage"} />
                  <AvatarFallback className="bg-white/10 text-white">
                    <Building2 className="h-5 w-5" />
                  </AvatarFallback>
                </Avatar>

                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white truncate">
                      {garage?.garage_name ?? "Garage Dashboard"}
                    </h1>
                    <Badge className="bg-white/15 text-white border-white/25 rounded-full">
                      <Crown className="h-3.5 w-3.5 mr-1" />
                      {planLabel}
                    </Badge>
                  </div>
                  <p className="text-white/80 text-sm mt-1">Inventar verwalten, Profil pflegen und Plan anpassen.</p>
                </div>
              </div>

              {/* Message Center moved out of this row — see the full-width
                  mobile button above the card. */}
              <div className="flex gap-2 items-center">
                <Button
                  variant="secondary"
                  onClick={() => router.push("/dashboard")}
                  className="w-full sm:w-auto h-12 bg-white/15 text-white hover:bg-white/20 border border-white/20 rounded-2xl"
                >
                  Zur Übersicht
                </Button>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {statCards.map((s) => (
                <div key={s.label} className="rounded-2xl bg-white/10 border border-white/15 p-4">
                  <div className="text-xs text-white/75">{s.label}</div>
                  <div className="mt-1 text-2xl font-bold text-white">
                    {statsLoading ? <span className="inline-block h-7 w-10 rounded bg-white/15 animate-pulse" /> : s.value}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <CardContent className="p-0">
          <div className="p-4 sm:p-6">
            {banner.kind !== "idle" && (
              <div
                className={cn(
                  "mb-4 rounded-2xl border px-4 py-3 text-sm",
                  banner.kind === "success"
                    ? "border-emerald-200 bg-emerald-50 text-emerald-900"
                    : "border-red-200 bg-red-50 text-red-900"
                )}
              >
                {banner.message}
              </div>
            )}

            <Tabs value={mainTab} onValueChange={(v) => setMainTab(v as "inventory" | "basis" | "profile" | "subscription" | "stats" | "rechner")} className="w-full">
              <TabsList className="w-full justify-start overflow-x-auto rounded-2xl bg-neutral-100 p-1.5 h-auto">
                <TabsTrigger value="inventory" className="rounded-xl px-6 py-3 text-base font-semibold">
                  Inventar
                </TabsTrigger>
                <TabsTrigger value="rechner" className="rounded-xl px-6 py-3 text-base font-semibold">
                  Eintausch-Rechner
                </TabsTrigger>
                <TabsTrigger value="basis" className="rounded-xl px-6 py-3 text-base font-semibold">
                  Basis Daten
                </TabsTrigger>
                <TabsTrigger value="profile" className="rounded-xl px-6 py-3 text-base font-semibold">
                  Profil Informationen
                </TabsTrigger>
                <TabsTrigger value="subscription" className="rounded-xl px-6 py-3 text-base font-semibold">
                  Abonnemente
                </TabsTrigger>
                <TabsTrigger value="stats" className="rounded-xl px-6 py-3 text-base font-semibold">
                  Statistiken
                </TabsTrigger>
              </TabsList>

              <TabsContent value="inventory" className="mt-5">
                <div className="rounded-3xl border border-neutral-200/60 bg-white shadow-sm p-4 sm:p-6">
                  <div className="flex items-start justify-between gap-4 mb-6">
                    <div>
                      <h2 className="text-lg font-bold tracking-tight text-neutral-900">Inserate Verwalten</h2>
                      <p className="text-sm text-neutral-600 mt-1">Status, Laufzeit und Premium-Optionen.</p>
                    </div>
                  </div>

                  {/* Sub-tabs for Active vs Drafts */}
                  <div className="flex flex-wrap gap-3 mb-6">
                    <Button
                      onClick={() => setInventorySubTab("active")}
                      variant={inventorySubTab === "active" ? "default" : "outline"}
                      className="rounded-2xl px-4 py-2 sm:px-8 sm:py-6 text-base font-semibold"
                      size="lg"
                    >
                      Aktive Inserate
                    </Button>
                    <Button
                      onClick={() => setInventorySubTab("drafts")}
                      variant={inventorySubTab === "drafts" ? "default" : "outline"}
                      className="rounded-2xl px-4 py-2 sm:px-8 sm:py-6 text-base font-semibold"
                      size="lg"
                    >
                      Entwürfe
                    </Button>
                    <Button
                      onClick={() => setInventorySubTab("sold")}
                      variant={inventorySubTab === "sold" ? "default" : "outline"}
                      className="rounded-2xl px-4 py-2 sm:px-8 sm:py-6 text-base font-semibold"
                      size="lg"
                    >
                      Verkauft
                    </Button>
                  </div>

                  {inventorySubTab === "active" ? (
                    <ListingsSection view="active" />
                  ) : inventorySubTab === "drafts" ? (
                    <DraftsSection />
                  ) : (
                    <ListingsSection view="sold" />
                  )}
                </div>
              </TabsContent>

              <TabsContent value="rechner" className="mt-5">
                <div className="rounded-3xl border border-neutral-200/60 bg-white shadow-sm p-4 sm:p-6">
                  <div className="mb-6 flex items-start gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-red-50 flex items-center justify-center shrink-0">
                      <Calculator className="w-5 h-5 text-red-600" />
                    </div>
                    <div>
                      <h2 className="text-lg font-bold tracking-tight text-neutral-900">Eintauschwert-Rechner</h2>
                      <p className="text-sm text-neutral-600 mt-1">
                        Marktwert aus echten Vergleichsinseraten, minus deine Abzüge. Automatische
                        Suchen zählen zu deinem Monatskontingent; manuelle Berechnungen sind unbegrenzt.
                      </p>
                    </div>
                  </div>

                  <EintauschwertRechner />

                  <details className="mt-8 rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm text-neutral-700">
                    <summary className="cursor-pointer select-none font-medium text-neutral-900">
                      Rechner auf der eigenen Website einbetten
                    </summary>
                    <div className="mt-3 space-y-3">
                      <p className="text-neutral-600">
                        Füge diesen Code auf deiner Website ein – die Höhe passt sich automatisch an.
                      </p>
                      <pre className="overflow-x-auto rounded-xl bg-neutral-950 p-4 text-xs text-white">
{`<iframe
  id="buyauto-eintauschwert-rechner"
  src="https://www.buyauto.ch/embed/eintauschwert-rechner?embedId=buyauto-eintauschwert-rechner"
  style="width:100%;border:0;display:block;min-height:640px;"
  loading="lazy"
></iframe>
<script>
  window.addEventListener("message", function (e) {
    if (e.origin !== "https://www.buyauto.ch") return;
    if (!e.data || e.data.type !== "buyauto:resize") return;
    var f = document.getElementById(e.data.id);
    if (f && typeof e.data.height === "number") f.style.height = Math.max(640, e.data.height) + "px";
  });
</script>`}
                      </pre>
                    </div>
                  </details>
                </div>
              </TabsContent>

              <TabsContent value="basis" className="mt-5">
                <GarageBasisTab garage={garage} onUpdate={handleUpdateGarage} />
              </TabsContent>

              <TabsContent value="profile" className="mt-5">
                <GarageProfileTab
                  garage={garage}
                  onUpdate={handleUpdateGarage}
                  logoUrl={logoUrl}
                  logoVersion={logoVersion}
                  onLogoVersionChange={setLogoVersion}
                />
              </TabsContent>

              <TabsContent value="subscription" className="mt-5">
                <GarageBillingTab garage={garage} />
              </TabsContent>

              <TabsContent value="stats" className="mt-5">
                <div className="rounded-3xl border border-neutral-200/60 bg-white shadow-sm p-4 sm:p-6">
                  <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <h2 className="text-lg font-bold tracking-tight text-neutral-900">Statistiken</h2>
                      <p className="text-sm text-neutral-600 mt-1">Detaillierte Einblicke in Ihre Inserate.</p>
                    </div>
                    <Button
                      variant="outline"
                      onClick={() => void reloadStatsAndListings()}
                      className="rounded-2xl"
                      disabled={statsLoading}
                    >
                      {statsLoading ? "Aktualisieren…" : "Aktualisieren"}
                    </Button>
                  </div>
                  <GarageStatsTab listings={allListingsForStats} inquiryCounts={inquiryCounts} />
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </CardContent>
      </Card>

      {garageLoading && (
        <div className="rounded-3xl border border-neutral-200/60 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-3 text-sm text-neutral-600">
            <Loader2 className="h-4 w-4 animate-spin" />
            Garage-Profil wird geladen…
          </div>
        </div>
      )}
    </div>
  );
}