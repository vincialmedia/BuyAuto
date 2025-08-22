import { SearchQuery, SearchResult, formatPrice, formatMileage } from "@/lib/buyauto/search";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import ListingCard from "@/components/buyauto/search/ListingCard";
import Pagination from "@/components/buyauto/search/Pagination";
import FilterChips from "@/components/buyauto/search/FilterChips";
import { ArrowUpDown } from "lucide-react";

interface ResultsListProps {
  searchQuery: SearchQuery;
  searchResults: SearchResult | null;
  isLoading: boolean;
  onSearchQueryChange: (query: SearchQuery) => void;
}

const SORT_OPTIONS = [
  { value: "relevance", label: "Relevanz (Standard)" },
  { value: "priceAsc", label: "Preis ↑" },
  { value: "priceDesc", label: "Preis ↓" },
  { value: "monthsAsc", label: "Restlaufzeit ↑" },
  { value: "monthsDesc", label: "Restlaufzeit ↓" },
  { value: "yearDesc", label: "Neueres Baujahr" },
  { value: "kmAsc", label: "Km ↑" }
];

export default function ResultsList({
  searchQuery,
  searchResults,
  isLoading,
  onSearchQueryChange,
}: ResultsListProps) {
  const handleSortChange = (sort: string) => {
    onSearchQueryChange({
      ...searchQuery,
      sort: sort as SearchQuery["sort"],
      page: 1
    });
  };

  const handlePageChange = (page: number) => {
    onSearchQueryChange({
      ...searchQuery,
      page
    });
  };

  if (isLoading && !searchResults) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-10 w-48" />
        </div>
        <div className="space-y-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-white rounded-2xl border border-neutral-200 p-6">
              <div className="flex gap-6">
                <Skeleton className="w-48 h-32 rounded-xl" />
                <div className="flex-1 space-y-3">
                  <Skeleton className="h-6 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                  <div className="flex gap-2">
                    <Skeleton className="h-6 w-16" />
                    <Skeleton className="h-6 w-20" />
                    <Skeleton className="h-6 w-14" />
                  </div>
                </div>
                <div className="text-right space-y-3">
                  <Skeleton className="h-8 w-32 ml-auto" />
                  <Skeleton className="h-10 w-28 ml-auto" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!searchResults || searchResults.total === 0) {
    return (
      <div className="space-y-6">
        <FilterChips searchQuery={searchQuery} onSearchQueryChange={onSearchQueryChange} />
        
        <div className="text-center py-16">
          <div className="bg-white rounded-3xl border border-neutral-200 p-12 max-w-md mx-auto shadow-sm">
            <div className="w-16 h-16 bg-neutral-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <ArrowUpDown className="w-6 h-6 text-neutral-500" />
            </div>
            <h3 className="text-xl font-semibold text-neutral-900 mb-3">
              Keine Treffer gefunden
            </h3>
            <p className="text-neutral-600 mb-8 leading-relaxed">
              Passen Sie Ihre Filter an oder reduzieren Sie die Kriterien für mehr Ergebnisse.
            </p>
            <div className="space-y-3">
              <Button 
                onClick={() => onSearchQueryChange({})}
                className="w-full bg-red-600 hover:bg-red-700 text-white font-medium"
              >
                Alle Filter zurücksetzen
              </Button>
              <Button 
                variant="outline"
                className="w-full bg-transparent hover:bg-neutral-50 border-neutral-300 text-neutral-700"
                onClick={() => {
                  const relaxedQuery = { ...searchQuery };
                  delete relaxedQuery.model;
                  delete relaxedQuery.canton;
                  delete relaxedQuery.body;
                  delete relaxedQuery.fuel;
                  onSearchQueryChange(relaxedQuery);
                }}
              >
                Ähnliche Fahrzeuge anzeigen
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with count and sort */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-semibold text-neutral-900">
            {searchResults.total.toLocaleString('de-CH')} Fahrzeuge
          </h2>
          {isLoading && (
            <div className="w-4 h-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
          )}
        </div>
        
        <div className="flex items-center gap-3">
          <span className="text-sm text-neutral-600 whitespace-nowrap">Sortieren nach</span>
          <Select value={searchQuery.sort || "relevance"} onValueChange={handleSortChange}>
            <SelectTrigger className="w-48 bg-white border-neutral-300 text-neutral-900">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SORT_OPTIONS.map(option => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Filter chips */}
      <FilterChips searchQuery={searchQuery} onSearchQueryChange={onSearchQueryChange} />

      {/* Results list */}
      <div className="space-y-4">
        {searchResults.items.map((listing) => (
          <ListingCard 
            key={listing.id} 
            listing={listing}
            className={isLoading ? "opacity-70 pointer-events-none" : ""}
          />
        ))}
      </div>

      {/* Pagination */}
      {searchResults.total > searchResults.pageSize && (
        <div className="border-t border-neutral-200 pt-8">
          <Pagination
            currentPage={searchResults.page}
            totalPages={Math.ceil(searchResults.total / searchResults.pageSize)}
            onPageChange={handlePageChange}
          />
        </div>
      )}
    </div>
  );
}