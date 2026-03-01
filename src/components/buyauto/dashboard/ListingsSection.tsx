import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/router";
import Image from "next/image";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Plus, Eye, Edit, Trash2, Calendar, MoreHorizontal, Crown, DollarSign, MapPin, AlertTriangle, Pause, Play, Archive } from "lucide-react";
import { ListingDetail } from "@/lib/buyauto/types";
import { useAuth } from "@/contexts/AuthContext";
import StatusBadge from "./StatusBadge";
import { dashboardService } from "@/services/dashboardService";
import { setListingPremiumUsingCredit, ensureDealerPremiumCredits, getMyDealerPremiumCredits } from "@/services/dealerSubscriptionService";
import { getMyGarage, type Garage } from "@/services/garageService";

function getDealTypeLabel(input: { deal_type?: string | null; financing_type?: string | null }): string {
  const dealType = input.deal_type ?? "lease_takeover";
  if (dealType === "direct_purchase") {
    if (input.financing_type === "leasing") return "Direktkauf · Leasing";
    return "Direktkauf · Barzahlung";
  }
  return "Leasingübernahme";
}

function getPeriodYYYYMMUtc(date = new Date()): string {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, "0");
  return `${y}${m}`;
}

type PremiumCreditsState = {
  used: number;
  included: number;
  remaining: number;
};

export default function ListingsSection() {
  const router = useRouter();
  const { user } = useAuth();
  const [listings, setListings] = useState<ListingDetail[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [listingToDelete, setListingToDelete] = useState<string | null>(null);
  const [archiveDialogOpen, setArchiveDialogOpen] = useState(false);
  const [pauseDialogOpen, setPauseDialogOpen] = useState(false);
  const [pauseDays, setPauseDays] = useState<number>(30);
  const [listingToArchive, setListingToArchive] = useState<string | null>(null);
  const [listingToPause, setListingToPause] = useState<string | null>(null);
  const [listingToUnpause, setListingToUnpause] = useState<string | null>(null);

  const [premiumCredits, setPremiumCredits] = useState<PremiumCreditsState | null>(null);
  const [premiumCreditsLoading, setPremiumCreditsLoading] = useState(false);

  const loadUserListings = useCallback(async () => {
    if (!user) return;

    setLoading(true);
    try {
      const data = await dashboardService.getUserListings();
      setListings(data);
    } catch (error) {
      console.error("Error loading user listings:", error);
      setListings([]);
    } finally {
      setLoading(false);
    }
  }, [user]);

  const loadPremiumCredits = useCallback(async () => {
    if (!user) return;

    setPremiumCreditsLoading(true);
    try {
      const garage = await getMyGarage();
      if (!garage?.id) {
        setPremiumCredits({ used: 0, included: 0, remaining: 0 });
        return;
      }

      const period = getPeriodYYYYMMUtc();
      await ensureDealerPremiumCredits(garage as Garage, period);
      const row = await getMyDealerPremiumCredits(garage as Garage, period);

      const used = Math.max(0, Number(row?.credits_used ?? 0));
      const included = Math.max(0, Number(row?.credits_included ?? 0));
      const remaining = Math.max(0, included - used);

      setPremiumCredits({ used, included, remaining });
    } catch (error) {
      console.error("Error loading premium credits:", error);
      setPremiumCredits({ used: 0, included: 0, remaining: 0 });
    } finally {
      setPremiumCreditsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      loadUserListings();
      loadPremiumCredits();
    }
  }, [user, loadUserListings, loadPremiumCredits]);

  useEffect(() => {
    const status = typeof router.query.premium_upgrade === "string" ? router.query.premium_upgrade : null;
    if (!status) return;

    loadUserListings();
    loadPremiumCredits();
  }, [router.query.premium_upgrade, loadUserListings, loadPremiumCredits]);

  const handleDelete = useCallback(async (listingId: string) => {
    setActionLoading(listingId);
    try {
      const { success, error } = await dashboardService.deleteListing(listingId);
      if (error || !success) {
        throw error || new Error("Failed to delete listing");
      }
      setListings(prev => prev.filter(l => l.id !== listingId));
      setDeleteDialogOpen(false);
    } catch (error) {
      console.error("Error deleting listing:", error);
      alert("Fehler beim Löschen des Inserats.");
    } finally {
      setActionLoading(null);
      setListingToDelete(null);
    }
  }, []);

  const handleEdit = (listingId: string) => {
    router.push(`/inserat-erstellen?edit=${listingId}`);
  };

  const handleUpgrade = useCallback(async (listingId: string) => {
    setActionLoading(listingId);

    try {
      const remainingFree = premiumCredits?.remaining ?? 0;

      if (remainingFree > 0) {
        await setListingPremiumUsingCredit(listingId);
        await Promise.all([loadUserListings(), loadPremiumCredits()]);
        return;
      }

      const res = await fetch("/api/billing/premium-upgrade/prepare", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ listing_id: listingId }),
      });

      const json = (await res.json()) as { url?: string; error?: string };
      if (!res.ok || !json.url) {
        const message = typeof json.error === "string" ? json.error : "Zahlung konnte nicht gestartet werden.";
        throw new Error(message);
      }

      window.location.href = json.url;
    } catch (error) {
      console.error("Error upgrading listing to premium:", error);
      alert("Fehler beim Premium-Upgrade. Bitte versuche es erneut.");
    } finally {
      setActionLoading(null);
    }
  }, [premiumCredits?.remaining, loadPremiumCredits, loadUserListings]);

  const handleExtend = async (listingId: string) => {
    console.log(`Placeholder: Extending listing ${listingId}`);
  };

  const handleArchive = useCallback(async (listingId: string) => {
    setActionLoading(listingId);
    try {
      await dashboardService.archiveListing(listingId);
      await loadUserListings();
      setArchiveDialogOpen(false);
      setListingToArchive(null);
    } catch (error) {
      console.error("Error archiving listing:", error);
      alert("Fehler beim Archivieren des Inserats.");
    } finally {
      setActionLoading(null);
    }
  }, [loadUserListings]);

  const handlePause = useCallback(async (listingId: string, days: number) => {
    setActionLoading(listingId);
    try {
      await dashboardService.pauseListing(listingId, days);
      await loadUserListings();
      setPauseDialogOpen(false);
      setListingToPause(null);
    } catch (error) {
      console.error("Error pausing listing:", error);
      alert("Fehler beim Pausieren des Inserats.");
    } finally {
      setActionLoading(null);
    }
  }, [loadUserListings]);

  const handleUnpause = useCallback(async (listingId: string) => {
    setActionLoading(listingId);
    try {
      await dashboardService.unpauseListing(listingId);
      await loadUserListings();
      setListingToUnpause(null);
    } catch (error) {
      console.error("Error unpausing listing:", error);
      alert("Fehler beim Reaktivieren des Inserats.");
    } finally {
      setActionLoading(null);
    }
  }, [loadUserListings]);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("de-CH", {
      style: "currency",
      currency: "CHF",
      minimumFractionDigits: 0
    }).format(price);
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "Unlimitiert";
    return new Date(dateString).toLocaleDateString("de-CH");
  };

  const isPremium = (listing: ListingDetail) => {
    if (!listing.premium && !listing.is_premium) return false;
    if (!listing.premium_until) return true;
    return new Date(listing.premium_until) > new Date();
  };

  const isExpired = (listing: ListingDetail) => {
    if (listing.status === "expired" || listing.status === "archived") return true;
    if (!listing.expires_at) return false;
    return new Date(listing.expires_at) <= new Date();
  };

  const isPaused = (listing: ListingDetail) => {
    return (listing.status as any) === "paused";
  };

  const getPlanBadge = (listing: ListingDetail) => {
    if (listing.price_plan) {
      const planNames: { [key: string]: string } = {
        "standard": "Standard",
        "extended": "Verlängert",
        "unlimited": "Unlimitiert",
      };
      return planNames[listing.price_plan] || listing.price_plan;
    }
    return "N/A";
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h2 className="text-2xl font-bold text-neutral-900">Meine Inserate</h2>
          <div className="w-32 h-10 bg-neutral-200 rounded animate-pulse"></div>
        </div>
        <div className="grid gap-6">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="w-24 h-18 bg-neutral-200 rounded-lg"></div>
                  <div className="flex-1 space-y-3">
                    <div className="w-48 h-6 bg-neutral-200 rounded"></div>
                    <div className="w-32 h-4 bg-neutral-200 rounded"></div>
                    <div className="w-24 h-4 bg-neutral-200 rounded"></div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-neutral-900">Meine Inserate</h2>
          <div className="mt-1 flex flex-wrap items-center gap-3 text-sm text-neutral-600">
            <p>
              {listings.length} {listings.length === 1 ? "Inserat" : "Inserate"} insgesamt
            </p>
            <span className="text-neutral-300">•</span>
            <p>
              Premium inklusive:{" "}
              {premiumCreditsLoading ? (
                <span className="inline-block h-4 w-12 rounded bg-neutral-200 align-middle animate-pulse" />
              ) : (
                <span className="font-semibold text-neutral-900">
                  {premiumCredits?.used ?? 0}/{premiumCredits?.included ?? 0}
                </span>
              )}
            </p>
            <span className="text-neutral-300">•</span>
            <p>Weitere Upgrades: CHF 30 / Inserat</p>
          </div>
        </div>
        <Button
          onClick={() => router.push("/inserat-erstellen")}
          className="bg-red-500 hover:bg-red-600 text-white rounded-2xl"
        >
          <Plus className="mr-2 h-4 w-4" />
          Neues Inserat erstellen
        </Button>
      </div>

      {listings.length === 0 ? (
        <Card className="border-neutral-200/60 rounded-3xl">
          <CardContent className="p-12 text-center">
            <div className="w-16 h-16 bg-neutral-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-8 h-8 text-neutral-400" />
            </div>
            <h3 className="text-lg font-semibold text-neutral-900 mb-2">
              Noch keine Inserate
            </h3>
            <p className="text-neutral-600 mb-6">
              Erstellen Sie Ihr erstes Inserat und beginnen Sie Ihr Auto zu vermieten.
            </p>
            <Button
              onClick={() => router.push("/inserat-erstellen")}
              className="bg-red-500 hover:bg-red-600 text-white rounded-2xl"
            >
              Erstes Inserat erstellen
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6">
          {listings.map((listing) => {
            const coverImage = listing.cover_image_url ||
              (listing.images && listing.images[listing.cover_image_index || 0]);
            const expired = isExpired(listing);
            const premium = isPremium(listing);
            const archived = listing.status === "archived" || listing.status === "expired";

            return (
              <Card
                key={listing.id}
                className={`border-neutral-200/60 rounded-3xl hover:shadow-md transition-all ${
                  expired ? "opacity-75" : ""
                } ${premium ? "ring-2 ring-amber-200/50 bg-gradient-to-r from-amber-50/30 to-white" : ""}`}
              >
                <CardContent className="p-6">
                  <div className="flex flex-col lg:flex-row gap-6">
                    <div className="relative">
                      {coverImage ? (
                        <div className="w-full lg:w-32 h-48 lg:h-24 relative rounded-lg overflow-hidden">
                          <Image
                            src={coverImage}
                            alt={`${listing.brand} ${listing.model}`}
                            fill
                            className="object-cover"
                          />
                        </div>
                      ) : (
                        <div className="w-full lg:w-32 h-48 lg:h-24 bg-neutral-200 rounded-lg flex items-center justify-center">
                          <span className="text-neutral-400 text-sm">Kein Bild</span>
                        </div>
                      )}
                      {premium && (
                        <div className="absolute -top-2 -right-2">
                          <Crown className="w-6 h-6 text-amber-500" />
                        </div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                        <div className="min-w-0 flex-1">
                          <h3 className="text-lg font-semibold text-neutral-900 mb-2 truncate">
                            {listing.brand} {listing.model} ({listing.year})
                          </h3>
                          <div className="flex flex-wrap items-center gap-4 text-sm text-neutral-600 mb-3">
                            <div className="flex items-center gap-1">
                              <DollarSign className="w-4 h-4" />
                              <span>Bezahlt: {formatPrice(listing.listing_price ?? 0)}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <MapPin className="w-4 h-4" />
                              {listing.location}
                            </div>
                            <div className="flex items-center gap-1">
                              <Eye className="w-4 h-4" />
                              <span>{listing.view_count || 0} Aufrufe</span>
                            </div>
                          </div>
                          <div className="flex flex-wrap items-center gap-3">
                            <StatusBadge status={listing.status} expiresAt={listing.expires_at} />
                            <Badge variant="secondary" className="rounded-full">
                              {getDealTypeLabel({ deal_type: (listing as any).deal_type, financing_type: (listing as any).financing_type })}
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              {getPlanBadge(listing)}
                            </Badge>
                            {listing.expires_at && (
                              <span className="text-xs text-neutral-500">
                                {isPaused(listing) ? (
                                  <>Pausiert</>
                                ) : (
                                  <>Läuft ab: {formatDate(listing.expires_at)}</>
                                )}
                              </span>
                            )}
                            {premium && listing.premium_until && (
                              <span className="text-xs text-amber-700">
                                Premium bis: {formatDate(listing.premium_until)}
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <Button variant="ghost" size="sm" className="rounded-2xl" onClick={() => router.push(`/fahrzeug/${listing.id}?preview=true`)}>
                            <Eye className="w-4 h-4 mr-2" /> Vorschau
                          </Button>
                          {!archived && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="rounded-2xl"
                              onClick={() => handleEdit(listing.id)}
                            >
                              <Edit className="w-4 h-4 mr-2" />
                              Bearbeiten
                            </Button>
                          )}

                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreHorizontal className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-56">
                              {!premium && !archived && (
                                <DropdownMenuItem
                                  onClick={() => handleUpgrade(listing.id)}
                                  disabled={actionLoading === listing.id}
                                >
                                  <Crown className="w-4 h-4 mr-2 text-amber-500" />
                                  {((premiumCredits?.remaining ?? 0) > 0) ? "Upgrade auf Premium (inkl.)" : "Premium für CHF 30 kaufen"}
                                </DropdownMenuItem>
                              )}
                              {(expired || listing.duration_days !== null) && (
                                <DropdownMenuItem
                                  onClick={() => handleExtend(listing.id)}
                                  disabled={actionLoading === listing.id}
                                >
                                  <Calendar className="w-4 h-4 mr-2 text-green-600" />
                                  Um 90 Tage verlängern
                                </DropdownMenuItem>
                              )}
                              {!archived && !isPaused(listing) && (
                                <DropdownMenuItem
                                  onClick={() => {
                                    setListingToPause(listing.id);
                                    setPauseDays(30);
                                    setPauseDialogOpen(true);
                                  }}
                                  disabled={actionLoading === listing.id}
                                >
                                  <Pause className="w-4 h-4 mr-2 text-neutral-700" />
                                  Inserat pausieren
                                </DropdownMenuItem>
                              )}
                              {isPaused(listing) && (
                                <DropdownMenuItem
                                  onClick={() => setListingToUnpause(listing.id)}
                                  disabled={actionLoading === listing.id}
                                >
                                  <Play className="w-4 h-4 mr-2 text-emerald-600" />
                                  Entpausieren
                                </DropdownMenuItem>
                              )}
                              {!archived && (
                                <DropdownMenuItem
                                  onClick={() => {
                                    setListingToArchive(listing.id);
                                    setArchiveDialogOpen(true);
                                  }}
                                  disabled={actionLoading === listing.id}
                                  className="text-red-600 focus:text-red-600"
                                >
                                  <Archive className="w-4 h-4 mr-2" />
                                  Archivieren
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => {
                                  setListingToDelete(listing.id);
                                  setDeleteDialogOpen(true);
                                }}
                                className="text-red-600 focus:text-red-600"
                              >
                                <Trash2 className="w-4 h-4 mr-2" />
                                Löschen
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Inserat löschen</AlertDialogTitle>
            <AlertDialogDescription>
              Sind Sie sicher, dass Sie dieses Inserat dauerhaft löschen möchten?
              Diese Aktion kann nicht rückgängig gemacht werden.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Abbrechen</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => listingToDelete && handleDelete(listingToDelete)}
              className="bg-red-500 hover:bg-red-600"
              disabled={actionLoading === listingToDelete}
            >
              {actionLoading === listingToDelete ? "Wird gelöscht..." : "Löschen"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={archiveDialogOpen} onOpenChange={setArchiveDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Inserat archivieren</AlertDialogTitle>
            <AlertDialogDescription>
              <span className="font-semibold text-neutral-900">
                Dieses Inserat wird dauerhaft archiviert. Diese Aktion kann nicht rückgängig gemacht werden.
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setListingToArchive(null)}>Abbrechen</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => listingToArchive && handleArchive(listingToArchive)}
              className="bg-red-500 hover:bg-red-600"
              disabled={actionLoading === listingToArchive}
            >
              {actionLoading === listingToArchive ? "Wird archiviert..." : "Ja, archivieren"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={pauseDialogOpen} onOpenChange={setPauseDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Inserat pausieren</AlertDialogTitle>
            <AlertDialogDescription>
              Während der Pause ist das Inserat nicht sichtbar. Es wird nach Ablauf automatisch wieder aktiviert und die
              Laufzeit um die Pausenzeit verlängert (max. 90 Tage).
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="mt-4 flex flex-wrap gap-2">
            {[7, 14, 30, 60, 90].map((d) => (
              <Button
                key={d}
                type="button"
                variant={pauseDays === d ? "default" : "outline"}
                className="rounded-2xl"
                onClick={() => setPauseDays(d)}
              >
                {d} Tage
              </Button>
            ))}
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setListingToPause(null)}>Abbrechen</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => listingToPause && handlePause(listingToPause, pauseDays)}
              disabled={actionLoading === listingToPause}
            >
              {actionLoading === listingToPause ? "Wird pausiert..." : "Pausieren"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={Boolean(listingToUnpause)} onOpenChange={(open) => { if (!open) setListingToUnpause(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Inserat reaktivieren</AlertDialogTitle>
            <AlertDialogDescription>
              Wenn du das Inserat wieder aktivierst, verlängert sich das Ablaufdatum um die Pausenzeit.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Abbrechen</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => listingToUnpause && handleUnpause(listingToUnpause)}
              disabled={actionLoading === listingToUnpause}
            >
              {actionLoading === listingToUnpause ? "Wird aktiviert..." : "Reaktivieren"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
