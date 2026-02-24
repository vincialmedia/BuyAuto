import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { adminService } from "@/services/adminService";
import type { AdminListing } from "@/services/adminService";
import { useToast } from "@/hooks/use-toast";
import { Save, Edit2, Star, Calendar, MapPin, Phone, Mail, CheckCircle, XCircle } from "lucide-react";
import { cantons } from "@/lib/buyauto/data";

interface ListingDetailsModalProps {
  listing: AdminListing;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdate: () => void;
}

export function ListingDetailsModal({
  listing,
  open,
  onOpenChange,
  onUpdate
}: ListingDetailsModalProps) {
  const [editing, setEditing] = useState(false);
  const [editData, setEditData] = useState<Partial<AdminListing>>({});
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (listing) {
      setEditData({
        brand: listing.brand,
        model: listing.model,
        title: listing.title,
        year: listing.year,
        price_paid_chf: listing.price_paid_chf,
        remaining_months: listing.remaining_months,
        location: listing.location,
        canton_code: listing.canton_code,
        status: listing.status,
        premium: listing.premium,
        description: listing.description,
        remaining_km: listing.remaining_km,
      });
    }
  }, [listing, open]);

  const handleEdit = () => {
    setEditing(true);
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      await adminService.updateListingDetails(listing.id, editData);
      
      toast({
        title: "Gespeichert",
        description: "Inserat wurde erfolgreich aktualisiert."
      });
      
      setEditing(false);
      onUpdate();
    } catch (error) {
      console.error('Error updating listing:', error);
      toast({
        variant: "destructive",
        title: "Fehler",
        description: "Inserat konnte nicht aktualisiert werden."
      });
    } finally {
      setSaving(false);
    }
  };

  const handleApprove = async () => {
    try {
      await adminService.approveListing(listing.id);
      toast({
        title: "Freigegeben",
        description: "Das Inserat wurde erfolgreich freigegeben."
      });
      onUpdate();
    } catch (error) {
      console.error('Error approving listing:', error);
      toast({
        variant: "destructive",
        title: "Fehler",
        description: "Inserat konnte nicht freigegeben werden."
      });
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Nie';
    return new Date(dateString).toLocaleDateString('de-CH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatPrice = (price: number | null) => {
    if (price === null) return 'N/A';
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
      case "pending":
        return <Badge variant="secondary" className="bg-amber-100 text-amber-800">Wartend</Badge>;
      case "published":
        return <Badge variant="default" className="bg-emerald-100 text-emerald-800">Freigegeben</Badge>;
      case "rejected":
        return <Badge variant="destructive">Abgelehnt</Badge>;
      case "expired":
        return <Badge variant="outline">Abgelaufen</Badge>;
      case "archived":
        return <Badge variant="outline" className="bg-neutral-100 text-neutral-700">Archiviert</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
        onOpenChange(isOpen);
        if (!isOpen) {
            setEditing(false);
        }
    }}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center space-x-2">
              <span>{listing.brand} {listing.model} ({listing.year})</span>
              {listing.premium && <Star className="w-5 h-5 text-amber-500" />}
            </DialogTitle>
            <div className="flex items-center space-x-2">
              {getStatusBadge(listing.status)}
              {!editing && (
                <Button size="sm" variant="outline" onClick={handleEdit}>
                  <Edit2 className="w-4 h-4 mr-1" />
                  Bearbeiten
                </Button>
              )}
            </div>
          </div>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column - Images and Basic Info */}
          <div className="space-y-4">
            {/* Images Gallery */}
            {listing.images && Array.isArray(listing.images) && listing.images.length > 0 && (
              <div className="space-y-2">
                <h3 className="font-medium">Bilder</h3>
                <div className="grid grid-cols-2 gap-2">
                  {listing.images.map((image, index) => (
                    <img
                      key={index}
                      src={image.url || image}
                      alt={`Bild ${index + 1}`}
                      className="w-full h-24 object-cover rounded border"
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Vehicle Details */}
            <div className="space-y-3">
              <h3 className="font-medium">Fahrzeugdaten</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-neutral-600">Marke</label>
                  {editing ? (
                    <Input
                      value={editData.brand || ''}
                      onChange={(e) => setEditData({ ...editData, brand: e.target.value })}
                    />
                  ) : (
                    <p className="font-medium">{listing.brand}</p>
                  )}
                </div>
                <div>
                  <label className="text-sm text-neutral-600">Modell</label>
                  {editing ? (
                    <Input
                      value={editData.model || ''}
                      onChange={(e) => setEditData({ ...editData, model: e.target.value })}
                    />
                  ) : (
                    <p className="font-medium">{listing.model}</p>
                  )}
                </div>
                <div>
                  <label className="text-sm text-neutral-600">Jahr</label>
                  {editing ? (
                    <Input
                      type="number"
                      value={editData.year || ''}
                      onChange={(e) => setEditData({ ...editData, year: parseInt(e.target.value) })}
                    />
                  ) : (
                    <p className="font-medium">{listing.year}</p>
                  )}
                </div>
                <div>
                  <label className="text-sm text-neutral-600">Titel</label>
                  {editing ? (
                    <Input
                      value={editData.title || ''}
                      onChange={(e) => setEditData({ ...editData, title: e.target.value })}
                      placeholder="Optionaler Titel"
                    />
                  ) : (
                    <p className="font-medium">{listing.title || 'Kein Titel'}</p>
                  )}
                </div>
              </div>
              
              {/* Description Field - ADDED */}
              <div className="mt-4">
                <label className="text-sm text-neutral-600">Fahrzeugbeschreibung</label>
                {editing ? (
                  <Textarea
                    value={editData.description || ''}
                    onChange={(e) => setEditData({ ...editData, description: e.target.value })}
                    placeholder="Fahrzeugbeschreibung..."
                    className="min-h-[100px]"
                  />
                ) : (
                  <div className="p-3 bg-neutral-50 rounded border text-sm whitespace-pre-wrap">
                    {listing.description || <span className="text-neutral-400 italic">Keine Beschreibung vorhanden</span>}
                  </div>
                )}
              </div>
            </div>

            {/* Pricing & Duration */}
            <div className="space-y-3">
              <h3 className="font-medium">Leasing-Details</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-neutral-600">Bezahlter Preis</label>
                  {editing ? (
                    <Input
                      type="number"
                      value={editData.price_paid_chf || ''}
                      onChange={(e) => setEditData({ ...editData, price_paid_chf: parseFloat(e.target.value) })}
                    />
                  ) : (
                    <p className="font-medium text-lg text-emerald-600">
                      {formatPrice(listing.price_paid_chf)}
                    </p>
                  )}
                </div>
                <div>
                  <label className="text-sm text-neutral-600">Verbleibende KM</label>
                  {editing ? (
                    <Input
                      type="number"
                      value={editData.remaining_km || ''}
                      onChange={(e) => setEditData({ ...editData, remaining_km: parseInt(e.target.value) })}
                      placeholder="z.B. 15000"
                    />
                  ) : (
                    <p className="font-medium">
                      {listing.remaining_km ? `${listing.remaining_km.toLocaleString('de-CH')} km` : <span className="text-neutral-400">Nicht angegeben</span>}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Location and Admin Info */}
          <div className="space-y-4">
            {/* Location */}
            <div className="space-y-3">
              <h3 className="font-medium">Standort</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-neutral-600">Ort</label>
                  {editing ? (
                    <Input
                      value={editData.location || ''}
                      onChange={(e) => setEditData({ ...editData, location: e.target.value })}
                    />
                  ) : (
                    <p className="font-medium">{listing.location}</p>
                  )}
                </div>
                <div>
                  <label className="text-sm text-neutral-600">Kanton</label>
                  {editing ? (
                    <Select
                      value={editData.canton_code || ''}
                      onValueChange={(value) => setEditData({ ...editData, canton_code: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {cantons.map((canton) => (
                          <SelectItem key={canton.value} value={canton.value}>
                            {canton.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <p className="font-medium">{getCantonName(listing.canton_code)}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Premium Status */}
            <div className="space-y-3">
              <h3 className="font-medium">Premium Status</h3>
              <div className="space-y-2">
                {editing ? (
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      checked={editData.premium || false}
                      onCheckedChange={(checked) => setEditData({ ...editData, premium: !!checked })}
                    />
                    <label>Premium Inserat</label>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2">
                    <span className={`px-2 py-1 rounded text-sm ${
                      listing.premium 
                        ? 'bg-amber-100 text-amber-800' 
                        : 'bg-neutral-100 text-neutral-600'
                    }`}>
                      {listing.premium ? 'Premium' : 'Standard'}
                    </span>
                  </div>
                )}
                {listing.premium_until && (
                  <p className="text-sm text-neutral-600">
                    Premium bis: {formatDate(listing.premium_until)}
                  </p>
                )}
              </div>
            </div>

            {/* Status & Moderation */}
            <div className="space-y-3">
              <h3 className="font-medium">Status & Moderation</h3>
              <div className="space-y-2">
                {editing ? (
                  <Select
                    value={editData.status || ""}
                    onValueChange={(value) => setEditData({ ...editData, status: value as any })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Wartend</SelectItem>
                      <SelectItem value="published">Freigegeben</SelectItem>
                      <SelectItem value="rejected">Abgelehnt</SelectItem>
                      <SelectItem value="expired">Abgelaufen</SelectItem>
                      <SelectItem value="archived">Archiviert</SelectItem>
                    </SelectContent>
                  </Select>
                ) : (
                  <p>Status: {getStatusBadge(listing.status)}</p>
                )}
                
                {listing.moderation_note && (
                  <div className="space-y-1">
                    <label className="text-sm text-neutral-600">Moderations-Notiz</label>
                    <p className="text-sm p-2 bg-red-50 border border-red-200 rounded">
                      {listing.moderation_note}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Timestamps */}
            <div className="space-y-3">
              <h3 className="font-medium">Zeitstempel</h3>
              <div className="space-y-2 text-sm text-neutral-600">
                <div className="flex justify-between">
                  <span>Erstellt:</span>
                  <span>{formatDate(listing.created_at)}</span>
                </div>
                {listing.expires_at && (
                  <div className="flex justify-between">
                    <span>Läuft ab:</span>
                    <span>{formatDate(listing.expires_at)}</span>
                  </div>
                )}
                {listing.premium_until && (
                  <div className="flex justify-between">
                    <span>Premium bis:</span>
                    <span>{formatDate(listing.premium_until)}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-between pt-6 border-t">
          <div className="flex flex-wrap gap-2">
            {listing.status === "pending" && !editing && (
              <Button
                onClick={handleApprove}
                className="bg-emerald-600 hover:bg-emerald-700"
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                Freigeben
              </Button>
            )}

            {!editing && listing.status !== "archived" && (
              <Button
                variant="outline"
                onClick={async () => {
                  try {
                    await adminService.archiveListing(listing.id, "Archiviert durch Admin");
                    toast({ title: "Archiviert", description: "Inserat wurde archiviert (30 Tage Aufbewahrung)." });
                    onUpdate();
                    onOpenChange(false);
                  } catch (error) {
                    console.error("Error archiving listing:", error);
                    toast({ variant: "destructive", title: "Fehler", description: "Inserat konnte nicht archiviert werden." });
                  }
                }}
              >
                Archivieren
              </Button>
            )}

            {!editing && listing.status === "archived" && (
              <Button
                variant="outline"
                onClick={async () => {
                  try {
                    await adminService.restoreArchivedListing(listing.id);
                    toast({ title: "Wiederhergestellt", description: "Inserat wurde zurück auf 'pending' gesetzt." });
                    onUpdate();
                    onOpenChange(false);
                  } catch (error) {
                    console.error("Error restoring listing:", error);
                    toast({ variant: "destructive", title: "Fehler", description: "Inserat konnte nicht wiederhergestellt werden." });
                  }
                }}
              >
                Restore
              </Button>
            )}
          </div>

          <div className="flex space-x-2">
            {editing ? (
              <>
                <Button
                  variant="outline"
                  onClick={() => {
                    setEditing(false);
                  }}
                  disabled={saving}
                >
                  Abbrechen
                </Button>
                <Button
                  onClick={handleSave}
                  disabled={saving}
                >
                  {saving ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                      Speichern...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Speichern
                    </>
                  )}
                </Button>
              </>
            ) : (
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Schliessen
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
