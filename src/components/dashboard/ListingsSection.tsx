
import { useState } from "react";
import { ListingDetail } from "@/lib/buyauto/types";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Edit2, Trash2, Eye, ExternalLink, X, ChevronLeft, ChevronRight, MoreHorizontal } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea"; // Added Textarea import
import StatusBadge from "@/components/buyauto/dashboard/StatusBadge";
import { useRouter } from "next/router";
import { dashboardService } from "@/services/dashboardService";
import { toast } from "sonner";

interface ListingsSectionProps {
  listings: ListingDetail[];
  onRefresh: () => void;
}

export default function ListingsSection({ listings, onRefresh }: ListingsSectionProps) {
  const router = useRouter();
  const [editingListing, setEditingListing] = useState<ListingDetail | null>(null);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [listingToDelete, setListingToDelete] = useState<ListingDetail | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Form state for editing
  const [formData, setFormData] = useState({
    brand: "",
    model: "",
    price: "",
    description: "", // Added description field
  });

  const handleEditClick = (listing: ListingDetail) => {
    setEditingListing(listing);
    setFormData({
      brand: listing.brand,
      model: listing.model,
      price: listing.pricePerMonthCHF.toString(),
      description: listing.description || "", // Initialize description
    });
    setIsEditOpen(true);
  };

  const handleDeleteClick = (listing: ListingDetail) => {
    setListingToDelete(listing);
    setIsDeleteOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!editingListing) return;

    try {
      setIsSaving(true);
      
      // Parse price to number
      const price = parseFloat(formData.price);
      if (isNaN(price)) {
        toast.error("Bitte geben Sie einen gültigen Preis ein");
        setIsSaving(false);
        return;
      }

      const { success, error } = await dashboardService.updateListing(editingListing.id, {
        brand: formData.brand,
        model: formData.model,
        price_per_month_chf: price,
        description: formData.description, // Save description
      });

      if (success) {
        toast.success("Inserat erfolgreich aktualisiert");
        setIsEditOpen(false);
        onRefresh(); // Refresh the listings list
      } else {
        toast.error("Fehler beim Aktualisieren: " + (error?.message || "Unbekannter Fehler"));
      }
    } catch (error) {
      console.error("Error updating listing:", error);
      toast.error("Ein unerwarteter Fehler ist aufgetreten");
    } finally {
      setIsSaving(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!listingToDelete) return;

    try {
      setIsDeleting(true);
      const { success, error } = await dashboardService.deleteListing(listingToDelete.id);

      if (success) {
        toast.success("Inserat erfolgreich gelöscht");
        setIsDeleteOpen(false);
        onRefresh();
      } else {
        toast.error("Fehler beim Löschen: " + (error?.message || "Unbekannter Fehler"));
      }
    } catch (error) {
      console.error("Error deleting listing:", error);
      toast.error("Ein unerwarteter Fehler ist aufgetreten");
    } finally {
      setIsDeleting(false);
    }
  };

  const viewListing = (id: string) => {
    router.push(`/fahrzeug/${id}`);
  };

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;
  const totalPages = Math.ceil(listings.length / itemsPerPage);
  
  const currentListings = listings.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const nextPage = () => {
    if (currentPage < totalPages) setCurrentPage(curr => curr + 1);
  };

  const prevPage = () => {
    if (currentPage > 1) setCurrentPage(curr => curr - 1);
  };

  if (listings.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <div className="bg-neutral-100 p-4 rounded-full mb-4">
            <Edit2 className="h-8 w-8 text-neutral-400" />
          </div>
          <h3 className="text-lg font-medium text-neutral-900 mb-1">Keine Inserate gefunden</h3>
          <p className="text-neutral-500 text-center max-w-sm mb-6">
            Sie haben noch keine Leasingübernahmen inseriert. Erstellen Sie jetzt Ihr erstes Inserat.
          </p>
          <Button 
            className="bg-red-600 hover:bg-red-700"
            onClick={() => router.push('/inserat-erstellen')}
          >
            Inserat erstellen
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4">
        {currentListings.map((listing) => (
          <Card key={listing.id} className="overflow-hidden border-neutral-200 transition-all hover:shadow-md">
            <div className="flex flex-col sm:flex-row">
              {/* Image */}
              <div className="w-full sm:w-48 h-32 sm:h-auto bg-neutral-100 relative">
                {listing.imageUrl ? (
                  <img 
                    src={listing.imageUrl} 
                    alt={`${listing.brand} ${listing.model}`}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-neutral-400">
                    Kein Bild
                  </div>
                )}
                {listing.is_premium && (
                  <div className="absolute top-2 left-2 bg-amber-500 text-white text-xs px-2 py-0.5 rounded font-medium shadow-sm">
                    Premium
                  </div>
                )}
              </div>

              {/* Content */}
              <div className="flex-1 p-4 sm:p-5 flex flex-col justify-between">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2 mb-2">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <StatusBadge status={listing.status} />
                      <span className="text-xs text-neutral-400">
                        ID: {listing.id.substring(0, 8)}
                      </span>
                    </div>
                    <h3 className="font-semibold text-lg text-neutral-900 line-clamp-1">
                      {listing.brand} {listing.model}
                    </h3>
                    <div className="text-sm text-neutral-500 flex flex-wrap gap-x-4 gap-y-1 mt-1">
                      <span>CHF {listing.pricePerMonthCHF}/Monat</span>
                      <span>•</span>
                      <span>{listing.year}</span>
                      <span>•</span>
                      <span>{listing.mileageKm.toLocaleString()} km</span>
                    </div>
                  </div>
                  
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8 self-end sm:self-start">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Aktionen</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => viewListing(listing.id)}>
                        <Eye className="mr-2 h-4 w-4" /> Ansehen
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleEditClick(listing)}>
                        <Edit2 className="mr-2 h-4 w-4" /> Bearbeiten
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        className="text-red-600 focus:text-red-600"
                        onClick={() => handleDeleteClick(listing)}
                      >
                        <Trash2 className="mr-2 h-4 w-4" /> Löschen
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                <div className="flex items-center justify-between mt-2 pt-3 border-t border-neutral-100">
                  <div className="text-xs text-neutral-500">
                    Erstellt: {new Date(listing.created_at).toLocaleDateString('de-CH')}
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="text-xs h-8"
                    onClick={() => viewListing(listing.id)}
                  >
                    Vorschau <ExternalLink className="ml-1.5 h-3 w-3" />
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center space-x-2">
          <Button
            variant="outline"
            size="icon"
            onClick={prevPage}
            disabled={currentPage === 1}
            className="h-8 w-8"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm text-neutral-600">
            Seite {currentPage} von {totalPages}
          </span>
          <Button
            variant="outline"
            size="icon"
            onClick={nextPage}
            disabled={currentPage === totalPages}
            className="h-8 w-8"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Inserat bearbeiten</DialogTitle>
            <DialogDescription>
              Bearbeiten Sie die wichtigsten Daten Ihres Inserats.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="brand">Marke</Label>
                <Input 
                  id="brand" 
                  value={formData.brand}
                  onChange={(e) => setFormData({...formData, brand: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="model">Modell</Label>
                <Input 
                  id="model" 
                  value={formData.model}
                  onChange={(e) => setFormData({...formData, model: e.target.value})}
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="price">Monatliche Rate (CHF)</Label>
              <Input 
                id="price" 
                type="number"
                value={formData.price}
                onChange={(e) => setFormData({...formData, price: e.target.value})}
              />
            </div>

            {/* Description Field */}
            <div className="space-y-2">
              <Label htmlFor="description">Fahrzeugbeschreibung</Label>
              <Textarea 
                id="description" 
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                placeholder="Beschreiben Sie Ihr Fahrzeug..."
                rows={5}
                className="resize-y"
              />
              <p className="text-xs text-neutral-500 text-right">
                {formData.description.length}/2000 Zeichen
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditOpen(false)}>
              Abbrechen
            </Button>
            <Button onClick={handleSaveEdit} disabled={isSaving} className="bg-red-600 hover:bg-red-700 text-white">
              {isSaving ? "Speichern..." : "Speichern"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Inserat löschen?</DialogTitle>
            <DialogDescription>
              Möchten Sie das Inserat "{listingToDelete?.brand} {listingToDelete?.model}" wirklich löschen? 
              Diese Aktion kann nicht rückgängig gemacht werden.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteOpen(false)}>
              Abbrechen
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleConfirmDelete}
              disabled={isDeleting}
            >
              {isDeleting ? "Löschen..." : "Löschen"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
