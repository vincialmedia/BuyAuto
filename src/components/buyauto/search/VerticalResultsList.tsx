import { SearchResult } from "@/lib/buyauto/search";
import VerticalListingCard from "./VerticalListingCard";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, RotateCcw, Eye } from "lucide-react";
import { useRouter } from "next/router";

interface VerticalResultsListProps {
  searchResults: SearchResult | null;
  isLoading: boolean;
  onResetFilters?: () => void;
  onShowAllListings?: () => void;
}

export default function VerticalResultsList({ 
  searchResults, 
  isLoading, 
  onResetFilters,
  onShowAllListings 
}: VerticalResultsListProps) {
  const router = useRouter();
  
  // Loading skeleton
  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 6 }).map((_, index) => (
          <div key={index} className="bg-white border border-neutral-200/60 rounded-2xl overflow-hidden p-6">
            <div className="flex">
              <Skeleton className="w-64 h-40 rounded-xl" />
              <div className="flex-1 ml-6">
                <div className="flex justify-between">
                  <div className="flex-1">
                    <Skeleton className="h-6 w-64 mb-3" />
                    <div className="flex gap-2">
                      <Skeleton className="h-6 w-24 rounded-full" />
                      <Skeleton className="h-6 w-20 rounded-full" />
                      <Skeleton className="h-6 w-16 rounded-full" />
                      <Skeleton className="h-6 w-18 rounded-full" />
                    </div>
                  </div>
                  <div className="flex flex-col items-end space-y-3">
                    <Skeleton className="h-8 w-32" />
                    <Skeleton className="h-9 w-28 rounded-md" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  // Empty state
  if (!searchResults || searchResults.items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4">
        <div className="w-24 h-24 bg-neutral-100 rounded-full flex items-center justify-center mb-6">
          <Search className="h-10 w-10 text-neutral-400" />
        </div>
        
        <h3 className="text-xl font-semibold text-neutral-900 mb-2">
          Keine Fahrzeuge gefunden
        </h3>
        
        <p className="text-neutral-600 text-center mb-6 max-w-md">
          Versuchen Sie es mit weniger spezifischen Filtern oder erweitern Sie Ihre Suchkriterien.
        </p>
        
        <div className="flex space-x-3">
          {onResetFilters && (
            <Button
              onClick={onResetFilters}
              variant="outline"
              className="bg-transparent hover:bg-transparent border-neutral-300 text-neutral-700 hover:border-red-500 hover:text-red-500"
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Filter zurücksetzen
            </Button>
          )}
          
          {onShowAllListings && (
            <Button
              onClick={onShowAllListings}
              className="bg-red-500 hover:bg-red-600 text-white"
            >
              <Eye className="h-4 w-4 mr-2" />
              Alle Anzeigen
            </Button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {searchResults.items.map((listing) => (
        <VerticalListingCard
          key={listing.id}
          listing={listing}
          onDetailsClick={(id) => {
            router.push(`/fahrzeug/${id}`);
          }}
        />
      ))}
    </div>
  );
}