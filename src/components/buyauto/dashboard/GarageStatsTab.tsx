import { useMemo } from "react";
import { Eye, TrendingUp, Calendar, MessageSquareText, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { ListingDetail } from "@/lib/buyauto/types";
import type { ListingInquiryCounts } from "@/services/dashboardService";

interface GarageStatsTabProps {
  listings: ListingDetail[];
  inquiryCounts?: ListingInquiryCounts;
}

type ListingStatusLabel = {
  label: string;
  tone: "neutral" | "positive" | "warning";
};

function getStatusLabel(status: ListingDetail["status"]): ListingStatusLabel {
  if (status === "active" || status === "published") return { label: "Aktiv", tone: "positive" };
  if (status === "pending") return { label: "Prüfung", tone: "warning" };
  if (status === "sold") return { label: "Verkauft", tone: "neutral" };
  if (status === "draft") return { label: "Entwurf", tone: "neutral" };
  if (status === "expired") return { label: "Abgelaufen", tone: "neutral" };
  if (status === "rejected") return { label: "Abgelehnt", tone: "neutral" };
  if (status === "paused") return { label: "Pausiert", tone: "neutral" };
  return { label: "Inaktiv", tone: "neutral" };
}

function formatVehicleName(listing: ListingDetail): string {
  const brand = (listing.brand ?? "").trim();
  const model = (listing.model ?? "").trim();
  const combined = `${brand} ${model}`.trim();
  return combined || "Fahrzeug";
}

function safeViews(listing: ListingDetail): number {
  return typeof listing.view_count === "number" && Number.isFinite(listing.view_count) ? listing.view_count : 0;
}

function isPremiumListing(listing: ListingDetail): boolean {
  const premiumA = (listing as unknown as { premium?: boolean | null }).premium;
  const premiumB = (listing as unknown as { is_premium?: boolean | null }).is_premium;
  return premiumA === true || premiumB === true;
}

function safeCreatedAtMs(listing: ListingDetail): number | null {
  const raw = (listing as unknown as { created_at?: unknown }).created_at;
  if (typeof raw !== "string") return null;
  const ms = new Date(raw).getTime();
  return Number.isFinite(ms) ? ms : null;
}

function viewsPerDay(listing: ListingDetail): number {
  const views = safeViews(listing);
  const createdAtMs = safeCreatedAtMs(listing);
  if (!createdAtMs) return 0;

  const days = Math.max(1, Math.ceil((Date.now() - createdAtMs) / (1000 * 60 * 60 * 24)));
  return views / days;
}

function formatNumber(n: number): string {
  return new Intl.NumberFormat("de-CH", { maximumFractionDigits: 0 }).format(n);
}

function formatNumber1(n: number): string {
  return new Intl.NumberFormat("de-CH", { maximumFractionDigits: 1, minimumFractionDigits: 1 }).format(n);
}

export function GarageStatsTab({ listings, inquiryCounts }: GarageStatsTabProps) {
  const counts = inquiryCounts ?? {};

  const activeListings = useMemo(
    () => listings.filter((l) => l.status === "active" || l.status === "published"),
    [listings]
  );

  const totalViewsAll = useMemo(() => listings.reduce((sum, l) => sum + safeViews(l), 0), [listings]);
  const totalViewsActive = useMemo(() => activeListings.reduce((sum, l) => sum + safeViews(l), 0), [activeListings]);

  const avgViewsActive = useMemo(() => {
    if (activeListings.length === 0) return 0;
    return Math.round(totalViewsActive / activeListings.length);
  }, [activeListings.length, totalViewsActive]);

  const premiumListings = useMemo(() => listings.filter(isPremiumListing), [listings]);
  const standardListings = useMemo(() => listings.filter((l) => !isPremiumListing(l)), [listings]);

  const premiumAvgViews = useMemo(() => {
    if (premiumListings.length === 0) return 0;
    const v = premiumListings.reduce((sum, l) => sum + safeViews(l), 0);
    return Math.round(v / premiumListings.length);
  }, [premiumListings]);

  const standardAvgViews = useMemo(() => {
    if (standardListings.length === 0) return 0;
    const v = standardListings.reduce((sum, l) => sum + safeViews(l), 0);
    return Math.round(v / standardListings.length);
  }, [standardListings]);

  const inquiriesTotal30d = useMemo(() => {
    return Object.values(counts).reduce((sum, c) => sum + (typeof c?.last30d === "number" ? c.last30d : 0), 0);
  }, [counts]);

  const inquiriesTotal7d = useMemo(() => {
    return Object.values(counts).reduce((sum, c) => sum + (typeof c?.last7d === "number" ? c.last7d : 0), 0);
  }, [counts]);

  const listingsSortedByViews = useMemo(() => {
    return [...listings].sort((a, b) => safeViews(b) - safeViews(a));
  }, [listings]);

  const topListings = useMemo(() => listingsSortedByViews.slice(0, 5), [listingsSortedByViews]);

  const maxTopViews = useMemo(() => {
    const max = topListings.reduce((m, l) => Math.max(m, safeViews(l)), 0);
    return max > 0 ? max : 1;
  }, [topListings]);

  if (listings.length === 0) {
    return (
      <div className="text-center py-12 bg-neutral-50 rounded-3xl border border-neutral-200">
        <div className="mx-auto w-12 h-12 bg-neutral-100 rounded-full flex items-center justify-center mb-4">
          <TrendingUp className="w-6 h-6 text-neutral-400" />
        </div>
        <h3 className="text-lg font-medium text-neutral-900">Keine Statistiken verfügbar</h3>
        <p className="text-neutral-500 mt-1 max-w-sm mx-auto">
          Sobald Sie Inserate erstellen und diese aufgerufen werden, erscheinen hier detaillierte Statistiken.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="rounded-2xl border-neutral-200 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-neutral-600">Aufrufe (aktiv)</CardTitle>
            <Eye className="h-4 w-4 text-neutral-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-neutral-900">{formatNumber(totalViewsActive)}</div>
            <p className="text-xs text-neutral-500 mt-1">Summe über aktive Inserate</p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-neutral-200 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-neutral-600">Ø Aufrufe / aktiv</CardTitle>
            <TrendingUp className="h-4 w-4 text-neutral-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-neutral-900">{formatNumber(avgViewsActive)}</div>
            <p className="text-xs text-neutral-500 mt-1">Durchschnitt pro aktivem Inserat</p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-neutral-200 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-neutral-600">Aktive Inserate</CardTitle>
            <Calendar className="h-4 w-4 text-neutral-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-neutral-900">{formatNumber(activeListings.length)}</div>
            <p className="text-xs text-neutral-500 mt-1">Derzeit online</p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-neutral-200 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-neutral-600">Anfragen (30 Tage)</CardTitle>
            <MessageSquareText className="h-4 w-4 text-neutral-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-neutral-900">{formatNumber(inquiriesTotal30d)}</div>
            <p className="text-xs text-neutral-500 mt-1">{formatNumber(inquiriesTotal7d)} in den letzten 7 Tagen</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="rounded-3xl border-neutral-200 shadow-sm col-span-2 lg:col-span-1">
          <CardHeader>
            <CardTitle>Top Performance</CardTitle>
            <CardDescription>Die 5 meistgesehenen Fahrzeuge (Aufrufe)</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {topListings.map((listing) => {
              const views = safeViews(listing);
              const pct = Math.round((views / maxTopViews) * 100);
              const vehicleName = formatVehicleName(listing);
              const premium = isPremiumListing(listing);

              return (
                <div key={listing.id} className="rounded-2xl border border-neutral-200/70 bg-white p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <div className="truncate text-sm font-semibold text-neutral-900">{vehicleName}</div>
                        {premium ? (
                          <Badge className="rounded-full bg-amber-50 text-amber-900 border border-amber-200">
                            <Sparkles className="h-3.5 w-3.5 mr-1" />
                            Premium
                          </Badge>
                        ) : null}
                      </div>
                      <div className="mt-0.5 text-xs text-neutral-500">
                        {listing.year ? `${listing.year}` : null}
                        <span className="mx-2 text-neutral-300">•</span>
                        <span className="tabular-nums">{formatNumber1(viewsPerDay(listing))} / Tag</span>
                      </div>
                    </div>
                    <div className="shrink-0 text-sm font-bold text-neutral-900 tabular-nums">{formatNumber(views)}</div>
                  </div>

                  <div className="mt-3 h-2 w-full rounded-full bg-neutral-100">
                    <div
                      className="h-2 rounded-full bg-primary transition-[width]"
                      style={{ width: `${pct}%` }}
                      aria-hidden
                    />
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>

        <Card className="rounded-3xl border-neutral-200 shadow-sm col-span-2 lg:col-span-1">
          <CardHeader>
            <CardTitle>Premium vs Standard</CardTitle>
            <CardDescription>Durchschnittliche Performance</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-2xl border border-neutral-200/70 p-4">
              <div className="flex items-center justify-between">
                <div className="text-sm font-semibold text-neutral-900">Premium</div>
                <Badge className="rounded-full bg-amber-50 text-amber-900 border border-amber-200">
                  {formatNumber(premiumListings.length)}
                </Badge>
              </div>
              <div className="mt-2 text-2xl font-bold text-neutral-900">{formatNumber(premiumAvgViews)}</div>
              <div className="text-xs text-neutral-500">Ø Aufrufe pro Premium-Inserat</div>
            </div>

            <div className="rounded-2xl border border-neutral-200/70 p-4">
              <div className="flex items-center justify-between">
                <div className="text-sm font-semibold text-neutral-900">Standard</div>
                <Badge variant="outline" className="rounded-full">
                  {formatNumber(standardListings.length)}
                </Badge>
              </div>
              <div className="mt-2 text-2xl font-bold text-neutral-900">{formatNumber(standardAvgViews)}</div>
              <div className="text-xs text-neutral-500">Ø Aufrufe pro Standard-Inserat</div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="rounded-3xl border-neutral-200 shadow-sm">
        <CardHeader>
          <CardTitle>Details pro Inserat</CardTitle>
          <CardDescription>Aufrufe & Anfragen in einer Tabelle</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="max-h-[420px] overflow-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fahrzeug</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Aufrufe</TableHead>
                  <TableHead className="text-right">Ø / Tag</TableHead>
                  <TableHead className="text-right">Anfragen (30d)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {listingsSortedByViews.map((listing) => {
                  const status = getStatusLabel(listing.status);
                  const views = safeViews(listing);
                  const vpd = viewsPerDay(listing);
                  const inquiries = counts[listing.id]?.last30d ?? 0;

                  return (
                    <TableRow key={listing.id}>
                      <TableCell className="font-medium">
                        <div className="flex flex-col">
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="truncate text-neutral-900">{formatVehicleName(listing)}</span>
                            {isPremiumListing(listing) ? (
                              <Badge className="rounded-full bg-amber-50 text-amber-900 border border-amber-200">Premium</Badge>
                            ) : null}
                          </div>
                          <span className="text-xs text-neutral-500">{listing.year}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={
                            status.tone === "positive"
                              ? "border-emerald-200 bg-emerald-50 text-emerald-900"
                              : status.tone === "warning"
                                ? "border-amber-200 bg-amber-50 text-amber-900"
                                : "border-neutral-200 bg-white text-neutral-700"
                          }
                        >
                          {status.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-bold text-neutral-900 tabular-nums">{formatNumber(views)}</TableCell>
                      <TableCell className="text-right text-neutral-900 tabular-nums">{formatNumber1(vpd)}</TableCell>
                      <TableCell className="text-right text-neutral-900 tabular-nums">{formatNumber(inquiries)}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>

          <div className="border-t border-neutral-200 px-4 py-3 text-xs text-neutral-500">
            Gesamt-Aufrufe (alle Inserate): <span className="font-semibold text-neutral-700 tabular-nums">{formatNumber(totalViewsAll)}</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}