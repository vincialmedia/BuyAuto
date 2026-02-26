import { useEffect, useState } from "react";
import { adminService } from "@/services/adminService";
import type { AdminListing, AdminListingFilters } from "@/services/adminService";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Eye, CheckCircle, XCircle, MapPin, Star, User } from "lucide-react";
import { ListingDetailsModal } from "@/components/admin/ListingDetailsModal";
import { cantons } from "@/lib/buyauto/data";

interface ModerationViewProps {
  onStatsUpdate: () => void;
}

export function ModerationView({ onStatsUpdate }: ModerationViewProps) {
  const { toast } = useToast();

  const [listings, setListings] = useState<AdminListing[]>([]);
  const [loading, setLoading] = useState(true);

  const [filters, setFilters] = useState<AdminListingFilters>({
    status: "pending",
    page: 1,
    limit: 25,
  });
  const [pagination, setPagination] = useState({ total: 0, totalPages: 0 });

  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [selectedListing, setSelectedListing] = useState<AdminListing | null>(null);

  const [declineModalOpen, setDeclineModalOpen] = useState(false);
  const [declineReason, setDeclineReason] = useState("");
  const [decliningId, setDecliningId] = useState<string | null>(null);
  const [declineSubmitting, setDeclineSubmitting] = useState(false);

  useEffect(() => {
    loadListings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.page, filters.limit]);

  const loadListings = async () => {
    try {
      setLoading(true);
      const data = await adminService.getListings({ ...filters, status: "pending" });
      setListings(Array.isArray(data.listings) ? data.listings : []);
      setPagination({ total: data.total, totalPages: data.totalPages });
    } catch (error) {
      console.error("Error loading moderation listings:", error);
      toast({
        variant: "destructive",
        title: "Fehler",
        description: "Inserate konnten nicht geladen werden.",
      });
    } finally {
      setLoading(false);
    }
  };

  const openDetailsModal = (listing: AdminListing) => {
    setSelectedListing(listing);
    setDetailsModalOpen(true);
  };

  const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString("de-CH");

  const formatPrice = (price: number) =>
    new Intl.NumberFormat("de-CH", { style: "currency", currency: "CHF" }).format(price);

  const getCantonName = (code: string) => {
    const canton = cantons.find((c) => c.value === code);
    return canton?.label || code;
  };

  const handleAccept = async (id: string) => {
    try {
      await adminService.approveListing(id);
      toast({ title: "Freigegeben", description: "Das Inserat wurde freigegeben." });
      await loadListings();
      onStatsUpdate();
    } catch (error) {
      console.error("Error approving listing:", error);
      toast({
        variant: "destructive",
        title: "Fehler",
        description: "Inserat konnte nicht freigegeben werden.",
      });
    }
  };

  const openDeclineModal = (id: string) => {
    setDecliningId(id);
    setDeclineReason("");
    setDeclineModalOpen(true);
  };

  const handleDecline = async () => {
    if (!decliningId) return;
    const reason = declineReason.trim();
    if (!reason) return;

    try {
      setDeclineSubmitting(true);
      await adminService.declineToArchiveAndSendRejectionEmail(decliningId, reason);
      toast({
        title: "Abgelehnt",
        description: "Inserat wurde archiviert und der Kunde wurde per E-Mail informiert.",
      });
      setDeclineModalOpen(false);
      setDecliningId(null);
      setDeclineReason("");
      await loadListings();
      onStatsUpdate();
    } catch (error) {
      console.error("Error declining listing:", error);
      toast({
        variant: "destructive",
        title: "Fehler",
        description: "Inserat konnte nicht abgelehnt werden.",
      });
    } finally {
      setDeclineSubmitting(false);
    }
  };

  const ModerationRowActions = ({ listingId }: { listingId: string }) => (
    <div className="flex items-center gap-2">
      <Button size="sm" variant="outline" onClick={() => openDetailsModal(listings.find((l) => l.id === listingId)!)}>
        <Eye className="h-4 w-4" />
      </Button>
      <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700" onClick={() => handleAccept(listingId)}>
        <CheckCircle className="h-4 w-4" />
      </Button>
      <Button size="sm" variant="destructive" onClick={() => openDeclineModal(listingId)}>
        <XCircle className="h-4 w-4" />
      </Button>
    </div>
  );

  return (
    <div className="space-y-6">
      <Card className="p-4 md:p-6">
        <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="text-lg font-semibold text-neutral-900">Moderation</div>
            <div className="text-sm text-neutral-600">Nur wartende Inserate (pending).</div>
          </div>

          {pagination.total > 0 && (
            <div className="text-sm text-neutral-600">
              Total: <span className="font-medium text-neutral-900">{pagination.total}</span>
            </div>
          )}
        </div>
      </Card>

      <Card>
        <div className="md:hidden">
          {loading ? (
            <div className="p-8 text-center">
              <div className="mx-auto mb-2 h-6 w-6 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
              <span className="text-neutral-600">Lade Inserate...</span>
            </div>
          ) : listings.length === 0 ? (
            <div className="p-8 text-center text-neutral-600">Keine wartenden Inserate gefunden</div>
          ) : (
            <div className="divide-y divide-neutral-100">
              {listings.map((listing) => (
                <div key={listing.id} className="p-4">
                  <div className="flex items-start gap-3">
                    {listing.cover_image_url ? (
                      <img
                        src={listing.cover_image_url}
                        alt=""
                        className="h-16 w-24 flex-none rounded-lg object-cover"
                      />
                    ) : (
                      <div className="h-16 w-24 flex-none rounded-lg bg-neutral-100" />
                    )}

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <div className="truncate font-medium text-neutral-900">
                          {listing.brand} {listing.model}
                        </div>
                        {listing.premium && <Star className="h-4 w-4 flex-none text-amber-500" />}
                      </div>

                      <div className="mt-1 text-sm text-neutral-600">
                        {listing.year} • {listing.title || "Kein Titel"}
                      </div>

                      <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-neutral-600">
                        <span className="inline-flex items-center gap-1">
                          <MapPin className="h-3.5 w-3.5" />
                          {listing.location} ({getCantonName(listing.canton_code)})
                        </span>
                        <Badge variant="outline" className="text-xs">
                          {listing.price_plan || "N/A"}
                        </Badge>
                        <span className="text-xs text-neutral-500">{formatDate(listing.created_at)}</span>
                      </div>

                      {listing.owner_profile?.email && (
                        <div className="mt-2 flex items-center gap-2 text-xs text-neutral-600">
                          <User className="h-3.5 w-3.5" />
                          <span className="truncate">{listing.owner_profile.email}</span>
                        </div>
                      )}

                      <div className="mt-3">
                        <ModerationRowActions listingId={listing.id} />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="hidden md:block">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-neutral-200">
                <tr>
                  <th className="p-4 text-left">Fahrzeug</th>
                  <th className="p-4 text-left">Listing-Preis</th>
                  <th className="p-4 text-left">Plan</th>
                  <th className="p-4 text-left">Owner</th>
                  <th className="p-4 text-left">Standort</th>
                  <th className="p-4 text-left">Erstellt</th>
                  <th className="p-4 text-left">Aktionen</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center">
                      <div className="mx-auto mb-2 h-6 w-6 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
                      <span className="text-neutral-600">Lade Inserate...</span>
                    </td>
                  </tr>
                ) : listings.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-neutral-600">
                      Keine wartenden Inserate gefunden
                    </td>
                  </tr>
                ) : (
                  listings.map((listing) => (
                    <tr key={listing.id} className="border-b border-neutral-100 hover:bg-neutral-50">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          {listing.cover_image_url && (
                            <img
                              src={listing.cover_image_url}
                              alt=""
                              className="h-10 w-14 rounded object-cover"
                            />
                          )}
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <div className="truncate font-medium text-neutral-900">
                                {listing.brand} {listing.model}
                              </div>
                              {listing.premium && <Star className="h-4 w-4 text-amber-500" />}
                            </div>
                            <div className="text-sm text-neutral-600">
                              {listing.year} • {listing.title || "Kein Titel"}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="p-4">
                        <div className="font-medium">{formatPrice(listing.price_paid_chf || 0)}</div>
                      </td>

                      <td className="p-4">
                        <Badge variant="outline" className="text-xs">
                          {listing.price_plan || "N/A"}
                        </Badge>
                      </td>

                      <td className="p-4">
                        {listing.owner_profile ? (
                          <div className="text-sm">
                            <div className="flex items-center gap-2">
                              <User className="h-4 w-4 text-neutral-500" />
                              <span className="font-medium text-neutral-900">
                                {listing.owner_profile.full_name || listing.owner_profile.email || "Unbekannt"}
                              </span>
                            </div>
                            {listing.owner_profile.email && (
                              <div className="ml-6 text-xs text-neutral-600">{listing.owner_profile.email}</div>
                            )}
                            {listing.owner_profile.role && (
                              <div className="ml-6 text-xs text-neutral-500">{listing.owner_profile.role}</div>
                            )}
                          </div>
                        ) : (
                          <span className="text-sm text-neutral-500">—</span>
                        )}
                      </td>

                      <td className="p-4">
                        <div className="flex items-center gap-1 text-neutral-600">
                          <MapPin className="h-4 w-4" />
                          <span className="truncate">{listing.location}</span>
                          <span className="text-xs">({getCantonName(listing.canton_code)})</span>
                        </div>
                      </td>

                      <td className="p-4 text-sm text-neutral-600">{formatDate(listing.created_at)}</td>

                      <td className="p-4">
                        <ModerationRowActions listingId={listing.id} />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-neutral-200 p-4">
              <div className="text-sm text-neutral-600">
                Zeige {((filters.page || 1) - 1) * (filters.limit || 25) + 1} bis{" "}
                {Math.min((filters.page || 1) * (filters.limit || 25), pagination.total)} von{" "}
                {pagination.total} Inseraten
              </div>

              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  disabled={(filters.page || 1) <= 1}
                  onClick={() => setFilters((prev) => ({ ...prev, page: (prev.page || 1) - 1 }))}
                >
                  Zurück
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={(filters.page || 1) >= pagination.totalPages}
                  onClick={() => setFilters((prev) => ({ ...prev, page: (prev.page || 1) + 1 }))}
                >
                  Weiter
                </Button>
              </div>
            </div>
          )}
        </div>
      </Card>

      <Dialog open={declineModalOpen} onOpenChange={setDeclineModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Inserat ablehnen</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <label className="mb-2 block text-sm font-medium">Begründung (erforderlich)</label>
              <Textarea
                value={declineReason}
                onChange={(e) => setDeclineReason(e.target.value)}
                placeholder="Bitte geben Sie eine Begründung für die Ablehnung ein..."
                rows={4}
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setDeclineModalOpen(false);
                  setDeclineReason("");
                  setDecliningId(null);
                }}
                disabled={declineSubmitting}
              >
                Abbrechen
              </Button>
              <Button
                variant="destructive"
                onClick={handleDecline}
                disabled={!declineReason.trim() || declineSubmitting}
              >
                {declineSubmitting ? "Sende..." : "Ablehnen"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {selectedListing && (
        <ListingDetailsModal
          listing={selectedListing}
          open={detailsModalOpen}
          onOpenChange={setDetailsModalOpen}
          onUpdate={() => {
            loadListings();
            onStatsUpdate();
          }}
        />
      )}
    </div>
  );
}