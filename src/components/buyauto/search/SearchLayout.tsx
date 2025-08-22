import { SearchQuery, SearchResult } from "@/lib/buyauto/search";
import FacetPanel from "@/components/buyauto/search/FacetPanel";
import ResultsList from "@/components/buyauto/search/ResultsList";
import SeoHead from "@/components/buyauto/search/SeoHead";
import { useState } from "react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Filter } from "lucide-react";

interface SearchLayoutProps {
  searchQuery: SearchQuery;
  searchResults: SearchResult | null;
  isLoading: boolean;
  onSearchQueryChange: (query: SearchQuery) => void;
}

export default function SearchLayout({
  searchQuery,
  searchResults,
  isLoading,
  onSearchQueryChange,
}: SearchLayoutProps) {
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);

  const handleFilterApply = () => {
    setIsMobileFiltersOpen(false);
  };

  return (
    <>
      <SeoHead searchResults={searchResults} searchQuery={searchQuery} />
      
      <div className="container mx-auto max-w-[1400px] px-4 lg:px-8 py-6">
        {/* Mobile Filter Button */}
        <div className="lg:hidden mb-4">
          <Sheet open={isMobileFiltersOpen} onOpenChange={setIsMobileFiltersOpen}>
            <SheetTrigger asChild>
              <Button 
                variant="outline" 
                className="bg-transparent hover:bg-neutral-100/80 border-neutral-300 text-neutral-800 font-medium"
              >
                <Filter className="w-4 h-4 mr-2" />
                Filter
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-full sm:w-96 p-0">
              <div className="h-full overflow-y-auto">
                <FacetPanel
                  searchQuery={searchQuery}
                  onSearchQueryChange={onSearchQueryChange}
                  onApply={handleFilterApply}
                  isMobile
                />
              </div>
            </SheetContent>
          </Sheet>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6 lg:gap-8">
          {/* Desktop Facet Panel */}
          <div className="hidden lg:block">
            <div className="sticky top-6">
              <FacetPanel
                searchQuery={searchQuery}
                onSearchQueryChange={onSearchQueryChange}
                onApply={() => {}}
              />
            </div>
          </div>

          {/* Results */}
          <div className="min-w-0">
            <ResultsList
              searchQuery={searchQuery}
              searchResults={searchResults}
              isLoading={isLoading}
              onSearchQueryChange={onSearchQueryChange}
            />
          </div>
        </div>
      </div>
    </>
  );
}