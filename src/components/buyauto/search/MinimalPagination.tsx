
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface MinimalPaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  className?: string;
}

export default function MinimalPagination({ 
  currentPage, 
  totalPages, 
  onPageChange, 
  className 
}: MinimalPaginationProps) {
  
  if (totalPages <= 1) return null;

  // Generate page numbers to show
  const getVisiblePages = () => {
    const pages: (number | 'ellipsis')[] = [];
    const maxVisiblePages = 7;
    
    if (totalPages <= maxVisiblePages) {
      // Show all pages
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Always show first page
      pages.push(1);
      
      if (currentPage > 4) {
        pages.push('ellipsis');
      }
      
      // Show pages around current page
      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);
      
      for (let i = start; i <= end; i++) {
        if (!pages.includes(i)) {
          pages.push(i);
        }
      }
      
      if (currentPage < totalPages - 3) {
        pages.push('ellipsis');
      }
      
      // Always show last page
      if (!pages.includes(totalPages)) {
        pages.push(totalPages);
      }
    }
    
    return pages;
  };

  const visiblePages = getVisiblePages();

  return (
    <nav className={cn("flex justify-center", className)}>
      <div className="flex items-center space-x-1">
        {/* Previous button */}
        <Button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          variant="ghost"
          className="h-9 px-3 text-sm font-medium text-neutral-600 hover:text-red-500 hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <ChevronLeft className="h-4 w-4 mr-1" />
          Zurück
        </Button>

        {/* Page numbers */}
        <div className="flex items-center space-x-1 mx-2">
          {visiblePages.map((page, index) => (
            page === 'ellipsis' ? (
              <span key={`ellipsis-${index}`} className="px-2 py-1 text-neutral-400 text-sm">
                ...
              </span>
            ) : (
              <Button
                key={page}
                onClick={() => onPageChange(page)}
                variant={currentPage === page ? "default" : "ghost"}
                className={cn(
                  "h-9 w-9 p-0 text-sm font-medium",
                  currentPage === page
                    ? "bg-red-500 text-white hover:bg-red-600"
                    : "text-neutral-600 hover:text-red-500 hover:bg-red-50"
                )}
              >
                {page}
              </Button>
            )
          ))}
        </div>

        {/* Next button */}
        <Button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          variant="ghost"
          className="h-9 px-3 text-sm font-medium text-neutral-600 hover:text-red-500 hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Weiter
          <ChevronRight className="h-4 w-4 ml-1" />
        </Button>
      </div>
    </nav>
  );
}
