import { useMemo } from "react";
import { Eye, TrendingUp, Calendar } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { ListingDetail } from "@/lib/buyauto/types";

interface GarageStatsTabProps {
  listings: ListingDetail[];
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

export function GarageStatsTab({ listings }: GarageStatsTabProps) {
  const totalViews = useMemo(() => listings.reduce((sum, l) => sum + safeViews(l), 0), [listings]);

  const activeListings = useMemo(
    () => listings.filter((l) => l.status === "active" || l.status === "published"),
    [listings]
  );

  const avgViews = useMemo(() => {
    if (activeListings.length === 0) return 0;
    return Math.round(totalViews / activeListings.length);
  }, [activeListings.length, totalViews]);

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
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card className="rounded-2xl border-neutral-200 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-neutral-600">Gesamt-Aufrufe</CardTitle>
            <Eye className="h-4 w-4 text-neutral-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-neutral-900">{totalViews}</div>
            <p className="text-xs text-neutral-500 mt-1">Alle Aufrufe Ihrer Inserate</p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-neutral-200 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-neutral-600">Durchschn. Aufrufe</CardTitle>
            <TrendingUp className="h-4 w-4 text-neutral-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-neutral-900">{avgViews}</div>
            <p className="text-xs text-neutral-500 mt-1">Pro aktivem Inserat</p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-neutral-200 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-neutral-600">Aktive Inserate</CardTitle>
            <Calendar className="h-4 w-4 text-neutral-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-neutral-900">{activeListings.length}</div>
            <p className="text-xs text-neutral-500 mt-1">Derzeit online</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="rounded-3xl border-neutral-200 shadow-sm col-span-2 lg:col-span-1">
          <CardHeader>
            <CardTitle>Top Performance</CardTitle>
            <CardDescription>Die 5 meistgesehenen Fahrzeuge</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {topListings.map((listing) => {
              const views = safeViews(listing);
              const pct = Math.round((views / maxTopViews) * 100);
              const vehicleName = formatVehicleName(listing);

              return (
                <div key={listing.id} className="rounded-2xl border border-neutral-200/70 bg-white p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="truncate text-sm font-semibold text-neutral-900">{vehicleName}</div>
                      <div className="mt-0.5 text-xs text-neutral-500">
                        {listing.year ? `${listing.year}` : null}
                      </div>
                    </div>
                    <div className="shrink-0 text-sm font-bold text-neutral-900 tabular-nums">{views}</div>
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
            <CardTitle>Details pro Inserat</CardTitle>
            <CardDescription>Alle Fahrzeuge im Überblick</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="max-h-[320px] overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fahrzeug</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Aufrufe</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {listingsSortedByViews.map((listing) => {
                    const status = getStatusLabel(listing.status);
                    const views = safeViews(listing);

                    return (
                      <TableRow key={listing.id}>
                        <TableCell className="font-medium">
                          <div className="flex flex-col">
                            <span className="text-neutral-900">{formatVehicleName(listing)}</span>
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
                        <TableCell className="text-right font-bold text-neutral-900 tabular-nums">{views}</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}