
import { ModernListingCard } from "./ModernListingCard";
import { ListingCardSkeleton } from "./ListingCardSkeleton";
import MinimalPagination from "./MinimalPagination";
import { Listing } from "@/lib/buyauto/types";
import { SearchCircle, FilterX } from "lucide-react";
import { Button } from "@/components/ui/button";

interface VerticalResultsListProps {
  listings: Listing[];
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  isLoading?: boolean;
  totalResults?: number;
  onClearFilters?: () => void;
}

export default function VerticalResultsList({
  listings,
  currentPage,
  totalPages,
  onPageChange,
  isLoading = false,
  totalResults = 0,
  onClearFilters
}: VerticalResultsListProps) {
  
  // Loading state with skeletons
  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 9 }).map((_, index) => (
            <ListingCardSkeleton key={index} />
          ))}
        </div>
      </div>
    );
  }

  // Empty state
  if (!isLoading && listings.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4">
        <div className="w-20 h-20 bg-neutral-100 rounded-full flex items-center justify-center mb-6">
          <SearchCircle className="h-10 w-10 text-neutral-400" />
        </div>
        <h3 className="text-2xl font-bold text-neutral-900 mb-2">
          Keine Fahrzeuge gefunden
        </h3>
        <p className="text-neutral-600 text-center max-w-md mb-8">
          Leider gibt es keine Ergebnisse für Ihre aktuelle Filterauswahl. 
          Versuchen Sie, einige Filter zu entfernen.
        </p>
        {onClearFilters && (
          <Button
            onClick={onClearFilters}
            variant="outline"
            className="border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300"
          >
            <FilterX className="h-4 w-4 mr-2" />
            Alle Filter zurücksetzen
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Results Count */}
      {totalResults > 0 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-neutral-600 font-medium">
            <span className="text-neutral-900 font-bold">{totalResults}</span> Fahrzeug{totalResults !== 1 ? "e" : ""} gefunden
          </p>
        </div>
      )}

      {/* Results Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {listings.map((listing) => (
          <ModernListingCard key={listing.id} listing={listing} />
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center pt-8">
          <MinimalPagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={onPageChange}
          />
        </div>
      )}
    </div>
  );
}
