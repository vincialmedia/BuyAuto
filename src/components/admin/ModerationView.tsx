import { useState, useEffect } from "react";
import { adminService } from "@/services/adminService";
import type { AdminListing, AdminListingFilters } from "@/services/adminService";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Eye, CheckCircle, XCircle, Star, Calendar, MapPin, User } from "lucide-react";
import { ListingDetailsModal } from "@/components/admin/ListingDetailsModal";
import { cantons } from "@/lib/buyauto/data";

interface ModerationViewProps {
  onStatsUpdate: () => void;
}

export function ModerationView({ onStatsUpdate }: ModerationViewProps) {
  const [listings, setListings] = useState<AdminListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [filters, setFilters] = useState<AdminListingFilters>({
    status: 'pending',
    page: 1,
    limit: 25
  });
  const [pagination, setPagination] = useState({ total: 0, totalPages: 0 });
  
  // Modal states
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [selectedListing, setSelectedListing] = useState<AdminListing | null>(null);
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [bulkRejectModalOpen, setBulkRejectModalOpen] = useState(false);
  
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

  const handleApprove = async (id: string) => {
    try {
      await adminService.approveListing(id);
      toast({
        title: "Freigegeben",
        description: "Das Inserat wurde erfolgreich freigegeben."
      });
      loadListings();
      onStatsUpdate();
    } catch (error) {
      console.error('Error approving listing:', error);
      toast({
        variant: "destructive",
        title: "Fehler",
        description: "Inserat konnte nicht freigegeben werden."
      });
    }
  };

  const handleReject = async () => {
    if (!rejectingId || !rejectReason.trim()) return;

    try {
      await adminService.rejectListing(rejectingId, rejectReason.trim());
      toast({
        title: "Abgelehnt",
        description: "Das Inserat wurde abgelehnt und die Begründung gespeichert."
      });
      setRejectModalOpen(false);
      setRejectReason('');
      setRejectingId(null);
      loadListings();
      onStatsUpdate();
    } catch (error) {
      console.error('Error rejecting listing:', error);
      toast({
        variant: "destructive",
        title: "Fehler",
        description: "Inserat konnte nicht abgelehnt werden."
      });
    }
  };

  const handleBulkApprove = async () => {
    if (selectedIds.length === 0) return;

    try {
      await adminService.bulkApprove(selectedIds);
      toast({
        title: "Freigegeben",
        description: `${selectedIds.length} Inserate wurden freigegeben.`
      });
      setSelectedIds([]);
      loadListings();
      onStatsUpdate();
    } catch (error) {
      console.error('Error bulk approving:', error);
      toast({
        variant: "destructive",
        title: "Fehler",
        description: "Inserate konnten nicht freigegeben werden."
      });
    }
  };

  const handleBulkReject = async () => {
    if (selectedIds.length === 0 || !rejectReason.trim()) return;

    try {
      await adminService.bulkReject(selectedIds, rejectReason.trim());
      toast({
        title: "Abgelehnt",
        description: `${selectedIds.length} Inserate wurden abgelehnt.`
      });
      setBulkRejectModalOpen(false);
      setRejectReason('');
      setSelectedIds([]);
      loadListings();
      onStatsUpdate();
    } catch (error) {
      console.error('Error bulk rejecting:', error);
      toast({
        variant: "destructive",
        title: "Fehler",
        description: "Inserate konnten nicht abgelehnt werden."
      });
    }
  };

  const openRejectModal = (id: string) => {
    setRejectingId(id);
    setRejectModalOpen(true);
  };

  const openDetailsModal = (listing: AdminListing) => {
    setSelectedListing(listing);
    setDetailsModalOpen(true);
  };

  const formatDate = (dateString: string) => {
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
      case 'expired':
        return <Badge variant="outline">Abgelaufen</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
                <SelectItem value="pending">Wartend</SelectItem>
                <SelectItem value="published">Freigegeben</SelectItem>
                <SelectItem value="rejected">Abgelehnt</SelectItem>
                <SelectItem value="expired">Abgelaufen</SelectItem>
                <SelectItem value="all">Alle</SelectItem>
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

          <div>
            <label className="text-sm font-medium mb-2 block">Premium</label>
            <Select
              value={filters.premium === undefined ? 'all' : filters.premium ? 'true' : 'false'}
              onValueChange={(value) => setFilters({ 
                ...filters, 
                premium: value === 'all' ? undefined : value === 'true',
                page: 1 
              })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alle</SelectItem>
                <SelectItem value="true">Premium</SelectItem>
                <SelectItem value="false">Standard</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">Aktionen</label>
            <div className="flex space-x-2">
              {selectedIds.length > 0 && (
                <>
                  <Button
                    size="sm"
                    onClick={handleBulkApprove}
                    className="bg-emerald-600 hover:bg-emerald-700"
                  >
                    <CheckCircle className="w-4 h-4 mr-1" />
                    Freigeben ({selectedIds.length})
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => setBulkRejectModalOpen(true)}
                  >
                    <XCircle className="w-4 h-4 mr-1" />
                    Ablehnen ({selectedIds.length})
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </Card>

      {/* Listings Table */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b border-neutral-200">
              <tr>
                <th className="text-left p-4">
                  <Checkbox
                    checked={selectedIds.length === listings.length && listings.length > 0}
                    onCheckedChange={(checked) => {
                      setSelectedIds(checked ? listings.map(l => l.id) : []);
                    }}
                  />
                </th>
                <th className="text-left p-4">Fahrzeug</th>
                <th className="text-left p-4">Preis/Monat</th>
                <th className="text-left p-4">Laufzeit</th>
                <th className="text-left p-4">Standort</th>
                <th className="text-left p-4">Status</th>
                <th className="text-left p-4">Erstellt</th>
                <th className="text-left p-4">Aktionen</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center">
                    <div className="animate-spin rounded-full h-6 w-6 border-2 border-emerald-500 border-t-transparent mx-auto mb-2"></div>
                    <span className="text-neutral-600">Lade Inserate...</span>
                  </td>
                </tr>
              ) : listings.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-neutral-600">
                    Keine Inserate gefunden
                  </td>
                </tr>
              ) : (
                listings.map((listing) => (
                  <tr key={listing.id} className="border-b border-neutral-100 hover:bg-neutral-50">
                    <td className="p-4">
                      <Checkbox
                        checked={selectedIds.includes(listing.id)}
                        onCheckedChange={(checked) => {
                          setSelectedIds(prev => 
                            checked 
                              ? [...prev, listing.id]
                              : prev.filter(id => id !== listing.id)
                          );
                        }}
                      />
                    </td>
                    <td className="p-4">
                      <div className="flex items-center space-x-3">
                        {listing.cover_image_url && (
                          <img
                            src={listing.cover_image_url}
                            alt=""
                            className="w-12 h-8 object-cover rounded"
                          />
                        )}
                        <div>
                          <div className="font-medium text-neutral-900">
                            {listing.brand} {listing.model}
                          </div>
                          <div className="text-sm text-neutral-600">
                            {listing.year} • {listing.title || 'Kein Titel'}
                          </div>
                          {listing.premium && (
                            <Star className="w-4 h-4 text-amber-500 inline" />
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="font-medium">
                        {formatPrice(listing.price_per_month_chf)}
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center space-x-1 text-neutral-600">
                        <Calendar className="w-4 h-4" />
                        <span>{listing.remaining_months} Monate</span>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center space-x-1 text-neutral-600">
                        <MapPin className="w-4 h-4" />
                        <span>{listing.location}</span>
                        <span className="text-xs">({getCantonName(listing.canton_code)})</span>
                      </div>
                    </td>
                    <td className="p-4">
                      {getStatusBadge(listing.status)}
                    </td>
                    <td className="p-4 text-sm text-neutral-600">
                      {formatDate(listing.created_at)}
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
                        {listing.status === 'pending' && (
                          <>
                            <Button
                              size="sm"
                              onClick={() => handleApprove(listing.id)}
                              className="bg-emerald-600 hover:bg-emerald-700"
                            >
                              <CheckCircle className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => openRejectModal(listing.id)}
                            >
                              <XCircle className="w-4 h-4" />
                            </Button>
                          </>
                        )}
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

      {/* Single Reject Modal */}
      <Dialog open={rejectModalOpen} onOpenChange={setRejectModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Inserat ablehnen</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">
                Begründung (erforderlich)
              </label>
              <Textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Bitte geben Sie eine Begründung für die Ablehnung ein..."
                rows={4}
              />
            </div>
            <div className="flex space-x-2 justify-end">
              <Button
                variant="outline"
                onClick={() => {
                  setRejectModalOpen(false);
                  setRejectReason('');
                }}
              >
                Abbrechen
              </Button>
              <Button
                variant="destructive"
                onClick={handleReject}
                disabled={!rejectReason.trim()}
              >
                Ablehnen
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Bulk Reject Modal */}
      <Dialog open={bulkRejectModalOpen} onOpenChange={setBulkRejectModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{selectedIds.length} Inserate ablehnen</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">
                Begründung (erforderlich)
              </label>
              <Textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Bitte geben Sie eine Begründung für die Ablehnung ein..."
                rows={4}
              />
            </div>
            <div className="flex space-x-2 justify-end">
              <Button
                variant="outline"
                onClick={() => {
                  setBulkRejectModalOpen(false);
                  setRejectReason('');
                }}
              >
                Abbrechen
              </Button>
              <Button
                variant="destructive"
                onClick={handleBulkReject}
                disabled={!rejectReason.trim()}
              >
                {selectedIds.length} Inserate ablehnen
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