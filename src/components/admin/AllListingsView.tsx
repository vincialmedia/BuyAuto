import { useState, useEffect } from "react";
import { adminService } from "@/services/adminService";
import type { AdminListing, AdminListingFilters } from "@/services/adminService";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { 
  Search, 
  Eye, 
  Star, 
  Calendar, 
  MapPin, 
  Plus,
  Minus,
  Trash2,
  MoreVertical,
  RefreshCw
} from "lucide-react";
import { ListingDetailsModal } from "@/components/admin/ListingDetailsModal";
import { cantons } from "@/lib/buyauto/data";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface AllListingsViewProps {
  onStatsUpdate: () => void;
}

export function AllListingsView({ onStatsUpdate }: AllListingsViewProps) {
  const [listings, setListings] = useState<AdminListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState<AdminListingFilters>({
    status: 'all',
    page: 1,
    limit: 25
  });
  const [pagination, setPagination] = useState({ total: 0, totalPages: 0 });
  
  // Modal states
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [selectedListing, setSelectedListing] = useState<AdminListing | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [declineModalOpen, setDeclineModalOpen] = useState(false);
  const [declineReason, setDeclineReason] = useState("");
  const [decliningId, setDecliningId] = useState<string | null>(null);
  const [archiveModalOpen, setArchiveModalOpen] = useState(false);
  const [archiveReason, setArchiveReason] = useState("");
  const [archivingId, setArchivingId] = useState<string | null>(null);
  
  const { toast } = useToast();

  useEffect(() => {
    loadListings();
  }, [filters]);

  const loadListings = async () => {
    try {
      setLoading(true);
      const data = await adminService.getListings(filters);
      setListings(data.listings);
      setPagination({
        total: data.total,
        totalPages: data.totalPages
      });
    } catch (error) {
      console.error('Error loading listings:', error);
      toast({
        variant: "destructive",
        title: "Fehler",
        description: "Inserate konnten nicht geladen werden."
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    setFilters({ ...filters, search: searchTerm, page: 1 });
  };

  const handleTogglePremium = async (id: string, isPremium: boolean) => {
    try {
      await adminService.togglePremium(id, !isPremium, 30);
      toast({
        title: isPremium ? "Premium deaktiviert" : "Premium aktiviert",
        description: `Das Inserat ist ${isPremium ? 'nicht mehr' : 'jetzt'} Premium.`
      });
      loadListings();
      onStatsUpdate();
    } catch (error) {
      console.error('Error toggling premium:', error);
      toast({
        variant: "destructive",
        title: "Fehler",
        description: "Premium-Status konnte nicht geändert werden."
      });
    }
  };

  const handleExtendExpiry = async (id: string, days: number) => {
    try {
      await adminService.extendExpiry(id, days);
      toast({
        title: "Verlängert",
        description: `Das Inserat wurde um ${days} Tage verlängert.`
      });
      loadListings();
    } catch (error) {
      console.error('Error extending expiry:', error);
      toast({
        variant: "destructive",
        title: "Fehler",
        description: "Laufzeit konnte nicht verlängert werden."
      });
    }
  };

  const handleStatusChange = async (id: string, newStatus: string) => {
    try {
      await adminService.adminUpdateListingStatus(id, { status: newStatus as any });
      toast({
        title: "Status geändert",
        description: `Status wurde auf "${newStatus}" geändert.`
      });
      loadListings();
      onStatsUpdate();
    } catch (error) {
      console.error('Error updating status:', error);
      toast({
        variant: "destructive",
        title: "Fehler",
        description: "Status konnte nicht geändert werden."
      });
    }
  };

  const handleDelete = async () => {
    if (!deletingId) return;

    try {
      await adminService.deleteListing(deletingId);
      toast({
        title: "Gelöscht",
        description: "Das Inserat wurde erfolgreich gelöscht."
      });
      setDeleteModalOpen(false);
      setDeletingId(null);
      loadListings();
      onStatsUpdate();
    } catch (error) {
      console.error('Error deleting listing:', error);
      toast({
        variant: "destructive",
        title: "Fehler",
        description: "Inserat konnte nicht gelöscht werden."
      });
    }
  };

  const openDetailsModal = (listing: AdminListing) => {
    setSelectedListing(listing);
    setDetailsModalOpen(true);
  };

  const openDeleteModal = (id: string) => {
    setDeletingId(id);
    setDeleteModalOpen(true);
  };

  const openDeclineModal = (id: string) => {
    setDecliningId(id);
    setDeclineReason("");
    setDeclineModalOpen(true);
  };

  const openArchiveModal = (id: string) => {
    setArchivingId(id);
    setArchiveReason("");
    setArchiveModalOpen(true);
  };

  const handleDecline = async () => {
    if (!decliningId) return;
    try {
      await adminService.declineListing(decliningId, declineReason.trim() || "Abgelehnt durch Admin.");
      toast({ title: "Abgelehnt", description: "Das Inserat wurde abgelehnt und der Uploader benachrichtigt." });
      setDeclineModalOpen(false);
      setDecliningId(null);
      loadListings();
      onStatsUpdate();
    } catch (error) {
      console.error("Error declining listing:", error);
      toast({ variant: "destructive", title: "Fehler", description: "Inserat konnte nicht abgelehnt werden." });
    }
  };

  const handleArchive = async () => {
    if (!archivingId) return;
    try {
      console.log("[admin] archive listing", { id: archivingId, note: archiveReason });
      await adminService.adminUpdateListingStatus(archivingId, {
        status: "archived",
        moderationNote: archiveReason.trim() || null,
      });
      toast({
        title: "Archiviert",
        description: "Das Inserat wurde archiviert.",
      });
      setArchiveModalOpen(false);
      setArchivingId(null);
      loadListings();
      onStatsUpdate();
    } catch (error) {
      console.error("Error archiving listing:", error);
      toast({
        variant: "destructive",
        title: "Fehler",
        description: error instanceof Error ? error.message : "Inserat konnte nicht archiviert werden.",
      });
    }
  };

  const formatDate = (dateString: string | null, status: string) => {
    if (!dateString) {
      if (status === 'pending') return <span className="text-neutral-400 italic">Startet bei Freigabe</span>;
      return 'Nie';
    }
    return new Date(dateString).toLocaleDateString('de-CH');
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('de-CH', {
      style: 'currency',
      currency: 'CHF'
    }).format(price);
  };

  const getCantonName = (code: string) => {
    const canton = cantons.find(c => c.value === code);
    return canton?.label || code;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary" className="bg-amber-100 text-amber-800">Wartend</Badge>;
      case 'published':
        return <Badge variant="default" className="bg-emerald-100 text-emerald-800">Freigegeben</Badge>;
      case 'rejected':
        return <Badge variant="destructive">Abgelehnt</Badge>;
      case 'archived':
      case 'expired':
        return <Badge variant="outline" className="bg-neutral-100 text-neutral-800 border-neutral-200/60">Archiviert</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Search and Filters */}
      <Card className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="md:col-span-2">
            <label className="text-sm font-medium mb-2 block">Suche</label>
            <div className="flex space-x-2">
              <Input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Marke, Modell, Ort..."
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    handleSearch();
                  }
                }}
              />
              <Button onClick={handleSearch} size="sm">
                <Search className="w-4 h-4" />
              </Button>
            </div>
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">Status</label>
            <Select
              value={filters.status}
              onValueChange={(value) => setFilters({ ...filters, status: value as any, page: 1 })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alle</SelectItem>
                <SelectItem value="pending">Wartend</SelectItem>
                <SelectItem value="published">Freigegeben</SelectItem>
                <SelectItem value="rejected">Abgelehnt</SelectItem>
                <SelectItem value="archived">Archiviert</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">Kanton</label>
            <Select
              value={filters.canton || 'all'}
              onValueChange={(value) => setFilters({ ...filters, canton: value === 'all' ? undefined : value, page: 1 })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Alle Kantone" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alle Kantone</SelectItem>
                {cantons.map((canton) => (
                  <SelectItem key={canton.value} value={canton.value}>
                    {canton.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </Card>

      {/* Listings Table */}
      <Card>
        <div className="p-4 border-b border-neutral-200 flex justify-between items-center">
          <h2 className="text-lg font-semibold">Alle Inserate ({pagination.total})</h2>
          <Button size="sm" variant="outline" onClick={loadListings}>
            <RefreshCw className="w-4 h-4 mr-1" />
            Aktualisieren
          </Button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b border-neutral-200 bg-neutral-50">
              <tr>
                <th className="text-left p-4">Fahrzeug</th>
                <th className="text-left p-4">Uploader</th>
                <th className="text-left p-4">Listing-Preis</th>
                <th className="text-left p-4">Plan</th>
                <th className="text-left p-4">Status</th>
                <th className="text-left p-4">Premium</th>
                <th className="text-left p-4">Erstellt</th>
                <th className="text-left p-4">Läuft ab</th>
                <th className="text-left p-4">Aktionen</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={9} className="p-8 text-center">
                    <div className="animate-spin rounded-full h-6 w-6 border-2 border-emerald-500 border-t-transparent mx-auto mb-2"></div>
                    <span className="text-neutral-600">Lade Inserate...</span>
                  </td>
                </tr>
              ) : listings.length === 0 ? (
                <tr>
                  <td colSpan={9} className="p-8 text-center text-neutral-600">
                    Keine Inserate gefunden
                  </td>
                </tr>
              ) : (
                listings.map((listing) => (
                  <tr key={listing.id} className="border-b border-neutral-100 hover:bg-neutral-50">
                    <td className="p-4">
                      <div className="flex items-center">
                        <div>
                          <div className="font-medium">{listing.brand} {listing.model}</div>
                          <div className="text-sm text-muted-foreground">{listing.year} &middot; {listing.canton_code}</div>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="text-sm text-neutral-700">
                        {listing.owner_profile?.email || "—"}
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="font-medium">
                        {formatPrice(listing.price_paid_chf || 0)}
                      </div>
                    </td>
                    <td className="p-4">
                      <Badge variant="outline" className="text-xs">
                        {listing.price_plan || 'N/A'}
                      </Badge>
                    </td>
                    <td className="p-4">
                      <Select
                        value={listing.status === "expired" ? "archived" : listing.status}
                        onValueChange={(value) => handleStatusChange(listing.id, value)}
                      >
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pending">Wartend</SelectItem>
                          <SelectItem value="published">Freigegeben</SelectItem>
                          <SelectItem value="rejected">Abgelehnt</SelectItem>
                          <SelectItem value="archived">Archiviert</SelectItem>
                        </SelectContent>
                      </Select>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center space-x-2">
                        <Button
                          size="sm"
                          variant={listing.premium ? "default" : "outline"}
                          onClick={() => handleTogglePremium(listing.id, listing.premium)}
                          className={listing.premium ? "bg-amber-500 hover:bg-amber-600" : ""}
                        >
                          <Star className="w-4 h-4" />
                        </Button>
                        {listing.premium && listing.premium_until && (
                          <span className="text-xs text-neutral-600">
                            bis {formatDate(listing.premium_until, listing.status)}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="p-4 text-sm text-neutral-600">
                      {formatDate(listing.created_at, listing.status)}
                    </td>
                    <td className="p-4 text-sm text-neutral-600">
                      {formatDate(listing.expires_at, listing.status)}
                    </td>
                    <td className="p-4">
                      <div className="flex items-center space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openDetailsModal(listing)}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>

                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button size="sm" variant="outline">
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleExtendExpiry(listing.id, 30)}>
                              <Plus className="w-4 h-4 mr-2" />
                              +30 Tage
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleExtendExpiry(listing.id, 90)}>
                              <Plus className="w-4 h-4 mr-2" />
                              +90 Tage
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => openArchiveModal(listing.id)}>
                              <Calendar className="w-4 h-4 mr-2" />
                              Archivieren
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => openDeleteModal(listing.id)}
                              className="text-red-600"
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Löschen
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => openDeclineModal(listing.id)}>
                              <Minus className="w-4 h-4 mr-2" />
                              Ablehnen
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="p-4 border-t border-neutral-200 flex justify-between items-center">
            <div className="text-sm text-neutral-600">
              Zeige {((filters.page || 1) - 1) * (filters.limit || 25) + 1} bis{' '}
              {Math.min((filters.page || 1) * (filters.limit || 25), pagination.total)} von{' '}
              {pagination.total} Inseraten
            </div>
            <div className="flex space-x-2">
              <Button
                size="sm"
                variant="outline"
                disabled={(filters.page || 1) <= 1}
                onClick={() => setFilters({ ...filters, page: (filters.page || 1) - 1 })}
              >
                Zurück
              </Button>
              <Button
                size="sm"
                variant="outline"
                disabled={(filters.page || 1) >= pagination.totalPages}
                onClick={() => setFilters({ ...filters, page: (filters.page || 1) + 1 })}
              >
                Weiter
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Delete Confirmation Modal */}
      <Dialog open={deleteModalOpen} onOpenChange={setDeleteModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Inserat löschen</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p>Sind Sie sicher, dass Sie dieses Inserat endgültig löschen möchten? Diese Aktion kann nicht rückgängig gemacht werden.</p>
            <div className="flex space-x-2 justify-end">
              <Button
                variant="outline"
                onClick={() => {
                  setDeleteModalOpen(false);
                  setDeletingId(null);
                }}
              >
                Abbrechen
              </Button>
              <Button
                variant="destructive"
                onClick={handleDelete}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Löschen
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={declineModalOpen} onOpenChange={setDeclineModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Inserat ablehnen</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-neutral-600">Optional: Grund für die Ablehnung (wird per E-Mail an den Uploader geschickt).</p>
            <Textarea value={declineReason} onChange={(e) => setDeclineReason(e.target.value)} className="min-h-[120px]" />
            <div className="flex space-x-2 justify-end">
              <Button variant="outline" onClick={() => { setDeclineModalOpen(false); setDecliningId(null); }}>
                Abbrechen
              </Button>
              <Button variant="destructive" onClick={handleDecline}>
                <Minus className="w-4 h-4 mr-2" />
                Ablehnen
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={archiveModalOpen} onOpenChange={setArchiveModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Inserat archivieren</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-neutral-600">
              Optional: Notiz (intern). Das Inserat wird auf "archived" gesetzt.
            </p>
            <Textarea value={archiveReason} onChange={(e) => setArchiveReason(e.target.value)} className="min-h-[120px]" />
            <div className="flex space-x-2 justify-end">
              <Button
                variant="outline"
                onClick={() => {
                  setArchiveModalOpen(false);
                  setArchivingId(null);
                }}
              >
                Abbrechen
              </Button>
              <Button variant="destructive" onClick={handleArchive}>
                Archivieren
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Details Modal */}
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