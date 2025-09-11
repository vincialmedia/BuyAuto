import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Edit, 
  Trash2, 
  Calendar, 
  Crown, 
  MapPin,
  Clock,
  DollarSign,
  MoreHorizontal,
  AlertTriangle
} from "lucide-react";
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
import { useAuth } from "@/contexts/AuthContext";
import { getUserListings, deleteListing, upgradeToPremium, extendListing, DashboardListing } from "@/services/dashboardService";
import StatusBadge from "./StatusBadge";

export default function ListingsSection() {
  const [listings, setListings] = useState<DashboardListing[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [listingToDelete, setListingToDelete] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    const loadListings = async () => {
      try {
        const userListings = await getUserListings();
        setListings(userListings);
      } catch (error) {
        console.error('Error loading listings:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (user) {
      loadListings();
    }
  }, [user]);

  const handleEdit = (listingId: string) => {
    router.push(`/inserat-erstellen?edit=${listingId}`);
  };

  const handleDelete = async (listingId: string) => {
    try {
      setActionLoading(listingId);
      await deleteListing(listingId);
      setListings(listings.filter(l => l.id !== listingId));
      setDeleteDialogOpen(false);
      setListingToDelete(null);
    } catch (error) {
      console.error('Error deleting listing:', error);
      alert('Fehler beim Löschen des Inserats');
    } finally {
      setActionLoading(null);
    }
  };

  const handleUpgrade = async (listingId: string) => {
    try {
      setActionLoading(listingId);
      // In a real app, this would open Stripe checkout
      // For now, we'll just call the service
      await upgradeToPremium(listingId);
      
      // Update the listing in state
      setListings(listings.map(l => 
        l.id === listingId 
          ? { ...l, premium: true, is_premium: true }
          : l
      ));
      
      alert('Inserat erfolgreich auf Premium upgegradet!');
    } catch (error) {
      console.error('Error upgrading listing:', error);
      alert('Fehler beim Premium-Upgrade');
    } finally {
      setActionLoading(null);
    }
  };

  const handleExtend = async (listingId: string) => {
    try {
      setActionLoading(listingId);
      // In a real app, this would open Stripe checkout
      await extendListing(listingId, 90);
      
      // Reload listings to get updated expiry dates
      const updatedListings = await getUserListings();
      setListings(updatedListings);
      
      alert('Inserat erfolgreich um 90 Tage verlängert!');
    } catch (error) {
      console.error('Error extending listing:', error);
      alert('Fehler beim Verlängern des Inserats');
    } finally {
      setActionLoading(null);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('de-CH', {
      style: 'currency',
      currency: 'CHF',
      minimumFractionDigits: 0
    }).format(price);
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "Unlimitiert";
    return new Date(dateString).toLocaleDateString('de-CH');
  };

  const isPremium = (listing: DashboardListing) => {
    if (!listing.premium && !listing.is_premium) return false;
    if (!listing.premium_until) return true;
    return new Date(listing.premium_until) > new Date();
  };

  const isExpired = (listing: DashboardListing) => {
    if (listing.status === 'expired') return true;
    if (!listing.expires_at) return false;
    return new Date(listing.expires_at) <= new Date();
  };

  const getPlanBadge = (listing: DashboardListing) => {
    if (isPremium(listing)) return "Premium 30";
    if (listing.price_plan) return listing.price_plan;
    if (listing.duration_days === null) return "Unlimitiert";
    if (listing.duration_days >= 90) return "90 Tage";
    return "Gratis 30";
  };

  if (isLoading) {
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
          <p className="text-neutral-600">
            {listings.length} {listings.length === 1 ? 'Inserat' : 'Inserate'} insgesamt
          </p>
        </div>
        <Button
          onClick={() => router.push('/inserat-erstellen')}
          className="bg-red-500 hover:bg-red-600 text-white"
        >
          Neues Inserat erstellen
        </Button>
      </div>

      {listings.length === 0 ? (
        <Card className="border-neutral-200/60">
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
              onClick={() => router.push('/inserat-erstellen')}
              className="bg-red-500 hover:bg-red-600 text-white"
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

            return (
              <Card 
                key={listing.id} 
                className={`border-neutral-200/60 hover:shadow-md transition-all ${
                  expired ? 'opacity-75' : ''
                } ${premium ? 'ring-2 ring-amber-200/50 bg-gradient-to-r from-amber-50/30 to-white' : ''}`}
              >
                <CardContent className="p-6">
                  <div className="flex flex-col lg:flex-row gap-6">
                    {/* Image */}
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

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                        <div className="min-w-0 flex-1">
                          <h3 className="text-lg font-semibold text-neutral-900 mb-2">
                            {listing.brand} {listing.model} {listing.year}
                          </h3>
                          <div className="flex flex-wrap items-center gap-4 text-sm text-neutral-600 mb-3">
                            <div className="flex items-center gap-1">
                              <DollarSign className="w-4 h-4" />
                              {formatPrice(listing.price_per_month_chf)}/Monat
                            </div>
                            <div className="flex items-center gap-1">
                              <Clock className="w-4 h-4" />
                              {listing.remaining_months} Monate
                            </div>
                            <div className="flex items-center gap-1">
                              <MapPin className="w-4 h-4" />
                              {listing.location}
                            </div>
                          </div>
                          <div className="flex flex-wrap items-center gap-3">
                            <StatusBadge status={listing.status} expiresAt={listing.expires_at} />
                            <Badge variant="outline" className="text-xs">
                              {getPlanBadge(listing)}
                            </Badge>
                            {listing.expires_at && (
                              <span className="text-xs text-neutral-500">
                                Läuft ab: {formatDate(listing.expires_at)}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(listing.id)}
                            className="bg-transparent hover:bg-neutral-50"
                          >
                            <Edit className="w-4 h-4 mr-2" />
                            Bearbeiten
                          </Button>

                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="outline" size="sm" className="bg-transparent hover:bg-neutral-50">
                                <MoreHorizontal className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48">
                              {!premium && (
                                <DropdownMenuItem 
                                  onClick={() => handleUpgrade(listing.id)}
                                  disabled={actionLoading === listing.id}
                                >
                                  <Crown className="w-4 h-4 mr-2 text-amber-500" />
                                  Upgrade auf Premium
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

      {/* Delete Confirmation Dialog */}
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
              disabled={actionLoading !== null}
            >
              {actionLoading ? 'Wird gelöscht...' : 'Löschen'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}