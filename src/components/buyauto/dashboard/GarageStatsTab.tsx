import { useMemo } from "react";
import { Eye, Sparkles, Target, TrendingUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { ListingDetail } from "@/lib/buyauto/types";
import type { ListingInquiryCounts } from "@/services/dashboardService";

interface GarageStatsTabProps {
  listings: ListingDetail[];
  inquiryCounts?: ListingInquiryCounts;
}

function safeViews(listing: ListingDetail): number {
  const raw = (listing as any)?.view_count;
  const n = typeof raw === "number" ? raw : typeof raw === "string" ? Number(raw) : 0;
  return Number.isFinite(n) ? n : 0;
}

function isPremiumListing(listing: ListingDetail): boolean {
  const premiumA = (listing as unknown as { premium?: boolean | null }).premium;
  const premiumB = (listing as unknown as { is_premium?: boolean | null }).is_premium;
  return premiumA === true || premiumB === true;
}

function formatVehicleName(listing: ListingDetail): string {
  const brand = String(listing.brand ?? "").trim();
  const model = String(listing.model ?? "").trim();
  const combined = `${brand} ${model}`.trim();
  return combined || "Fahrzeug";
}

function formatNumber(n: number): string {
  return new Intl.NumberFormat("de-CH", { maximumFractionDigits: 0 }).format(n);
}

function formatNumber1(n: number): string {
  return new Intl.NumberFormat("de-CH", { maximumFractionDigits: 1, minimumFractionDigits: 1 }).format(n);
}

function leadRatePctApprox(viewsTotal: number, inquiries30d: number): number {
  const denom = Math.max(1, viewsTotal);
  return (inquiries30d / denom) * 100;
}

function formatPct1(n: number): string {
  return `${formatNumber1(n)}%`;
}

type TopRow = {
  id: string;
  name: string;
  year: number | null;
  views: number;
  inquiries30d: number;
  premium: boolean;
};

export function GarageStatsTab({ listings, inquiryCounts }: GarageStatsTabProps) {
  const counts = inquiryCounts ?? {};

  const activeListings = useMemo(() => {
    return listings.filter((l) => l.status === "active" || l.status === "published");
  }, [listings]);

  const totalViewsActive = useMemo(() => activeListings.reduce((sum, l) => sum + safeViews(l), 0), [activeListings]);

  const inquiriesTotal30dActive = useMemo(() => {
    return activeListings.reduce((sum, l) => sum + (counts[l.id]?.last30d ?? 0), 0);
  }, [activeListings, counts]);

  const leadRate30dPctApprox = useMemo(() => {
    return leadRatePctApprox(totalViewsActive, inquiriesTotal30dActive);
  }, [inquiriesTotal30dActive, totalViewsActive]);

  const premiumListings = useMemo(() => activeListings.filter(isPremiumListing), [activeListings]);
  const standardListings = useMemo(() => activeListings.filter((l) => !isPremiumListing(l)), [activeListings]);

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

  const topPerformance = useMemo((): TopRow[] => {
    const rows = activeListings.map((l) => {
      const views = safeViews(l);
      return {
        id: l.id,
        name: formatVehicleName(l),
        year: typeof l.year === "number" ? l.year : null,
        views,
        inquiries30d: counts[l.id]?.last30d ?? 0,
        premium: isPremiumListing(l),
      };
    });

    rows.sort((a, b) => b.views - a.views);
    return rows.slice(0, 5);
  }, [activeListings, counts]);

  const maxTopViews = useMemo(() => {
    const max = topPerformance.reduce((m, r) => Math.max(m, r.views), 0);
    return max > 0 ? max : 1;
  }, [topPerformance]);

  if (listings.length === 0) {
    return (
      <div className="text-center py-12 bg-neutral-50 rounded-3xl border border-neutral-200">
        <div className="mx-auto w-12 h-12 bg-neutral-100 rounded-full flex items-center justify-center mb-4">
          <TrendingUp className="w-6 h-6 text-neutral-400" />
        </div>
        <h3 className="text-lg font-medium text-neutral-900">Keine Statistiken verfügbar</h3>
        <p className="text-neutral-500 mt-1 max-w-sm mx-auto">
          Sobald Ihre Inserate online sind und aufgerufen werden, sehen Sie hier eine Performance-Übersicht.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="rounded-3xl border-neutral-200 shadow-sm overflow-hidden">
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between gap-4">
              <div>
                <CardTitle className="text-base sm:text-lg">Top Performance</CardTitle>
                <CardDescription>Meistgesehene Fahrzeuge (aktiv)</CardDescription>
              </div>
              <div className="shrink-0 rounded-2xl border border-neutral-200 bg-white p-2">
                <Eye className="h-5 w-5 text-neutral-700" />
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-3">
            {topPerformance.map((row) => {
              const pct = Math.round((row.views / maxTopViews) * 100);

              return (
                <div key={row.id} className="rounded-2xl border border-neutral-200/70 bg-white p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="truncate text-sm font-semibold text-neutral-900">{row.name}</div>
                        {row.premium ? (
                          <Badge className="rounded-full bg-amber-50 text-amber-900 border border-amber-200">
                            <Sparkles className="h-3.5 w-3.5 mr-1" />
                            Premium
                          </Badge>
                        ) : null}
                      </div>

                      <div className="mt-0.5 text-xs text-neutral-500">
                        {row.year ? `${row.year}` : "—"}
                        <span className="mx-2 text-neutral-300">•</span>
                        <span className="tabular-nums">{formatNumber(row.inquiries30d)} Anfragen (30d)</span>
                      </div>
                    </div>

                    <div className="shrink-0 text-right">
                      <div className="text-sm font-bold text-neutral-900 tabular-nums">{formatNumber(row.views)}</div>
                      <div className="text-[11px] text-neutral-500">Aufrufe</div>
                    </div>
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

        <Card className="rounded-3xl border-neutral-200 shadow-sm overflow-hidden">
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between gap-4">
              <div>
                <CardTitle className="text-base sm:text-lg">Premium vs Standard</CardTitle>
                <CardDescription>Ø Aufrufe pro aktivem Inserat</CardDescription>
              </div>
              <div className="shrink-0 rounded-2xl border border-neutral-200 bg-white p-2">
                <Sparkles className="h-5 w-5 text-amber-700" />
              </div>
            </div>
          </CardHeader>

          <CardContent className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-neutral-200/70 bg-white p-4">
              <div className="flex items-center justify-between">
                <div className="text-sm font-semibold text-neutral-900">Premium</div>
                <Badge className="rounded-full bg-amber-50 text-amber-900 border border-amber-200">
                  {formatNumber(premiumListings.length)}
                </Badge>
              </div>
              <div className="mt-2 text-3xl font-bold text-neutral-900 tabular-nums">{formatNumber(premiumAvgViews)}</div>
              <div className="text-xs text-neutral-500 mt-1">Ø Aufrufe</div>
            </div>

            <div className="rounded-2xl border border-neutral-200/70 bg-white p-4">
              <div className="flex items-center justify-between">
                <div className="text-sm font-semibold text-neutral-900">Standard</div>
                <Badge variant="outline" className="rounded-full border-neutral-300 bg-neutral-50 text-neutral-700">
                  {formatNumber(standardListings.length)}
                </Badge>
              </div>
              <div className="mt-2 text-3xl font-bold text-neutral-900 tabular-nums">{formatNumber(standardAvgViews)}</div>
              <div className="text-xs text-neutral-500 mt-1">Ø Aufrufe</div>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-3xl border-neutral-200 shadow-sm overflow-hidden">
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between gap-4">
              <div>
                <CardTitle className="text-base sm:text-lg">Lead Rate</CardTitle>
                <CardDescription>Anfragen (30d) ÷ Aufrufe (aktiv)</CardDescription>
              </div>
              <div className="shrink-0 rounded-2xl border border-neutral-200 bg-white p-2">
                <Target className="h-5 w-5 text-neutral-700" />
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-4">
            <div className="rounded-2xl border border-neutral-200/70 bg-white p-4">
              <div className="flex items-end justify-between gap-4">
                <div>
                  <div className="text-xs text-neutral-500">Lead Rate (30 Tage)</div>
                  <div className="mt-1 text-4xl font-bold tracking-tight text-neutral-900 tabular-nums">
                    {formatPct1(leadRate30dPctApprox)}
                  </div>
                </div>
                <div className="text-right text-xs text-neutral-500">
                  <div>
                    <span className="font-semibold text-neutral-700 tabular-nums">
                      {formatNumber(inquiriesTotal30dActive)}
                    </span>{" "}
                    Anfragen
                  </div>
                  <div>
                    <span className="font-semibold text-neutral-700 tabular-nums">{formatNumber(totalViewsActive)}</span>{" "}
                    Aufrufe
                  </div>
                </div>
              </div>

              <div className="mt-4 h-3 w-full rounded-full bg-neutral-100 overflow-hidden">
                <div
                  className="h-3 rounded-full bg-gradient-to-r from-primary to-primary/80 transition-[width]"
                  style={{ width: `${Math.min(100, Math.max(0, leadRate30dPctApprox))}%` }}
                  aria-hidden
                />
              </div>

              <div className="mt-2 text-xs text-neutral-500">
                Hinweis: Aufrufe sind lifetime; Anfragen sind 30 Tage. Für Trends können wir View-Events als Phase 2
                erfassen.
              </div>
            </div>

            <div className="rounded-2xl border border-neutral-200/70 bg-neutral-50 p-4">
              <div className="flex items-start gap-3">
                <div className="mt-0.5 rounded-xl border border-neutral-200 bg-white p-2">
                  <TrendingUp className="h-4 w-4 text-neutral-700" />
                </div>
                <div className="text-sm text-neutral-700">
                  <div className="font-semibold text-neutral-900">Schneller Hebel</div>
                  <div className="mt-1 text-neutral-600">
                    Steigt die Lead Rate nicht, lohnt sich oft: bessere Titel + Fotos, klarere Konditionen und ggf.
                    Premium für mehr Reichweite.
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="text-xs text-neutral-500">
        <span className="font-semibold text-neutral-700">{formatNumber(activeListings.length)}</span> aktive Inserate in
        dieser Übersicht.
      </div>
    </div>
  );
}